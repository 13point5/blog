import { deltaE2000, luminance, nearestDmc, rgbToLab, shade, type RGB } from "./color";
import { mulberry32, type Pattern } from "./pattern";

export type FabricId = "ivory" | "white" | "oatmeal" | "sky" | "black";

type Fabric = { label: string; base: RGB; hole: RGB; sheen: number };

export const FABRICS: Record<FabricId, Fabric> = {
  ivory: { label: "Antique ivory", base: [238, 229, 208], hole: [183, 166, 136], sheen: 0.1 },
  white: { label: "White", base: [244, 243, 239], hole: [182, 180, 174], sheen: 0.08 },
  oatmeal: { label: "Oatmeal", base: [214, 199, 171], hole: [150, 131, 102], sheen: 0.08 },
  sky: { label: "Sky", base: [206, 222, 232], hole: [140, 160, 176], sheen: 0.09 },
  black: { label: "Black", base: [46, 46, 50], hole: [14, 14, 16], sheen: 0.16 },
};

export type RenderOptions = {
  fabric: FabricId;
  strands: 1 | 2 | 3;
  backstitch: boolean;
  hoop: boolean;
  /** Pixel size of one stitch (one aida block). */
  cell: number;
  /** Bare fabric around the design, in stitches. */
  margin: number;
};

const rgba = ([r, g, b]: RGB, a = 1) =>
  `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

// Light falls from the upper left, like a window beside the hoop.
const LIGHT = { x: -0.62, y: -0.78 };

/* ------------------------------------------------------------------ */
/* Aida fabric                                                         */
/* ------------------------------------------------------------------ */

/**
 * Aida is a basket weave: bundles of threads run across each row and down each
 * column, crossing in the middle of every block and leaving a hole at every
 * corner. Stitches pass through those holes.
 */
function fabricTile(fabric: Fabric, S: number, blocks: number, seed: number) {
  const size = S * blocks;
  const canvas = makeCanvas(size, size);
  const ctx = canvas.getContext("2d")!;
  const rng = mulberry32(seed);
  const bw = S * 0.74; // bundle width; the remainder is the hole
  const dark = fabric.base[0] < 100;

  ctx.fillStyle = rgba(fabric.hole);
  ctx.fillRect(0, 0, size, size);

  const tone = Array.from({ length: blocks * blocks }, () => (rng() - 0.5) * 0.06);

  const bundle = (horizontal: boolean, lane: number, from: number, to: number, t: number) => {
    // One bundle of ~4 fibres: rounded cross-section plus fine fibre grooves.
    const c = lane * S + S / 2;
    const base = shade(fabric.base, t);
    const g = horizontal
      ? ctx.createLinearGradient(0, c - bw / 2, 0, c + bw / 2)
      : ctx.createLinearGradient(c - bw / 2, 0, c + bw / 2, 0);
    g.addColorStop(0, rgba(shade(base, dark ? -0.22 : -0.1)));
    g.addColorStop(0.3, rgba(shade(base, fabric.sheen)));
    g.addColorStop(0.62, rgba(base));
    g.addColorStop(1, rgba(shade(base, dark ? -0.25 : -0.13)));
    ctx.fillStyle = g;
    if (horizontal) ctx.fillRect(from, c - bw / 2, to - from, bw);
    else ctx.fillRect(c - bw / 2, from, bw, to - from);

    // Faint, slightly wandering grooves between the fibres of the bundle.
    const fibres = 3 + Math.floor(rng() * 2);
    ctx.lineWidth = Math.max(0.5, S * 0.025);
    for (let f = 1; f < fibres; f++) {
      const o = c - bw / 2 + (bw * f) / fibres + (rng() - 0.5) * S * 0.04;
      const wob = (rng() - 0.5) * S * 0.05;
      ctx.strokeStyle = rgba(shade(base, dark ? -0.4 : -0.16), 0.35);
      ctx.beginPath();
      if (horizontal) {
        ctx.moveTo(from, o);
        ctx.quadraticCurveTo((from + to) / 2, o + wob, to, o);
      } else {
        ctx.moveTo(o, from);
        ctx.quadraticCurveTo(o + wob, (from + to) / 2, o, to);
      }
      ctx.stroke();
    }
    // Cotton fuzz: lots of tiny fibre flecks, light and dark.
    const flecks = Math.round(S * 0.5);
    for (let k = 0; k < flecks; k++) {
      const along = from + rng() * (to - from);
      const across = c + (rng() - 0.5) * bw * 0.95;
      const light = rng() < 0.55;
      ctx.fillStyle = rgba(shade(base, light ? 0.25 : -0.18), 0.12 + rng() * 0.18);
      const len = S * (0.04 + rng() * 0.12);
      const th = Math.max(0.5, S * 0.018);
      if (horizontal) ctx.fillRect(along, across, len, th);
      else ctx.fillRect(across, along, th, len);
    }
  };

  const occlude = (horizontal: boolean, lane: number, at: number) => {
    // darken a bundle where it dives under the crossing bundle
    const c = lane * S + S / 2;
    const len = S * 0.18;
    for (const dir of [-1, 1]) {
      const edge = at + (dir * bw) / 2;
      const g = horizontal
        ? ctx.createLinearGradient(edge, 0, edge + dir * len, 0)
        : ctx.createLinearGradient(0, edge, 0, edge + dir * len);
      g.addColorStop(0, `rgba(0,0,0,${dark ? 0.4 : 0.13})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      if (horizontal) ctx.fillRect(Math.min(edge, edge + dir * len), c - bw / 2, len, bw);
      else ctx.fillRect(c - bw / 2, Math.min(edge, edge + dir * len), bw, len);
    }
  };

  // Every bundle segment between holes, then the "over" segment at each crossing.
  for (let j = 0; j < blocks; j++) {
    for (let i = 0; i < blocks; i++) {
      const t = tone[j * blocks + i];
      bundle(true, j, i * S, (i + 1) * S, t);
      bundle(false, i, j * S, (j + 1) * S, t);
    }
  }
  for (let j = 0; j < blocks; j++) {
    for (let i = 0; i < blocks; i++) {
      const t = tone[j * blocks + i];
      const hOver = (i + j) % 2 === 0;
      const cx = i * S + S / 2;
      const cy = j * S + S / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - bw / 2, cy - bw / 2, bw, bw);
      ctx.clip();
      if (hOver) {
        bundle(true, j, i * S, (i + 1) * S, t);
        occlude(false, i, cy);
      } else {
        bundle(false, i, j * S, (j + 1) * S, t);
        occlude(true, j, cx);
      }
      ctx.restore();
    }
  }

  // Soften each hole into a rounded dark well.
  for (let j = 0; j <= blocks; j++) {
    for (let i = 0; i <= blocks; i++) {
      const x = i * S;
      const y = j * S;
      const r = S * 0.2;
      const g = ctx.createRadialGradient(x + S * 0.02, y + S * 0.03, 0, x, y, r);
      g.addColorStop(0, rgba(shade(fabric.hole, -0.45), 0.9));
      g.addColorStop(0.55, rgba(shade(fabric.hole, -0.15), 0.5));
      g.addColorStop(1, rgba(fabric.hole, 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  return canvas;
}

/* ------------------------------------------------------------------ */
/* Floss                                                               */
/* ------------------------------------------------------------------ */

type LegStyle = {
  width: number;
  strands: number;
  rgb: RGB;
  rng: () => number;
  pinch?: number;
};

/** Taper: full width mid-leg, squeezed where the floss dives into the hole. */
const taper = (t: number, pinch: number) => pinch + (1 - pinch) * Math.sqrt(Math.max(0, 1 - Math.abs(t) ** 3));

/** Path of the whole leg band (used for shadows). */
function legOutline(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number, pinch = 0.35) {
  const L = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / L;
  const uy = (y2 - y1) / L;
  const nx = -uy;
  const ny = ux;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const N = 14;
  ctx.beginPath();
  for (let k = 0; k <= N; k++) {
    const t = -1 + (2 * k) / N;
    const hw = (width / 2) * taper(t, pinch);
    const x = mx + ux * t * (L / 2) - nx * hw;
    const y = my + uy * t * (L / 2) - ny * hw;
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let k = N; k >= 0; k--) {
    const t = -1 + (2 * k) / N;
    const hw = (width / 2) * taper(t, pinch);
    ctx.lineTo(mx + ux * t * (L / 2) + nx * hw, my + uy * t * (L / 2) + ny * hw);
  }
  ctx.closePath();
}

/** Soft shadow of a path, without drawing the path itself (shadow-offset trick). */
function castShadow(
  ctx: CanvasRenderingContext2D,
  path: (dx: number) => void,
  blur: number,
  ox: number,
  oy: number,
  alpha: number
) {
  const FAR = 10000;
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${alpha})`;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = FAR + ox;
  ctx.shadowOffsetY = oy;
  ctx.fillStyle = "#000";
  path(-FAR);
  ctx.fill();
  ctx.restore();
}

/**
 * One leg of a stitch: N strands of floss laid side by side. Each strand is a
 * two-ply twist, so it shows slanted ridges with a highlight on each ply, and
 * it darkens where it disappears into the hole.
 */
function drawLeg(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, s: LegStyle) {
  const { rng, rgb } = s;
  const pinch = s.pinch ?? 0.34;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const L = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  const half = L / 2;
  // Which side of the strand faces the light, in the leg's own frame.
  const ly = -Math.sin(ang) * LIGHT.x + Math.cos(ang) * LIGHT.y;
  const litTop = ly < 0;
  const dark = luminance(rgb) < 0.18;

  ctx.save();
  ctx.translate((x1 + x2) / 2, (y1 + y2) / 2);
  ctx.rotate(ang);

  const n = s.strands;
  const sw = s.width / n;
  const order = Array.from({ length: n }, (_, k) => k).sort(() => rng() - 0.5);

  for (const k of order) {
    const off = (k - (n - 1) / 2) * sw * 0.9 + (rng() - 0.5) * sw * 0.12;
    const tilt = (rng() - 0.5) * 0.06;
    const w = sw * (1.02 + (rng() - 0.5) * 0.12);
    const col = shade(rgb, (rng() - 0.5) * 0.07);
    const yAt = (x: number) => (off + tilt * x) * taper(x / half, pinch);
    const hwAt = (x: number) => (w / 2) * taper(x / half, pinch);

    const N = 18;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const x = -half + (L * i) / N;
      const y = yAt(x) - hwAt(x);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let i = N; i >= 0; i--) {
      const x = -half + (L * i) / N;
      ctx.lineTo(x, yAt(x) + hwAt(x));
    }
    ctx.closePath();

    // Rounded body shading across the strand.
    const g = ctx.createLinearGradient(0, off - w / 2, 0, off + w / 2);
    const hi = shade(col, dark ? 0.22 : 0.2);
    const lo = shade(col, dark ? -0.5 : -0.42);
    const stops = litTop
      ? [[0, shade(col, -0.18)], [0.28, hi], [0.55, col], [0.85, shade(col, -0.25)], [1, lo]]
      : [[0, lo], [0.15, shade(col, -0.25)], [0.45, col], [0.72, hi], [1, shade(col, -0.18)]];
    for (const [o, c] of stops as [number, RGB][]) g.addColorStop(o, rgba(c));
    ctx.fillStyle = g;
    ctx.fill();

    ctx.save();
    ctx.clip();

    // Ply twist: slanted grooves and a sheen ridge on each ply.
    const pitch = w * 0.92;
    const slant = w * 0.85;
    const phase = rng() * pitch;
    for (let x = -half - slant + phase; x < half + slant; x += pitch) {
      const yc = yAt(x);
      const hw = hwAt(x) + 1;
      ctx.lineCap = "round";
      ctx.strokeStyle = rgba(shade(col, -0.55), dark ? 0.55 : 0.42);
      ctx.lineWidth = Math.max(0.6, w * 0.13);
      ctx.beginPath();
      ctx.moveTo(x - slant / 2, yc - hw);
      ctx.quadraticCurveTo(x, yc + (rng() - 0.5) * w * 0.1, x + slant / 2, yc + hw);
      ctx.stroke();

      const hx = x + pitch * 0.45;
      const s0 = litTop ? -0.75 : -0.2;
      const s1 = litTop ? 0.2 : 0.75;
      ctx.strokeStyle = rgba(shade(col, dark ? 0.45 : 0.38), dark ? 0.32 : 0.4);
      ctx.lineWidth = Math.max(0.6, w * 0.16);
      ctx.beginPath();
      ctx.moveTo(hx + (slant / 2) * s0, yAt(hx) + hw * s0);
      ctx.lineTo(hx + (slant / 2) * s1, yAt(hx) + hw * s1);
      ctx.stroke();
    }

    // Individual fibres catching the light.
    ctx.lineWidth = Math.max(0.4, w * 0.04);
    for (let f = 0; f < 3; f++) {
      const fy = (rng() - 0.5) * w * 0.7;
      const x0 = -half + rng() * L * 0.5;
      ctx.strokeStyle = rgba(shade(col, rng() < 0.5 ? 0.35 : -0.35), 0.18);
      ctx.beginPath();
      ctx.moveTo(x0, yAt(x0) + fy * taper(x0 / half, pinch));
      ctx.lineTo(x0 + L * 0.4, yAt(x0 + L * 0.4) + fy * taper((x0 + L * 0.4) / half, pinch));
      ctx.stroke();
    }

    // The floss darkens as it dives down into each hole.
    for (const ex of [-half, half]) {
      const r = half * 0.5;
      const og = ctx.createRadialGradient(ex, yAt(ex), 0, ex, yAt(ex), r);
      og.addColorStop(0, "rgba(0,0,0,0.5)");
      og.addColorStop(0.5, "rgba(0,0,0,0.16)");
      og.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = og;
      ctx.fillRect(ex - r, yAt(ex) - r, r * 2, r * 2);
    }
    ctx.restore();

    // A couple of stray fibres for that slightly fuzzy cotton edge.
    ctx.lineWidth = Math.max(0.35, w * 0.035);
    ctx.strokeStyle = rgba(shade(col, 0.1), 0.35);
    for (let f = 0; f < 2; f++) {
      const x0 = (rng() - 0.5) * L * 0.6;
      const side = rng() < 0.5 ? -1 : 1;
      const y0 = yAt(x0) + side * hwAt(x0) * 0.9;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0 + w * 0.3, y0 + side * w * 0.35, x0 + w * (0.4 + rng() * 0.5), y0 + side * w * 0.2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

const LEG_WIDTH = { 1: 0.27, 2: 0.45, 3: 0.57 } as const;

type Sprite = { canvas: HTMLCanvasElement; pad: number };

/** Pre-renders a few hand-made-looking variants of a full cross for a colour. */
function crossSprites(rgb: RGB, S: number, strands: 1 | 2 | 3, variants: number, seed: number): Sprite[] {
  const pad = Math.ceil(S * 0.3);
  const size = S + pad * 2;
  const W = S * LEG_WIDTH[strands];
  const out: Sprite[] = [];
  for (let v = 0; v < variants; v++) {
    const rng = mulberry32(seed * 97 + v * 7919);
    const canvas = makeCanvas(size, size);
    const ctx = canvas.getContext("2d")!;
    const j = () => (rng() - 0.5) * S * 0.05;
    const a = pad;
    const b = pad + S;
    // Bottom leg "/" first, then every top leg "\" lies the same way — the mark of tidy stitching.
    const bottom = [a + j(), b + j(), b + j(), a + j()] as const;
    const top = [a + j(), a + j(), b + j(), b + j()] as const;
    const wB = W * (1 + (rng() - 0.5) * 0.08);
    const wT = W * (1 + (rng() - 0.5) * 0.08);
    drawLeg(ctx, ...bottom, { width: wB, strands, rgb, rng });
    castShadow(ctx, (dx) => legOutline(ctx, top[0] + dx, top[1], top[2] + dx, top[3], wT), S * 0.09, S * 0.03, S * 0.06, 0.5);
    drawLeg(ctx, ...top, { width: wT, strands, rgb, rng });
    out.push({ canvas, pad });
  }
  return out;
}

function shadowSprite(S: number, strands: 1 | 2 | 3): Sprite {
  const pad = Math.ceil(S * 0.45);
  const canvas = makeCanvas(S + pad * 2, S + pad * 2);
  const ctx = canvas.getContext("2d")!;
  const W = S * LEG_WIDTH[strands];
  const a = pad;
  const b = pad + S;
  for (const [x1, y1, x2, y2] of [
    [a, b, b, a],
    [a, a, b, b],
  ]) {
    castShadow(ctx, (dx) => legOutline(ctx, x1 + dx, y1, x2 + dx, y2, W * 1.05), S * 0.14, S * 0.05, S * 0.09, 0.55);
  }
  return { canvas, pad };
}

/* ------------------------------------------------------------------ */
/* Backstitch                                                          */
/* ------------------------------------------------------------------ */

type Edge = { x1: number; y1: number; x2: number; y2: number };

/** Outline edges: around the design's silhouette and between strongly contrasting threads. */
export function outlineEdges(p: Pattern): Edge[] {
  const edges: Edge[] = [];
  const at = (c: number, r: number) =>
    c < 0 || r < 0 || c >= p.cols || r >= p.rows ? -1 : p.cells[r * p.cols + c];
  const differs = (a: number, b: number) => {
    if (a === b) return false;
    if (a < 0 || b < 0) return true;
    const A = p.palette[a];
    const B = p.palette[b];
    if (luminance(A.rgb) < 0.2 && luminance(B.rgb) < 0.2) return false;
    return deltaE2000(A.lab, B.lab) > 32;
  };
  for (let r = 0; r <= p.rows; r++) {
    for (let c = 0; c <= p.cols; c++) {
      const self = at(c, r);
      // vertical edge on the left of (c, r)
      if (r < p.rows && (self >= 0 || at(c - 1, r) >= 0) && differs(self, at(c - 1, r)))
        edges.push({ x1: c, y1: r, x2: c, y2: r + 1 });
      // horizontal edge on top of (c, r)
      if (c < p.cols && (self >= 0 || at(c, r - 1) >= 0) && differs(self, at(c, r - 1)))
        edges.push({ x1: c, y1: r, x2: c + 1, y2: r });
    }
  }
  return edges;
}

/** Outline thread: a deep shade of the darkest colour in the design. */
export function outlineThread(p: Pattern) {
  let darkest = p.palette[0]?.rgb ?? ([60, 60, 60] as RGB);
  for (const e of p.palette) if (luminance(e.rgb) < luminance(darkest)) darkest = e.rgb;
  return nearestDmc(rgbToLab(shade(darkest, -0.55)));
}

/* ------------------------------------------------------------------ */
/* Hoop                                                                */
/* ------------------------------------------------------------------ */

function drawHoop(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, S: number) {
  const ring = Math.max(S * 0.9, Math.min(rx, ry) * 0.055);
  const wood: RGB = [214, 172, 116];

  // ring shadow onto the fabric
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  // blurred via the shadow-offset trick (canvas filters are missing in Safari)
  const FAR = 10000;
  ctx.lineWidth = ring * 0.9;
  ctx.strokeStyle = "#000";
  ctx.shadowColor = "rgba(0,0,0,0.3)";
  ctx.shadowBlur = ring * 0.7;
  ctx.shadowOffsetX = FAR + ring * 0.12;
  ctx.shadowOffsetY = ring * 0.22;
  ctx.beginPath();
  ctx.ellipse(cx - FAR, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Outer ring: a band of light birch with grain.
  const outerRx = rx + ring;
  const outerRy = ry + ring;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, outerRx, outerRy, 0, 0, Math.PI * 2);
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2, true);
  ctx.closePath();
  const g = ctx.createLinearGradient(cx - outerRx, cy - outerRy, cx + outerRx, cy + outerRy);
  g.addColorStop(0, rgba(shade(wood, 0.25)));
  g.addColorStop(0.5, rgba(wood));
  g.addColorStop(1, rgba(shade(wood, -0.28)));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip("evenodd");

  const rng = mulberry32(42);
  for (let i = 0; i < 26; i++) {
    const t = rng();
    ctx.strokeStyle = rgba(shade(wood, -0.2 - rng() * 0.2), 0.25 + rng() * 0.25);
    ctx.lineWidth = Math.max(0.6, ring * (0.02 + rng() * 0.04));
    ctx.beginPath();
    const start = rng() * Math.PI * 2;
    ctx.ellipse(cx, cy, rx + ring * t, ry + ring * t, 0, start, start + 0.6 + rng() * 2.2);
    ctx.stroke();
  }
  // rounded edge: highlight on the inner lip, shade on the outer lip
  ctx.lineWidth = ring * 0.22;
  ctx.strokeStyle = "rgba(255,248,235,0.35)";
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + ring * 0.12, ry + ring * 0.12, 0, Math.PI * 0.9, Math.PI * 1.75);
  ctx.stroke();
  ctx.strokeStyle = "rgba(60,35,10,0.3)";
  ctx.beginPath();
  ctx.ellipse(cx, cy, outerRx - ring * 0.1, outerRy - ring * 0.1, 0, -Math.PI * 0.1, Math.PI * 0.8);
  ctx.stroke();
  ctx.restore();

  ctx.lineWidth = Math.max(1, ring * 0.05);
  ctx.strokeStyle = rgba(shade(wood, -0.45), 0.7);
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Brass tension screw at the top.
  const tabW = ring * 1.5;
  const tabH = ring * 1.6;
  const top = cy - outerRy;
  for (const side of [-1, 1]) {
    const x = cx + side * tabW * 0.55 - tabW / 2;
    const tg = ctx.createLinearGradient(x, 0, x + tabW, 0);
    tg.addColorStop(0, rgba(shade(wood, 0.15)));
    tg.addColorStop(1, rgba(shade(wood, -0.25)));
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.roundRect(x + tabW * 0.12, top - tabH + ring * 0.4, tabW * 0.76, tabH, ring * 0.25);
    ctx.fill();
    ctx.strokeStyle = rgba(shade(wood, -0.45), 0.6);
    ctx.lineWidth = Math.max(1, ring * 0.05);
    ctx.stroke();
  }
  const sy = top - tabH * 0.45;
  const bg = ctx.createLinearGradient(0, sy - ring * 0.35, 0, sy + ring * 0.35);
  bg.addColorStop(0, "#f5df9a");
  bg.addColorStop(0.45, "#c9a14a");
  bg.addColorStop(1, "#7a5b1c");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(cx - tabW * 1.25, sy - ring * 0.18, tabW * 2.5, ring * 0.36, ring * 0.1);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + tabW * 1.3, sy, ring * 0.22, ring * 0.42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(70,50,10,0.6)";
  ctx.lineWidth = Math.max(1, ring * 0.05);
  ctx.stroke();
}

/* ------------------------------------------------------------------ */
/* Composite                                                           */
/* ------------------------------------------------------------------ */

export type Layout = { width: number; height: number; ox: number; oy: number };

export function layoutFor(p: Pattern, o: RenderOptions): Layout {
  const S = o.cell;
  const w = (p.cols + o.margin * 2) * S;
  const h = (p.rows + o.margin * 2) * S;
  if (!o.hoop) return { width: w, height: h, ox: o.margin * S, oy: o.margin * S };
  const { rx, ry, ring } = hoopSize(p, o);
  const width = (rx + ring * 1.3) * 2;
  const height = (ry + ring * 1.3) * 2 + ring * 2.2;
  return {
    width,
    height,
    ox: Math.round(width / 2 - (p.cols * S) / 2),
    oy: Math.round(height / 2 + ring * 1.1 - (p.rows * S) / 2),
  };
}

function hoopSize(p: Pattern, o: RenderOptions) {
  const S = o.cell;
  const w = p.cols * S;
  const h = p.rows * S;
  const m = S * 2.5;
  let rx = (w / 2) * Math.SQRT2 + m;
  let ry = (h / 2) * Math.SQRT2 + m;
  // Close to square? Use a round hoop; otherwise an oval one.
  if (Math.max(rx, ry) / Math.min(rx, ry) < 1.2) rx = ry = Math.max(rx, ry);
  const ring = Math.max(S * 0.9, Math.min(rx, ry) * 0.055);
  return { rx, ry, ring };
}

export function renderStitched(canvas: HTMLCanvasElement, p: Pattern, o: RenderOptions) {
  const S = o.cell;
  const fabric = FABRICS[o.fabric];
  const lay = layoutFor(p, o);
  canvas.width = Math.ceil(lay.width);
  canvas.height = Math.ceil(lay.height);
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const hoop = o.hoop ? hoopSize(p, o) : null;
  const cx = lay.ox + (p.cols * S) / 2;
  const cy = lay.oy + (p.rows * S) / 2;

  ctx.save();
  if (hoop) {
    // soft shadow of the whole hoop on the table
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = hoop.ring * 1.2;
    ctx.shadowOffsetY = hoop.ring * 0.35;
    ctx.fillStyle = rgba(fabric.base);
    ctx.beginPath();
    ctx.ellipse(cx, cy, hoop.rx + hoop.ring, hoop.ry + hoop.ring, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.beginPath();
    ctx.ellipse(cx, cy, hoop.rx, hoop.ry, 0, 0, Math.PI * 2);
    ctx.clip();
  }

  // Fabric, aligned so holes fall exactly on the stitch grid.
  const tile = fabricTile(fabric, S, 12, 7);
  const pat = ctx.createPattern(tile, "repeat")!;
  pat.setTransform(new DOMMatrix().translate(lay.ox % (S * 12), lay.oy % (S * 12)));
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Shadows first so no stitch shades its neighbour.
  const shadow = shadowSprite(S, o.strands);
  ctx.globalAlpha = fabric.base[0] < 100 ? 0.9 : 0.75;
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      if (p.cells[r * p.cols + c] < 0) continue;
      ctx.drawImage(shadow.canvas, lay.ox + c * S - shadow.pad, lay.oy + r * S - shadow.pad);
    }
  }
  ctx.globalAlpha = 1;

  const VARIANTS = 6;
  const sprites = p.palette.map((e, i) => crossSprites(e.rgb, S, o.strands, VARIANTS, i + 1));
  const hash = (c: number, r: number) => ((c * 73856093) ^ (r * 19349663)) >>> 0;
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      const v = p.cells[r * p.cols + c];
      if (v < 0) continue;
      const s = sprites[v][hash(c, r) % VARIANTS];
      ctx.drawImage(s.canvas, lay.ox + c * S - s.pad, lay.oy + r * S - s.pad);
    }
  }

  if (o.backstitch) {
    const thread = outlineThread(p);
    const rng = mulberry32(99);
    const W = S * (o.strands === 3 ? 0.2 : 0.16);
    const edges = outlineEdges(p);
    for (const e of edges) {
      const x1 = lay.ox + e.x1 * S;
      const y1 = lay.oy + e.y1 * S;
      const x2 = lay.ox + e.x2 * S;
      const y2 = lay.oy + e.y2 * S;
      castShadow(ctx, (dx) => legOutline(ctx, x1 + dx, y1, x2 + dx, y2, W, 0.6), S * 0.06, S * 0.025, S * 0.045, 0.45);
    }
    for (const e of edges) {
      const j = () => (rng() - 0.5) * S * 0.03;
      drawLeg(
        ctx,
        lay.ox + e.x1 * S + j(),
        lay.oy + e.y1 * S + j(),
        lay.ox + e.x2 * S + j(),
        lay.oy + e.y2 * S + j(),
        { width: W, strands: 1, rgb: thread.rgb, rng, pinch: 0.6 }
      );
    }
  }

  // Gentle, uneven room light so it reads as a photo of real cloth.
  const diag = Math.hypot(canvas.width, canvas.height);
  const light = ctx.createRadialGradient(canvas.width * 0.25, canvas.height * 0.18, 0, canvas.width * 0.25, canvas.height * 0.18, diag * 0.9);
  light.addColorStop(0, "rgba(255,250,240,0.07)");
  light.addColorStop(0.6, "rgba(0,0,0,0)");
  light.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  if (hoop) drawHoop(ctx, cx, cy, hoop.rx, hoop.ry, S);
}

/* ------------------------------------------------------------------ */
/* Chart                                                               */
/* ------------------------------------------------------------------ */

// Charts are always printed-paper white, whatever the site theme.
export function renderChart(canvas: HTMLCanvasElement, p: Pattern, C: number) {
  const gutter = C * 2.2;
  canvas.width = Math.ceil(p.cols * C + gutter * 2);
  canvas.height = Math.ceil(p.rows * C + gutter * 2);
  const ctx = canvas.getContext("2d")!;
  const ink = "#1d1d1d";
  const paper = "#ffffff";
  const minor = "rgba(0,0,0,0.16)";
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${Math.round(C * 0.72)}px ui-sans-serif, system-ui, "Segoe UI Symbol", "Apple Symbols", sans-serif`;
  for (let r = 0; r < p.rows; r++) {
    for (let c = 0; c < p.cols; c++) {
      const v = p.cells[r * p.cols + c];
      if (v < 0) continue;
      const e = p.palette[v];
      const x = gutter + c * C;
      const y = gutter + r * C;
      ctx.fillStyle = e.hex;
      ctx.fillRect(x, y, C, C);
      ctx.fillStyle = luminance(e.rgb) > 0.55 ? "rgba(0,0,0,0.78)" : "rgba(255,255,255,0.88)";
      ctx.fillText(e.symbol, x + C / 2, y + C / 2 + C * 0.04);
    }
  }

  // Grid: fine lines every stitch, bold every ten, like a printed chart.
  for (let c = 0; c <= p.cols; c++) {
    const x = Math.round(gutter + c * C) + 0.5;
    const bold = c % 10 === 0;
    ctx.strokeStyle = bold ? ink : minor;
    ctx.lineWidth = bold ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(x, gutter);
    ctx.lineTo(x, gutter + p.rows * C);
    ctx.stroke();
  }
  for (let r = 0; r <= p.rows; r++) {
    const y = Math.round(gutter + r * C) + 0.5;
    const bold = r % 10 === 0;
    ctx.strokeStyle = bold ? ink : minor;
    ctx.lineWidth = bold ? 1.5 : 1;
    ctx.beginPath();
    ctx.moveTo(gutter, y);
    ctx.lineTo(gutter + p.cols * C, y);
    ctx.stroke();
  }
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2;
  ctx.strokeRect(gutter, gutter, p.cols * C, p.rows * C);

  // Row / column numbers and centre arrows.
  ctx.fillStyle = ink;
  ctx.font = `${Math.round(C * 0.6)}px ui-sans-serif, system-ui, sans-serif`;
  for (let c = 10; c <= p.cols; c += 10) ctx.fillText(String(c), gutter + c * C, gutter - C * 0.7);
  for (let r = 10; r <= p.rows; r += 10) ctx.fillText(String(r), gutter - C * 0.9, gutter + r * C);
  const tri = (x: number, y: number, dir: "down" | "right" | "up" | "left") => {
    const s = C * 0.45;
    // the two back corners of an arrow pointing at (x, y)
    const back = {
      down: [-s, -s, s, -s],
      up: [-s, s, s, s],
      right: [-s, -s, -s, s],
      left: [s, -s, s, s],
    }[dir];
    ctx.beginPath();
    ctx.moveTo(x + back[0], y + back[1]);
    ctx.lineTo(x + back[2], y + back[3]);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.fill();
  };
  const mx = gutter + (p.cols * C) / 2;
  const my = gutter + (p.rows * C) / 2;
  ctx.fillStyle = "#c2410c";
  tri(mx, gutter - 2, "down");
  tri(mx, gutter + p.rows * C + 2, "up");
  tri(gutter - 2, my, "right");
  tri(gutter + p.cols * C + 2, my, "left");
}

/** Threads needed: ~1 skein of 2-strand floss per ~1,800 full crosses on 14-count. */
export function skeinsFor(count: number, strands: number, fabricCount: number) {
  const cm = 2.54 / fabricCount;
  const perStitch = (2 * Math.SQRT2 + 2) * cm * 1.5; // two legs + travel on the back + waste
  const skeinCm = 800 * Math.floor(6 / strands);
  return (count * perStitch) / skeinCm;
}
