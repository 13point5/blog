import { CUBE_PX, MID, N, castBox, side, sight, type CubeState, type Move, type Vec } from "./cube-model";

// Drawing the cube. Voxels are no good for this: a layer caught part-way
// through a turn is at an angle, and cubes on a grid can only fake an angle
// with steps. So every pixel is worked out on its own instead: follow the
// line of sight through it, see which part of the cube it meets first (the
// turning layer is a box at an angle; the rest is one or two boxes standing
// still), and colour it by what is at that spot.

const BLACK = "#1d1d1b";
/** how brightly a face is lit, by the axis it faces along: right (+x) in shade, left (+y) mid, top brightest */
const LIGHT = [0.74, 0.9, 1.06];
const SEE: Vec = [1, 1, 1];

const rgbs = new Map<string, Vec>();
function rgb(hex: string): Vec {
  let c = rgbs.get(hex);
  if (!c) {
    const n = parseInt(hex.slice(1), 16);
    rgbs.set(hex, (c = [(n >> 16) & 255, (n >> 8) & 255, n & 255]));
  }
  return c;
}

type Box = { lo: Vec; hi: Vec; turning: boolean };

export function drawCube(ctx: CanvasRenderingContext2D, cube: CubeState, anim: { m: Move; t: number } | null) {
  const at = new Map<number, (string | null)[]>();
  for (const p of cube) at.set(p.p[0] + 1 + 3 * (p.p[1] + 1) + 9 * (p.p[2] + 1), p.st);

  // the boxes: the whole cube, or the turning layer and what is left either side of it
  const boxes: Box[] = [];
  let axis = 0, u = 1, w = 2, ca = 1, sa = 0;
  if (!anim) boxes.push({ lo: [0, 0, 0], hi: [N, N, N], turning: false });
  else {
    axis = anim.m.axis; u = (axis + 1) % 3; w = (axis + 2) % 3;
    const th = (anim.t * anim.m.dir * Math.PI) / 2;
    ca = Math.cos(th); sa = Math.sin(th);
    const from = (anim.m.layer + 1) * 4, to = from + 3;
    const slab = (a: number, b: number, turning: boolean) => {
      const lo: Vec = [0, 0, 0], hi: Vec = [N, N, N];
      lo[axis] = a; hi[axis] = b;
      boxes.push({ lo, hi, turning });
    };
    slab(from, to, true);
    if (from > 0) slab(0, from, false);
    if (to < N) slab(to, N, false);
  }
  /** into the turning layer's own frame: turned back about the cube's middle */
  const back = (v: Vec, centre: number): Vec => {
    const r: Vec = [v[0], v[1], v[2]];
    const a = v[u] - centre, b = v[w] - centre;
    r[u] = ca * a + sa * b + centre;
    r[w] = -sa * a + ca * b + centre;
    return r;
  };
  const seeTurned = back(SEE, 0);

  const img = ctx.createImageData(CUBE_PX, CUBE_PX);
  for (let py = 0; py < CUBE_PX; py++) for (let px = 0; px < CUBE_PX; px++) {
    const o = sight(px + 0.5, py + 0.5);
    let best: { t: number; axis: number; sign: number; box: Box; o: Vec; d: Vec } | null = null;
    for (const box of boxes) {
      const bo = box.turning ? back(o, MID) : o, bd = box.turning ? seeTurned : SEE;
      const h = castBox(bo, bd, box.lo, box.hi);
      if (h && (!best || h.t > best.t)) best = { ...h, box, o: bo, d: bd };
    }
    if (!best) continue;
    const { box } = best;
    // which piece, and is this a sticker, a seam, or the cube's black inside?
    let colour = BLACK;
    const outside = best.sign > 0 ? box.hi[best.axis] === N : box.lo[best.axis] === 0;
    if (outside) {
      const c: Vec = [0, 0, 0];
      let seam = false;
      for (let k = 0; k < 3; k++) {
        if (k === best.axis) { c[k] = best.sign; continue; }
        const v = Math.max(0, Math.min(N - 1e-6, best.o[k] + best.t * best.d[k]));
        const i = Math.floor(v / 4);
        if (v - i * 4 > 3 + 1e-6) seam = true;
        c[k] = i - 1;
      }
      if (!seam) colour = at.get(c[0] + 1 + 3 * (c[1] + 1) + 9 * (c[2] + 1))?.[side(best.axis, best.sign)] ?? BLACK;
    }
    // lit by which way the face really points, so a face part-way round is part-way between two shades
    const n: Vec = [0, 0, 0];
    n[best.axis] = best.sign;
    if (box.turning) {
      const a = n[u], b = n[w];
      n[u] = ca * a - sa * b;
      n[w] = sa * a + ca * b;
    }
    let light = 0, sum = 0;
    for (let k = 0; k < 3; k++) if (n[k] > 0) { light += n[k] * n[k] * LIGHT[k]; sum += n[k] * n[k]; }
    light = sum ? light / sum : LIGHT[0];
    const [r, g, b] = rgb(colour), i = (py * CUBE_PX + px) * 4;
    img.data[i] = Math.min(255, r * light);
    img.data[i + 1] = Math.min(255, g * light);
    img.data[i + 2] = Math.min(255, b * light);
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
