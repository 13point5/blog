import { hash, type Scene } from "../engine";
import { Voxels } from "../voxel";

// A voxel diorama: the corner of a great library where it opens onto a
// stairwell. One wall is all books, the other is sandstone hung with
// portraits, and two flights of stairs keep swinging round to new landings
// while candles float overhead. It has no background: it sits on the page
// like a model on a desk.

const W = 112, H = 80;
const N = 20; // floor size
const WALL = 15;
const OAK = "#5a3a20", OAK_DK = "#3f2815", STONE = "#d8b47c", STONE_2 = "#caa268", STEP = "#f0d9ac", STEP_2 = "#dcc08c";
const SPINES = ["#a8402f", "#c9973a", "#4a6a44", "#3a5a82", "#d8c08a", "#7a4468", "#b5622f", "#8a9a62"];
// portraits on the stone wall: [along the wall, height off the floor, width, height]
const PORTRAITS: [number, number, number, number][] = [[3, 3, 4, 5], [14, 4, 4, 5], [8, 10, 4, 5], [15, 11, 3, 4]];
const CANDLES: [number, number][] = [[8, 6], [13, 5], [15, 11], [9, 13], [6, 16]];

/** 0 → 1 → 0 with long rests at each end, like something heavy swinging round. */
function swing(f: number, period: number, offset: number) {
  const t = ((f + offset) % period) / period;
  const ramp = (u: number) => u * u * (3 - 2 * u);
  return t < 0.35 ? 0 : t < 0.5 ? ramp((t - 0.35) / 0.15) : t < 0.85 ? 1 : 1 - ramp((t - 0.85) / 0.15);
}

/**
 * A flight of `n` steps, three wide, from (px, py, z) heading along angle `a`.
 * `rise` is +1 or -1 per step; each step is filled `fill` cubes down, so a
 * flight can be a solid staircase or a floating one.
 */
function flight(m: Voxels, px: number, py: number, z: number, a: number, n: number, rise: number, fill: (z: number) => number) {
  const dx = Math.cos(a), dy = Math.sin(a);
  for (let i = 0; i < n; i++) for (let s = -1; s <= 1; s++) {
    const top = z + rise * i;
    for (let k = 0; k < fill(top); k++) m.set(px + dx * i - dy * s, py + dy * i + dx * s, top - k, i % 2 ? STEP : STEP_2);
  }
}

function build(f: number) {
  const m = new Voxels();
  // floor: chequered boards with a carpet runner
  for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) m.set(x, y, 0, (x + y) % 2 ? "#96643a" : "#855530");
  for (let x = 6; x < N; x++) for (let y = 12; y <= 14; y++) m.set(x, y, 0, y === 13 ? "#8f2f2a" : "#c9973a");
  // the book wall
  for (let x = 0; x < N; x++) for (let z = 1; z <= WALL; z++) {
    const c = x % 5 === 0 ? OAK_DK : z % 3 === 1 ? OAK : hash(x, z, 3) < 0.07 ? "#1c110a" : SPINES[Math.floor(hash(x, z, 5) * SPINES.length)];
    m.set(x, 0, z, c);
  }
  // the stone wall, with gilt-framed portraits
  for (let y = 1; y < N; y++) for (let z = 1; z <= WALL; z++) m.set(0, y, z, hash(y >> 1, z >> 1, 8) < 0.5 ? STONE : STONE_2);
  PORTRAITS.forEach(([py, pz, pw, ph], n) => {
    for (let j = 0; j < pw; j++) for (let k = 0; k < ph; k++) {
      const edge = j === 0 || k === 0 || j === pw - 1 || k === ph - 1;
      const sitter = j > 0 && j < pw - 1 && k === ph - 2 ? "#f0cfa8" : j > 0 && j < pw - 1 && k < ph - 2 ? ["#8a3a3a", "#2f6a52", "#4a4a9a", "#7a5a2a"][n] : "#2a2030";
      m.face(0, py + j, pz + k, 2, edge ? "#ffd772" : sitter);
    }
  });
  for (let i = 0; i < N; i++) { m.set(i, 0, WALL + 1, OAK_DK); m.set(0, i, WALL + 1, "#a88452"); }
  // busts on plinths, a rolling ladder, a reading desk with a green lamp
  for (const bx of [3, 17]) m.box(bx, 1, 1, 1, 1, 2, OAK_DK).box(bx, 1, 3, 1, 1, 2, "#ece5d3");
  for (let z = 1; z <= 11; z++) m.set(8, 1, z, z % 2 ? "#c08a4c" : "#8a5a2c");
  for (const [lx, ly] of [[14, 16], [18, 16], [14, 18], [18, 18]]) m.box(lx, ly, 1, 1, 1, 2, OAK_DK);
  m.box(14, 16, 3, 5, 3, 1, OAK).box(15, 17, 4, 2, 1, 1, "#fdfbf7").set(18, 16, 4, "#c9973a").set(18, 16, 5, "#3f9a6a", true);
  // two landings on the walls
  m.box(1, 8, 6, 3, 3, 1, STONE_2).box(1, 1, 11, 3, 3, 1, STONE_2);
  // a solid staircase from the floor to the first landing, and a floating one
  // from there to the corner; each swings a quarter turn and back
  flight(m, 4, 9, 5, (Math.PI / 2) * swing(f, 200, 0), 5, -1, (top) => top);
  flight(m, 2, 7, 7, -(Math.PI / 2) * (1 - swing(f, 240, 90)), 4, 1, () => 2);
  return m;
}

export const stairwell: Scene<null> = {
  w: W,
  h: H,
  fps: 12,
  poster: 20,
  alt: "A voxel model of a library corner: a wall of books, a sandstone wall of portraits, a reading desk, and two flights of stairs that slowly swing round to new landings under floating candles.",
  init: () => null,
  draw(g, f, _s, env) {
    g.ctx.clearRect(0, 0, W, H);
    const m = build(f);
    const left = Math.floor((W - m.width) / 2), base = H - 2;
    m.draw(g, left, base);
    if (env.night) {
      // after hours: dim the model itself, not the page behind it
      g.ctx.globalCompositeOperation = "source-atop";
      g.rect(0, 0, W, H, "#0b1022", 0.5);
      g.ctx.globalCompositeOperation = "source-over";
    }
    // floating candles, drawn last so they glow in the dark
    CANDLES.forEach(([cx, cy], i) => {
      const z = 12 + Math.sin(f * 0.07 + i * 1.7) * 1.2 + (i % 3);
      const [sx, sy] = m.at(cx, cy, z, left, base);
      g.disc(sx + 1, sy - 1, 3, "#ffc766", env.night ? 0.28 : 0.16);
      g.rect(sx + 1, sy, 2, 4, "#f3ead6");
      g.rect(sx + 1, sy - 2, 2, 2, Math.floor(f / 3 + i) % 4 ? "#ffe9a8" : "#ffb347");
    });
    const [lx, ly] = m.at(18, 16, 5, left, base);
    g.disc(lx + 2, ly + 2, 4, "#8fe0a8", env.night ? 0.3 : 0.14);
  },
};
