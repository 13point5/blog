import test from "node:test";
import assert from "node:assert/strict";
import { applyMove, castBox, dragMove, hitCube, inverse, isSolved, randomMove, sight, solvedCube } from "../lib/pixel/cube-model.ts";

test("a fresh cube is solved, and one turn unsolves it", () => {
  const cube = solvedCube();
  assert.ok(isSolved(cube));
  applyMove(cube, { axis: 2, layer: 1, dir: 1 });
  assert.ok(!isSolved(cube));
});

test("four quarter turns of any layer come back to where they started", () => {
  for (const axis of [0, 1, 2]) for (const layer of [-1, 0, 1]) for (const dir of [1, -1]) {
    const cube = solvedCube();
    for (let i = 0; i < 4; i++) applyMove(cube, { axis, layer, dir });
    assert.ok(isSolved(cube), `axis ${axis} layer ${layer} dir ${dir}`);
  }
});

test("undoing a long random scramble in reverse solves it", () => {
  for (let round = 0; round < 50; round++) {
    const cube = solvedCube();
    const done = [];
    for (let i = 0; i < 30; i++) { const m = randomMove(done.at(-1)); applyMove(cube, m); done.push(m); }
    while (done.length) applyMove(cube, inverse(done.pop()));
    assert.ok(isSolved(cube));
  }
});

test("every piece keeps exactly its own stickers", () => {
  const cube = solvedCube();
  for (let i = 0; i < 40; i++) applyMove(cube, randomMove());
  const count = cube.flatMap((p) => p.st).filter(Boolean).length;
  assert.equal(count, 54);
  for (const p of cube) assert.equal(p.st.filter(Boolean).length, p.p.filter((c) => c !== 0).length);
});

test("a point in the middle of each visible face hits that face's middle piece, and the corners of the box miss", () => {
  assert.deepEqual(hitCube(30, 19), { face: 0, c: [0, 0, 1] }, "top");
  assert.deepEqual(hitCube(41, 35.5), { face: 2, c: [1, 0, 0] }, "right");
  assert.deepEqual(hitCube(19, 35.5), { face: 1, c: [0, 1, 0] }, "left");
  // the top face's four corner pieces: far, right, near, left
  assert.deepEqual(hitCube(30, 11)?.c, [-1, -1, 1]);
  assert.deepEqual(hitCube(46, 19)?.c, [1, -1, 1]);
  assert.deepEqual(hitCube(30, 27)?.c, [1, 1, 1]);
  assert.deepEqual(hitCube(14, 19)?.c, [-1, 1, 1]);
  assert.equal(hitCube(2, 2), null);
  assert.equal(hitCube(58, 58), null);
});

test("lines of sight meet a box on the side facing the viewer", () => {
  // straight through the middle of the cube: out through the corner nearest the viewer
  const h = castBox(sight(30, 30), [1, 1, 1], [0, 0, 0], [11, 11, 11]);
  assert.ok(h && Math.abs(h.t - 11) < 1e-9);
  // a thin slab on the floor is met on its top
  assert.deepEqual(castBox([5, 5, -20], [1, 1, 1], [0, 0, 0], [50, 50, 3]), { t: 23, axis: 2, sign: 1 });
  assert.equal(castBox([20, 0, 0], [1, 1, 1], [0, 0, 0], [11, 11, 11]), null);
});

test("dragging a face turns the layer under the finger, in the finger's direction", () => {
  // top face, dragged along the screen's x axis direction (right and down): the stickers on top move toward +x
  const top = { face: 0, c: [0, -1, 1] };
  assert.deepEqual(dragMove(top, 10, 5), { axis: 1, layer: -1, dir: 1 });
  assert.deepEqual(dragMove(top, -10, -5), { axis: 1, layer: -1, dir: -1 });
  // right face, dragged straight up: the layer through that column turns about y
  const right = { face: 2, c: [1, 0, -1] };
  assert.deepEqual(dragMove(right, 0, -12), { axis: 1, layer: 0, dir: -1 });
  // left face, dragged straight up: the stickers go up, which is a positive turn about x
  const left = { face: 1, c: [1, 1, 0] };
  assert.deepEqual(dragMove(left, 0, -12), { axis: 0, layer: 1, dir: 1 });
});
