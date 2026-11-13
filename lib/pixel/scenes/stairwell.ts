import { Gfx, hash, KNIGHT, KNIGHT_PAL, type Rng, type Scene } from "../engine";
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

const W = 260, H = 166; // the window
const HW = 360; // the hall, floor to vault
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
const BOTTOM = HW - H - 4; // the window's top row when it rests on the ground floor

// The window's journey, as [frames, how far right, how far down]. One lap moves
// it four towers along, so every lap begins in front of a lady's portrait.
const TOUR: [number, number, number][] = [
  [100, 0, 0], [110, 0, -2 * STOREY], [60, 0, 0], [230, PERIOD, 0], [60, 0, 0],
  [240, PERIOD, 2 * STOREY - BOTTOM], [84, 0, 0], [220, 0, BOTTOM],
];
const LAP = TOUR.reduce((n, seg) => n + seg[0], 0);
/** Where the window is on frame `f`: the hall column at its middle, and its top row. */
function camera(f: number): [number, number] {
  let t = f % LAP, x = Math.floor(f / LAP) * 2 * PERIOD, y = BOTTOM;
  for (const [n, dx, dy] of TOUR) {
    if (t < n) { const p = t / n, e = p * p * (3 - 2 * p); return [Math.round(x + dx * e), Math.round(y + dy * e)]; }
    t -= n; x += dx; y += dy;
  }
  return [x, y];
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

// h hair, s skin, e eye, r robe, c trim, t hat, k head-cloth, b boot
// tall enough that a face clears the handrail in front of it
const BODY = [".rcccr.", "rrrrrrr", "rrrrrrr", "rrrrrrr", "srrcrrs", ".rrcrr.", ".rrcrr.", ".rrrrr.", ".rrrrr.", ".rrrrr.", ".rrrrr.", ".rrrrr."];
const withBody = (head: string[], top = BODY[0], second = BODY[1]) => [...head, top, second, ...BODY.slice(2)];
const FIGURES = [
  withBody(["...t...", "..ttt..", "..ttt..", ".ttttt.", ".heseh.", "..sss.."]), // pointed hat
  withBody(["..hhh..", ".hhhhh.", ".heseh.", "..sss.."]), // short hair
  withBody(["..hhh..", ".hhhhh.", ".heseh.", ".hsssh."], "hrcccrh", "hrrrrrh"), // long hair
  withBody([".hhhhh.", "hhhhhhh", "hhesehh", "..sss.."]), // an afro
  withBody(["..kkk..", ".kkkkk.", ".kesek.", ".ksssk."], ".kkkkk."), // a headscarf
  withBody(["..kkk..", ".kkkkk.", "..ese..", "..sss.."]), // a turban
  withBody(["...h...", "..hhh..", ".hhhhh.", ".heseh.", "..sss.."]), // hair in a bun
  withBody(["..hhh..", ".hhhhh.", ".heseh.", "..hhh.."], ".rhhhr."), // a beard
];
const FEET = ["..b.b..", "...bb.."];

/** Give a figure a dark edge, so it reads against pale stone and dark wall alike. */
function outlined(rows: string[]) {
  const w = rows[0].length + 2, blank = "".padEnd(w, ".");
  const grid = [blank, ...rows.map((r) => "." + r + "."), blank];
  return grid.map((row, y) => [...row].map((ch, x) => {
    if (ch !== ".") return ch;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => (grid[y + dy]?.[x + dx] ?? ".") !== ".");
    return near ? "o" : ".";
  }).join(""));
}
const PEOPLE = FIGURES.map((fig) => FEET.map((feet) => outlined([...fig, feet])));
const pick = <T,>(list: T[], look: number, n: number) => list[Math.floor(hash(look, n, 50) * list.length)];

/** Draw someone standing with their feet on row `y`, centred on `x`. `rows` shows only the top of them (someone behind a desk). */
function person(g: Gfx, x: number, y: number, look: number, pose = 0, rows = 99) {
  const art = PEOPLE[Math.floor(hash(look, 0, 50) * PEOPLE.length)][pose % 2];
  const robe = Math.floor(hash(look, 3, 50) * ROBES.length);
  const pal = { h: pick(HAIRS, look, 1), s: pick(SKINS, look, 2), e: C.ink, r: ROBES[robe], t: HATS[robe], c: "#f6dc8a", k: pick(CLOTH, look, 4), b: C.dark, o: C.ink };
  g.sprite(art.slice(0, rows + 1), Math.round(x) - 4, Math.round(y) - (art.length - 2), pal);
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
 * left, in between = swinging round toward the viewer).
 */
function flight(g: Gfx, cx: number, level: number, a: number, walkers: Walker[] = []) {
  const c = Math.cos(a), s = Math.sin(a), half = DEEP / 2, end = PIER + RUN;
  /** a point `d` along the flight, `off` to one side of its middle, `z` above the floor */
  const pt = (d: number, off: number, z: number): [number, number] => [cx + c * d - s * off, FLOOR - z + (half + s * d + c * off) * K];
  const top = (i: number) => level + RISE * (i + 1);
  const slope = (d: number) => level + ((d - PIER) * RISE) / GOING;
  const near = c >= 0 ? 1 : -1; // the edge toward the viewer

  const posts = (side: number, rail: string, railDk: string, post: string) => {
    const off = side * half;
    for (let i = 1; i < STEPS; i += 2) {
      const d = PIER + GOING * i + GOING / 2, [x, y] = pt(d, off, slope(d) + RISE + RAIL);
      g.rect(Math.floor(x), Math.round(y), 1, RAIL, post);
    }
    for (const d of [PIER + 1, end - 1]) {
      const [x, y] = pt(d, off, slope(d) + RISE + RAIL);
      g.rect(Math.round(x) - 1, Math.round(y) - 2, 2, RAIL + 2, rail);
      g.rect(Math.round(x) - 1, Math.round(y) - 3, 2, 1, railDk);
    }
  };
  const handrail = (side: number, rail: string, railDk: string) => {
    const off = side * half;
    const [x0, y0] = pt(PIER, off, slope(PIER) + RISE + RAIL), [x1, y1] = pt(end, off, slope(end) + RISE + RAIL);
    g.line(x0, y0 + 1, x1, y1 + 1, railDk);
    g.line(x0, y0, x1, y1, rail);
  };

  posts(-near, C.farRail, C.farPost, C.farPost);
  handrail(-near, C.farRail, C.farPost);
  const o = near * half, sideways = Math.abs(c) > 0.08;
  for (let i = 0; i < STEPS; i++) {
    const d0 = PIER + GOING * i, d1 = d0 + GOING, z = top(i);
    const tread = (a0: number, a1: number, col: string) => poly(g, [pt(a0, -half, z), pt(a1, -half, z), pt(a1, half, z), pt(a0, half, z)], col);
    if (Math.abs(c) > 0.6) {
      // seen from the side each step is a slab of its own: a bright nosing, and the shadow of the next step up
      tread(d0, d1, C.tread2);
      tread(d0, d0 + 1, C.tread);
      tread(d1 - 1, d1, C.side);
    } else tread(d0, d1, i % 2 ? C.tread : C.tread2);
    // the side of the stair is cut in steps too, top and bottom
    if (sideways) {
      poly(g, [pt(d0, o, z), pt(d1, o, z), pt(d1, o, z - 7), pt(d0, o, z - 7)], C.side);
      poly(g, [pt(d0, o, z - 6), pt(d1, o, z - 6), pt(d1, o, z - 7), pt(d0, o, z - 7)], C.sideDk);
      poly(g, [pt(d0, o, z), pt(d0 + 1, o, z), pt(d0 + 1, o, z - RISE), pt(d0, o, z - RISE)], C.rail);
    }
  }
  // swinging toward us: the top end of the flight comes into view
  if (s > 0.08) poly(g, [pt(end, -half, top(STEPS - 1)), pt(end, half, top(STEPS - 1)), pt(end, half, slope(end) - 6), pt(end, -half, slope(end) - 6)], C.sideDk);

  // people stand out in front of the posts, with only the handrail across them
  posts(near, C.rail, C.railDk, C.post);
  for (const wk of walkers) {
    const i = Math.max(0, Math.min(STEPS - 1, Math.floor((wk.d - PIER) / GOING)));
    const [x, y] = pt(PIER + GOING * i + GOING / 2, near * 2, top(i));
    person(g, x, y, wk.look, i);
  }
  handrail(near, C.rail, C.railDk);
}

/** A pointed opening: `wd` wide (odd), `ht` tall, standing on `base`, centred on `mx`. */
function arch(g: Gfx, mx: number, base: number, wd: number, ht: number, c: string, alpha = 1) {
  const insets = [0.38, 0.24, 0.14, 0.07, 0.03];
  for (let r = 0; r < ht; r++) {
    const inset = Math.round((insets[r] ?? 0) * wd);
    g.rect(mx - (wd - 1) / 2 + inset, base - ht + r, wd - 2 * inset, 1, c, alpha);
  }
}

/** A tall window with stone tracery, standing on `base`. */
function windowAt(g: Gfx, mx: number, base: number, ht: number, night: boolean, f = 0) {
  const wd = 15;
  arch(g, mx, base + 1, wd + 2, ht + 2, C.mould);
  arch(g, mx, base, wd, ht, night ? "#27386e" : "#bcd5e4");
  arch(g, mx - 1, base - 1, wd - 4, ht - 3, night ? "#33488a" : "#d9eaf2"); // light catching the glass
  if (night) {
    for (let i = 0; i < 9; i++) {
      const sx = mx - 5 + Math.floor(hash(i, mx, 61) * 11), sy = base - ht + 8 + Math.floor(hash(i, mx, 62) * (ht - 14));
      if ((f + i * 7) % 40 > 6) g.px(sx, sy, "#e8eeff", 0.9);
    }
    g.disc(mx + 3, base - ht + 14, 2, "#f4f0d8");
  }
  g.rect(mx, base - ht + 1, 1, ht - 1, C.mould);
  for (let y = base - 7; y > base - ht + 6; y -= 7) g.rect(mx - 7, y, wd, 1, C.mould);
  g.rect(mx - 3, base - ht + 5, 7, 1, C.mould);
  g.rect(mx - 9, base + 1, 19, 2, C.mouldHi); // the sill
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

/** Whoever lives in a portrait, drawn `dx` to one side of its middle and cut off at the frame. */
function sitter(g: Gfx, p: Portrait, px: number, look: number, dx: number, blink: boolean) {
  const x0 = px + 1, x1 = px + p.w - 1, y0 = p.y + 1, y1 = p.y + p.h - 1;
  const R = (x: number, y: number, rw: number, rh: number, c: string) => {
    const l = Math.max(x0, x), r = Math.min(x1, x + rw), t = Math.max(y0, y), b = Math.min(y1, y + rh);
    if (r > l && b > t) g.rect(l, t, r - l, b - t, c);
  };
  const mx = px + Math.floor(p.w / 2) + Math.round(dx), robe = pick(PAINT, look, 3);
  const kind = Math.floor(hash(look, 0, 50) * 4), hair = pick(HAIRS, look, 1);
  R(mx - 1, y0 + 1, 3, 1, kind === 0 ? robe : hair);
  if (kind === 0) R(mx, y0, 1, 1, robe);
  R(mx - 1, y0 + 2, 3, 2, pick(SKINS, look, 2));
  if (!blink) { R(mx - 1, y0 + 2, 1, 1, C.ink); R(mx + 1, y0 + 2, 1, 1, C.ink); }
  if (kind === 3) R(mx - 1, y0 + 3, 3, 1, hair); // a beard
  R(mx - 2, y0 + 4, 5, p.h, robe);
  R(mx - 3, y0 + 6, 7, p.h, robe);
  R(mx, y0 + 4, 1, 2, "#d8cfb8");
}

// The lady whose portrait is a door: white gown, a wreath in her dark hair.
// w gown, W its folds, h hair, s skin, e eye, m mouth, g leaf, f flower
const LADY = [
  "....gfgfg....", "...hhhhhhh...", "..hhsssssh...", "..hhsesesh...", "..hhsssssh...", "...hssmssh...", "....wsssw....", "..wwwwwwwww..",
  ".swwwwwwwwws.", ".swwwwwwwwws.", ".sswwwwwwwss.", "..wwwwWwwww..", ".wwwwWwwWwww.", ".wwwWwwwWwww.", "wwwwWwwwwWwww", "wwwWwwwwwWwww",
];
const LADY_PAL = { w: "#f1ebde", W: "#cdc4b1", h: "#2a1c14", s: "#e2b48c", e: C.ink, m: "#a8402f", g: "#4f8a3f", f: "#e58aa6" };

/** Her portrait, shut: an arched frame, sky and leaves, a little temple on a hill, and the lady on the steps. */
function ladyPortrait(g: Gfx, x: number, y: number, singing: boolean, f: number) {
  arch(g, x, y, 17, 29, C.giltDk);
  arch(g, x, y, 15, 28, C.gilt);
  arch(g, x, y - 1, 13, 26, "#9cc3dc");
  g.rect(x - 2, y - 22, 4, 1, "#e9f2f6"); g.rect(x + 1, y - 21, 3, 1, "#e9f2f6"); // a cloud
  g.rect(x - 4, y - 25, 3, 2, "#4f7a3a"); g.rect(x - 5, y - 23, 2, 2, "#4f7a3a"); g.rect(x + 2, y - 25, 3, 1, "#5d8a44"); g.rect(x + 4, y - 24, 2, 2, "#5d8a44"); // leaves overhead
  g.rect(x - 6, y - 15, 13, 5, "#7a9a5a"); // the hill
  g.rect(x + 3, y - 18, 4, 3, "#ece2c8"); g.rect(x + 2, y - 19, 5, 1, "#cbbd9c"); g.px(x + 4, y - 17, "#b9ad92"); // the temple
  g.rect(x - 6, y - 18, 1, 4, "#3f6a3a"); g.rect(x - 5, y - 16, 1, 2, "#3f6a3a"); // cypresses
  g.rect(x - 6, y - 10, 13, 9, "#cfc4ad"); g.rect(x - 6, y - 6, 13, 1, "#b5a98f"); // the steps she sits on
  g.sprite(LADY, x - 6, y - 19, LADY_PAL);
  if (singing) {
    // a glass raised, and a note held
    g.rect(x + 5, y - 15, 1, 4, LADY_PAL.s); g.rect(x + 4, y - 18, 3, 2, "#e4f6ff"); g.px(x + 5, y - 16, "#e4f6ff");
    if (Math.floor(f / 3) % 2) g.rect(x, y - 15, 1, 2, "#3a1410");
  }
}

const LADY_EVERY = 4; // the lady's portrait hangs on every fourth tower
const LADY_STOREY = 1; // on the balcony over the great door, in the middle of the opening picture
const LADY_LAP = 360;

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
  // the floor: flagstones
  for (let y = WALL_BASE; y < HW; y += 2) for (let x = 0; x < PERIOD; x++) {
    l.rect(x, y, 1, 2, (Math.floor((from(x) + 0.5) / 5) + ((y - WALL_BASE) >> 1)) % 2 ? C.tile : C.tile2);
  }
  l.rect(0, WALL_BASE, PERIOD, 1, C.mortar);
  // the vault: pointed arches from tower to tower, and above them the night sky
  for (let x = 0; x < PERIOD; x++) {
    const top = vaultRow(x);
    for (let y = 0; y < top; y++) l.px(x, y, y < 10 ? "#10153a" : y < 22 ? "#182050" : "#232c66");
    l.rect(x, top, 1, 2, C.mouldHi); l.rect(x, top + 2, 1, 1, C.mould);
    for (let i = 0; i < 8; i++) l.px(x, top + 3 + i, "#0d0906", (8 - i) * 0.05);
  }

  // the frames and their painted backgrounds; whoever lives in them is drawn every frame
  for (const p of hung) {
    l.rect(p.x, p.y, p.w, p.h, [C.gilt, C.giltDk, "#2a1c12"][p.frame]);
    if (p.frame === 0) { l.rect(p.x, p.y, p.w, 1, C.giltHi); l.rect(p.x, p.y, 1, p.h, C.giltHi); }
    if (p.bg < CANVAS.length) l.rect(p.x + 1, p.y + 1, p.w - 2, p.h - 2, CANVAS[p.bg]);
    else {
      // some sit out of doors: sky above, a hill behind
      l.rect(p.x + 1, p.y + 1, p.w - 2, p.h - 2, p.bg === CANVAS.length ? "#6f8fa0" : "#b98a5a");
      l.rect(p.x + 1, p.y + Math.floor(p.h / 2), p.w - 2, p.h - 1 - Math.floor(p.h / 2), p.bg === CANVAS.length ? "#3f5a3a" : "#5a3f2a");
    }
  }

  // the gaps between towers, each drawn outward from its even tower so that left mirrors right
  for (const [ox, dir] of [[0, 1], [PERIOD, -1]]) {
    const X = across(ox, dir);
    const R = (u: number, y: number, rw: number, rh: number, c: string) => l.rect(X(u, rw), y, rw, rh, c);
    for (const sill of WINDOWS) windowAt(l, X(42), sill, WINDOW_H, false);
    // the library: two tiers of bookcases, the upper one reached from a gallery with a brass rail
    const shelves = (top: number, n: number, sd: number) => {
      R(0, top, RUN, n * 6, "#22150c");
      for (let shelf = 0; shelf < n; shelf++) {
        const sy = top + shelf * 6;
        R(0, sy + 5, RUN, 1, C.oak);
        for (let u = 0; u < RUN; ) {
          const bw = hash(u, shelf, sd) < 0.55 ? 2 : 1, tall = 3 + Math.floor(hash(u, shelf, sd + 1) * 3);
          if (hash(u, shelf, sd + 2) > 0.08) R(u, sy + 5 - tall, bw, tall, SPINES[Math.floor(hash(u, shelf, sd + 3) * SPINES.length)]);
          u += bw;
        }
      }
      for (let u = 0; u <= RUN - 2; u += 21) R(Math.min(u, RUN - 2), top, 2, n * 6, C.oak);
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
    for (let y = FLOOR - 6; y > top; y -= 6) {
      l.rect(x - PIER + 3, y, PIER * 2 - 6, 1, C.pierLine);
      for (const j of (y / 6) % 2 < 1 ? [-5, 5] : [0]) l.rect(x + j, y + 1, 1, 5, C.pierLine);
    }
    l.rect(x - PIER - 1, FLOOR - 5, PIER * 2 + 2, 5, C.pierDk); l.rect(x - PIER - 1, FLOOR - 5, PIER * 2 + 2, 1, C.pierHi);
    l.rect(x - PIER - 1, top, PIER * 2 + 2, 3, C.pierHi); l.rect(x - PIER - 1, top + 3, PIER * 2 + 2, 1, C.pierDk); // where the vault springs from

    const doorAt = (base: number, wd: number, ht: number, wooden = false) => {
      arch(l, x, base, wd + 4, ht + 2, C.pierHi);
      arch(l, x, base, wd + 2, ht + 1, C.pierDk);
      arch(l, x, base, wd, ht, wooden ? C.oak : C.dark);
      if (wooden) {
        for (let j = -Math.floor(wd / 2) + 2; j < wd / 2 - 1; j += 3) l.rect(x + j, base - ht + 4, 1, ht - 4, C.oakDk);
        l.rect(x, base - ht + 1, 1, ht - 1, C.oakDk);
        for (const y of [base - ht + 8, base - 5]) l.rect(x - Math.floor(wd / 2), y, wd, 1, "#2a2420");
        l.px(x - 2, base - 10, C.giltHi); l.px(x + 2, base - 10, C.giltHi);
      } else {
        // a corridor beyond, lit from somewhere out of sight
        arch(l, x, base, wd - 4, ht - 5, "#3a2412");
        arch(l, x, base, wd - 8, ht - 10, "#6a3f18");
      }
    };
    /** where a storey has no door: a suit of armour in a niche, or one very large picture */
    const niche = (base: number) => {
      arch(l, x, base - 3, 13, 18, C.pierDk);
      arch(l, x, base - 3, 11, 17, "#2a2018");
      l.sprite(KNIGHT, x - 3, base - 12, { ...KNIGHT_PAL, r: "#9a3a34", s: "#b4bcc6", b: "#8a94a0", d: "#3a4048" });
      l.rect(x - 4, base - 4, 9, 1, C.pierHi);
    };
    const picture = (base: number, look: number) => {
      l.rect(x - 7, base - 23, 15, 19, C.gilt); l.rect(x - 7, base - 23, 15, 1, C.giltHi);
      l.rect(x - 6, base - 22, 13, 17, CANVAS[look % CANVAS.length]);
      l.rect(x - 1, base - 20, 3, 1, pick(HAIRS, look, 1)); l.rect(x - 1, base - 19, 3, 3, pick(SKINS, look, 2));
      l.px(x - 1, base - 18, C.ink); l.px(x + 1, base - 18, C.ink);
      l.rect(x - 4, base - 16, 9, 11, pick(PAINT, look, 3)); l.rect(x - 1, base - 16, 3, 2, "#ece4d2");
    };
    const lantern = (lx: number, ly: number) => {
      l.rect(lx - 1, ly - 2, 3, 1, C.dark); l.rect(lx - 1, ly - 1, 3, 4, "#3a2a1a"); l.rect(lx, ly, 1, 2, C.glow); l.rect(lx, ly + 3, 1, 1, C.dark);
    };

    const has = storeys({ even });
    doorAt(FLOOR, even ? 17 : 13, even ? 26 : 21, even);
    for (const sgn of [-1, 1]) lantern(x + sgn * 10, FLOOR - 22);
    for (let st = 1; st <= TOP_STOREY; st++) {
      const y = FLOOR - st * STOREY;
      if (!has.includes(st)) { if (st % 4 === 1 || st === 4) niche(y); else picture(y, 700 + st * 13 + (even ? 0 : 5)); continue; }
      doorAt(y, 13, 21);
      // the balcony: a slab on corbels, with a balustrade along its front
      l.rect(x - PIER, y, PIER * 2, 5, C.tread2); l.rect(x - PIER, y, PIER * 2, 1, C.tread);
      l.rect(x - PIER, y + 5, PIER * 2, 3, C.side); l.rect(x - PIER, y + 7, PIER * 2, 1, C.sideDk);
      l.rect(x - PIER + 2, y + 8, PIER * 2 - 4, 2, C.pierDk); l.rect(x - PIER + 5, y + 10, PIER * 2 - 10, 2, "#5a4934");
      for (let j = -PIER + 3; j < PIER - 1; j += 3) l.rect(x + j, y - 3, 1, 8, C.post);
      l.rect(x - PIER, y - 5, 2, 10, C.rail); l.rect(x + PIER - 2, y - 5, 2, 10, C.rail);
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
  hall: HTMLCanvasElement | null; ladyArt: HTMLCanvasElement | null;
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
  g.disc(x + 4, y + 7, 8, "#bfe4ff", night ? 0.1 : 0.06);
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
      next: s.f + (t.k === 0 && st === 1 ? 32 : 50 + Math.floor(hash(t.k, st, 7) * 190)),
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

function cast(s: State, from: Caster, x1: number, y1: number) {
  const x0 = from.x + from.side * 5, y0 = from.y - 13;
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
function lady(g: Gfx, s: State, t: Tower, f: number) {
  const x = t.x, y = FLOOR - LADY_STOREY * STOREY, u = (((f - (s.ladies.get(t.k) ?? 0)) % LADY_LAP) + LADY_LAP) % LADY_LAP;
  if (u === 8) s.says.push({ x: x - 26, y: y - 14, text: "PASSWORD?", until: f + 30 });
  if (u === 42) s.says.push({ x: x + 40, y: y - 12, text: "CAPUT DRACONIS", until: f + 28 });
  const open = u < 72 ? 0 : u < 86 ? (u - 72) / 14 : u < 120 ? 1 : u < 134 ? 1 - (u - 120) / 14 : 0;
  const singing = u > 190 && u < 320;
  if (open > 0) {
    // the round hole behind her, and the common-room fire beyond
    arch(g, x, y, 13, 26, "#2a140a"); arch(g, x, y, 9, 21, "#8a3f14"); arch(g, x, y, 5, 14, "#e08a2c");
  } else ladyPortrait(g, x, y, singing, f);
  // the caller: waiting, stepping through, gone, and later someone new arriving
  const who = 4000 + t.k * 3 + Math.floor((f - (s.ladies.get(t.k) ?? 0)) / LADY_LAP);
  if (u < 86) person(g, x + 7, y + 2, who, 0);
  else if (u < 100) person(g, x + 7 - Math.round(((u - 86) / 14) * 7), y + 2, who, u);
  else if (u >= 230) person(g, x + 7 + Math.max(0, 8 - Math.floor((u - 230) / 2)), y + 2, who + 1, u < 246 ? u : 0);
  if (open > 0) {
    s.ladyArt ??= canvas(17, 29, (l) => ladyPortrait(l, 8, 29, false, 0));
    const wide = Math.max(2, Math.round(17 * Math.cos(open * Math.PI * 0.46)));
    g.ctx.drawImage(s.ladyArt, 0, 0, 17, 29, x - 8, y - 29, wide, 29);
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
  fps: 12,
  poster: 20,
  fluid: true,
  alt: "The grand staircase, seen from the front through a window that slowly travels up, along and down the hall: stone towers with arched doors and balconies, and pale flights of stairs crossing between them, storey above storey, many of which swing round to the other side with people walking on them. Two tiers of bookcases line the lower walls and living portraits crowd the upper ones; one portrait, of a lady in white, asks for the password and opens like a door. Ghosts drift past, books fly back to their shelves, candles float, spells arc across the hall, and at the top the vault is open to the stars.",
  init(rng, w) {
    const ghosts: Ghost[] = [], n = Math.max(2, Math.round(w / 120));
    for (let i = 0; i < n; i++) {
      ghosts.push({ x: -w / 2 + ((i + 0.3 + rng() * 0.4) * w) / n, y: BOTTOM + [44, 86, 126, 22][i % 4], v: (i % 2 ? -1 : 1) * (0.16 + rng() * 0.12), kind: i, phase: rng() * 6, hurry: 0 });
    }
    return { f: 0, rng, cx: 0, cy: BOTTOM, w, hall: null, ladyArt: null, movers: new Map(), ladies: new Map(), hung: hang(), ghosts, spells: [], parts: [], casters: [], says: [] };
  },
  draw(g, f, s, env) {
    const w = g.w, [mid, cy] = camera(f), cx = mid - Math.floor(w / 2);
    s.f = f; s.cx = cx; s.cy = cy; s.w = w;
    const x1 = cx + w, y1 = cy + H;
    /** is this row of the hall in the window, give or take? */
    const seen = (y: number, pad = 30) => y > cy - pad && y < y1 + pad;
    const all = towersIn(cx, x1);
    const ctx = g.ctx;
    ctx.save();
    ctx.translate(-cx, -cy);
    s.hall ??= canvas(PERIOD, HW, (l) => paintHall(l, s.hung));
    for (let n = Math.floor(cx / PERIOD); n * PERIOD < x1; n++) ctx.drawImage(s.hall, n * PERIOD, 0);

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
    if (f % 64 === 40 && inView.length) {
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
      person(g, dx + 7, G + 150, 900 + id * 13, 0, 9);
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
        if (f % 3 === 0) s.parts.push({ x, y: y + 2, vx: 0, vy: 0.15, life: 8, max: 8, col: "#ffe9a8" });
      }
    }

    // the lady's portrait, drawn before the stairs and the balcony rail in front of it
    for (const t of all) if (hasLady(t) && seen(FLOOR - LADY_STOREY * STOREY - 14, 40)) lady(g, s, t, f);

    // the two flights from the ground floor stay where they are
    if (seen(FLOOR - STOREY / 2, 50)) for (const t of all) if (!t.even) for (const dir of [1, -1]) {
      const id = t.k * 4 + dir;
      flight(g, t.x, 0, dir > 0 ? 0 : Math.PI, [walker(f, id), walker(f + 190, id + 50)]);
    }
    // every other flight swings when its turn comes; whoever is on it keeps walking
    const moving: { m: Mover; a: number }[] = [];
    for (const t of all) for (const st of storeys(t)) {
      if (st >= TOP_STOREY || !seen(FLOOR - st * STOREY - STOREY / 2, 60)) continue;
      const m = mover(s, t, st);
      moving.push({ m, a: angle(m, f, s.rng) });
    }
    moving.sort((p, q) => Math.sin(p.a) - Math.sin(q.a) || p.m.level - q.m.level);
    for (const { m, a } of moving) flight(g, m.x, m.level, a, [walker(f, m.look)]);
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
        person(g, c.x, c.y, c.look, 0);
      }
      g.rect(t.x - PIER, y - 4, PIER * 2, 1, C.rail); g.rect(t.x - PIER, y - 3, PIER * 2, 1, C.railDk);
    }
    // a cat on its rounds along the front of the hall
    if (seen(FLOOR, 10)) for (const t of all) if (t.k % 4 === 0) {
      const lap = 520, u = (f + 5200) % lap, span = 150, back = u >= lap / 2, p = back ? 2 - (u / lap) * 2 : (u / lap) * 2;
      const x = Math.round(t.x - span / 2 + p * span), step = Math.floor(f / 2) % 2, col = "#2e2a2c";
      const R = (i: number, y: number, rw: number, c = col) => g.rect(back ? x - i - rw + 1 : x + i, FLOOR + 1 + y, rw, 1, c);
      R(0, 0, 1); R(0, 1, 1); R(1, 2, 7); R(1, 3, 6); R(6, 0, 1); R(8, 0, 1); R(6, 1, 3); R(8, 2, 1, "#e6d36a");
      R(step ? 1 : 2, 4, 1); R(step ? 4 : 3, 4, 1); R(step ? 5 : 6, 4, 1);
    }

    if (env.night) g.rect(cx, cy, w, H, "#0a0e22", 0.5);

    // everything that gives off light, so that it still glows after dark
    const lit = env.night ? 1 : 0.55;
    for (const t of all) {
      if (t.even) for (const dir of [1, -1]) {
        const X = across(t.x, dir);
        if (env.night) for (const sill of WINDOWS) if (seen(sill - WINDOW_H / 2, 40)) windowAt(g, X(42), sill, WINDOW_H, true, f);
        CANDLES.forEach(([u, row], i) => {
          if (!seen(row, 8)) return;
          const y = row + Math.round(Math.sin(f * 0.07 + i * 1.7 + t.k) * 1.5), x = X(u);
          g.disc(x, y - 1, 4, C.glow, 0.13 * lit);
          g.rect(x, y, 1, 4, "#f3ead6");
          g.px(x, y - 1, Math.floor(f / 3 + i) % 4 ? "#ffe9a8" : "#ffb347");
        });
        const lamp = X(DESK, 15) + (dir > 0 ? 2 : 12);
        g.disc(lamp, G + 137, 5, "#8fe0a8", 0.16 * lit);
        g.rect(lamp - 1, G + 136, 3, 2, "#5fd08c");
      }
      for (const st of [0, ...storeys(t)]) {
        const y = FLOOR - st * STOREY;
        if (!seen(y - 10, 20)) continue;
        for (const sgn of [-1, 1]) {
          const lx = t.x + sgn * 10, ly = y - (st ? 18 : 22);
          g.disc(lx, ly + 1, 5, C.glow, 0.14 * lit);
          g.rect(lx, ly, 1, 2, Math.floor(f / 4 + lx) % 5 ? "#ffe9a8" : "#ffc04a");
        }
        if ((st || !t.even) && !(hasLady(t) && st === LADY_STOREY)) arch(g, t.x, y, 9, 14, "#ffb04a", 0.12 * lit);
      }
    }
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

    // wand-tips, and now and then a spell sent across the hall
    for (const c of s.casters) {
      g.px(c.x + c.side * 5, c.y - 13, "#fffbe6");
      g.disc(c.x + c.side * 5, c.y - 13, 2, MAGIC[Math.abs(c.look) % MAGIC.length], 0.22);
    }
    if (f % 38 === 20 && s.casters.length) {
      const from = s.casters[Math.floor(s.rng() * s.casters.length)], near = s.casters.filter((c) => c !== from && Math.abs(c.x - from.x) < 240);
      const to = near.length && s.rng() < 0.6 ? near[Math.floor(s.rng() * near.length)] : null;
      cast(s, from, to ? to.x : from.x + (s.rng() - 0.5) * 160, to ? to.y - 26 : cy + 10 + s.rng() * 60);
    }
    s.spells = s.spells.filter((sp) => {
      const p = sp.t / sp.dur, x = sp.x0 + (sp.x1 - sp.x0) * p + Math.sin(p * 9) * 2, y = sp.y0 + (sp.y1 - sp.y0) * p - Math.sin(p * Math.PI) * 14;
      for (let i = 0; i < 2; i++) { const life = 8 + Math.floor(s.rng() * 8); s.parts.push({ x, y, vx: (s.rng() - 0.5) * 0.5, vy: (s.rng() - 0.5) * 0.5, life, max: life, col: sp.col }); }
      g.rect(Math.round(x) - 1, Math.round(y), 3, 1, sp.col); g.rect(Math.round(x), Math.round(y) - 1, 1, 3, sp.col); g.px(x, y, "#ffffff");
      if (++sp.t <= sp.dur) return true;
      burst(s, sp.x1, sp.y1, sp.col);
      return false;
    });
    if (s.parts.length > 500) s.parts.splice(0, s.parts.length - 500);
    s.parts = s.parts.filter((p) => {
      const a = p.life / p.max;
      g.px(p.x, p.y, p.col, Math.min(1, a * 1.3));
      if (a > 0.7 && p.max > 10) { g.px(p.x - 1, p.y, p.col, 0.5); g.px(p.x + 1, p.y, p.col, 0.5); g.px(p.x, p.y - 1, p.col, 0.5); g.px(p.x, p.y + 1, p.col, 0.5); }
      p.x += p.vx; p.y += p.vy; p.vy += 0.015;
      return --p.life > 0;
    });

    // the ghosts go straight through everything, and keep the window company wherever it goes
    for (const gh of s.ghosts) {
      gh.x += gh.v * (gh.hurry > 0 ? 5 : 1);
      if (gh.hurry > 0) gh.hurry--;
      const lost = gh.y < cy - 26 || gh.y > y1 + 26;
      if (gh.x < cx - 16 || (lost && gh.v < 0)) gh.x = x1 + 12;
      else if (gh.x > x1 + 16 || lost) gh.x = cx - 12;
      if (lost) gh.y = cy + 22 + s.rng() * (H - 50);
      ghost(g, gh, f, env.night);
    }
    s.says = s.says.filter((say) => say.until > f);
    for (const say of s.says) bubble(g, say.x, say.y, say.text, s);
    ctx.restore();
  },
  /** Tap a ghost, the lady, a flight of stairs or a portrait and it answers; tap anywhere else and someone sends a spell there. */
  pointer(s, px, py) {
    const x = px + s.cx, y = py + s.cy;
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
