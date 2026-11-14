// A tiny pixel-art engine. Scenes are drawn procedurally onto a low-res canvas
// that is scaled up with `image-rendering: pixelated`, so there are no image
// assets to manage and every cover can animate.

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Stateless hash → [0, 1). Used for static texture (foliage, tiles, windows). */
export function hash(x: number, y: number, seed = 0): number {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263 + seed * 2147483647;
  h = (h ^ (h >>> 13)) * 1274126177;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// 3x5 bitmap font. Each glyph is 5 rows, 3 bits per row (4 = left pixel).
const FONT: Record<string, number[]> = {
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6],
  E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3], H: [5, 5, 7, 5, 5],
  I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7],
  M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5], O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4],
  Q: [2, 5, 5, 7, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2],
  U: [5, 5, 5, 5, 7], V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5],
  Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
  "0": [7, 5, 5, 5, 7], "1": [2, 6, 2, 2, 7], "2": [6, 1, 2, 4, 7], "3": [6, 1, 2, 1, 6],
  "4": [5, 5, 7, 1, 1], "5": [7, 4, 6, 1, 6], "6": [3, 4, 7, 5, 7], "7": [7, 1, 2, 2, 2],
  "8": [7, 5, 7, 5, 7], "9": [7, 5, 7, 1, 6],
  "%": [5, 1, 2, 4, 5], "!": [2, 2, 2, 0, 2], "?": [6, 1, 2, 0, 2], ".": [0, 0, 0, 0, 2],
  ",": [0, 0, 0, 2, 4], ":": [0, 2, 0, 2, 0], "-": [0, 0, 7, 0, 0], "+": [0, 2, 7, 2, 0],
  ">": [4, 2, 1, 2, 4], "<": [1, 2, 4, 2, 1], "/": [1, 1, 2, 4, 4], "=": [0, 7, 0, 7, 0],
  "'": [2, 2, 0, 0, 0], _: [0, 0, 0, 0, 7], "|": [2, 2, 2, 2, 2], "*": [5, 2, 5, 0, 0],
  "#": [5, 7, 5, 7, 5], "^": [2, 5, 0, 0, 0],
};

export type Palette = Record<string, string>;

export class Gfx {
  private layers = new Map<string, HTMLCanvasElement>();
  /** The first static layer a scene paints, i.e. its background. */
  backdrop: HTMLCanvasElement | null = null;

  constructor(
    public ctx: CanvasRenderingContext2D,
    public w: number,
    public h: number
  ) {
    ctx.imageSmoothingEnabled = false;
  }

  rect(x: number, y: number, w: number, h: number, c: string, a = 1) {
    const ctx = this.ctx;
    if (a !== 1) ctx.globalAlpha = a;
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    if (a !== 1) ctx.globalAlpha = 1;
  }

  px(x: number, y: number, c: string, a = 1) {
    this.rect(x, y, 1, 1, c, a);
  }

  /** Rectangle outline, 1px. */
  box(x: number, y: number, w: number, h: number, c: string, a = 1) {
    this.rect(x, y, w, 1, c, a);
    this.rect(x, y + h - 1, w, 1, c, a);
    this.rect(x, y + 1, 1, h - 2, c, a);
    this.rect(x + w - 1, y + 1, 1, h - 2, c, a);
  }

  line(x0: number, y0: number, x1: number, y1: number, c: string, a = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0);
    x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (let i = 0; i < 400; i++) {
      this.px(x0, y0, c, a);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }

  disc(cx: number, cy: number, r: number, c: string, a = 1) {
    cx = Math.round(cx); cy = Math.round(cy);
    const R = Math.ceil(r);
    for (let dy = -R; dy <= R; dy++) {
      const half = Math.floor(Math.sqrt(Math.max(0, (r + 0.35) ** 2 - dy * dy)));
      if ((r + 0.35) ** 2 - dy * dy < 0) continue;
      this.rect(cx - half, cy + dy, half * 2 + 1, 1, c, a);
    }
  }

  ring(cx: number, cy: number, r: number, c: string, a = 1) {
    cx = Math.round(cx); cy = Math.round(cy);
    const steps = Math.max(8, Math.round(r * 6));
    for (let i = 0; i < steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      this.px(cx + Math.round(Math.cos(t) * r), cy + Math.round(Math.sin(t) * r), c, a);
    }
  }

  /** 3x5 pixel text. Returns the width drawn. */
  text(s: string, x: number, y: number, c: string, a = 1) {
    let cx = Math.round(x);
    const cy = Math.round(y);
    for (const ch of s.toUpperCase()) {
      const g = FONT[ch];
      if (g) {
        for (let r = 0; r < 5; r++) {
          for (let b = 0; b < 3; b++) {
            if (g[r] & (4 >> b)) this.px(cx + b, cy + r, c, a);
          }
        }
      }
      cx += 4;
    }
    return cx - Math.round(x);
  }

  /** Draw string-art: each char looks up a colour in `pal`; "." is transparent. */
  sprite(rows: string[], x: number, y: number, pal: Palette, flip = false) {
    x = Math.round(x); y = Math.round(y);
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let i = 0; i < row.length; i++) {
        const c = pal[row[flip ? row.length - 1 - i : i]];
        if (c) this.px(x + i, y + r, c);
      }
    }
  }

  /** Paint a static layer once, then blit it on every later frame. */
  layer(key: string, paint: (g: Gfx) => void) {
    let cv = this.layers.get(key);
    if (!cv) {
      cv = document.createElement("canvas");
      cv.width = this.w;
      cv.height = this.h;
      const c = cv.getContext("2d");
      if (!c) return;
      paint(new Gfx(c, this.w, this.h));
      this.layers.set(key, cv);
      if (!this.backdrop) this.backdrop = cv;
    }
    this.ctx.drawImage(cv, 0, 0);
  }
}

export type Env = { night: boolean };

export interface Scene<S = unknown> {
  w: number;
  h: number;
  /** Frames per second; pixel art looks best choppy. */
  fps?: number;
  /** Frame to show when motion is off. */
  poster?: number;
  /** Screen-reader description. */
  alt: string;
  /**
   * Fluid scenes can be drawn at any width (they read `g.w`), so they can
   * span the whole screen. Other scenes are centred and their background is
   * stretched out sideways.
   */
  fluid?: boolean;
  /** Rows [top, bottom) to keep when shown as a full-width band. */
  band?: [number, number];
  init: (rng: Rng, w: number) => S;
  draw: (g: Gfx, f: number, s: S, env: Env) => void;
  /** Canvas-space click. Return true if the scene reacted. */
  pointer?: (s: S, x: number, y: number) => boolean;
}

export const KNIGHT = [
  "..rr...",
  ".sssss.",
  ".sdsds.",
  ".sssss.",
  "..bbb..",
  ".sbbbs.",
  "..b.b..",
  "..d.d..",
];

export const KNIGHT_PAL: Palette = {
  r: "#e8452c",
  s: "#c9d2dc",
  d: "#2a2f3a",
  b: "#3f7fd1",
};
