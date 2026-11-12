import { hash } from "./engine";
import { Voxels } from "./voxel";
import { click, driveSeek, fanfare } from "@/lib/audio";
import type { Item } from "./scenes/shelf";

// The small objects scattered around the site, built from voxels so they read
// as little 3D game props rather than flat icons.

const BLACK = "#1d1d1b";
const STICKERS = ["#fdfbf7", "#f2c14e", "#c8321f", "#f08a2c", "#2f6fd6", "#2f9d5a"];

const record: Item = {
  // a turntable: wooden plinth, pale deck, a spinning record and a tonearm
  id: "record", w: 44, priority: 1,
  draw(g, x, y, f, P, active = true) {
    const m = new Voxels();
    m.box(0, 0, 0, 12, 10, 2, P.wood).box(0, 0, 2, 12, 10, 1, "#d8d1c2");
    for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) {
      const r = Math.hypot(i - 4.5, j - 4.5);
      if (r < 4.9) m.set(i, j, 3, r < 1.6 ? P.accent : r > 2.6 && r < 3.6 ? "#33312d" : BLACK);
    }
    m.set(4, 4, 4, "#d8d1c2");
    // a glint that travels round the record as it turns
    const a = active ? f * 0.45 : 0.7;
    m.set(4.5 + Math.cos(a) * 3.6, 4.5 + Math.sin(a) * 3.6, 3, "#77746b");
    m.set(4.5 - Math.cos(a) * 3.6, 4.5 - Math.sin(a) * 3.6, 3, "#55534c");
    // tonearm: on the record when playing, parked along the edge when not
    m.box(10, 0, 3, 2, 2, 2, "#8c877b");
    const arm: [number, number][] = active ? [[10, 2], [9, 3], [8, 4], [7, 4]] : [[11, 2], [11, 3], [11, 4], [11, 5]];
    arm.forEach(([ax, ay], i) => m.set(ax, ay, 4, i === arm.length - 1 ? BLACK : "#b5b0a3"));
    // controls on the front
    m.face(11, 8, 1, 2, P.gold);
    m.face(11, 6, 1, 2, active ? "#ff5a36" : P.woodLo);
    m.draw(g, x, y);
    if (!active) return;
    for (let i = 0; i < 3; i++) {
      const p = (f * 0.3 + i * 4) % 12;
      const nx = x + 8 + i * 11 + Math.round(Math.sin(p * 0.6 + i) * 1.5), ny = y - 35 - p;
      const al = 1 - p / 12;
      g.rect(nx + 2, ny, 1, 5, P.ink, al);
      g.rect(nx, ny + 4, 3, 2, P.ink, al);
      g.rect(nx + 3, ny, 1, 2, P.ink, al);
    }
  },
};

const cube: Item = {
  // a puzzle cube: 3x3 stickers on each visible face. Each poke turns a layer;
  // six pokes solve it, the seventh scrambles it again.
  id: "cube", w: 44, priority: 2,
  sound: (taps) => (taps % 7 === 6 ? fanfare() : click()),
  draw(g, x, y, f, P, _active, taps = 0) {
    const epoch = Math.floor(taps / 7), level = taps % 7;
    const sticker = (face: number, i: number) => {
      const k = face * 9 + i;
      return hash(k, epoch, 61) < level / 6 ? STICKERS[(face * 2 + epoch) % 6] : STICKERS[Math.floor(hash(k, epoch * 31 + 7, 62) * 6)];
    };
    // 11 cubes a side: three stickers of three, with a one-cube gap between them
    const S = 11, L = S - 1;
    const m = new Voxels().box(0, 0, 0, S, S, S, BLACK);
    for (let a = 0; a < 3; a++) for (let b = 0; b < 3; b++) for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const u = a * 4 + i, v = b * 4 + j;
      m.face(u, v, L, 0, sticker(1, b * 3 + a)); // top
      m.face(u, L, L - v, 1, sticker(0, b * 3 + a)); // left
      m.face(L, L - u, L - v, 2, sticker(2, b * 3 + a)); // right
    }
    m.draw(g, x, y);
    if (level === 6) {
      const t = Math.floor(f / 2);
      for (let i = 0; i < 6; i++) if (hash(i, t, 9) < 0.6) g.px(x - 2 + hash(i, t, 10) * 48, y - 48 + hash(i, t, 11) * 40, i % 2 ? P.gold : P.accent);
    }
  },
};

const floppy: Item = {
  // two floppy disks, one lying across the other
  id: "floppy", w: 34, priority: 5.5,
  sound: driveSeek,
  draw(g, x, y, _f, P) {
    const m = new Voxels().box(2, 0, 0, 7, 7, 1, P.accent).box(0, 1, 1, 7, 7, 1, P.blue);
    for (let i = 2; i <= 4; i++) for (let j = 1; j <= 2; j++) m.face(i, j, 1, 0, "#d8d1c2"); // metal shutter
    m.face(3, 1, 1, 0, BLACK);
    for (let i = 1; i <= 5; i++) for (let j = 5; j <= 7; j++) m.face(i, j, 1, 0, j === 6 && i > 1 && i < 5 ? "#8c877b" : "#fdfbf7"); // label
    for (let j = 0; j <= 1; j++) m.face(8, j, 0, 0, "#d8d1c2");
    m.draw(g, x, y);
  },
};

const book: Item = {
  // a thick closed book: the way to the blog
  id: "book", w: 24, priority: 99,
  draw(g, x, y, _f, P) {
    const m = new Voxels().box(0, 0, 0, 5, 7, 1, P.blue).box(0, 0, 1, 5, 7, 2, "#f3ead6").box(0, 0, 3, 5, 7, 1, P.blue);
    for (let j = 0; j < 7; j++) m.face(4, j, 1, 2, "#d9ceb4"); // page edges, alternating
    for (let i = 1; i <= 3; i++) m.face(i, 3, 3, 0, P.gold); // a gilt band on the cover
    m.face(2, 2, 3, 0, P.gold); m.face(2, 4, 3, 0, P.gold);
    for (let k = 1; k <= 2; k++) m.face(1, 6, k, 1, P.accent); // ribbon
    m.draw(g, x, y);
  },
};

export const VOXEL_TOYS: Record<string, Item> = { record, cube, floppy, book };
