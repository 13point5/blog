"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Gfx } from "@/lib/pixel/engine";
import { OWL_ROWS, TOYS, TOY_PALETTE, owlPalette } from "@/lib/pixel/scenes/shelf";
import { midi, playPrelude, playSpring, tone } from "@/lib/audio";
import { useTheme } from "../providers/theme-provider";
import { cn } from "@/lib/utils";

const FPS = 12;
const isDark = () => document.documentElement.classList.contains("dark");
const still = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "off";

/** True when the menu's "Toys everywhere" mode is on. */
export function useToys() {
  return useTheme().homeArt === "scatter";
}

/* ------------------------------------------------------------------ */
/* Sprite: one pixel object on its own transparent canvas              */
/* ------------------------------------------------------------------ */

type SpriteProps = {
  id: string;
  /** CSS pixels per art pixel */
  scale?: number;
  /** canvas height in art pixels; the object stands 2px above the bottom */
  rows?: number;
  /** for toys that can be switched on */
  active?: boolean;
  /** bump to make it hop and to skip its animation ahead */
  kick?: number;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  onTap?: () => void;
};

export function Sprite({ id, scale = 3, rows = 30, active, kick = 0, className, style, label, onTap }: SpriteProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const item = TOYS[id];
  const live = useRef({ active, kick, hop: 0, skip: 0 });
  const w = item.w + 6;
  const tappable = Boolean(onTap);

  useEffect(() => {
    if (live.current.kick !== kick) {
      live.current.hop = 8;
      live.current.skip += 22;
    }
    live.current.active = active;
    live.current.kick = kick;
  }, [active, kick]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const g = new Gfx(ctx, w, rows);
    let f = 0, raf = 0, last = 0, visible = true;
    const period = 90 + ((item.w * 37) % 60);
    const paint = () => {
      const s = live.current;
      const lift = s.hop > 0 ? Math.round(Math.sin((s.hop / 8) * Math.PI) * 4) : 0;
      if (s.hop > 0) s.hop--;
      ctx.clearRect(0, 0, w, rows);
      item.draw(g, 3, rows - 2 - lift, f + s.skip, isDark() ? TOY_PALETTE.dark : TOY_PALETTE.light, s.active);
    };
    paint();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || now - last < 1000 / FPS) return;
      last = now;
      if (!still() || live.current.hop > 0) f++;
      // tappable toys give a little hop now and then, so they read as tappable
      if (tappable && !still() && f % period === period - 1) live.current.hop = 8;
      paint();
    };
    raf = requestAnimationFrame(tick);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "60px" });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [item, w, rows, tappable]);

  const canvas = (
    <canvas
      ref={ref}
      width={w}
      height={rows}
      aria-hidden="true"
      className="pixelated block"
      style={{ width: w * scale, height: rows * scale }}
    />
  );
  if (!onTap) return <span className={cn("block", className)} style={style}>{canvas}</span>;
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={label}
      className={cn("block cursor-pointer touch-manipulation outline-none focus-visible:ring-2 ring-koi", className)}
      style={style}
    >
      {canvas}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Toys that sit among the text                                        */
/* ------------------------------------------------------------------ */

/** A record player. Tap it and it plays a Bach prelude until you tap again. */
export function RecordPlayer({ className }: { className?: string }) {
  const [playing, setPlaying] = useState(false);
  const stop = useRef<(() => void) | null>(null);
  const on = useToys();

  useEffect(() => () => stop.current?.(), []);
  if (!on) return null;

  const toggle = () => {
    stop.current?.();
    stop.current = playing ? null : playPrelude();
    setPlaying(!playing);
  };
  return (
    <Sprite
      id="record"
      rows={38}
      active={playing}
      onTap={toggle}
      label={playing ? "Stop the record" : "Play the record (Bach, Prelude in C)"}
      className={className}
    />
  );
}

/** A violin. Tap it for the opening of Vivaldi's "Spring". */
export function Violin({ className }: { className?: string }) {
  const [kick, setKick] = useState(0);
  if (!useToys()) return null;
  return (
    <Sprite
      id="violin"
      rows={38}
      kick={kick}
      onTap={() => { setKick((k) => k + 1); playSpring(); }}
      label="Play the violin (Vivaldi, Spring)"
      className={className}
    />
  );
}

/** Any other object: it hops when tapped, and the cube scrambles. */
export function Toy({ id, scale, rows, className }: { id: string; scale?: number; rows?: number; className?: string }) {
  const [kick, setKick] = useState(0);
  if (!useToys()) return null;
  return (
    <Sprite id={id} scale={scale} rows={rows} kick={kick} onTap={() => setKick((k) => k + 1)} label={`Poke the ${id}`} className={className} />
  );
}

/** A rule with three swords resting on it. Tap them for three cuts across the page. */
export function SwordDivider() {
  const [cuts, setCuts] = useState(0);
  const [kick, setKick] = useState(0);
  if (!useToys()) return null;

  const slash = () => {
    setKick((k) => k + 1);
    setCuts((c) => c + 1);
    [392, 523, 784].forEach((hz, i) => setTimeout(() => tone(hz * 2, 0.18, 0.03), i * 70));
  };
  return (
    <div className="relative animate-fade-blur animation-delay-100">
      <div className="section-divider" />
      <Sprite id="swords" rows={24} kick={kick} onTap={slash} label="Draw the three swords" className="absolute right-24 -bottom-[6px]" />
      {cuts > 0 &&
        createPortal(
          <div key={cuts} className="fixed inset-0 z-[70] pointer-events-none overflow-hidden" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className="slash" style={{ top: `${30 + i * 18}%`, animationDelay: `${i * 70}ms`, rotate: `${-24 + i * 20}deg` }} />
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/** Lumos / Nox: a wand that switches between the light and dark themes. */
export function Wand() {
  const { theme, setTheme } = useTheme();
  const [sparks, setSparks] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  if (!useToys()) return null;

  const cast = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    tone(midi(theme === "dark" ? 88 : 76), 0.5, 0.03);
    setSparks(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSparks(false), 900);
  };
  return (
    <span className="relative">
      <Sprite id="wand" scale={2} rows={14} active={sparks} onTap={cast} label={theme === "dark" ? "Lumos: switch to the light theme" : "Nox: switch to the dark theme"} />
      {sparks && (
        <span className="absolute left-1/2 top-full -translate-x-1/2 text-xs italic font-display text-foreground-muted whitespace-nowrap animate-fade-blur">
          {theme === "dark" ? "nox" : "lumos"}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* A playable strip of piano keys                                      */
/* ------------------------------------------------------------------ */

const WHITE = [0, 2, 4, 5, 7, 9, 11];
const HAS_SHARP = [true, true, false, true, true, true, false];

export function PianoKeys() {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(14);
  const [down, setDown] = useState<number | null>(null);
  const held = useRef(false);
  const on = useToys();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCount(Math.max(7, Math.floor(e.contentRect.width / 26))));
    ro.observe(el);
    const up = () => (held.current = false);
    window.addEventListener("pointerup", up);
    return () => {
      ro.disconnect();
      window.removeEventListener("pointerup", up);
    };
  }, [on]);
  if (!on) return null;

  const play = (note: number) => {
    tone(midi(note), 1.2, 0.08);
    setDown(note);
    setTimeout(() => setDown((d) => (d === note ? null : d)), 180);
  };
  const handlers = (note: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      (e.target as Element).releasePointerCapture?.(e.pointerId);
      held.current = true;
      play(note);
    },
    onPointerEnter: () => held.current && play(note),
  });

  const wood = "bg-[#8a5230]", dark = "bg-[#5a341d]", hi = "bg-[#a9683c]";
  return (
    <div className="select-none" aria-hidden="true" title="Play me">
      {/* lid and panelled upper case */}
      <div className={cn("h-1.5 -mx-1", dark)} />
      <div className={cn("h-14 flex gap-2 p-2 border-x-4 border-[#5a341d]", wood)}>
        <div className={cn("flex-1 border-2 border-[#5a341d]", hi)} />
        <div className="flex-[1.4] border-2 border-[#5a341d] bg-[#f6f3ec] flex flex-col justify-center gap-1.5 px-3">
          <span className="h-px bg-[#8c877b]" /><span className="h-px bg-[#8c877b] w-4/5" /><span className="h-px bg-[#8c877b]" /><span className="h-px bg-[#8c877b] w-3/5" />
        </div>
        <div className={cn("flex-1 border-2 border-[#5a341d]", hi)} />
      </div>
      <div className={cn("h-1.5", dark)} />
      {/* the keyboard, between two cheek blocks */}
      <div className={cn("flex -mx-1 px-2", dark)}>
        <div ref={ref} className="relative flex flex-1 h-12 touch-none border-x border-[#1d1d1b] bg-[#1d1d1b] gap-px">
          {Array.from({ length: count }, (_, i) => {
            const note = 60 + Math.floor(i / 7) * 12 + WHITE[i % 7];
            return (
              <span key={i} className="relative flex-1">
                <span {...handlers(note)} className={cn("absolute inset-0 cursor-pointer", down === note ? "bg-koi" : "bg-[#f6f3ec]")} />
                {HAS_SHARP[i % 7] && i < count - 1 && (
                  <span
                    {...handlers(note + 1)}
                    className={cn("absolute z-10 top-0 left-[68%] w-[64%] h-[60%] cursor-pointer", down === note + 1 ? "bg-koi" : "bg-[#1d1d1b]")}
                  />
                )}
              </span>
            );
          })}
        </div>
      </div>
      <div className={cn("h-1.5 -mx-1", dark)} />
      {/* lower panel, legs and pedals */}
      <div className="flex h-9 border-x-4 border-[#5a341d]">
        <div className={cn("w-3", dark)} />
        <div className={cn("flex-1 flex items-end justify-center gap-2 pb-0.5", wood)}>
          <span className="w-2 h-1 bg-[#c9973a]" /><span className="w-2 h-1 bg-[#c9973a]" /><span className="w-2 h-1 bg-[#c9973a]" />
        </div>
        <div className={cn("w-3", dark)} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Site-wide: an owl that follows you around, and a yoyo               */
/* ------------------------------------------------------------------ */

const OWL_W = 19, OWL_H = 16, OWL_SCALE = 3;

function Owl() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hoot, setHoot] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const g = new Gfx(ctx, OWL_W, OWL_H);

    const perches = () => [...document.querySelectorAll<HTMLElement>("[data-perch], .post-body h1")];
    const spot = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return { x: r.right + window.scrollX - 26, y: r.top + window.scrollY + Number(el.dataset.perch ?? 8) };
    };

    let cur: HTMLElement | null = null;
    let pos = { x: 0, y: 0 };
    let from = pos, t = 1, dur = 1, dir = 1, f = 0, raf = 0, last = 0, lastPaint = 0;

    const flyTo = (el: HTMLElement) => {
      if (el === cur) return;
      const to = spot(el);
      from = { ...pos };
      cur = el;
      if (still()) { t = 1; return; }
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      dir = to.x < from.x ? -1 : 1;
      dur = Math.min(1500, 450 + dist * 0.9);
      t = 0;
    };

    const land = () => {
      const all = perches();
      if (!all.length) { cur = null; canvas.style.opacity = "0"; return; }
      canvas.style.opacity = "1";
      cur = all[0];
      pos = spot(cur);
      // arrive from off the top of the page
      from = { x: pos.x + 120, y: Math.max(0, window.scrollY - 60) };
      t = still() ? 1 : 0;
      dur = 900;
      dir = -1;
    };
    const arrive = setTimeout(land, 350);

    const paint = (flying: boolean) => {
      const P = isDark() ? TOY_PALETTE.dark : TOY_PALETTE.light;
      ctx.clearRect(0, 0, OWL_W, OWL_H);
      const blink = !flying && f % 64 < 3;
      if (flying) {
        // wings first, so the body sits in front of them
        const up = Math.floor(f / 2) % 2 === 0;
        const wy = up ? 4 : 10;
        g.rect(0, wy - 1, 6, 4, P.ink); g.rect(13, wy - 1, 6, 4, P.ink);
        g.rect(1, wy, 4, 2, P.snow); g.rect(14, wy, 4, 2, P.snow);
        g.px(2, wy + 1, P.mid); g.px(16, wy + 1, P.mid);
      }
      g.sprite(OWL_ROWS, 4, OWL_H - 13, owlPalette(P), dir < 0);
      if (blink) { g.px(7, OWL_H - 10, P.ink); g.px(11, OWL_H - 10, P.ink); }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(50, now - last);
      last = now;
      if (!cur) return;
      if (!cur.isConnected) { land(); return; }
      const to = spot(cur);
      if (t < 1) {
        t = Math.min(1, t + dt / dur);
        const e = t * t * (3 - 2 * t);
        const lift = Math.sin(Math.PI * t) * Math.min(90, Math.hypot(to.x - from.x, to.y - from.y) * 0.3 + 20);
        pos = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - lift };
      } else pos = to;
      canvas.style.transform = `translate(${Math.round(pos.x - (OWL_W * OWL_SCALE) / 2)}px, ${Math.round(pos.y - OWL_H * OWL_SCALE)}px)`;
      if (now - lastPaint > 1000 / FPS) { lastPaint = now; f++; paint(t < 1); }
    };
    raf = requestAnimationFrame(tick);

    const nearest = (x: number, y: number) => {
      let best: HTMLElement | null = null, bd = Infinity;
      for (const el of perches()) {
        const s = spot(el), d = Math.hypot(s.x - x, (s.y - y) * 1.6);
        if (d < bd) { bd = d; best = el; }
      }
      return best;
    };
    const onDown = (e: PointerEvent) => {
      if (e.target === canvas) return;
      const el = nearest(e.clientX + window.scrollX, e.clientY + window.scrollY);
      if (el) flyTo(el);
    };
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || t < 1) return;
      const el = (e.target as Element).closest?.<HTMLElement>("[data-perch], .post-body h1");
      if (el) flyTo(el);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("pointerover", onOver);
    return () => {
      clearTimeout(arrive);
      cancelAnimationFrame(raf);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerover", onOver);
    };
  }, [pathname]);

  return (
    <>
      <canvas
        ref={ref}
        width={OWL_W}
        height={OWL_H}
        onClick={() => { setHoot((h) => h + 1); tone(midi(64), 0.25, 0.04); setTimeout(() => tone(midi(60), 0.4, 0.04), 160); }}
        className="pixelated absolute top-0 left-0 pointer-events-auto cursor-pointer opacity-0 transition-opacity"
        style={{ width: OWL_W * OWL_SCALE, height: OWL_H * OWL_SCALE }}
        role="img"
        aria-label="An owl. It flies to wherever you tap."
      />
      {hoot > 0 && <span key={hoot} className="hoot" aria-hidden="true">hoo</span>}
    </>
  );
}

function Yoyo() {
  const root = useRef<HTMLDivElement>(null);
  const str = useRef<HTMLDivElement>(null);
  const disc = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = root.current, s = str.current, canvas = disc.current;
    const ctx = canvas?.getContext("2d");
    if (!el || !s || !canvas || !ctx) return;
    const g = new Gfx(ctx, 9, 9);
    let len = 0, v = 0, ang = 0, av = 0, spin = 0, lastY = window.scrollY, raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      const target = 26 + p * Math.min(window.innerHeight * 0.55, 380);
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      if (still()) { len = target; ang = 0; }
      else {
        // the string is a spring, and the yoyo a pendulum that scrolling nudges
        v += (target - len) * 0.035 - v * 0.14;
        len += v;
        av += -ang * 0.03 - av * 0.05 + Math.max(-0.02, Math.min(0.02, dy * 0.0008));
        ang += av;
        spin += 0.25 + Math.abs(v) * 0.12;
      }
      s.style.height = `${Math.max(4, len)}px`;
      el.style.transform = `rotate(${ang}rad)`;
      const P = isDark() ? TOY_PALETTE.dark : TOY_PALETTE.light;
      ctx.clearRect(0, 0, 9, 9);
      g.disc(4, 4, 4, P.ink);
      g.disc(4, 4, 3, P.accent);
      g.px(4, 4, P.ink);
      g.px(4 + Math.round(Math.cos(spin) * 2), 4 + Math.round(Math.sin(spin) * 2), P.paper);
    };
    raf = requestAnimationFrame(tick);
    const yank = () => { v -= 16; av += 0.03; };
    canvas.addEventListener("pointerdown", yank);
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", yank);
    };
  }, []);

  return (
    <div ref={root} className="fixed top-0 right-0.5 sm:right-6 z-[60] flex flex-col items-center pointer-events-none origin-top" aria-hidden="true">
      <div ref={str} className="w-px bg-foreground-muted" />
      <canvas ref={disc} width={9} height={9} className="pixelated pointer-events-auto cursor-grab -mt-px size-[21px] sm:size-[27px]" />
    </div>
  );
}

/** Mounted once in the layout. */
export function SiteToys() {
  if (!useToys()) return null;
  return (
    <>
      <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
        <Owl />
      </div>
      <Yoyo />
    </>
  );
}
