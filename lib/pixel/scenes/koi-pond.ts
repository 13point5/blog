import { hash, type Gfx, type Rng, type Scene } from "../engine";

const W = 128;
const H = 128;
const CX = 64;
const CY = 63;
const R_OUT = 47;
const R_IN = 40;
const SWIM = 32;

type Koi = {
  x: number; y: number; a: number;
  tx: number; ty: number; timer: number;
  phase: number; pal: string[];
  hist: { x: number; y: number }[];
};
type Food = { x: number; y: number; age: number };
type Ripple = { x: number; y: number; age: number };
type State = { koi: Koi[]; food: Food[]; ripples: Ripple[]; rng: Rng };

const PATTERNS = [
  ["#f4efe6", "#e8452c", "#f4efe6", "#e8452c", "#f4efe6", "#f4efe6"],
  ["#f08a2c", "#f08a2c", "#f5a03c", "#f08a2c", "#f6c36a", "#f6c36a"],
  ["#26282e", "#f4efe6", "#26282e", "#f4efe6", "#26282e", "#f4efe6"],
  ["#f26a2a", "#f26a2a", "#f4efe6", "#f26a2a", "#f4efe6", "#f4efe6"],
  ["#f2c14e", "#f2c14e", "#f7dc8a", "#f2c14e", "#f7dc8a", "#f7dc8a"],
];

const PADS = [
  { x: 86, y: 41, r: 6, flower: false },
  { x: 95, y: 51, r: 5, flower: true },
  { x: 43, y: 87, r: 5, flower: false },
  { x: 39, y: 61, r: 3, flower: false },
  { x: 97, y: 66, r: 3, flower: false },
];

/** Octagon "radius" of a point around the pond centre. */
function oct(x: number, y: number) {
  const dx = Math.abs(x - CX), dy = Math.abs(y - CY);
  return Math.max(dx, dy, (dx + dy) * 0.7071);
}

function paintGround(l: Gfx) {
  // stone tiles
  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 8; tx++) {
      const h = hash(tx, ty, 2);
      const c = h < 0.12 ? "#a79f8c" : h < 0.26 ? "#a3b592" : h < 0.6 ? "#b9c4a6" : "#c0caad";
      l.rect(tx * 16, ty * 16, 16, 16, c);
      l.rect(tx * 16, ty * 16, 16, 1, "#cdd6bd");
      l.rect(tx * 16, ty * 16, 1, 16, "#cdd6bd");
      l.rect(tx * 16, ty * 16 + 15, 16, 1, "#8c9a7e");
      l.rect(tx * 16 + 15, ty * 16, 1, 16, "#8c9a7e");
      for (let i = 0; i < 3; i++) {
        l.px(tx * 16 + 2 + hash(tx, ty, 30 + i) * 12, ty * 16 + 2 + hash(tx, ty, 40 + i) * 12, "#9aa98b");
      }
    }
  }
  // overgrown corners
  const greens = ["#3b6f34", "#4d8a3e", "#4d8a3e", "#6aa84f"];
  const corners = [[0, 0, 30], [W, 0, 22], [0, H, 34], [W, H, 26]];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      for (const [cx, cy, r] of corners) {
        const d = Math.hypot(x - cx, y - cy);
        if (d < r - 8 + hash(Math.floor(x / 3), Math.floor(y / 3), 9) * 12) {
          l.px(x, y, greens[Math.floor(hash(x, y, 8) * 4)]);
        }
      }
    }
  }
  // moss between tiles + grass tufts
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(hash(i, 1, 50) * W), y = Math.floor(hash(i, 2, 50) * H);
    l.rect(x, y, 2, 1, "#6aa84f");
    l.px(x, y - 1, "#4d8a3e");
  }
  // rocks
  for (const [x, y, r] of [[113, 12, 5], [101, 6, 3], [8, 76, 4], [121, 104, 4], [18, 14, 3]]) {
    l.disc(x, y + 1, r, "#5f6b66");
    l.disc(x, y, r, "#8f9a94");
    l.disc(x - 1, y - 1, r - 2, "#b3bcb5");
  }
}

function paintPond(l: Gfx) {
  for (let y = CY - R_OUT - 1; y <= CY + R_OUT + 3; y++) {
    for (let x = CX - R_OUT - 1; x <= CX + R_OUT + 1; x++) {
      const m = oct(x, y);
      const dx = x - CX, dy = y - CY;
      // a sliver of the frame's front face gives the pond some height
      if (m > R_OUT) {
        if (oct(x, y - 3) <= R_OUT && dy > 0) l.px(x, y, oct(x, y - 1) <= R_OUT ? "#7c4a26" : "#4b2c17");
        continue;
      }
      if (m > R_IN) {
        const ax = Math.abs(dx), ay = Math.abs(dy), diag = (ax + ay) * 0.7071;
        const edge = m > R_OUT - 1 || m <= R_IN + 1;
        let c: string;
        let grain: number;
        if (diag >= ax && diag >= ay) {
          c = dy < 0 ? "#c58449" : "#aa6a3a";
          grain = hash(Math.floor((dx * Math.sign(dy) - dy) / 6), Math.floor(m), 4);
        } else if (ay > ax) {
          c = dy < 0 ? "#cf8f52" : "#b06f3d";
          grain = hash(Math.floor(x / 7), y, 4);
        } else {
          c = "#bb7a43";
          grain = hash(x, Math.floor(y / 7), 4);
        }
        if (grain < 0.3) c = "#9a5f33";
        // plank joints where two sides meet
        const joint = Math.abs(diag - Math.max(ax, ay)) < 0.8;
        l.px(x, y, edge || joint ? "#5a3519" : c);
        continue;
      }
      // water
      let c = m < 20 ? "#1a6765" : "#1e7672";
      if (hash(Math.floor(x / 6), Math.floor(y / 5), 6) < 0.34 && (x + y) % 2 === 0) c = "#175a59";
      if (hash(Math.floor(x / 9), Math.floor(y / 8), 12) < 0.2) c = "#196260";
      if (oct(x, y - 5) > R_IN) c = "#135250"; // shadow cast by the top rail
      else if (m > R_IN - 1.6 && dy > -R_IN * 0.3) c = "#3fc4bd"; // bright waterline
      l.px(x, y, c);
    }
  }
}

function newTarget(k: Koi, rng: Rng) {
  const t = rng() * Math.PI * 2, r = Math.sqrt(rng()) * (SWIM - 3);
  k.tx = CX + Math.cos(t) * r;
  k.ty = CY + Math.sin(t) * r;
  k.timer = 40 + rng() * 80;
}

export const koiPond: Scene<State> = {
  w: W,
  h: H,
  fps: 15,
  poster: 60,
  alt: "Pixel art koi pond: five koi swim in an octagonal wooden pond set in a mossy stone courtyard. Click the water to feed them.",

  init(rng) {
    const koi: Koi[] = PATTERNS.map((pal, i) => {
      const t = (i / PATTERNS.length) * Math.PI * 2;
      const k: Koi = {
        x: CX + Math.cos(t) * 18, y: CY + Math.sin(t) * 18, a: t + Math.PI / 2,
        tx: CX, ty: CY, timer: 0, phase: rng() * 6, pal, hist: [],
      };
      newTarget(k, rng);
      return k;
    });
    return { koi, food: [], ripples: [], rng };
  },

  pointer(s, x, y) {
    if (oct(x, y) > R_IN - 3) return false;
    if (s.food.length >= 10) s.food.shift();
    s.food.push({ x, y, age: 0 });
    s.ripples.push({ x, y, age: 0 });
    return true;
  },

  draw(g, f, s, env) {
    g.layer("ground", paintGround);
    g.layer("pond", paintPond);

    // drifting caustics
    const tick = Math.floor(f / 16);
    for (let i = 0; i < 12; i++) {
      const x = CX - 30 + hash(i, tick, 31) * 60, y = CY - 30 + hash(i, tick, 32) * 60;
      if (oct(x, y) < R_IN - 8) {
        const fade = 1 - Math.abs(((f % 16) / 16) * 2 - 1);
        g.rect(x, y, 3 + hash(i, tick, 33) * 3, 1, "#5fd9d2", 0.45 * fade);
      }
    }

    // --- simulate ---
    for (const k of s.koi) {
      let sp = 0.75;
      let tx = k.tx, ty = k.ty;
      let best = 1e9;
      for (const p of s.food) {
        const d = Math.hypot(p.x - k.x, p.y - k.y);
        if (d < best) { best = d; tx = p.x; ty = p.y; }
      }
      if (best < 1e9) {
        sp = 1.5;
        if (best < 3.5) {
          const i = s.food.findIndex((p) => p.x === tx && p.y === ty);
          const [eaten] = s.food.splice(i, 1);
          s.ripples.push({ x: eaten.x, y: eaten.y, age: 0 });
        }
      } else if (--k.timer < 0 || Math.hypot(k.tx - k.x, k.ty - k.y) < 5) {
        newTarget(k, s.rng);
      }
      if (best === 1e9) {
        // give each other some room when nobody is racing for food
        for (const o of s.koi) {
          const d = Math.hypot(o.x - k.x, o.y - k.y);
          if (o !== k && d < 12) { tx = k.x + (k.x - o.x) * 3 + 0.01; ty = k.y + (k.y - o.y) * 3; break; }
        }
      }
      if (oct(k.x, k.y) > SWIM) { tx = CX; ty = CY; }
      let diff = Math.atan2(ty - k.y, tx - k.x) - k.a;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      k.a += Math.max(-0.2, Math.min(0.2, diff)) + Math.sin(f * 0.55 + k.phase) * 0.07;
      k.x += Math.cos(k.a) * sp;
      k.y += Math.sin(k.a) * sp;
      k.hist.unshift({ x: k.x, y: k.y });
      if (k.hist.length > 16) k.hist.pop();
    }
    if (f % 70 === 0) {
      const t = s.rng() * 6.28, r = s.rng() * 28;
      s.ripples.push({ x: CX + Math.cos(t) * r, y: CY + Math.sin(t) * r, age: 0 });
    }

    // --- draw ---
    const radii = [1.5, 2.1, 2.1, 1.6, 1.1, 0.6];
    const at = (k: Koi, i: number) => k.hist[Math.min(i, k.hist.length - 1)];
    for (const k of s.koi) {
      if (!k.hist.length) continue;
      for (let i = 0; i < 6; i++) {
        const p = at(k, i * 2);
        g.disc(p.x + 1, p.y + 3, radii[i], "#0f4543", 0.55);
      }
    }
    for (const p of s.food) {
      p.age++;
      g.px(p.x, p.y + 1, "#0f4543", 0.6);
      g.px(p.x, p.y, "#d79a5b");
    }
    for (const k of s.koi) {
      if (!k.hist.length) continue;
      const nx = -Math.sin(k.a), ny = Math.cos(k.a);
      const tail = at(k, 12), fin = at(k, 3);
      const sway = Math.sin(f * 0.55 + k.phase);
      g.px(tail.x + nx * (1 + sway), tail.y + ny * (1 + sway), k.pal[5], 0.85);
      g.px(tail.x - nx * (1 - sway), tail.y - ny * (1 - sway), k.pal[5], 0.85);
      g.px(fin.x + nx * 3, fin.y + ny * 3, k.pal[2], 0.8);
      g.px(fin.x - nx * 3, fin.y - ny * 3, k.pal[2], 0.8);
      for (let i = 5; i >= 0; i--) {
        const p = at(k, i * 2);
        g.disc(p.x, p.y, radii[i], k.pal[i]);
      }
    }

    s.ripples = s.ripples.filter((r) => r.age < 18);
    for (const r of s.ripples) {
      r.age++;
      if (oct(r.x, r.y) + r.age / 2 < R_IN - 1) g.ring(r.x, r.y, 1 + r.age / 2, "#8fe8e2", 0.6 * (1 - r.age / 18));
    }

    // lily pads float above the fish
    for (let i = 0; i < PADS.length; i++) {
      const p = PADS[i];
      const bob = Math.round(Math.sin(f * 0.06 + i * 1.7) * 0.6);
      g.disc(p.x + 1, p.y + 2 + bob, p.r, "#0f4543", 0.5);
      g.disc(p.x, p.y + bob, p.r, "#3f8a3e");
      g.disc(p.x - 1, p.y - 1 + bob, p.r - 1, "#5fae4a");
      g.rect(p.x, p.y + bob, p.r + 1, 1, "#1e7672");
      if (p.flower) {
        g.rect(p.x - 3, p.y - 3 + bob, 3, 2, "#f7a8c4");
        g.px(p.x - 2, p.y - 3 + bob, "#fde3a7");
      }
    }
    // reeds
    for (const [x, y, h] of [[35, 44, 11], [37, 46, 8], [33, 47, 7], [92, 86, 10], [95, 88, 7]]) {
      const lean = Math.round(Math.sin(f * 0.05 + x) * 0.7);
      g.rect(x, y - h + 3, 1, h - 3, "#2f6b3a");
      g.rect(x + lean, y - h, 1, 3, "#3f8a3e");
    }

    if (env.night) {
      g.rect(0, 0, W, H, "#0b1430", 0.45);
      for (let i = 0; i < 7; i++) {
        const t = f * 0.03 + i * 2.1;
        const x = hash(i, 0, 60) * W + Math.sin(t) * 6, y = hash(i, 1, 60) * H + Math.cos(t * 1.3) * 5;
        if (Math.sin(f * 0.2 + i * 1.3) > -0.2) {
          g.px(x, y, "#fff3a0");
          g.disc(x, y, 1.2, "#f7e27a", 0.25);
        }
      }
    }
  },
};
