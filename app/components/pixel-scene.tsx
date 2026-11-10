"use client";

import { useEffect, useRef } from "react";
import { Gfx, mulberry32 } from "@/lib/pixel/engine";
import { SCENES, DEFAULT_COVER } from "@/lib/pixel";
import { cn } from "@/lib/utils";

type Props = {
  scene: string;
  className?: string;
  /** Forward clicks to the scene (e.g. feeding the koi). */
  interactive?: boolean;
};

/**
 * Renders a procedural pixel-art scene. The canvas is tiny and scaled up by
 * CSS; the loop pauses offscreen and holds a still frame when motion is off.
 */
export function PixelScene({ scene, className, interactive }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const def = SCENES[scene] ?? SCENES[DEFAULT_COVER];

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const g = new Gfx(ctx, def.w, def.h);
    const state = def.init(mulberry32(1337));
    const root = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const still = () => reduced.matches || root.dataset.motion === "off";
    const paint = (f: number) => def.draw(g, f, state, { night: root.classList.contains("dark") });

    const interval = 1000 / (def.fps ?? 12);
    let frame = 0;
    let last = 0;
    let raf = 0;
    let visible = true;
    let wasStill = false;

    // Warm up so the first visible frame already has rain mid-air, fish
    // mid-swim, etc. — and so the still poster is a good one.
    const poster = def.poster ?? 0;
    for (; frame < poster; frame++) paint(frame);
    paint(frame);

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || now - last < interval) return;
      last = now;
      if (still()) {
        // keep reacting to theme changes, but don't advance time
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
      const hit = def.pointer(state, ((e.clientX - r.left) / r.width) * def.w, ((e.clientY - r.top) / r.height) * def.h);
      if (hit && still()) paint(frame);
    };
    if (interactive) canvas.addEventListener("pointerdown", onPointer);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      mo.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
    };
  }, [def, interactive]);

  return (
    <canvas
      ref={ref}
      width={def.w}
      height={def.h}
      role="img"
      aria-label={def.alt}
      className={cn("pixelated block w-full h-auto select-none", interactive && "cursor-pointer touch-manipulation", className)}
      style={{ aspectRatio: `${def.w} / ${def.h}` }}
    />
  );
}
