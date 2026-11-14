// Small pixel glyphs drawn in the current text colour, so they pick up link
// colours on hover, plus the ornament that sits above the closing quote.

const GLYPHS = {
  // an arrow: on to the rest
  arrow: [
    "......k....",
    "......kk...",
    "kkkkkkkkk..",
    "kkkkkkkkkk.",
    "kkkkkkkkk..",
    "......kk...",
    "......k....",
  ],
  // The three marks below are traced from the real logos: each official
  // outline laid over a 24 by 24 grid, and a cell filled where the logo covers
  // at least half of it. They are shown one screen pixel to a cell.
  // X
  x: [
    "........................",
    "kkkkkkkk...........kkk..",
    ".kkkkkkkk.........kkk...",
    "..kkk..kk........kkkk...",
    "...kk..kkk......kkkk....",
    "...kkk..kkk....kkkk.....",
    "....kkk..kkk..kkkk......",
    ".....kkk..kk.kkkk.......",
    "......kk..kkkkkk........",
    "......kkk..kkkk.........",
    ".......kkk..kkk.........",
    "........kkk..kk.........",
    ".........kk..kkk........",
    ".........kkk..kkk.......",
    "........kkkkk..kkk......",
    ".......kkkkkkk..kk......",
    "......kkkk..kk...kk.....",
    ".....kkkk....kk..kkk....",
    "....kkkk.....kkk..kkk...",
    "...kkkk.......kkk..kk...",
    "...kkk.........kkk.kkk..",
    "..kkk...........kkkkkkk.",
    ".kkk............kkkkkkkk",
    "........................",
  ],
  // GitHub: the cat is the gap in the disc
  github: [
    "..........kkkk..........",
    ".......kkkkkkkkkk.......",
    ".....kkkkkkkkkkkkkk.....",
    "....kkkkkkkkkkkkkkkk....",
    "...kkkkkkkkkkkkkkkkkk...",
    "..kkkk.kkkkkkkkkk.kkkk..",
    ".kkkk...kkkkkkkk...kkkk.",
    ".kkkk..............kkkk.",
    ".kkkk..............kkkk.",
    "kkkkk..............kkkkk",
    "kkkk...............kkkkk",
    "kkkk................kkkk",
    "kkkk................kkkk",
    "kkkkk..............kkkkk",
    "kkkkk..............kkkkk",
    "kkkkk..............kkkkk",
    ".kkkkk............kkkkk.",
    ".kk..kkkk......kkkkkkkk.",
    "..kk..kkk......kkkkkkk..",
    "..kkk..k.......kkkkkkk..",
    "...kkk.........kkkkkk...",
    "....kkkkk......kkkkk....",
    "......kkk......kkk......",
    "........k......k........",
  ],
  // LinkedIn
  linkedin: [
    ".kkkkkkkkkkkkkkkkkkkkkk.",
    "kkkkkkkkkkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkkkkkkkkkk",
    "kkkkk.kkkkkkkkkkkkkkkkkk",
    "kkk....kkkkkkkkkkkkkkkkk",
    "kkk....kkkkkkkkkkkkkkkkk",
    "kkkk...kkkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkkkkkkkkkk",
    "kkkk...kk....k.....kkkkk",
    "kkkk...kk...........kkkk",
    "kkkk...kk...........kkkk",
    "kkkk...kk.....kk....kkkk",
    "kkkk...kk....kkkk...kkkk",
    "kkkk...kk....kkkk...kkkk",
    "kkkk...kk....kkkk...kkkk",
    "kkkk...kk....kkkk...kkkk",
    "kkkk...kk....kkkk...kkkk",
    "kkkk...kk....kkkk...kkkk",
    "kkkk...kk....kkkk...kkkk",
    "kkkkkkkkkkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkkkkkkkkkk",
    "kkkkkkkkkkkkkkkkkkkkkkkk",
    ".kkkkkkkkkkkkkkkkkkkkkk.",
  ],
} as const;

export type GlyphName = keyof typeof GLYPHS;

export function Glyph({ name, scale = 2, className }: { name: GlyphName; scale?: number; className?: string }) {
  const rows = GLYPHS[name];
  const w = rows[0].length, h = rows.length;
  return (
    <svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`} shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" className={className}>
      {rows.flatMap((row, y) =>
        // one rectangle for each unbroken run of filled cells in a row
        [...row.matchAll(/k+/g)].map((run) => <rect key={`${run.index}-${y}`} x={run.index} y={y} width={run[0].length} height={1} />)
      )}
    </svg>
  );
}

/**
 * A printer's ornament, as at the end of a chapter in an old book: a lozenge
 * in the middle, a small diamond and a dot either side, and two rules that
 * end in a point. Perfectly symmetrical.
 */
export function Ornament({ className }: { className?: string }) {
  const W = 61, H = 7, mid = 30;
  const px: [number, number, number][] = []; // x, y, width
  for (let i = 0; i <= 3; i++) {
    // the lozenge, hollow, with a dot at its heart
    for (const y of i === 3 ? [3] : [i, 6 - i]) { px.push([mid - i, y, 1]); if (i) px.push([mid + i, y, 1]); }
  }
  px.push([mid, 3, 1]);
  for (const s of [-1, 1]) {
    px.push([mid + s * 6, 3, 1]); // a dot
    const c = mid + s * 11; // a small diamond
    px.push([c, 2, 1], [c - 1, 3, 3], [c, 4, 1]);
    // a rule, thinning to a point at its far end
    const from = s < 0 ? 2 : mid + 15;
    px.push([from, 3, 14]);
    px.push([s < 0 ? 0 : W - 1, 3, 1]);
  }
  return (
    <svg width={W * 2} height={H * 2} viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" className={className}>
      {px.map(([x, y, w], i) => <rect key={i} x={x} y={y} width={w} height={1} />)}
    </svg>
  );
}
