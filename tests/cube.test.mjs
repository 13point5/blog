import test from "node:test";
import assert from "node:assert/strict";
import { SIGHT, applyMove, castBox, dragMove, hitCube, inverse, isSolved, perform, randomMove, scramble, sight, solve, solvedCube } from "../lib/pixel/cube-model.ts";

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
  assert.deepEqual(hitCube(30, 17.4), { face: 0, c: [0, 0, 1] }, "top");
  assert.deepEqual(hitCube(41, 35.2), { face: 2, c: [1, 0, 0] }, "right");
  assert.deepEqual(hitCube(19, 35.2), { face: 1, c: [0, 1, 0] }, "left");
  // the top face's four corner pieces: far, right, near, left
  assert.deepEqual(hitCube(30, 9.4)?.c, [-1, -1, 1]);
  assert.deepEqual(hitCube(46, 17.4)?.c, [1, -1, 1]);
  assert.deepEqual(hitCube(30, 25.4)?.c, [1, 1, 1]);
  assert.deepEqual(hitCube(14, 17.4)?.c, [-1, 1, 1]);
  assert.equal(hitCube(2, 2), null);
  assert.equal(hitCube(58, 58), null);
});

test("the cube is drawn with all its edges the same length", () => {
  // where a corner of the cube lands on the drawing: the inverse of sight()
  const at = (x, y, z) => [30 + 2 * (x - y), 31 + x + y - Math.sqrt(5) * z];
  const len = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const along = len(at(0, 0, 11), at(11, 0, 11)), across = len(at(0, 0, 11), at(0, 11, 11)), up = len(at(11, 11, 0), at(11, 11, 11));
  assert.ok(Math.abs(along - across) < 1e-9 && Math.abs(along - up) < 1e-9, `${along} ${across} ${up}`);
  // and sight() really is the inverse: the line through a corner's pixel passes through the corner
  const o = sight(...at(11, 11, 11)), t = 11 / SIGHT[2];
  for (let k = 0; k < 3; k++) assert.ok(Math.abs(o[k] + t * SIGHT[k] - 11) < 1e-9);
});

test("lines of sight meet a box on the side facing the viewer", () => {
  // a thin slab on the floor is met on its top
  assert.deepEqual(castBox([5, 5, -20], [1, 1, 1], [0, 0, 0], [50, 50, 3]), { t: 23, axis: 2, sign: 1 });
  assert.equal(castBox([20, 0, 0], [1, 1, 1], [0, 0, 0], [11, 11, 11]), null);
});

test("the solver solves any scramble, by way of the cross, the first two layers, OLL and PLL", () => {
  for (let round = 0; round < 120; round++) {
    const cube = solvedCube();
    // outside layers only, or (every third round) any layer, which turns the centres over too
    if (round % 3) for (const m of scramble(30)) applyMove(cube, m);
    else for (let i = 0; i < 30; i++) applyMove(cube, randomMove());
    const { moves, stages } = solve(cube);
    assert.equal(stages.length, 4);
    assert.equal(stages[3], moves.length);
    // play it through, checking each stage as it finishes
    const centre = (s) => cube.find((p) => p.st.filter(Boolean).length === 1 && p.st[s] !== null).st[s];
    const solvedPiece = (p) => p.st.every((c, s) => c === null || c === centre(s));
    const bottom = () => { for (let s = 0; s < 6; s++) if (centre(s) === "#f2c14e") return s; };
    moves.forEach((m, i) => {
      applyMove(cube, m);
      const n = i + 1, axis = bottom() >> 1, low = bottom() % 2 ? -1 : 1;
      if (n === stages[0]) assert.ok(cube.filter((p) => p.p[axis] === low && p.st.filter(Boolean).length === 2).every(solvedPiece), "cross");
      if (n === stages[1]) assert.ok(cube.filter((p) => p.p[axis] !== -low).every(solvedPiece), "first two layers");
      if (n === stages[2]) assert.ok(cube.filter((p) => p.p[axis] === -low).every((p) => p.st[axis * 2 + (low > 0 ? 1 : 0)] === "#fdfbf7"), "top all one colour");
    });
    assert.ok(isSolved(cube), `round ${round}`);
    assert.ok(moves.length < 140, `a solve of ${moves.length} turns`);
  }
});

test("a scramble never turns the same layer twice running", () => {
  const s = scramble(200);
  assert.equal(s.length, 200);
  for (let i = 1; i < s.length; i++) assert.ok(s[i].axis !== s[i - 1].axis || s[i].layer !== s[i - 1].layer);
  assert.ok(s.every((m) => m.layer !== 0));
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

test("turning the whole cube over moves every piece and leaves it as solved as it was", () => {
  const cube = solvedCube();
  for (const axis of [0, 1, 2]) for (const dir of [1, -1]) {
    applyMove(cube, { axis, layer: 0, dir, whole: true });
    assert.ok(isSolved(cube));
  }
  applyMove(cube, { axis: 2, layer: 1, dir: 1 });
  const before = JSON.stringify(cube);
  for (let i = 0; i < 4; i++) applyMove(cube, { axis: 0, layer: 0, dir: 1, whole: true });
  assert.equal(JSON.stringify(cube), before, "four quarter turns over bring it back");
});

test("a performance turns the cube so that each part of the solve happens where it can be seen", () => {
  for (let round = 0; round < 80; round++) {
    const cube = solvedCube();
    if (round % 3) for (const m of scramble(30)) applyMove(cube, m);
    else for (let i = 0; i < 30; i++) applyMove(cube, randomMove());
    const scenes = perform(cube);
    assert.ok(scenes.length >= 2 && scenes.length <= 8);
    const centre = (s) => cube.find((p) => p.st.filter(Boolean).length === 1 && p.st[s] !== null).st[s];
    const right = (p) => p.st.every((c, s) => c === null || c === centre(s));
    const at = (x, y, z) => cube.find((p) => p.p[0] === x && p.p[1] === y && p.p[2] === z);
    scenes.forEach((scene, i) => {
      assert.ok(scene.look.every((m) => m.whole) && scene.look.length <= 4);
      assert.ok(scene.moves.every((m) => !m.whole && m.layer !== 0));
      for (const m of [...scene.look, ...scene.moves]) applyMove(cube, m);
      if (!scene.moves.length) return;
      // the yellow face is where the cross goes: is this the scene that made it?
      if (centre(4) === "#f2c14e") {
        assert.equal(i, 0, "only the first scene has the cross face on top");
        for (const [x, y] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) assert.ok(right(at(x, y, 1)), "the cross, made on top where it can be seen");
      } else if (!isSolved(cube) && scenes.slice(i + 1).some((sc) => sc.moves.length && sc.look.length)) {
        // a pair: it has just gone into the corner nearest the viewer
        if (i <= 4) assert.ok(right(at(1, 1, -1)) && right(at(1, 1, 0)), `pair ${i} at the front corner (round ${round})`);
      }
    });
    assert.ok(isSolved(cube), `round ${round}`);
    // the last scene is a turn right round, and nothing else
    assert.equal(scenes.at(-1).look.length, 4);
    assert.equal(scenes.at(-1).moves.length, 0);
  }
});
