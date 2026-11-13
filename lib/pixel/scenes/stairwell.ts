import { Gfx, hash, type Rng, type Scene } from "../engine";
import { chime, pluck, rumble, whoosh } from "@/lib/audio";

// The grand staircase, seen from the front like a stage set, with the library
// along its lower floors. Stone towers stand along the hall, each with arched
// doors and balconies; pale flights of stairs cross the gaps between them, and
// above the ground floor every one of them swings round to the other side when
// it feels like it, carrying whoever is on it. The walls are two tiers of
// bookcases below and portraits above, and the portraits are alive: they look
// about, visit each other's frames and pass remarks. One of them, a lady in a
// white gown, is a door, and wants the password. Ghosts drift through, books
// fly themselves back to their shelves, and the people on the balconies send
// spells across the hall.
//
// The hall is much bigger than the picture. It is eight storeys tall, under a
// vault open to the night sky, and it goes on sideways for ever, the same pair
// of towers over and over. The picture is a window that travels: it rests on
// the ground floor, climbs, slides along, rises to the vault and comes down
// again further along the hall.

const W = 390, H = 250; // the window at zoom 1, in pixels
const F = 2; // the hall is laid out in units and drawn twice as fine: two pixels to a unit
const T = 2; // the world is redrawn twice per beat (a beat is a twelfth of a second)
const HW = 360; // the hall, floor to vault, in units
const BAY = 110; // tower to tower
const PERIOD = 2 * BAY; // the hall repeats every two towers
const PIER = 13; // half the width of a tower
const RUN = BAY - 2 * PIER; // how far a flight travels
const STEPS = 21, GOING = 4, RISE = 2; // each step: 4 along, 2 up
const STOREY = STEPS * RISE;
const TOP_STOREY = 7; // the highest balconies
const FLOOR = HW - 10; // row of the floor at the towers' front face
const G = FLOOR - 156; // rows of the ground-floor furniture are written as G + something
const K = 0.25; // one unit of depth toward the viewer moves a point this far down the picture
const DEEP = 20; // stairs and balconies are this deep
const WALL_BASE = FLOOR - 10; // the back wall stands 40 units behind the towers
const RAIL = 9; // height of a handrail
const VAULT = 36; // the towers end here; above is the vault

// The camera's lap, as a game would cut it: a wide shot of the ground floor,
// in close on the lady while she lets her caller in, back out and up the
// stairs, along the hall, up to the vault, and down to the next lady's door.
// Times are milliseconds into the lap; positions are units, with the lap's
// own starting column as zero. A shot is clamped so it never looks outside
// the hall, which is how "as low as it goes" and "as high" are written.
const LAP_MS = 30000;
const LADY_Y = FLOOR - STOREY - 13;
const SHOTS = [
  { ms: 0, x: 0, y: Infinity, zoom: 0.8 },
  { ms: 2500, x: 0, y: Infinity, zoom: 0.8 },
  { ms: 4500, x: 11, y: LADY_Y, zoom: 1.6 },
  { ms: 11500, x: 11, y: LADY_Y, zoom: 1.6 },
  { ms: 14000, x: 0, y: FLOOR - 3 * STOREY - 10, zoom: 0.9 },
  { ms: 15500, x: 0, y: FLOOR - 3 * STOREY - 10, zoom: 0.9 },
  { ms: 19500, x: PERIOD, y: FLOOR - 3.5 * STOREY, zoom: 1.1 },
  { ms: 20500, x: PERIOD, y: FLOOR - 3.5 * STOREY, zoom: 1.1 },
  { ms: 23500, x: PERIOD, y: -Infinity, zoom: 0.9 },
  { ms: 25500, x: PERIOD, y: -Infinity, zoom: 0.9 },
  { ms: LAP_MS, x: 2 * PERIOD, y: Infinity, zoom: 0.8 },
];
/** Where the camera is at a given moment: the middle of its view (in pixels) and its zoom. */
function camera(ms: number, _cols: number, rows: number) {
  const lap = Math.floor(ms / LAP_MS), t = ms - lap * LAP_MS;
  let i = 0;
  while (i < SHOTS.length - 2 && t >= SHOTS[i + 1].ms) i++;
  const a = SHOTS[i], b = SHOTS[i + 1], p = Math.min(1, Math.max(0, (t - a.ms) / (b.ms - a.ms)));
  const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; // ease in and out
  const inside = (y: number, zoom: number) => { const half = rows / zoom / F / 2; return Math.max(half, Math.min(HW - half, y)); };
  const zoom = a.zoom + (b.zoom - a.zoom) * e, ya = inside(a.y, a.zoom), yb = inside(b.y, b.zoom);
  return { x: (lap * 2 * PERIOD + a.x + (b.x - a.x) * e) * F, y: inside(ya + (yb - ya) * e, zoom) * F, zoom };
}
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
const CANVAS = ["#2e2a3a", "#33402f", "#4a2a26", "#27333f", "#3d3020"];
// old paint: what the sitters in the portraits wear is duller than what the living wear
const PAINT = ["#7a3432", "#2c5a48", "#3f4482", "#96783a", "#5c3560", "#b9b2a4", "#3a3a40"];
const MAGIC = ["#ff7a6b", "#6fe394", "#74baff", "#ffd96a", "#c996ff", "#7ff0e6"];

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
function docked(g: Gfx, cx: number, level: number, dir: 1 | -1, walkers: Walker[]) {
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
/** The towers whose stairs could show between two columns of the hall. */
function towersIn(x0: number, x1: number): Tower[] {
  const out: Tower[] = [];
  for (let k = Math.floor(x0 / BAY) - 1; k <= Math.ceil(x1 / BAY) + 1; k++) out.push({ k, x: k * BAY, even: k % 2 === 0 });
  return out;
}
/** Which storeys a tower has a balcony on: the odd ones for even towers, the even ones for the towers between. */
const storeys = (t: { even: boolean }) => (t.even ? [1, 3, 5, 7] : [2, 4, 6]);
const DESK = 7; // where the reading desk stands, measured from the even tower
/** A way of placing things in a gap, measured outward from its even tower at `x`, so that left mirrors right. */
const across = (x: number, dir: number) => (u: number, wd = 0) => (dir > 0 ? x + PIER + u : x - PIER - u - wd);
// floating candles in each gap, all the way up: [distance from the even tower, row]
const CANDLES: [number, number][] = [];
for (let row = 46, i = 0; row < FLOOR - 26; row += 14, i++) CANDLES.push([6 + Math.floor(hash(i, 1, 60) * 72), row + Math.floor(hash(i, 2, 60) * 9)]);
// tall windows in the back wall: the rows their sills are on
const WINDOWS = [WALL_BASE - 88, WALL_BASE - 88 - 3 * STOREY];
const WINDOW_H = 54;
/** The row where the vault's stone meets the sky, above column `x` of the hall. Its arches spring from tower to tower. */
function vaultRow(x: number) {
  const m = ((x % BAY) + BAY) % BAY, d = Math.min(m, BAY - m);
  return d <= PIER ? VAULT - 14 : Math.round(VAULT - 30 * Math.sin(((d - PIER) / (BAY / 2 - PIER)) * (Math.PI / 2)));
}

// --- the portraits ---------------------------------------------------------
type Portrait = { x: number; y: number; w: number; h: number; frame: number; bg: number; look: number; seed: number; mate: number; caller: number };

/**
 * Hang portraits edge to edge over the upper walls of one stretch of hall (it
 * repeats), and pair some off as neighbours who visit.
 */
function hang(): Portrait[] {
  const out: Portrait[] = [];
  for (const [ox, dir] of [[0, 1], [PERIOD, -1]]) {
    const X = across(ox, dir);
    // either side of the windows all the way up, and between the windows where there is room
    const fields = [[1, 32, 42, G + 60], [52, 83, 42, G + 60], [34, 50, 42, WINDOWS[1] - WINDOW_H - 4], [34, 50, WINDOWS[1] + 5, WINDOWS[0] - WINDOW_H - 4]];
    fields.forEach(([u0, u1, top, end], fi) => {
      const seed = 40 + fi * 5;
      let y = top, row = 0;
      while (y + 9 <= end) {
        const rowH = Math.min(end - y, 10 + Math.floor(hash(row, seed, 11) * 6));
        let u = u0 + Math.floor(hash(row, seed, 12) * 2), n = 0, prev = -1;
        while (u + 7 <= u1) {
          const id = row * 9 + n + fi * 500;
          const fw = Math.min(u1 - u, 7 + Math.floor(hash(id, seed, 13) * 6));
          const fh = Math.max(9, rowH - Math.floor(hash(id, seed, 14) * 3));
          out.push({
            x: X(u, fw), y: y + Math.floor((rowH - fh) / 2), w: fw, h: fh, mate: -1, caller: -1,
            frame: hash(id, seed, 15) < 0.7 ? 0 : hash(id, seed, 15) < 0.88 ? 1 : 2,
            bg: Math.floor(hash(id, seed, 16) * (CANVAS.length + 2)), look: Math.floor(hash(id, seed, 17) * 9973) + (dir > 0 ? 0 : 5000), seed: id * 31 + seed * 7 + (dir > 0 ? 0 : 3),
          });
          if (prev >= 0 && hash(id, seed, 19) < 0.45) out[prev].mate = out.length - 1;
          prev = out.length - 1;
          u += fw + 1 + Math.floor(hash(id, seed, 18) * 2);
          n++;
        }
        y += rowH + 1;
        row++;
      }
    });
  }
  out.forEach((p, i) => { if (p.mate >= 0) out[p.mate].caller = i; });
  return out;
}

/** The painted part of a portrait, inside its frame, in pixels. */
const canvasOf = (p: Portrait, px: number) => ({ x: F * px + 4, y: F * p.y + 4, w: F * p.w - 8, h: F * p.h - 8 });

type Patch = { x: number; y: number; w: number; h: number };
/** Whoever lives in a portrait, painted into the patch `a`, `dx` pixels to one side of its middle and cut off at its edges. */
function paintSitter(g: Gfx, a: Patch, look: number, dx: number, blink: boolean) {
  const x1 = a.x + a.w, y1 = a.y + a.h;
  const R = (x: number, y: number, rw: number, rh: number, c: string) => {
    const l = Math.max(a.x, x), r = Math.min(x1, x + rw), t = Math.max(a.y, y), b = Math.min(y1, y + rh);
    if (r > l && b > t) g.rect(l, t, r - l, b - t, c);
  };
  const mx = a.x + Math.floor(a.w / 2) + dx, top = a.y + (a.h > 16 ? 3 : 1);
  const robe = pick(PAINT, look, 3), robeDk = tint(robe, 0.75), kind = Math.floor(hash(look, 0, 50) * 5);
  const hair = pick(HAIRS, look, 1), skin = pick(SKINS, look, 2), skinDk = tint(skin, 0.8);
  // shoulders first, then the head on top of them
  R(mx - 3, top + 8, 7, 2, robe); R(mx - 5, top + 9, 11, a.h, robe); R(mx - 7, top + 12, 15, a.h, robe);
  R(mx + 3, top + 9, 3, a.h, robeDk); R(mx + 5, top + 12, 3, a.h, robeDk);
  R(mx - 1, top + 8, 3, 3, "#d8cfb8"); R(mx, top + 11, 1, a.h, tint(robe, 1.25));
  R(mx - 1, top + 7, 3, 1, skinDk);
  R(mx - 2, top + 1, 5, 6, skin); R(mx + 2, top + 2, 1, 4, skinDk);
  if (!blink) { R(mx - 1, top + 3, 1, 1, C.ink); R(mx + 1, top + 3, 1, 1, C.ink); }
  R(mx, top + 5, 1, 1, skinDk);
  if (kind === 0) { R(mx - 3, top, 7, 1, robeDk); R(mx - 1, top - 2, 3, 2, robeDk); R(mx, top - 3, 1, 1, robeDk); } // a hat
  else {
    R(mx - 2, top, 5, 2, hair); R(mx - 3, top + 1, 1, kind === 2 ? 7 : 3, hair); R(mx + 3, top + 1, 1, kind === 2 ? 7 : 3, hair);
    if (kind === 3) { R(mx - 2, top + 5, 5, 2, hair); R(mx - 1, top + 7, 3, 2, hair); } // a beard
    if (kind === 4) { R(mx - 3, top - 1, 7, 2, "#e9e2d0"); R(mx - 3, top + 1, 1, 6, "#e9e2d0"); R(mx + 3, top + 1, 1, 6, "#cfc7b2"); } // a white cap or wig
  }
}
const SITTER_KEPT = new Map<string, HTMLCanvasElement>();
/**
 * Whoever lives in a portrait, `dx` units to one side of its middle. Sitting
 * still (which is most of the time) they are painted once and kept.
 */
function sitter(g: Gfx, p: Portrait, px: number, look: number, dx: number, blink: boolean) {
  fine(g, () => {
    const a = canvasOf(p, px);
    if (dx !== 0) return paintSitter(g, a, look, Math.round(dx * F), blink);
    const key = a.w + "x" + a.h + ":" + look + (blink ? "b" : "");
    let kept = SITTER_KEPT.get(key);
    if (!kept) {
      if (SITTER_KEPT.size > 900) SITTER_KEPT.clear();
      SITTER_KEPT.set(key, (kept = canvas(a.w, a.h, (l) => paintSitter(l, { x: 0, y: 0, w: a.w, h: a.h }, look, 0, blink))));
    }
    g.ctx.drawImage(kept, a.x, a.y);
  });
}

/**
 * The portrait that is a door, shut: an arched gilt frame; sky, leaves
 * overhead, cypresses and a little temple on a hill; and on the steps a lady
 * in a white gown with a wreath in her dark hair. Placed in units, drawn in
 * pixels, about 35 by 58.
 */
function ladyPortrait(g: Gfx, x: number, y: number, singing: boolean, f: number) {
  fine(g, () => {
    const X = F * x + 1, Y = F * y, skin = "#e6b990", skinDk = "#c9966b", hair = "#2a1c14", white = "#f3eee2", fold = "#cfc6b4", foldDk = "#b3a994";
    arch(g, X, Y, 35, 58, C.giltDk); arch(g, X, Y, 33, 57, C.gilt); arch(g, X - 1, Y, 31, 56, C.giltHi); arch(g, X, Y, 31, 55, C.gilt);
    arch(g, X, Y - 2, 27, 53, C.giltDk);
    // sky, clouds, and leaves hanging in at the top
    arch(g, X, Y - 3, 25, 51, "#8fb9d6");
    g.rect(X - 12, Y - 40, 25, 8, "#a9cfe3"); g.rect(X - 12, Y - 34, 25, 6, "#cfe6ee");
    g.rect(X - 4, Y - 44, 7, 2, "#f2f8fa"); g.rect(X - 2, Y - 45, 4, 1, "#f2f8fa"); g.rect(X + 5, Y - 39, 5, 1, "#f2f8fa");
    for (const [dx, dy, w] of [[-9, -49, 5], [-11, -47, 4], [-12, -45, 3], [5, -49, 5], [8, -47, 4], [10, -45, 2], [-8, -46, 2], [6, -45, 2]]) g.rect(X + dx, Y + dy, w, 2, (dx + dy) % 2 ? "#3f6f34" : "#5c8f45");
    // the hill, the temple and two cypresses
    g.rect(X - 12, Y - 29, 25, 7, "#7fa05c"); g.rect(X - 12, Y - 29, 25, 1, "#9bb873"); g.rect(X - 12, Y - 25, 12, 3, "#6b8c4c");
    g.rect(X + 4, Y - 35, 8, 6, "#f1e8d2"); g.rect(X + 3, Y - 37, 10, 2, "#dccfb0"); g.rect(X + 5, Y - 38, 6, 1, "#dccfb0"); g.rect(X + 7, Y - 39, 2, 1, "#dccfb0");
    for (let i = 0; i < 4; i++) g.rect(X + 5 + i * 2, Y - 35, 1, 6, "#b9ad92");
    g.rect(X - 11, Y - 39, 2, 11, "#2f5a34"); g.rect(X - 10, Y - 41, 1, 2, "#2f5a34"); g.rect(X - 8, Y - 35, 2, 7, "#3a6a3c");
    // the steps she sits on
    g.rect(X - 12, Y - 22, 25, 19, "#d8ceb6"); g.rect(X - 12, Y - 22, 25, 1, "#ebe3cf");
    g.rect(X - 12, Y - 15, 25, 1, "#b3a88e"); g.rect(X - 12, Y - 14, 25, 1, "#ebe3cf"); g.rect(X - 12, Y - 8, 25, 1, "#b3a88e"); g.rect(X - 12, Y - 7, 25, 1, "#ebe3cf");
    // the gown: bodice, lap, and skirts spreading over the steps
    g.rect(X - 6, Y - 30, 13, 8, white); g.rect(X - 8, Y - 23, 17, 12, white); g.rect(X - 10, Y - 13, 21, 10, white);
    g.rect(X + 4, Y - 30, 3, 8, fold); g.rect(X + 6, Y - 23, 3, 12, fold); g.rect(X + 8, Y - 13, 3, 10, fold);
    for (const [dx, dy, h] of [[-5, -21, 16], [-1, -19, 15], [3, -22, 18], [-8, -11, 7]]) { g.rect(X + dx, Y + dy, 1, h, fold); g.rect(X + dx + 1, Y + dy + 2, 1, h - 3, foldDk, 0.5); }
    g.rect(X - 6, Y - 24, 13, 1, foldDk); g.rect(X - 10, Y - 4, 21, 1, foldDk);
    // shoulders, arms, and her head on one side
    g.rect(X - 4, Y - 33, 9, 4, skin); g.rect(X - 2, Y - 30, 5, 1, skinDk);
    g.rect(X - 8, Y - 31, 3, 11, skin); g.rect(X - 8, Y - 31, 1, 11, skinDk); g.rect(X - 7, Y - 21, 4, 3, skin);
    if (singing) {
      // a glass raised, and a note held
      g.rect(X + 6, Y - 31, 3, 4, skin); g.rect(X + 8, Y - 40, 2, 10, skin); g.rect(X + 9, Y - 40, 1, 10, skinDk);
      g.rect(X + 7, Y - 46, 5, 4, "#e4f6ff"); g.rect(X + 8, Y - 45, 3, 2, "#b84a5a"); g.rect(X + 9, Y - 42, 1, 2, "#e4f6ff");
    } else { g.rect(X + 6, Y - 31, 3, 9, skin); g.rect(X + 8, Y - 31, 1, 9, skinDk); g.rect(X + 3, Y - 23, 5, 3, skin); }
    g.rect(X - 1, Y - 35, 3, 2, skinDk);
    g.rect(X - 3, Y - 42, 7, 8, skin); g.rect(X + 3, Y - 41, 1, 6, skinDk); g.rect(X - 2, Y - 34, 5, 1, skin);
    g.px(X - 2, Y - 39, C.ink); g.px(X + 2, Y - 39, C.ink); g.px(X - 2, Y - 40, hair); g.px(X + 2, Y - 40, hair);
    g.px(X - 3, Y - 37, "#e39a8c"); g.px(X + 3, Y - 37, "#e39a8c");
    if (singing && Math.floor(f / 3) % 2) g.rect(X - 1, Y - 37, 3, 2, "#4a1612"); else g.rect(X - 1, Y - 36, 3, 1, "#a8402f");
    // dark curls, and a wreath of leaves and flowers
    g.rect(X - 4, Y - 45, 9, 4, hair); g.rect(X - 5, Y - 44, 2, 9, hair); g.rect(X + 4, Y - 44, 2, 9, hair); g.rect(X - 6, Y - 41, 1, 5, hair); g.rect(X + 6, Y - 41, 1, 5, hair);
    g.px(X - 3, Y - 44, "#5a4030"); g.px(X + 2, Y - 43, "#5a4030");
    for (let i = 0; i < 9; i++) g.px(X - 4 + i, Y - 46 + (i % 3 === 1 ? 1 : 0), i % 3 === 0 ? "#e58aa6" : i % 3 === 1 ? "#4f8a3f" : "#7bb060");
  });
}

const LADY_EVERY = 4; // the lady's portrait hangs on every fourth tower
const LADY_STOREY = 1; // on the balcony over the great door, in the middle of the opening picture
const LADY_LAP = (LAP_MS / 1000) * 12; // her exchange keeps time with the camera's lap
const LADY_AT = 48; // the beat of each lap on which she notices her caller, just as the camera closes in

/** Everything that never moves, for one stretch of the hall: walls, floor, vault, towers, balconies. */
function paintHall(l: Gfx, hung: Portrait[]) {
  /** how far column `x` is from the nearest even tower */
  const from = (x: number) => Math.min(x, PERIOD - x);
  l.rect(0, 0, PERIOD, HW, C.wall);
  // the back wall, in courses of stone
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
  // the vault: pointed arches from tower to tower, and above them the night sky
  for (let x = 0; x < PERIOD; x++) {
    const top = vaultRow(x);
    for (let y = 0; y < top; y++) l.px(x, y, y < 10 ? "#10153a" : y < 22 ? "#182050" : "#232c66");
    l.rect(x, top, 1, 2, C.mouldHi); l.rect(x, top + 2, 1, 1, C.mould);
    for (let i = 0; i < 8; i++) l.px(x, top + 3 + i, "#0d0906", (8 - i) * 0.05);
  }

  // the frames, bevelled, and their painted backgrounds; whoever lives in them is drawn every frame
  fine(l, () => {
    for (const p of hung) {
      const X = F * p.x, Y = F * p.y, wd = F * p.w, ht = F * p.h, a = canvasOf(p, p.x);
      const [edge, body, lit] = [[C.giltDk, C.gilt, C.giltHi], ["#5e4516", C.giltDk, C.gilt], ["#1c120b", "#3a2616", "#5a3d24"]][p.frame];
      l.rect(X, Y, wd, ht, edge); l.rect(X + 1, Y + 1, wd - 2, ht - 2, body);
      l.rect(X + 1, Y + 1, wd - 2, 1, lit); l.rect(X + 1, Y + 1, 1, ht - 2, lit);
      l.rect(X + 3, Y + 3, wd - 6, ht - 6, edge);
      if (p.bg < CANVAS.length) {
        // old varnish: lighter toward the top, dark along the bottom
        l.rect(a.x, a.y, a.w, a.h, CANVAS[p.bg]);
        l.rect(a.x, a.y, a.w, Math.floor(a.h / 3), tint(CANVAS[p.bg], 1.12));
        l.rect(a.x, a.y + a.h - 2, a.w, 2, tint(CANVAS[p.bg], 0.8));
      } else {
        // some sit out of doors: sky, a far hill, a tree
        const out = p.bg === CANVAS.length, half = Math.floor(a.h * 0.55);
        l.rect(a.x, a.y, a.w, a.h, out ? "#6f8fa0" : "#c0905e"); l.rect(a.x, a.y + half - 3, a.w, 3, out ? "#93adb8" : "#d8ab78");
        l.rect(a.x, a.y + half, a.w, a.h - half, out ? "#3f5a3a" : "#5a3f2a"); l.rect(a.x, a.y + half, a.w, 1, out ? "#56764a" : "#75553a");
        l.rect(a.x + 1, a.y + half - 5, 2, 5, out ? "#2c4a30" : "#3f2c1c"); l.rect(a.x, a.y + half - 7, 4, 3, out ? "#35583a" : "#4a3422");
      }
    }
  });

  // the gaps between towers, each drawn outward from its even tower so that left mirrors right
  for (const [ox, dir] of [[0, 1], [PERIOD, -1]]) {
    const X = across(ox, dir);
    const R = (u: number, y: number, rw: number, rh: number, c: string) => l.rect(X(u, rw), y, rw, rh, c);
    for (const sill of WINDOWS) windowAt(l, X(42), sill, WINDOW_H, false);
    // the library: two tiers of bookcases, the upper one reached from a gallery with a brass rail
    const shelves = (top: number, n: number, sd: number) => {
      R(0, top, RUN, n * 6, "#22150c");
      fine(l, () => {
        const span = RUN * F;
        const P = (u: number, y: number, rw: number, rh: number, c: string) => l.rect(dir > 0 ? F * (ox + PIER) + u : F * (ox - PIER) - u - rw, y, rw, rh, c);
        for (let shelf = 0; shelf < n; shelf++) {
          const base = F * (top + shelf * 6) + 10; // the board the books stand on
          P(0, base, span, 1, C.oakHi); P(0, base + 1, span, 1, C.oak);
          P(0, base - 10, span, 2, "#150c06"); // the shadow of the shelf above
          for (let u = 1; u < span - 4; ) {
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
        for (let u = 0; u <= span - 4; u += 42) {
          const x = Math.min(u, span - 4);
          P(x, F * top, 4, n * 12, C.oak); P(x, F * top, 1, n * 12, C.oakHi); P(x + 3, F * top, 1, n * 12, C.oakDk);
        }
      });
    };
    R(0, G + 62, RUN, 3, C.oakDk); R(0, G + 62, RUN, 1, C.oakHi);
    shelves(G + 65, 6, 40);
    R(0, G + 101, RUN, 4, C.oakDk); R(0, G + 101, RUN, 1, C.oakHi);
    for (let u = 3; u < RUN; u += 7) R(u, G + 95, 1, 6, C.giltDk);
    R(0, G + 94, RUN, 1, C.gilt);
    shelves(G + 105, 5, 49);
    R(0, G + 135, RUN, 11, C.oak); R(0, G + 135, RUN, 1, C.oakHi);
    for (let u = 3; u < RUN - 6; u += 10) R(u, G + 138, 7, 6, C.oakDk);
  }

  for (let k = -1; k <= 3; k++) {
    const x = k * BAY, even = k % 2 === 0, top = VAULT - 14;
    // the tower: lighter stone, shaded evenly down both edges
    l.rect(x - PIER, top, PIER * 2, FLOOR - top, C.pier);
    l.rect(x - PIER, top, 2, FLOOR - top, C.pierDk); l.rect(x + PIER - 2, top, 2, FLOOR - top, C.pierDk);
    l.rect(x - PIER + 2, top, 1, FLOOR - top, C.pierHi); l.rect(x + PIER - 3, top, 1, FLOOR - top, C.pierHi);
    fine(l, () => {
      // courses of dressed stone: a dark joint with a lit edge under it, and a few stones weathered darker or paler
      const L = F * (x - PIER) + 6, wd = F * PIER * 2 - 12;
      for (let y = F * FLOOR - 12, row = 0; y > F * top + 8; y -= 12, row++) {
        l.rect(L, y, wd, 1, C.pierDk); l.rect(L, y + 1, wd, 1, C.pierHi, 0.5);
        for (const j of row % 2 ? [-10, 10] : [-20, 0, 20]) { l.rect(F * x + j, y + 1, 1, 11, C.pierDk, 0.8); l.rect(F * x + j + 1, y + 2, 1, 10, C.pierHi, 0.35); }
        for (let i = 0; i < 2; i++) {
          const h = hash(row, i + (even ? 0 : 7), 44);
          if (h < 0.5) l.rect(L + Math.floor(h * 2 * (wd - 10)), y + 2, 9, 9, h < 0.25 ? C.pierDk : C.pierHi, 0.18);
        }
      }
    });
    l.rect(x - PIER - 1, FLOOR - 5, PIER * 2 + 2, 5, C.pierDk); l.rect(x - PIER - 1, FLOOR - 5, PIER * 2 + 2, 1, C.pierHi);
    l.rect(x - PIER - 1, top, PIER * 2 + 2, 3, C.pierHi); l.rect(x - PIER - 1, top + 3, PIER * 2 + 2, 1, C.pierDk); // where the vault springs from

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
    /** where a storey has no door: a suit of armour in a niche, or one very large picture */
    const niche = (base: number) => fine(l, () => {
      const X = F * x + 1, B = F * base - 6, st = "#aab4bf", dk = "#69727e", hi = "#dfe6ec";
      arch(l, X, B, 27, 37, C.pierDk); arch(l, X, B, 23, 35, "#241a12"); arch(l, X, B, 17, 29, "#30241a");
      l.rect(X - 2, B - 27, 5, 2, "#a8362e"); l.rect(X - 1, B - 29, 2, 2, "#c8473c"); // a plume
      l.rect(X - 3, B - 25, 7, 6, st); l.rect(X - 3, B - 25, 1, 6, hi); l.rect(X - 2, B - 23, 5, 1, C.dark); l.rect(X + 3, B - 25, 1, 6, dk); // helmet and visor
      l.rect(X - 5, B - 19, 11, 3, st); l.rect(X - 4, B - 16, 9, 7, st); l.rect(X - 4, B - 16, 1, 7, hi); l.rect(X + 3, B - 16, 2, 7, dk); l.rect(X, B - 16, 1, 7, dk); // shoulders and breastplate
      l.rect(X - 6, B - 17, 2, 9, dk); l.rect(X + 5, B - 17, 2, 9, dk);
      l.rect(X - 3, B - 9, 3, 8, st); l.rect(X + 1, B - 9, 3, 8, st); l.rect(X - 3, B - 5, 3, 1, dk); l.rect(X + 1, B - 5, 3, 1, dk); l.rect(X - 4, B - 1, 4, 1, dk); l.rect(X + 1, B - 1, 4, 1, dk);
      l.rect(X + 7, B - 30, 1, 30, "#6b4423"); l.rect(X + 6, B - 33, 3, 4, hi); l.rect(X + 8, B - 31, 2, 2, st); // a halberd
      l.rect(X - 9, B, 19, 2, C.pierHi);
    });
    const picture = (base: number, look: number) => fine(l, () => {
      const X = F * x + 1, T0 = F * (base - 23), bg = CANVAS[look % CANVAS.length];
      const skin = pick(SKINS, look, 2), hair = pick(HAIRS, look, 1), robe = pick(PAINT, look, 3);
      l.rect(X - 15, T0, 31, 38, C.giltDk); l.rect(X - 14, T0 + 1, 29, 36, C.gilt); l.rect(X - 14, T0 + 1, 29, 1, C.giltHi); l.rect(X - 14, T0 + 1, 1, 36, C.giltHi); l.rect(X - 12, T0 + 3, 25, 32, C.giltDk);
      l.rect(X - 11, T0 + 4, 23, 30, bg); l.rect(X - 11, T0 + 4, 23, 10, tint(bg, 1.15));
      l.rect(X - 8, T0 + 18, 17, 16, robe); l.rect(X - 5, T0 + 16, 11, 2, robe); l.rect(X + 4, T0 + 18, 5, 16, tint(robe, 0.75));
      l.rect(X - 2, T0 + 15, 5, 4, "#e9e2d0"); l.rect(X - 1, T0 + 14, 3, 2, tint(skin, 0.8));
      l.rect(X - 3, T0 + 7, 7, 8, skin); l.rect(X + 3, T0 + 8, 1, 6, tint(skin, 0.8)); l.px(X - 2, T0 + 10, C.ink); l.px(X + 2, T0 + 10, C.ink); l.rect(X - 1, T0 + 13, 3, 1, tint(skin, 0.6));
      l.rect(X - 3, T0 + 5, 7, 3, hair); l.rect(X - 4, T0 + 6, 1, 6, hair); l.rect(X + 4, T0 + 6, 1, 6, hair);
    });
    const lantern = (lx: number, ly: number) => fine(l, () => {
      const X = F * lx + 1, Y = F * ly;
      l.rect(X - 1, Y - 6, 2, 3, C.dark); l.rect(X - 3, Y - 3, 6, 1, C.dark); l.rect(X - 2, Y - 2, 4, 8, "#2a1c12"); l.rect(X - 1, Y - 1, 2, 6, C.glow);
      l.rect(X - 3, Y + 6, 6, 1, C.dark); l.rect(X - 1, Y + 7, 2, 1, C.dark);
    });

    const has = storeys({ even });
    doorAt(FLOOR, even ? 17 : 13, even ? 26 : 21, even);
    for (const sgn of [-1, 1]) lantern(x + sgn * 10, FLOOR - 22);
    for (let st = 1; st <= TOP_STOREY; st++) {
      const y = FLOOR - st * STOREY;
      if (!has.includes(st)) { if (st % 4 === 1 || st === 4) niche(y); else picture(y, 700 + st * 13 + (even ? 0 : 5)); continue; }
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

function canvas(w: number, h: number, paint: (g: Gfx) => void) {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d");
  if (ctx) paint(new Gfx(ctx, w, h));
  return cv;
}

// --- things that move ------------------------------------------------------
type Mover = { k: number; x: number; level: number; side: 1 | -1; t0: number; next: number; look: number };
type Ghost = { x: number; y: number; v: number; kind: number; phase: number; hurry: number };
type Spell = { x0: number; y0: number; x1: number; y1: number; t: number; dur: number; col: string };
type Part = { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string };
type Caster = { x: number; y: number; look: number; side: number };
type Say = { x: number; y: number; text: string; until: number };
type State = {
  f: number; rng: Rng; cx: number; cy: number; w: number;
  hall: HTMLCanvasElement | null; light: (HTMLCanvasElement | null)[]; ladyArt: HTMLCanvasElement | null;
  movers: Map<string, Mover>; ladies: Map<number, number>;
  hung: Portrait[]; ghosts: Ghost[]; spells: Spell[]; parts: Part[]; casters: Caster[]; says: Say[];
};

const REMARKS = ["PSST", "HM?", "SHH!", "AHEM", "OH!", "ZZZ", "HA!", "WHO?", "TUT", "I SAY"];
const GREETINGS = ["HELLO!", "GOOD DAY", "SHH!", "WELCOME", "MIND THE STEP", "LOVELY HAT"];

const GHOSTS = [
  // a gentleman in a ruff
  ["...www...", "..wwwww..", "..wewew..", "..wwwww..", ".ddddddd.", "..wwwww..", ".wwwwwww.", "wwwdwdwww", "wwwwwwwww", "w.wwwww.w", "..wwwww..", "..wdwdw..", "..wwwww..", "...wwww..", "....www..", ".....ww.."],
  // a lady in a long gown
  ["...www...", "..wwwww..", ".dwewewd.", ".dwwwwwd.", ".d.www.d.", "..wwwww..", ".wwdddww.", ".wwwwwww.", "..wwwww..", ".wwwwwww.", ".wwwwwww.", "wwwwwwwww", "wwdwwwdww", ".wwwwwww.", "..ww.www.", "...w..ww."],
  // a stout friar
  ["...www...", "..ddddd..", "..wewew..", "..wwwww..", ".wwwwwww.", "wwwwwwwww", "wwwwdwwww", "wwwwdwwww", "wwwdddwww", "wwwwwwwww", ".wwwwwww.", ".wwwwwww.", "..wwwww..", "..wwww...", "...www...", "...ww...."],
];

function ghost(g: Gfx, gh: Ghost, f: number, night: boolean) {
  const rows = GHOSTS[gh.kind % GHOSTS.length], x = Math.round(gh.x) - 4, y = Math.round(gh.y + Math.sin(f * 0.05 + gh.phase) * 3) - 8;
  const a = night ? 0.72 : 0.55;
  for (let r = 0; r < rows.length; r++) {
    // the hem trails and ripples as they drift
    const sway = r > 10 ? Math.round(Math.sin(f * 0.25 + r * 0.9 + gh.phase) * 0.8) - Math.sign(gh.v) * (r > 13 ? 1 : 0) : 0;
    for (let i = 0; i < 9; i++) {
      const ch = rows[r][gh.v < 0 ? 8 - i : i];
      if (ch === ".") continue;
      g.px(x + i + sway, y + r, ch === "w" ? "#eef6fb" : ch === "d" ? "#b7d2e2" : "#4a6578", ch === "e" ? 0.9 : a);
    }
  }
}

/** A speech bubble over (x, y), kept inside the window. */
function bubble(g: Gfx, x: number, y: number, text: string, s: State) {
  const bw = text.length * 4 + 3, bx = Math.max(s.cx + 1, Math.min(s.cx + s.w - bw - 1, Math.round(x - bw / 2)));
  const below = y - 10 < s.cy + 1, by = below ? y + 4 : y - 10;
  g.rect(bx, by, bw, 9, C.ink); g.rect(bx + 1, by + 1, bw - 2, 7, C.paper);
  g.px(Math.max(bx + 2, Math.min(bx + bw - 3, Math.round(x))), below ? by - 1 : by + 9, C.ink);
  g.text(text, bx + 2, by + 2, C.ink);
}

/** The flight that leaves a balcony. It is made the first time the window comes near it. */
function mover(s: State, t: Tower, st: number): Mover {
  const key = t.k + ":" + st;
  let m = s.movers.get(key);
  if (!m) {
    // which way each one starts is a pattern, so that the hall opens on a balanced picture
    const n = t.even ? t.k / 2 + (st - 1) / 2 : (t.k - 1) / 2 + st / 2;
    m = {
      k: t.k, x: t.x, level: st * STOREY, side: ((n % 2) + 2) % 2 === 0 ? 1 : -1, t0: -1, look: 300 + t.k * 7 + st,
      // the first to go is the one in the middle of the opening picture, a second after it appears
      next: s.f + (t.k === 0 && st === 1 ? 14 : 40 + Math.floor(hash(t.k, st, 7) * 190)),
    };
    s.movers.set(key, m);
  }
  return m;
}

/** A flight's angle this frame. */
function angle(m: Mover, f: number, rng: Rng) {
  if (m.t0 < 0 && f >= m.next) m.t0 = f;
  let p = 0;
  if (m.t0 >= 0) {
    p = (f - m.t0) / SWING;
    if (p >= 1) { m.side = m.side > 0 ? -1 : 1; m.t0 = -1; m.next = f + 100 + Math.floor(rng() * 110); p = 0; }
  }
  const ease = p * p * (3 - 2 * p), from = m.side > 0 ? 0 : Math.PI;
  return from + (Math.PI - 2 * from) * ease;
}

/** Someone walking a flight: down, a pause, and back up again. */
function walker(f: number, id: number): Walker {
  const lap = 380, u = (f + Math.floor(hash(id, 3, 33) * lap)) % lap;
  const along = u < 160 ? u / 160 : u < 190 ? 1 : u < 350 ? 1 - (u - 190) / 160 : 0;
  return { d: PIER + RUN - 2 - along * (RUN - 4), look: 100 + id * 17 };
}

/** A shaft of light from a tall window: where it starts (x, top), where it ends, and how far it leans, in pixels. */
const shaft = (mx: number, sill: number, dir: number): [number, number, number, number] => [F * mx + 1, F * (sill - WINDOW_H) + 12, F * sill + 150, dir * 70];

/**
 * The light of everything that stays put, for one stretch of the hall, on
 * black: lanterns, open doorways, candles, the desk lamps, and daylight (or
 * moonlight) slanting in through the tall windows. It is laid over the
 * finished picture so that it lightens whatever is under it.
 */
function paintLight(l: Gfx, night: boolean) {
  const lit = night ? 1 : 0.62, ctx = l.ctx;
  ctx.globalCompositeOperation = "lighter";
  for (let k = -1; k <= 3; k++) {
    const x = k * BAY, even = k % 2 === 0;
    if (even) for (const dir of [1, -1]) {
      const X = across(x, dir), rgb = night ? "140,170,255" : "255,240,205";
      for (const sill of WINDOWS) {
        const [wx, top, end, lean] = shaft(X(42), sill, dir);
        const gr = ctx.createLinearGradient(0, top, 0, end);
        gr.addColorStop(0, `rgba(${rgb},${night ? 0.2 : 0.24})`); gr.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = gr;
        ctx.beginPath(); ctx.moveTo(wx - 14, top); ctx.lineTo(wx + 14, top); ctx.lineTo(wx + 14 + lean, end); ctx.lineTo(wx - 14 + lean, end); ctx.closePath(); ctx.fill();
        glow(l, wx, F * (sill - WINDOW_H / 2), 64, rgb, night ? 0.2 : 0.26);
      }
      for (const [u, row] of CANDLES) glow(l, F * X(u) + 1, F * row - 2, 18, "255,205,120", 0.5 * lit);
      glow(l, F * (X(DESK, 15) + (dir > 0 ? 2 : 12)) + 1, F * (G + 138), 34, "120,235,165", 0.42 * lit);
    }
    for (const st of [0, ...storeys({ even })]) {
      const y = FLOOR - st * STOREY;
      for (const sgn of [-1, 1]) glow(l, F * (x + sgn * 10) + 1, F * (y - (st ? 18 : 22)) + 2, 46, "255,190,105", 0.55 * lit);
      if ((st || !even) && !(even && st === LADY_STOREY)) glow(l, F * x + 1, F * y - 18, 32, "255,160,70", 0.3 * lit);
    }
  }
}

/** Where a wand's lit tip is, in pixels. */
const tip = (c: Caster): [number, number] => [F * c.x + 1 + c.side * 8 - (c.side < 0 ? 1 : 0), F * c.y + F - 20];
const rgbOf = (hex: string) => { const n = parseInt(hex.slice(1), 16); return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`; };

function cast(s: State, from: Caster, x1: number, y1: number) {
  const x0 = from.x + from.side * 4, y0 = from.y - 9;
  s.spells.push({ x0, y0, x1, y1, t: 0, dur: Math.max(14, Math.round(Math.hypot(x1 - x0, y1 - y0) / 3.2)), col: MAGIC[Math.abs(from.look) % MAGIC.length] });
}
function burst(s: State, x: number, y: number, col: string, n = 12) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + s.rng(), v = 0.5 + s.rng() * 0.8, life = 12 + Math.floor(s.rng() * 12);
    s.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, col: i % 3 ? col : "#fffbe6" });
  }
}

/**
 * The lady's portrait and whoever is calling on her. She asks for the
 * password, is given it, swings open on her hinges to let them through into
 * the firelight, and shuts again; in between she practises her singing.
 */
/** How far the lady's door stands open at this moment, 0 to 1. */
function ladyOpen(s: State, t: Tower, f: number) {
  const since = f - (s.ladies.get(t.k) ?? LADY_AT), u = ((since % LADY_LAP) + LADY_LAP) % LADY_LAP;
  return u < 54 ? 0 : u < 66 ? (u - 54) / 12 : u < 94 ? 1 : u < 106 ? 1 - (u - 94) / 12 : 0;
}

function lady(g: Gfx, s: State, t: Tower, f: number) {
  const x = t.x, y = FLOOR - LADY_STOREY * STOREY, since = f - (s.ladies.get(t.k) ?? LADY_AT), u = ((since % LADY_LAP) + LADY_LAP) % LADY_LAP;
  if (u === 8) s.says.push({ x: x - 26, y: y - 13, text: "PASSWORD?", until: f + 22 });
  if (u === 32) s.says.push({ x: x + 35, y: y - 8, text: "CAPUT DRACONIS", until: f + 24 });
  const open = ladyOpen(s, t, f);
  const singing = u > 130 && u < 280;
  if (open > 0) {
    // the round hole behind her, and the common-room fire beyond
    arch(g, x, y, 13, 26, "#2a140a"); arch(g, x, y, 9, 21, "#8a3f14"); arch(g, x, y, 5, 14, "#e08a2c");
  } else ladyPortrait(g, x, y, singing, f);
  // the caller: waiting, stepping through, gone, and later someone new arriving
  const who = 4000 + t.k * 3 + Math.floor(since / LADY_LAP);
  if (u < 66) person(g, x + 9, y + 2, who, 0);
  else if (u < 80) person(g, x + 9 - Math.round(((u - 66) / 14) * 9), y + 2, who, Math.floor(u / 2));
  else if (u >= 296) person(g, x + 9 + Math.max(0, 8 - Math.floor((u - 296) / 2)), y + 2, who + 1, u < 312 ? Math.floor(u / 2) : 0);
  if (open > 0) {
    s.ladyArt ??= canvas(17 * F + 1, 29 * F, (l) => { l.ctx.scale(F, F); ladyPortrait(l, 8, 29, false, 0); });
    const wide = Math.max(2, Math.round(17 * Math.cos(open * Math.PI * 0.46)));
    g.ctx.drawImage(s.ladyArt, x - 8, y - 29, wide + 0.5, 29);
  }
  if (singing) for (let j = 0; j < 2; j++) {
    const ph = (u + j * 22) % 44, nx = x + 9 + j * 5 + Math.round(Math.sin(ph * 0.3) * 1.5), ny = y - 16 - Math.round(ph * 0.45);
    const a = 1 - ph / 44;
    g.rect(nx + 1, ny, 1, 4, "#fbe6a0", a); g.rect(nx, ny + 3, 2, 1, "#fbe6a0", a); g.px(nx + 2, ny + 1, "#fbe6a0", a);
  }
}
const hasLady = (t: Tower) => t.k % LADY_EVERY === 0;

export const stairwell: Scene<State> = {
  w: W,
  h: H,
  fps: 12 * T,
  poster: 0,
  fluid: true,
  camera,
  alt: "The grand staircase, seen from the front through a window that slowly travels up, along and down the hall: stone towers with arched doors and balconies, and pale flights of stairs crossing between them, storey above storey, many of which swing round to the other side with people walking on them. Two tiers of bookcases line the lower walls and living portraits crowd the upper ones; one portrait, of a lady in white, asks for the password and opens like a door. Ghosts drift past, books fly back to their shelves, candles float, spells arc across the hall, and at the top the vault is open to the stars.",
  init(rng, w) {
    const ghosts: Ghost[] = [], across = w / F, n = Math.max(2, Math.round(across / 120));
    for (let i = 0; i < n; i++) {
      ghosts.push({ x: -across / 2 + ((i + 0.3 + rng() * 0.4) * across) / n, y: HW - 160 + [44, 86, 126, 22][i % 4], v: (i % 2 ? -1 : 1) * (0.16 + rng() * 0.12), kind: i, phase: rng() * 6, hurry: 0 });
    }
    return { f: 0, rng, cx: 0, cy: 0, w: 0, hall: null, light: [null, null], ladyArt: null, movers: new Map(), ladies: new Map(), hung: hang(), ghosts, spells: [], parts: [], casters: [], says: [] };
  },
  draw(g, tick, s, env, view) {
    // the patch of hall to paint, in units; `f` counts beats, in halves
    const v = view ?? { x: -g.w / 2, y: HW * F - g.h, w: g.w, h: g.h }, f = tick / T, beat = tick % T === 0;
    const cx = Math.floor(v.x / F), cy = Math.floor(v.y / F), x1 = Math.ceil((v.x + v.w) / F), y1 = Math.ceil((v.y + v.h) / F);
    const w = x1 - cx, tall = y1 - cy, mid = cx + w / 2;
    s.f = f; s.cx = cx; s.cy = cy; s.w = w;
    /** is this row of the hall in the window, give or take? */
    const seen = (y: number, pad = 30) => y > cy - pad && y < y1 + pad;
    const all = towersIn(cx, x1);
    const ctx = g.ctx;
    ctx.save();
    ctx.translate(-v.x, -v.y);
    ctx.scale(F, F);
    s.hall ??= canvas(PERIOD * F, HW * F, (l) => { l.ctx.scale(F, F); paintHall(l, s.hung); });
    for (let n = Math.floor(cx / PERIOD); n * PERIOD < x1; n++) ctx.drawImage(s.hall, n * PERIOD, 0, PERIOD, HW);

    // the portraits: blinking, glancing about, and calling on their neighbours
    const inView: [Portrait, number][] = [];
    for (let n = Math.floor(cx / PERIOD); n * PERIOD < x1; n++) s.hung.forEach((p) => {
      const px = p.x + n * PERIOD;
      if (!seen(p.y, 16) || px > x1 || px + p.w < cx) return;
      inView.push([p, px]);
      const look = Math.floor(hash(p.look, n, 55) * 9973), seed = p.seed + n * 131;
      const t = (f + (seed % 997)) % (420 + (seed % 240)), reach = p.w / 2 + 3;
      const blink = (f + seed) % (50 + (seed % 40)) < 2;
      const mate = p.mate >= 0 ? s.hung[p.mate] : null, sgn = mate && mate.x < p.x ? -1 : 1;
      let dx = (f + seed * 3) % 260 < 40 ? (seed % 2 ? 1 : -1) : 0, home = true;
      if (mate) {
        if (t < 24) dx = sgn * (t / 24) * reach;
        else if (t < 170) {
          home = false;
          // over at the neighbour's: in at one side, a chat, and out again
          const u = t - 24, mr = mate.w / 2 + 3;
          const vx = u < 22 ? -sgn * (mr - (u / 22) * (mr - 3)) : u > 124 ? -sgn * (3 + ((u - 124) / 22) * (mr - 3)) : -sgn * 3;
          sitter(g, mate, mate.x + n * PERIOD, look, vx, blink);
        } else if (t < 194) dx = sgn * (1 - (t - 170) / 24) * reach;
      }
      // a host makes room for a caller
      if (p.caller >= 0) {
        const c = s.hung[p.caller], cs = c.seed + n * 131, ct = (f + (cs % 997)) % (420 + (cs % 240));
        if (ct >= 40 && ct < 150) dx = c.x < p.x ? 2 : -2;
      }
      if (home) sitter(g, p, px, look, dx, blink);
    });
    if (beat && f % 64 === 40 && inView.length) {
      const [p, px] = inView[Math.floor(s.rng() * inView.length)];
      s.says.push({ x: px + p.w / 2, y: p.y, text: REMARKS[Math.floor(s.rng() * REMARKS.length)], until: f + 26 });
    }

    // in the library: someone on the rolling ladder, someone reading, a quill writing by itself, books on the wing
    if (seen(G + 110, 60)) for (const t of all) if (t.even) for (const dir of [1, -1]) {
      const X = across(t.x, dir), id = t.k * 2 + dir;
      const slide = (f * 0.11 + hash(id, 1, 80) * 80) % 80, lu = 20 + Math.round(slide < 40 ? slide : 80 - slide);
      const lx = X(lu, 6);
      g.rect(lx, G + 106, 1, 40, "#c2925a"); g.rect(lx + 5, G + 106, 1, 40, "#c2925a");
      for (let y = G + 109; y < G + 146; y += 4) g.rect(lx + 1, y, 4, 1, "#9a6f3e");
      person(g, lx + 3, G + 132 + Math.round(Math.sin(f * 0.02 + id) * 8), 800 + id * 11, Math.floor(f / 8));
      const dx = X(DESK, 15);
      person(g, dx + 7, G + 151, 900 + id * 13, 0, G + 142);
      g.rect(dx, G + 142, 15, 2, C.oakHi); g.rect(dx + 1, G + 144, 13, 5, C.oakDk); g.rect(dx, G + 144, 1, 8, C.oak); g.rect(dx + 14, G + 144, 1, 8, C.oak);
      g.rect(dx + 5, G + 141, 5, 1, "#f4ecd8"); g.px(dx + 7, G + 141, "#b9ad92");
      const lampX = dir > 0 ? dx + 2 : dx + 12;
      g.rect(lampX, G + 138, 1, 4, C.giltDk); g.rect(lampX - 1, G + 136, 3, 2, "#2f8a5a");
      const qx = dx + 5 + Math.floor((f / 3) % 5), qy = G + 138 - (Math.floor(f / 2) % 2);
      g.line(qx, qy + 2, qx + 3, qy - 2, "#f4ecd8"); g.px(qx, qy + 2, C.ink);
      // books that shelve themselves
      for (let b = 0; b < 3; b++) {
        const lap = 150 + b * 37, n = Math.floor((f + b * 50) / lap), u = (f + b * 50) % lap;
        if (u > 96) continue;
        const p = u / 96, slot = (m: number) => [X(4 + hash(id * 9 + b, n + m, 81) * 76), G + [69, 75, 81, 87, 109, 115, 121, 127][Math.floor(hash(id * 9 + b, n + m, 82) * 8)]];
        const [ax, ay] = slot(0), [bx, by] = slot(1);
        const x = Math.round(ax + (bx - ax) * p), y = Math.round(ay + (by - ay) * p - Math.sin(p * Math.PI) * (14 + b * 5));
        const cover = SPINES[Math.floor(hash(id * 9 + b, n, 83) * (SPINES.length - 1))];
        if (Math.floor(f / 2) % 2) { g.px(x - 2, y - 1, cover); g.px(x + 2, y - 1, cover); g.rect(x - 2, y, 2, 1, "#f4ecd8"); g.rect(x + 1, y, 2, 1, "#f4ecd8"); g.rect(x - 1, y + 1, 3, 1, cover); }
        else { g.rect(x - 2, y, 5, 1, "#f4ecd8"); g.rect(x - 2, y + 1, 5, 1, cover); }
        if (beat && f % 3 === 0) s.parts.push({ x, y: y + 2, vx: 0, vy: 0.15, life: 8, max: 8, col: "#ffe9a8" });
      }
    }

    // the lady's portrait, drawn before the stairs and the balcony rail in front of it
    for (const t of all) if (hasLady(t) && seen(FLOOR - LADY_STOREY * STOREY - 14, 40)) lady(g, s, t, f);

    // the two flights from the ground floor stay where they are
    if (seen(FLOOR - STOREY / 2, 50)) for (const t of all) if (!t.even) for (const dir of [1, -1]) {
      const id = t.k * 4 + dir;
      docked(g, t.x, 0, dir as 1 | -1, [walker(f, id), walker(f + 190, id + 50)]);
    }
    // every other flight swings when its turn comes; whoever is on it keeps walking
    const moving: { m: Mover; a: number }[] = [];
    for (const t of all) for (const st of storeys(t)) {
      if (st >= TOP_STOREY || !seen(FLOOR - st * STOREY - STOREY / 2, 60)) continue;
      const m = mover(s, t, st);
      moving.push({ m, a: angle(m, f, s.rng) });
    }
    moving.sort((p, q) => Math.sin(p.a) - Math.sin(q.a) || p.m.level - q.m.level);
    for (const { m, a } of moving) {
      if (a === 0 || a === Math.PI) docked(g, m.x, m.level, a === 0 ? 1 : -1, [walker(f, m.look)]);
      else flight(g, m.x, m.level, a, [walker(f, m.look)]);
    }
    if (s.movers.size > 400) for (const [key, m] of s.movers) if (Math.abs(m.x - mid) > 12 * BAY) s.movers.delete(key);

    // people on the balconies, behind the handrail, wands lit
    s.casters = [];
    for (const t of all) for (const st of storeys(t)) {
      const y = FLOOR - st * STOREY;
      if (!seen(y, 24)) continue;
      const id = t.k * 9 + st, side = hash(id, 2, 70) < 0.5 ? -1 : 1;
      if (hash(id, 1, 70) < 0.7 && !(hasLady(t) && st === LADY_STOREY)) {
        const c = { x: t.x + side * 5, y: y + 2, look: 500 + id * 3, side };
        s.casters.push(c);
        person(g, c.x, c.y, c.look, 0, undefined, side);
      }
      fine(g, () => { const L = F * (t.x - PIER), Y = F * y; g.rect(L, Y - 9, F * PIER * 2, 1, "#fbf6e8"); g.rect(L, Y - 8, F * PIER * 2, 1, C.rail); g.rect(L, Y - 7, F * PIER * 2, 1, C.railDk); });
    }
    // a cat on its rounds along the front of the hall
    if (seen(FLOOR, 10)) for (const t of all) if (t.k % 4 === 0) {
      const lap = 520, u = (f + 5200) % lap, span = 150, back = u >= lap / 2, p = back ? 2 - (u / lap) * 2 : (u / lap) * 2;
      const x = Math.round(t.x - span / 2 + p * span), step = Math.floor(f / 2) % 2, col = "#2e2a2c";
      const R = (i: number, y: number, rw: number, c = col) => g.rect(back ? x - i - rw + 1 : x + i, FLOOR + 1 + y, rw, 1, c);
      R(0, 0, 1); R(0, 1, 1); R(1, 2, 7); R(1, 3, 6); R(6, 0, 1); R(8, 0, 1); R(6, 1, 3); R(8, 2, 1, "#e6d36a");
      R(step ? 1 : 2, 4, 1); R(step ? 4 : 3, 4, 1); R(step ? 5 : 6, 4, 1);
    }

    // The hall is dim away from its lamps: shade everything, then put light back where there is some.
    // The lamps do not move, so their light is painted once per stretch of hall and laid over the lot.
    g.rect(cx, cy, w, tall, env.night ? "#060a1e" : "#1c1226", env.night ? 0.5 : 0.2);
    const lit = env.night ? 1 : 0.62, which = env.night ? 1 : 0;
    s.light[which] ??= canvas(PERIOD * F, HW * F, (l) => paintLight(l, env.night));
    ctx.globalCompositeOperation = "screen";
    for (let n = Math.floor(cx / PERIOD); n * PERIOD < x1; n++) ctx.drawImage(s.light[which]!, n * PERIOD, 0, PERIOD, HW);
    const lamps: [number, number, number][] = []; // lantern flames, in pixels, with a flicker
    const sticks: [number, number, number][] = []; // floating candles
    fine(g, () => {
      for (const t of all) {
        if (t.even) for (const dir of [1, -1]) {
          const X = across(t.x, dir);
          // dust turning in the light from the tall windows
          for (const sill of WINDOWS) if (seen(sill - WINDOW_H / 2, 120)) {
            const [wx, top, end, lean] = shaft(X(42), sill, dir);
            for (let i = 0; i < 12; i++) {
              const p = (f * 0.004 + hash(i, sill, 95)) % 1;
              g.px(wx - 12 + hash(i, sill, 96) * 24 + lean * p + Math.sin(f * 0.05 + i) * 2, top + p * (end - top), "#fff8e0", (1 - p) * 0.8);
            }
          }
          CANDLES.forEach(([u, row], i) => { if (seen(row, 12)) sticks.push([F * X(u) + 1, F * row + Math.round(Math.sin(f * 0.07 + i * 1.7 + t.k) * 3), i]); });
        }
        for (const st of [0, ...storeys(t)]) {
          const y = FLOOR - st * STOREY;
          if (!seen(y - 10, 40)) continue;
          for (const sgn of [-1, 1]) { const lx = F * (t.x + sgn * 10) + 1; lamps.push([lx, F * (y - (st ? 18 : 22)), Math.floor(f / 4 + lx) % 5]); }
          // the doors over the great doors: an ordinary corridor, or the lady's, which only glows when it is open
          if (t.even && st === LADY_STOREY) {
            if (!hasLady(t)) glow(g, F * t.x + 1, F * y - 18, 32, "255,160,70", 0.3 * lit);
            else if (ladyOpen(s, t, f) > 0) glow(g, F * t.x + 1, F * y - 18, 56, "255,160,70", 0.6 * lit * ladyOpen(s, t, f));
          }
        }
      }
      for (const c of s.casters) glow(g, ...tip(c), 12, rgbOf(MAGIC[Math.abs(c.look) % MAGIC.length]), 0.8);
      for (const sp of s.spells) {
        const p = sp.t / sp.dur;
        glow(g, F * (sp.x0 + (sp.x1 - sp.x0) * p), F * (sp.y0 + (sp.y1 - sp.y0) * p - Math.sin(p * Math.PI) * 14), 16, rgbOf(sp.col), 0.7);
      }
      for (const gh of s.ghosts) glow(g, F * gh.x, F * gh.y, 30, "190,225,255", env.night ? 0.3 : 0.2);
      ctx.globalCompositeOperation = "source-over";
      // the flames and wicks themselves, crisp on top of their glow
      for (const [x, y, i] of sticks) {
        g.rect(x - 1, y, 2, 8, "#f3ead6"); g.rect(x, y, 1, 8, "#d8cdb4");
        g.rect(x - 1, y - 3, 2, 3, Math.floor(f / 3 + i) % 4 ? "#ffd772" : "#ffab3d"); g.px(x - 1 + (Math.floor(f / 2 + i) % 2), y - 4, "#fff3c4");
      }
      for (const [x, y, flick] of lamps) { g.rect(x - 1, y - 1, 2, 6, "#ffc04a"); g.rect(x - 1, y + 1 - (flick ? 0 : 1), 2, 3, "#fff3c4"); }
      for (const c of s.casters) { const [x, y] = tip(c); g.px(x, y, "#ffffff"); g.px(x - 1, y, "#fffbe6", 0.7); g.px(x + 1, y, "#fffbe6", 0.7); g.px(x, y - 1, "#fffbe6", 0.7); g.px(x, y + 1, "#fffbe6", 0.7); }
    });
    ctx.globalCompositeOperation = "source-over"; // (leaving the block above puts back the blend it started with)
    if (env.night) for (const t of all) if (t.even) for (const dir of [1, -1]) for (const sill of WINDOWS) if (seen(sill - WINDOW_H / 2, 40)) windowAt(g, across(t.x, dir)(42), sill, WINDOW_H, true, f);
    for (const t of all) if (t.even) for (const dir of [1, -1]) { const lamp = across(t.x, dir)(DESK, 15) + (dir > 0 ? 2 : 12); g.rect(lamp - 1, G + 136, 3, 2, "#5fd08c"); }
    // through the vault: stars, and a moon over every other gap
    if (cy < VAULT + 4) {
      for (let n = Math.floor(cx / PERIOD); n * PERIOD < x1; n++) {
        for (let i = 0; i < 46; i++) {
          const x = n * PERIOD + Math.floor(hash(i, 1, 90) * PERIOD), y = Math.floor(hash(i, 2, 90) * 30), tw = (f + i * 13) % 50;
          if (y < vaultRow(x) - 1 && tw < 38) g.px(x, y, "#fff6d8", 0.35 + 0.65 * (1 - Math.abs(tw - 19) / 19));
        }
        g.disc(n * PERIOD + BAY / 2, 14, 4, "#f4f0d8"); g.disc(n * PERIOD + BAY / 2 + 2, 13, 3, "#182050");
      }
    }

    // now and then someone sends a spell across the hall
    if (beat && f % 38 === 20 && s.casters.length) {
      const from = s.casters[Math.floor(s.rng() * s.casters.length)], near = s.casters.filter((c) => c !== from && Math.abs(c.x - from.x) < 240);
      const to = near.length && s.rng() < 0.6 ? near[Math.floor(s.rng() * near.length)] : null;
      cast(s, from, to ? to.x : from.x + (s.rng() - 0.5) * 160, to ? to.y - 26 : cy + 10 + s.rng() * 60);
    }
    s.spells = s.spells.filter((sp) => {
      const p = sp.t / sp.dur, x = sp.x0 + (sp.x1 - sp.x0) * p + Math.sin(p * 9) * 2, y = sp.y0 + (sp.y1 - sp.y0) * p - Math.sin(p * Math.PI) * 14;
      const life = 8 + Math.floor(s.rng() * 8);
      s.parts.push({ x, y, vx: (s.rng() - 0.5) * 0.5, vy: (s.rng() - 0.5) * 0.5, life, max: life, col: sp.col });
      g.rect(Math.round(x) - 1, Math.round(y), 3, 1, sp.col); g.rect(Math.round(x), Math.round(y) - 1, 1, 3, sp.col); g.px(x, y, "#ffffff");
      if ((sp.t += 1 / T) <= sp.dur) return true;
      burst(s, sp.x1, sp.y1, sp.col);
      return false;
    });
    if (s.parts.length > 500) s.parts.splice(0, s.parts.length - 500);
    s.parts = s.parts.filter((p) => {
      const a = p.life / p.max;
      g.px(p.x, p.y, p.col, Math.min(1, a * 1.3));
      if (a > 0.7 && p.max > 10) { g.px(p.x - 1, p.y, p.col, 0.5); g.px(p.x + 1, p.y, p.col, 0.5); g.px(p.x, p.y - 1, p.col, 0.5); g.px(p.x, p.y + 1, p.col, 0.5); }
      p.x += p.vx / T; p.y += p.vy / T; p.vy += 0.015 / T;
      return (p.life -= 1 / T) > 0;
    });

    // the ghosts go straight through everything, and keep the window company wherever it goes
    for (const gh of s.ghosts) {
      gh.x += (gh.v * (gh.hurry > 0 ? 5 : 1)) / T;
      if (gh.hurry > 0) gh.hurry -= 1 / T;
      const lost = gh.y < cy - 26 || gh.y > y1 + 26;
      if (gh.x < cx - 16 || (lost && gh.v < 0)) gh.x = x1 + 12;
      else if (gh.x > x1 + 16 || lost) gh.x = cx - 12;
      if (lost) gh.y = cy + 22 + s.rng() * (tall - 50);
      ghost(g, gh, f, env.night);
    }
    s.says = s.says.filter((say) => say.until > f);
    for (const say of s.says) bubble(g, say.x, say.y, say.text, s);
    ctx.restore();
  },
  /** Tap a ghost, the lady, a flight of stairs or a portrait and it answers; tap anywhere else and someone sends a spell there. */
  pointer(s, px, py) {
    const x = px / F, y = py / F;
    const say = (sx: number, sy: number, text: string) => { s.says = s.says.filter((q) => Math.abs(q.x - sx) > 30); s.says.push({ x: sx, y: sy, text, until: s.f + 30 }); };
    for (const gh of s.ghosts) if (Math.abs(x - gh.x) < 8 && Math.abs(y - gh.y) < 12) {
      gh.v = -gh.v; gh.hurry = 18;
      say(gh.x, gh.y - 10, "BOO!");
      whoosh();
      return true;
    }
    // the lady: ask her and she starts over with the password
    const k = Math.round(x / BAY), base = FLOOR - LADY_STOREY * STOREY;
    if (hasLady({ k, x: k * BAY, even: k % 2 === 0 }) && Math.abs(x - k * BAY) <= 9 && y > base - 30 && y <= base) {
      s.ladies.set(k, s.f - 6);
      chime(false);
      return true;
    }
    // a flight, if the tap is on or near its slope
    let best: Mover | null = null, bestD = 10;
    for (const m of s.movers.values()) {
      if (m.t0 >= 0) continue;
      const ax = m.x + m.side * PIER, ay = FLOOR - m.level, bx = m.x + m.side * (PIER + RUN), by = ay - STOREY;
      const u = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
      const d = Math.hypot(x - (ax + u * (bx - ax)), y - (ay + u * (by - ay)));
      if (d < bestD) { bestD = d; best = m; }
    }
    if (best) { best.next = s.f; rumble(); return true; }
    const n = Math.floor(x / PERIOD), lx = x - n * PERIOD;
    const p = s.hung.find((q) => lx >= q.x && lx < q.x + q.w && y >= q.y && y < q.y + q.h);
    if (p) { say(p.x + n * PERIOD + p.w / 2, p.y, GREETINGS[Math.floor(s.rng() * GREETINGS.length)]); pluck(); return true; }
    // anywhere else: whoever is nearest with a wand sends something that way
    let from: Caster | null = null;
    for (const c of s.casters) if (!from || Math.hypot(c.x - x, c.y - y) < Math.hypot(from.x - x, from.y - y)) from = c;
    if (from) cast(s, from, x, y); else burst(s, x, y, MAGIC[s.f % MAGIC.length]);
    chime(true);
    return true;
  },
};
