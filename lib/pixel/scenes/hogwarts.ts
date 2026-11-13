import { hash, type Gfx, type Scene } from "../engine";

// The castle on its crag, seen from below as in the photograph: the great hall
// and the big round tower on the left, a cluster of thin spires on the right,
// rock underneath, dark firs in front and a signpost by the path.
// There is no painted sky. The page is the sky: pale with drifting clouds on
// the light theme, dark with stars, a moon and lit windows on the dark one.

const W = 176, H = 112;

// The signpost by the path. The owl likes to sit on it.
const SIGN = { left: -80, top: 62, w: 37, h: 9 }; // measured from the castle's centre line

/** Where the owl stands on the sign, in the scene's own pixels, for a canvas `cols` wide. */
export function signRoost(cols: number) {
  return { x: Math.floor(cols / 2) + SIGN.left + SIGN.w / 2, y: SIGN.top, plank: SIGN.h };
}

type Pal = {
  stone: string; lit: string; shade: string; roof: string; roofLit: string; rock: string; rockLit: string; rockDk: string;
  fir: string; firLit: string; slit: string; cloud: string; cloudLo: string; sign: string; ink: string;
};
const DAY: Pal = {
  stone: "#8f8c85", lit: "#aeaaa1", shade: "#6a6862", roof: "#565c66", roofLit: "#737a85", rock: "#8c7662", rockLit: "#ad977c", rockDk: "#5b4a3b",
  fir: "#22332b", firLit: "#34493c", slit: "#3b3d44", cloud: "#e3e9ef", cloudLo: "#c3d0de", sign: "#efe7d2", ink: "#2a2925",
};
const NIGHT: Pal = {
  stone: "#39415a", lit: "#4a5471", shade: "#272d42", roof: "#1f2538", roofLit: "#2d3550", rock: "#2a3044", rockLit: "#3a425c", rockDk: "#181c2b",
  fir: "#0c1118", firLit: "#141c26", slit: "#151a28", cloud: "#262d40", cloudLo: "#1d2333", sign: "#8f8a7a", ink: "#0c1118",
};

/** Top of the rock at x, measured from the castle's centre line. */
function rockTop(x: number) {
  const bumps = Math.sin(x * 0.45) * 1.5 + Math.sin(x * 0.17 + 2) * 2;
  if (x < -44) return 66 + (-44 - x) * 2.1 + bumps;
  if (x <= 6) return 65 + bumps * 0.4;
  if (x < 14) return 65 + Math.sin(((x - 6) / 8) * Math.PI) * 14; // the cleft between the two halves
  if (x <= 54) return 76 + bumps * 0.4;
  return 76 + (x - 54) * 2.2 + bumps;
}

function paintFront(l: Gfx, w: number, P: Pal, night: boolean) {
  const cx = Math.floor(w / 2);
  const R = (x: number, y: number, rw: number, rh: number, c: string) => l.rect(cx + x, y, rw, rh, c);
  /** A round tower: lit on the left, in shade on the right, with a corbelled band under the top. */
  const tower = (x: number, tw: number, top: number, base: number) => {
    R(x, top, tw, base - top, P.stone);
    R(x, top, Math.max(1, Math.round(tw / 3)), base - top, P.lit);
    R(x + tw - Math.max(1, Math.round(tw / 3)), top, Math.max(1, Math.round(tw / 3)), base - top, P.shade);
    if (tw >= 5) { R(x - 1, top + 2, tw + 2, 2, P.stone); R(x - 1, top + 2, 2, 2, P.lit); R(x + tw - 1, top + 2, 2, 2, P.shade); for (let i = 0; i < tw + 2; i += 2) l.px(cx + x - 1 + i, top + 4, P.shade); }
  };
  /** A conical roof whose base sits on `base`, centred on `mx`. */
  const cone = (mx: number, base: number, half: number, h: number) => {
    for (let i = 0; i < h; i++) {
      const hw = Math.max(0, Math.round((half * (i + 1)) / h));
      R(mx - hw, base - h + i, hw + 1, 1, P.roofLit);
      R(mx + 1, base - h + i, hw, 1, P.roof);
    }
    l.px(cx + mx, base - h - 1, P.roof);
  };
  const slit = (x: number, y: number, h = 2) => R(x, y, 1, h, P.slit);

  // --- the rock
  for (let x = -70; x <= 72; x++) {
    const top = Math.round(rockTop(x));
    for (let y = top; y < H; y++) {
      const facet = hash(Math.floor((x + y * 0.7) / 6), Math.floor((y - x * 0.35) / 8), 4);
      const crack = hash(Math.floor((x - y * 0.5) / 3), Math.floor((y + x * 0.2) / 11), 9) < 0.09;
      l.px(cx + x, y, crack ? P.rockDk : facet < 0.3 ? P.rockLit : facet > 0.75 ? P.rockDk : P.rock);
    }
    l.px(cx + x, top, P.rockLit);
  }

  // --- left half: great hall, big tower, terrace
  R(-46, 46, 34, 20, P.stone); R(-46, 46, 34, 1, P.lit); // the hall
  for (let i = 0; i < 8; i++) R(-45 + Math.round(i * 0.5), 38 + i, 32 - i, 1, i < 2 ? P.roofLit : P.roof); // pitched roof
  for (let x = -45; x < -13; x += 5) { R(x, 43, 1, 4, P.shade); l.px(cx + x, 42, P.lit); } // pinnacles
  for (let x = -43; x < -14; x += 4) { slit(x, 50, 9); l.px(cx + x, 49, P.slit); R(x + 1, 51, 1, 7, P.shade); } // tall windows
  tower(-49, 3, 40, 66); cone(-48, 40, 2, 9);
  tower(-23, 3, 30, 46); cone(-22, 30, 2, 13); // slim spire
  tower(-16, 2, 34, 46); cone(-15, 34, 1, 7);
  tower(-12, 13, 30, 64); cone(-6, 30, 8, 27); // the big tower
  tower(-14, 2, 20, 32); cone(-13, 20, 1, 6); // its little turret
  for (const [x, y] of [[-9, 38], [-4, 38], [-7, 46], [-2, 52], [-9, 56]]) slit(x, y, 3);
  R(-26, 58, 36, 8, P.stone); R(-26, 58, 36, 1, P.lit); R(-26, 65, 36, 1, P.shade); // terrace
  for (let x = -25; x < 10; x += 2) l.px(cx + x, 57, P.stone); // battlements
  for (let x = -24; x < 9; x += 3) R(x, 60, 1, 3, P.slit); // arcade
  tower(-29, 6, 54, 67); cone(-26, 54, 4, 7);
  tower(4, 6, 46, 67); cone(7, 46, 4, 13);
  slit(6, 52, 3); slit(-27, 59, 2);

  // --- right half: the thin spires
  R(31, 66, 23, 11, P.stone); R(31, 66, 23, 1, P.lit); R(31, 76, 23, 1, P.shade); // long wall
  for (let x = 34; x < 53; x += 4) slit(x, 69, 2);
  tower(53, 4, 62, 79); cone(55, 62, 3, 9);
  R(20, 40, 7, 37, P.stone); R(20, 40, 2, 37, P.lit); R(25, 40, 2, 37, P.shade); // the tall ruined block
  for (let i = 0; i < 5; i++) R(20 + i, 35 + i, 2, 6 - i, P.stone);
  tower(26, 6, 30, 77); cone(29, 30, 4, 18);
  tower(34, 2, 50, 77); cone(35, 50, 1, 22);
  tower(14, 6, 58, 79); cone(17, 58, 4, 13);
  tower(21, 4, 60, 78); cone(23, 60, 3, 9);
  tower(18, 1, 40, 58); cone(18, 40, 1, 12);
  for (const [x, y] of [[28, 38], [28, 46], [29, 56], [22, 46], [23, 54], [16, 64], [22, 66], [28, 66]]) slit(x, y, 3);

  // --- firs: tall ones at the edges of the scene, a low line of them everywhere else
  const fir = (x: number, h: number) => {
    for (let i = 0; i < h; i++) {
      const hw = Math.round((i % 5) * 0.7 + i * 0.16);
      l.rect(x - hw, H - h + i, hw * 2 + 1, 1, P.fir);
      if (i % 5 === 4) l.rect(x - hw, H - h + i, Math.max(1, hw - 1), 1, P.firLit);
    }
  };
  for (let x = 3; x < w; x += 7) {
    const d = Math.abs(x - cx);
    const h = d > 62 ? 22 + hash(x, 1, 6) * 26 : 7 + hash(x, 2, 6) * 9;
    fir(x + Math.round(hash(x, 3, 6) * 3), Math.round(h));
  }
  l.rect(0, H - 2, w, 2, P.fir);

  // --- a lamp and a signpost by the path
  const sx = cx - 82;
  l.rect(sx, 58, 2, H - 58, P.ink);
  l.rect(sx - 2, 50, 6, 8, P.ink); l.rect(sx - 1, 52, 4, 5, night ? "#ffcf6b" : "#c9d2d6");
  l.rect(sx - 1, 48, 4, 2, P.ink); l.px(sx, 47, P.ink);
  l.rect(cx + SIGN.left, SIGN.top, SIGN.w, SIGN.h, P.ink); l.rect(cx + SIGN.left + 1, SIGN.top + 1, SIGN.w - 2, SIGN.h - 2, P.sign);
  l.rect(sx + 38, 64, 2, 5, P.ink); l.px(sx + 40, 66, P.ink); // a pointed end
  l.text("HOGWARTS", sx + 5, 64, P.ink);
}

const WINDOWS: [number, number][] = [
  [-43, 52], [-39, 54], [-35, 51], [-31, 55], [-27, 52], [-19, 53], [-9, 39], [-4, 39], [-7, 47], [-2, 53], [-9, 57],
  [-24, 61], [-15, 61], [-6, 61], [3, 61], [6, 53], [28, 39], [28, 47], [29, 57], [22, 47], [23, 55], [16, 65], [34, 69], [42, 69], [50, 69], [55, 67],
];

type Cloud = { x: number; y: number; w: number; sp: number };
type State = { w: number; clouds: Cloud[] };

export const hogwarts: Scene<State> = {
  w: W,
  h: H,
  fps: 12,
  poster: 30,
  fluid: true,
  alt: "Pixel art of a castle on a rocky crag seen from below: a great hall, a large round tower with a tall conical roof and a cluster of thin spires, with fir trees and a signpost reading Hogwarts in front. By day clouds drift past; at night the windows are lit under a moon and stars.",

  init(rng, w) {
    const clouds = Array.from({ length: Math.max(4, Math.round(w / 48)) }, () => ({
      x: rng() * w, y: 6 + rng() * 44, w: 18 + rng() * 26, sp: 0.04 + rng() * 0.08,
    }));
    return { w, clouds };
  },

  draw(g, f, s, env) {
    const P = env.night ? NIGHT : DAY;
    const { w } = s;
    const cx = Math.floor(w / 2);

    if (env.night) {
      // stars and a moon, straight onto the dark page
      for (let i = 0; i < Math.round(w * 0.5); i++) {
        const x = Math.floor(hash(i, 1, 5) * w), y = Math.floor(hash(i, 2, 5) * 70);
        if ((f + i * 13) % 80 > 6) g.px(x, y, hash(i, 3, 5) < 0.2 ? "#ffe9a8" : "#cfdcf5", 0.35 + hash(i, 4, 5) * 0.65);
      }
      const mx = cx + 58, my = 20;
      g.disc(mx, my, 11, "#f4f1dc", 0.08);
      g.disc(mx, my, 8, "#f4f1dc");
      g.disc(mx - 3, my - 2, 2, "#d9d5ba"); g.disc(mx + 3, my + 3, 1.5, "#d9d5ba"); g.px(mx + 2, my - 4, "#d9d5ba");
    }

    // clouds drift behind the castle
    for (const c of s.clouds) {
      const x = ((c.x + f * c.sp) % (w + 60)) - 30;
      g.rect(x, c.y + 3, c.w, 4, P.cloud);
      g.rect(x + c.w * 0.15, c.y + 1, c.w * 0.5, 2, P.cloud);
      g.rect(x + c.w * 0.3, c.y - 1, c.w * 0.25, 2, P.cloud);
      g.rect(x + c.w * 0.55, c.y + 1, c.w * 0.3, 2, P.cloud);
      g.rect(x + 2, c.y + 6, c.w - 4, 2, P.cloudLo);
    }

    g.layer(env.night ? "front-night" : "front-day", (l) => paintFront(l, w, P, env.night));

    if (env.night) {
      WINDOWS.forEach(([dx, y], i) => {
        if (i % 6 === 2 && Math.floor(f / 16 + i) % 3 === 0) return; // a few flicker
        g.rect(cx + dx, y, 1, 2, "#ffcf6b");
        g.disc(cx + dx, y + 1, 1.6, "#ffcf6b", 0.14);
      });
      g.disc(cx - 81, 54, 5, "#ffcf6b", 0.16);
      // an owl crossing the moon
      const ox = ((f * 0.8) % (w + 80)) - 20, oy = 26 + Math.sin(f * 0.07) * 6;
      const up = Math.floor(f / 3) % 2 === 0;
      g.rect(ox - 1, oy, 3, 2, "#e8ecf5");
      if (up) { g.rect(ox - 4, oy - 2, 3, 1, "#e8ecf5"); g.rect(ox + 2, oy - 2, 3, 1, "#e8ecf5"); g.px(ox - 2, oy - 1, "#e8ecf5"); g.px(ox + 2, oy - 1, "#e8ecf5"); }
      else { g.rect(ox - 4, oy + 1, 3, 1, "#e8ecf5"); g.rect(ox + 2, oy + 1, 3, 1, "#e8ecf5"); }
    } else {
      // a few birds wheeling round the towers
      for (let i = 0; i < 3; i++) {
        const a = f * 0.03 + i * 2.1;
        const bx = cx + 8 + Math.cos(a) * (38 + i * 9), by = 22 + Math.sin(a * 1.3) * 9 + i * 4;
        const up = Math.floor(f / 4 + i) % 2;
        g.px(bx, by, P.ink); g.px(bx - 1, by - (up ? 1 : 0), P.ink); g.px(bx + 1, by - (up ? 1 : 0), P.ink);
      }
    }
  },
};
