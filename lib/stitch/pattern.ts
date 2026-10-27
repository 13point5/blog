import {
  deltaE2000,
  dmcByCode,
  nearestDmc,
  rgbToHex,
  rgbToLab,
  type Lab,
  type RGB,
} from "./color";

export type PaletteEntry = {
  rgb: RGB;
  hex: string;
  lab: Lab;
  code?: string;
  name?: string;
  symbol: string;
};

/** A cross stitch chart: one cell per stitch, -1 means bare fabric. */
export type Pattern = {
  cols: number;
  rows: number;
  cells: Int16Array;
  palette: PaletteEntry[];
};

export type ConvertOptions = {
  width: number;
  colors: number;
  removeBackground: boolean;
  backgroundTolerance: number;
  cleanup: boolean;
  dmc: boolean;
  vibrance: number;
};

export const DEFAULT_CONVERT: ConvertOptions = {
  width: 64,
  colors: 14,
  removeBackground: true,
  backgroundTolerance: 14,
  cleanup: true,
  dmc: true,
  vibrance: 0.15,
};

// Chart symbols, in the order threads are assigned them (most-used first).
const SYMBOLS = [
  "●", "■", "▲", "◆", "★", "♥", "✚", "✖", "○", "□", "△", "◇", "☆", "♡",
  "▼", "▽", "♣", "♠", "♦", "◐", "◑", "A", "B", "C", "D", "E", "F", "H",
  "K", "M", "N", "R", "S", "T", "V", "W", "X", "Z", "2", "3", "4", "7", "8",
];

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sq = (a: Lab, b: Lab) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

function labToApproxRgb(lab: Lab): RGB {
  // Inverse of rgbToLab, used only to show k-means centroids when not snapping to DMC.
  const [L, a, b] = lab;
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const inv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);
  const x = inv(fx) * 0.95047;
  const y = inv(fy);
  const z = inv(fz) * 1.08883;
  const lin = [
    x * 3.2406 + y * -1.5372 + z * -0.4986,
    x * -0.9689 + y * 1.8758 + z * 0.0415,
    x * 0.0557 + y * -0.204 + z * 1.057,
  ];
  return lin.map((c) => {
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(c, 0), 1 / 2.4) - 0.055;
    return Math.round(Math.max(0, Math.min(1, v)) * 255);
  }) as unknown as RGB;
}

function kmeans(points: Lab[], k: number, rng: () => number): Lab[] {
  if (points.length === 0) return [];
  k = Math.min(k, points.length);
  // k-means++ seeding
  const centers: Lab[] = [points[Math.floor(rng() * points.length)]];
  const dist = new Float64Array(points.length).fill(Infinity);
  while (centers.length < k) {
    const last = centers[centers.length - 1];
    let total = 0;
    for (let i = 0; i < points.length; i++) {
      dist[i] = Math.min(dist[i], sq(points[i], last));
      total += dist[i];
    }
    if (total === 0) break;
    let r = rng() * total;
    let idx = 0;
    for (; idx < points.length - 1; idx++) {
      r -= dist[idx];
      if (r <= 0) break;
    }
    centers.push(points[idx]);
  }
  const assign = new Int32Array(points.length);
  for (let iter = 0; iter < 14; iter++) {
    let moved = 0;
    for (let i = 0; i < points.length; i++) {
      let best = 0;
      let bd = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = sq(points[i], centers[c]);
        if (d < bd) {
          bd = d;
          best = c;
        }
      }
      if (assign[i] !== best) moved++;
      assign[i] = best;
    }
    const sums = centers.map(() => [0, 0, 0, 0]);
    for (let i = 0; i < points.length; i++) {
      const s = sums[assign[i]];
      s[0] += points[i][0];
      s[1] += points[i][1];
      s[2] += points[i][2];
      s[3]++;
    }
    for (let c = 0; c < centers.length; c++) {
      const s = sums[c];
      if (s[3]) centers[c] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]];
    }
    if (iter > 0 && moved === 0) break;
  }
  return centers;
}

/** Turns an image into a stitchable chart: downsample, quantize, match threads. */
export function imageToPattern(source: CanvasImageSource & { width: number; height: number }, opts: ConvertOptions): Pattern {
  const cols = Math.max(4, Math.round(opts.width));
  const rows = Math.max(4, Math.round((cols * source.height) / source.width));
  // Supersample each stitch 4x4 and box-average, so every cell sees its whole area.
  const ss = 4;
  const canvas = document.createElement("canvas");
  canvas.width = cols * ss;
  canvas.height = rows * ss;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  const n = cols * rows;
  const labs: Lab[] = new Array(n);
  const alpha = new Float32Array(n);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let R = 0, G = 0, B = 0, A = 0;
      for (let y = 0; y < ss; y++) {
        for (let x = 0; x < ss; x++) {
          const i = ((r * ss + y) * canvas.width + c * ss + x) * 4;
          const a = data[i + 3] / 255;
          R += data[i] * a;
          G += data[i + 1] * a;
          B += data[i + 2] * a;
          A += a;
        }
      }
      const idx = r * cols + c;
      alpha[idx] = A / (ss * ss);
      const rgb: RGB = A > 0 ? [R / A, G / A, B / A] : [255, 255, 255];
      let [L, a, b] = rgbToLab(rgb);
      // Floss reads a little more saturated than a photo; nudge chroma and contrast.
      a *= 1 + opts.vibrance;
      b *= 1 + opts.vibrance;
      L = 50 + (L - 50) * (1 + opts.vibrance * 0.4);
      labs[idx] = [Math.max(0, Math.min(100, L)), a, b];
    }
  }

  const stitched = new Uint8Array(n);
  for (let i = 0; i < n; i++) stitched[i] = alpha[i] >= 0.5 ? 1 : 0;

  if (opts.removeBackground) {
    removeBackground(labs, stitched, cols, rows, opts.backgroundTolerance);
  }

  const fg: Lab[] = [];
  for (let i = 0; i < n; i++) if (stitched[i]) fg.push(labs[i]);

  const rng = mulberry32(1337);
  const centers = kmeans(fg, opts.colors, rng);

  // Build the thread palette from cluster centres.
  let palette: { rgb: RGB; lab: Lab; code?: string; name?: string }[];
  if (opts.dmc) {
    const seen = new Map<string, { rgb: RGB; lab: Lab; code: string; name: string }>();
    for (const c of centers) {
      const t = nearestDmc(c);
      if (!seen.has(t.code)) seen.set(t.code, { rgb: t.rgb, lab: t.lab, code: t.code, name: t.name });
    }
    palette = [...seen.values()];
  } else {
    palette = centers.map((lab) => {
      const rgb = labToApproxRgb(lab);
      return { rgb, lab: rgbToLab(rgb) };
    });
  }

  const cells = new Int16Array(n).fill(-1);
  for (let i = 0; i < n; i++) {
    if (!stitched[i]) continue;
    let best = 0;
    let bd = Infinity;
    for (let p = 0; p < palette.length; p++) {
      const d = opts.dmc ? deltaE2000(labs[i], palette[p].lab) : sq(labs[i], palette[p].lab);
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    cells[i] = best;
  }

  if (opts.cleanup) removeConfetti(cells, cols, rows);

  return finalize(cols, rows, cells, palette);
}

/** Flood fill from the border, clearing cells that match the dominant border colour. */
function removeBackground(labs: Lab[], stitched: Uint8Array, cols: number, rows: number, tol: number) {
  const border: number[] = [];
  for (let c = 0; c < cols; c++) border.push(c, (rows - 1) * cols + c);
  for (let r = 1; r < rows - 1; r++) border.push(r * cols, r * cols + cols - 1);
  const opaque = border.filter((i) => stitched[i]);
  if (opaque.length < border.length * 0.5) return; // already transparent around the edges

  // Find the most common border colour by bucketing in Lab.
  const buckets = new Map<string, number[]>();
  for (const i of opaque) {
    const [L, a, b] = labs[i];
    const key = `${Math.round(L / 6)}|${Math.round(a / 6)}|${Math.round(b / 6)}`;
    const list = buckets.get(key) ?? [];
    list.push(i);
    buckets.set(key, list);
  }
  let top: number[] = [];
  for (const list of buckets.values()) if (list.length > top.length) top = list;
  if (top.length < opaque.length * 0.25) return; // busy edges, probably a full-bleed photo
  const ref: Lab = [0, 1, 2].map((k) => top.reduce((s, i) => s + labs[i][k], 0) / top.length) as unknown as Lab;

  const visited = new Uint8Array(cols * rows);
  const queue: number[] = [];
  for (const i of border) {
    if (!stitched[i] || deltaE2000(labs[i], ref) <= tol) {
      visited[i] = 1;
      queue.push(i);
    }
  }
  while (queue.length) {
    const i = queue.pop()!;
    stitched[i] = 0;
    const r = Math.floor(i / cols);
    const c = i % cols;
    const next = [
      c > 0 ? i - 1 : -1,
      c < cols - 1 ? i + 1 : -1,
      r > 0 ? i - cols : -1,
      r < rows - 1 ? i + cols : -1,
    ];
    for (const j of next) {
      if (j < 0 || visited[j]) continue;
      if (!stitched[j] || deltaE2000(labs[j], ref) <= tol) {
        visited[j] = 1;
        queue.push(j);
      }
    }
  }
}

/** Replaces lone "confetti" stitches with their most common neighbour — stitchers hate them. */
function removeConfetti(cells: Int16Array, cols: number, rows: number) {
  const src = cells.slice();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const v = src[i];
      const counts = new Map<number, number>();
      let same = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const y = r + dy;
          const x = c + dx;
          if (y < 0 || y >= rows || x < 0 || x >= cols) continue;
          const w = src[y * cols + x];
          if (w === v) same++;
          counts.set(w, (counts.get(w) ?? 0) + 1);
        }
      }
      if (same > 0) continue;
      let best = v;
      let bc = 0;
      for (const [w, cnt] of counts) {
        if (cnt > bc) {
          bc = cnt;
          best = w;
        }
      }
      cells[i] = best;
    }
  }
}

/** Drops unused threads, orders by usage and hands out chart symbols. */
function finalize(
  cols: number,
  rows: number,
  cells: Int16Array,
  palette: { rgb: RGB; lab: Lab; code?: string; name?: string }[]
): Pattern {
  const counts = new Array(palette.length).fill(0);
  for (const v of cells) if (v >= 0) counts[v]++;
  const order = palette.map((_, i) => i).filter((i) => counts[i] > 0).sort((a, b) => counts[b] - counts[a]);
  const remap = new Int16Array(palette.length).fill(-1);
  order.forEach((old, i) => (remap[old] = i));
  const out = new Int16Array(cells.length);
  for (let i = 0; i < cells.length; i++) out[i] = cells[i] >= 0 ? remap[cells[i]] : -1;
  return {
    cols,
    rows,
    cells: out,
    palette: order.map((old, i) => ({
      ...palette[old],
      hex: rgbToHex(palette[old].rgb),
      symbol: SYMBOLS[i % SYMBOLS.length],
    })),
  };
}

/** Builds a pattern from a hand-charted grid of characters keyed to DMC codes. */
export function chartToPattern(grid: string[], key: Record<string, string>): Pattern {
  const rows = grid.length;
  const cols = Math.max(...grid.map((l) => l.length));
  const chars = Object.keys(key);
  const palette = chars.map((ch) => {
    const t = dmcByCode(key[ch]);
    return { rgb: t.rgb, lab: t.lab, code: t.code, name: t.name };
  });
  const cells = new Int16Array(cols * rows).fill(-1);
  grid.forEach((line, r) => {
    for (let c = 0; c < line.length; c++) {
      const p = chars.indexOf(line[c]);
      if (p >= 0) cells[r * cols + c] = p;
    }
  });
  return finalize(cols, rows, cells, palette);
}

export function stitchCounts(p: Pattern) {
  const counts = new Array(p.palette.length).fill(0);
  for (const v of p.cells) if (v >= 0) counts[v]++;
  return counts as number[];
}
