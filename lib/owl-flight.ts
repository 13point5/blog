// How the owl gets from one place to another. This file is only geometry and
// timing: it imports nothing, so it can be tested on its own
// (tests/owl-flight.test.mjs).
//
// A flight that looks right needs three things, each a standard technique:
//
// 1. A curve with no kinks. The waypoints are joined by a centripetal
//    Catmull-Rom spline, the one member of that family that cannot form a
//    cusp or cross itself between two waypoints (Yuksel, Schaefer and Keyser,
//    "Parameterization and applications of Catmull-Rom curves").
// 2. Speed that belongs to the bird, not to the mathematics. A spline's own
//    parameter covers long stretches fast and short ones slowly, so the curve
//    is measured out and travelled by distance instead (arc-length
//    parameterisation).
// 3. A speed that changes the way a flying thing's does: it gathers speed
//    after take-off, eases down to land (the "arrive" behaviour of Reynolds'
//    steering behaviours), and slows in a tight turn, by the cube root of how
//    tight it is (the speed-curvature power law of natural movement).

export type Pt = { x: number; y: number };
export type Flight = {
  /** how long the flight takes, in milliseconds */
  ms: number;
  /** how far it goes, along the curve */
  length: number;
  /** where the owl is, this long after taking off */
  at: (ms: number) => Pt;
};

const hyp = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const mix = (a: Pt, b: Pt, wa: number, wb: number): Pt => ({ x: a.x * wa + b.x * wb, y: a.y * wa + b.y * wb });

/** Points along a centripetal Catmull-Rom spline through `pts`, about two pixels apart, every waypoint included. */
export function spline(pts: Pt[]): Pt[] {
  // waypoints on top of one another would divide by zero, and mean nothing
  const way = pts.filter((p, i) => i === 0 || hyp(pts[i - 1], p) > 1.5);
  if (way.length < 2) return [pts[0], pts[pts.length - 1]];
  const out: Pt[] = [way[0]];
  for (let i = 0; i < way.length - 1; i++) {
    const p1 = way[i], p2 = way[i + 1];
    // beyond either end, carry straight on
    const p0 = way[i - 1] ?? mix(p1, p2, 2, -1), p3 = way[i + 2] ?? mix(p2, p1, 2, -1);
    const t0 = 0, t1 = t0 + Math.sqrt(hyp(p0, p1)), t2 = t1 + Math.sqrt(hyp(p1, p2)), t3 = t2 + Math.sqrt(hyp(p2, p3));
    const n = Math.max(8, Math.min(160, Math.ceil(hyp(p1, p2) / 2)));
    for (let k = 1; k <= n; k++) {
      if (k === n) { out.push(p2); break; } // exactly, not to within rounding
      const t = t1 + ((t2 - t1) * k) / n;
      const a1 = mix(p0, p1, (t1 - t) / (t1 - t0), (t - t0) / (t1 - t0));
      const a2 = mix(p1, p2, (t2 - t) / (t2 - t1), (t - t1) / (t2 - t1));
      const a3 = mix(p2, p3, (t3 - t) / (t3 - t2), (t - t2) / (t3 - t2));
      const b1 = mix(a1, a2, (t2 - t) / (t2 - t0), (t - t0) / (t2 - t0));
      const b2 = mix(a2, a3, (t3 - t) / (t3 - t1), (t - t1) / (t3 - t1));
      out.push(mix(b1, b2, (t2 - t) / (t2 - t1), (t - t1) / (t2 - t1)));
    }
  }
  return out;
}

const EASY_TURN = 70; // a turn of this radius (in pixels) or wider is taken at full speed
const SLOWEST = 0.45; // and the tightest turn at this fraction of it
const OFF = 0.3, DOWN = 0.2; // speed just after take-off and just before landing, as fractions of full speed

/**
 * Plan a flight through some waypoints. The first and last waypoints are where
 * it starts and lands. `time` is how long it should take in all, in
 * milliseconds, or a way of working that out from how far it turns out to be.
 */
export function planFlight(pts: Pt[], time: number | ((length: number) => number)): Flight {
  const s = spline(pts), n = s.length;
  const step = s.slice(1).map((p, i) => hyp(s[i], p));
  const length = step.reduce((a, b) => a + b, 0);
  if (length < 1) return { ms: 0, length: 0, at: () => s[n - 1] };
  const ms = typeof time === "number" ? time : time(length);

  // how fast each point may be passed: slower where the path turns tightly
  const cap = s.map((_, i) => {
    if (i === 0 || i === n - 1) return 1;
    const a = Math.atan2(s[i].y - s[i - 1].y, s[i].x - s[i - 1].x), b = Math.atan2(s[i + 1].y - s[i].y, s[i + 1].x - s[i].x);
    let turn = Math.abs(b - a);
    if (turn > Math.PI) turn = 2 * Math.PI - turn;
    const radius = (step[i - 1] + step[i]) / 2 / Math.max(turn, 1e-6);
    return Math.max(SLOWEST, Math.min(1, Math.cbrt(radius / EASY_TURN)));
  });
  // it sees a turn coming: take the slowest of a few points either side
  const v = cap.map((_, i) => Math.min(...cap.slice(Math.max(0, i - 6), i + 7)));
  // it cannot change speed in an instant: so far to gather speed, so far to shed it
  const gather = Math.max(30, Math.min(110, length * 0.22)), shed = Math.max(40, Math.min(160, length * 0.3));
  v[0] = OFF;
  for (let i = 1; i < n; i++) v[i] = Math.min(v[i], Math.sqrt(v[i - 1] ** 2 + ((1 - OFF ** 2) / gather) * step[i - 1]));
  v[n - 1] = DOWN;
  for (let i = n - 2; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] ** 2 + ((1 - DOWN ** 2) / shed) * step[i]));

  // when it reaches each point, stretched so the whole flight takes `ms`
  const when = [0];
  for (let i = 1; i < n; i++) when.push(when[i - 1] + step[i - 1] / ((v[i - 1] + v[i]) / 2));
  const stretch = ms / when[n - 1];
  for (let i = 0; i < n; i++) when[i] *= stretch;

  return {
    ms,
    length,
    at(t) {
      if (t <= 0) return s[0];
      if (t >= ms) return s[n - 1];
      let lo = 0, hi = n - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (when[mid] <= t) lo = mid; else hi = mid; }
      const u = (t - when[lo]) / (when[hi] - when[lo]);
      return mix(s[lo], s[hi], 1 - u, u);
    },
  };
}

export type Box = { left: number; right: number; top: number };

/**
 * Waypoints for an everyday flight from `a` to `b`, never the same twice but
 * always the sort of line a bird would take: up and over rather than straight
 * across, drifting to one side and, on a long flight, a little way back
 * toward the other. There is nothing fancy at the far end: a hook or a
 * double-back just before the perch reads as a mistake, and the slowing down
 * is what makes a landing. `box` is the part of the page it should keep
 * inside; `rnd` gives random numbers from 0 to 1.
 */
export function route(a: Pt, b: Pt, box: Box, rnd: () => number = Math.random): Pt[] {
  const dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
  if (dist < 24) return [];
  const nx = -dy / dist, ny = dx / dist; // across the line of flight
  const inside = (p: Pt) => p.x >= box.left && p.x <= box.right && p.y >= box.top;
  const sway = Math.min(80, dist * (0.1 + rnd() * 0.12)), lift = Math.min(70, dist * (0.08 + rnd() * 0.12));
  const side = rnd() < 0.5 ? -1 : 1;
  const pts: Pt[] = [];
  /**
   * A waypoint `u` of the way along, so far across the line and so far above it.
   * If that would be off the page it drifts the other way instead, and failing
   * that, less far. (Simply pushing the point back inside would put a kink in
   * the curve.)
   */
  const on = (u: number, across: number, up: number) => {
    for (const k of [1, -1, 0.5, -0.5, 0.2, -0.2, 0]) for (const lifted of [up, up / 2, 0]) {
      const p = { x: a.x + dx * u + nx * across * k, y: a.y + dy * u + ny * across * k - lifted };
      if (inside(p)) { pts.push(p); return; }
    }
  };
  if (dist < 150) on(0.45 + rnd() * 0.1, sway * side, lift);
  else {
    on(0.3 + rnd() * 0.08, sway * side, lift);
    on(0.66 + rnd() * 0.08, -sway * side * (0.2 + rnd() * 0.4), lift * (0.5 + rnd() * 0.4));
  }
  return pts;
}

/**
 * Waypoints for a lap of honour: out from `a`, once round an oval inside
 * `box` (which also needs a bottom), and in to `b`. The oval is a little
 * uneven and may go either way round, but it is always an oval: the points
 * come at steady intervals round it, so the curve never spikes or turns back.
 */
export function lap(a: Pt, b: Pt, box: Box & { bottom: number }, rnd: () => number = Math.random): Pt[] {
  const mx = (box.left + box.right) / 2, my = (box.top + box.bottom) / 2, rx = (box.right - box.left) / 2, ry = (box.bottom - box.top) / 2;
  const n = 4 + Math.floor(rnd() * 2), turn = rnd() < 0.5 ? 1 : -1;
  // set off round the oval from the part of it nearest the start, so that there is no doubling back to begin
  const first = Math.atan2((a.y - my) / ry, (a.x - mx) / rx) + turn * (0.5 + rnd() * 0.4);
  // and stop three quarters of the way round or so, wherever leaves the gentlest turn in to land
  const sweep = Math.PI * (1.3 + rnd() * 0.4);
  return Array.from({ length: n }, (_, i) => {
    const at = first + turn * (i / (n - 1)) * sweep + (rnd() - 0.5) * 0.25, r = 0.72 + rnd() * 0.28;
    return { x: mx + Math.cos(at) * rx * r, y: my + Math.sin(at) * ry * r };
  });
}
