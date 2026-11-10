import { hash, slime, type Scene } from "../engine";

const W = 120;
const H = 72;

/* ------------------------------------------------------------------ */
/* vibe-rl: a CRT typing out an ASCII diagram of the RL loop           */
/* ------------------------------------------------------------------ */

const ASCII = [
  "+---+   +---+",
  "|ENV|-->|LLM|",
  "+---+   +---+",
  "  ^       |",
  "  +-REWARD+",
];
const ASCII_LEN = ASCII.reduce((n, l) => n + l.length, 0);

export const vibeRl: Scene<null> = {
  w: W, h: H, fps: 12, poster: 110,
  alt: "Pixel art of a beige CRT monitor typing out an ASCII diagram of an environment, an LLM and a reward loop, next to a steaming mug.",
  init: () => null,
  draw(g, f) {
    g.layer("bg", (l) => {
      l.rect(0, 0, W, H, "#232b45");
      for (let y = 0; y < 58; y += 2) for (let x = (y / 2) % 2; x < W; x += 6) l.px(x, y, "#28314d");
      // desk
      l.rect(0, 58, W, 14, "#6b4a2f");
      l.rect(0, 58, W, 1, "#8a6238");
      l.rect(0, 66, W, 1, "#5a3d27");
      // monitor
      l.rect(14, 7, 72, 47, "#a39c88");
      l.rect(14, 7, 71, 46, "#d4cdb9");
      l.rect(15, 8, 69, 1, "#ece7d8");
      l.rect(18, 11, 64, 38, "#8f8975");
      l.rect(19, 12, 62, 36, "#0c1a14");
      l.rect(76, 50, 4, 1, "#5ad36b");
      l.rect(44, 54, 12, 3, "#a39c88");
      l.rect(36, 57, 28, 2, "#d4cdb9");
      // keyboard
      l.rect(28, 62, 44, 5, "#b8b2a0");
      for (let x = 29; x < 71; x += 2) { l.px(x, 63, "#7d786a"); l.px(x + 1, 65, "#7d786a"); }
      // framed chart
      l.rect(92, 9, 24, 20, "#4a3526");
      l.rect(93, 10, 22, 18, "#efe8d2");
      l.rect(95, 12, 1, 14, "#8f8975");
      l.rect(95, 25, 18, 1, "#8f8975");
      // mug
      l.rect(98, 49, 9, 9, "#e8e2d0");
      l.rect(98, 49, 9, 2, "#5a3d27");
      l.rect(107, 51, 2, 5, "#e8e2d0");
      l.px(107, 53, "#232b45");
      l.rect(98, 57, 9, 1, "#b8b2a0");
    });

    // reward curve creeps upward
    const loop = ASCII_LEN + 46;
    const t = f % loop;
    const pts = Math.min(17, Math.floor((t / ASCII_LEN) * 17));
    for (let i = 0; i < pts; i++) {
      const y = 24 - Math.round(11 * (1 - Math.exp(-i / 5)) + (hash(i, 0, 3) - 0.5) * 2);
      g.px(96 + i, y, "#e8552d");
      g.px(96 + i, y + 1, "#e8552d", 0.35);
    }

    // typewriter
    let shown = Math.min(t, ASCII_LEN);
    let cx = 0, cy = 0;
    for (let r = 0; r < ASCII.length && shown > 0; r++) {
      const part = ASCII[r].slice(0, shown);
      g.text(part, 23, 15 + r * 6, r === 4 || r === 3 ? "#f5cf7a" : "#58e08a");
      shown -= part.length;
      cx = 23 + part.length * 4;
      cy = 15 + r * 6;
    }
    if (Math.floor(f / 4) % 2) g.rect(cx, cy, 3, 5, "#58e08a");
    // scanline
    g.rect(19, 12 + ((f * 2) % 36), 62, 1, "#58e08a", 0.07);

    // steam
    for (let i = 0; i < 3; i++) {
      const p = (f * 0.5 + i * 5) % 14;
      g.px(100 + i * 2 + Math.round(Math.sin(p * 0.7 + i)), 47 - p, "#ffffff", 0.5 * (1 - p / 14));
    }
  },
};

/* ------------------------------------------------------------------ */
/* gdpx: scales of justice, a redlined charter, and a stubborn score   */
/* ------------------------------------------------------------------ */

const DOC_LINES = [22, 26, 18, 25, 27, 16, 24, 21, 26, 12];
const STRIKES = [1, 4, 7];

export const gdpx: Scene<null> = {
  w: W, h: H, fps: 12, poster: 150,
  alt: "Pixel art of the scales of justice weighing a robot against a stack of paper, beside a contract being redlined and stamped 12%.",
  init: () => null,
  draw(g, f) {
    g.layer("bg", (l) => {
      l.rect(0, 0, W, H, "#3a2233");
      // wallpaper stripes
      for (let x = 0; x < W; x += 8) l.rect(x, 0, 1, 56, "#44293b");
      l.rect(0, 52, W, 4, "#2a1826");
      // desk
      l.rect(0, 56, W, 16, "#7a4b2a");
      l.rect(0, 56, W, 1, "#a06a3c");
      l.rect(0, 64, W, 1, "#643c21");
      // scale: pole + base
      l.rect(27, 14, 2, 39, "#d9a441");
      l.rect(28, 14, 1, 39, "#a87a2a");
      l.rect(20, 53, 16, 3, "#d9a441");
      l.rect(20, 55, 16, 1, "#a87a2a");
      l.rect(23, 51, 10, 2, "#d9a441");
      l.disc(28, 12, 2, "#f2c96a");
      // paper
      l.rect(57, 7, 40, 49, "#1f1220");
      l.rect(58, 6, 40, 49, "#fbf6e8");
      l.rect(58, 6, 40, 1, "#ffffff");
      l.rect(63, 10, 22, 2, "#3b2f3f");
      for (let i = 0; i < DOC_LINES.length; i++) l.rect(62, 16 + i * 4, DOC_LINES[i], 1, "#9b93a0");
      // law books
      const spines = [["#8f2d3a", 12], ["#2f5d4a", 10], ["#2c3f73", 13]] as const;
      let y = 56;
      for (const [c, w] of spines) {
        y -= 6;
        l.rect(102, y, w, 6, c);
        l.rect(102, y, w, 1, "#ffffff", 0.18);
        l.rect(104, y + 2, 2, 2, "#d9a441");
        l.rect(102, y + 5, w, 1, "#000000", 0.25);
      }
    });

    // tilting beam: the paper side is heavier
    const a = 0.16 + Math.sin(f / 9) * 0.07;
    const px = 28, py = 16, L = 17;
    const lx = px - Math.cos(a) * L, ly = py - Math.sin(a) * L;
    const rx = px + Math.cos(a) * L, ry = py + Math.sin(a) * L;
    g.line(lx, ly, rx, ry, "#f2c96a");
    g.line(lx, ly + 1, rx, ry + 1, "#a87a2a");
    for (const [x, y, robot] of [[lx, ly, true], [rx, ry, false]] as const) {
      const X = Math.round(x), Y = Math.round(y);
      g.line(X, Y, X - 5, Y + 12, "#c9b27a");
      g.line(X, Y, X + 5, Y + 12, "#c9b27a");
      g.rect(X - 6, Y + 12, 13, 1, "#f2c96a");
      g.rect(X - 4, Y + 13, 9, 1, "#d9a441");
      g.rect(X - 2, Y + 14, 5, 1, "#a87a2a");
      if (robot) {
        g.rect(X - 3, Y + 7, 7, 5, "#b9c6d6");
        g.rect(X - 3, Y + 11, 7, 1, "#8494a8");
        g.px(X - 2, Y + 9, "#1b1b2a"); g.px(X + 2, Y + 9, "#1b1b2a");
        g.px(X, Y + 5, "#e8552d"); g.px(X, Y + 6, "#8494a8");
      } else {
        g.rect(X - 4, Y + 9, 8, 3, "#fbf6e8");
        g.rect(X - 3, Y + 7, 8, 2, "#e9dfc6");
        g.rect(X - 3, Y + 10, 5, 1, "#9b93a0");
      }
    }

    // redlining
    const t = f % 170;
    STRIKES.forEach((line, i) => {
      const start = 12 + i * 34;
      const y = 16 + line * 4;
      const n = Math.max(0, Math.min(DOC_LINES[line], (t - start) * 2));
      if (n > 0) g.rect(62, y, n, 1, "#e0342b");
      const ins = Math.max(0, Math.min(DOC_LINES[line] - 6, (t - start - 14) * 2));
      if (ins > 0) g.rect(64, y + 2, ins, 1, "#2f6fd6");
    });
    if (t > 12 && t < 116) {
      // the pen
      const i = Math.min(2, Math.floor((t - 12) / 34));
      const n = Math.min(DOC_LINES[STRIKES[i]], (t - 12 - i * 34) * 2);
      g.line(63 + n, 15 + STRIKES[i] * 4, 68 + n, 10 + STRIKES[i] * 4, "#1f1220");
      g.px(62 + n, 16 + STRIKES[i] * 4, "#e0342b");
    }
    if (t > 124) {
      const on = t > 132 || t % 4 < 2;
      if (on) {
        g.rect(76, 42, 19, 11, "#fbf6e8");
        g.box(76, 42, 19, 11, "#e0342b");
        g.text("12%", 80, 45, "#e0342b");
      }
    }
  },
};

/* ------------------------------------------------------------------ */
/* grpo: a group of rollouts, scored against their own mean            */
/* ------------------------------------------------------------------ */

const SLIMES = ["#5aa9f0", "#f08ab4", "#f2c14e", "#7fd6a8", "#b79af2", "#f59a5a"];
const SLIME_DARK = ["#3b7fc4", "#c96089", "#c9982f", "#4fae7e", "#8c6fce", "#cf7436"];
const GROUND = 56;

export const grpo: Scene<null> = {
  w: W, h: H, fps: 14, poster: 30,
  alt: "Pixel art of six colourful slimes jumping to different heights. A dashed line marks the group's mean, with green and red arrows showing each slime's advantage.",
  init: () => null,
  draw(g, f) {
    g.layer("bg", (l) => {
      l.rect(0, 0, W, H, "#8fd3e8");
      l.rect(0, 30, W, 10, "#a6dfee");
      l.rect(0, 40, W, 16, "#c2ebf0");
      for (let x = 0; x < W; x += 2) { l.px(x, 29, "#a6dfee"); l.px(x + 1, 39, "#c2ebf0"); }
      // hills
      for (let x = 0; x < W; x++) {
        const hy = 48 - Math.round(6 * Math.sin(x * 0.05 + 1) + 3 * Math.sin(x * 0.13));
        l.rect(x, hy, 1, GROUND - hy, "#86cf8e");
      }
      l.rect(0, GROUND, W, 16, "#4fa35a");
      l.rect(0, GROUND, W, 1, "#7cc866");
      for (let i = 0; i < 40; i++) {
        const x = hash(i, 0, 5) * W, y = GROUND + 2 + hash(i, 1, 5) * 13;
        l.rect(x, y, 2, 1, "#3f8a4c");
        l.px(x, y - 1, "#7cc866");
      }
    });

    // clouds
    for (let i = 0; i < 3; i++) {
      const x = ((i * 53 + f * (0.12 + i * 0.05)) % (W + 30)) - 20, y = 5 + i * 7;
      g.rect(x, y + 2, 16, 3, "#ffffff");
      g.rect(x + 3, y, 8, 2, "#ffffff");
      g.rect(x + 1, y + 5, 14, 1, "#dff3f7");
    }

    const CYCLE = 64;
    const round = Math.floor(f / CYCLE), t = f % CYCLE;
    const rewards = SLIMES.map((_, i) => hash(i, round, 77));
    const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
    // 0-6 squash · 6-18 rise · 18-44 hang · 44-54 fall · 54-64 land
    const lift = t < 6 ? 0 : t < 18 ? 1 - ((18 - t) / 12) ** 2 : t < 44 ? 1 : t < 54 ? 1 - ((t - 44) / 10) ** 2 : 0;
    const squash = t < 6 || t >= 54;
    const height = (r: number) => 5 + r * 30;
    const hang = t >= 18 && t < 44;

    const by = GROUND - height(mean) - 4;
    if (hang) {
      for (let x = 2; x < W - 2; x += 4) g.rect(x, by, 2, 1, "#ffffff");
      g.rect(3, 3, 51, 9, "#1b2a41", 0.85);
      g.text("A = R - MEAN", 5, 5, "#ffffff");
    }

    SLIMES.forEach((c, i) => {
      const cx = 15 + i * 18;
      const y = GROUND + 3 - height(rewards[i]) * lift;
      // shadow shrinks as the slime rises
      const sw = Math.round(9 - 4 * lift);
      g.rect(cx - Math.floor(sw / 2), GROUND + 3, sw, 1, "#2f7a45", 0.7);
      if (hang) {
        const up = rewards[i] > mean;
        const col = up ? "#1f9d55" : "#e0342b";
        const top = Math.min(by, y - 4), bot = Math.max(by, y - 4);
        g.rect(cx, top, 1, bot - top, col);
      }
      if (squash) slime(g, cx, y, 11, 5, c, SLIME_DARK[i]);
      else slime(g, cx, y, 9, 7, c, SLIME_DARK[i], hang && rewards[i] > mean ? "happy" : "plain");
      if (hang) {
        const up = rewards[i] > mean;
        const col = up ? "#1f9d55" : "#e0342b";
        const ay = up ? y - 11 : y + 2;
        // little arrowheads
        if (up) { g.px(cx, ay, col); g.rect(cx - 1, ay + 1, 3, 1, col); }
        else { g.rect(cx - 1, ay, 3, 1, col); g.px(cx, ay + 1, col); }
      }
    });
  },
};
