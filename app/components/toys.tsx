"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Gfx, hash } from "@/lib/pixel/engine";
import { TOYS, TOY_PALETTE, owlBlink } from "@/lib/pixel/scenes/shelf";
import { OWL_FLAP, OWL_FRAME, OWL_FRAMES, OWL_PAL } from "@/lib/pixel/owl-sheet";
import { choosePerch, isVisible, type Layout, type Line, type Rect } from "@/lib/owl-perch";
import { chime, hoot, midi, piano, playRecord } from "@/lib/audio";
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
  /** how many times it has been poked */
  taps?: number;
  className?: string;
  label?: string;
  onTap?: () => void;
};

export function Sprite({ id, scale = 3, rows = 30, active, taps = 0, className, label, onTap }: SpriteProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const item = TOYS[id];
  const live = useRef({ active, taps, f: 0, tapAt: -999 });
  const w = item.w + 6;

  useEffect(() => {
    if (live.current.taps !== taps) live.current.tapAt = live.current.f;
    live.current.active = active;
    live.current.taps = taps;
  }, [active, taps]);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const g = new Gfx(ctx, w, rows);
    let f = 0, raf = 0, last = 0, visible = true;
    const paint = () => {
      const s = live.current;
      ctx.clearRect(0, 0, w, rows);
      item.draw(g, 3, rows - 2, f, isDark() ? TOY_PALETTE.dark : TOY_PALETTE.light, s.active, s.taps, f - s.tapAt);
    };
    paint();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible || now - last < 1000 / FPS) return;
      last = now;
      // with motion off, time only moves to play out what a poke started
      if (!still() || f - live.current.tapAt < 24) live.current.f = ++f;
      paint();
    };
    raf = requestAnimationFrame(tick);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "60px" });
    io.observe(canvas);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [item, w, rows]);

  const canvas = (
    <canvas ref={ref} width={w} height={rows} aria-hidden="true" className="pixelated block" style={{ width: w * scale, height: rows * scale }} />
  );
  if (!onTap) return <span className={cn("block", className)}>{canvas}</span>;
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={label}
      className={cn("block cursor-pointer touch-manipulation outline-none focus-visible:ring-2 ring-koi", className)}
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
    stop.current = playing ? null : playRecord();
    setPlaying(!playing);
  };
  return (
    <Sprite
      id="record"
      rows={49}
      active={playing}
      onTap={toggle}
      label={playing ? "Stop the record" : "Play the record (Bach, Prelude in C)"}
      className={className}
    />
  );
}

/** Any other object: poke it and it does its own thing, with its own sound. */
export function Toy({ id, scale, rows, className }: { id: string; scale?: number; rows?: number; className?: string }) {
  const [taps, setTaps] = useState(0);
  if (!useToys()) return null;
  const poke = () => {
    TOYS[id].sound?.(taps + 1);
    setTaps(taps + 1);
  };
  return <Sprite id={id} scale={scale} rows={rows} taps={taps} onTap={poke} label={`Poke the ${id}`} className={className} />;
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
    chime(theme === "dark");
    setSparks(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSparks(false), 900);
  };
  return (
    <span className="relative flex items-center">
      <Sprite id="wand" scale={2} rows={30} active={sparks} onTap={cast} label={theme === "dark" ? "Lumos: switch to the light theme" : "Nox: switch to the dark theme"} />
      {sparks && (
        <span className="absolute left-1/2 top-full mt-4 -translate-x-1/2 text-xs italic font-display text-foreground-muted whitespace-nowrap animate-fade-blur">
          {theme === "dark" ? "nox" : "lumos"}
        </span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* An upright piano you can play                                       */
/* ------------------------------------------------------------------ */

const P_SCALE = 3;
const P_H = 68;
const P_D = 6; // depth of the case, drawn as a lid top and a side face
const KEY_W = 8; // one white key plus the gap to its right
const KEYS_Y = 31, KEYS_H = 17, BLACK_H = 11;
const WHITE = [0, 2, 4, 5, 7, 9, 11];
const HAS_SHARP = [true, true, false, true, true, true, false];
const WOOD = "#8a5230", WOOD_HI = "#b97240", WOOD_LO = "#5a341d", WOOD_SHADE = "#70411f";
const IVORY = "#f6f3ec", IVORY_SHADE = "#d6cfbf", EBONY = "#1d1d1b", BRASS = "#d9a441", PRESSED = "#e8552d";

export function Piano() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [cols, setCols] = useState(116);
  const down = useRef(new Map<number, number>());
  const paintRef = useRef<() => void>(() => {});
  const on = useToys();

  useEffect(() => {
    const el = ref.current?.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCols(Math.max(70, Math.floor(e.contentRect.width / P_SCALE))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [on]);

  // how many keys fit, where they start, and which note the first one plays
  const front = cols - P_D; // width of the front face
  const count = Math.floor((front - 14) / KEY_W);
  const x0 = Math.floor((front - count * KEY_W) / 2);
  const first = count > 18 ? 48 : 60;
  const whiteNote = (i: number) => first + Math.floor(i / 7) * 12 + WHITE[i % 7];

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const g = new Gfx(ctx, cols, P_H + P_D);
    const W = cols - P_D;

    paintRef.current = () => {
      ctx.clearRect(0, 0, cols, P_H + P_D);
      ctx.save();
      ctx.translate(0, P_D);
      // lid
      g.rect(0, 0, W, 3, WOOD_LO);
      g.rect(1, 0, W - 2, 1, WOOD_HI);
      // upper case, with a little grain
      g.rect(2, 3, W - 4, 25, WOOD);
      g.rect(2, 3, 3, 25, WOOD_LO); g.rect(W - 5, 3, 3, 25, WOOD_LO);
      for (let i = 0; i < Math.floor(W / 5); i++) {
        g.rect(6 + hash(i, 1, 71) * (W - 20), 5 + Math.floor(hash(i, 2, 71) * 22), 3 + hash(i, 3, 71) * 6, 1, WOOD_SHADE);
      }
      // three panels; the middle one carries the music
      const pw = Math.floor((W - 22) / 3.4);
      const mid = W - 16 - pw * 2 - 8;
      const panel = (px: number, w: number, music: boolean) => {
        g.rect(px, 7, w, 17, WOOD_LO);
        g.rect(px + 1, 8, w - 2, 15, music ? IVORY : WOOD_HI);
        if (!music) {
          g.rect(px + 1, 8, w - 2, 1, "#d08a50");
          g.rect(px + 1, 22, w - 2, 1, WOOD);
          g.rect(px + w - 2, 8, 1, 15, WOOD);
          return;
        }
        // two staves and a handful of notes
        for (const sy of [10, 17]) {
          for (let l = 0; l < 3; l++) g.rect(px + 3, sy + l * 2, w - 6, 1, "#a9a394");
          for (let n = 0; n < Math.floor((w - 8) / 5); n++) {
            const ny = sy + Math.floor(hash(n, sy, 73) * 4);
            g.rect(px + 5 + n * 5, ny + 1, 2, 2, EBONY);
            g.rect(px + 7 + n * 5, ny - 2, 1, 4, EBONY);
          }
        }
        g.rect(px + Math.floor(w / 2), 8, 1, 15, IVORY_SHADE);
      };
      panel(8, pw, false);
      panel(8 + pw + 4, mid, true);
      panel(W - 8 - pw, pw, false);
      // fallboard with a brass maker's plate
      g.rect(0, 28, W, 3, WOOD_LO);
      g.rect(Math.floor(W / 2) - 5, 29, 10, 1, BRASS);
      // keybed and cheek blocks
      g.rect(0, KEYS_Y, W, KEYS_H + 3, WOOD_LO);
      g.rect(1, KEYS_Y + 1, x0 - 2, KEYS_H - 1, WOOD); g.rect(W - x0 + 1, KEYS_Y + 1, x0 - 2, KEYS_H - 1, WOOD);
      g.rect(x0 - 1, KEYS_Y, count * KEY_W + 1, KEYS_H, EBONY);
      for (let i = 0; i < count; i++) {
        const pressed = down.current.has(whiteNote(i));
        const kx = x0 + i * KEY_W;
        g.rect(kx, KEYS_Y, KEY_W - 1, KEYS_H - (pressed ? 0 : 1), pressed ? "#f3b8a4" : IVORY);
        if (!pressed) g.rect(kx, KEYS_Y + KEYS_H - 3, KEY_W - 1, 2, IVORY_SHADE);
      }
      for (let i = 0; i < count - 1; i++) {
        if (!HAS_SHARP[i % 7]) continue;
        const pressed = down.current.has(whiteNote(i) + 1);
        const kx = x0 + i * KEY_W + 5;
        g.rect(kx, KEYS_Y, 5, BLACK_H + (pressed ? 1 : 0), pressed ? PRESSED : EBONY);
        if (!pressed) { g.rect(kx + 1, KEYS_Y, 1, BLACK_H - 2, "#4a4842"); g.rect(kx, KEYS_Y + BLACK_H - 1, 5, 1, "#000000"); }
      }
      g.rect(0, KEYS_Y + KEYS_H, W, 1, WOOD_HI);
      // lower case: turned legs, a recessed panel, three brass pedals
      const ly = KEYS_Y + KEYS_H + 3;
      g.rect(2, ly, W - 4, P_H - ly - 1, WOOD_SHADE);
      g.rect(6, ly + 2, W - 12, P_H - ly - 6, WOOD);
      g.rect(6, ly + 2, W - 12, 1, WOOD_LO);
      for (const lx of [2, W - 9]) {
        g.rect(lx, ly - 2, 7, P_H - ly + 1, WOOD_LO);
        g.rect(lx + 1, ly, 5, P_H - ly - 3, WOOD);
        g.rect(lx + 2, ly, 1, P_H - ly - 3, WOOD_HI);
        g.rect(lx, ly + 4, 7, 1, WOOD_LO);
      }
      const c = Math.floor(W / 2);
      for (const dx of [-6, -1, 4]) { g.rect(c + dx, P_H - 4, 3, 2, BRASS); g.rect(c + dx, P_H - 2, 3, 1, "#8a6a1f"); }
      g.rect(0, P_H - 1, W, 1, WOOD_LO);
      ctx.restore();
      // the lid's top, lit from above, and the side of the case, in shade
      for (let i = 1; i <= P_D; i++) {
        g.rect(i, P_D - i, W, 1, i === P_D ? WOOD_LO : i === 1 ? "#d08a50" : "#b97240");
        g.rect(W - 1 + i, P_D - i + 1, 1, P_H - 1, i === P_D ? "#3f2412" : "#5f3719");
      }
      // close the sliver between the inset case and its side
      ctx.globalCompositeOperation = "destination-over";
      g.rect(W - 2, P_D + 1, 3, P_H - 2, "#5f3719");
      ctx.globalCompositeOperation = "source-over";
      // and the shadow it casts on the floor
      g.rect(P_D, P_H + P_D - 1, cols - P_D, 1, "#3b2414", 0.25);
    };
    paintRef.current();
    const mo = new MutationObserver(() => paintRef.current());
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- whiteNote depends only on `first`
  }, [cols, count, x0, first, on]);

  if (!on) return null;

  const noteAt = (e: React.PointerEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    const ax = ((e.clientX - r.left) / r.width) * cols, ay = ((e.clientY - r.top) / r.height) * (P_H + P_D) - P_D;
    if (ay < KEYS_Y - 2 || ay > KEYS_Y + KEYS_H + 2) return null;
    const i = Math.floor((ax - x0) / KEY_W);
    if (i < 0 || i >= count) return null;
    if (ay < KEYS_Y + BLACK_H) {
      // black keys sit across the boundary between two whites
      const within = ax - x0 - i * KEY_W;
      if (within >= 5 && HAS_SHARP[i % 7] && i < count - 1) return whiteNote(i) + 1;
      if (within < 2 && i > 0 && HAS_SHARP[(i - 1) % 7]) return whiteNote(i - 1) + 1;
    }
    return whiteNote(i);
  };
  const strike = (n: number | null, last: React.RefObject<number | null>) => {
    if (n === null || n === last.current) return;
    last.current = n;
    piano(midi(n), 0.12);
    down.current.set(n, 1);
    paintRef.current();
    setTimeout(() => { down.current.delete(n); paintRef.current(); }, 190);
  };

  return <PianoCanvas canvasRef={ref} cols={cols} noteAt={noteAt} strike={strike} />;
}

function PianoCanvas({
  canvasRef, cols, noteAt, strike,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cols: number;
  noteAt: (e: React.PointerEvent) => number | null;
  strike: (n: number | null, last: React.RefObject<number | null>) => void;
}) {
  const held = useRef(false);
  const last = useRef<number | null>(null);
  return (
    <div>
      <canvas
        ref={canvasRef}
        width={cols}
        height={P_H + P_D}
        role="img"
        aria-label="An upright piano. Tap or drag across the keys to play."
        className="pixelated block w-full cursor-pointer select-none touch-none"
        style={{ height: (P_H + P_D) * P_SCALE }}
        onPointerDown={(e) => { e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId); held.current = true; last.current = null; strike(noteAt(e), last); }}
        onPointerMove={(e) => held.current && strike(noteAt(e), last)}
        onPointerUp={() => { held.current = false; last.current = null; }}
        onPointerCancel={() => { held.current = false; last.current = null; }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Site-wide: an owl that keeps your place                             */
/* ------------------------------------------------------------------ */

const OWL_SCALE = 2;
const F = OWL_FRAME;
/** the owl's body on screen, without the room its wings need */
const OWL_BODY = { w: F.bodyW * OWL_SCALE, h: F.bodyH * OWL_SCALE };
const HEADINGS = "[data-perch], .post-body h1, .post-body h2, .post-body h3";
/** things the owl treats as one solid block rather than looking inside */
const SOLID = "canvas, img, svg, video, iframe, button, pre, table, hr, .katex-display";

type TocEntry = { el: HTMLElement; label: string; level: number };

/** Everything on the page worth jumping to: marked sections, and a post's headings. */
function tocEntries(): TocEntry[] {
  const out: TocEntry[] = [];
  document.querySelectorAll<HTMLElement>("[data-toc], .post-body h1, .post-body h2, .post-body h3").forEach((el) => {
    const label = el.dataset.toc ?? el.textContent?.trim() ?? "";
    if (label) out.push({ el, label, level: el.dataset.toc ? 0 : Number(el.tagName[1]) - 1 });
  });
  return out;
}

type Menu = { items: TocEntry[]; current: number; style: React.CSSProperties };

/** The lines of a heading as they are laid out on screen right now. */
function headingLines(el: HTMLElement): Line[] {
  const range = document.createRange();
  range.selectNodeContents(el);
  const lines: Rect[] = [];
  for (const r of range.getClientRects()) {
    if (r.width < 1 || r.height < 1) continue;
    const l = lines.find((q) => Math.abs(q.bottom - r.bottom) < r.height * 0.4);
    if (l) { l.left = Math.min(l.left, r.left); l.right = Math.max(l.right, r.right); l.top = Math.min(l.top, r.top); l.bottom = Math.max(l.bottom, r.bottom); }
    else lines.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
  }
  return lines.sort((p, q) => p.top - q.top).map((l) => {
    const h = l.bottom - l.top;
    return { ...l, cap: l.top + h * 0.2, base: l.bottom - h * 0.2 };
  });
}

/** Measure the page for lib/owl-perch: headings, everything that must stay uncovered, and the usable screen. */
function readLayout(currentEl: HTMLElement | null): { layout: Layout; els: HTMLElement[] } {
  const vw = document.documentElement.clientWidth, vh = window.innerHeight;
  const header = document.querySelector<HTMLElement>("header");
  const top = (header && header.dataset.hidden !== "true" ? header.offsetHeight : 0) + 4;
  const els = [...document.querySelectorAll<HTMLElement>(HEADINGS)];
  const obstacles: Rect[] = [];
  const range = document.createRange();
  for (const root of document.querySelectorAll("main, footer")) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === Node.TEXT_NODE) return node.textContent?.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        const r = (node as Element).getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80 || (r.width === 0 && r.height === 0)) return NodeFilter.FILTER_REJECT;
        if ((node as Element).matches(SOLID)) {
          obstacles.push({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_SKIP;
      },
    });
    while (walker.nextNode()) {
      range.selectNodeContents(walker.currentNode);
      for (const r of range.getClientRects()) {
        // a line box is taller than its letters: keep only the part the ink fills
        if (r.width >= 1) obstacles.push({ left: r.left, right: r.right, top: r.top + r.height * 0.2, bottom: r.bottom - r.height * 0.05 });
      }
    }
  }
  const current = currentEl ? els.indexOf(currentEl) : -1;
  return {
    els,
    layout: {
      headings: els.map((el, id) => ({ id, lines: headingLines(el) })),
      obstacles,
      view: { left: 4, top, right: vw - 4, bottom: vh - 6 },
      owl: OWL_BODY,
      current: current < 0 ? null : current,
    },
  };
}

function Owl() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const pathname = usePathname();

  // Tapping the owl opens a small contents list, the way a page outline does.
  const openMenu = () => {
    const el = btn.current;
    if (!el) return;
    if (menu) { setMenu(null); return; }
    hoot();
    const items = tocEntries();
    let current = -1;
    items.forEach((it, i) => { if (it.el.getBoundingClientRect().top < window.innerHeight * 0.4) current = i; });
    const r = el.getBoundingClientRect();
    const width = 248;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    const height = Math.min(window.innerHeight * 0.6, items.length * 32 + 110);
    const below = r.bottom + 6 + height < window.innerHeight;
    setMenu({
      items,
      current,
      style: below ? { left, top: r.bottom + 6, width } : { left, bottom: window.innerHeight - r.top + 6, width },
    });
  };
  const go = (y: number) => {
    setMenu(null);
    window.scrollTo({ top: Math.max(0, y), behavior: still() ? "auto" : "smooth" });
  };

  // close on Escape, on a tap elsewhere, or when the page is scrolled by hand
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Element;
      if (t !== btn.current && !t.closest?.("[data-owl-menu]")) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, { passive: true });
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [menu]);

  useEffect(() => {
    const el = wrap.current, canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!el || !canvas || !ctx) return;
    const g = new Gfx(ctx, F.w, F.h + 2);
    type Pt = { x: number; y: number };
    // Where it is headed: a spot at a heading (kept as an offset from the
    // heading, so it follows the heading if the page reflows), or null = home.
    let aim: { el: HTMLElement; id: number; kind: string; dx: number; dy: number } | null = null;
    let pos: Pt | null = null, from: Pt = { x: 0, y: 0 };
    let t = 1, dur = 1, arc = 0, f = 0, raf = 0, last = 0, lastPaint = 0, scrolled = false;

    /** Home is the slot beside the name in the header; it rides along with the header. */
    const home = (): Pt | null => {
      const slot = document.querySelector("[data-owl-home]");
      if (!slot) return null;
      const r = slot.getBoundingClientRect();
      return { x: r.left + r.width / 2 + window.scrollX, y: r.bottom + window.scrollY };
    };
    const target = (): Pt | null => {
      if (!aim || !aim.el.isConnected) return home();
      const r = aim.el.getBoundingClientRect();
      return { x: r.left + aim.dx + window.scrollX, y: r.top + aim.dy + window.scrollY };
    };

    /** Look at the page and decide where to be; fly there if that is somewhere new. */
    const decide = (animate: boolean) => {
      const { layout, els } = readLayout(aim?.el ?? null);
      const p = choosePerch(layout);
      el.dataset.visibleHeadings = String(layout.headings.filter((h) => isVisible(h, layout.view)).length);
      const before = pos;
      if (p) {
        const r = els[p.heading].getBoundingClientRect();
        aim = { el: els[p.heading], id: p.heading, kind: p.kind, dx: p.x - r.left, dy: p.y - r.top };
      } else aim = null;
      el.dataset.owlHeading = aim ? String(aim.id) : "";
      const to = target();
      if (!to) return;
      const dist = before ? Math.hypot(to.x - before.x, to.y - before.y) : 0;
      if (!before || !animate || still() || dist < 3) { pos = to; t = 1; return; }
      from = { ...before };
      dur = Math.min(1100, 320 + dist * 0.75);
      arc = Math.min(26, dist * 0.1 + 6);
      t = 0;
    };

    const paint = (flying: boolean) => {
      ctx.clearRect(0, 0, F.w, F.h + 2);
      // push off with a downstroke, beat on the way, flare the wings up to land
      const rows = !flying ? OWL_FRAMES.perched : t < 0.1 ? OWL_FRAMES.down : t > 0.86 ? OWL_FRAMES.up : OWL_FLAP[f % OWL_FLAP.length];
      if (!flying) {
        // a soft shadow on whatever it is standing on
        g.rect(F.bodyX + 5, F.bodyY + F.bodyH, 13, 1, "#3b2414", 0.22);
        g.rect(F.bodyX + 7, F.bodyY + F.bodyH + 1, 9, 1, "#3b2414", 0.12);
      }
      g.sprite(rows, 0, 0, OWL_PAL);
      if (!flying && f % 70 < 3) owlBlink(g, F.bodyX, F.bodyY);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(50, now - last);
      last = now;
      const to = target();
      if (!pos || !to) return;
      if (t < 1) {
        t = Math.min(1, t + dt / dur);
        const e = t * t * (3 - 2 * t);
        pos = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - Math.sin(Math.PI * t) * arc };
      } else pos = to;
      const flying = t < 1;
      el.style.transform = `translate(${Math.round(pos.x - (F.bodyX + F.bodyW / 2) * OWL_SCALE)}px, ${Math.round(pos.y - (F.bodyY + F.bodyH) * OWL_SCALE)}px)`;
      // standing at a heading that is sliding under the header: don't show through it
      const header = document.querySelector("header")?.getBoundingClientRect();
      const under = aim !== null && !flying && header !== undefined && pos.y - window.scrollY - OWL_BODY.h < header.bottom;
      el.style.opacity = under ? "0" : "1";
      el.dataset.owlState = flying ? "flying" : aim ? "perched" : "home";
      if (now - lastPaint > 1000 / FPS) { lastPaint = now; f++; paint(flying); }
    };
    raf = requestAnimationFrame(tick);

    // Take its place quietly while the page settles; after that, whenever
    // scrolling comes to rest, look again and fly only if it has to move.
    const timers = [80, 400, 1200].map((ms) => setTimeout(() => decide(scrolled), ms));
    void document.fonts?.ready.then(() => decide(scrolled));
    let settle: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      scrolled = true;
      clearTimeout(settle);
      settle = setTimeout(() => decide(true), 160);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(settle);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return (
    <>
      <div
        ref={wrap}
        data-owl=""
        className="absolute top-0 left-0 opacity-0 transition-opacity duration-150"
        style={{ width: F.w * OWL_SCALE, height: (F.h + 2) * OWL_SCALE }}
      >
        <canvas
          ref={canvasRef}
          width={F.w}
          height={F.h + 2}
          aria-hidden="true"
          className="pixelated block pointer-events-none"
          style={{ width: F.w * OWL_SCALE, height: (F.h + 2) * OWL_SCALE }}
        />
        {/* only the owl's body takes taps; the room left for its wings lets them through */}
        <button
          ref={btn}
          type="button"
          onClick={openMenu}
          aria-haspopup="menu"
          aria-expanded={Boolean(menu)}
          aria-label="An owl that keeps your place. Tap it for the page's contents."
          className="absolute pointer-events-auto cursor-pointer outline-none focus-visible:ring-2 ring-koi"
          style={{ left: F.bodyX * OWL_SCALE, top: F.bodyY * OWL_SCALE, width: OWL_BODY.w, height: OWL_BODY.h }}
        />
      </div>
      {menu && (
        // A game-style window: a stepped wooden frame round a parchment panel,
        // with a title plate and a cursor that marks where you are.
        <nav data-owl-menu="" aria-label="On this page" className="px-menu fixed z-[80] pointer-events-auto animate-fade-blur" style={menu.style}>
          <div className="px-menu-frame">
            <div className="px-menu-panel">
              <p className="px-menu-title" aria-hidden="true">Where to?</p>
              <div className="px-menu-list">
                <button type="button" className="px-menu-item" onClick={() => go(0)}>
                  <span className="px-menu-cursor" aria-hidden="true">▲</span>
                  <span>Back to top</span>
                </button>
                {menu.items.length > 0 && <div className="px-menu-rule" aria-hidden="true" />}
                {menu.items.map((it, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-current={i === menu.current ? "location" : undefined}
                    className="px-menu-item"
                    style={{ paddingLeft: 6 + it.level * 12 }}
                    onClick={() => go(it.el.getBoundingClientRect().top + window.scrollY - 92)}
                  >
                    <span className="px-menu-cursor" aria-hidden="true">▶</span>
                    <span>{it.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </nav>
      )}
    </>
  );
}

/** Mounted once in the layout. */
export function SiteToys() {
  if (!useToys()) return null;
  return (
    <div className="absolute inset-0 z-[55] pointer-events-none overflow-hidden">
      <Owl />
    </div>
  );
}
