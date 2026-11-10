import { hash, slime, KNIGHT, KNIGHT_PAL, type Scene } from "../engine";

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

/* ------------------------------------------------------------------ */
/* sycophancy: an extremely agreeable robot                            */
/* ------------------------------------------------------------------ */

const LINES: [string, string][] = [
  ["GREAT", "QUESTION!"],
  ["YOU'RE SO", "RIGHT!"],
  ["LOVE THAT", "IDEA!"],
  ["2+2=5?", "SURE!"],
];
const LOGITS = ["YES", "SURE", "WELL", "NO"];

export const sycophant: Scene<null> = {
  w: W, h: H, fps: 12, poster: 30,
  alt: "Pixel art of a smiling robot nodding along, with a speech bubble full of flattery and a bar chart where the token YES dominates.",
  init: () => null,
  draw(g, f) {
    g.layer("bg", (l) => {
      const bands = ["#f6c9d6", "#eebfdb", "#dfb8e6", "#cdb4ee", "#bfb2f0"];
      bands.forEach((c, i) => l.rect(0, i * 12, W, 12, c));
      for (let i = 1; i < bands.length; i++) for (let x = i % 2; x < W; x += 2) l.px(x, i * 12 - 1, bands[i]);
      l.rect(0, 60, W, 12, "#8a6fb5");
      l.rect(0, 60, W, 1, "#a58bd0");
      for (let x = 0; x < W; x += 12) l.rect(x, 61, 1, 11, "#7a60a5");
      // logit panel
      l.rect(57, 36, 59, 30, "#2b2140");
      l.rect(56, 35, 59, 30, "#3a2d55");
      l.box(56, 35, 59, 30, "#1b142b");
      LOGITS.forEach((w, i) => l.text(w, 60, 39 + i * 6, "#d9cdf2"));
    });

    const CYCLE = 44;
    const k = Math.floor(f / CYCLE) % LINES.length, t = f % CYCLE;
    const nod = t < 30 && Math.floor(f / 3) % 2 ? 1 : 0;

    // robot
    const rx = 12, ry = 22 + nod;
    g.rect(rx + 12, ry - 6, 2, 6, "#6f7f95"); // antenna
    g.disc(rx + 13, ry - 7, 1.5, f % 8 < 4 ? "#ff6b8b" : "#ffb3c4");
    g.rect(rx, ry, 26, 18, "#6f7f95");
    g.rect(rx + 1, ry, 24, 17, "#c9d6e6");
    g.rect(rx + 1, ry, 24, 1, "#eaf1f8");
    g.rect(rx - 2, ry + 6, 2, 6, "#9fb0c6"); g.rect(rx + 26, ry + 6, 2, 6, "#9fb0c6");
    g.rect(rx + 4, ry + 4, 18, 10, "#1b2233"); // face plate
    // happy ^ ^ eyes
    for (const ex of [rx + 7, rx + 15]) {
      g.px(ex, ry + 8, "#6ff0c0"); g.px(ex + 1, ry + 7, "#6ff0c0"); g.px(ex + 2, ry + 7, "#6ff0c0"); g.px(ex + 3, ry + 8, "#6ff0c0");
    }
    g.rect(rx + 10, ry + 11, 6, 1, "#6ff0c0");
    g.px(rx + 9, ry + 10, "#6ff0c0"); g.px(rx + 16, ry + 10, "#6ff0c0");
    // body
    g.rect(rx + 9, ry + 18, 8, 2, "#6f7f95");
    g.rect(rx + 3, 42, 20, 18, "#9fb0c6");
    g.rect(rx + 4, 42, 18, 17, "#c9d6e6");
    g.rect(rx + 9, 46, 8, 6, "#1b2233");
    g.rect(rx + 10, 47, Math.min(6, 1 + (Math.floor(f / 3) % 6)), 1, "#ff6b8b");
    g.rect(rx + 10, 49, 6, 1, "#6ff0c0");
    // thumbs-up arm
    g.rect(rx + 23, 46 - nod, 6, 3, "#9fb0c6");
    g.rect(rx + 28, 42 - nod, 3, 5, "#c9d6e6");
    g.rect(rx + 29, 39 - nod, 2, 3, "#c9d6e6");

    // hearts
    for (let i = 0; i < 3; i++) {
      const p = (f * 0.6 + i * 9) % 26;
      const hx = rx + 2 + i * 10 + Math.round(Math.sin(p * 0.5 + i) * 2), hy = 16 - p * 0.6;
      const a = 1 - p / 26;
      g.rect(hx, hy, 2, 2, "#ff6b8b", a); g.rect(hx + 3, hy, 2, 2, "#ff6b8b", a);
      g.rect(hx, hy + 1, 5, 2, "#ff6b8b", a); g.rect(hx + 1, hy + 3, 3, 1, "#ff6b8b", a); g.px(hx + 2, hy + 4, "#ff6b8b", a);
    }

    // speech bubble
    g.rect(49, 6, 66, 24, "#1b142b");
    g.rect(50, 7, 64, 22, "#ffffff");
    g.rect(44, 20, 6, 1, "#1b142b"); g.rect(46, 21, 4, 1, "#1b142b"); g.rect(48, 22, 2, 1, "#1b142b");
    g.rect(46, 20, 5, 1, "#ffffff"); g.rect(48, 21, 3, 1, "#ffffff");
    const [l1, l2] = LINES[k];
    const n = Math.floor(t * 0.9);
    g.text(l1.slice(0, n), 55, 11, "#1b142b");
    g.text(l2.slice(0, Math.max(0, n - l1.length)), 55, 19, "#d6336c");
    if (n < l1.length + l2.length && f % 2) g.rect(55 + (n < l1.length ? n : n - l1.length) * 4, n < l1.length ? 11 : 19, 3, 5, "#1b142b");

    // p(next token): YES always wins
    const grow = Math.min(1, t / 18);
    const target = [34, 12, 4, 1];
    LOGITS.forEach((_, i) => {
      const w = Math.max(1, Math.round(i === 0 ? 6 + (target[0] - 6) * grow : target[i] * (1.6 - 0.6 * grow)));
      g.rect(79, 39 + i * 6, w, 5, i === 0 ? "#6ff0c0" : "#8a6fb5");
    });
  },
};

/* ------------------------------------------------------------------ */
/* benchmarks: every benchmark is a boss fight until it's saturated    */
/* ------------------------------------------------------------------ */

const BOSSES: [string, string][] = [["#e0559a", "#a8336f"], ["#4fc3d9", "#2f8ea3"], ["#8fd65a", "#5da32f"]];
const HITS = 9;
const HIT_LEN = 9;
const FIGHT = HITS * HIT_LEN;
const ROUND = FIGHT + 26;

export const bossFight: Scene<null> = {
  w: W, h: H, fps: 12, poster: 40,
  alt: "Pixel art arcade boss fight: a tiny knight whittles down a giant crowned slime labelled BENCH-V1 until it reads SATURATED, then a new boss appears.",
  init: () => null,
  draw(g, f) {
    g.layer("bg", (l) => {
      l.rect(0, 0, W, H, "#140f24");
      l.rect(0, 40, W, 18, "#1d1533");
      l.rect(0, 58, W, 14, "#2a1f4a");
      l.rect(0, 58, W, 1, "#e0559a");
      for (let x = -40; x < W + 40; x += 12) l.line(60 + (x - 60) * 0.6, 59, 60 + (x - 60) * 1.5, 72, "#4a3880");
      l.rect(0, 63, W, 1, "#4a3880"); l.rect(0, 68, W, 1, "#4a3880");
    });
    for (let i = 0; i < 26; i++) {
      const x = hash(i, 0, 8) * W, y = hash(i, 1, 8) * 38;
      if ((f + i * 7) % 40 > 6) g.px(x, y, i % 3 ? "#8b82c9" : "#ffffff");
    }

    const round = Math.floor(f / ROUND), t = f % ROUND;
    const [body, dark] = BOSSES[round % BOSSES.length];
    const dead = t >= FIGHT;
    const hits = Math.min(HITS, Math.floor(t / HIT_LEN));
    const ht = t % HIT_LEN; // 0-3 dash in, 4 strike, 5-8 return
    const hp = Math.max(0, 1 - (hits + (!dead && ht >= 4 ? 1 : 0)) / HITS);

    // boss
    const bx = 86, bob = Math.round(Math.sin(f * 0.25) * 1);
    const struck = !dead && ht === 4;
    if (!dead || t < FIGHT + 12) {
      const flash = dead ? t % 2 === 0 : struck;
      if (!dead || t % 4 < 2) {
        slime(g, bx + (struck ? 2 : 0), 58, 36, 26 + bob, flash ? "#ffffff" : body, flash ? "#ffe9f2" : dark, "angry");
        // crown
        const cy = 58 - 26 - bob - 5;
        g.rect(bx - 6, cy + 2, 13, 3, "#f2c14e");
        for (const dx of [-6, -1, 4]) g.rect(bx + dx, cy, 3, 2, "#f2c14e");
        g.px(bx, cy + 3, "#e0342b");
      }
    }

    // hero
    const dash = dead ? 0 : ht < 4 ? ht / 4 : ht === 4 ? 1 : (8 - ht) / 4;
    const hx = 18 + dash * 42, hy = 50 - Math.round(Math.sin(dash * Math.PI) * 6);
    g.rect(hx, 58, 7, 1, "#000000", 0.4);
    g.sprite(KNIGHT, hx, hy - (dead ? Math.abs(Math.round(Math.sin(f * 0.7) * 3)) : 0), KNIGHT_PAL);
    // sword
    if (struck) {
      g.line(hx + 7, hy + 5, hx + 12, hy, "#ffffff");
      for (let i = 0; i < 5; i++) g.px(hx + 12 + hash(i, f, 2) * 8, hy - 3 + hash(i, f, 3) * 9, "#fff3a0");
    } else g.line(hx + 6, hy + 5, hx + 9, hy + 1, "#e6edf5");
    if (!dead && ht >= 4 && hits < HITS) g.text(`-${7 + Math.floor(hash(hits, round, 1) * 6)}`, 74, 30 - (ht - 4) * 2, "#fff3a0");

    // HUD
    g.text(`BENCH-V${round % 9 + 1}`, 4, 3, "#ffffff");
    g.text(`SOTA ${String(Math.round((1 - hp) * 99)).padStart(2, " ")}%`, 84, 3, "#6ff0c0");
    g.box(4, 10, 112, 6, "#ffffff");
    g.rect(6, 12, Math.round(108 * hp), 2, hp > 0.35 ? "#e0342b" : "#ffb347");
    if (dead && (t - FIGHT) % 6 < 4) {
      g.rect(29, 28, 62, 13, "#140f24", 0.9);
      g.box(29, 28, 62, 13, "#f2c14e");
      g.text("SATURATED!", 41, 32, "#f2c14e");
    }
  },
};
