import { Voxels } from "./voxel";
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

export const VOXEL_TOYS: Record<string, Item> = { record };
