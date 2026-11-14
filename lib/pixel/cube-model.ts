// A real puzzle cube: 27 pieces, each carrying its stickers. Any layer can be
// given a quarter turn about any of the three axes. This file is the cube
// itself and how a finger on its picture maps to a move; it imports nothing,
// so it can be tested on its own (tests/cube.test.mjs). Drawing is in cube.ts.

export type Vec = [number, number, number];
/** A quarter turn of the layer at `layer` (-1, 0 or 1) along `axis` (0 = x, 1 = y, 2 = z); +1 is right-handed. */
export type Move = { axis: 0 | 1 | 2; layer: number; dir: 1 | -1; /** turn the whole cube over, not one layer of it */ whole?: true };
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
    if (!m.whole && piece.p[m.axis] !== m.layer) continue;
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
// is 11 units a side. It is drawn in the 2:1 "isometric" projection of pixel
// art: a point (x, y, z) lands on the pixel (30 + 2(x - y), TOP + x + y - RISE z)
// of a 60 x 60 drawing. A unit along x or y covers the square root of 5
// pixels (2 across and 1 down), so a unit of height is given the same, and
// all twelve edges of the cube come out the same length.
export const N = 11, MID = N / 2;
export const CUBE_PX = 60;
const RISE = Math.sqrt(5), TOP = 31;
/** The direction of the lines of sight, toward the viewer: moving along it does not move a point on the drawing. */
export const SIGHT: Vec = [1, 1, 2 / RISE];

/** A point on the line of sight through a pixel of the drawing. */
export function sight(px: number, py: number): Vec {
  const a = (px - CUBE_PX / 2) / 2, b = py - TOP;
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
  const h = castBox(o, SIGHT, [0, 0, 0], [N, N, N]);
  if (!h) return null;
  const c: Vec = [cell(o[0] + h.t * SIGHT[0]), cell(o[1] + h.t * SIGHT[1]), cell(o[2] + h.t * SIGHT[2])];
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

// --- solving it the way a person would --------------------------------------
// Not the shortest way, the usual way: a cross on the bottom, then the four
// corner-and-edge pairs of the first two layers, then the top layer turned
// the right way up (OLL), then put in place (PLL). Each stage is a small
// search over the moves a person would use at that stage: single turns for
// the cross, the insert-and-take-out triggers for the pairs, and the standard
// algorithms for the top layer, written in the usual notation.
//
// A note on handedness: the drawing is a mirror image of a cube in the usual
// right-handed layout (U up, R right, F front), which changes nothing about
// how the algorithms work. Read "clockwise" as a right-handed quarter turn
// about the face's outward normal in this file's coordinates.

type Turn = { n: Vec; cw: boolean };
const FACES: Record<string, Vec> = { R: [1, 0, 0], L: [-1, 0, 0], F: [0, 1, 0], B: [0, -1, 0], U: [0, 0, 1], D: [0, 0, -1] };
function parse(alg: string): Turn[] {
  return alg.split(" ").flatMap((t) => {
    const n = FACES[t[0]];
    return t[1] === "2" ? [{ n, cw: true }, { n, cw: true }] : [{ n, cw: t[1] !== "'" }];
  });
}

// The 24 ways of turning a whole cube over, as matrices. Where a piece has got
// to, and which way round, is one of these applied to where it belongs.
const ROTS: number[][] = [];
for (const perm of [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]]) for (let bits = 0; bits < 8; bits++) {
  const m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let j = 0; j < 3; j++) m[perm[j] * 3 + j] = bits & (1 << j) ? -1 : 1;
  const det = m[0] * (m[4] * m[8] - m[5] * m[7]) - m[1] * (m[3] * m[8] - m[5] * m[6]) + m[2] * (m[3] * m[7] - m[4] * m[6]);
  if (det === 1) ROTS.push(m);
}
const rotIndex = new Map(ROTS.map((m, i) => [m.join(), i]));
const SAME = rotIndex.get("1,0,0,0,1,0,0,0,1")!;
const rot = (r: number, v: Vec): Vec => {
  const m = ROTS[r];
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
};
/** COMP[a][b]: turn by b, then by a */
const COMP = ROTS.map((a) => ROTS.map((b) => {
  const m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) m[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
  return rotIndex.get(m.join())!;
}));
const UNDO = ROTS.map((_, a) => COMP[a].indexOf(SAME));
const neg = (v: Vec): Vec => [-v[0], -v[1], -v[2]];
const dot = (a: Vec, b: Vec) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** a right-handed quarter turn about the unit vector n */
function quarterAbout(n: Vec) {
  const col = (v: Vec): Vec => { const d = dot(n, v); return [n[0] * d + n[1] * v[2] - n[2] * v[1], n[1] * d + n[2] * v[0] - n[0] * v[2], n[2] * d + n[0] * v[1] - n[1] * v[0]]; };
  const x = col([1, 0, 0]), y = col([0, 1, 0]), z = col([0, 0, 1]);
  return rotIndex.get([x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]].join())!;
}
const turnOf = (t: Turn) => quarterAbout(t.cw ? t.n : neg(t.n));

/** For a piece that belongs at `h`: which way round it ends up after some turns, for each way round it could start. */
function after(h: Vec, turns: Turn[]) {
  const out = new Uint8Array(24);
  for (let g = 0; g < 24; g++) {
    let now = g;
    for (const t of turns) if (dot(rot(now, h), t.n) === 1) now = COMP[turnOf(t)][now];
    out[g] = now;
  }
  return out;
}

/**
 * The shortest run of `macros` that brings the pieces belonging at `hs`,
 * now turned `start`, to a state that is `done`. Breadth first, so shortest
 * in the number of macros used.
 */
function search(hs: Vec[], start: number[], macros: Turn[][], done: (gs: number[]) => boolean): Turn[] {
  const tables = macros.map((m) => hs.map((h) => after(h, m)));
  const key = (gs: number[]) => gs.reduce((k, g, i) => k + g * 24 ** i, 0);
  const from = new Map<number, [number, number]>([[key(start), [-1, -1]]]);
  const queue: number[][] = [start];
  for (let at = 0; at < queue.length; at++) {
    const gs = queue[at];
    if (done(gs)) {
      const out: Turn[][] = [];
      for (let k = key(gs), step = from.get(k)!; step[1] >= 0; k = step[0], step = from.get(k)!) out.push(macros[step[1]]);
      return out.reverse().flat();
    }
    const k = key(gs);
    for (let m = 0; m < macros.length; m++) {
      const next = gs.map((g, i) => tables[m][i][g]), nk = key(next);
      if (from.has(nk)) continue;
      from.set(nk, [k, m]);
      queue.push(next);
    }
  }
  throw new Error("the cube cannot be solved from here");
}

// The cross is the one stage with a big search behind it (the four edges can
// be in about 190,000 arrangements), so it is done once, backwards from the
// finished cross: for every arrangement, the single turn that brings it one
// step nearer. After that a cross is just a matter of following the table.
const CROSS_EDGES: Vec[] = [[1, 0, -1], [-1, 0, -1], [0, 1, -1], [0, -1, -1]];
const SINGLES: Turn[][] = Object.values(FACES).flatMap((n) => [[{ n, cw: true }], [{ n, cw: false }], [{ n, cw: true }, { n, cw: true }]]);
let crossSteps: Int8Array | null = null;
let crossTurns: Uint8Array[][] | null = null;
function crossTable() {
  if (crossSteps && crossTurns) return { steps: crossSteps, turns: crossTurns };
  const turns = SINGLES.map((m) => CROSS_EDGES.map((h) => after(h, m)));
  const steps = new Int8Array(24 ** 4).fill(-2), queue = new Int32Array(24 ** 4);
  const start = SAME * (1 + 24 + 576 + 13824);
  let head = 0, tail = 0;
  steps[start] = -1;
  queue[tail++] = start;
  while (head < tail) {
    const k = queue[head++], a = k % 24, b = ((k / 24) | 0) % 24, c = ((k / 576) | 0) % 24, d = (k / 13824) | 0;
    for (let m = 0; m < 18; m++) {
      const next = turns[m][0][a] + 24 * turns[m][1][b] + 576 * turns[m][2][c] + 13824 * turns[m][3][d];
      if (steps[next] !== -2) continue;
      steps[next] = m % 3 === 2 ? m : m % 3 === 0 ? m + 1 : m - 1; // the turn that undoes this one
      queue[tail++] = next;
    }
  }
  crossSteps = steps; crossTurns = turns;
  return { steps, turns };
}

const TOP_TURNS = ["U", "U'", "U2"].map(parse);
// taking a pair out of the front-right slot and putting it back, from either side
const TRIGGERS = ["R U R'", "R U' R'", "R U2 R'", "F' U F", "F' U' F", "F' U2 F"].map(parse);
// turning the top layer's pieces the right way up: two for its edges, then Sune and its mirror for the corners
const OLL = ["F R U R' U' F'", "F U R U' R' F'", "R U R' U R U2 R'", "R U2 R' U' R U' R'"].map(parse);
// moving the top layer's pieces round: the T, both A's and both U's
const PLL = ["R U R' U' R' F R2 U' R' U' R U R' F'", "R' F R' B2 R F' R' B2 R2", "R2 B2 R F R' B2 R F' R", "R U' R U R U R U' R' U' R2", "R2 U R U R' U' R' U' R' U R'"].map(parse);
const SLOTS: [number, number][] = [[1, 1], [-1, 1], [-1, -1], [1, -1]];

/**
 * How to solve a cube from wherever it is: the turns, in order, and where in
 * that list the cross, the first two layers, OLL and PLL each finish.
 */
export type Part = {
  /** where in the list of turns this part finishes */
  end: number;
  /** the face it is mostly about: best seen on top */
  top: Vec;
  /** for a corner-and-edge pair, the two side faces its slot lies between: best seen as the two faces toward the viewer */
  sides?: [Vec, Vec];
};

export function solve(cube: CubeState): { moves: Move[]; stages: number[]; parts: Part[] } {
  const normal = (s: number): Vec => { const v: Vec = [0, 0, 0]; v[s >> 1] = s % 2 ? -1 : 1; return v; };
  /** which way round a piece is, judging by where its stickers face */
  const turned = (p: Piece) => {
    const pairs = p.st.flatMap((c, s) => (c === null ? [] : [[normal(COLOURS.indexOf(c)), normal(s)]]));
    return ROTS.findIndex((_, r) => pairs.every(([home, now]) => rot(r, home).join() === now.join()));
  };
  const home = (p: Piece): Vec => p.st.reduce<Vec>((h, c) => { if (c !== null) { const n = normal(COLOURS.indexOf(c)); h[0] += n[0]; h[1] += n[1]; h[2] += n[2]; } return h; }, [0, 0, 0]);
  const kind = (h: Vec) => Math.abs(h[0]) + Math.abs(h[1]) + Math.abs(h[2]);
  // The six centres turn over together (a middle layer may have been turned), and everything is solved relative to them.
  const centres = cube.filter((p) => kind(home(p)) === 1);
  const core = ROTS.findIndex((_, r) => centres.every((p) => rot(r, home(p)).join() === p.p.join()));
  const all = cube.filter((p) => kind(home(p)) > 1).map((p) => ({ h: home(p), g: COMP[UNDO[core]][turned(p)] }));
  const out: Turn[] = [], stages: number[] = [], parts: Part[] = [];
  const stage = (pieces: typeof all, macros: Turn[][], done: (gs: number[]) => boolean) => {
    const turns = search(pieces.map((p) => p.h), pieces.map((p) => p.g), macros, done);
    for (const t of turns) for (const p of all) if (dot(rot(p.g, p.h), t.n) === 1) p.g = COMP[turnOf(t)][p.g];
    out.push(...turns);
  };
  const home0 = (gs: number[]) => gs.every((g) => g === SAME);
  const at = (h: Vec) => all.find((p) => p.h.join() === h.join())!;

  // the cross, on the bottom: single turns, read off the table
  const { steps, turns } = crossTable(), cross = CROSS_EDGES.map(at);
  for (;;) {
    const m = steps[cross.reduce((k, p, i) => k + p.g * 24 ** i, 0)];
    if (m < 0) break;
    cross.forEach((p, i) => (p.g = turns[m][i][p.g]));
    const moved = new Set(cross);
    for (const t of SINGLES[m]) for (const p of all) if (!moved.has(p) && dot(rot(p.g, p.h), t.n) === 1) p.g = COMP[turnOf(t)][p.g];
    out.push(...SINGLES[m]);
  }
  stages.push(out.length);
  parts.push({ end: out.length, top: [0, 0, -1] });
  // the first two layers: one corner-and-edge pair at a time, using only the top layer and the slots still empty
  const up = quarterAbout([0, 0, 1]);
  SLOTS.forEach(([sx, sy], done) => {
    const triggers = SLOTS.slice(done).flatMap(([tx, ty]) => {
      let r = SAME;
      while (rot(r, [1, 1, 0]).join() !== [tx, ty, 0].join()) r = COMP[up][r];
      return TRIGGERS.map((alg) => alg.map((t) => ({ n: rot(r, t.n), cw: t.cw })));
    });
    stage([at([sx, sy, -1]), at([sx, sy, 0])], [...TOP_TURNS, ...triggers], home0);
    parts.push({ end: out.length, top: [0, 0, 1], sides: [[sx, 0, 0], [0, sy, 0]] });
  });
  stages.push(out.length);
  // the top layer: the right way up, then in place
  const top = all.filter((p) => p.h[2] === 1);
  stage(top, [...TOP_TURNS, ...OLL], (gs) => gs.every((g) => rot(g, [0, 0, 1])[2] === 1));
  stages.push(out.length);
  parts.push({ end: out.length, top: [0, 0, 1] });
  stage(top, [...TOP_TURNS, ...PLL], home0);
  stages.push(out.length);
  parts.push({ end: out.length, top: [0, 0, 1] });

  const moves = out.map((t): Move => {
    const n = rot(core, t.n), axis = n.findIndex((v) => v !== 0) as 0 | 1 | 2;
    return { axis, layer: n[axis], dir: ((t.cw ? 1 : -1) * n[axis]) as 1 | -1 };
  });
  // the parts were noted relative to the centres; say them as the cube now stands
  return { moves, stages, parts: parts.map((p) => ({ end: p.end, top: rot(core, p.top), sides: p.sides && [rot(core, p.sides[0]), rot(core, p.sides[1])] })) };
}

/** A scramble of `n` turns of the outside layers, no layer turned twice running. */
export function scramble(n: number): Move[] {
  const out: Move[] = [];
  while (out.length < n) {
    const m: Move = { axis: Math.floor(Math.random() * 3) as 0 | 1 | 2, layer: Math.random() < 0.5 ? 1 : -1, dir: Math.random() < 0.5 ? 1 : -1 };
    const last = out.at(-1);
    if (!last || last.axis !== m.axis || last.layer !== m.layer) out.push(m);
  }
  return out;
}

// --- showing the work ---------------------------------------------------------
// Only three faces of the cube can be seen, and most of a solve happens on the
// other three: the cross is made on the bottom, and three of the four pairs go
// in round the back. So, as a person does, the cube is turned over in the hand
// between one part of the solve and the next, to bring what is being worked on
// to the front: the cross on top while it is made, then each pair's slot to
// the corner nearest the viewer, then the top layer on top for the rest.

/** One part of a performance: turn the whole cube to this view (if it needs it), then make these turns. */
export type Scene = { look: Move[]; moves: Move[] };

/** The six ways of turning the whole cube a quarter turn over. */
const TUMBLES: Move[] = [0, 1, 2].flatMap((axis) => [1, -1].map((dir) => ({ axis, layer: 0, dir, whole: true }) as Move));
const tumbleOf = (m: Move) => { const n: Vec = [0, 0, 0]; n[m.axis] = m.dir; return quarterAbout(n); };

/**
 * A solve with the cube turned over between its parts so that each can be
 * seen, and once right round at the end to show every side finished.
 */
export function perform(cube: CubeState): Scene[] {
  const { moves, parts } = solve(cube);
  const scenes: Scene[] = [];
  let held = SAME, from = 0; // how the cube has been turned over so far
  for (const part of parts) {
    if (part.end === from) continue; // nothing to do in this part, so nothing to look at
    const shows = (r: number) => {
      if (rot(r, part.top).join() !== "0,0,1") return false;
      return !part.sides || part.sides.every((side) => { const n = rot(r, side); return n[0] === 1 || n[1] === 1; });
    };
    // the fewest quarter turns of the whole cube that bring a view like that round
    const seen = new Map<number, Move[]>([[held, []]]), queue = [held];
    let look: Move[] = [];
    for (let i = 0; i < queue.length; i++) {
      const r = queue[i], path = seen.get(r)!;
      if (shows(r)) { held = r; look = path; break; }
      for (const t of TUMBLES) { const next = COMP[tumbleOf(t)][r]; if (!seen.has(next)) { seen.set(next, [...path, t]); queue.push(next); } }
    }
    // the turns were worked out for the cube as it stood: carry each to where its layer has got to
    const carried = moves.slice(from, part.end).map((m): Move => {
      const n: Vec = [0, 0, 0];
      n[m.axis] = m.layer;
      const k = rot(held, n), axis = k.findIndex((v) => v !== 0) as 0 | 1 | 2;
      return { axis, layer: k[axis], dir: (m.dir * m.layer * k[axis]) as 1 | -1 };
    });
    scenes.push({ look, moves: carried });
    from = part.end;
  }
  scenes.push({ look: [TUMBLES[4], TUMBLES[4], TUMBLES[4], TUMBLES[4]], moves: [] });
  return scenes;
}
