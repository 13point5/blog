// A small pixel picture for each post: just the thing itself, no frame.
// Rendered as crisp SVG, so it needs no script.

type Art = { pal: Record<string, string>; rows: string[] };
const K = "#3b2414";

const ART: Record<string, Art> = {
  // a terminal with a prompt on its screen
  "vibe-rl": {
    pal: { k: K, d: "#d4cdb9", n: "#0c1a14", g: "#58e08a" },
    rows: [
      ".kkkkkkkkkkkk.",
      "kddddddddddddk",
      "kdnnnnnnnnnndk",
      "kdngnnnnnnnndk",
      "kdnngnnnnnnndk",
      "kdngnngggnnndk",
      "kdnnnnnnnnnndk",
      "kddddddddddddk",
      ".kkkkkkkkkkkk.",
      "....kddddk....",
      "..kkkkkkkkkk..",
    ],
  },
  // the scales of justice
  gdpx: {
    pal: { y: "#e3b34d", o: "#a87a2a", k: K },
    rows: [
      "......yy......",
      "......yy......",
      ".yyyyyyyyyyyy.",
      ".o....yy....o.",
      ".o....yy....o.",
      "ooo...yy...ooo",
      "yyy...yy...yyy",
      ".y....yy....y.",
      "......yy......",
      "......yy......",
      "....oyyyyo....",
      "...oooooooo...",
    ],
  },
  // one of the group
  grpo: {
    pal: { k: "#23406e", b: "#5a8ff0", d: "#3b6fc4", w: "#ffffff", e: "#1b1b2a" },
    rows: [
      "....kkkkkk....",
      "..kkbbbbbbkk..",
      ".kbbwwbbbbbbk.",
      ".kbbwbbbbbbbk.",
      "kbbbebbbbebbbk",
      "kbbbebbbbebbbk",
      "kbbbbbbbbbbbbk",
      "kbbbbbeebbbbbk",
      "kddddddddddddk",
      ".kkkkkkkkkkkk.",
    ],
  },
  // what is at the end of the dungeon
  dungeon: {
    pal: { k: K, w: "#b9722f", l: "#d99a55", y: "#f2c96a" },
    rows: [
      "..kkkkkkkkkk..",
      ".kllllllllllk.",
      "kwwwwwwwwwwwwk",
      "kyyyyyyyyyyyyk",
      "kwwwwwyywwwwwk",
      "kkkkkkyykkkkkk",
      "kwwwwwyywwwwwk",
      "kwwwwwwwwwwwwk",
      "kwwwwwwwwwwwwk",
      "kkkkkkkkkkkkkk",
    ],
  },
  // too much love
  sycophant: {
    pal: { k: "#8a2148", r: "#e8527f", w: "#ffd5e2" },
    rows: [
      "..kkk....kkk..",
      ".krrrk..krrrk.",
      "krwwrrkkrrrrrk",
      "krwrrrrrrrrrrk",
      "krrrrrrrrrrrrk",
      ".krrrrrrrrrrk.",
      "..krrrrrrrrk..",
      "...krrrrrrk...",
      "....krrrrk....",
      ".....krrk.....",
      "......kk......",
    ],
  },
  // what the boss was wearing
  "boss-fight": {
    pal: { k: "#7a5a1a", y: "#f2c14e", o: "#c9973a", r: "#e0342b", b: "#58c7d9" },
    rows: [
      ".k....kk....k.",
      "kyk..kyyk..kyk",
      "kyyk.kyyk.kyyk",
      "kyyykyyyykyyyk",
      "kyyyyyyyyyyyyk",
      "kyryyybbyyyryk",
      "kyyyyyyyyyyyyk",
      "kooooooooooook",
      ".kkkkkkkkkkkk.",
    ],
  },
};

// a sheet of writing, for a post without a picture of its own
const FALLBACK: Art = {
  pal: { k: K, p: "#fbf1dc", l: "#b9a888" },
  rows: [
    ".kkkkkkkkkk...",
    "kppppppppppk..",
    "kpllllllllpk..",
    "kppppppppppk..",
    "kplllllllppk..",
    "kppppppppppk..",
    "kpllllllllpk..",
    "kppppppppppk..",
    "kpllllllpppk..",
    "kppppppppppk..",
    ".kkkkkkkkkk...",
  ],
};

const SIZE = 14; // every picture is drawn inside a 14 x 14 box, so the titles line up

export function PostIcon({ name, scale = 2, className }: { name?: string; scale?: number; className?: string }) {
  const art = (name && ART[name]) || FALLBACK;
  const top = Math.floor((SIZE - art.rows.length) / 2);
  return (
    <svg
      width={SIZE * scale}
      height={SIZE * scale}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
      style={{ flex: "none" }}
    >
      {art.rows.flatMap((row, y) =>
        [...row].map((ch, x) => (art.pal[ch] ? <rect key={`${x}-${y}`} x={x} y={top + y} width={1} height={1} fill={art.pal[ch]} /> : null))
      )}
    </svg>
  );
}
