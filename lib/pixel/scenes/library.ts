import { hash, type Gfx, type Scene } from "../engine";

// A grand old library, seen front on: two storeys of oak bookcases under a
// vaulted ceiling, marble busts between the bays, a rolling ladder. In the
// middle the wall opens onto a sandstone stairwell hung with portraits, where
// the staircases keep changing their minds about where they lead.

const H = 84;
const BAY = 30; // one bookcase and its pilaster
const WELL = 60; // width of the stairwell
const CEIL = 7, UPPER = 8, GALLERY = 38, LOWER = 44, FLOOR = 74;

const OAK_DK = "#2a1a10", OAK = "#4a2e1a", OAK_HI = "#6f4827", BACK = "#1c110a";
const PLANK = "#7a4a26", PLANK_HI = "#99622f", PLANK_LO = "#5c3519";
const STONE = "#c9a56e", STONE_HI = "#e0c08a", STONE_LO = "#a07c4c", STONE_DK = "#73562f";
const GOLD = "#d9a441", MARBLE = "#ece5d3", MARBLE_LO = "#b9b09a", FLAME = "#ffe9a8", GLOW = "#ffc766";
const SPINES = ["#8a3527", "#b5843a", "#3f5a3a", "#2f4a6a", "#cbb07a", "#6a3a5a", "#5a341d", "#a8502c", "#7d8a5a"];

/** One bookcase's worth of spines between y0 and y1. */
function books(l: Gfx, x: number, w: number, y0: number, y1: number, seed: number) {
  l.rect(x, y0, w, y1 - y0, BACK);
  for (let sy = y0; sy + 7 <= y1 + 1; sy += 7) {
    const row = Math.floor(sy / 7);
    for (let bx = 0; bx < w; ) {
      const h = hash(x + bx, row, seed);
      const bw = h < 0.55 ? 1 : 2;
      const bh = 4 + Math.floor(hash(x + bx, row, seed + 1) * 2.4);
      // now and then: a gap, or a book lying flat
      if (h > 0.94) { bx += 2; continue; }
      if (h > 0.9 && bx + 4 < w) { l.rect(x + bx, sy + 5, 4, 1, SPINES[Math.floor(h * 97) % SPINES.length]); bx += 5; continue; }
      const c = SPINES[Math.floor(hash(x + bx, row, seed + 2) * SPINES.length)];
      l.rect(x + bx, sy + 6 - bh, bw, bh, c);
      if (bw === 2 && bh > 4) l.px(x + bx, sy + 8 - bh, GOLD);
      bx += bw;
    }
    l.rect(x, sy + 6, w, 1, OAK_HI); // the shelf board
  }
}

function paintBay(l: Gfx, x: number, seed: number) {
  const bx = x + 4, bw = BAY - 4;
  // upper bookcase with an arched head
  books(l, bx, bw, UPPER + 2, GALLERY - 1, seed);
  for (let i = 0; i < 5; i++) {
    const cut = [7, 4, 2, 1, 1][i];
    l.rect(bx, UPPER + i, cut, 1, OAK_DK);
    l.rect(bx + bw - cut, UPPER + i, cut, 1, OAK_DK);
    l.rect(bx + cut, UPPER + i, 1, 1, OAK_HI);
    l.rect(bx + bw - cut - 1, UPPER + i, 1, 1, OAK_HI);
  }
  l.rect(bx + 7, UPPER, bw - 14, 2, BACK);
  // lower bookcase
  books(l, bx, bw, LOWER + 2, FLOOR, seed + 5);
  l.rect(bx, LOWER, bw, 2, OAK);
  // pilaster: a fluted oak column with a capital
  l.rect(x, CEIL, 4, FLOOR - CEIL, OAK);
  l.rect(x + 1, CEIL, 1, FLOOR - CEIL, OAK_HI);
  l.rect(x + 3, CEIL, 1, FLOOR - CEIL, OAK_DK);
  l.rect(x - 1, UPPER, 6, 2, OAK_HI);
  l.rect(x - 1, LOWER - 1, 6, 2, OAK_HI);
}

function paintGallery(l: Gfx, x0: number, x1: number) {
  l.rect(x0, GALLERY - 1, x1 - x0, 1, OAK_HI);
  l.rect(x0, GALLERY, x1 - x0, 4, OAK_DK);
  for (let x = x0; x < x1; x += 2) l.rect(x, GALLERY, 1, 4, OAK_HI); // balusters
  l.rect(x0, GALLERY + 4, x1 - x0, 2, OAK);
  l.rect(x0, GALLERY + 4, x1 - x0, 1, OAK_HI);
}

function bust(l: Gfx, x: number) {
  l.rect(x, FLOOR - 9, 6, 9, OAK_DK);
  l.rect(x + 1, FLOOR - 9, 4, 1, OAK_HI);
  l.rect(x + 1, FLOOR - 13, 4, 4, MARBLE);
  l.rect(x + 2, FLOOR - 16, 2, 3, MARBLE);
  l.px(x + 3, FLOOR - 15, MARBLE_LO);
  l.rect(x + 1, FLOOR - 10, 4, 1, MARBLE_LO);
}

const PORTRAITS: [number, number, number, number][] = [
  [4, 12, 7, 9], [14, 10, 6, 7], [24, 14, 8, 10], [36, 11, 6, 8], [47, 14, 7, 9], [5, 40, 6, 8],
  [18, 44, 8, 9], [31, 38, 6, 7], [42, 58, 7, 9], [23, 60, 6, 8], [49, 34, 6, 7], [12, 26, 5, 6], [36, 26, 5, 6],
];

function paintWell(l: Gfx, x: number) {
  // sandstone blocks
  l.rect(x, CEIL, WELL, FLOOR - CEIL, STONE);
  for (let y = CEIL; y < FLOOR; y += 5) {
    l.rect(x, y, WELL, 1, STONE_LO);
    for (let bx = (Math.floor(y / 5) % 2) * 5; bx < WELL; bx += 10) l.rect(x + bx, y, 1, 5, STONE_LO);
    for (let bx = 0; bx < WELL; bx += 10) if (hash(bx, y, 81) < 0.3) l.rect(x + bx + 2, y + 2, 6, 2, STONE_HI);
  }
  // a pointed arch closing the top of the opening
  for (let i = 0; i < 12; i++) {
    const cut = Math.round(((11 - i) / 11) ** 1.6 * (WELL / 2 - 2));
    l.rect(x, CEIL + i, cut, 1, OAK_DK);
    l.rect(x + WELL - cut, CEIL + i, cut, 1, OAK_DK);
    l.px(x + cut, CEIL + i, STONE_DK);
    l.px(x + WELL - cut - 1, CEIL + i, STONE_DK);
  }
  // gilt-framed portraits
  PORTRAITS.forEach(([px, py, w, h], i) => {
    l.rect(x + px, py, w, h, GOLD);
    l.rect(x + px, py + h - 1, w, 1, "#9a7227");
    l.rect(x + px + 1, py + 1, w - 2, h - 2, ["#3a2a22", "#2a3a3a", "#4a2a26", "#2e2e3e"][i % 4]);
    l.rect(x + px + Math.floor(w / 2) - 1, py + 2, 2, 2, "#d9b890"); // a face
    l.rect(x + px + Math.floor(w / 2) - 1, py + 4, 2, h - 6, ["#6a2a2a", "#2a4a3a", "#3a3a6a"][i % 3]);
  });
  // stone jambs either side
  l.rect(x, CEIL, 2, FLOOR - CEIL, STONE_DK);
  l.rect(x + WELL - 2, CEIL, 2, FLOOR - CEIL, STONE_DK);
}

/** A flight of steps from (x0, y0) up to (x1, y1), with a balustrade. */
function stair(g: Gfx, x0: number, y0: number, x1: number, y1: number) {
  const n = y0 - y1;
  const at = (k: number) => Math.round(x0 + ((x1 - x0) * k) / n);
  for (let k = 0; k <= n; k++) g.rect(at(k) - 3, y0 - k + 1, 7, 3, STONE_DK); // underside
  for (let k = 0; k <= n; k++) {
    g.rect(at(k) - 3, y0 - k, 7, 1, k % 2 ? STONE_HI : STONE);
    if (k % 3 === 0) g.rect(at(k) - 3, y0 - k - 4, 1, 4, STONE_LO); // balusters
    g.px(at(k) - 3, y0 - k - 5, STONE_HI); // handrail
  }
}

/** 0 → 1 → 0 with long rests at each end, like something heavy swinging round. */
function swing(f: number, period: number, offset: number) {
  const t = (((f + offset) % period) + period) % period / period;
  const ramp = (u: number) => u * u * (3 - 2 * u);
  if (t < 0.35) return 0;
  if (t < 0.5) return ramp((t - 0.35) / 0.15);
  if (t < 0.85) return 1;
  return 1 - ramp((t - 0.85) / 0.15);
}

type State = { w: number; cx: number; bays: number[]; busts: number[]; lamps: number[] };

export const library: Scene<State> = {
  w: 128,
  h: H,
  fps: 12,
  poster: 30,
  fluid: true,
  alt: "Pixel art of a grand two-storey library: oak bookcases, marble busts and a rolling ladder, opening in the middle onto a stairwell of portraits where the staircases slowly swing to new landings.",

  init(_rng, w) {
    const cx = Math.floor(w / 2);
    const left = cx - WELL / 2, right = cx + WELL / 2;
    const bays: number[] = [];
    for (let x = left - BAY; x > -BAY; x -= BAY) bays.push(x);
    for (let x = right; x < w; x += BAY) bays.push(x);
    const busts = bays.filter((_, i) => i % 2 === 0).map((x) => x - 1);
    const lamps = bays.map((x) => x + 2 + BAY / 2);
    return { w, cx, bays, busts, lamps };
  },

  draw(g, f, s, env) {
    const { w, cx } = s;
    const wx = cx - WELL / 2;

    g.layer("hall", (l) => {
      l.rect(0, 0, w, H, OAK_DK);
      paintWell(l, wx);
      s.bays.forEach((x, i) => paintBay(l, x, 20 + i * 3));
      // a closing pilaster on the right of each run of bays
      for (const x of [wx - 4, w - 4]) {
        l.rect(x, CEIL, 4, FLOOR - CEIL, OAK);
        l.rect(x + 1, CEIL, 1, FLOOR - CEIL, OAK_HI);
      }
      paintGallery(l, 0, wx);
      paintGallery(l, wx + WELL, w);
      // vaulted ceiling: one rib per bay
      l.rect(0, 0, w, CEIL, OAK_DK);
      for (const x of s.bays) {
        for (let i = 0; i < BAY; i++) {
          const y = Math.round(CEIL - 1 - Math.sin((i / BAY) * Math.PI) * 5);
          l.px(x + 2 + i, y, OAK_HI);
          l.px(x + 2 + i, y + 1, OAK);
        }
      }
      l.rect(0, CEIL, w, 1, OAK_HI);
      // floorboards, receding
      l.rect(0, FLOOR, w, H - FLOOR, PLANK);
      l.rect(0, FLOOR, w, 1, PLANK_LO);
      for (let y = FLOOR + 3; y < H; y += 3) l.rect(0, y, w, 1, PLANK_LO);
      for (let i = 0; i < Math.floor(w / 6); i++) {
        l.rect(hash(i, 1, 90) * w, FLOOR + 1 + Math.floor(hash(i, 2, 90) * 3) * 3, 4 + hash(i, 3, 90) * 8, 1, PLANK_HI);
      }
      // a runner of carpet leading into the stairwell
      l.rect(wx + 14, FLOOR + 1, WELL - 28, H - FLOOR - 1, "#7a2a26");
      l.rect(wx + 15, FLOOR + 1, 1, H - FLOOR - 1, GOLD);
      l.rect(wx + WELL - 16, FLOOR + 1, 1, H - FLOOR - 1, GOLD);
      s.busts.forEach((x) => bust(l, x));
      // landings on the stairwell walls
      for (const [lx, ly] of [[wx + 2, 54], [wx + WELL - 13, 42], [wx + 2, 28]]) {
        l.rect(lx, ly, 11, 2, STONE_HI);
        l.rect(lx, ly + 2, 11, 2, STONE_DK);
        l.rect(lx, ly - 5, 11, 1, STONE_HI);
        for (let b = 0; b < 11; b += 2) l.rect(lx + b, ly - 4, 1, 4, STONE_LO);
      }
    });

    // --- the staircases: each rests, then swings its top to another landing
    const a = swing(f, 190, 0), b = swing(f, 230, 70), c = swing(f, 210, 140);
    stair(g, wx + 12, 28, wx + 30 + Math.round(16 * c), 12); // top flight
    stair(g, wx + WELL - 13, 42, wx + 28 - Math.round(16 * b), 28); // middle flight
    stair(g, wx + 10, FLOOR - 1, wx + 26 + Math.round(21 * (1 - a)), 44 - 2 + 2); // bottom flight

    // floating candles in the stairwell
    for (let i = 0; i < 7; i++) {
      const x = wx + 8 + hash(i, 1, 33) * (WELL - 16), y = 16 + hash(i, 2, 33) * 20 + Math.sin(f * 0.08 + i * 1.9) * 1.5;
      g.rect(x, y, 1, 3, MARBLE);
      g.px(x, y - 1, Math.floor(f / 3 + i) % 4 ? FLAME : GLOW);
      g.disc(x, y - 1, 2.2, GLOW, 0.16);
    }

    // hanging lanterns, one per bay
    s.lamps.forEach((x, i) => {
      const flick = hash(i, Math.floor(f / 4), 7) * 0.06;
      g.rect(x, 4, 1, 6, OAK_HI);
      g.disc(x, 13, 6, GLOW, 0.1 + flick);
      g.disc(x, 13, 3.4, GLOW, 0.16 + flick);
      g.rect(x - 1, 10, 3, 5, GOLD);
      g.rect(x - 1, 11, 3, 3, FLAME);
    });

    // a rolling ladder that drifts along the lower shelves
    const run = wx - 22;
    if (run > 20) {
      const t = (f * 0.18) % (run * 2);
      const lx = 8 + (t < run ? t : run * 2 - t);
      g.line(lx, FLOOR, lx + 5, LOWER + 3, OAK_HI);
      g.line(lx + 4, FLOOR, lx + 9, LOWER + 3, OAK_HI);
      for (let r = 0; r < 6; r++) g.rect(lx + 1 + Math.round(r * 0.8), FLOOR - 3 - r * 4, 4, 1, "#a8743c");
    }

    // a reading desk on the right: green-shaded lamp, an open book
    const dx = wx + WELL + 12;
    if (dx + 22 < w) {
      g.rect(dx, FLOOR - 7, 22, 2, OAK_HI);
      g.rect(dx + 1, FLOOR - 5, 2, 5, OAK); g.rect(dx + 19, FLOOR - 5, 2, 5, OAK);
      g.rect(dx + 4, FLOOR - 9, 9, 2, MARBLE);
      g.px(dx + 8, FLOOR - 9, MARBLE_LO);
      g.rect(dx + 16, FLOOR - 11, 1, 4, GOLD);
      g.rect(dx + 14, FLOOR - 13, 6, 2, "#2f6a4a");
      g.disc(dx + 16, FLOOR - 9, 4, GLOW, 0.2);
    }

    if (env.night) {
      // after hours: the hall dims and the lights carry it
      g.rect(0, 0, w, H, "#0b1022", 0.38);
      s.lamps.forEach((x) => g.disc(x, 13, 5, GLOW, 0.22));
      for (let i = 0; i < 7; i++) {
        const x = wx + 8 + hash(i, 1, 33) * (WELL - 16), y = 16 + hash(i, 2, 33) * 20 + Math.sin(f * 0.08 + i * 1.9) * 1.5;
        g.px(x, y - 1, FLAME);
      }
    }
  },
};
