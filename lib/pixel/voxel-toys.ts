import { hash } from "./engine";
import { Voxels } from "./voxel";
import { click, fanfare } from "@/lib/audio";
import type { Item } from "./scenes/shelf";

// The small objects scattered around the site, built from voxels so they read
// as little 3D game props rather than flat icons.

const BLACK = "#1d1d1b";

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

// Colours of the four side faces, in the cube's own frame: +x, +y, -x, -y.
const SIDES = ["#2f6fd6", "#c8321f", "#2f9d5a", "#f08a2c"];
const TOP = "#fdfbf7";
const TURN = 7; // frames a quarter turn takes

/**
 * The cube is three layers that each turn about the vertical axis. This gives
 * each layer's quarter-turns (bottom, middle, top) after `n` pokes, and which
 * layer the last poke turned. Every poke turns whichever layer is still out of
 * line; once all three agree the cube is solved, and the next poke scrambles it.
 */
function cubeState(n: number) {
  const o = [0, 3, 1];
  let last = -1;
  for (let i = 0; i < n; i++) {
    last = (o[2] - o[0]) % 4 ? 2 : (o[1] - o[0]) % 4 ? 1 : 2;
    o[last]++;
  }
  return { o, last, solved: (o[1] - o[0]) % 4 === 0 && (o[2] - o[0]) % 4 === 0 };
}

const cube: Item = {
  id: "cube", w: 60, priority: 2,
  sound: (taps) => (cubeState(taps).solved ? fanfare() : click()),
  draw(g, x, y, f, P, _active, taps = 0, since = 99) {
    const { o, last, solved } = cubeState(taps);
    const m = new Voxels();
    for (let layer = 0; layer < 3; layer++) {
      // a layer that was just poked is caught part-way through its quarter turn
      const q = o[layer] - (layer === last && since < TURN ? 1 - since / TURN : 0);
      const a = (q * Math.PI) / 2, ca = Math.cos(a), sa = Math.sin(a);
      const z0 = layer * 4, z1 = layer === 2 ? 10 : z0 + 3;
      for (let tx = 0; tx < 15; tx++) for (let ty = 0; ty < 15; ty++) {
        // which cell of the unturned 11x11 layer ends up here?
        const dx = tx - 7, dy = ty - 7;
        const u = Math.round(ca * dx + sa * dy) + 5, v = Math.round(-sa * dx + ca * dy) + 5;
        if (u < 0 || v < 0 || u > 10 || v > 10) continue;
        for (let z = z0; z <= z1; z++) {
          m.set(tx, ty, z, BLACK);
          if (z % 4 === 3) continue; // the seam between layers
          if (z === 10 && u % 4 !== 3 && v % 4 !== 3) m.face(tx, ty, z, 0, TOP);
          // stickers on the rim, painted on whichever visible faces they now point toward
          const rim: [boolean, number, number][] = [[u === 10 && v % 4 !== 3, 1, 0], [v === 10 && u % 4 !== 3, 0, 1], [u === 0 && v % 4 !== 3, -1, 0], [v === 0 && u % 4 !== 3, 0, -1]];
          rim.forEach(([on, nx, ny], side) => {
            if (!on) return;
            if (ca * nx - sa * ny > 0.38) m.face(tx, ty, z, 2, SIDES[side]);
            if (sa * nx + ca * ny > 0.38) m.face(tx, ty, z, 1, SIDES[side]);
          });
        }
      }
    }
    m.w = m.d = 15; // keep the cube still on the page while a layer swings out
    m.draw(g, x, y);
    if (solved && since >= TURN) {
      const t = Math.floor(f / 2);
      for (let i = 0; i < 6; i++) if (hash(i, t, 9) < 0.6) g.px(x + 6 + hash(i, t, 10) * 48, y - 52 + hash(i, t, 11) * 40, i % 2 ? P.gold : P.accent);
    }
  },
};

export const VOXEL_TOYS: Record<string, Item> = { record, cube };
