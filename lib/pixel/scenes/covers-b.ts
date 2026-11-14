import { hash, KNIGHT, KNIGHT_PAL, type Scene } from "../engine";

const W = 120;
const H = 72;

/* ------------------------------------------------------------------ */
/* sample efficiency: a knight learns a dungeon in three episodes      */
/* ------------------------------------------------------------------ */

const MAP = [
  "############",
  "#S..#....~.#",
  "#.#.#.##.~.#",
  "#.#...#..~.#",
  "#.###.#.##.#",
  "#.....#...G#",
  "############",
];
const T = 10;
const OY = 1;

const PREFIX: [number, number][] = [[1, 1], [2, 1], [3, 1], [3, 2], [3, 3], [4, 3], [5, 3], [5, 2], [5, 1], [6, 1], [7, 1], [8, 1]];
const EPISODES: { path: [number, number][]; win: boolean }[] = [
  { path: [...PREFIX, [9, 1]], win: false },
  { path: [...PREFIX, [8, 2], [8, 3], [9, 3]], win: false },
  { path: [...PREFIX, [8, 2], [8, 3], [7, 3], [7, 4], [7, 5], [8, 5], [9, 5], [10, 5]], win: true },
];
const STEP = 3; // frames per tile
const HOLD = 16; // frames to linger on the outcome
const EP_LEN = EPISODES.map((e) => (e.path.length - 1) * STEP + HOLD);
const TOTAL = EP_LEN.reduce((a, b) => a + b, 0);

export const dungeon: Scene<null> = {
  w: W, h: H, fps: 12, poster: TOTAL - 6,
  alt: "Pixel art gridworld dungeon: a tiny knight explores, falls into lava twice, then finds the treasure chest on the third episode.",
  init: () => null,
  draw(g, f) {
    g.layer("bg", (l) => {
      l.rect(0, 0, W, H, "#16111f");
      for (let r = 0; r < MAP.length; r++) {
        for (let c = 0; c < 12; c++) {
          const x = c * T, y = r * T + OY, ch = MAP[r][c];
          if (ch === "#") {
            l.rect(x, y, T, T, "#2b2238");
            l.rect(x, y, T, 1, "#3a2f4c");
            l.rect(x, y + 5, T, 1, "#1d1728");
            l.rect(x + (r % 2 ? 3 : 7), y + 1, 1, 4, "#1d1728");
            l.rect(x + (r % 2 ? 7 : 3), y + 6, 1, 4, "#1d1728");
          } else {
            l.rect(x, y, T, T, "#4a3f5c");
            l.rect(x, y, T, 1, "#5a4e6e");
            l.rect(x, y, 1, T, "#5a4e6e");
            l.rect(x, y + T - 1, T, 1, "#3d334d");
            if (hash(c, r, 4) < 0.4) l.px(x + 3 + hash(c, r, 5) * 4, y + 3 + hash(c, r, 6) * 4, "#3d334d");
          }
        }
      }
      // torches
      for (const x of [34, 84]) { l.rect(x, 4, 2, 4, "#6b4a2f"); }
    });

    // torch flames + lava
    for (const x of [34, 84]) {
      g.rect(x, 2 - (f % 3 === 0 ? 1 : 0), 2, 2, f % 2 ? "#ffb347" : "#ffd98a");
      g.px(x + (f % 2), 1, "#e8552d");
    }
    for (let r = 1; r <= 3; r++) {
      const x = 9 * T, y = r * T + OY;
      g.rect(x, y, T, T, "#e8552d");
      for (let i = 0; i < 6; i++) {
        const bx = x + hash(i, r, 9) * 8, by = y + ((hash(i, r, 10) * 10 + f * 0.3) % 10);
        g.rect(bx, by, 2, 1, i % 2 ? "#ffb347" : "#ffd98a");
      }
      g.rect(x, y, T, 1, "#9c2f1a", r === 1 ? 1 : 0);
    }

    // which episode / step are we on?
    let t = f % TOTAL, ep = 0;
    while (t >= EP_LEN[ep]) { t -= EP_LEN[ep]; ep++; }
    const { path, win } = EPISODES[ep];
    const last = path.length - 1;
    const prog = Math.min(last, t / STEP);
    const i = Math.floor(prog), frac = prog - i;
    const [ax, ay] = path[i], [bx, by] = path[Math.min(last, i + 1)];
    const done = prog >= last;

    // value-ish trail: tiles visited in earlier episodes glow faintly
    const seen = new Set<string>();
    for (let e = 0; e <= ep; e++) {
      const upto = e < ep ? EPISODES[e].path.length : i + 1;
      for (let k = 0; k < upto; k++) seen.add(EPISODES[e].path[k].join(","));
    }
    for (const key of seen) {
      const [c, r] = key.split(",").map(Number);
      if (MAP[r][c] !== "~") g.rect(c * T + 4, r * T + OY + 4, 2, 2, "#8fe8a8", 0.55);
    }

    // chest
    const gx = 10 * T, gy = 5 * T + OY;
    const open = win && done;
    g.rect(gx + 1, gy + 3, 8, 6, "#a8652c");
    g.rect(gx + 1, gy + (open ? 1 : 3), 8, 2, "#d9a441");
    g.rect(gx + 4, gy + 5, 2, 2, "#f7dc8a");
    if (open) {
      g.rect(gx + 2, gy + 3, 6, 1, "#fff3a0");
      for (let k = 0; k < 5; k++) {
        const a = k * 1.3 + f * 0.3, d = 5 + ((f + k * 3) % 6);
        g.px(gx + 5 + Math.cos(a) * d, gy + 3 + Math.sin(a) * d * 0.7, "#fff3a0");
      }
    }

    // knight
    const kx = (ax + (bx - ax) * frac) * T + 1.5, ky = (ay + (by - ay) * frac) * T + OY + 1;
    if (done && !win) {
      const s = t - last * STEP;
      if (s < 8) g.sprite(KNIGHT.slice(0, Math.max(1, 8 - s)), kx, ky + s, KNIGHT_PAL);
      g.disc(kx + 3, ky + 6, 1 + (s % 4), "#ffd98a", 0.5);
    } else {
      g.sprite(KNIGHT, kx, ky - (done ? Math.abs(Math.round(Math.sin(f * 0.8) * 2)) : i % 2), KNIGHT_PAL, bx < ax);
    }

    // HUD
    g.rect(0, 62, W, 10, "#16111f");
    g.rect(0, 62, W, 1, "#3a2f4c");
    g.text(`EP ${ep + 1}/3`, 3, 65, "#c9c2d8");
    if (done) g.text(win ? "R = +1" : "R = 0", 44, 65, win ? "#8fe8a8" : "#ff8a6b");
    g.text(`STEPS ${String(i).padStart(2, "0")}`, 82, 65, "#8b82a0");
  },
};
