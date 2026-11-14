import { hash, type Scene } from "../engine";

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
