import { hash, type Gfx, type Scene } from "../engine";
import { VOXEL_TOYS } from "../voxel-toys";
import { chime, click, coin, driveSeek, fanfare, hoot, piano, midi, pluck, whoosh } from "@/lib/audio";

// A single line across the page with a few favourite things standing on it.
// There is no background: the objects sit directly on the paper. The same
// objects are also used one at a time as toys scattered around the site.

const H = 56;
const BASE = 49; // the shelf line

export type Pal = {
  ink: string; mid: string; light: string; paper: string;
  accent: string; green: string; gold: string; blue: string;
  wood: string; woodHi: string; woodLo: string; snow: string;
};

const LIGHT: Pal = {
  ink: "#2a2925", mid: "#8c877b", light: "#cfc9bb", paper: "#fdfbf7",
  accent: "#d9532b", green: "#3f7a5a", gold: "#c9973a", blue: "#3f6a9a",
  wood: "#8a5230", woodHi: "#c0753a", woodLo: "#5a341d", snow: "#fdfbf7",
};
const DARK: Pal = {
  ink: "#e8e6df", mid: "#9a968b", light: "#5a574f", paper: "#262624",
  accent: "#ff7a4d", green: "#6dbb8a", gold: "#f2c96a", blue: "#7fa8dc",
  wood: "#a8683c", woodHi: "#d98a4a", woodLo: "#6b3f22", snow: "#fdfbf7",
};
const BLACK = "#1d1d1b";

export type Item = {
  id: string;
  w: number;
  /** Lower number = kept first when the screen is narrow. */
  priority: number;
  /**
   * `active` is false when a toy that can be switched on is off; `taps`
   * counts how often it has been poked, and `since` is the number of frames
   * since the last poke, for animating what the poke did.
   */
  draw: (g: Gfx, x: number, y: number, f: number, P: Pal, active?: boolean, taps?: number, since?: number) => void;
  /** What it sounds like when poked. */
  sound?: (taps: number) => void;
};

// A little brown owl. Its proportions come from laying out simple shapes: a
// big round head (a little over half its height, and wider than the body),
// small ear tufts, a dark cap with a widow's peak, two cream eye discs holding
// large dark eyes, a small beak and rosy cheeks, then a rounder, narrower body
// with darker wings either side of a cream belly, and orange feet.
const OWL = [
  "..k.................k..",
  ".kdk.....kkkkk.....kdk.",
  ".kddk.kkkdddddkkk.kddk.",
  "..kddkdddddddddddkddk..",
  "...kbbbbbdddddbbbbbk...",
  "..kbbbccbbdddbbccbbbk..",
  ".kbbccccccbdbccccccbbk.",
  ".kbccceecccdccceecccbk.",
  ".kbccweeeccbcceweeccbk.",
  ".kbcceeeeccbcceeeeccbk.",
  ".kbcceeeeccccceeeeccbk.",
  "..kbceeeccooocceeecbk..",
  "...kppcccccocccccppk...",
  "....kbbcccccccccbbk....",
  "....kdbbbbbbbbbbbdk....",
  "....kdbbtttttttbbdk....",
  "...kddbtttttttttbddk...",
  "...kddbttvtttvttbddk...",
  "...kddbtttttttttbddk...",
  "....kdbttttvttttbdk....",
  ".....kbbtttttttbbk.....",
  "......kkbbtttbbkk......",
  ".......oookkkooo.......",
];
export const OWL_ROWS = OWL;
export const OWL_SIZE = { w: 23, h: OWL.length };
export const OWL_PAL = {
  k: "#4a2c17", b: "#8f5e36", d: "#6b4222", c: "#fbe6c6", e: "#3b2212", w: "#ffffff",
  o: "#f0a03c", p: "#f4aaa0", t: "#fbe6c6", v: "#8f5e36",
};
/** Close the owl's eyes into two happy arcs; (x, y) is the sprite's top-left corner. */
export function owlBlink(g: Gfx, x: number, y: number) {
  for (const ex of [5, 14]) {
    g.rect(x + ex, y + 7, 4, 5, OWL_PAL.c);
    g.px(x + ex, y + 10, OWL_PAL.e); g.px(x + ex + 1, y + 9, OWL_PAL.e);
    g.px(x + ex + 2, y + 9, OWL_PAL.e); g.px(x + ex + 3, y + 10, OWL_PAL.e);
  }
}

// The six sticker colours of a puzzle cube.
const CUBE = ["#fdfbf7", "#f2c14e", "#c8321f", "#f08a2c", "#2f6fd6", "#2f9d5a"];

const ITEMS: Item[] = [
  {
    // a handheld console with something bouncing on its screen
    id: "console", w: 15, priority: 4,
    sound: coin,
    draw(g, x, y, f, P) {
      g.rect(x, y - 23, 15, 23, P.ink);
      g.rect(x + 1, y - 22, 13, 21, P.light);
      g.rect(x + 1, y - 22, 13, 1, P.paper);
      // screen
      g.rect(x + 2, y - 20, 11, 9, P.ink);
      g.rect(x + 3, y - 19, 9, 7, "#9bbc5a");
      const t = Math.floor(f / 3) % 14;
      const bx = x + 3 + (t < 7 ? t : 14 - t), by = y - 14 - Math.abs((Math.floor(f / 2) % 8) - 4);
      g.rect(bx, by, 2, 2, "#2f4f2a");
      g.rect(x + 3, y - 13, 9, 1, "#2f4f2a");
      // d-pad, buttons, speaker
      g.rect(x + 2, y - 7, 5, 1, P.ink);
      g.rect(x + 4, y - 9, 1, 5, P.ink);
      g.rect(x + 9, y - 6, 2, 2, P.accent);
      g.rect(x + 11, y - 9, 2, 2, P.accent);
      g.rect(x + 5, y - 3, 2, 1, P.mid); g.rect(x + 8, y - 3, 2, 1, P.mid);
    },
  },
  {
    // an owl dozing on a stack of spellbooks
    id: "owl", w: 26, priority: 0,
    sound: hoot,
    draw(g, x, y, f, P) {
      const books: [number, number, number, string][] = [[0, 26, 5, P.blue], [3, 21, 4, P.accent], [1, 23, 4, P.green]];
      let top = y;
      for (const [dx, w, h, c] of books) {
        top -= h;
        g.rect(x + dx, top, w, h, c);
        g.rect(x + dx, top, w, 1, P.ink);
        g.rect(x + dx + 3, top + 1, 2, h - 1, P.gold);
        g.rect(x + dx + w - 3, top + 1, 2, h - 2, P.snow);
        g.rect(x + dx + w - 3, top + 2, 2, 1, P.mid);
      }
      g.rect(x, y - 1, 26, 1, P.ink);
      const bob = Math.floor(f / 18) % 2;
      g.sprite(OWL, x + 2, top - OWL.length + bob, OWL_PAL);
      if (f % 70 < 4) owlBlink(g, x + 2, top - OWL.length + bob);
    },
  },
  {
    // a turntable: wooden plinth, a grooved record with a bright label, a tonearm
    id: "record", w: 44, priority: 1,
    draw(g, x, y, f, P, active = true) {
      // plinth: front face with a little grain, then the top seen at an angle
      g.rect(x, y - 9, 42, 9, P.woodLo);
      g.rect(x + 1, y - 8, 40, 6, P.wood);
      g.rect(x + 3, y - 6, 12, 1, P.woodHi); g.rect(x + 20, y - 4, 9, 1, P.woodHi);
      g.rect(x + 3, y - 1, 4, 1, BLACK); g.rect(x + 35, y - 1, 4, 1, BLACK);
      g.rect(x + 33, y - 6, 3, 3, P.gold);
      g.px(x + 34, y - 5, P.woodLo);
      g.rect(x + 28, y - 5, 2, 2, active ? P.accent : P.woodLo);
      for (let i = 0; i < 13; i++) {
        const off = Math.round((12 - i) * 0.25);
        g.rect(x + off, y - 22 + i, 42, 1, P.woodLo);
        g.rect(x + off + 1, y - 22 + i, 40, 1, i === 0 ? P.woodLo : P.light);
      }
      // platter and record
      const cx = x + 17, cy = y - 15;
      const disc = [16, 22, 26, 28, 30, 30, 30, 28, 26, 22, 16];
      disc.forEach((w, i) => g.rect(cx - w / 2, cy - 5 + i, w, 1, i === disc.length - 1 ? P.mid : BLACK));
      // grooves
      for (const [w, dy] of [[22, -3], [24, 3], [16, -2], [18, 2]]) g.rect(cx - w / 2, cy + dy, w, 1, "#3a3a36");
      g.rect(cx - 5, cy - 1, 10, 3, P.accent);
      g.rect(cx - 3, cy - 2, 6, 1, P.accent); g.rect(cx - 3, cy + 2, 6, 1, P.accent);
      g.rect(cx - 1, cy, 2, 1, P.snow);
      // a highlight sweeping round as it turns
      const a = active ? f * 0.45 : 0.7;
      g.rect(cx + Math.cos(a) * 11 - 1, cy + Math.sin(a) * 3.6, 2, 1, P.mid);
      g.rect(cx - Math.cos(a) * 9, cy - Math.sin(a) * 3, 2, 1, P.mid);
      // tonearm: pivot and counterweight at the back right
      g.rect(x + 36, y - 21, 4, 4, P.mid);
      g.rect(x + 37, y - 20, 2, 2, BLACK);
      g.rect(x + 38, y - 23, 3, 2, BLACK);
      if (active) { g.line(x + 37, y - 18, x + 28, y - 13, P.mid); g.line(x + 37, y - 17, x + 28, y - 12, P.mid); g.rect(x + 26, y - 13, 3, 3, BLACK); }
      else { g.line(x + 38, y - 17, x + 38, y - 11, P.mid); g.line(x + 39, y - 17, x + 39, y - 11, P.mid); g.rect(x + 37, y - 11, 3, 3, BLACK); }
      if (!active) return;
      for (let i = 0; i < 3; i++) {
        const p = (f * 0.35 + i * 7) % 20;
        const nx = x + 5 + i * 11 + Math.round(Math.sin(p * 0.6 + i) * 1.5), ny = y - 27 - p;
        const al = 1 - p / 20;
        g.rect(nx + 2, ny, 1, 5, P.ink, al);
        g.rect(nx, ny + 4, 3, 2, P.ink, al);
        g.rect(nx + 3, ny, 1, 2, P.ink, al);
      }
    },
  },
  {
    // a puzzle cube: three visible faces of nine stickers. Each poke turns a
    // layer; six pokes solve it, the seventh scrambles it again.
    id: "cube", w: 27, priority: 2,
    sound: (taps) => (taps % 7 === 6 ? fanfare() : click()),
    draw(g, x, y, f, P, _active, taps = 0) {
      const epoch = Math.floor(taps / 7), level = taps % 7;
      const sticker = (face: number, i: number) => {
        const k = face * 9 + i;
        const solved = CUBE[(face * 2 + epoch) % 6];
        return hash(k, epoch, 61) < level / 6 ? solved : CUBE[Math.floor(hash(k, epoch * 31 + 7, 62) * 6)];
      };
      const fx = x, fy = y - 16; // top-left of the front face
      // the black plastic body
      g.rect(fx, fy, 16, 16, BLACK);
      for (let k = 1; k <= 10; k++) {
        g.rect(fx + k, fy - k, 16, 1, BLACK); // top face
        g.rect(fx + 15 + k, fy - k, 1, 16, BLACK); // right face
      }
      // front
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) g.rect(fx + 1 + i * 5, fy + 1 + j * 5, 4, 4, sticker(0, j * 3 + i));
      // top: three rows going back, each drawn as two stepped lines
      for (let d = 0; d < 3; d++) for (let i = 0; i < 3; i++) for (let r = 0; r < 2; r++) {
        const k = 1 + d * 3 + r;
        g.rect(fx + 1 + i * 5 + k, fy - k, 4, 1, sticker(1, d * 3 + i));
      }
      // right: three columns going back, each drawn as two stepped lines
      for (let d = 0; d < 3; d++) for (let j = 0; j < 3; j++) for (let r = 0; r < 2; r++) {
        const k = 1 + d * 3 + r;
        g.rect(fx + 15 + k, fy + 1 + j * 5 - k, 1, 4, sticker(2, j * 3 + d));
      }
      if (level === 6) {
        for (let i = 0; i < 5; i++) {
          if (hash(i, Math.floor(f / 2), 9) < 0.6) g.px(x - 2 + hash(i, Math.floor(f / 2), 10) * 30, y - 30 + hash(i, Math.floor(f / 2), 11) * 26, i % 2 ? P.gold : P.accent);
        }
      }
    },
  },
  {
    // an upright piano that plays itself
    id: "piano", w: 34, priority: 3,
    sound: (taps) => [60, 64, 67].forEach((n, i) => piano(midi(n + (taps % 3) * 5), 0.07, i * 0.07)),
    draw(g, x, y, f, P) {
      g.rect(x, y - 26, 34, 26, P.woodLo);
      g.rect(x + 1, y - 25, 32, 14, P.wood);
      g.rect(x - 1, y - 27, 36, 2, P.woodLo);
      // panelled front and a sheet of music
      g.rect(x + 3, y - 23, 8, 9, P.woodHi);
      g.rect(x + 23, y - 23, 8, 9, P.woodHi);
      g.rect(x + 12, y - 23, 10, 9, P.snow);
      for (let i = 0; i < 4; i++) g.rect(x + 13, y - 22 + i * 2, 8 - (i % 2) * 3, 1, P.mid);
      // keyboard
      g.rect(x - 1, y - 11, 36, 5, P.woodLo);
      g.rect(x, y - 10, 34, 3, P.snow);
      for (let k = 1; k < 34; k += 2) if ((k >> 1) % 7 !== 2 && (k >> 1) % 7 !== 6) g.rect(x + k, y - 10, 1, 2, BLACK);
      const key = Math.floor(hash(Math.floor(f / 4), 3, 12) * 17) * 2;
      g.rect(x + key, y - 8, 2, 1, P.accent);
      // lower panel, legs and pedals
      g.rect(x + 3, y - 6, 28, 6, P.wood);
      g.rect(x, y - 6, 3, 6, P.woodLo);
      g.rect(x + 31, y - 6, 3, 6, P.woodLo);
      g.px(x + 15, y - 1, P.gold); g.px(x + 17, y - 1, P.gold); g.px(x + 19, y - 1, P.gold);
    },
  },
  {
    // a yoyo on a stand, dropping and climbing
    id: "yoyo", w: 15, priority: 5,
    sound: whoosh,
    draw(g, x, y, f, P) {
      g.rect(x + 1, y - 28, 1, 28, P.mid);
      g.rect(x + 1, y - 28, 10, 1, P.mid);
      g.rect(x, y - 1, 4, 1, P.ink);
      // drops, sleeps at the bottom, climbs back
      const t = (f % 48) / 48;
      const drop = t < 0.3 ? t / 0.3 : t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4;
      const cy = y - 23 + Math.round(drop * drop * 17);
      g.rect(x + 10, y - 27, 1, cy - (y - 27), P.ink, 0.6);
      g.disc(x + 10, cy, 4, BLACK);
      g.disc(x + 10, cy, 3, P.accent);
      g.px(x + 10, cy, BLACK);
      const a = f * 0.9;
      g.px(x + 10 + Math.round(Math.cos(a) * 2), cy + Math.round(Math.sin(a) * 2), P.snow);
    },
  },
  {
    // a castle in a snow globe
    id: "globe", w: 22, priority: 7,
    sound: pluck,
    draw(g, x, y, f, P) {
      const cx = x + 11, cy = y - 14;
      g.disc(cx, cy, 10, P.ink);
      g.disc(cx, cy, 9, P.paper);
      // castle
      g.rect(cx - 6, cy + 1, 12, 6, P.mid);
      g.rect(cx - 7, cy - 2, 3, 9, P.mid);
      g.rect(cx + 4, cy - 4, 3, 11, P.mid);
      g.rect(cx - 1, cy - 6, 3, 8, P.mid);
      g.px(cx - 6, cy - 3, P.blue); g.px(cx + 5, cy - 5, P.blue); g.px(cx, cy - 7, P.blue);
      g.px(cx - 6, cy, P.gold); g.px(cx + 5, cy - 1, P.gold); g.px(cx, cy + 3, P.gold); g.px(cx - 3, cy + 4, P.gold);
      // snow
      for (let i = 0; i < 8; i++) {
        const sx = cx - 7 + hash(i, 1, 44) * 14, sy = cy - 7 + ((hash(i, 2, 44) * 14 + f * 0.25) % 14);
        if (Math.hypot(sx - cx, sy - cy) < 8) g.px(sx, sy, P.light);
      }
      g.px(cx - 5, cy - 6, P.snow); g.px(cx - 4, cy - 7, P.snow);
      g.rect(x + 3, y - 5, 16, 5, P.ink);
      g.rect(x + 4, y - 4, 14, 3, P.accent);
    },
  },
  {
    // a pointed hat and a wand that won't stop sparking
    id: "hat", w: 28, priority: 6,
    sound: () => chime(true),
    draw(g, x, y, f, P) {
      for (let i = 0; i < 15; i++) {
        const w = 1 + Math.floor(i * 0.8);
        g.rect(x + 10 - Math.floor(w / 2) + (i < 4 ? 3 - i : 0), y - 17 + i, w, 1, P.ink);
      }
      g.rect(x + 4, y - 5, 12, 2, P.accent);
      g.rect(x + 9, y - 5, 2, 2, P.gold);
      g.rect(x, y - 2, 20, 2, P.ink);
      // wand
      g.line(x + 20, y - 1, x + 26, y - 14, P.wood);
      g.line(x + 21, y - 1, x + 27, y - 14, P.woodHi);
      g.rect(x + 20, y - 3, 2, 3, P.woodLo);
      for (let i = 0; i < 5; i++) {
        const t = Math.floor(f / 3);
        if (hash(i, t, 9) < 0.6) g.px(x + 23 + hash(i, t, 10) * 5, y - 21 + hash(i, t, 11) * 8, i % 2 ? P.gold : P.accent);
      }
    },
  },
  {
    // two floppy disks
    id: "floppy", w: 27, priority: 5.5,
    sound: driveSeek,
    draw(g, x, y, _f, P) {
      const disk = (dx: number, c: string) => {
        g.rect(x + dx, y - 15, 15, 15, P.ink);
        g.rect(x + dx + 1, y - 14, 13, 13, c);
        g.px(x + dx + 13, y - 14, P.ink); // the clipped corner
        // metal shutter
        g.rect(x + dx + 4, y - 14, 7, 5, P.light);
        g.rect(x + dx + 8, y - 13, 2, 3, P.ink);
        // label
        g.rect(x + dx + 2, y - 7, 11, 6, P.snow);
        g.rect(x + dx + 3, y - 5, 9, 1, P.mid);
        g.rect(x + dx + 3, y - 3, 6, 1, P.mid);
      };
      disk(12, P.accent);
      disk(0, P.blue);
    },
  },
];

// After Harry's wand: the handle is a piece of branch with the bark left on,
// rough and grey-brown with a knobbly end, and above it a smooth, warm,
// reddish-brown shaft that tapers to the tip. It only sparks while `active`.
const WAND: Item = {
  id: "wand", w: 24, priority: 99,
  draw(g, x, y, f, P, active = false) {
    const BARK = "#8f7c68", BARK_DK = "#4a3d32", BARK_HI = "#b9a892";
    const WOOD = "#9a5230", WOOD_HI = "#c47a4a", WOOD_DK = "#6e3519";
    // point i along the wand, from the butt of the handle (bottom left) to the tip (top right)
    const at = (i: number) => [x + 1 + i, y - 2 - i] as const;
    // the smooth shaft: two pixels thick, then one toward the tip
    for (let i = 8; i < 22; i++) {
      const [px, py] = at(i);
      if (i < 16) { g.rect(px, py, 2, 2, WOOD); g.px(px, py, WOOD_HI); g.px(px + 1, py + 1, WOOD_DK); }
      else g.px(px, py, i >= 20 ? WOOD_HI : WOOD);
    }
    // the bark handle: a dark edge first, then the bark laid over it so its
    // grey-brown shows, with lumps where twigs were cut off
    const lump = (i: number) => i === 2 || i === 5;
    for (let i = 0; i < 9; i++) {
      const [px, py] = at(i);
      g.rect(px - 1, py - 1, 4, 4, BARK_DK);
      if (lump(i)) { g.rect(px - 2, py - 2, 3, 3, BARK_DK); g.rect(px + 1, py + 1, 3, 3, BARK_DK); }
    }
    g.rect(x - 1, y - 4, 4, 4, BARK_DK); // a knobbly butt
    for (let i = 0; i < 9; i++) {
      const [px, py] = at(i);
      g.rect(px, py, 2, 2, BARK);
      if (lump(i)) { g.px(px - 1, py - 1, BARK); g.px(px + 2, py + 2, BARK); }
      g.px(px, py, hash(i, 1, 41) < 0.55 ? BARK_HI : BARK);
      if (hash(i, 2, 41) < 0.35) g.px(px + 1, py + 1, BARK_DK);
    }
    g.rect(x, y - 3, 2, 2, BARK); g.px(x, y - 3, BARK_HI);
    // a ridge where the bark ends and the shaft begins
    const [jx, jy] = at(9);
    g.rect(jx - 1, jy, 3, 2, BARK_DK); g.px(jx, jy, WOOD_HI);
    if (!active) return;
    const [tx, ty] = at(21);
    for (let i = 0; i < 8; i++) {
      if (hash(i, f, 9) < 0.7) g.px(tx - 4 + hash(i, f, 10) * 9, ty - 5 + hash(i, f, 11) * 9, i % 2 ? P.gold : P.accent);
    }
    g.px(tx + 1, ty - 1, "#fff6c9");
  },
};

// A spellbook: oxblood leather with a darker spine, a gilt border, a gem set
// in the cover, a clasp, cream page edges and a ribbon. Drawn to stand about
// as tall as the owl, at the same pixel size.
const BOOK: Item = {
  id: "book", w: 19, priority: 99,
  draw(g, x, y, f) {
    const K = "#2a1a22", S = "#4a1728", M = "#8a2f44", M2 = "#a8405a", G = "#e0b050", Y = "#f6dc8c", C = "#58c7d9", PG = "#f3ead6", PL = "#cfc4a8", R = "#d9532b";
    const cw = 14, ch = 18, top = y - ch - 7; // the cover; pages and a ribbon show below it
    g.rect(x, top, cw + 2, ch + 2, K);
    g.rect(x + cw + 2, top + 2, 3, ch + 2, K); // page block, right edge
    g.rect(x + 2, top + ch + 2, cw + 3, 3, K); // and along the bottom
    g.rect(x + cw + 2, top + 3, 2, ch, PG); g.rect(x + cw + 3, top + 3, 1, ch, PL);
    g.rect(x + 3, top + ch + 2, cw + 1, 2, PG); g.rect(x + 3, top + ch + 3, cw + 1, 1, PL);
    g.rect(x + 1, top + 1, cw, ch, M);
    g.rect(x + 1, top + 1, 2, ch, S); // spine
    g.rect(x + 3, top + 1, cw - 2, 1, M2); // light along the top edge
    g.box(x + 4, top + 3, cw - 4, ch - 4, G); // gilt border
    const gx = x + 7, gy = top + 8; // the gem: a diamond in the middle of the cover
    g.rect(gx + 1, gy, 2, 4, Y); g.rect(gx, gy + 1, 4, 2, Y); g.rect(gx + 1, gy + 1, 2, 2, C);
    g.rect(x + cw - 1, top + 9, 5, 2, G); g.px(x + cw + 3, top + 9, Y); // clasp
    g.rect(x + 6, top + ch + 5, 1, 2, R); g.px(x + 7, top + ch + 6, R); // ribbon
    if (f % 64 < 3) g.px(gx + 1, gy + 1, "#ffffff"); // the gem catches the light
  },
};

/** Every drawable object, by id, for use as a standalone sprite. */
// The voxel versions replace their flat namesakes wherever a toy stands alone.
export const TOYS: Record<string, Item> = { ...Object.fromEntries([...ITEMS, WAND, BOOK].map((i) => [i.id, i])), ...VOXEL_TOYS };
export const TOY_PALETTE = { light: LIGHT, dark: DARK };

type Placed = { item: Item; x: number; hop: number; taps: number };
type State = { placed: Placed[] };

export const shelf: Scene<State> = {
  w: 132,
  h: H,
  fps: 12,
  poster: 20,
  fluid: true,
  alt: "A row of small pixel-art objects standing on a line: an owl on a stack of books, a record player, a puzzle cube, a piano and other favourite things.",

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
      const p = { item, x: Math.round(x), hop: 0, taps: 0 };
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
    best.taps++;
    best.item.sound?.(best.taps);
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
      p.item.draw(g, p.x, BASE - lift, f, P, true, p.taps);
    }
  },
};
