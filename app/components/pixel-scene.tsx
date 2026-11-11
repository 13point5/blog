"use client";

import { useEffect, useRef, useState } from "react";
import { Gfx, mulberry32 } from "@/lib/pixel/engine";
import { SCENES, DEFAULT_COVER } from "@/lib/pixel";
import { cn } from "@/lib/utils";

type Props = {
  scene: string;
  className?: string;
  /** Forward clicks to the scene (e.g. feeding the koi). */
  interactive?: boolean;
  /**
   * Fill the container's width instead of scaling the scene to fit it. The
   * scene itself stays `maxPx` wide at most; the rest is more scenery.
   */
  wide?: boolean;
  /** Widest the core scene may be drawn, in CSS pixels, when `wide`. */
  maxPx?: number;
  /** Draw in a few dithered tones of the text colour instead of full colour. */
  ink?: boolean;
};

// 4x4 Bayer matrix: an ordered dither, the classic way pixel art blends two
// tones. Used by the ink style below.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

// "Ink" style: the scene is reduced to a few tones of the text colour, dithered,
// with the lightest tone left as bare page. One warm accent survives.
const INK_LIGHT = [[38, 37, 34], [104, 100, 92], [163, 157, 143], [208, 202, 189]];
const INK_DARK = [[236, 235, 230], [190, 186, 174], [134, 130, 120], [78, 76, 70]];
const ACCENT_LIGHT = [217, 83, 43];
const ACCENT_DARK = [255, 122, 77];

function inkFilter(ctx: CanvasRenderingContext2D, w: number, h: number, night: boolean) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const tones = night ? INK_DARK : INK_LIGHT;
  const accent = night ? ACCENT_DARK : ACCENT_LIGHT;
  const n = tones.length; // tone n = bare page
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (!d[i + 3]) continue;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      // keep reds and oranges (the koi, lava, a red pen) as the single accent
      if (r > 190 && r - b > 110 && g < r * 0.6) {
        d[i] = accent[0]; d[i + 1] = accent[1]; d[i + 2] = accent[2];
        continue;
      }
      let lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      if (night) lum = 1 - lum; // on a dark page the darkest areas become bare page
      lum = Math.min(1, Math.max(0, (lum - 0.08) / 0.8));
      // mostly flat tones; dither only in a narrow band where two tones meet
      const t = Math.min(n, Math.floor(lum * n + 0.3 + bayer(x, y) * 0.4));
      if (t >= n) d[i + 3] = 0;
      else { d[i] = tones[t][0]; d[i + 1] = tones[t][1]; d[i + 2] = tones[t][2]; }
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * Renders a procedural pixel-art scene. The canvas is tiny and scaled up by
 * CSS; the loop pauses offscreen and holds a still frame when motion is off.
 */
export function PixelScene({ scene, className, interactive, wide, maxPx = 640, ink }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const def = SCENES[scene] ?? SCENES[DEFAULT_COVER];
  const [box, setBox] = useState(0); // container width in CSS px (wide mode only)

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!wide || !el) return;
    const ro = new ResizeObserver(([e]) => setBox(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [wide]);

  // Geometry, in art pixels. `scale` is CSS px per art px.
  const [top, bottom] = wide && def.fluid && def.band ? def.band : [0, def.h];
  const rows = bottom - top;
  const scale = wide && box ? Math.min(box, maxPx) / def.w : 0;
  const cols = wide && box ? Math.max(def.w, Math.ceil(box / scale)) : def.w;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
    if (!canvas || !ctx || (wide && !box)) return;
    ctx.imageSmoothingEnabled = false;

    // Fluid scenes draw straight onto the wide canvas. The rest draw at their
    // native size offscreen, then get centred with their backdrop stretched out.
    const inner = def.fluid ? null : document.createElement("canvas");
    if (inner) {
      inner.width = def.w;
      inner.height = def.h;
    }
    const target = inner ? inner.getContext("2d") : ctx;
    if (!target) return;
    const g = new Gfx(target, inner ? def.w : cols, def.h);
    const ox = inner ? Math.floor((cols - def.w) / 2) : 0;
    const state = def.init(mulberry32(1337), g.w);

    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const still = () => reduced.matches || root.dataset.motion === "off";

    const paint = (f: number) => {
      const env = { night: root.classList.contains("dark") };
      if (inner) {
        def.draw(g, f, state, env);
        ctx.clearRect(0, 0, cols, rows);
        ctx.drawImage(inner, ox, 0);
        if (ox > 0) {
          const src = g.backdrop ?? inner;
          ctx.drawImage(src, 1, 0, 1, def.h, 0, 0, ox, def.h);
          ctx.drawImage(src, def.w - 2, 0, 1, def.h, ox + def.w, 0, cols - ox - def.w, def.h);
        }
      } else {
        ctx.clearRect(0, 0, cols, rows); // some scenes have no background at all
        ctx.save();
        ctx.translate(0, -top);
        def.draw(g, f, state, env);
        ctx.restore();
      }
      if (ink) inkFilter(ctx, cols, rows, env.night);
    };

    const interval = 1000 / (def.fps ?? 12);
    let frame = 0;
    let last = 0;
    let raf = 0;
    let visible = true;
    let wasStill = false;

    // Warm up so the first visible frame already has rain mid-air, fish
    // mid-swim, etc. — and so the still poster is a good one.
    const poster = def.poster ?? 0;
    for (; frame < poster; frame++) def.draw(g, frame, state, { night: false });
    paint(frame);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || now - last < interval) return;
      last = now;
      if (still()) {
        if (!wasStill) paint(frame);
        wasStill = true;
        return;
      }
      wasStill = false;
      paint(++frame);
    };
    raf = requestAnimationFrame(tick);

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "80px" });
    io.observe(canvas);

    // repaint the still frame when the theme or motion setting flips
    const mo = new MutationObserver(() => {
      wasStill = false;
      if (still()) paint(frame);
    });
    mo.observe(root, { attributes: true, attributeFilter: ["class", "data-motion"] });

    const onPointer = (e: PointerEvent) => {
      if (!def.pointer) return;
      const r = canvas.getBoundingClientRect();
      const hit = def.pointer(
        state,
        ((e.clientX - r.left) / r.width) * cols - ox,
        ((e.clientY - r.top) / r.height) * rows + top
      );
      if (hit && still()) paint(frame);
    };
    if (interactive) canvas.addEventListener("pointerdown", onPointer);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
    };
  }, [def, interactive, wide, box, cols, rows, top, ink]);

  return (
    <canvas
      ref={ref}
      width={cols}
      height={rows}
      role="img"
      aria-label={def.alt}
      className={cn("pixelated block w-full select-none", interactive && "cursor-pointer touch-manipulation", className)}
      style={
        wide
          ? { height: box ? rows * scale : (rows / def.w) * Math.min(maxPx, 400) }
          : { aspectRatio: `${cols} / ${rows}`, height: "auto" }
      }
    />
  );
}
