import type { ReactNode, SVGProps } from "react";

/*
 * Drawing primitives in the style of the film's Marauder's Map: walls are
 * thick bands lettered with tiny handwriting, spiral stairs are spoked wheels,
 * towers are rings of capitals and step-ticks, labels mix Roman capitals with
 * italic script.
 */

export type Pt = [number, number];

export const SCRAWL = "audere est experiri omnibus discentibus bonum ";
export const CAPS = "AVDERE EST EXPERIRI · OMNIBVS DISCENTIBVS BONVM · ";

// Repeat `text` until it covers a path of `len` units at roughly `charW` per glyph.
export function cover(text: string, len: number, charW: number) {
  return text.repeat(Math.ceil(len / charW / text.length) + 1);
}

// Small deterministic PRNG so the foxing spots are the same on every render.
export function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const polar = (cx: number, cy: number, r: number, deg: number): Pt => [
  cx + r * Math.cos((deg * Math.PI) / 180),
  cy + r * Math.sin((deg * Math.PI) / 180),
];

export function arcPath(cx: number, cy: number, r: number, a1: number, a2: number) {
  const [x1, y1] = polar(cx, cy, r, a1);
  const [x2, y2] = polar(cx, cy, r, a2);
  const large = Math.abs(a2 - a1) > 180 ? 1 : 0;
  const sweep = a2 > a1 ? 1 : 0;
  return `M${x1} ${y1}A${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`;
}

// Clockwise from 9 o'clock, so lettering reads upright across the top.
export function circlePath(cx: number, cy: number, r: number) {
  return `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}`;
}

export type Door = { side: "t" | "r" | "b" | "l"; at: number; w?: number };

// Rectangle outline (clockwise) with gaps where doors are.
export function roomPath(x: number, y: number, w: number, h: number, doors: Door[] = []) {
  const sides = {
    t: { len: w, pt: (s: number): Pt => [x + s, y], param: (a: number) => a - x },
    r: { len: h, pt: (s: number): Pt => [x + w, y + s], param: (a: number) => a - y },
    b: { len: w, pt: (s: number): Pt => [x + w - s, y + h], param: (a: number) => x + w - a },
    l: { len: h, pt: (s: number): Pt => [x, y + h - s], param: (a: number) => y + h - a },
  };
  let path = "";
  (Object.keys(sides) as Door["side"][]).forEach((key) => {
    const side = sides[key];
    const gaps = doors
      .filter((door) => door.side === key)
      .map((door) => {
        const c = side.param(door.at);
        const half = (door.w ?? 22) / 2;
        return [c - half, c + half] as const;
      })
      .sort((a, b) => a[0] - b[0]);
    let start = 0;
    for (const [g0, g1] of [...gaps, [side.len, side.len] as const]) {
      if (g0 > start) {
        const [ax, ay] = side.pt(start);
        const [bx, by] = side.pt(g0);
        path += `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`;
      }
      start = g1;
    }
  });
  return path;
}

/* ---------- lettering ---------- */

function Micro({ id, d, len, caps, size }: { id: string; d: string; len: number; caps?: boolean; size?: number }) {
  return (
    <>
      <path id={id} d={d} fill="none" />
      <text
        className={caps ? "mm-micro mm-micro-caps" : "mm-micro mm-scrawl"}
        fontSize={size ?? (caps ? 8.5 : 11)}
        dominantBaseline="central"
      >
        <textPath href={`#${id}`}>{cover(caps ? CAPS : SCRAWL, len, caps ? 6.4 : 3.2)}</textPath>
      </text>
    </>
  );
}

// A multi-line label. Lines are ReactNodes so they can mix <tspan className="sc"> and "it".
export function Label({
  x,
  y,
  r = 0,
  size = 14,
  lh,
  lines,
  className = "",
  anchor = "middle",
}: {
  x: number;
  y: number;
  r?: number;
  size?: number;
  lh?: number;
  lines: ReactNode[];
  className?: string;
  anchor?: "start" | "middle" | "end";
}) {
  const step = lh ?? size * 1.15;
  const top = -((lines.length - 1) * step) / 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <text className={`mm-l ${className}`} fontSize={size} textAnchor={anchor} dominantBaseline="central">
        {lines.map((line, i) => (
          <tspan key={i} x={0} y={top + i * step}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

export const SC = ({ children }: { children: ReactNode }) => <tspan className="sc">{children}</tspan>;
export const It = ({ children }: { children: ReactNode }) => <tspan className="it">{children}</tspan>;

/* ---------- architecture ---------- */

// A rectangular room whose walls are lettered bands.
export function Room({
  id,
  x,
  y,
  w,
  h,
  t = 14,
  doors = [],
  caps = false,
}: {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  t?: number;
  doors?: Door[];
  caps?: boolean;
}) {
  return (
    <g>
      {/* hairlines carry on across doorways, like thresholds */}
      <rect x={x} y={y} width={w} height={h} className="mm-hair" />
      <rect x={x + t} y={y + t} width={w - 2 * t} height={h - 2 * t} className="mm-hair" />
      <path d={roomPath(x, y, w, h, doors) + roomPath(x + t, y + t, w - 2 * t, h - 2 * t, doors)} className="mm-wall" />
      <Micro
        id={id}
        d={roomPath(x + t / 2, y + t / 2, w - t, h - t, doors)}
        len={2 * (w + h - 2 * t)}
        caps={caps}
        size={caps ? t * 0.62 : t * 0.85}
      />
    </g>
  );
}

// A straight lettered wall from a to b.
export function Band({ id, a, b, t = 11, caps = false }: { id: string; a: Pt; b: Pt; t?: number; caps?: boolean }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = (-(b[1] - a[1]) / len) * (t / 2);
  const ny = ((b[0] - a[0]) / len) * (t / 2);
  const outline = `M${a[0] + nx} ${a[1] + ny}L${b[0] + nx} ${b[1] + ny}M${a[0] - nx} ${a[1] - ny}L${b[0] - nx} ${b[1] - ny}M${a[0] + nx} ${a[1] + ny}L${a[0] - nx} ${a[1] - ny}M${b[0] + nx} ${b[1] + ny}L${b[0] - nx} ${b[1] - ny}`;
  return (
    <g>
      <path d={outline} className="mm-wall" />
      <Micro id={id} d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} len={len} caps={caps} size={caps ? t * 0.62 : t * 0.85} />
    </g>
  );
}

// A curved lettered wall along an arc.
export function ArcBand({
  id,
  cx,
  cy,
  r,
  a1,
  a2,
  t = 12,
  caps = false,
}: {
  id: string;
  cx: number;
  cy: number;
  r: number;
  a1: number;
  a2: number;
  t?: number;
  caps?: boolean;
}) {
  const [o1, o2] = [polar(cx, cy, r + t / 2, a1), polar(cx, cy, r + t / 2, a2)];
  const [i1, i2] = [polar(cx, cy, r - t / 2, a1), polar(cx, cy, r - t / 2, a2)];
  const ends = `M${o1[0]} ${o1[1]}L${i1[0]} ${i1[1]}M${o2[0]} ${o2[1]}L${i2[0]} ${i2[1]}`;
  return (
    <g>
      <path d={arcPath(cx, cy, r + t / 2, a1, a2) + arcPath(cx, cy, r - t / 2, a1, a2) + ends} className="mm-wall" />
      <Micro
        id={id}
        d={arcPath(cx, cy, r, a1, a2)}
        len={(Math.abs(a2 - a1) / 360) * 2 * Math.PI * r}
        caps={caps}
        size={caps ? t * 0.62 : t * 0.85}
      />
    </g>
  );
}

// A spiral staircase: a spoked wheel in red ink.
export function Wheel({ cx, cy, r = 15, spokes = 14 }: { cx: number; cy: number; r?: number; spokes?: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} className="mm-wall mm-paper" />
      <path
        d={Array.from({ length: spokes }, (_, i) => {
          const [x, y] = polar(cx, cy, r - 1.5, (i * 360) / spokes);
          return `M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}`;
        }).join("")}
        className="mm-red-line"
      />
      <circle cx={cx} cy={cy} r={1.8} className="mm-red-dot" />
    </g>
  );
}

// A round tower: a band of capitals, a ring of step-ticks, an inner ring of scrawl.
export function Tower({
  id,
  cx,
  cy,
  R,
  children,
  inner = true,
}: {
  id: string;
  cx: number;
  cy: number;
  R: number;
  children?: ReactNode;
  inner?: boolean;
}) {
  const ring = Math.min(18, R * 0.3);
  const ticks = Math.round((2 * Math.PI * R) / 7);
  return (
    <g>
      <circle cx={cx} cy={cy} r={R + 15} className="mm-wall mm-paper" />
      <path id={`${id}-caps`} d={circlePath(cx, cy, R + 7.5)} fill="none" />
      <text className="mm-micro mm-micro-caps" fontSize={9} dominantBaseline="central">
        <textPath href={`#${id}-caps`}>{cover(CAPS, 2 * Math.PI * (R + 7.5), 6.6)}</textPath>
      </text>
      <circle cx={cx} cy={cy} r={R} className="mm-wall" />
      <path
        d={Array.from({ length: ticks }, (_, i) => {
          const a = (i * 360) / ticks;
          const [x1, y1] = polar(cx, cy, R - ring, a);
          const [x2, y2] = polar(cx, cy, R, a);
          return `M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}`;
        }).join("")}
        className="mm-red-line"
      />
      <circle cx={cx} cy={cy} r={R - ring} className="mm-wall" />
      {inner && (
        <>
          <path id={`${id}-in`} d={circlePath(cx, cy, R - ring - 7)} fill="none" />
          <text className="mm-micro mm-scrawl" fontSize={10} dominantBaseline="central">
            <textPath href={`#${id}-in`}>{cover(SCRAWL, 2 * Math.PI * (R - ring - 7), 3.2)}</textPath>
          </text>
          <circle cx={cx} cy={cy} r={R - ring - 14} className="mm-hair" />
        </>
      )}
      {children}
    </g>
  );
}

// Outlined Greek cross with a letter, as in the courtyard.
export function Cross({ x, y, letter, r = 0 }: { x: number; y: number; letter: string; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <path d="M-4.6 -10.5H4.6V-4.6H10.5V4.6H4.6V10.5H-4.6V4.6H-10.5V-4.6H-4.6Z" className="mm-wall mm-paper" />
      <text className="mm-l sc" fontSize={9} textAnchor="middle" dominantBaseline="central">
        {letter}
      </text>
    </g>
  );
}

/* ---------- paper ---------- */

export function Foxing({
  seed,
  w,
  h,
  count,
  mottles: withMottles,
}: {
  seed: number;
  w: number;
  h: number;
  count: number;
  mottles: boolean;
}) {
  const rand = rng(seed);
  const spots = Array.from({ length: count }, () => {
    const big = rand() < 0.12;
    return {
      x: rand() * w,
      y: rand() * h,
      r: big ? 3 + rand() * 6 : 0.5 + rand() * 1.8,
      o: big ? 0.18 + rand() * 0.25 : 0.25 + rand() * 0.4,
    };
  });
  const mottles = Array.from({ length: withMottles ? 14 : 0 }, () => ({
    x: rand() * w,
    y: rand() * h,
    rx: 40 + rand() * 140,
    ry: 30 + rand() * 90,
  }));
  return (
    <g className="mm-foxing" aria-hidden="true">
      {mottles.map((m, i) => (
        <ellipse key={`m${i}`} cx={m.x} cy={m.y} rx={m.rx} ry={m.ry} className="mm-mottle" />
      ))}
      {spots.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} className="mm-spot" />
      ))}
    </g>
  );
}

export function Ink(props: SVGProps<SVGPathElement>) {
  return <path className="mm-line" {...props} />;
}
