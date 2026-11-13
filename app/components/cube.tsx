"use client";

import { useEffect, useRef } from "react";
import { Gfx } from "@/lib/pixel/engine";
import { drawCube } from "@/lib/pixel/cube";
import { CUBE_PX, applyMove, dragMove, hitCube, inverse, isSolved, randomMove, solvedCube, type Move } from "@/lib/pixel/cube-model";
import { click, fanfare } from "@/lib/audio";
import { useToys } from "./toys";
import { cn } from "@/lib/utils";

const SCALE = 2;
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A puzzle cube you can actually turn. Drag across any of its three faces and
 * the layer under your finger follows; a tap gives that layer a quarter turn.
 * Each time the page loads it starts from a different scramble and, once it
 * is on screen, solves itself. Leave it alone after playing with it and it
 * quietly undoes what you did.
 */
export function Cube({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const on = useToys();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!on || !canvas || !ctx) return;
    const g = new Gfx(ctx, CUBE_PX, CUBE_PX);
    const cube = solvedCube();
    /** every turn made so far and not yet undone, oldest first */
    const history: Move[] = [];
    type Step = { m: Move; ms: number; mine: boolean };
    const queue: Step[] = [];
    let cur: (Step & { start: number }) | null = null;
    let raf = 0, rest: ReturnType<typeof setTimeout> | undefined, glow = 0, started = false;

    const paint = (anim: { m: Move; t: number } | null) => {
      drawCube(ctx, cube, anim);
      if (glow > 0) {
        // a few sparks when it comes out solved
        for (let i = 0; i < 7; i++) {
          const a = i * 0.9 + glow * 0.05, r = 22 + (1 - glow / 26) * 10;
          g.px(30 + Math.cos(a) * r, 30 + Math.sin(a) * r * 0.85, i % 2 ? "#f2c14e" : "#58c7d9", glow / 26);
        }
      }
    };

    const step = (now: number) => {
      raf = 0;
      if (!cur) {
        const next = queue.shift();
        if (next) cur = { ...next, start: now };
      }
      if (cur) {
        const t = Math.min(1, (now - cur.start) / cur.ms);
        if (t < 1) paint({ m: cur.m, t: t * t * (3 - 2 * t) });
        else {
          applyMove(cube, cur.m);
          if (cur.mine) history.push(cur.m);
          const wasMine = cur.mine;
          cur = null;
          if (!queue.length && isSolved(cube)) {
            glow = 26;
            if (wasMine) fanfare(); // you solved it yourself
          }
          paint(null);
        }
      } else if (glow > 0) {
        glow--;
        paint(null);
      }
      if (cur || queue.length || glow > 0) raf = requestAnimationFrame(step);
    };
    const run = () => { if (!raf) raf = requestAnimationFrame(step); };

    /** Undo everything, newest first: brisk if there is a lot to undo. */
    const solve = () => {
      const ms = history.length > 16 ? 110 : history.length > 9 ? 170 : 240;
      while (history.length) queue.push({ m: inverse(history.pop()!), ms, mine: false });
      run();
    };
    /** Stop solving: whatever was still to be undone goes back on the record. */
    const takeOver = () => {
      clearTimeout(rest);
      while (queue.length) {
        const s = queue.pop()!;
        if (!s.mine) history.push(inverse(s.m));
      }
    };

    // a different scramble on every load (with motion off it simply sits solved)
    if (!still()) {
      for (let i = 0; i < 9; i++) {
        const m = randomMove(history.at(-1));
        applyMove(cube, m);
        history.push(m);
      }
    }
    paint(null);

    // it starts solving itself the first time it comes properly into view
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started) return;
      started = true;
      rest = setTimeout(solve, 700);
    }, { threshold: 0.7 });
    io.observe(canvas);

    // --- fingers
    let grab: { hit: NonNullable<ReturnType<typeof hitCube>>; x: number; y: number; id: number } | null = null;
    const toArt = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * CUBE_PX, ((e.clientY - r.top) / r.height) * CUBE_PX] as const;
    };
    const make = (m: Move) => {
      queue.push({ m, ms: 190, mine: true });
      click();
      run();
      clearTimeout(rest);
      rest = setTimeout(solve, 3500); // left alone, it puts itself right again
    };
    const down = (e: PointerEvent) => {
      const hit = hitCube(...toArt(e));
      if (!hit) return;
      e.preventDefault();
      started = true;
      takeOver();
      canvas.setPointerCapture(e.pointerId);
      grab = { hit, x: e.clientX, y: e.clientY, id: e.pointerId };
    };
    const move = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id) return;
      const dx = e.clientX - grab.x, dy = e.clientY - grab.y;
      if (Math.hypot(dx, dy) < 12) return;
      make(dragMove(grab.hit, dx, dy));
      // keep dragging to keep turning: the next turn is measured from here
      const hit = hitCube(...toArt(e));
      grab = hit ? { hit, x: e.clientX, y: e.clientY, id: e.pointerId } : null;
    };
    const up = (e: PointerEvent) => {
      if (!grab || e.pointerId !== grab.id) return;
      // a tap with no drag: give that layer a quarter turn
      if (Math.hypot(e.clientX - grab.x, e.clientY - grab.y) < 12) make(dragMove(grab.hit, 0, 0));
      grab = null;
    };
    const cancel = () => { grab = null; };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", cancel);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(rest);
      io.disconnect();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
    };
  }, [on]);

  if (!on) return null;
  return (
    <canvas
      ref={ref}
      width={CUBE_PX}
      height={CUBE_PX}
      role="img"
      aria-label="A puzzle cube that solves itself. Drag across a face to turn a layer."
      className={cn("pixelated block cursor-grab touch-none select-none", className)}
      style={{ width: CUBE_PX * SCALE, height: CUBE_PX * SCALE }}
    />
  );
}
