// A real puzzle cube: 27 pieces, each carrying its stickers. Any layer can be
// given a quarter turn about any of the three axes. This file is the cube
// itself and how a finger on its picture maps to a move; it imports nothing,
// so it can be tested on its own (tests/cube.test.mjs). Drawing is in cube.ts.

export type Vec = [number, number, number];
/** A quarter turn of the layer at `layer` (-1, 0 or 1) along `axis` (0 = x, 1 = y, 2 = z); +1 is right-handed. */
export type Move = { axis: 0 | 1 | 2; layer: number; dir: 1 | -1 };
/** A piece: where it is (each coordinate -1, 0 or 1) and its sticker on each of six sides (+x, -x, +y, -y, +z, -z). */
export type Piece = { p: Vec; st: (string | null)[] };
export type CubeState = Piece[];

// sticker colours by side: +x, -x, +y, -y, +z, -z
const COLOURS = ["#2f6fd6", "#2f9d5a", "#c8321f", "#f08a2c", "#fdfbf7", "#f2c14e"];
export const side = (axis: number, sign: number) => axis * 2 + (sign > 0 ? 0 : 1);

/** A quarter turn of a vector about `axis`. */
export function turn(v: Vec, axis: number, dir: number): Vec {
  const u = (axis + 1) % 3, w = (axis + 2) % 3;
  const r: Vec = [v[0], v[1], v[2]];
  r[u] = -dir * v[w];
  r[w] = dir * v[u];
  return r;
}

export function solvedCube(): CubeState {
  const out: CubeState = [];
  for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
    const p: Vec = [x, y, z];
    const st: (string | null)[] = [null, null, null, null, null, null];
    for (let a = 0; a < 3; a++) if (p[a] !== 0) st[side(a, p[a])] = COLOURS[side(a, p[a])];
    out.push({ p, st });
  }
  return out;
}

export function applyMove(cube: CubeState, m: Move) {
  for (const piece of cube) {
    if (piece.p[m.axis] !== m.layer) continue;
    piece.p = turn(piece.p, m.axis, m.dir);
    const st: (string | null)[] = [null, null, null, null, null, null];
    for (let a = 0; a < 3; a++) for (const sign of [1, -1]) {
      const n: Vec = [0, 0, 0];
      n[a] = sign;
      const r = turn(n, m.axis, m.dir);
      const ra = r.findIndex((c) => c !== 0);
      st[side(ra, r[ra])] = piece.st[side(a, sign)];
    }
    piece.st = st;
  }
}

export const inverse = (m: Move): Move => ({ ...m, dir: m.dir === 1 ? -1 : 1 });

export function isSolved(cube: CubeState) {
  for (let s = 0; s < 6; s++) {
    const seen = new Set(cube.map((p) => p.st[s]).filter(Boolean));
    if (seen.size > 1) return false;
  }
  return true;
}

export function randomMove(avoid?: Move): Move {
  for (;;) {
    const m: Move = { axis: Math.floor(Math.random() * 3) as 0 | 1 | 2, layer: Math.floor(Math.random() * 3) - 1, dir: Math.random() < 0.5 ? 1 : -1 };
    // not the move that would simply undo the last one
    if (!avoid || m.axis !== avoid.axis || m.layer !== avoid.layer || m.dir === avoid.dir) return m;
  }
}

// --- the picture -----------------------------------------------------------
// Each piece is 3 units across with a 1-unit seam between pieces, so the cube
// is 11 units a side. It is seen from the (1, 1, 1) corner, in the 2:1
// "isometric" projection of pixel art: a point (x, y, z) lands on the pixel
// (30 + 2(x - y), 30 + x + y - 2z) of a 60 x 60 drawing.
export const N = 11, MID = N / 2;
export const CUBE_PX = 60;

/** A point on the line of sight through a pixel of the drawing. The line runs along (1, 1, 1), toward the viewer. */
export function sight(px: number, py: number): Vec {
  const a = (px - CUBE_PX / 2) / 2, b = py - CUBE_PX / 2;
  return [(a + b) / 2, (b - a) / 2, 0];
}

/**
 * Where the line from `o` along `d` leaves the box lo..hi on the viewer's
 * side: how far along, and through which face. Null if it misses.
 */
export function castBox(o: Vec, d: Vec, lo: Vec, hi: Vec): { t: number; axis: 0 | 1 | 2; sign: 1 | -1 } | null {
  let tIn = -Infinity, tOut = Infinity, axis: 0 | 1 | 2 = 0;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-9) {
      if (o[k] < lo[k] || o[k] > hi[k]) return null;
      continue;
    }
    const t1 = (lo[k] - o[k]) / d[k], t2 = (hi[k] - o[k]) / d[k];
    if (Math.max(t1, t2) < tOut) { tOut = Math.max(t1, t2); axis = k as 0 | 1 | 2; }
    tIn = Math.max(tIn, Math.min(t1, t2));
  }
  return tIn > tOut ? null : { t: tOut, axis, sign: d[axis] > 0 ? 1 : -1 };
}

/** which piece (-1, 0 or 1) a coordinate 0..11 falls in */
const cell = (v: number) => Math.max(0, Math.min(2, Math.floor(v / 4))) - 1;

/**
 * What is under a point of the drawing: which visible face (0 top, 1 left,
 * 2 right) and which piece of it. Null if the point misses the cube.
 */
export function hitCube(px: number, py: number): { face: 0 | 1 | 2; c: Vec } | null {
  const o = sight(px, py);
  const h = castBox(o, [1, 1, 1], [0, 0, 0], [N, N, N]);
  if (!h) return null;
  const c: Vec = [cell(o[0] + h.t), cell(o[1] + h.t), cell(o[2] + h.t)];
  c[h.axis] = 1;
  return { face: ([2, 1, 0] as const)[h.axis], c };
}
// how each axis runs across the screen
const SCREEN: [number, number][] = [[2, 1], [-2, 1], [0, -2]];
/** For a drag along `along` on `face`: [the axis to turn about, the sign that makes the stickers follow the finger]. */
const TURNS: Record<number, [number, number, number][]> = {
  0: [[0, 1, 1], [1, 0, -1]], // on top: along x turns about y; along y turns about x, the other way
  2: [[1, 2, 1], [2, 1, -1]], // on the right face: along y about z; along z about y
  1: [[0, 2, -1], [2, 0, 1]], // on the left face: along x about z; along z about x
};

/** The move a drag of (dx, dy) screen pixels makes when it starts on `hit`. A bare tap turns along the face's first axis. */
export function dragMove(hit: { face: 0 | 1 | 2; c: Vec }, dx: number, dy: number): Move {
  let best = TURNS[hit.face][0], sign = 1, most = -1;
  for (const option of TURNS[hit.face]) {
    const [sx, sy] = SCREEN[option[0]];
    const dot = (dx * sx + dy * sy) / Math.hypot(sx, sy);
    if (Math.abs(dot) > most) { most = Math.abs(dot); best = option; sign = dot < 0 ? -1 : 1; }
  }
  const [, about, follow] = best;
  return { axis: about as 0 | 1 | 2, layer: hit.c[about], dir: (sign * follow) as 1 | -1 };
}
