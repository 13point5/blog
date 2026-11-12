"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Gfx, hash } from "@/lib/pixel/engine";
import { OWL_PAL, OWL_ROWS, OWL_SIZE, TOYS, TOY_PALETTE, owlBlink } from "@/lib/pixel/scenes/shelf";
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
  /** how many times it has been poked; each poke makes it hop */
  taps?: number;
  className?: string;
  label?: string;
  onTap?: () => void;
};

export function Sprite({ id, scale = 3, rows = 30, active, taps = 0, className, label, onTap }: SpriteProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const item = TOYS[id];
  const live = useRef({ active, taps, hop: 0 });
  const w = item.w + 6;
  const tappable = Boolean(onTap);

  useEffect(() => {
    if (live.current.taps !== taps) live.current.hop = 8;
    live.current.active = active;
    live.current.taps = taps;
  }, [active, taps]);

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
      item.draw(g, 3, rows - 2 - lift, f, isDark() ? TOY_PALETTE.dark : TOY_PALETTE.light, s.active, s.taps);
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
      rows={50}
      active={playing}
      onTap={toggle}
      label={playing ? "Stop the record" : "Play the record (Bach, Prelude in C)"}
      className={className}
    />
  );
}

/** Any other object: poke it and it hops and makes its own sound. */
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
      <Sprite id="wand" scale={2} rows={22} active={sparks} onTap={cast} label={theme === "dark" ? "Lumos: switch to the light theme" : "Nox: switch to the dark theme"} />
      {sparks && (
        <span className="absolute left-1/2 top-full -translate-x-1/2 text-xs italic font-display text-foreground-muted whitespace-nowrap animate-fade-blur">
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
  const count = Math.floor((cols - 14) / KEY_W);
  const x0 = Math.floor((cols - count * KEY_W) / 2);
  const first = count > 18 ? 48 : 60;
  const whiteNote = (i: number) => first + Math.floor(i / 7) * 12 + WHITE[i % 7];

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const g = new Gfx(ctx, cols, P_H);
    const W = cols;

    paintRef.current = () => {
      ctx.clearRect(0, 0, W, P_H);
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
    const ax = ((e.clientX - r.left) / r.width) * cols, ay = ((e.clientY - r.top) / r.height) * P_H;
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
        height={P_H}
        role="img"
        aria-label="An upright piano. Tap or drag across the keys to play."
        className="pixelated block w-full cursor-pointer select-none touch-none"
        style={{ height: P_H * P_SCALE }}
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

// the canvas leaves room either side of the owl for its wings
const OWL_W = OWL_SIZE.w + 12, OWL_H = OWL_SIZE.h + 3, OWL_SCALE = 2, OWL_X = 6, OWL_Y = 3;

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

function Owl() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [menu, setMenu] = useState<Menu | null>(null);
  const pathname = usePathname();

  // Tapping the owl opens a small contents list, the way a page outline does.
  const openMenu = () => {
    const canvas = ref.current;
    if (!canvas) return;
    if (menu) { setMenu(null); return; }
    hoot();
    const items = tocEntries();
    let current = -1;
    items.forEach((it, i) => { if (it.el.getBoundingClientRect().top < window.innerHeight * 0.4) current = i; });
    const r = canvas.getBoundingClientRect();
    const width = 248;
    const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8));
    const height = Math.min(window.innerHeight * 0.6, items.length * 34 + 96);
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
      if (t !== ref.current && !t.closest?.("[data-owl-menu]")) close();
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
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const g = new Gfx(ctx, OWL_W, OWL_H);
    const bodyW = OWL_SIZE.w * OWL_SCALE, bodyH = OWL_SIZE.h * OWL_SCALE;
    type Pt = { x: number; y: number };
    const doc = (x: number, y: number): Pt => ({ x: x + window.scrollX, y: y + window.scrollY });

    const headings = () => [...document.querySelectorAll<HTMLElement>("[data-perch], .post-body h1, .post-body h2, .post-body h3")];
    // The header slides away and back as you scroll, so plan around its full
    // height rather than wherever it happens to be mid-slide.
    const headerBottom = () => document.querySelector<HTMLElement>("header")?.offsetHeight ?? 0;

    /** The owl's home when no heading has room for it: a reserved slot in the header. */
    const home = (): Pt | null => {
      const slot = document.querySelector("[data-owl-home]");
      if (!slot) return null;
      const r = slot.getBoundingClientRect();
      return doc(r.left + r.width / 2, r.bottom - 1);
    };

    /**
     * Where the owl would stand beside a heading: on the baseline, just after
     * the last word. Returns null unless that spot is completely free, so the
     * owl never covers a letter.
     */
    const beside = (el: HTMLElement): Pt | null => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1);
      if (!rects.length) return null;
      const bottom = Math.max(...rects.map((r) => r.bottom));
      const line = rects.filter((r) => r.bottom > bottom - 4);
      const lineRight = Math.max(...line.map((r) => r.right));
      const lineTop = Math.min(...line.map((r) => r.top));
      const size = parseFloat(getComputedStyle(el).fontSize);
      const left = lineRight + Math.max(6, size * 0.25);
      const feet = bottom - (bottom - lineTop) * 0.2; // roughly the baseline
      const top = feet - bodyH;
      // room to the right: the edge of the text column, or whatever shares the line
      const block = el.closest("h1, h2, h3") ?? el;
      let limit = (block.parentElement ?? block).getBoundingClientRect().right;
      const next = block.nextElementSibling?.getBoundingClientRect();
      if (next && next.top < bottom && next.bottom > lineTop && next.left > lineRight) limit = next.left - 6;
      if (left + bodyW > limit) return null;
      // on a wrapped heading, an earlier line must not run underneath the owl
      if (rects.some((r) => r.bottom <= lineTop + 4 && r.bottom > top && r.right > left - 2)) return null;
      // and it has to be in view, clear of the header
      if (top < headerBottom() + 6 || feet > window.innerHeight - 12) return null;
      return doc(left + bodyW / 2, feet);
    };

    // The owl aims at a heading while one has room for it, and at the header otherwise.
    let perch: HTMLElement | null = null;
    let pos: Pt = { x: 0, y: 0 };
    let from = pos, t = 1, dur = 1, dir = 1, f = 0, raf = 0, last = 0, lastPaint = 0, ready = false;
    const where = (): Pt | null => (perch && perch.isConnected ? beside(perch) : null) ?? home();

    const choose = () => headings().find((el) => beside(el)) ?? null;

    const retarget = () => {
      const next = choose();
      if (next === perch && t >= 1) return;
      from = { ...pos };
      perch = next;
      const to = where();
      if (!to || still()) { t = 1; return; }
      const dist = Math.hypot(to.x - from.x, to.y - from.y);
      if (dist < 6) { t = 1; return; }
      dir = to.x < from.x ? -1 : 1;
      dur = Math.min(1400, 420 + dist * 0.9);
      t = 0;
    };

    const land = () => {
      perch = choose();
      const to = where();
      if (!to) { canvas.style.opacity = "0"; return; }
      ready = true;
      pos = to;
      // arrive from off the top of the page
      from = { x: to.x + 90, y: Math.max(0, window.scrollY - 40) };
      t = still() ? 1 : 0;
      dur = 800;
      dir = -1;
    };
    const arrive = setTimeout(land, 350);

    const paint = (flying: boolean) => {
      ctx.clearRect(0, 0, OWL_W, OWL_H);
      if (flying) {
        // wings first, so the body sits in front of them
        const up = Math.floor(f / 2) % 2 === 0;
        const wy = OWL_Y + (up ? 3 : 8);
        for (const wx of [0, OWL_W - 7]) {
          g.rect(wx, wy - 1, 7, 5, OWL_PAL.k);
          g.rect(wx + 1, wy, 5, 3, OWL_PAL.d);
          g.rect(wx + 2, wy + (up ? 0 : 1), 3, 2, OWL_PAL.b);
        }
      }
      g.sprite(OWL_ROWS, OWL_X, OWL_Y, OWL_PAL, dir < 0);
      if (!flying && f % 70 < 3) owlBlink(g, OWL_X, OWL_Y);
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(50, now - last);
      last = now;
      if (!ready) return;
      // Resting beside a heading, it stays put on the page (and so scrolls away
      // with it). Resting in the header, it rides along with the header.
      const to = t < 1 || !perch ? where() : perch.isConnected ? beside(perch) ?? pos : null;
      if (!to) { land(); return; }
      if (t < 1) {
        t = Math.min(1, t + dt / dur);
        const e = t * t * (3 - 2 * t);
        const lift = Math.sin(Math.PI * t) * Math.min(60, Math.hypot(to.x - from.x, to.y - from.y) * 0.25 + 12);
        pos = { x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - lift };
      } else pos = to;
      canvas.style.transform = `translate(${Math.round(pos.x - (OWL_W * OWL_SCALE) / 2)}px, ${Math.round(pos.y - OWL_H * OWL_SCALE)}px)`;
      // never show through the header while the page slides underneath it
      const screenTop = pos.y - window.scrollY - bodyH;
      canvas.style.opacity = perch && t >= 1 && screenTop < headerBottom() ? "0" : "1";
      if (now - lastPaint > 1000 / FPS) { lastPaint = now; f++; paint(t < 1); }
    };
    raf = requestAnimationFrame(tick);

    // Whenever scrolling comes to rest, move to the heading now in view, or home.
    let settle: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(settle);
      settle = setTimeout(() => ready && retarget(), 170);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      clearTimeout(arrive);
      clearTimeout(settle);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [pathname]);

  return (
    <>
      <canvas
        ref={ref}
        width={OWL_W}
        height={OWL_H}
        onClick={openMenu}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), openMenu())}
        className="pixelated absolute top-0 left-0 pointer-events-auto cursor-pointer opacity-0 transition-opacity duration-150 outline-none focus-visible:ring-2 ring-koi"
        style={{ width: OWL_W * OWL_SCALE, height: OWL_H * OWL_SCALE }}
        role="button"
        tabIndex={0}
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        aria-label="An owl that keeps your place. Tap it for the page's contents."
      />
      {menu && (
        <nav
          data-owl-menu=""
          aria-label="On this page"
          className="fixed z-[80] pointer-events-auto max-h-[60vh] overflow-y-auto rounded-md border bg-background-card shadow-lg p-1.5 text-sm animate-fade-blur"
          style={menu.style}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent cursor-pointer"
            onClick={() => go(0)}
          >
            <span aria-hidden="true" className="text-foreground-muted">↑</span> Back to top
          </button>
          {menu.items.length > 0 && (
            <>
              <div className="my-1.5 h-px bg-border" aria-hidden="true" />
              <p className="px-2 pt-0.5 pb-1 text-xs text-foreground-muted">On this page</p>
              {menu.items.map((it, i) => (
                <button
                  key={i}
                  type="button"
                  aria-current={i === menu.current ? "location" : undefined}
                  className={cn(
                    "block w-full rounded-sm py-1.5 pr-2 text-left leading-snug hover:bg-accent cursor-pointer",
                    i === menu.current ? "text-foreground font-medium" : "text-foreground-muted"
                  )}
                  style={{ paddingLeft: 8 + it.level * 14 }}
                  onClick={() => go(it.el.getBoundingClientRect().top + window.scrollY - 76)}
                >
                  {it.label}
                </button>
              ))}
            </>
          )}
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
