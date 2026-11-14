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
  ".kbcceweeccbcceweeccbk.",
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

// An arc reactor in chunky pixels: a dark outline, a steel ring lit from the
// top left, ten glowing segments with copper coils between them, an inner
// glowing ring and a bright core. It is the light switch for the site:
// `active` means the dark theme is on, when it burns brighter. `since` counts
// frames from the last tap: the segments light up one after another round
// the ring as it switches.
const REACTOR_ROWS = [
  "........kkkkkkk........",
  "......kkkhhhhhkkk......",
  "....kkhhhhhhhhhhhkk....",
  "...kkhhhccooocchsskk...",
  "..kkhhkoccoooccoksskk..",
  "..khhcoocCCoCCcoocssk..",
  ".khhcccokCnnnCkocccssk.",
  ".khhccCCnnCCCnnCCccsdk.",
  "kkhkooCnnCCnCCnnCookdkk",
  "khhoooknCnnwnnCnkoooddk",
  "khhcconCCnwwwnCCnoccddk",
  "khhccCnCnwwwwwnCnCccddk",
  "khhcconCCnwwwnCCnoccddk",
  "khhoooknCnnwnnCnkoooddk",
  "kkhkooCnnCCnCCnnCookdkk",
  ".khhccCCnnCCCnnCCccddk.",
  ".khscccokCnnnCkocccddk.",
  "..ksscoocCCoCCcoocddk..",
  "..kksskoccoooccokddkk..",
  "...kksssccoooccdddkk...",
  "....kksddddddddddkk....",
  "......kkkdddddkkk......",
  "........kkkkkkk........",
];
const REACTOR_SEGMENTS = 10;
const REACTOR: Item = {
  id: "reactor", w: 23, priority: 99,
  draw(g, x, y, f, _P, active = false, _taps, since = 99) {
    const pal: Record<string, string> = {
      k: "#12161d", s: "#7b8494", h: "#aab3c2", d: "#4d5565", o: "#b9722f", n: "#0f2a3d", w: "#f2fdff",
      c: active ? "#7fdcff" : "#27a9e3", C: active ? "#d6f6ff" : "#7fdcff",
    };
    const top = y - REACTOR_ROWS.length, mid = (REACTOR_ROWS.length - 1) / 2;
    const sweep = since < 22 ? since / 1.4 : -1; // how many segments the surge has reached
    const beat = active && Math.floor(f / 9) % 2 === 0; // the inner ring's slow pulse in the dark
    REACTOR_ROWS.forEach((row, j) => {
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch === ".") continue;
        let color = pal[ch];
        const dx = i - mid, dy = j - mid, d = Math.hypot(dx, dy);
        if ((ch === "c" || ch === "C") && d > 5.3) {
          // a segment: lit white for a moment as the surge passes it, clockwise from the top
          const seg = Math.floor((((Math.atan2(dy, dx) + Math.PI * 2.5) % (Math.PI * 2)) / (Math.PI * 2)) * REACTOR_SEGMENTS);
          if (sweep >= 0 && seg <= sweep && seg > sweep - 3) color = pal.w;
        } else if (ch === "C" && beat) color = pal.w;
        g.px(x + i, top + j, color);
      }
    });
  },
};

// A spellbook. Its cover is one deep purple panel with a gilt frame and, in a
// gold lozenge at its centre, a clear blue gem; now and then light runs down
// the gem. It is seen from a little above and to the left, so that it has
// some thickness: the spine, with its raised gilt bands, down the left side,
// and the tops of the pages between the boards (see drawBookDepth).
const BOOK_ROWS = [
  ".kkkkkkkkkkkkkkkkk.",
  "kkmmmmmmmmmmmmmmmkk",
  "kmmgggggggggggggmmk",
  "kmgmmmmmmmmmmmmmgmk",
  "kmgmymmmmgmmmmymgmk",
  "kmgmmmmmmgmmmmmmgmk",
  "kmgmmmmmgmgmmmmmgmk",
  "kmgmmmmgmmmgmmmmgmk",
  "kmgmmmmgmcmgmmmmgmk",
  "kmgmmmgmwCmmgmmmgmk",
  "kmgmmgmmCccmmgmmgmk",
  "kmgmgmmcccccmmgmgmk",
  "kmgmgmmcccccmmgmgmk",
  "kmgmmgmmcccmmgmmgmk",
  "kmgmmmgmmcmmgmmmgmk",
  "kmgmmmmgmcmgmmmmgmk",
  "kmgmmmmgmmmgmmmmgmk",
  "kmgmmmmmgmgmmmmmgmk",
  "kmgmmmmmmgmmmmmmgmk",
  "kmgmymmmmgmmmmymgmk",
  "kmgmmmmmmmmmmmmmgmk",
  "kmmgggggggggggggmmk",
  "kkmmmmmmmmmmmmmmmkk",
  ".kkkkkkkkkkkkkkkkk.",
];
const BOOK_PAL = { k: "#1c1030", m: "#4a2a80", g: "#e3b34d", y: "#f8e08c", w: "#ffffff", c: "#58c7d9", C: "#bff2fa" };
const PAGE = "#fbf1dc", PAGE_EDGE = "#d9cdb0", INK = "#6b46a8", INK_PALE = "#b9a3dc";
const BOOK_W = BOOK_ROWS[0].length;
/** how thick the closed book is drawn: this many pixels of spine and of page-tops, each a step up and to the left */
export const BOOK_DEPTH = 3;
/**
 * The thickness of the closed book whose front cover has its top-left corner
 * at (bx, top): behind the cover, layer after layer, each one pixel up and to
 * the left. What shows of them is the spine down the left and the tops of the
 * pages along the top, closed off by the edge of the back cover.
 */
function drawBookDepth(g: Gfx, bx: number, top: number) {
  const h = BOOK_ROWS.length, w = BOOK_W, last = BOOK_DEPTH;
  for (let d = 1; d <= last; d++) {
    const x = bx - d, y = top - d, back = d === last;
    // the spine: darkest in the groove beside the cover, lightest where it rounds toward the light
    g.rect(x, y + 1, 1, h - 2, back ? BOOK_PAL.k : ["#33195e", "#55329a"][Math.min(1, d - 1)]);
    if (!back) for (const band of [3, 4, 11, 12, 19, 20]) g.px(x, y + band, band % 2 ? BOOK_PAL.g : BOOK_PAL.y);
    // the page-tops: cream leaves, the odd one darker, and the back board's edge beyond them
    g.rect(x + 1, y, w - 2, 1, back ? BOOK_PAL.k : d % 2 ? PAGE : PAGE_EDGE);
    if (!back) { g.px(x + 1, y, BOOK_PAL.k); g.px(x + w - 2, y, PAGE_EDGE); g.px(x + w - 1, y, BOOK_PAL.k); }
  }
  // the head and tail of the spine, where the layers step
  for (let d = 1; d < last; d++) g.px(bx - d, top - d + h - 1, BOOK_PAL.k);
}

/** frames the cover takes to swing open after a tap */
export const BOOK_OPENING = 4;

/**
 * The book lying open: twice the width of the closed book, as a real one is.
 * On the left page a magic circle turns; on the right, runes write themselves
 * line by line and start again; sparks drift up out of the gutter.
 */
function drawOpenBook(g: Gfx, x: number, top: number, f: number) {
  const h = BOOK_ROWS.length, w = BOOK_W * 2;
  g.rect(x + 1, top, w - 2, h, BOOK_PAL.k);
  g.rect(x, top + 1, w, h - 2, BOOK_PAL.k);
  g.rect(x + 1, top + 1, w - 2, h - 2, BOOK_PAL.m);
  for (const px of [2, BOOK_W + 1]) {
    g.rect(x + px, top + 2, BOOK_W - 3, h - 4, PAGE);
    g.rect(x + px, top + h - 3, BOOK_W - 3, 1, PAGE_EDGE);
  }
  g.rect(x + BOOK_W - 2, top + 2, 1, h - 5, PAGE_EDGE); // the pages curve down into the gutter
  g.rect(x + BOOK_W + 1, top + 2, 1, h - 5, PAGE_EDGE);
  g.rect(x + BOOK_W - 1, top + 2, 2, h - 4, BOOK_PAL.k);

  // left page: a circle with three lights going round it and a star at its heart
  const cx = x + 9, cy = top + 11;
  g.ring(cx, cy, 6, INK);
  g.ring(cx, cy, 3.4, INK_PALE);
  for (let k = 0; k < 3; k++) {
    const a = f * 0.14 + (k * Math.PI * 2) / 3;
    g.px(cx + Math.round(Math.cos(a) * 6), cy + Math.round(Math.sin(a) * 6), BOOK_PAL.c);
    g.px(cx + Math.round(Math.cos(a - 0.35) * 6), cy + Math.round(Math.sin(a - 0.35) * 6), BOOK_PAL.C);
  }
  const pulse = Math.floor(f / 6) % 2 === 0;
  g.px(cx, cy, pulse ? BOOK_PAL.w : BOOK_PAL.y);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) g.px(cx + dx, cy + dy, pulse ? BOOK_PAL.y : BOOK_PAL.g);
  if (pulse) for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) g.px(cx + dx, cy + dy, BOOK_PAL.g);

  // right page: six lines of runes, written one mark at a time by a gold point
  const LINES = 6, LEN = 13;
  const written = Math.floor(f * 1.3) % (LINES * LEN + 30);
  for (let n = 0; n < Math.min(written, LINES * LEN); n++) {
    const line = Math.floor(n / LEN), i = n % LEN;
    if (hash(i, line, 23) < 0.28 || i >= 9 + hash(line, 1, 23) * 4) continue; // gaps between runes, ragged line ends
    g.px(x + BOOK_W + 3 + i, top + 4 + line * 3 + (hash(i, line, 24) < 0.25 ? -1 : 0), n === written - 1 ? BOOK_PAL.g : INK);
  }
  if (written < LINES * LEN) {
    const line = Math.floor(written / LEN), i = written % LEN;
    g.px(x + BOOK_W + 3 + i, top + 4 + line * 3, BOOK_PAL.y);
  }

  // sparks rising out of the gutter
  for (let k = 0; k < 5; k++) {
    const p = (f * 0.45 + k * 4.3) % 19;
    const sx = x + BOOK_W + Math.round(Math.sin(k * 2.1 + p * 0.35) * (3 + k * 1.8));
    g.px(sx, top + 20 - p, k % 2 ? BOOK_PAL.y : BOOK_PAL.c, 1 - p / 19);
  }
}

const BOOK: Item = {
  // Twice the closed book's width: closed, it sits in the right half, and the
  // cover swings out to the left when it opens.
  id: "book", w: BOOK_W * 2, priority: 99,
  // `active` means it is lying open (you are in the blog); `since` counts
  // frames from the last tap, while the cover swings open.
  draw(g, x, y, f, _P, active = false, _taps, since = 99) {
    const h = BOOK_ROWS.length, top = y - h;
    const opening = since < BOOK_OPENING;
    if (!active && !opening && since > BOOK_OPENING + 10) {
      drawBookDepth(g, x + BOOK_W, top);
      g.sprite(BOOK_ROWS, x + BOOK_W, top, BOOK_PAL);
      // a glint travelling down the gem's left facet
      const t = f % 60;
      if (t < 8) {
        const j = 8 + Math.floor(t / 2) * 2;
        const i = BOOK_ROWS[j]?.indexOf("c") ?? -1;
        if (i >= 0) g.px(x + BOOK_W + i + (j < 12 ? 1 : 0), top + j, BOOK_PAL.w);
      }
      return;
    }
    drawOpenBook(g, x, top, f);
    if (!opening) return;
    // Mid-swing: the left half is not there yet.
    g.ctx.clearRect(x - 1, top - 1, BOOK_W, h + 2);
    g.rect(x + BOOK_W - 1, top, 1, h, BOOK_PAL.k);
    if (since < 2) {
      // the cover still over the right page, turning on its left edge and seen ever narrower
      const width = since === 0 ? 13 : 6;
      BOOK_ROWS.forEach((row, j) => {
        for (let i = 0; i < width; i++) {
          const ch = row[Math.floor((i * row.length) / width)];
          if (ch !== ".") g.px(x + BOOK_W + i, top + j, BOOK_PAL[ch as keyof typeof BOOK_PAL]);
        }
        g.px(x + BOOK_W + width, top + j, BOOK_PAL.k);
      });
    } else {
      // past upright: now it comes down on the left, showing its inside and the first page
      const width = since === 2 ? 7 : 14;
      g.rect(x + BOOK_W - width, top, width, h, BOOK_PAL.k);
      g.rect(x + BOOK_W - width + 1, top + 1, width - 1, h - 2, BOOK_PAL.m);
      g.rect(x + BOOK_W - width + 2, top + 2, width - 3, h - 4, PAGE);
    }
  },
};

/** Every drawable object, by id, for use as a standalone sprite. */
// The voxel versions replace their flat namesakes wherever a toy stands alone.
export const TOYS: Record<string, Item> = { ...Object.fromEntries([...ITEMS, REACTOR, BOOK].map((i) => [i.id, i])), ...VOXEL_TOYS };
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
