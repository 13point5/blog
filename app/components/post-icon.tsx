// A tiny pixel-art card for each post, in the manner of a trading card: a
// frame, a coloured field with one small picture, and a name plate.
// Rendered as crisp SVG, so it needs no script.

const INK = "#3b2414";
const ART: Record<string, { bg: string; pal: Record<string, string>; rows: string[] }> = {
  "vibe-rl": {
    bg: "#31405e",
    pal: { k: "#d4cdb9", n: "#0c1a14", g: "#58e08a" },
    rows: ["kkkkkkkkkkkk", "knnnnnnnnnnk", "kngnnnnnnnnk", "knngnnnnnnnk", "kngnnggggnnk", "knnnnnnnnnnk", "kkkkkkkkkkkk", "....kkkk....", "..kkkkkkkk.."],
  },
  gdpx: {
    bg: "#5a2f45",
    pal: { y: "#f2c96a", o: "#b98a2f" },
    rows: [".....yy.....", "yyyyyyyyyyyy", ".y...yy...y.", ".y...yy...y.", "ooo..yy..ooo", ".o...yy...o.", ".....yy.....", ".....yy.....", "...oooooo...", "..oooooooo.."],
  },
  grpo: {
    bg: "#8fd3e8",
    pal: { b: "#5a8ff0", d: "#3b6fc4", w: "#ffffff", k: "#1b1b2a" },
    rows: ["....bbbb....", "..bbbbbbbb..", ".bbwbbbbbbb.", ".bbbbbbbbbb.", "bbbkbbbbkbbb", "bbbkbbbbkbbb", "bbbbbbbbbbbb", "bbbbbbbbbbbb", ".dddddddddd."],
  },
  dungeon: {
    bg: "#3a2f4c",
    pal: { k: "#2a1a12", w: "#b9722f", y: "#f2c96a" },
    rows: [".kkkkkkkkkk.", "kwwwwwwwwwwk", "kyyyyyyyyyyk", "kwwwwyywwwwk", "kkkkkyykkkkk", "kwwwwyywwwwk", "kwwwwwwwwwwk", "kwwwwwwwwwwk", "kkkkkkkkkkkk"],
  },
  sycophant: {
    bg: "#f6c9d6",
    pal: { r: "#e0457a", w: "#ffffff" },
    rows: ["..rr....rr..", ".rrrr..rrrr.", "rrwrrrrrrrrr", "rrrrrrrrrrrr", ".rrrrrrrrrr.", "..rrrrrrrr..", "...rrrrrr...", "....rrrr....", ".....rr....."],
  },
  "boss-fight": {
    bg: "#241a40",
    pal: { y: "#f2c14e", o: "#b98a2f", r: "#e0342b", b: "#58c7d9" },
    rows: ["y....yy....y", "yy..yyyy..yy", "yyyyyyyyyyyy", "yryyybbyyyry", "yyyyyyyyyyyy", "oooooooooooo"],
  },
};
type Art = { bg: string; pal: Record<string, string>; rows: string[] };
const FALLBACK: Art = {
  bg: "#d8c9a8",
  pal: { k: "#3b2414", p: "#fbf1dc", l: "#b9a888" },
  rows: [".kkkkkkkkkk.", "kppppppppppk", "kpllllllllpk", "kppppppppppk", "kplllllllppk", "kppppppppppk", "kpllllllllpk", "kppppppppppk", ".kkkkkkkkkk."],
};

const CW = 16, CH = 19; // card size in art pixels

export function PostIcon({ name, scale = 2, className }: { name?: string; scale?: number; className?: string }) {
  const art = (name && ART[name]) || FALLBACK;
  const top = 2 + Math.floor((12 - art.rows.length) / 2);
  return (
    <svg
      width={CW * scale}
      height={CH * scale}
      viewBox={`0 0 ${CW} ${CH}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
      style={{ flex: "none" }}
    >
      {/* the card: a dark outline with clipped corners, a cream frame, the field, a name plate */}
      <path d={`M1 0H${CW - 1}V1H${CW}V${CH - 1}H${CW - 1}V${CH}H1V${CH - 1}H0V1H1Z`} fill={INK} />
      <rect x={1} y={1} width={CW - 2} height={CH - 2} fill="#fbf1dc" />
      <rect x={2} y={2} width={12} height={12} fill={art.bg} />
      <rect x={2} y={15} width={12} height={2} fill="#d99a55" />
      <rect x={3} y={15} width={6} height={1} fill={INK} />
      <rect x={11} y={15} width={2} height={1} fill="#c8321f" />
      {art.rows.flatMap((row, y) =>
        [...row].map((ch, x) => (art.pal[ch] ? <rect key={`${x}-${y}`} x={2 + x} y={top + y} width={1} height={1} fill={art.pal[ch]} /> : null))
      )}
    </svg>
  );
}
