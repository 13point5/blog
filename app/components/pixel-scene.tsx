"use client";

import { useEffect, useRef, useState } from "react";
import { Gfx, hash, mulberry32 } from "@/lib/pixel/engine";
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
  /** Crumble the edges into the page: "band" = top and bottom, "all" = every side. */
  dissolve?: "band" | "all";
};

const FADE = 13; // rows of art that crumble away at a dissolving edge

/** Opaque wherever the art should be erased. Dithered, so the edge stays pixelly. */
function dissolveMask(w: number, h: number, sides: boolean) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const c = cv.getContext("2d");
  if (!c) return cv;
  c.fillStyle = "#000";
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let d = Math.min(y, h - 1 - y);
      if (sides) d = Math.min(d, x, w - 1 - x);
      if (d >= FADE) continue;
      const keep = ((d + 0.5) / FADE) ** 1.5;
      if (hash(x, y, 91) > keep) c.fillRect(x, y, 1, 1);
    }
  }
  return cv;
}

/**
 * Renders a procedural pixel-art scene. The canvas is tiny and scaled up by
 * CSS; the loop pauses offscreen and holds a still frame when motion is off.
 */
export function PixelScene({ scene, className, interactive, wide, maxPx = 640, dissolve }: Props) {
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
    const ctx = canvas?.getContext("2d");
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
    const mask = dissolve ? dissolveMask(cols, rows, dissolve === "all") : null;

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
        ctx.save();
        ctx.translate(0, -top);
        def.draw(g, f, state, env);
        ctx.restore();
      }
      if (mask) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.drawImage(mask, 0, 0);
        ctx.globalCompositeOperation = "source-over";
      }
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
  }, [def, interactive, wide, box, cols, rows, top, dissolve]);

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
