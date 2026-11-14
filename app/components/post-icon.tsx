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
