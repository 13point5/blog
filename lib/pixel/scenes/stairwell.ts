import { hash, type Gfx, type Scene } from "../engine";

// The grand staircase, seen from the front like a stage set, with the library
// along its ground floor. Stone towers stand every so often along the hall,
// each with arched doors and balconies; pale flights of stairs cross the gaps
// between them, one storey at a time, and on the middle storey a flight will
// now and then swing round to the other side. The walls behind are bookcases
// below and gilt-framed portraits above, with a tall window in every gap.
//
// It can be drawn at any width: the pattern of towers simply carries on, and
// everything that does not move is mirrored about the middle tower.

const W = 196, H = 124;
const BAY = 110; // tower to tower
const PIER = 13; // half the width of a tower
const RUN = BAY - 2 * PIER; // how far a flight travels
const STEPS = 21, GOING = 4, RISE = 2; // each step: 4 along, 2 up
const STOREY = STEPS * RISE;
const FLOOR = 114; // screen row of the floor at the towers' front face
const K = 0.25; // one unit of depth toward the viewer moves a point this far down the screen
const DEEP = 20; // stairs and balconies are this deep
const WALL_BASE = FLOOR - 10; // the back wall stands 40 units behind the towers
const RAIL = 9; // height of a handrail
const SWING = 44; // frames a flight takes to swing round
const FIRST = 34; // the first swing starts about a second after the picture appears (it opens on frame 20)
const REST = 54; // and after each one a flight rests for five or six seconds

const C = {
  wall: "#4a392b", wall2: "#534132", wall3: "#423225", mortar: "#3a2c21", mould: "#7b6447", mouldHi: "#94794f",
  pier: "#927a58", pierHi: "#a68c66", pierDk: "#6f5b41", pierLine: "#7f6a4b",
  tread: "#ecdcb8", tread2: "#d8c398", side: "#b59c70", sideDk: "#87714e", rail: "#f4e8cc", railDk: "#c2ab80", post: "#d6c297",
  farRail: "#b9a47c", farPost: "#a08c68",
  oak: "#5a3a20", oakDk: "#3a2413", oakHi: "#7a5230",
  gilt: "#d2a23e", giltHi: "#f0cc68", giltDk: "#8f6a22",
  tile: "#75604a", tile2: "#665240", dark: "#17100b", glow: "#ffcf6a",
};
const SPINES = ["#a8402f", "#c9973a", "#4a6a44", "#3a5a82", "#d8c08a", "#7a4468", "#b5622f", "#8a9a62", "#2f2a26"];
const CANVAS = ["#2e2a3a", "#33402f", "#4a2a26", "#27333f", "#3d3020"];
const ROBES = ["#8a3a3a", "#2f6a52", "#4a4a9a", "#b08a3a", "#6a3a6a", "#d8d0c0"];
const SKIN = "#e8c4a0";

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

// someone in a pointed hat and bright robes, 7 x 15; the last row is the feet, in two poses
const WIZARD = [
  "...t...", "..ttt..", "..ttt..", ".ttttt.", ".hsssh.", "..sss..", ".rcccr.",
  "rrrrrrr", "rrrrrrr", "rrrrrrr", ".rrcrr.", ".rrcrr.", ".rrrrr.", ".rrrrr.",
];
const FEET = ["..b.b..", "...bb.."];
const HAIR = ["#3a2413", "#1c1612", "#b5622f", "#e3c06a"];
// robes and hats, bright enough to read against both the pale stairs and the dark wall
const ROBE = ["#c63f31", "#2f9560", "#3a6fd0", "#8552c2"];
const HAT = ["#8c281f", "#1d6740", "#254c9c", "#5a358f"];

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

  const balustrade = (side: number, rail: string, railDk: string, post: string) => {
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
    const [x0, y0] = pt(PIER, off, slope(PIER) + RISE + RAIL), [x1, y1] = pt(end, off, slope(end) + RISE + RAIL);
    g.line(x0, y0 + 1, x1, y1 + 1, railDk);
    g.line(x0, y0, x1, y1, rail);
  };

  balustrade(-near, C.farRail, C.farPost, C.farPost);
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

  for (const wk of walkers) {
    const i = Math.max(0, Math.min(STEPS - 1, Math.floor((wk.d - PIER) / GOING)));
    const [x, y] = pt(PIER + GOING * i + GOING / 2, 0, top(i));
    const n = wk.look % ROBE.length;
    const pal = { h: HAIR[(wk.look >> 2) % HAIR.length], s: SKIN, c: "#f2cf6a", r: ROBE[n], t: HAT[n], b: "#17100b" };
    g.sprite([...WIZARD, FEET[i % 2]], Math.round(x) - 3, Math.round(y) - 14, pal);
  }
  balustrade(near, C.rail, C.railDk, C.post);
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
function windowAt(g: Gfx, mx: number, base: number, ht: number, night: boolean) {
  const wd = 15;
  arch(g, mx, base + 1, wd + 2, ht + 2, C.mould);
  arch(g, mx, base, wd, ht, night ? "#31447c" : "#bcd5e4");
  arch(g, mx - 1, base - 1, wd - 4, ht - 3, night ? "#405796" : "#d9eaf2"); // light catching the glass
  g.rect(mx, base - ht + 1, 1, ht - 1, C.mould);
  for (let y = base - 7; y > base - ht + 6; y -= 7) g.rect(mx - 7, y, wd, 1, C.mould);
  g.rect(mx - 3, base - ht + 5, 7, 1, C.mould);
  g.rect(mx - 9, base + 1, 19, 2, C.mouldHi); // the sill
}

/** Hang gilt-framed portraits edge to edge over a patch of wall. */
function portraits(R: (u: number, y: number, w: number, h: number, c: string) => void, u0: number, u1: number, y0: number, y1: number, seed: number) {
  let y = y0, row = 0;
  while (y + 6 <= y1) {
    const rowH = Math.min(y1 - y, 7 + Math.floor(hash(row, seed, 11) * 6));
    let u = u0 + Math.floor(hash(row, seed, 12) * 2), n = 0;
    while (u + 5 <= u1) {
      const id = row * 9 + n;
      const fw = Math.min(u1 - u, 5 + Math.floor(hash(id, seed, 13) * 6));
      const fh = Math.max(6, rowH - Math.floor(hash(id, seed, 14) * 3));
      const fy = y + Math.floor((rowH - fh) / 2);
      const kind = hash(id, seed, 15);
      R(u, fy, fw, fh, kind < 0.7 ? C.gilt : kind < 0.88 ? C.giltDk : "#2a1c12");
      if (kind < 0.7) R(u, fy, fw, 1, C.giltHi);
      R(u + 1, fy + 1, fw - 2, fh - 2, CANVAS[Math.floor(hash(id, seed, 16) * CANVAS.length)]);
      // the sitter: a face and shoulders
      const hw = fw % 2 ? 1 : 2, hx = u + (fw - hw) / 2;
      R(hx, fy + 2, hw, fh > 8 ? 2 : 1, SKIN);
      R(hx - 1, fy + (fh > 8 ? 4 : 3), hw + 2, fh - (fh > 8 ? 5 : 4), ROBES[Math.floor(hash(id, seed, 17) * ROBES.length)]);
      u += fw + 1 + Math.floor(hash(id, seed, 18) * 2);
      n++;
    }
    y += rowH + 1;
    row++;
  }
}

type Tower = { k: number; x: number; even: boolean };
function towers(w: number): Tower[] {
  const cx = Math.floor(w / 2), n = Math.ceil((cx + PIER) / BAY), out: Tower[] = [];
  for (let k = -n; k <= n; k++) out.push({ k, x: cx + k * BAY, even: k % 2 === 0 });
  return out;
}
/** Which storeys a tower has a balcony on, as heights above the floor. */
const balconies = (t: Tower) => (t.even ? [STOREY] : [2 * STOREY]);
// floating candles in each gap: [distance from the even tower, screen row]
const CANDLES: [number, number][] = [[10, 44], [26, 12], [42, 58], [58, 30], [74, 50], [66, 8]];
const DESK = 7; // where the reading desk stands, measured from the even tower

/** Everything that never moves: walls, floor, towers, balconies. */
function paintHall(l: Gfx, w: number) {
  const cx = Math.floor(w / 2);
  // the back wall, in courses of stone
  l.rect(0, 0, w, H, C.wall);
  for (let y = 0; y < WALL_BASE; y += 4) for (let i = 0; i * 8 < cx + 16; i++) for (const sgn of [1, -1]) {
    const tone = hash(i, y, 21);
    const x = sgn > 0 ? cx + i * 8 - ((y >> 2) % 2) * 4 : cx - i * 8 - 8 + ((y >> 2) % 2) * 4;
    if (tone < 0.3) l.rect(x, y, 8, 4, tone < 0.15 ? C.wall2 : C.wall3);
  }
  // the floor: flagstones, mirrored about the middle
  for (let y = WALL_BASE; y < H; y += 2) for (let x = 0; x < w; x++) {
    const i = Math.floor(Math.abs(x - cx + 0.5) / 5);
    l.px(x, y, (i + ((y - WALL_BASE) >> 1)) % 2 ? C.tile : C.tile2);
    l.px(x, y + 1, (i + ((y - WALL_BASE) >> 1)) % 2 ? C.tile : C.tile2);
  }
  l.rect(0, WALL_BASE, w, 1, C.mortar);

  // the gaps between towers, each drawn outward from its even tower so that left mirrors right
  for (const t of towers(w)) if (t.even) for (const dir of [1, -1]) {
    const R = (u: number, y: number, rw: number, rh: number, c: string) => l.rect(dir > 0 ? t.x + PIER + u : t.x - PIER - u - rw, y, rw, rh, c);
    const seed = t.k * dir + 40;
    // portraits on the two upper storeys, either side of the window
    for (const [u0, u1] of [[1, 32], [52, 83]]) {
      portraits(R, u0, u1, 22, 61, seed * 4 + u0);
      portraits(R, u0, u1, 1, 18, seed * 4 + u0 + 1);
    }
    R(0, 19, RUN, 2, C.mould); R(0, 19, RUN, 1, C.mouldHi);
    windowAt(l, dir > 0 ? t.x + PIER + 42 : t.x - PIER - 42, 52, 50, false);
    // the library: bookcases along the ground floor
    R(0, 62, RUN, 3, C.oakDk); R(0, 62, RUN, 1, C.oakHi);
    R(0, 65, RUN, 32, "#22150c");
    for (let shelf = 0; shelf < 5; shelf++) {
      const sy = 65 + shelf * 6;
      R(0, sy + 5, RUN, 1, C.oak);
      for (let u = 0; u < RUN; ) {
        const bw = hash(u, shelf, seed) < 0.55 ? 2 : 1, tall = 3 + Math.floor(hash(u, shelf, seed + 1) * 3);
        if (hash(u, shelf, seed + 2) > 0.08) R(u, sy + 5 - tall, bw, tall, SPINES[Math.floor(hash(u, shelf, seed + 3) * SPINES.length)]);
        u += bw;
      }
    }
    for (let u = 0; u <= RUN - 2; u += 21) R(Math.min(u, RUN - 2), 65, 2, 32, C.oak);
    R(0, 97, RUN, 7, C.oak); R(0, 97, RUN, 1, C.oakHi);
    for (let u = 3; u < RUN - 6; u += 10) R(u, 99, 7, 4, C.oakDk);
    // a rolling ladder
    for (const u of [48, 53]) R(u, 68, 1, 37, "#b98a52");
    for (let y = 71; y < 104; y += 4) R(49, y, 4, 1, "#9a6f3e");
    // a reading desk with a book open on it
    R(DESK, 100, 15, 2, C.oakHi); R(DESK + 1, 102, 13, 4, C.oakDk);
    R(DESK, 102, 1, 6, C.oak); R(DESK + 14, 102, 1, 6, C.oak);
    R(DESK + 7, 99, 5, 1, "#f4ecd8"); R(DESK + 9, 99, 1, 1, "#b9ad92");
    R(DESK + 2, 96, 1, 4, C.giltDk); R(DESK + 1, 94, 3, 2, "#2f8a5a");
  }

  for (const t of towers(w)) {
    const x = t.x;
    // the tower: lighter stone, shaded evenly down both edges
    l.rect(x - PIER, 0, PIER * 2, FLOOR, C.pier);
    l.rect(x - PIER, 0, 2, FLOOR, C.pierDk); l.rect(x + PIER - 2, 0, 2, FLOOR, C.pierDk);
    l.rect(x - PIER + 2, 0, 1, FLOOR, C.pierHi); l.rect(x + PIER - 3, 0, 1, FLOOR, C.pierHi);
    for (let y = 4; y < FLOOR; y += 6) {
      l.rect(x - PIER + 3, y, PIER * 2 - 6, 1, C.pierLine);
      for (const j of (y / 6) % 2 < 1 ? [-5, 5] : [0]) l.rect(x + j, y + 1, 1, 5, C.pierLine);
    }
    l.rect(x - PIER - 1, FLOOR - 5, PIER * 2 + 2, 5, C.pierDk); l.rect(x - PIER - 1, FLOOR - 5, PIER * 2 + 2, 1, C.pierHi);

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
    /** a big picture where a storey has no door */
    const picture = (base: number) => {
      l.rect(x - 6, base - 20, 13, 16, C.gilt); l.rect(x - 6, base - 20, 13, 1, C.giltHi);
      l.rect(x - 5, base - 19, 11, 14, CANVAS[Math.abs(t.k) % CANVAS.length]);
      l.rect(x - 1, base - 17, 3, 3, SKIN); l.rect(x - 3, base - 14, 7, 9, ROBES[Math.abs(t.k + 1) % ROBES.length]);
      l.rect(x - 1, base - 14, 3, 2, "#e8e0cc");
    };
    const lantern = (lx: number, ly: number) => {
      l.rect(lx - 1, ly - 2, 3, 1, C.dark); l.rect(lx - 1, ly - 1, 3, 4, "#3a2a1a"); l.rect(lx, ly, 1, 2, C.glow); l.rect(lx, ly + 3, 1, 1, C.dark);
    };

    const has = balconies(t);
    doorAt(FLOOR, t.even ? 17 : 13, t.even ? 26 : 21, t.even);
    for (const level of [STOREY, 2 * STOREY]) {
      const y = FLOOR - level;
      if (!has.includes(level)) { picture(y); continue; }
      doorAt(y, 13, 21);
      // the balcony: a slab on corbels, with a balustrade along its front
      l.rect(x - PIER, y, PIER * 2, 5, C.tread2); l.rect(x - PIER, y, PIER * 2, 1, C.tread);
      l.rect(x - PIER, y + 5, PIER * 2, 3, C.side); l.rect(x - PIER, y + 7, PIER * 2, 1, C.sideDk);
      l.rect(x - PIER + 2, y + 8, PIER * 2 - 4, 2, C.pierDk); l.rect(x - PIER + 5, y + 10, PIER * 2 - 10, 2, "#5a4934");
      for (let j = -PIER + 3; j < PIER - 1; j += 3) l.rect(x + j, y - 3, 1, 8, C.post);
      l.rect(x - PIER, y - 5, 2, 10, C.rail); l.rect(x + PIER - 2, y - 5, 2, 10, C.rail);
      l.rect(x - PIER, y - 4, PIER * 2, 1, C.rail); l.rect(x - PIER, y - 3, PIER * 2, 1, C.railDk);
    }
    for (const level of [0, ...has]) for (const sgn of [-1, 1]) lantern(x + sgn * 10, FLOOR - level - (level ? 18 : 22));
    if (t.even) {
      // a runner from the great door to the front of the hall
      l.rect(x - 7, FLOOR, 15, H - FLOOR, "#8f2f2a"); l.rect(x - 7, FLOOR, 1, H - FLOOR, C.gilt); l.rect(x + 7, FLOOR, 1, H - FLOOR, C.gilt);
    }
  }
  // the shaft goes on up into shadow
  for (let i = 0; i < 12; i++) l.rect(0, i, w, 1, "#0d0906", (12 - i) * 0.035);
  l.rect(0, H - 1, w, 1, C.dark);
}

type Mover = { k: number; x: number; side: 1 | -1; t0: number; next: number };
type State = { movers: Mover[]; f: number };

export const stairwell: Scene<State> = {
  w: W,
  h: H,
  fps: 12,
  poster: 20,
  fluid: true,
  alt: "The grand staircase, seen from the front: stone towers with arched doors and balconies, pale flights of stairs crossing between them on three storeys, walls crowded with gilt-framed portraits above a ground floor lined with bookcases, tall windows, lanterns and floating candles. Now and then one of the flights swings round to the other side.",
  init(_rng, w) {
    const movers: Mover[] = towers(w).filter((t) => t.even).map((t) => ({
      k: t.k, x: t.x, side: t.k > 0 ? -1 : 1, t0: -1, next: FIRST + Math.abs(t.k) * 14,
    }));
    return { movers, f: 0 };
  },
  draw(g, f, s, env) {
    const w = g.w;
    s.f = f;
    g.layer("hall", (l) => paintHall(l, w));

    // the flights that stay put: ground floor up to the even towers, and the top storey on up out of sight
    for (const t of towers(w)) if (!t.even) for (const dir of [1, -1]) {
      const a = dir > 0 ? 0 : Math.PI;
      // someone on each flight: down, a pause, and back up again
      const walker = (id: number): Walker => {
        const lap = 420, u = (f + Math.floor(hash(id, 3, 33) * lap)) % lap;
        const along = u < 180 ? u / 180 : u < 210 ? 1 : u < 390 ? 1 - (u - 210) / 180 : 0;
        return { d: PIER + RUN - 2 - along * (RUN - 4), look: Math.floor(hash(id, 7, 34) * 16) };
      };
      flight(g, t.x, 2 * STOREY, a, [walker(t.k * 4 + dir + 100)]);
      flight(g, t.x, 0, a, [walker(t.k * 4 + dir)]);
    }
    // and the ones that move
    for (const m of s.movers) {
      if (m.t0 < 0 && f >= m.next) m.t0 = f;
      let p = 0;
      if (m.t0 >= 0) {
        p = (f - m.t0) / SWING;
        if (p >= 1) { m.side = m.side > 0 ? -1 : 1; m.t0 = -1; m.next = f + REST + Math.floor(hash(m.k, f, 32) * 24); p = 0; }
      }
      const ease = p * p * (3 - 2 * p), from = m.side > 0 ? 0 : Math.PI;
      // whoever was half-way up when it set off simply rides it round
      flight(g, m.x, STOREY, from + (Math.PI - 2 * from) * ease, [{ d: PIER + GOING * 9 + 2, look: Math.abs(m.k) + 2 }]);
    }

    if (env.night) g.rect(0, 0, w, H, "#0a0e22", 0.5);

    // everything that gives off light, so that it still glows after dark
    const lit = env.night ? 1 : 0.55;
    for (const t of towers(w)) {
      if (t.even) for (const dir of [1, -1]) {
        const X = (u: number) => (dir > 0 ? t.x + PIER + u : t.x - PIER - u);
        if (env.night) windowAt(g, X(42), 52, 50, true);
        CANDLES.forEach(([u, y], i) => {
          const cy = y + Math.round(Math.sin(f * 0.07 + i * 1.7 + t.k) * 1.5), x = X(u);
          g.disc(x, cy - 1, 4, C.glow, 0.13 * lit);
          g.rect(x, cy, 1, 4, "#f3ead6");
          g.px(x, cy - 1, Math.floor(f / 3 + i) % 4 ? "#ffe9a8" : "#ffb347");
        });
        const lamp = X(DESK + 2);
        g.disc(lamp, 95, 5, "#8fe0a8", 0.16 * lit);
        g.rect(lamp - 1, 94, 3, 2, "#5fd08c");
      }
      for (const level of [0, ...balconies(t)]) {
        const y = FLOOR - level;
        for (const sgn of [-1, 1]) {
          const lx = t.x + sgn * 10, ly = y - (level ? 18 : 22);
          g.disc(lx, ly + 1, 5, C.glow, 0.14 * lit);
          g.rect(lx, ly, 1, 2, Math.floor(f / 4 + lx) % 5 ? "#ffe9a8" : "#ffc04a");
        }
        if (level || !t.even) arch(g, t.x, y, 9, 14, "#ffb04a", 0.12 * lit);
      }
    }
  },
  /** A tap sends the nearest moving flight round to its other side. */
  pointer(s, x) {
    let best: Mover | null = null;
    for (const m of s.movers) if (!best || Math.abs(m.x - x) < Math.abs(best.x - x)) best = m;
    if (!best || best.t0 >= 0) return false;
    best.next = s.f;
    return true;
  },
};
