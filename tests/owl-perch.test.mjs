// Run with `pnpm test` (Node 22.18+ imports the TypeScript module directly).
import test from "node:test";
import assert from "node:assert/strict";
import { candidates, choosePerch, isFree, isVisible, perchRect } from "../lib/owl-perch.ts";

const OWL = { w: 46, h: 46 };
const VIEW = { left: 4, top: 76, right: 386, bottom: 838 }; // a phone, header showing

/** A line of text 34px tall at (left, top), `width` wide. */
const line = (left, top, width, height = 34) => ({ left, top, right: left + width, bottom: top + height, base: top + height * 0.8, cap: top + height * 0.2 });
const heading = (id, ...lines) => ({ id, lines });
/** A layout whose obstacles are the headings' own lines plus any extra boxes. */
const layout = (headings, extra = [], more = {}) => ({
  headings,
  obstacles: [...headings.flatMap((h) => h.lines.map((l) => ({ left: l.left, right: l.right, top: l.cap, bottom: l.bottom }))), ...extra],
  view: VIEW,
  owl: OWL,
  ...more,
});
const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

test("goes home when no heading is on screen", () => {
  assert.equal(choosePerch(layout([])), null);
  assert.equal(choosePerch(layout([heading(0, line(20, 900, 200))])), null);
});

test("a heading hidden under the header does not count as on screen", () => {
  const h = heading(0, line(20, 40, 200));
  assert.equal(isVisible(h, VIEW), false);
  assert.equal(choosePerch(layout([h])), null);
  // with the header out of the way the same heading counts
  assert.equal(isVisible(h, { ...VIEW, top: 4 }), true);
});

test("stands after the last word, feet on the baseline", () => {
  const l = line(20, 300, 150);
  const p = choosePerch(layout([heading(0, l)]));
  assert.equal(p.kind, "beside");
  assert.equal(p.y, l.base);
  assert.ok(perchRect(p, OWL).left >= l.right + 6);
});

test("a wrapped heading: beside the last line when the line above ends short of it", () => {
  const h = heading(0, line(20, 300, 120), line(20, 336, 150));
  const p = choosePerch(layout([h]));
  assert.equal(p.kind, "beside");
  assert.equal(p.y, h.lines[1].base);
});

test("a wrapped heading whose upper line is longer: never tucks under it", () => {
  // the owl is taller than a line, so beside the last line its head would cover the line above
  const h = heading(0, line(20, 300, 300), line(20, 336, 200));
  const l = layout([h]);
  const p = choosePerch(l);
  assert.ok(p, "it must still perch: the heading is on screen");
  assert.ok(!l.obstacles.some((o) => overlaps(perchRect(p, OWL), o)));
  assert.equal(p.kind, "beside");
  assert.equal(p.y, h.lines[0].base, "it moves up beside the longer line, where there is room");
});

test("full-width lines: stands on top of the heading instead", () => {
  const h = heading(0, line(20, 300, 350), line(20, 336, 345));
  const p = choosePerch(layout([h]));
  assert.equal(p.kind, "above");
  assert.equal(p.y, h.lines[0].cap);
});

test("stays on its heading while that heading is on screen, even if an earlier one appears", () => {
  const a = heading(0, line(20, 200, 150)), b = heading(1, line(20, 600, 150));
  assert.equal(choosePerch(layout([a, b])).heading, 0, "no history: the first one on screen");
  assert.equal(choosePerch(layout([a, b], [], { current: 1 })).heading, 1, "already on the second: it stays");
});

test("moves on once its heading leaves the screen", () => {
  const gone = heading(0, line(20, -100, 150)), next = heading(1, line(20, 500, 150));
  assert.equal(choosePerch(layout([gone, next], [], { current: 0 })).heading, 1);
});

test("never stands on a picture or a button that sits beside the heading", () => {
  const l = line(20, 300, 150);
  const button = { left: 180, top: 290, right: 380, bottom: 340 };
  const lay = layout([heading(0, l)], [button]);
  const p = choosePerch(lay);
  assert.ok(p);
  assert.ok(!overlaps(perchRect(p, OWL), button));
  assert.equal(p.kind, "above");
});

test("goes home rather than cover something, when a heading is boxed in on every side", () => {
  const h = heading(0, line(20, 300, 350));
  const textAbove = { left: 20, top: 250, right: 370, bottom: 296 };
  assert.equal(choosePerch(layout([h], [textAbove])), null);
});

test("every candidate it accepts is inside the view and clear of everything (random layouts)", () => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let n = 0; n < 400; n++) {
    const headings = [], extra = [];
    let y = 80 + rnd() * 200;
    for (let i = 0; i < 4; i++) {
      const lines = [];
      const count = 1 + Math.floor(rnd() * 3);
      for (let k = 0; k < count; k++) lines.push(line(20, y + k * 36, 80 + rnd() * 270));
      headings.push(heading(i, ...lines));
      y += count * 36 + 20 + rnd() * 60;
      for (let k = 0; k < 3; k++) { extra.push({ left: 20, top: y, right: 20 + 150 + rnd() * 200, bottom: y + 22 }); y += 26; }
      y += rnd() * 120;
    }
    const lay = layout(headings, extra, { current: rnd() < 0.5 ? Math.floor(rnd() * 4) : null });
    const p = choosePerch(lay);
    const anyVisible = headings.some((h) => isVisible(h, VIEW));
    if (!anyVisible) assert.equal(p, null);
    if (!p) continue;
    const r = perchRect(p, OWL);
    assert.ok(r.left >= VIEW.left && r.right <= VIEW.right && r.top >= VIEW.top && r.bottom <= VIEW.bottom, "inside the view");
    assert.ok(!lay.obstacles.some((o) => overlaps(r, o)), "covers nothing");
    assert.ok(isVisible(headings[p.heading], VIEW), "only at a heading that is on screen");
    assert.ok(candidates(headings[p.heading], lay).some((c) => c.x === p.x && c.y === p.y) && isFree(p, lay));
  }
});

test("with clear space above every heading, a visible heading always gets the owl", () => {
  let seed = 3;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let n = 0; n < 300; n++) {
    const headings = [];
    let y = 140 + rnd() * 100;
    for (let i = 0; i < 3; i++) {
      const count = 1 + Math.floor(rnd() * 3);
      headings.push(heading(i, ...Array.from({ length: count }, (_, k) => line(20, y + k * 36, 100 + rnd() * 250))));
      y += count * 36 + 60 + rnd() * 200; // at least an owl's height of air before the next
    }
    const lay = layout(headings);
    if (headings.some((h) => isVisible(h, VIEW))) assert.ok(choosePerch(lay), "a heading is on screen, so the owl must be at one");
  }
});
