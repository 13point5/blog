import test from "node:test";
import assert from "node:assert/strict";
import { lap, planFlight, route, spline } from "../lib/owl-flight.ts";

/** a repeatable source of random numbers */
const rng = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const hyp = (a, b) => Math.hypot(b.x - a.x, b.y - a.y);
const BOX = { left: 30, right: 360, top: 24 };

/** how fast the owl is going at each moment, sampled every 10 ms, in pixels per second */
function speeds(f) {
  const out = [];
  for (let t = 10; t <= f.ms; t += 10) out.push(hyp(f.at(t - 10), f.at(t)) * 100);
  return out;
}

test("a flight starts where it was told to and lands where it was told to, on time", () => {
  const pts = [{ x: 40, y: 400 }, { x: 150, y: 250 }, { x: 300, y: 320 }, { x: 320, y: 120 }];
  const f = planFlight(pts, 1500);
  assert.deepEqual(f.at(0), pts[0]);
  assert.deepEqual(f.at(1500), pts[3]);
  assert.deepEqual(f.at(99999), pts[3]);
  assert.ok(f.length > hyp(pts[0], pts[3]));
});

/** the sharpest change of direction from one little step of a curve to the next, in degrees */
function sharpest(s) {
  let worst = 0;
  for (let i = 2; i < s.length; i++) {
    const a = Math.atan2(s[i - 1].y - s[i - 2].y, s[i - 1].x - s[i - 2].x), b = Math.atan2(s[i].y - s[i - 1].y, s[i].x - s[i - 1].x);
    let turn = Math.abs(b - a);
    if (turn > Math.PI) turn = 2 * Math.PI - turn;
    worst = Math.max(worst, turn);
  }
  return (worst * 180) / Math.PI;
}

test("the curve goes through every waypoint, and never turns back on itself however awkward they are", () => {
  for (let seed = 1; seed < 40; seed++) {
    const r = rng(seed), pts = Array.from({ length: 5 }, () => ({ x: 40 + r() * 300, y: 60 + r() * 500 }));
    const s = spline(pts);
    for (const p of pts) assert.ok(s.some((q) => hyp(p, q) < 1e-9), "passes through each waypoint");
    assert.ok(sharpest(s) < 150, `a cusp: ${sharpest(s).toFixed(0)} degrees in one step (seed ${seed})`);
  }
});

test("the routes it actually flies have no sharp corners in them", () => {
  for (let seed = 1; seed < 200; seed++) {
    const r = rng(seed), a = { x: 40 + r() * 300, y: 100 + r() * 600 }, b = { x: 40 + r() * 300, y: 100 + r() * 600 };
    const s = spline([a, ...route(a, b, BOX, r), b]);
    // two-pixel steps: 25 degrees a step is a turn about five pixels in radius, far tighter than anything here should be
    assert.ok(sharpest(s) < 25, `${sharpest(s).toFixed(0)} degrees in one step, from ${JSON.stringify(a)} to ${JSON.stringify(b)} (seed ${seed})`);
  }
});

test("speed belongs to the bird: no lurching, a gentle take-off and a gentle landing", () => {
  for (let seed = 1; seed < 60; seed++) {
    const r = rng(seed), a = { x: 40 + r() * 300, y: 100 + r() * 600 }, b = { x: 40 + r() * 300, y: 100 + r() * 600 };
    if (hyp(a, b) < 60) continue;
    const f = planFlight([a, ...route(a, b, BOX, r), b], Math.min(1900, 380 + hyp(a, b)));
    const v = speeds(f), top = Math.max(...v), mean = f.length / (f.ms / 1000);
    // it never goes at much more than its average pace, and never stops in mid-air
    assert.ok(top < mean * 1.9, `top speed ${top.toFixed(0)} against a mean of ${mean.toFixed(0)} (seed ${seed})`);
    assert.ok(Math.min(...v.slice(2, -2)) > top * 0.12, `nearly stopped in mid-air (seed ${seed})`);
    // no sudden changes: from one hundredth of a second to the next, speed changes by a small part of top speed
    for (let i = 1; i < v.length; i++) assert.ok(Math.abs(v[i] - v[i - 1]) < top * 0.2, `a lurch at ${i * 10} ms (seed ${seed})`);
    // slower at both ends than in the middle, and slowest of all coming in to land
    const third = Math.floor(v.length / 3), avg = (xs) => xs.reduce((p, q) => p + q, 0) / xs.length;
    assert.ok(avg(v.slice(0, 4)) < avg(v.slice(third, 2 * third)), "gathers speed");
    assert.ok(avg(v.slice(-4)) < avg(v.slice(third, 2 * third)) * 0.7, "eases down to land");
  }
});

test("it slows in a tight turn and not on a straight", () => {
  const straight = planFlight([{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 600, y: 0 }], 2000);
  const hairpin = planFlight([{ x: 0, y: 0 }, { x: 300, y: 0 }, { x: 300, y: 40 }, { x: 0, y: 40 }], 2000);
  // the pace half-way along, against the fastest it goes
  const mid = (f) => { const v = speeds(f); return v[Math.floor(v.length / 2)] / Math.max(...v); };
  assert.ok(mid(straight) > 0.95);
  assert.ok(mid(hairpin) < 0.75, `through the hairpin at ${mid(hairpin).toFixed(2)} of top speed`);
});

test("everyday routes stay on the page, bow away from the straight line, and are never the same twice", () => {
  const a = { x: 60, y: 500 }, b = { x: 300, y: 180 }, seen = new Set();
  for (let seed = 1; seed < 50; seed++) {
    const pts = route(a, b, BOX, rng(seed));
    seen.add(JSON.stringify(pts));
    assert.equal(pts.length, 2, "a long flight has two waypoints");
    for (const p of pts) assert.ok(p.x >= BOX.left && p.x <= BOX.right && p.y >= BOX.top);
    // the first waypoint is well off the straight line from a to b (the second may happen to drift back onto it)
    assert.ok(Math.abs((b.x - a.x) * (pts[0].y - a.y) - (b.y - a.y) * (pts[0].x - a.x)) / hyp(a, b) > 8);
    // and the flight is longer than the straight line, but not by much: no detours
    const f = planFlight([a, ...pts, b], 1000);
    assert.ok(f.length > hyp(a, b) && f.length < hyp(a, b) * 1.25, `${f.length.toFixed(0)} against ${hyp(a, b).toFixed(0)}`);
  }
  assert.equal(seen.size, 49);
  assert.equal(route(a, { x: 140, y: 470 }, BOX, rng(1)).length, 1, "a short flight has one");
  assert.deepEqual(route(a, { x: 70, y: 505 }, BOX, rng(1)), [], "a hop needs none");
});

test("a route squeezed against the edge of the page bends the other way rather than kinking", () => {
  for (let seed = 1; seed < 200; seed++) {
    const r = rng(seed), a = { x: 30 + r() * 30, y: 100 + r() * 600 }, b = { x: 30 + r() * 30, y: 100 + r() * 600 };
    const pts = route(a, b, BOX, r);
    for (const p of pts) assert.ok(p.x >= BOX.left && p.x <= BOX.right && p.y >= BOX.top);
    assert.ok(sharpest(spline([a, ...pts, b])) < 25, `seed ${seed}`);
  }
});

test("the lap of honour is a smooth loop inside its box, different every time", () => {
  const box = { left: 46, right: 344, top: 110, bottom: 560 }, a = { x: 150, y: 50 }, b = { x: 80, y: 160 }, seen = new Set();
  for (let seed = 1; seed < 200; seed++) {
    const pts = lap(a, b, box, rng(seed));
    seen.add(JSON.stringify(pts));
    assert.ok(pts.length === 4 || pts.length === 5);
    for (const p of pts) assert.ok(p.x >= box.left - 1 && p.x <= box.right + 1 && p.y >= box.top - 1 && p.y <= box.bottom + 1);
    const s = spline([a, ...pts, b]);
    // no spikes: nowhere does it turn tighter than a radius of about eight pixels
    assert.ok(sharpest(s) < 15, `${sharpest(s).toFixed(0)} degrees in one step (seed ${seed})`);
    const f = planFlight([a, ...pts, b], 2700), v = speeds(f);
    assert.ok(Math.max(...v) < (f.length / 2.7) * 1.9);
  }
  assert.equal(seen.size, 199);
});
