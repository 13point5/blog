import { hash, type Gfx, type Scene } from "../engine";

// A single line across the page with a few favourite things standing on it.
// There is no background: the objects sit directly on the paper, drawn in a
// small palette that follows the page's own ink.

const H = 46;
const BASE = 39; // the shelf line

export type Pal = {
  ink: string; mid: string; light: string; paper: string;
  accent: string; green: string; gold: string; blue: string;
};

const LIGHT: Pal = {
  ink: "#2a2925", mid: "#8c877b", light: "#cfc9bb", paper: "#fdfbf7",
  accent: "#d9532b", green: "#3f7a5a", gold: "#c9973a", blue: "#3f6a9a",
};
const DARK: Pal = {
  ink: "#e8e6df", mid: "#9a968b", light: "#5a574f", paper: "#262624",
  accent: "#ff7a4d", green: "#6dbb8a", gold: "#f2c96a", blue: "#7fa8dc",
};

export type Item = {
  id: string;
  w: number;
  /** Lower number = kept first when the screen is narrow. */
  priority: number;
  /** `active` is false when a toy that can be switched on is off. */
  draw: (g: Gfx, x: number, y: number, f: number, P: Pal, active?: boolean) => void;
};

const OWL = [
  "m.......m",
  "mm.....mm",
  "mmmmmmmmm",
  "mpppmpppm",
  "mpkpmpkpm",
  "mpppgpppm",
  "mmmmgmmmm",
  "mlmlmlmlm",
  "mmlmlmlmm",
  "mlmlmlmlm",
  ".mmmmmmm.",
  "..g...g..",
];

const VIOLIN = [
  "..kk..",
  "..kk..",
  "..kk..",
  "..kk..",
  "..kk..",
  "..kk..",
  ".gggg.",
  "gggggg",
  "gggggg",
  ".gkkg.",
  ".gkkg.",
  "gggggg",
  "gggggg",
  "gggggg",
  ".gggg.",
];

const ITEMS: Item[] = [
  {
    // a handheld console with something bouncing on its screen
    id: "console", w: 12, priority: 5,
    draw(g, x, y, f, P) {
      g.rect(x, y - 18, 12, 18, P.ink);
      g.rect(x + 1, y - 17, 10, 16, P.paper);
      g.rect(x + 2, y - 16, 8, 7, P.green);
      const t = Math.floor(f / 3) % 10;
      g.px(x + 3 + (t < 5 ? t : 10 - t), y - 11 - Math.abs((Math.floor(f / 2) % 6) - 3), P.paper);
      g.rect(x + 2, y - 6, 3, 1, P.ink);
      g.rect(x + 3, y - 7, 1, 3, P.ink);
      g.px(x + 7, y - 5, P.accent);
      g.px(x + 9, y - 7, P.accent);
      g.rect(x + 4, y - 3, 4, 1, P.mid);
    },
  },
  {
    // an owl dozing on a stack of spellbooks
    id: "owl", w: 22, priority: 0,
    draw(g, x, y, f, P) {
      const books: [number, number, number, string][] = [[0, 22, 4, P.blue], [2, 18, 4, P.accent], [1, 19, 3, P.green]];
      let top = y;
      for (const [dx, w, h, c] of books) {
        top -= h;
        g.rect(x + dx, top, w, h, c);
        g.rect(x + dx, top, w, 1, P.ink);
        g.rect(x + dx + 3, top + 1, 1, h - 1, P.gold);
        g.rect(x + dx + w - 2, top + 1, 1, h - 1, P.paper);
      }
      g.rect(x, y - 1, 22, 1, P.ink);
      const blink = f % 70 < 4;
      const bob = Math.floor(f / 18) % 2;
      g.sprite(OWL, x + 6, top - 12 + bob, { m: P.mid, p: P.paper, k: P.ink, g: P.gold, l: P.light });
      if (blink) {
        g.rect(x + 7, top - 9 + bob, 3, 3, P.mid);
        g.rect(x + 11, top - 9 + bob, 3, 3, P.mid);
        g.rect(x + 7, top - 8 + bob, 3, 1, P.ink);
        g.rect(x + 11, top - 8 + bob, 3, 1, P.ink);
      }
    },
  },
  {
    // a record player, record turning, a few notes drifting up
id: "record", w: 30, priority: 1,
    draw(g, x, y, f, P, active = true) {
      g.rect(x, y - 7, 30, 7, P.ink);
      g.rect(x + 1, y - 6, 28, 5, P.gold);
      g.rect(x + 1, y - 2, 28, 1, P.mid);
      g.px(x + 25, y - 4, P.paper);
      g.px(x + 22, y - 4, active ? P.accent : P.mid);
      // the record, seen at an angle
      const rows = [12, 18, 20, 18, 12];
      rows.forEach((w, i) => g.rect(x + 12 - w / 2, y - 13 + i, w, 1, P.ink));
      g.rect(x + 10, y - 11, 4, 1, P.accent);
      const a = active ? f * 0.5 : 0.6;
      g.px(x + 12 + Math.cos(a) * 7, y - 11 + Math.sin(a) * 1.6, P.mid);
      g.px(x + 12 - Math.cos(a) * 5, y - 11 - Math.sin(a) * 1.2, P.mid);
      // tonearm: on the record when playing, parked when not
      g.rect(x + 25, y - 15, 2, 2, P.mid);
      if (active) g.line(x + 25, y - 14, x + 18, y - 11, P.mid);
      else g.line(x + 26, y - 14, x + 27, y - 9, P.mid);
      if (!active) return;
      for (let i = 0; i < 2; i++) {
        const p = (f * 0.35 + i * 9) % 18;
        const nx = x + 6 + i * 9 + Math.round(Math.sin(p * 0.6 + i) * 1.5), ny = y - 17 - p;
        const al = 1 - p / 18;
        g.rect(nx + 1, ny, 1, 4, P.ink, al);
        g.rect(nx, ny + 3, 2, 2, P.ink, al);
        g.px(nx + 2, ny + 1, P.ink, al);
      }
    },
  },
  {
    // three swords on a rack
    id: "swords", w: 26, priority: 2,
    draw(g, x, y, _f, P) {
      g.rect(x + 2, y - 19, 2, 19, P.mid);
      g.rect(x + 22, y - 19, 2, 19, P.mid);
      g.rect(x, y - 1, 26, 1, P.ink);
      const swords: [string, string][] = [[P.paper, P.light], [P.accent, P.ink], [P.ink, P.green]];
      swords.forEach(([blade, grip], i) => {
        const sy = y - 16 + i * 5;
        g.rect(x - 1, sy - 1, 28, 3, P.ink);
        g.rect(x, sy, 19, 1, blade);
        g.rect(x + 19, sy - 2, 1, 5, P.gold);
        g.rect(x + 20, sy, 6, 1, grip);
        g.px(x + 22, sy, P.paper);
        g.px(x + 24, sy, P.paper);
      });
    },
  },
  {
    // a puzzle cube that keeps scrambling itself
    id: "cube", w: 17, priority: 3.5,
    draw(g, x, y, f, P) {
      const colors = [P.accent, P.blue, P.green, P.gold, P.paper];
      const turn = Math.floor(f / 22);
      const row = turn % 3; // the layer that has just been twisted
      const pick = (face: number, i: number, j: number) =>
        colors[Math.floor(hash(face * 9 + i * 3 + j, j === row ? turn : 0, 61) * colors.length)];
      // front face
      g.rect(x, y - 13, 13, 13, P.ink);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) g.rect(x + 1 + i * 4, y - 12 + j * 4, 3, 3, pick(0, i, j));
      // top face, leaning back
      for (let j = 0; j < 3; j++) {
        g.rect(x + 3 - j, y - 16 + j, 14, 1, P.ink);
        for (let i = 0; i < 3; i++) g.rect(x + 4 - j + i * 4, y - 16 + j, 3, 1, pick(1, i, 0));
      }
      g.rect(x + 4, y - 17, 13, 1, P.ink);
      // right face
      for (let i = 0; i < 3; i++) {
        g.rect(x + 13 + i, y - 13 - i, 2, 13, P.ink);
        for (let j = 0; j < 3; j++) g.rect(x + 14 + i, y - 13 - i + j * 4, 1, 3, pick(2, i, j));
      }
    },
  },
  {
    // an upright piano that plays itself
    id: "piano", w: 30, priority: 3,
    draw(g, x, y, f, P) {
      g.rect(x, y - 22, 30, 15, P.ink);
      g.rect(x - 1, y - 23, 32, 2, P.ink);
      g.rect(x + 1, y - 20, 28, 1, P.mid);
      // music stand
      g.rect(x + 9, y - 18, 12, 7, P.paper);
      for (let i = 0; i < 3; i++) g.rect(x + 10, y - 17 + i * 2, 10 - (i % 2) * 3, 1, P.mid);
      // keys
      g.rect(x - 1, y - 9, 32, 4, P.ink);
      g.rect(x, y - 8, 30, 2, P.paper);
      for (let k = 1; k < 30; k += 2) if ((k >> 1) % 7 !== 2 && (k >> 1) % 7 !== 6) g.px(x + k, y - 8, P.ink);
      const key = Math.floor(hash(Math.floor(f / 4), 3, 12) * 15) * 2;
      g.rect(x + key, y - 7, 2, 1, P.accent);
      // legs
      g.rect(x, y - 5, 3, 5, P.ink);
      g.rect(x + 27, y - 5, 3, 5, P.ink);
      g.rect(x + 12, y - 2, 6, 1, P.gold);
    },
  },
  {
    // a yoyo, walking the dog
    id: "yoyo", w: 13, priority: 5.5,
    draw(g, x, y, f, P) {
      g.rect(x + 1, y - 24, 1, 24, P.mid);
      g.rect(x + 1, y - 24, 9, 1, P.mid);
      g.rect(x, y - 1, 4, 1, P.ink);
      // drops, sleeps at the bottom, climbs back
      const t = (f % 48) / 48;
      const drop = t < 0.3 ? t / 0.3 : t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
      const cy = y - 20 + Math.round(drop * drop * 15);
      g.rect(x + 9, y - 23, 1, cy - (y - 23), P.ink, 0.6);
      g.disc(x + 9, cy, 3, P.ink);
      g.disc(x + 9, cy, 2, P.accent);
      const a = f * 0.9;
      g.px(x + 9 + Math.round(Math.cos(a) * 1.4), cy + Math.round(Math.sin(a) * 1.4), P.paper);
    },
  },
  {
    // a metronome keeping time
    id: "metronome", w: 9, priority: 9,
    draw(g, x, y, f, P) {
      for (let i = 0; i < 13; i++) {
        const w = 3 + Math.floor((i * 6) / 13);
        g.rect(x + 4 - Math.floor(w / 2), y - 13 + i, w, 1, i === 12 ? P.ink : P.gold);
      }
      g.rect(x + 1, y - 1, 7, 1, P.ink);
      const swing = Math.sin(f * 0.42) * 3.2;
      g.line(x + 4, y - 3, x + 4 + swing, y - 15, P.ink);
      g.rect(x + 4 + swing * 0.6 - 1, y - 11, 2, 2, P.accent);
    },
  },
  {
    // a violin and its bow
    id: "violin", w: 12, priority: 6,
    draw(g, x, y, _f, P) {
      g.sprite(VIOLIN, x, y - 15, { k: P.ink, g: P.gold });
      g.rect(x + 2, y - 9, 2, 8, P.ink, 0.35);
      g.line(x + 11, y - 1, x + 7, y - 17, P.mid);
      g.px(x + 11, y - 1, P.ink);
    },
  },
  {
    // a castle in a snow globe
    id: "globe", w: 20, priority: 8,
    draw(g, x, y, f, P) {
      const cx = x + 10, cy = y - 12;
      g.disc(cx, cy, 9, P.ink);
      g.disc(cx, cy, 8, P.paper);
      // castle
      g.rect(cx - 5, cy + 1, 10, 5, P.mid);
      g.rect(cx - 6, cy - 2, 3, 8, P.mid);
      g.rect(cx + 3, cy - 4, 3, 10, P.mid);
      g.rect(cx - 1, cy - 5, 2, 7, P.mid);
      g.px(cx - 5, cy - 3, P.blue); g.px(cx + 4, cy - 5, P.blue); g.px(cx, cy - 6, P.blue);
      g.px(cx - 5, cy, P.gold); g.px(cx + 4, cy - 1, P.gold); g.px(cx - 1, cy + 3, P.gold);
      // snow
      for (let i = 0; i < 6; i++) {
        const sx = cx - 6 + hash(i, 1, 44) * 12, sy = cy - 6 + ((hash(i, 2, 44) * 12 + f * 0.25) % 12);
        if (Math.hypot(sx - cx, sy - cy) < 7) g.px(sx, sy, P.light);
      }
      g.rect(x + 3, y - 4, 14, 4, P.ink);
      g.rect(x + 4, y - 3, 12, 2, P.accent);
    },
  },
  {
    // a pointed hat and a wand that won't stop sparking
    id: "hat", w: 24, priority: 4,
    draw(g, x, y, f, P) {
      for (let i = 0; i < 12; i++) {
        const w = 1 + Math.floor(i * 0.75);
        g.rect(x + 8 - Math.floor(w / 2) + (i < 3 ? 2 - i : 0), y - 14 + i, w, 1, P.ink);
      }
      g.rect(x + 3, y - 4, 10, 1, P.accent);
      g.rect(x, y - 2, 16, 2, P.ink);
      // wand
      g.line(x + 16, y - 1, x + 22, y - 12, P.gold);
      g.px(x + 16, y - 1, P.ink);
      for (let i = 0; i < 4; i++) {
        const t = Math.floor(f / 3);
        if (hash(i, t, 9) < 0.6) g.px(x + 20 + hash(i, t, 10) * 5, y - 18 + hash(i, t, 11) * 7, i % 2 ? P.gold : P.accent);
      }
    },
  },
  {
    // floppy disks
    id: "floppy", w: 19, priority: 7,
    draw(g, x, y, _f, P) {
      const disk = (dx: number, dy: number, c: string) => {
        g.rect(x + dx, y - 11 + dy, 11, 11, P.ink);
        g.rect(x + dx + 1, y - 10 + dy, 9, 9, c);
        g.rect(x + dx + 3, y - 10 + dy, 5, 3, P.light);
        g.px(x + dx + 6, y - 9 + dy, P.ink);
        g.rect(x + dx + 2, y - 5 + dy, 7, 4, P.paper);
        g.rect(x + dx + 3, y - 4 + dy, 5, 1, P.mid);
      };
      disk(8, 0, P.accent);
      disk(0, 0, P.blue);
    },
  },
];

/** A wand on its own; it only sparks while `active`. */
const WAND: Item = {
  id: "wand", w: 9, priority: 99,
  draw(g, x, y, f, P, active = false) {
    g.line(x, y - 1, x + 6, y - 8, P.gold);
    g.px(x, y - 1, P.ink);
    g.px(x + 1, y - 2, P.ink);
    if (!active) return;
    for (let i = 0; i < 5; i++) {
      if (hash(i, f, 9) < 0.7) g.px(x + 4 + hash(i, f, 10) * 5, y - 12 + hash(i, f, 11) * 7, i % 2 ? P.gold : P.accent);
    }
  },
};

/** Every drawable object, by id, for use as a standalone sprite. */
export const TOYS: Record<string, Item> = Object.fromEntries([...ITEMS, WAND].map((i) => [i.id, i]));
export const TOY_PALETTE = { light: LIGHT, dark: DARK };
export const OWL_ROWS = OWL;

type Placed = { item: Item; x: number; hop: number };
type State = { placed: Placed[] };

export const shelf: Scene<State> = {
  w: 132,
  h: H,
  fps: 12,
  poster: 20,
  fluid: true,
  alt: "A row of small pixel-art objects standing on a line: an owl on a stack of books, a record player, three swords on a rack, a puzzle cube, a piano, a yoyo and other favourite things.",

  init(_rng, w) {
    // Keep adding things, most important first, while they still fit.
    const MIN_GAP = 7;
    const chosen: Item[] = [];
    let used = 0;
    for (const item of [...ITEMS].sort((a, b) => a.priority - b.priority)) {
      if (used + item.w + MIN_GAP * (chosen.length + 2) <= w) {
        chosen.push(item);
        used += item.w;
      }
    }
    const order = ITEMS.filter((i) => chosen.includes(i));
    const gap = (w - used) / (order.length + 1);
    let x = gap;
    const placed = order.map((item) => {
      const p = { item, x: Math.round(x), hop: 0 };
      x += item.w + gap;
      return p;
    });
    return { placed };
  },

  pointer(s, x) {
    let best: Placed | null = null;
    for (const p of s.placed) {
      if (!best || Math.abs(p.x + p.item.w / 2 - x) < Math.abs(best.x + best.item.w / 2 - x)) best = p;
    }
    if (!best) return false;
    best.hop = 8;
    return true;
  },

  draw(g, f, s, env) {
    const P = env.night ? DARK : LIGHT;
    g.rect(0, BASE, g.w, 1, P.ink);
    for (const p of s.placed) {
      const lift = p.hop > 0 ? Math.round(Math.sin((p.hop / 8) * Math.PI) * 5) : 0;
      if (p.hop > 0) p.hop--;
      // a short shadow under the line
      g.rect(p.x + 1, BASE + 2, p.item.w - 2, 1, P.light);
      p.item.draw(g, p.x, BASE - lift, f, P);
    }
  },
};
