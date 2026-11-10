// Tiny pixel icons drawn as string art and rendered as crisp SVG rects.

const PAL: Record<string, string> = {
  r: "#e8452c", o: "#f08a2c", w: "#f4efe6", k: "#26282e", y: "#f2c14e",
  s: "#c9d2dc", d: "#56677a", g: "#d9a441", b: "#6b4a2f", c: "#58c7bd",
  p: "#f08ab4", m: "#cfe0ff", l: "#3d7a50", n: "#1f3a5f",
};

const ICONS = {
  koi: [
    "...ooo....",
    "..owooo..o",
    ".okoowoooo",
    ".ooooooo.o",
    "..oooo....",
  ],
  heart: [
    ".rr.rr.",
    "rrrrrrr",
    "rrrrrrr",
    ".rrrrr.",
    "..rrr..",
    "...r...",
  ],
  sword: [
    "......ss",
    ".....sws",
    "....sws.",
    "...sws..",
    "g.sws...",
    ".gws....",
    ".bg.....",
    "b..g....",
  ],
  wand: [
    ".....y..",
    "....yyy.",
    ".....y..",
    "....b...",
    "...b....",
    "..b.....",
    ".b......",
    "b.......",
  ],
  tv: [
    ".d....d.",
    "..d..d..",
    "dddddddd",
    "dccccpdd",
    "dcccccdd",
    "dcccccdd",
    "dddddddd",
  ],
  sun: [
    "y..y..y",
    ".yyyyy.",
    ".yyyyy.",
    "yyyyyyy",
    ".yyyyy.",
    ".yyyyy.",
    "y..y..y",
  ],
  moon: [
    "..mmm..",
    ".mm....",
    "mm.....",
    "mm.....",
    "mm....m",
    ".mm..mm",
    "..mmmm.",
  ],
  star: [
    "...y...",
    "...y...",
    "yyyyyyy",
    ".yyyyy.",
    "..yyy..",
    ".yy.yy.",
    ".y...y.",
  ],
  scroll: [
    ".wwwwww.",
    "wbbbbbbw",
    ".wwwwww.",
    ".wddddw.",
    ".wwwwww.",
    ".wdddww.",
    "wbbbbbbw",
    ".wwwwww.",
  ],
  leaf: [
    ".....ll",
    "...llll",
    "..lllll",
    ".lllll.",
    ".llll..",
    "bll....",
    "b......",
  ],
} as const;

export type PixelIconName = keyof typeof ICONS;

export function PixelIcon({
  name,
  size = 3,
  className,
}: {
  name: PixelIconName;
  /** CSS pixels per art pixel */
  size?: number;
  className?: string;
}) {
  const rows = ICONS[name];
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg
      width={w * size}
      height={h * size}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
      style={{ flex: "none" }}
    >
      {rows.flatMap((row, y) =>
        [...row].map((ch, x) =>
          PAL[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PAL[ch]} /> : null
        )
      )}
    </svg>
  );
}
