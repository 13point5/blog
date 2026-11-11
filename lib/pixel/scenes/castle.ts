import { hash, type Gfx, type Scene } from "../engine";

// A castle on a crag above a lake, with an owl crossing the sky.
// Dusk on the light theme, deep night on the dark one.

const W = 128;
const H = 78;
const SHORE = 52;

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const bayer = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

const DUSK = {
  sky: ["#4d5182", "#74699a", "#a67da0", "#d99a90", "#f2c79c"],
  far: "#8a6f96", near: "#5a4a72", rock: "#2e2640", castle: "#241d33",
  lake: ["#c98f8c", "#9a7896", "#6f6590", "#4d5182"],
  star: "#fff3d6", moon: "#fff0cf", window: "#ffd27a", owl: "#fdf6e8", pine: "#1d172a",
};
const NIGHT = {
  sky: ["#0b1022", "#10182e", "#16213b", "#1d2c49", "#263a59"],
  far: "#1a2740", near: "#121b30", rock: "#0a0f1d", castle: "#070b16",
  lake: ["#22344f", "#1a2740", "#131c31", "#0d1326"],
  star: "#e8f0ff", moon: "#f4f1dc", window: "#ffcf6b", owl: "#e8ecf5", pine: "#05080f",
};

/** Height of a ridge line at x. */
const ridge = (x: number, seed: number, amp: number) =>
  amp * (0.5 + 0.5 * Math.sin(x * 0.031 + seed)) + amp * 0.45 * Math.sin(x * 0.083 + seed * 2.3) + amp * 0.2 * Math.sin(x * 0.21 + seed);

function cone(l: Gfx, cx: number, base: number, halfW: number, h: number, c: string) {
  for (let i = 0; i < h; i++) {
    const w = Math.max(1, Math.round((halfW * 2 + 1) * ((i + 1) / h)));
    l.rect(cx - Math.floor(w / 2), base - h + i, w, 1, c);
  }
}

/** Towers as [left, top, width, roofHeight], relative to the castle's centre. */
const TOWERS: [number, number, number, number][] = [
  [-21, 27, 6, 7],
  [-9, 30, 18, 0],
  [-4, 16, 6, 9],
  [11, 21, 7, 8],
  [21, 33, 4, 5],
  [-31, 38, 11, 0],
];

function paintCastle(l: Gfx, cx: number, c: string) {
  for (const [dx, top, w, roof] of TOWERS) {
    l.rect(cx + dx, top, w, SHORE - top, c);
    if (roof) cone(l, cx + dx + Math.floor(w / 2), top, Math.floor(w / 2) + 1, roof, c);
    else for (let x = 0; x < w; x += 2) l.px(cx + dx + x, top - 1, c); // battlements
  }
}

type State = { w: number; cx: number };

export const castle: Scene<State> = {
  w: W,
  h: H,
  fps: 12,
  poster: 40,
  fluid: true,
  alt: "Pixel art of a many-towered castle on a crag above a still lake at dusk, its windows lit, with an owl flying across the sky.",

  init: (_rng, w) => ({ w, cx: Math.floor(w / 2) }),

  draw(g, f, s, env) {
    const P = env.night ? NIGHT : DUSK;
    const { w, cx } = s;

    g.layer(env.night ? "night" : "dusk", (l) => {
      // sky: five bands, each woven into the next
      const band = SHORE / P.sky.length;
      for (let y = 0; y < SHORE; y++) {
        const t = y / band, i = Math.min(P.sky.length - 1, Math.floor(t));
        const next = Math.min(P.sky.length - 1, i + 1);
        for (let x = 0; x < w; x++) l.px(x, y, t - i > 0.45 + bayer(x, y) * 0.55 ? P.sky[next] : P.sky[i]);
      }
      // moon
      const mx = cx + 38, my = 13;
      l.disc(mx, my, 6, P.moon);
      l.px(mx - 2, my - 1, P.sky[4]); l.px(mx + 1, my + 2, P.sky[4]); l.px(mx + 2, my - 3, P.sky[4]);

      // two ridges of hills
      for (let x = 0; x < w; x++) {
        const a = SHORE - 5 - ridge(x - cx, 1.3, 13);
        l.rect(x, a, 1, SHORE - a, P.far);
        const b = SHORE - 2 - ridge(x - cx, 4.1, 8);
        l.rect(x, b, 1, SHORE - b, P.near);
      }
      // the crag
      for (let x = -40; x <= 40; x++) {
        const h = Math.max(0, 15 - Math.abs(x) * 0.36 + Math.sin(x * 0.5) * 1.2);
        l.rect(cx + x, SHORE - h, 1, h, P.rock);
      }
      paintCastle(l, cx, P.castle);

      // lake: bands again, then everything above it mirrored as a broken reflection
      const lh = H - SHORE, lb = lh / P.lake.length;
      for (let y = 0; y < lh; y++) {
        const t = y / lb, i = Math.min(P.lake.length - 1, Math.floor(t));
        const next = Math.min(P.lake.length - 1, i + 1);
        for (let x = 0; x < w; x++) l.px(x, SHORE + y, t - i > 0.45 + bayer(x, y) * 0.55 ? P.lake[next] : P.lake[i]);
      }
      for (let x = -40; x <= 40; x++) {
        const h = Math.max(0, 15 - Math.abs(x) * 0.36) * 0.8;
        for (let y = 0; y < h; y++) if ((y + (x & 1)) % 2 === 0 || y < 3) l.px(cx + x, SHORE + y, P.rock);
      }
      for (const [dx, top, tw] of TOWERS) {
        for (let y = 0; y < (SHORE - top) * 0.75; y++) {
          if (y % 2 === 0 || y < 4) l.rect(cx + dx, SHORE + y, tw, 1, P.castle);
        }
      }
      l.rect(0, SHORE, w, 1, P.rock);

      // pines along the near shore, thicker toward the edges of the screen
      for (let x = 2; x < w; x += 5) {
        const d = Math.abs(x - cx);
        if (d < 46 || hash(x, 1, 31) < 0.3) continue;
        const h = 9 + Math.floor(hash(x, 2, 31) * 9);
        cone(l, x, H, 3, h, P.pine);
      }
      l.rect(0, H - 2, w, 2, P.pine);
    });

    // stars
    const stars = Math.round((env.night ? 40 : 14) * (w / W));
    for (let i = 0; i < stars; i++) {
      const x = Math.floor(hash(i, 1, 5) * w), y = Math.floor(hash(i, 2, 5) * 30);
      if ((f + i * 11) % 60 > 5) g.px(x, y, P.star, 0.5 + hash(i, 3, 5) * 0.5);
    }

    // lit windows; a couple flicker
    const windows: [number, number][] = [[-19, 31], [-19, 37], [-2, 21], [-2, 27], [0, 34], [-6, 36], [5, 38], [13, 26], [15, 32], [13, 39], [22, 37], [-27, 42], [-23, 44]];
    windows.forEach(([dx, y], i) => {
      if (i % 5 === 3 && Math.floor(f / 14 + i) % 3 === 0) return;
      g.px(cx + dx, y, P.window);
      g.px(cx + dx + (i % 3), SHORE + (SHORE - y) * 0.7 + (f % 8 < 4 ? 0 : 1), P.window, 0.45);
    });

    // moonlight on the water
    for (let i = 0; i < 7; i++) {
      const y = SHORE + 2 + i * 3;
      const wv = 3 + ((i * 5 + Math.floor(f / 5)) % 6);
      g.rect(cx + 38 - wv / 2 + Math.sin(f * 0.15 + i) * 1.5, y, wv, 1, P.moon, 0.55 - i * 0.05);
    }

    // little boats with lanterns, crossing toward the castle
    for (let i = 0; i < 3; i++) {
      const bx = cx - 70 + i * 9 + ((f * 0.12) % 60), by = SHORE + 9 + i * 3;
      g.rect(bx, by, 4, 1, P.castle);
      g.px(bx + 1, by - 1, P.window);
      g.rect(bx, by + 1, 3, 1, P.window, 0.3);
    }

    // the owl
    const span = w + 40;
    const ox = ((f * 0.9) % (span * 2)) - 20;
    if (ox < span) {
      const oy = 12 + Math.sin(f * 0.07) * 5;
      const up = Math.floor(f / 3) % 2 === 0;
      g.rect(ox - 1, oy, 3, 2, P.owl);
      g.px(ox + 2, oy, P.owl);
      if (up) { g.rect(ox - 3, oy - 2, 2, 1, P.owl); g.rect(ox + 1, oy - 2, 2, 1, P.owl); g.px(ox - 2, oy - 1, P.owl); g.px(ox + 1, oy - 1, P.owl); }
      else { g.rect(ox - 4, oy + 1, 3, 1, P.owl); g.rect(ox + 2, oy + 1, 3, 1, P.owl); }
    }
  },
};
