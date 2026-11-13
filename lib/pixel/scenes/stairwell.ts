import { Gfx, hash, type Rng, type Scene } from "../engine";
import { rumble } from "@/lib/audio";

// A library with moving stairs, seen from the front like a stage set, in one
// fixed view. Stone towers stand along the hall with arched doors and
// balconies; three tiers of bookcases line the wall behind, with a tall window
// in every gap. Pale flights of stairs cross between the towers, and above the
// ground floor each one swings round to the other side when it feels like it.
//
// Nothing here is scripted. People are made up as they are needed: someone
// comes in through a door, decides where they are going, finds stairs that
// lead there (waiting for a flight to come round if they must), and leaves by
// another door. Some stop to browse, and the book they want flies down to
// them. Books also shelve themselves and visit the readers at the desks.
//
// The hall repeats sideways for ever, the same pair of towers over and over,
// so the picture can be any width.

const W = 390, H = 260; // the picture, in pixels
const F = 2; // the hall is laid out in units and drawn twice as fine: two pixels to a unit
const T = 2; // the world is redrawn twice per beat (a beat is a twelfth of a second)
const HW = H / F; // the hall is exactly as tall as the picture, in units
const BAY = 110; // tower to tower
const PERIOD = 2 * BAY; // the hall repeats every two towers
const PIER = 13; // half the width of a tower
const RUN = BAY - 2 * PIER; // how far a flight travels
const STEPS = 21, GOING = 4, RISE = 2; // each step: 4 along, 2 up
const STOREY = STEPS * RISE;
const FLOOR = HW - 10; // row of the floor at the towers' front face
const G = FLOOR - 156; // rows of the furniture are written as G + something
const K = 0.25; // one unit of depth toward the viewer moves a point this far down the picture
const DEEP = 20; // stairs and balconies are this deep
const WALL_BASE = FLOOR - 10; // the back wall stands 40 units behind the towers
const RAIL = 9; // height of a handrail
const SWING = 44; // frames a flight takes to swing round

const C = {
  wall: "#4a392b", wall2: "#534132", wall3: "#423225", mortar: "#3a2c21", mould: "#7b6447", mouldHi: "#94794f",
  pier: "#8d7758", pierHi: "#a18966", pierDk: "#6a5840", pierLine: "#7a6649",
  tread: "#e6dcc8", tread2: "#d2c7b0", side: "#a99c84", sideDk: "#7c705b", rail: "#f1e9d8", railDk: "#b6a98f", post: "#cdc1a9",
  farRail: "#a3977f", farPost: "#8f846e",
  oak: "#5a3a20", oakDk: "#3a2413", oakHi: "#7a5230",
  gilt: "#d2a23e", giltHi: "#f0cc68", giltDk: "#8f6a22",
  tile: "#75604a", tile2: "#665240", dark: "#17100b", glow: "#ffcf6a", ink: "#1a120e", paper: "#fdf8ea",
};
const SPINES = ["#a8402f", "#c9973a", "#4a6a44", "#3a5a82", "#d8c08a", "#7a4468", "#b5622f", "#8a9a62", "#2f2a26"];
// --- people ----------------------------------------------------------------
const SKINS = ["#f7dcc0", "#eac09a", "#d19a6c", "#a9714a", "#7b4a2d", "#56331f"];
const HAIRS = ["#17110d", "#2e1d12", "#6b4423", "#b5622f", "#e6c66f", "#a9a9a4"];
const ROBES = ["#c63f31", "#2f9560", "#3a6fd0", "#8552c2", "#d9772b", "#1f8f95", "#c9417f"];
const HATS = ["#8c281f", "#1d6740", "#254c9c", "#5a358f", "#9a4f17", "#136267", "#8f2857"];
const CLOTH = ["#ece4d2", "#d9772b", "#3a6fd0", "#c9417f", "#2f9560"];

const pick = <T,>(list: T[], look: number, n: number) => list[Math.floor(hash(look, n, 50) * list.length)];

/** Run some drawing in pixels rather than units (two pixels to a unit). */
function fine(g: Gfx, draw: () => void) {
  g.ctx.save();
  g.ctx.scale(1 / F, 1 / F);
  draw();
  g.ctx.restore();
}
const tints = new Map<string, string>();
/** A colour made darker (k < 1) or lighter (k > 1, toward white). */
function tint(hex: string, k: number) {
  const key = hex + k;
  let c = tints.get(key);
  if (!c) {
    const n = parseInt(hex.slice(1), 16);
    const ch = (v: number) => Math.round(k <= 1 ? v * k : v + (255 - v) * (k - 1));
    tints.set(key, (c = `rgb(${ch((n >> 16) & 255)},${ch((n >> 8) & 255)},${ch(n & 255)})`));
  }
  return c;
}
/** A soft pool of light, added to whatever is there. */
function glow(g: Gfx, x: number, y: number, r: number, rgb: string, a: number) {
  const gr = g.ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(0.5, `rgba(${rgb},${a * 0.35})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.ctx.fillStyle = gr;
  g.ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

type Look = { cut?: number; wand?: number };
/**
 * Someone, drawn in pixels with their feet on row `y` and centred on `x`:
 * about 34 pixels tall, shaded from the left, with a dark edge so they read
 * against pale stone and dark wall alike. `look` decides skin, hair, robe and
 * what they wear on their head. `cut` hides everything below a row (someone
 * behind a desk); `wand` puts a wand in the hand on that side.
 */
function figure(g: Gfx, x: number, y: number, look: number, pose = 0, o: Look = {}) {
  // each is painted once and kept, then stamped wherever they have got to
  x = Math.round(x); y = Math.round(y);
  const key = look + ":" + (pose % 2) + ":" + (o.wand ?? 0);
  let kept = FIGURE_KEPT.get(key);
  if (!kept) {
    if (FIGURE_KEPT.size > 400) FIGURE_KEPT.clear();
    FIGURE_KEPT.set(key, (kept = canvas(30, 46, (l) => paintFigure(l, 15, 44, look, pose, o.wand))));
  }
  const rows = o.cut === undefined ? 46 : Math.max(0, Math.min(46, o.cut - (y - 44)));
  if (rows > 0) g.ctx.drawImage(kept, 0, 0, 30, rows, x - 15, y - 44, 30, rows);
}
const FIGURE_KEPT = new Map<string, HTMLCanvasElement>();
function paintFigure(g: Gfx, x: number, y: number, look: number, pose: number, wand?: number) {
  const kind = Math.floor(hash(look, 0, 50) * FIGURES), n = Math.floor(hash(look, 3, 50) * ROBES.length);
  const robe = ROBES[n], dark = HATS[n], hi = tint(robe, 1.2), gold = "#f6dc8a";
  const skin = pick(SKINS, look, 2), skinDk = tint(skin, 0.8), hair = pick(HAIRS, look, 1), hairHi = tint(hair, 1.4);
  const cloth = pick(CLOTH, look, 4), clothDk = tint(cloth, 0.78);
  const R: [number, number, number, number, string][] = [];
  const r = (dx: number, dy: number, w: number, h: number, c: string) => R.push([x + dx, y + dy, w, h, c]);
  const step = pose % 2;
  // boots, one a little ahead of the other
  r(-4, -2 - step, 3, 2 + step, C.dark); r(1, -3 + step, 3, 3 - step, C.dark);
  // robe: skirt and chest, lit from the left
  r(-5, -14, 11, 12, robe); r(-4, -23, 9, 9, robe);
  r(3, -14, 3, 12, dark); r(3, -23, 2, 9, dark);
  r(-5, -14, 1, 12, hi); r(-4, -23, 1, 9, hi);
  r(-5, -3, 11, 1, dark);
  r(0, -21, 1, 18, gold); r(-4, -15, 9, 1, dark); r(-1, -15, 3, 1, gold);
  // sleeves and hands
  r(-6, -22, 2, 9, hi); r(5, -22, 2, 9, dark); r(-6, -13, 2, 2, skin); r(5, -13, 2, 2, skinDk);
  if (wand) { const sd = wand; for (let i = 0; i < 6; i++) r(sd * (6 + Math.floor(i / 2)) + (sd < 0 ? -1 : 0), -14 - i, 1, 1, "#6b4423"); }
  // collar, neck, head
  r(-4, -24, 9, 2, gold); r(-1, -24, 3, 1, skinDk);
  r(-3, -32, 7, 8, skin); r(3, -31, 1, 6, skinDk); r(-2, -25, 5, 1, skinDk);
  r(-2, -29, 1, 2, C.ink); r(2, -29, 1, 2, C.ink); r(0, -26, 2, 1, tint(skin, 0.6));
  switch (kind) {
    case 0: // a pointed hat
      r(-4, -31, 1, 3, hair); r(4, -31, 1, 3, hair);
      r(-5, -33, 11, 2, dark); r(-3, -35, 7, 2, robe); r(-2, -37, 5, 2, robe); r(-1, -39, 4, 2, robe); r(1, -41, 3, 2, robe);
      r(-3, -34, 7, 1, gold); r(2, -35, 2, 2, dark); r(2, -37, 1, 2, dark); r(-3, -35, 1, 1, hi);
      break;
    case 2: // long hair
      r(-4, -33, 1, 12, hair); r(4, -33, 1, 12, hair); r(-5, -26, 1, 6, hair); r(5, -26, 1, 6, hair);
    // falls through
    case 1: // short hair
      r(-3, -34, 7, 3, hair); r(-4, -33, 1, 4, hair); r(4, -33, 1, 4, hair); r(-2, -34, 3, 1, hairHi);
      break;
    case 3: // an afro
      r(-5, -37, 11, 7, hair); r(-4, -38, 9, 1, hair); r(-6, -35, 13, 5, hair); r(-5, -30, 2, 2, hair); r(4, -30, 2, 2, hair);
      r(-3, -37, 2, 1, hairHi); r(1, -36, 2, 1, hairHi);
      break;
    case 4: // a headscarf
      r(-4, -34, 9, 3, cloth); r(-3, -35, 7, 1, cloth); r(-4, -31, 1, 7, cloth); r(4, -31, 1, 7, clothDk);
      r(-3, -25, 7, 1, cloth); r(-5, -24, 11, 2, cloth); r(2, -34, 2, 3, clothDk); r(3, -24, 3, 2, clothDk);
      break;
    case 5: // a turban
      r(-4, -36, 9, 5, cloth); r(-3, -37, 7, 1, cloth); r(-4, -33, 9, 1, clothDk); r(2, -36, 2, 3, clothDk);
      r(-2, -36, 3, 1, tint(cloth, 1.2)); r(0, -34, 1, 1, gold);
      break;
    case 6: // hair up in a bun
      r(-3, -34, 7, 3, hair); r(-4, -33, 1, 4, hair); r(4, -33, 1, 4, hair); r(-1, -37, 3, 3, hair); r(-1, -37, 1, 1, hairHi);
      break;
    default: // a beard
      r(-3, -34, 7, 3, hair); r(-4, -33, 1, 4, hair); r(4, -33, 1, 4, hair);
      r(-3, -27, 7, 2, hair); r(-2, -25, 5, 2, hair); r(-1, -23, 3, 2, hair); r(0, -27, 1, 1, tint(skin, 0.6));
  }
  for (const [rx, ry, rw, rh] of R) g.rect(rx - 1, ry - 1, rw + 2, rh + 2, C.ink);
  for (const [rx, ry, rw, rh, c] of R) g.rect(rx, ry, rw, rh, c);
}
const FIGURES = 8; // ways of dressing a head: hat, short hair, long hair, afro, headscarf, turban, bun, beard

/** The same, placed in units from inside unit-scaled drawing. `cut` is a row in units. */
function person(g: Gfx, x: number, y: number, look: number, pose = 0, cut?: number, wand?: number) {
  fine(g, () => figure(g, F * x + 1, F * y + F, look, pose, { cut: cut === undefined ? undefined : F * cut, wand }));
}

/** Fill a convex shape, one row of pixels at a time. */
function poly(g: Gfx, pts: [number, number][], c: string) {
  let y0 = Infinity, y1 = -Infinity;
  for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
    const yc = y + 0.5;
    let xa = Infinity, xb = -Infinity;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length];
      if ((p[1] <= yc) === (q[1] <= yc)) continue;
      const x = p[0] + ((yc - p[1]) / (q[1] - p[1])) * (q[0] - p[0]);
      xa = Math.min(xa, x); xb = Math.max(xb, x);
    }
    const l = Math.round(xa), r = Math.round(xb);
    if (r > l) g.rect(l, y, r - l, 1, c);
  }
}

type Walker = { d: number; look: number };

/**
 * One flight of stairs. It starts at a tower's edge, `level` above the floor,
 * and climbs one storey heading along angle `a` (0 = to the right, pi = to the
 * left, in between = swinging round toward the viewer). Positions are in
 * units; it is drawn in pixels: every tread with its bright nosing and the
 * shadow of the step above, turned balusters, a moulded handrail.
 */
function flight(g: Gfx, cx: number, level: number, a: number, walkers: Walker[] = [], part = 0) {
  // `part` draws only what is behind anyone on the stairs (1) or only what is in front of them (2)
  fine(g, () => {
    const c = Math.cos(a), s = Math.sin(a), half = DEEP / 2, end = PIER + RUN, px = 1 / F;
    /** a point `d` along the flight, `off` to one side of its middle, `z` above the floor: where it is on screen, in pixels */
    const pt = (d: number, off: number, z: number): [number, number] => [F * (cx + c * d - s * off), F * (FLOOR - z + (half + s * d + c * off) * K)];
    const top = (i: number) => level + RISE * (i + 1);
    const slope = (d: number) => level + ((d - PIER) * RISE) / GOING;
    const near = c >= 0 ? 1 : -1; // the edge toward the viewer
    const tall = RAIL * F;

    const posts = (side: number, lit: string, body: string, shade: string) => {
      const off = side * half;
      for (let i = 0; i < STEPS; i++) {
        // a turned baluster on every step: a thin stem with a belly and a foot
        const d = PIER + GOING * i + GOING / 2, [x, y] = pt(d, off, slope(d) + RISE + RAIL), X = Math.floor(x), Y = Math.round(y);
        g.rect(X, Y, 1, tall, body); g.rect(X - 1, Y + 7, 3, 6, lit); g.rect(X + 1, Y + 8, 1, 4, body); g.rect(X - 1, Y + tall - 2, 3, 2, shade);
      }
      for (const d of [PIER + 1, end - 1]) {
        const [x, y] = pt(d, off, slope(d) + RISE + RAIL), X = Math.round(x), Y = Math.round(y);
        g.rect(X - 2, Y - 3, 4, tall + 3, lit); g.rect(X + 1, Y - 3, 1, tall + 3, shade);
        g.rect(X - 3, Y - 5, 6, 2, body); g.rect(X - 1, Y - 8, 2, 3, lit);
      }
    };
    const handrail = (side: number, lit: string, body: string, shade: string) => {
      const off = side * half;
      const [x0, y0] = pt(PIER, off, slope(PIER) + RISE + RAIL), [x1, y1] = pt(end, off, slope(end) + RISE + RAIL);
      g.line(x0, y0 + 2, x1, y1 + 2, shade);
      g.line(x0, y0 + 1, x1, y1 + 1, body);
      g.line(x0, y0, x1, y1, lit);
    };

    if (part === 2) { handrail(near, "#fbf6e8", C.rail, C.railDk); return; }
    posts(-near, C.farRail, C.farPost, C.sideDk);
    handrail(-near, C.farRail, C.farPost, C.sideDk);
    const o = near * half, sideways = Math.abs(c) > 0.08;
    for (let i = 0; i < STEPS; i++) {
      const d0 = PIER + GOING * i, d1 = d0 + GOING, z = top(i);
      const tread = (a0: number, a1: number, col: string, o0 = -half, o1 = half) => poly(g, [pt(a0, o0, z), pt(a1, o0, z), pt(a1, o1, z), pt(a0, o1, z)], col);
      if (Math.abs(c) > 0.6) {
        tread(d0, d1, C.tread2);
        tread(d0, d1, C.side, -half, -half + 3); // in the shadow of the far balustrade
        tread(d0, d0 + px, C.tread); // the nosing catches the light
        tread(d1 - px, d1, C.sideDk); // under the step above
        tread(d1 - 2 * px, d1 - px, C.side);
      } else tread(d0, d1, i % 2 ? C.tread : C.tread2);
      // the side of the stair is cut in steps too, top and bottom
      if (sideways) {
        const face = (z0: number, z1: number, col: string, a0 = d0, a1 = d1) => poly(g, [pt(a0, o, z0), pt(a1, o, z0), pt(a1, o, z1), pt(a0, o, z1)], col);
        face(z, z - 7, C.side);
        face(z, z - px, C.rail);
        face(z - 3, z - 3 - px, C.railDk); // a moulding along the string
        face(z - 6, z - 7, C.sideDk);
        face(z - 7 + px, z - 7, "#5d5343");
        face(z, z - RISE, C.rail, d0, d0 + px);
      }
    }
    // swinging toward us: the top end of the flight comes into view
    if (s > 0.08) poly(g, [pt(end, -half, top(STEPS - 1)), pt(end, half, top(STEPS - 1)), pt(end, half, slope(end) - 6), pt(end, -half, slope(end) - 6)], C.sideDk);

    // people stand out in front of the posts, with only the handrail across them
    posts(near, C.rail, C.post, C.railDk);
    if (part === 1) return;
    for (const wk of walkers) {
      const i = Math.max(0, Math.min(STEPS - 1, Math.floor((wk.d - PIER) / GOING)));
      const [x, y] = pt(PIER + GOING * i + GOING / 2, near * 2, top(i));
      figure(g, x, y, wk.look, i);
    }
    handrail(near, "#fbf6e8", C.rail, C.railDk);
  });
}

// A flight that is not moving looks the same every time, so it is drawn once
// and kept: one picture of everything behind the people on it, one of the
// handrail in front of them. Only a flight in mid-swing is drawn step by step.
const KEPT = new Map<number, [HTMLCanvasElement, HTMLCanvasElement]>();
const KEPT_W = F * RUN + 12, KEPT_H = F * (STOREY + RISE + RAIL + 10) + 16;
function still(g: Gfx, cx: number, level: number, dir: 1 | -1, walkers: Walker[]) {
  const ox = dir > 0 ? F * PIER - 6 : -F * (PIER + RUN) - 6, oy = F * (FLOOR - STOREY - RISE - RAIL) - 12;
  let kept = KEPT.get(dir);
  if (!kept) {
    const make = (part: number) => canvas(KEPT_W, KEPT_H, (l) => { l.ctx.translate(-ox, -oy); l.ctx.scale(F, F); flight(l, 0, 0, dir > 0 ? 0 : Math.PI, [], part); });
    KEPT.set(dir, (kept = [make(1), make(2)]));
  }
  const x = cx + ox / F, y = oy / F - level;
  g.ctx.drawImage(kept[0], x, y, KEPT_W / F, KEPT_H / F);
  if (walkers.length) fine(g, () => {
    for (const wk of walkers) {
      const i = Math.max(0, Math.min(STEPS - 1, Math.floor((wk.d - PIER) / GOING)));
      figure(g, F * (cx + dir * (PIER + GOING * i + GOING / 2)), F * (FLOOR - level - RISE * (i + 1) + (DEEP / 2 + 2) * K), wk.look, i);
    }
  });
  g.ctx.drawImage(kept[1], x, y, KEPT_W / F, KEPT_H / F);
}

/** A flight at whatever angle it is at: from the kept pictures if it is at rest, step by step if it is swinging. */
function stairs(g: Gfx, cx: number, level: number, a: number, walkers: Walker[]) {
  if (a === 0 || a === Math.PI) still(g, cx, level, a === 0 ? 1 : -1, walkers);
  else flight(g, cx, level, a, walkers);
}

/** A pointed opening: `wd` wide (odd), `ht` tall, standing on `base`, centred on `mx`. */
function arch(g: Gfx, mx: number, base: number, wd: number, ht: number, c: string, alpha = 1) {
  const insets = [0.38, 0.24, 0.14, 0.07, 0.03];
  for (let r = 0; r < ht; r++) {
    const inset = Math.round((insets[r] ?? 0) * wd);
    g.rect(mx - (wd - 1) / 2 + inset, base - ht + r, wd - 2 * inset, 1, c, alpha);
  }
}

/** A tall window with stone tracery, standing on the row `base`. Placed in units, drawn in pixels. */
function windowAt(g: Gfx, mx: number, base: number, ht: number, night: boolean, f = 0) {
  fine(g, () => {
    const X = F * mx + 1, B = F * base + 2, HT = F * ht, top = B - HT;
    arch(g, X, B + 2, 37, HT + 5, C.mouldHi);
    arch(g, X, B + 1, 35, HT + 3, C.mould);
    arch(g, X, B, 31, HT, night ? "#1d2c5e" : "#a9c9dd");
    // glass: paler toward the top by day, and a sheen across it
    const glass = night ? ["#22346c", "#2b4080", "#35508f"] : ["#bfd9e8", "#d3e7f0", "#e6f2f6"];
    arch(g, X, B - 1, 29, HT - 2, glass[0]);
    arch(g, X, B - Math.round(HT * 0.35), 29, Math.round(HT * 0.65) - 2, glass[1]);
    arch(g, X, B - Math.round(HT * 0.7), 29, Math.round(HT * 0.3) - 2, glass[2]);
    for (let i = 0; i < 26; i++) g.rect(X - 12 + i, B - 22 - i * 2, 3, 2, night ? "#4763a6" : "#f4fafc", 0.5);
    if (night) {
      for (let i = 0; i < 14; i++) {
        const sx = X - 11 + Math.floor(hash(i, mx, 61) * 23), sy = top + 16 + Math.floor(hash(i, mx, 62) * (HT - 30));
        if ((f + i * 7) % 40 > 6) g.px(sx, sy, "#e8eeff", 0.9);
      }
      g.disc(X + 6, top + 26, 4, "#f4f0d8"); g.disc(X + 8, top + 25, 3, "#2b4080");
    }
    // leading, a mullion down the middle, and tracery in the head
    for (let y = B - 9; y > top + 20; y -= 9) g.rect(X - 15, y, 31, 1, C.mould, 0.75);
    for (const dx of [-8, 8]) g.rect(X + dx, top + 16, 1, HT - 16, C.mould, 0.75);
    g.rect(X - 1, top + 3, 2, HT - 3, C.mouldHi); g.rect(X + 1, top + 3, 1, HT - 3, C.mould);
    g.ring(X - 7, top + 13, 4, C.mouldHi); g.ring(X + 7, top + 13, 4, C.mouldHi); g.ring(X, top + 6, 3, C.mouldHi);
    g.rect(X - 15, top + 18, 31, 2, C.mouldHi);
    g.rect(X - 20, B + 2, 41, 2, C.mouldHi); g.rect(X - 19, B + 4, 39, 2, C.mould); g.rect(X - 19, B + 6, 39, 1, C.mortar);
  });
}

type Tower = { k: number; x: number; even: boolean };
const tower = (k: number): Tower => ({ k, x: k * BAY, even: k % 2 === 0 });
/** The towers whose stairs could show between two columns of the hall. */
function towersIn(x0: number, x1: number): Tower[] {
  const out: Tower[] = [];
  for (let k = Math.floor(x0 / BAY) - 1; k <= Math.ceil(x1 / BAY) + 1; k++) out.push(tower(k));
  return out;
}
/** The storey a tower has its balcony on: the first for even towers, the second for the towers between. */
const balcony = (t: { even: boolean }) => (t.even ? 1 : 2);
const DESK = 7; // where the reading desk stands, measured from the even tower
/** A way of placing things in a gap, measured outward from its even tower at `x`, so that left mirrors right. */
const across = (x: number, dir: number) => (u: number, wd = 0) => (dir > 0 ? x + PIER + u : x - PIER - u - wd);
// the tall window in each gap: the row its sill is on, and its height
const SILL = WALL_BASE - 48, WINDOW_H = 54;
// rows of shelf a book can leave from or go back to
const SHELF_ROWS = [G + 69, G + 75, G + 81, G + 87, G + 109, G + 115, G + 121, G + 127];

/** Everything that never moves, for one stretch of the hall: walls, bookcases, floor, towers, balconies. */
function paintHall(l: Gfx) {
  /** how far column `x` is from the nearest even tower */
  const from = (x: number) => Math.min(x, PERIOD - x);
  l.rect(0, 0, PERIOD, HW, C.wall);
  for (let y = 0; y < WALL_BASE; y += 4) for (let x = 0; x < PERIOD; x++) {
    const i = Math.floor((from(x) + ((y >> 2) % 2) * 4) / 8), tone = hash(i, y, 21);
    if (tone < 0.3) l.rect(x, y, 1, 4, tone < 0.15 ? C.wall2 : C.wall3);
  }
  // the floor: flagstones, the rows nearer the front a little deeper
  fine(l, () => {
    let y = F * WALL_BASE;
    [3, 3, 4, 4, 6].forEach((deep, row) => {
      const wd = 12 + row * 2;
      for (let x = 0; x < PERIOD * F; x++) {
        const d = Math.min(x, PERIOD * F - x) + wd / 2, i = Math.floor(d / wd);
        l.rect(x, y, 1, deep, (i + row) % 2 ? C.tile : C.tile2);
        if (d % wd < 1) l.rect(x, y, 1, deep, C.mortar, 0.6);
      }
      l.rect(0, y, PERIOD * F, 1, C.mortar, 0.6);
      l.rect(0, y + 1, PERIOD * F, 1, "#9a826a", 0.25);
      y += deep;
    });
  });
  l.rect(0, WALL_BASE, PERIOD, 1, C.mortar);

  // the gaps between towers, each drawn outward from its even tower so that left mirrors right
  for (const [ox, dir] of [[0, 1], [PERIOD, -1]]) {
    const X = across(ox, dir);
    const R = (u: number, y: number, rw: number, rh: number, c: string) => l.rect(X(u, rw), y, rw, rh, c);
    /** a bookcase `n` shelves tall from the row `top`, between two distances from the even tower */
    const shelves = (top: number, n: number, sd: number, u0 = 0, u1 = RUN) => {
      R(u0, top, u1 - u0, n * 6, "#22150c");
      fine(l, () => {
        const lo = F * u0, hi = F * u1;
        const P = (u: number, y: number, rw: number, rh: number, c: string) => l.rect(dir > 0 ? F * (ox + PIER) + u : F * (ox - PIER) - u - rw, y, rw, rh, c);
        for (let shelf = 0; shelf < n; shelf++) {
          const base = F * (top + shelf * 6) + 10; // the board the books stand on
          P(lo, base, hi - lo, 1, C.oakHi); P(lo, base + 1, hi - lo, 1, C.oak);
          P(lo, base - 10, hi - lo, 2, "#150c06"); // the shadow of the shelf above
          for (let u = lo + 1; u < hi - 4; ) {
            const id = u + shelf * 997, kind = hash(id, sd, 1);
            if (kind < 0.07) { u += 3 + Math.floor(hash(id, sd, 2) * 4); continue; } // a gap
            if (kind < 0.13) {
              // a few books lying flat
              const wd = 7 + Math.floor(hash(id, sd, 3) * 3);
              for (let j = 0; j < 3; j++) {
                const c = SPINES[Math.floor(hash(id + j, sd, 4) * SPINES.length)];
                P(u, base - 2 - j * 2, wd - (j % 2), 2, c); P(u, base - 2 - j * 2, wd - (j % 2), 1, tint(c, 1.2));
              }
              u += wd + 1;
              continue;
            }
            const wd = 2 + Math.floor(hash(id, sd, 5) * 3), ht = 6 + Math.floor(hash(id, sd, 6) * 4), c = SPINES[Math.floor(hash(id, sd, 7) * SPINES.length)];
            P(u, base - ht, wd, ht, c);
            if (wd > 2) P(u, base - ht, 1, ht, tint(c, 1.25));
            P(u + wd - 1, base - ht, 1, ht, tint(c, 0.75));
            if (hash(id, sd, 8) < 0.5) P(u, base - ht + 2, wd, 1, hash(id, sd, 9) < 0.6 ? C.giltHi : "#e9e2d0"); // a band of gilt or a label
            u += wd;
          }
        }
        for (let u = lo; u <= hi - 4; u += 42) {
          const x = Math.min(u, hi - 4);
          P(x, F * top, 4, n * 12, C.oak); P(x, F * top, 1, n * 12, C.oakHi); P(x + 3, F * top, 1, n * 12, C.oakDk);
        }
        P(hi - 4, F * top, 4, n * 12, C.oak); P(hi - 4, F * top, 1, n * 12, C.oakHi);
      });
    };
    // three tiers of bookcases; the upper two stand either side of a tall window
    for (const [u0, u1] of [[0, 32], [52, RUN]]) {
      shelves(2, 4, 31 + u0, u0, u1);
      R(u0, G + 62, u1 - u0, 3, C.oakDk); R(u0, G + 62, u1 - u0, 1, C.oakHi);
      shelves(G + 65, 6, 40 + u0, u0, u1);
    }
    windowAt(l, X(42), SILL, WINDOW_H, false);
    // a gallery with a brass rail in front of the middle tier, and the ground-floor cases under it
    R(0, G + 101, RUN, 4, C.oakDk); R(0, G + 101, RUN, 1, C.oakHi);
    for (let u = 3; u < RUN; u += 7) R(u, G + 95, 1, 6, C.giltDk);
    R(0, G + 94, RUN, 1, C.gilt);
    shelves(G + 105, 5, 49);
    R(0, G + 135, RUN, 11, C.oak); R(0, G + 135, RUN, 1, C.oakHi);
    for (let u = 3; u < RUN - 6; u += 10) R(u, G + 138, 7, 6, C.oakDk);
    // a rolling ladder
    R(60, G + 106, 1, 40, "#c2925a"); R(65, G + 106, 1, 40, "#c2925a");
    for (let y = G + 109; y < G + 146; y += 4) R(61, y, 4, 1, "#9a6f3e");
  }

  for (let k = -1; k <= 3; k++) {
    const x = k * BAY, even = k % 2 === 0;
    // the tower: lighter stone, shaded evenly down both edges
    l.rect(x - PIER, 0, PIER * 2, FLOOR, C.pier);
    l.rect(x - PIER, 0, 2, FLOOR, C.pierDk); l.rect(x + PIER - 2, 0, 2, FLOOR, C.pierDk);
    l.rect(x - PIER + 2, 0, 1, FLOOR, C.pierHi); l.rect(x + PIER - 3, 0, 1, FLOOR, C.pierHi);
    fine(l, () => {
      // courses of dressed stone: a dark joint with a lit edge under it, and a few stones weathered darker or paler
      const L = F * (x - PIER) + 6, wd = F * PIER * 2 - 12;
      for (let y = F * FLOOR - 12, row = 0; y > -12; y -= 12, row++) {
        l.rect(L, y, wd, 1, C.pierDk); l.rect(L, y + 1, wd, 1, C.pierHi, 0.5);
        for (const j of row % 2 ? [-10, 10] : [-20, 0, 20]) { l.rect(F * x + j, y + 1, 1, 11, C.pierDk, 0.8); l.rect(F * x + j + 1, y + 2, 1, 10, C.pierHi, 0.35); }
        for (let i = 0; i < 2; i++) {
          const h = hash(row, i + (even ? 0 : 7), 44);
          if (h < 0.5) l.rect(L + Math.floor(h * 2 * (wd - 10)), y + 2, 9, 9, h < 0.25 ? C.pierDk : C.pierHi, 0.18);
        }
      }
    });
    l.rect(x - PIER - 1, FLOOR - 5, PIER * 2 + 2, 5, C.pierDk); l.rect(x - PIER - 1, FLOOR - 5, PIER * 2 + 2, 1, C.pierHi);

    const doorAt = (base: number, wd: number, ht: number, wooden = false) => fine(l, () => {
      const X = F * x + 1, B = F * base, W2 = F * wd + 1, H2 = F * ht, half = Math.floor(W2 / 2);
      arch(l, X, B, W2 + 10, H2 + 5, C.pierHi); arch(l, X, B, W2 + 8, H2 + 4, C.pier); arch(l, X, B, W2 + 4, H2 + 2, C.pierDk);
      arch(l, X, B, W2, H2, wooden ? C.oak : C.dark);
      if (wooden) {
        // planks, a meeting stile, two iron straps with their studs, and ring handles
        for (let j = -half + 4; j < half - 2; j += 5) { l.rect(X + j, B - H2 + 8, 1, H2 - 8, C.oakDk); l.rect(X + j + 1, B - H2 + 8, 1, H2 - 8, C.oakHi, 0.5); }
        l.rect(X - 1, B - H2 + 2, 2, H2 - 2, C.oakDk);
        for (const y of [B - H2 + 16, B - 12]) {
          l.rect(X - half, y, W2, 3, "#2a2420"); l.rect(X - half, y, W2, 1, "#4a4038");
          for (let j = -half + 3; j < half - 1; j += 6) l.px(X + j, y + 1, "#8a8478");
        }
        l.ring(X - 5, B - 22, 2, C.giltHi); l.ring(X + 5, B - 22, 2, C.giltHi);
      } else {
        // a corridor beyond, lit from somewhere out of sight
        arch(l, X, B, W2 - 6, H2 - 8, "#2a1a0e"); arch(l, X, B, W2 - 12, H2 - 15, "#4a2c14"); arch(l, X, B, W2 - 18, H2 - 22, "#7a4a1c");
      }
    });
    /** where a storey has no door: a narrow window */
    const slit = (base: number) => fine(l, () => {
      const X = F * x + 1, B = F * base - 8;
      arch(l, X, B, 15, 30, C.pierHi); arch(l, X, B, 13, 29, C.pierDk); arch(l, X, B, 9, 26, "#a9c9dd"); arch(l, X, B - 8, 9, 18, "#d3e7f0");
      l.rect(X, B - 26, 1, 26, C.pierDk); l.rect(X - 4, B - 13, 9, 1, C.pierDk); l.rect(X - 8, B, 17, 2, C.pierHi);
    });
    const lantern = (lx: number, ly: number) => fine(l, () => {
      const X = F * lx + 1, Y = F * ly;
      l.rect(X - 1, Y - 6, 2, 3, C.dark); l.rect(X - 3, Y - 3, 6, 1, C.dark); l.rect(X - 2, Y - 2, 4, 8, "#2a1c12"); l.rect(X - 1, Y - 1, 2, 6, C.glow);
      l.rect(X - 3, Y + 6, 6, 1, C.dark); l.rect(X - 1, Y + 7, 2, 1, C.dark);
    });

    doorAt(FLOOR, even ? 17 : 13, even ? 26 : 21, even);
    for (const sgn of [-1, 1]) lantern(x + sgn * 10, FLOOR - 22);
    for (const st of [1, 2]) {
      const y = FLOOR - st * STOREY;
      if (st !== balcony({ even })) { slit(y); continue; }
      doorAt(y, 13, 21);
      // the balcony: a moulded slab on corbels, turned balusters, and end posts with finials.
      // Its handrail is drawn later, over whoever stands behind it.
      fine(l, () => {
        const L = F * (x - PIER), Y = F * y, wd = F * PIER * 2;
        l.rect(L, Y, wd, 10, C.tread2); l.rect(L, Y, wd, 1, C.tread); l.rect(L, Y + 5, wd, 1, C.side, 0.5);
        l.rect(L, Y + 10, wd, 6, C.side); l.rect(L, Y + 10, wd, 1, C.rail); l.rect(L, Y + 13, wd, 1, C.railDk); l.rect(L, Y + 15, wd, 1, C.sideDk);
        l.rect(L + 3, Y + 16, wd - 6, 3, C.pierDk); l.rect(L + 3, Y + 16, wd - 6, 1, C.pier); l.rect(L + 7, Y + 19, wd - 14, 3, "#5a4934"); l.rect(L + 12, Y + 22, wd - 24, 2, "#4a3c2a");
        for (let j = 7; j < wd - 5; j += 5) { l.rect(L + j, Y - 7, 1, 17, C.post); l.rect(L + j - 1, Y - 1, 3, 6, C.rail); l.rect(L + j + 1, Y, 1, 4, C.post); l.rect(L + j - 1, Y + 8, 3, 2, C.railDk); }
        for (const ex of [L, L + wd - 4]) { l.rect(ex, Y - 11, 4, 21, C.rail); l.rect(ex + 3, Y - 11, 1, 21, C.railDk); l.rect(ex - 1, Y - 13, 6, 2, C.post); l.rect(ex + 1, Y - 16, 2, 3, C.rail); }
      });
      for (const sgn of [-1, 1]) lantern(x + sgn * 10, y - 18);
    }
    if (even) {
      // a runner from the great door to the front of the hall
      l.rect(x - 7, FLOOR, 15, HW - FLOOR, "#8f2f2a"); l.rect(x - 7, FLOOR, 1, HW - FLOOR, C.gilt); l.rect(x + 7, FLOOR, 1, HW - FLOOR, C.gilt);
    }
  }
  l.rect(0, HW - 1, PERIOD, 1, C.dark);
}

/** A shaft of light from the tall window: where it starts (x, top), where it ends, and how far it leans, in pixels. */
const shaft = (mx: number, dir: number): [number, number, number, number] => [F * mx + 1, F * (SILL - WINDOW_H) + 12, F * SILL + 150, dir * 70];
/** The lantern rows of a tower: beside the ground door, and beside the door on its balcony. */
const lanterns = (t: { even: boolean }) => [FLOOR - 22, FLOOR - balcony(t) * STOREY - 18];

/**
 * The light of everything that stays put, for one stretch of the hall, on
 * black: lanterns, open doorways, the desk lamps, and daylight (or moonlight)
 * slanting in through the tall windows. It is laid over the finished picture
 * so that it lightens whatever is under it.
 */
function paintLight(l: Gfx, night: boolean) {
  const lit = night ? 1 : 0.62, ctx = l.ctx;
  ctx.globalCompositeOperation = "lighter";
  for (let k = -1; k <= 3; k++) {
    const x = k * BAY, even = k % 2 === 0;
    if (even) for (const dir of [1, -1]) {
      const X = across(x, dir), rgb = night ? "140,170,255" : "255,240,205";
      const [wx, top, end, lean] = shaft(X(42), dir);
      const gr = ctx.createLinearGradient(0, top, 0, end);
      gr.addColorStop(0, `rgba(${rgb},${night ? 0.2 : 0.26})`); gr.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(wx - 14, top); ctx.lineTo(wx + 14, top); ctx.lineTo(wx + 14 + lean, end); ctx.lineTo(wx - 14 + lean, end); ctx.closePath(); ctx.fill();
      glow(l, wx, F * (SILL - WINDOW_H / 2), 64, rgb, night ? 0.2 : 0.26);
      glow(l, F * (X(DESK, 15) + (dir > 0 ? 2 : 12)) + 1, F * (G + 138), 34, "120,235,165", 0.42 * lit);
    }
    for (const row of lanterns({ even })) for (const sgn of [-1, 1]) glow(l, F * (x + sgn * 10) + 1, F * row + 2, 46, "255,190,105", 0.55 * lit);
    glow(l, F * x + 1, F * (FLOOR - balcony({ even }) * STOREY) - 18, 32, "255,160,70", 0.3 * lit);
    if (!even) glow(l, F * x + 1, F * FLOOR - 18, 32, "255,160,70", 0.3 * lit);
  }
}

function canvas(w: number, h: number, paint: (g: Gfx) => void) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d");
  if (ctx) paint(new Gfx(ctx, w, h));
  return cv;
}

// --- things that move ------------------------------------------------------
type Mover = { k: number; x: number; st: number; side: 1 | -1; t0: number; next: number; a: number };
/** A book in the air: from a point to a point, or to (or from) someone's hands. */
type Book = { x0: number; y0: number; x1: number; y1: number; t: number; dur: number; cover: string; to?: Person; arc: number };
/** What someone is doing right now. They do one thing at a time and think again when it is done. */
type Doing =
  | { is: "fade"; to: 0 | 1 }
  | { is: "go"; x: number; y: number }
  | { is: "wait"; beats: number }
  | { is: "climb"; cx: number; level: number; dir: 1 | -1; up: boolean; d: number } // one of the two fixed flights from the ground floor
  | { is: "board"; up: boolean; beats: number } // on a balcony, waiting for a flight that swings
  | { is: "ride"; m: Mover; up: boolean; d: number }
  | { is: "browse"; beats: number; asked: boolean };
type Person = {
  look: number; x: number; y: number; alpha: number; steps: number;
  k: number; st: number; // the tower and storey they are at (or were last at)
  want: number; // the storey they are making for; 3 means on up the stairs and out of sight
  todo: Doing[]; book?: string; keep?: boolean; gone?: boolean;
};
type State = {
  f: number; rng: Rng; x0: number; x1: number;
  hall: HTMLCanvasElement | null; light: (HTMLCanvasElement | null)[];
  movers: Map<string, Mover>; people: Person[]; books: Book[];
};

const END = PIER + RUN; // how far along a flight its top is
const PACE = 0.7; // units walked per beat on the level
const CLIMB = 1; // and on the stairs
const FRONT = FLOOR + 7; // the row people walk along at the front of the hall
/** The row someone stands on, on a balcony at storey `st`. */
const ledge = (st: number) => FLOOR - st * STOREY + 2;

/** The flight that leaves a balcony. It is made the first time anything needs it. */
function mover(s: State, k: number, st: number): Mover {
  const key = k + ":" + st;
  let m = s.movers.get(key);
  if (!m) {
    const n = k % 2 === 0 ? k / 2 : (k - 1) / 2 + 1;
    m = { k, x: k * BAY, st, side: ((n % 2) + 2) % 2 === 0 ? 1 : -1, t0: -1, a: 0, next: s.f + 30 + Math.floor(hash(k, st, 7) * 200) };
    m.a = m.side > 0 ? 0 : Math.PI;
    s.movers.set(key, m);
  }
  return m;
}
const docked = (m: Mover) => m.t0 < 0;

/** Send a book flying. */
function fly(s: State, x0: number, y0: number, x1: number, y1: number, cover: string, to?: Person) {
  s.books.push({ x0, y0, x1, y1, t: 0, dur: Math.max(30, Math.hypot(x1 - x0, y1 - y0) * 0.7), cover, to, arc: 10 + s.rng() * 12 });
}
/** Somewhere on the shelves near column `x`: a place a book can leave from or go back to. */
function shelfNear(s: State, x: number): [number, number] {
  const k = Math.round(x / BAY), base = k * BAY + (x >= k * BAY ? 1 : -1) * (PIER + 4 + s.rng() * (RUN - 8));
  return [base, SHELF_ROWS[Math.floor(s.rng() * SHELF_ROWS.length)]];
}

/** Someone new comes in: through a door, or down the stairs from out of sight. */
function arrive(s: State) {
  const k = Math.round((s.x0 + s.rng() * (s.x1 - s.x0)) / BAY), t = tower(k), r = s.rng();
  const p: Person = { look: Math.floor(s.rng() * 1e6), x: t.x, y: 0, alpha: 0, steps: 0, k, st: 0, want: 0, todo: [] };
  const from = r < 0.5 ? 0 : r < 0.85 || t.even ? balcony(t) : 3;
  if (from === 3) {
    // down the flight that climbs out of the picture, if it is this side just now
    const m = mover(s, k, 2);
    if (!docked(m)) return;
    p.st = 2; p.alpha = 1;
    p.todo.push({ is: "ride", m, up: false, d: END - 1 });
  } else {
    p.st = from;
    p.y = from ? ledge(from) : FLOOR + 2;
    p.todo.push({ is: "fade", to: 1 });
    if (!from) p.todo.push({ is: "go", x: t.x, y: FRONT });
  }
  // where to? Anywhere but where they came in, except that the ground floor is worth a stroll
  const choices = [0, 1, 1, 2, 2, 3].filter((st) => st !== from || st === 0);
  p.want = choices[Math.floor(s.rng() * choices.length)];
  s.people.push(p);
}

/** Someone has nothing left to do: work out the next thing from where they are and where they want to be. */
function think(s: State, p: Person) {
  const t = tower(p.k), go = (x: number, y: number) => p.todo.push({ is: "go", x, y });
  const leave = (x: number, y: number) => { go(x, y); p.todo.push({ is: "fade", to: 0 }); };
  if (p.st === 0 && p.want === 0) {
    // a turn about the ground floor: perhaps a book, then out by some other door
    if (!p.keep && p.book === undefined && s.rng() < 0.7) {
      const d = s.rng() < 0.5 ? 1 : -1;
      go(t.x + d * (PIER + 8 + s.rng() * (RUN - 16)), FRONT - 1 - s.rng() * 3);
      p.todo.push({ is: "browse", beats: 0, asked: false });
      p.keep = true; // they will not want another
      return;
    }
    const k = p.k + (s.rng() < 0.5 ? 1 : -1) * (s.rng() < 0.7 ? 1 : 2);
    p.k = k;
    go(k * BAY, FRONT);
    leave(k * BAY, FLOOR + 2);
  } else if (p.st === p.want) leave(t.x, ledge(p.st));
  else if (p.want > p.st) {
    if (p.st === 0) {
      // the fixed flights start beside the towers in between, and climb to the even towers either side
      const odd = t.even ? p.k + (s.rng() < 0.5 ? 1 : -1) : p.k, dir = (t.even ? p.k - odd : s.rng() < 0.5 ? 1 : -1) as 1 | -1;
      const foot = odd * BAY + dir * (PIER + 2);
      go(foot, FRONT); go(foot, FLOOR + 1);
      p.todo.push({ is: "climb", cx: odd * BAY, level: 0, dir, up: true, d: PIER + 2 });
      p.k = odd + dir;
    } else p.todo.push({ is: "board", up: true, beats: 0 });
  } else if (p.st === 1) {
    // down one of the two fixed flights that meet at this balcony
    const e = s.rng() < 0.5 ? 1 : -1;
    go(t.x + e * 10, ledge(1));
    p.todo.push({ is: "climb", cx: (p.k + e) * BAY, level: 0, dir: -e as 1 | -1, up: false, d: END - 2 });
    p.k += e;
  } else p.todo.push({ is: "board", up: false, beats: 0 });
}

/** One redraw's worth of everybody's business. `dt` is in beats. */
function live(s: State, f: number, dt: number) {
  s.f = f;
  // the flights that swing
  for (const t of towersIn(s.x0, s.x1)) mover(s, t.k, balcony(t));
  for (const m of s.movers.values()) {
    if (m.t0 < 0 && f >= m.next) m.t0 = f;
    let p = 0;
    if (m.t0 >= 0) {
      p = (f - m.t0) / SWING;
      if (p >= 1) { m.side = m.side > 0 ? -1 : 1; m.t0 = -1; m.next = f + 110 + Math.floor(s.rng() * 130); p = 0; }
    }
    const ease = p * p * (3 - 2 * p), from = m.side > 0 ? 0 : Math.PI;
    m.a = from + (Math.PI - 2 * from) * ease;
  }
  // people
  const cap = Math.max(8, Math.round((s.x1 - s.x0) / 28));
  if (s.people.length < cap && s.rng() < 0.05 * dt * 2) arrive(s);
  for (const p of s.people) {
    if (!p.todo.length) think(s, p);
    const d = p.todo[0];
    if (!d) continue;
    let done = false;
    switch (d.is) {
      case "fade":
        p.alpha = Math.max(0, Math.min(1, p.alpha + (d.to ? 1 : -1) * dt * 0.14));
        done = p.alpha === d.to;
        if (done && !d.to) p.gone = true;
        break;
      case "go": {
        const dx = d.x - p.x, dy = d.y - p.y, far = Math.hypot(dx, dy), step = PACE * dt;
        if (far <= step) { p.x = d.x; p.y = d.y; done = true; }
        else { p.x += (dx / far) * step; p.y += (dy / far) * step; p.steps += step; }
        break;
      }
      case "wait":
        done = (d.beats -= dt) <= 0;
        break;
      case "climb": {
        d.d += (d.up ? 1 : -1) * CLIMB * dt;
        p.steps += CLIMB * dt;
        if (d.up ? d.d >= END - 2 : d.d <= PIER + 2) {
          // off at the top onto the balcony, or at the bottom onto the floor
          done = true;
          p.st = d.up ? 1 : 0;
          p.x = d.up ? d.cx + d.dir * (END + 3) : d.cx + d.dir * (PIER + 2);
          p.y = d.up ? ledge(1) : FLOOR + 1;
          if (!d.up) p.todo.push({ is: "go", x: p.x, y: FRONT });
        }
        break;
      }
      case "board": {
        // going up, it is this balcony's own flight; going down, whichever neighbour's flight has come round to here
        const here = p.k * BAY;
        const ms = d.up ? [mover(s, p.k, p.st)] : [mover(s, p.k - 1, p.st - 1), mover(s, p.k + 1, p.st - 1)].filter((m) => m.x + m.side * BAY === here);
        const m = ms.find(docked);
        const edge = m ? here + (d.up ? m.side : -m.side) * 10 : here;
        if (Math.abs(p.x - edge) > 0.5) { p.x += Math.sign(edge - p.x) * Math.min(PACE * dt, Math.abs(edge - p.x)); p.steps += PACE * dt; }
        else if (m) { done = true; p.todo.push({ is: "ride", m, up: d.up, d: d.up ? PIER + 2 : END - 2 }); }
        // nothing coming? After a while, give up and go back in by the door here
        if (!done && (d.beats += dt) > 170) { done = true; p.want = p.st; }
        break;
      }
      case "ride": {
        const m = d.m, at = d.up ? END - 2 : PIER + 2, off = d.up ? d.d >= at : d.d <= at;
        if (!off) { d.d += (d.up ? 1 : -1) * CLIMB * dt; p.steps += CLIMB * dt; }
        else if (docked(m)) {
          // step off, wherever the flight has ended up
          done = true;
          p.k = d.up ? m.k + m.side : m.k;
          p.st = d.up ? m.st + 1 : m.st;
          if (p.st > 2) p.gone = true; // up and out of the picture
          p.x = d.up ? m.x + m.side * (END + 3) : m.x + m.side * 10;
          p.y = ledge(p.st);
        }
        break;
      }
      case "browse":
        if (!d.asked) {
          // the book they are after comes off a shelf and down to their hands
          d.asked = true;
          const [bx, by] = shelfNear(s, p.x);
          fly(s, bx, by, p.x, p.y - 9, SPINES[Math.floor(s.rng() * (SPINES.length - 1))], p);
        } else if (p.book !== undefined && (d.beats += dt) > 70) {
          done = true;
          if (s.rng() < 0.5) {
            // read enough: it goes back by itself
            const [bx, by] = shelfNear(s, p.x);
            fly(s, p.x, p.y - 9, bx, by, p.book);
            p.book = undefined;
          }
        }
        break;
    }
    if (done) p.todo.shift();
  }
  s.people = s.people.filter((p) => !p.gone && p.x > s.x0 - 3 * BAY && p.x < s.x1 + 3 * BAY);
  // books: the ones on an errand, and now and then one that simply shelves itself somewhere else or calls on a desk
  for (const b of s.books) if ((b.t += dt) >= b.dur && b.to) b.to.book = b.cover;
  s.books = s.books.filter((b) => b.t < b.dur);
  if (s.books.length < 2 + (s.x1 - s.x0) / 120 && s.rng() < 0.025 * dt * 2) {
    const x = s.x0 + s.rng() * (s.x1 - s.x0), [ax, ay] = shelfNear(s, x), cover = SPINES[Math.floor(s.rng() * (SPINES.length - 1))];
    if (s.rng() < 0.4) {
      // to or from the nearest reading desk
      const k = Math.round(x / PERIOD) * 2, dir = x >= k * BAY ? 1 : -1, dx = across(k * BAY, dir)(DESK, 15) + 7;
      if (s.rng() < 0.5) fly(s, ax, ay, dx, G + 140, cover); else fly(s, dx, G + 140, ax, ay, cover);
    } else { const [bx, by] = shelfNear(s, x + (s.rng() - 0.5) * 80); fly(s, ax, ay, bx, by, cover); }
  }
}

export const stairwell: Scene<State> = {
  w: W,
  h: H,
  fps: 12 * T,
  poster: 0,
  fluid: true,
  alt: "A library with moving stairs: stone towers with arched doors and balconies, three tiers of bookcases and tall windows behind, and pale flights of stairs crossing between the towers, some of which swing round to the other side. People come in through the doors, climb or come down, browse and leave again; books fly down to their hands, back to the shelves, and over to the readers at the desks.",
  camera: () => ({ x: 0, y: (HW * F) / 2, zoom: 1 }),
  init(rng, w) {
    const half = w / F / 2 + 12;
    const s: State = { f: 0, rng, x0: -half, x1: half, hall: null, light: [null, null], movers: new Map(), people: [], books: [] };
    // let the place fill up before anyone sees it
    for (let f = -420; f < 0; f += 0.5) live(s, f, 0.5);
    return s;
  },
  draw(g, tick, s, env, view) {
    const v = view ?? { x: -g.w / 2, y: 0, w: g.w, h: g.h }, f = tick / T;
    const cx = Math.floor(v.x / F), x1 = Math.ceil((v.x + v.w) / F), w = x1 - cx;
    if (f > s.f) live(s, f, 1 / T);
    const all = towersIn(cx, x1), ctx = g.ctx;
    ctx.save();
    ctx.translate(-v.x, -v.y);
    ctx.scale(F, F);
    s.hall ??= canvas(PERIOD * F, HW * F, (l) => { l.ctx.scale(F, F); paintHall(l); });
    for (let n = Math.floor(cx / PERIOD); n * PERIOD < x1; n++) ctx.drawImage(s.hall, n * PERIOD, 0, PERIOD, HW);

    // the readers at their desks
    for (const t of all) if (t.even) for (const dir of [1, -1]) {
      const dx = across(t.x, dir)(DESK, 15);
      person(g, dx + 7, G + 151, 900 + (t.k * 2 + dir) * 13, 0, G + 142);
      g.rect(dx, G + 142, 15, 2, C.oakHi); g.rect(dx + 1, G + 144, 13, 5, C.oakDk); g.rect(dx, G + 144, 1, 8, C.oak); g.rect(dx + 14, G + 144, 1, 8, C.oak);
      g.rect(dx + 5, G + 141, 5, 1, "#f4ecd8"); g.px(dx + 7, G + 141, "#b9ad92");
      const lamp = dir > 0 ? dx + 2 : dx + 12;
      g.rect(lamp, G + 138, 1, 4, C.giltDk); g.rect(lamp - 1, G + 136, 3, 2, "#2f8a5a");
    }

    // who is on which stairs
    const on = new Map<string, Walker[]>();
    const put = (key: string, d: number, look: number) => { const list = on.get(key) ?? []; list.push({ d, look }); on.set(key, list); };
    for (const p of s.people) {
      const d = p.todo[0];
      if (d?.is === "climb") put(d.cx + ":" + d.dir, d.d, p.look);
      else if (d?.is === "ride") put(d.m.k + ":m", d.d, p.look);
    }
    // the two flights from the ground floor stay where they are; the rest swing when their turn comes
    for (const t of all) if (!t.even) for (const dir of [1, -1] as const) stairs(g, t.x, 0, dir > 0 ? 0 : Math.PI, on.get(t.x + ":" + dir) ?? []);
    const moving = all.map((t) => mover(s, t.k, balcony(t))).sort((p, q) => Math.sin(p.a) - Math.sin(q.a) || p.st - q.st);
    for (const m of moving) stairs(g, m.x, m.st * STOREY, m.a, on.get(m.k + ":m") ?? []);

    // everyone on their feet: those on balconies behind the handrail, then those on the floor, nearest last
    const afoot = s.people.filter((p) => p.todo[0]?.is !== "climb" && p.todo[0]?.is !== "ride").sort((p, q) => p.y - q.y);
    const stand = (p: Person) => {
      ctx.globalAlpha = p.alpha;
      person(g, p.x, p.y, p.look, Math.floor(p.steps / 2.5));
      if (p.book !== undefined) fine(g, () => {
        // open in their hands
        const X = Math.round(F * p.x) + 1, Y = Math.round(F * p.y) - 14;
        g.rect(X - 4, Y, 9, 4, C.ink); g.rect(X - 3, Y, 3, 3, "#f4ecd8"); g.rect(X + 1, Y, 3, 3, "#f4ecd8"); g.rect(X - 3, Y + 3, 7, 1, p.book!);
      });
      ctx.globalAlpha = 1;
    };
    for (const p of afoot) if (p.st > 0) stand(p);
    for (const t of all) fine(g, () => { const L = F * (t.x - PIER), Y = F * (FLOOR - balcony(t) * STOREY); g.rect(L, Y - 9, F * PIER * 2, 1, "#fbf6e8"); g.rect(L, Y - 8, F * PIER * 2, 1, C.rail); g.rect(L, Y - 7, F * PIER * 2, 1, C.railDk); });
    for (const p of afoot) if (p.st === 0) stand(p);

    // books on the wing, flapping their covers
    fine(g, () => {
      for (const b of s.books) {
        const p = b.t / b.dur, e = p * p * (3 - 2 * p);
        const x = Math.round(F * (b.x0 + (b.x1 - b.x0) * e)), y = Math.round(F * (b.y0 + (b.y1 - b.y0) * e - Math.sin(p * Math.PI) * b.arc));
        if (Math.floor(f / 2) % 2) {
          g.rect(x - 5, y - 2, 2, 1, b.cover); g.rect(x + 4, y - 2, 2, 1, b.cover); g.rect(x - 4, y - 1, 3, 2, "#f4ecd8"); g.rect(x + 2, y - 1, 3, 2, "#f4ecd8");
          g.rect(x - 2, y + 1, 5, 1, b.cover); g.rect(x - 1, y, 3, 1, "#d8cdb4");
        } else { g.rect(x - 5, y, 11, 2, "#f4ecd8"); g.rect(x, y, 1, 2, "#d8cdb4"); g.rect(x - 5, y + 2, 11, 1, b.cover); }
        g.px(x - 1 + ((f * 3) % 3), y + 4 + (Math.floor(f) % 3), "#ffe9a8", 0.7);
      }
    });

    // The hall is dim away from its lamps: shade everything, then put light back where there is some.
    // The lamps do not move, so their light is painted once per stretch of hall and laid over the lot.
    g.rect(cx, 0, w, HW, env.night ? "#060a1e" : "#1c1226", env.night ? 0.5 : 0.2);
    const which = env.night ? 1 : 0;
    s.light[which] ??= canvas(PERIOD * F, HW * F, (l) => paintLight(l, env.night));
    ctx.globalCompositeOperation = "screen";
    for (let n = Math.floor(cx / PERIOD); n * PERIOD < x1; n++) ctx.drawImage(s.light[which]!, n * PERIOD, 0, PERIOD, HW);
    fine(g, () => {
      // dust turning in the light from the tall windows
      for (const t of all) if (t.even) for (const dir of [1, -1]) {
        const [wx, top, end, lean] = shaft(across(t.x, dir)(42), dir);
        for (let i = 0; i < 12; i++) {
          const p = (f * 0.004 + hash(i, t.k + dir, 95)) % 1;
          g.px(wx - 12 + hash(i, t.k + dir, 96) * 24 + lean * p + Math.sin(f * 0.05 + i) * 2, top + p * (end - top), "#fff8e0", (1 - p) * 0.8);
        }
      }
    });
    ctx.globalCompositeOperation = "source-over";
    // the lantern flames and lamp shades themselves, crisp on top of their glow
    fine(g, () => {
      for (const t of all) for (const row of lanterns(t)) for (const sgn of [-1, 1]) {
        const x = F * (t.x + sgn * 10) + 1, y = F * row;
        g.rect(x - 1, y - 1, 2, 6, "#ffc04a"); g.rect(x - 1, y + (Math.floor(f / 4 + x) % 5 ? 1 : 0), 2, 3, "#fff3c4");
      }
    });
    if (env.night) for (const t of all) if (t.even) for (const dir of [1, -1]) windowAt(g, across(t.x, dir)(42), SILL, WINDOW_H, true, f);
    for (const t of all) if (t.even) for (const dir of [1, -1]) { const lamp = across(t.x, dir)(DESK, 15) + (dir > 0 ? 2 : 12); g.rect(lamp - 1, G + 136, 3, 2, "#5fd08c"); }
    ctx.restore();
  },
  /** A tap sends the nearest flight that is free to move round to its other side. */
  pointer(s, px, py) {
    const x = px / F, y = py / F;
    let best: Mover | null = null, bestD = Infinity;
    for (const m of s.movers.values()) {
      if (!docked(m)) continue;
      const d = Math.hypot(x - (m.x + m.side * BAY / 2), y - (FLOOR - m.st * STOREY - STOREY / 2));
      if (d < bestD) { bestD = d; best = m; }
    }
    if (!best) return false;
    best.next = s.f;
    rumble();
    return true;
  },
};
