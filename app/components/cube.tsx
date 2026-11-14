"use client";

import { useEffect, useRef } from "react";
import { Gfx } from "@/lib/pixel/engine";
import { drawCube } from "@/lib/pixel/cube";
import { CUBE_PX, applyMove, dragMove, hitCube, isSolved, scramble, solve, solvedCube, type Move } from "@/lib/pixel/cube-model";
import { click, fanfare } from "@/lib/audio";
import { useToys } from "./toys";
import { cn } from "@/lib/utils";

const SCALE = 2;
const SCRAMBLE = 26; // turns in a scramble
const QUARTER = 380; // milliseconds a quarter turn takes while it solves itself
const HALF = 560; // a half turn, done in one sweep
const MIXING = 95; // and a turn while it scrambles itself
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * A puzzle cube that never stops being a puzzle. It starts from a different
 * scramble on every load and solves itself the way a person would: a cross
 * on the bottom, the first two layers pair by pair, then the top layer turned
 * the right way up and put in place, with a breath between the stages. Once
 * it is done it sits solved for a moment, scrambles itself, and starts on the
 * new one.
 *
 * It can be turned by hand as well: drag across any of its three faces and
 * the layer under your finger follows; a tap gives that layer a quarter turn.
 * Leave it alone and it carries on solving from wherever you left it.
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
    /** one thing to do: turn a layer (a quarter, or a half in one sweep), or simply wait */
    type Step = { m?: Move; turns: number; ms: number; mine: boolean };
    const queue: Step[] = [];
    let cur: (Step & { spent: number }) | null = null;
    let raf = 0, last = 0, visible = false, glow = 0, rest: ReturnType<typeof setTimeout> | undefined;

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
    const wait = (ms: number) => queue.push({ turns: 0, ms, mine: false });
    /** queue some turns, a pair of the same turn becoming one half turn */
    const turn = (moves: Move[], quarter: number, half: number) => {
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i], n = moves[i + 1], twice = !!n && n.axis === m.axis && n.layer === m.layer && n.dir === m.dir;
        queue.push({ m, turns: twice ? 2 : 1, ms: twice ? half : quarter, mine: false });
        if (twice) i++;
      }
    };
    /** Nothing left to do: if it is in a muddle, solve it; if it is solved, admire it, then make a new muddle. */
    const plan = () => {
      if (isSolved(cube)) {
        wait(2400);
        turn(scramble(SCRAMBLE), MIXING, MIXING * 1.5);
        wait(900);
        return;
      }
      const { moves, stages } = solve(cube);
      wait(500);
      stages.forEach((end, i) => {
        turn(moves.slice(i ? stages[i - 1] : 0, end), QUARTER, HALF);
        if (i < stages.length - 1) wait(450); // a breath between the cross, the pairs, and the two halves of the top layer
      });
    };

    const step = (now: number) => {
      raf = 0;
      const dt = last ? Math.min(100, now - last) : 0;
      last = now;
      if (!visible) { last = 0; return; }
      if (!cur) {
        if (!queue.length && !rest) plan();
        const next = queue.shift();
        if (next) cur = { ...next, spent: 0 };
      }
      if (cur) {
        cur.spent += dt;
        const t = Math.min(1, cur.spent / cur.ms);
        if (t < 1) { if (cur.m) paint({ m: cur.m, t: t * t * (3 - 2 * t) * cur.turns }); }
        else {
          const done = cur;
          cur = null;
          if (done.m) {
            for (let i = 0; i < done.turns; i++) applyMove(cube, done.m);
            canvas.dataset.cube = isSolved(cube) ? "solved" : "mixed"; // for the tests, and the curious
            if (!queue.length && isSolved(cube)) {
              glow = 26;
              if (done.mine) fanfare(); // you solved it yourself
            }
            paint(null);
          }
        }
      }
      if (glow > 0 && !cur?.m) {
        glow--;
        paint(null);
      }
      raf = requestAnimationFrame(step);
    };
    const run = () => { if (!raf) raf = requestAnimationFrame(step); };

    // a different scramble on every load (with motion off it simply sits solved)
    if (still()) { paint(null); return; }
    for (const m of scramble(SCRAMBLE)) applyMove(cube, m);
    paint(null);

    // it only works on the puzzle while it is on screen
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) run(); }, { threshold: 0.4 });
    io.observe(canvas);

    // --- fingers
    let grab: { hit: NonNullable<ReturnType<typeof hitCube>>; x: number; y: number; id: number } | null = null;
    const toArt = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return [((e.clientX - r.left) / r.width) * CUBE_PX, ((e.clientY - r.top) / r.height) * CUBE_PX] as const;
    };
    /** Taking over: whatever it was about to do is dropped, and it waits for you to finish. */
    const hold = () => {
      queue.length = 0;
      clearTimeout(rest);
      rest = setTimeout(() => { rest = undefined; }, 3200); // left alone, it carries on from here
    };
    const make = (m: Move) => {
      hold();
      queue.push({ m, turns: 1, ms: 190, mine: true });
      click();
      run();
    };
    const down = (e: PointerEvent) => {
      const hit = hitCube(...toArt(e));
      if (!hit) return;
      e.preventDefault();
      hold();
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
      aria-label="A puzzle cube that scrambles and solves itself, over and over. Drag across a face to turn a layer."
      className={cn("pixelated block cursor-grab touch-none select-none", className)}
      style={{ width: CUBE_PX * SCALE, height: CUBE_PX * SCALE }}
    />
  );
}
