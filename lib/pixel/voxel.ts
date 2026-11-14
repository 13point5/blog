import type { Gfx } from "./engine";

// A tiny voxel renderer. Models are grids of unit cubes drawn in an isometric
// view, lit from above: the top of each cube is brightest, the face toward the
// viewer's left is mid-toned and the face toward the right is in shade.

type Faces = [top: string, left: string, right: string];
type Vox = { x: number; y: number; z: number; f: Faces };

const shades = new Map<string, Faces>();
function mul(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
}
function faces(c: string): Faces {
  let f = shades.get(c);
  if (!f) shades.set(c, (f = [mul(c, 1.14), mul(c, 0.86), mul(c, 0.64)]));
  return f;
}
const key = (x: number, y: number, z: number) => (x + 64) | ((y + 64) << 8) | ((z + 64) << 16);

export class Voxels {
  private m = new Map<number, Vox>();
  private order: Vox[] | null = null;
  /** extents along x, y (depth) and z (height) */
  w = 0; d = 0; h = 0;

  /** Place one cube. `glow` cubes ignore the lighting (flames, lamps). */
  set(x: number, y: number, z: number, c: string, glow = false) {
    x = Math.round(x); y = Math.round(y); z = Math.round(z);
    this.m.set(key(x, y, z), { x, y, z, f: glow ? [c, c, c] : faces(c) });
    this.w = Math.max(this.w, x + 1); this.d = Math.max(this.d, y + 1); this.h = Math.max(this.h, z + 1);
    this.order = null;
    return this;
  }
  box(x: number, y: number, z: number, w: number, d: number, h: number, c: string) {
    for (let i = 0; i < w; i++) for (let j = 0; j < d; j++) for (let k = 0; k < h; k++) this.set(x + i, y + j, z + k, c);
    return this;
  }
  /** Repaint one face of an existing cube: 0 = top, 1 = left, 2 = right. */
  face(x: number, y: number, z: number, which: 0 | 1 | 2, c: string) {
    const v = this.m.get(key(x, y, z));
    if (!v) return;
    v.f = [...v.f] as Faces;
    v.f[which] = mul(c, [1.06, 0.9, 0.74][which]);
  }
  has(x: number, y: number, z: number) {
    return this.m.has(key(x, y, z));
  }
  get width() { return (this.w + this.d) * 2; }
  get height() { return this.w + this.d + 2 + (this.h - 1) * 2; }

  /** Screen position of a cube's top-left pixel when the model is drawn at (left, base). */
  at(x: number, y: number, z: number, left: number, base: number): [number, number] {
    return [left + (this.d - 1 + x - y) * 2, base - (this.w + this.d - 2) - 4 + x + y - z * 2];
  }

  /** Draw with the model's left edge at `left` and its lowest pixel on `base`. */
  draw(g: Gfx, left: number, base: number) {
    this.order ??= [...this.m.values()].sort((a, b) => a.x + a.y - b.x - b.y || a.z - b.z);
    for (const v of this.order) {
      const [sx, sy] = this.at(v.x, v.y, v.z, left, base);
      if (!this.has(v.x, v.y, v.z + 1)) g.rect(sx, sy, 4, 2, v.f[0]);
      if (!this.has(v.x, v.y + 1, v.z)) g.rect(sx, sy + 2, 2, 2, v.f[1]);
      if (!this.has(v.x + 1, v.y, v.z)) g.rect(sx + 2, sy + 2, 2, 2, v.f[2]);
    }
  }
}
