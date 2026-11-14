import { hash, type Rng, type Scene } from "../engine";

const W = 128;
const H = 112;
const HORIZON = 80;

type Building = { x: number; w: number; h: number; tone: number };
type Drop = { x: number; y: number; len: number; sp: number; a: number };
type State = { far: Building[]; mid: Building[]; drops: Drop[]; rng: Rng; w: number };

const DAY = {
  skyTop: "#6fb0bd",
  sky: "#74b3bf",
  skyLow: "#7dbbc5",
  far: "#69a7b5",
  mid: ["#5d94a6", "#548998", "#4a8a86"],
  winLit: "#a9c08a",
  winA: "#7f9fd0",
  winB: "#6c9bb3",
  leaves: ["#17252c", "#1f3f36", "#2c5a41", "#3d7a50", "#5b9c62"],
  glint: "#8cc58a",
  rain: "#d9eef1",
};

const NIGHT = {
  skyTop: "#131d33",
  sky: "#17233a",
  skyLow: "#1d2d49",
  far: "#1c2b45",
  mid: ["#24364f", "#1f3048", "#213a45"],
  winLit: "#f5cf7a",
  winA: "#8fb6ee",
  winB: "#182640",
  leaves: ["#0a1218", "#10231f", "#18382b", "#22503a", "#31694a"],
  glint: "#5fa57a",
  rain: "#a9c8de",
};

/** Top of the tree line. `u` is measured from the left of the centred 128px view. */
function canopyTop(u: number) {
  const c = Math.max(0, Math.min(W, u));
  return (
    76 -
    9 * Math.sin(u * 0.045 + 0.6) -
    5 * Math.sin(u * 0.11 + 2) -
    (c > 80 ? (c - 80) * 0.42 : 0) +
    (c < 34 ? (34 - c) * 0.55 : 0)
  );
}

export const rainCity: Scene<State> = {
  w: W,
  h: H,
  fps: 14,
  poster: 30,
  fluid: true,
  band: [24, 104],
  alt: "Pixel art of rain falling over a hazy city skyline, seen across dense green treetops.",

  init(rng, w) {
    const far: Building[] = [];
    for (let x = -4; x < w; ) {
      const w = 8 + Math.floor(rng() * 10);
      far.push({ x, w, h: 16 + Math.floor(rng() * 20), tone: 0 });
      x += w + Math.floor(rng() * 3) - 1;
    }
    const mid: Building[] = [];
    for (let x = 4; x < w - 4; ) {
      const w = 10 + Math.floor(rng() * 12);
      mid.push({ x, w, h: 24 + Math.floor(rng() * 30), tone: Math.floor(rng() * 3) });
      x += w + 1 + Math.floor(rng() * 5);
    }
    const drops: Drop[] = [];
    for (let i = 0; i < Math.round((46 * w) / W); i++) {
      drops.push({
        x: Math.floor(rng() * w),
        y: rng() * H,
        len: 3 + Math.floor(rng() * 7),
        sp: 3 + rng() * 3,
        a: 0.35 + rng() * 0.4,
      });
    }
    return { far, mid, drops, rng, w };
  },

  draw(g, f, s, env) {
    const P = env.night ? NIGHT : DAY;
    const w = g.w;
    const off = Math.floor((w - W) / 2);
    const top = (x: number) => canopyTop(x - off);

    g.layer(env.night ? "night" : "day", (l) => {
      l.rect(0, 0, w, H, P.sky);
      l.rect(0, 0, w, 18, P.skyTop);
      l.rect(0, 52, w, H - 52, P.skyLow);
      // dithered seams between the sky bands
      for (let x = 0; x < w; x += 2) {
        l.px(x, 18, P.skyTop);
        l.px(x + 1, 51, P.skyLow);
      }

      for (const b of s.far) l.rect(b.x, HORIZON - b.h, b.w, b.h, P.far);

      for (const b of s.mid) {
        const bt = HORIZON - b.h;
        l.rect(b.x, bt, b.w, b.h, P.mid[b.tone]);
        l.rect(b.x, bt, b.w, 1, P.far);
        for (let wy = bt + 3; wy < HORIZON - 3; wy += 4) {
          for (let wx = b.x + 2; wx + 2 <= b.x + b.w - 1; wx += 3) {
            const h = hash(wx, wy, 7);
            const c = env.night
              ? h < 0.26 ? P.winLit : h < 0.36 ? P.winA : P.winB
              : h < 0.14 ? P.winLit : h < 0.55 ? P.winA : P.winB;
            l.rect(wx, wy, 2, 2, c, env.night && c === P.winB ? 1 : 0.9);
          }
        }
      }

      // canopy
      for (let x = 0; x < w; x++) {
        const t = top(x);
        for (let y = Math.floor(t) - 3; y < H; y++) {
          const d = y - (t + hash(x, y, 3) * 6 - 3);
          if (d < 0) continue;
          let v = 0.6 * hash(Math.floor(x / 3), Math.floor(y / 3), 11) + 0.4 * hash(x, y, 5);
          if (d < 2.5) v *= 0.35; // dark ragged edge
          v *= 1 - 0.35 * ((y - t) / (H - t)); // darker toward the bottom
          const i = v < 0.2 ? 0 : v < 0.4 ? 1 : v < 0.62 ? 2 : v < 0.8 ? 3 : 4;
          l.px(x, y, P.leaves[i]);
        }
      }
    });

    // a few windows flicker at night
    if (env.night) {
      for (const b of s.mid) {
        const bt = HORIZON - b.h;
        for (let wy = bt + 3; wy < HORIZON - 3; wy += 4) {
          for (let wx = b.x + 2; wx + 2 <= b.x + b.w - 1; wx += 3) {
            const h = hash(wx, wy, 7);
            if (h < 0.03 && wy < top(wx) - 4 && Math.floor(f / 22 + h * 400) % 2) {
              g.rect(wx, wy, 2, 2, NIGHT.winB);
            }
          }
        }
      }
    }

    // raindrops glinting off leaves
    const tick = Math.floor(f / 3);
    for (let i = 0; i < Math.round((16 * w) / W); i++) {
      const x = Math.floor(hash(i, tick, 21) * w);
      const y = Math.floor(top(x) + 5 + hash(i, tick, 22) * (H - top(x) - 6));
      g.px(x, y, P.glint, 0.9);
    }

    for (const d of s.drops) {
      g.rect(d.x, d.y, 1, d.len, P.rain, d.a);
      d.y += d.sp;
      if (d.y > H) {
        d.y = -d.len - s.rng() * 20;
        d.x = Math.floor(s.rng() * w);
      }
    }
  },
};
