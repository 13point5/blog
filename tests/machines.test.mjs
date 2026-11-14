import test from "node:test";
import assert from "node:assert/strict";
import { SimulatedClock, createActor } from "xstate";
import { BEFORE_LAP, GREETING, LINE, owlMachine, saying } from "../lib/machines/owl.ts";

const ROOM = { side: "left", below: false };
/** an owl with a clock that only moves when told to, and a note of every lap it asks for */
function owl() {
  const clock = new SimulatedClock(), actor = createActor(owlMachine, { clock }), laps = [];
  actor.on("lap", () => laps.push(clock.now()));
  actor.start();
  const s = () => actor.getSnapshot();
  return { actor, clock, laps, s, send: (e) => actor.send(e), says: () => saying(s()) };
}
/** fly the welcome lap and land with room to speak */
function welcomed() {
  const o = owl();
  o.send({ type: "PAGE", home: true, still: false });
  o.clock.increment(BEFORE_LAP);
  o.send({ type: "TOOK_OFF" });
  o.send({ type: "LANDED", at: "perched", room: ROOM });
  return o;
}

test("owl: the welcome lap is flown once, on the home page, after a moment at home", () => {
  const o = owl();
  assert.ok(o.s().matches({ welcome: "owed", body: "home", voice: "silent" }));
  o.send({ type: "PAGE", home: true, still: false });
  assert.ok(o.s().matches({ welcome: "waiting" }));
  o.clock.increment(BEFORE_LAP - 1);
  assert.equal(o.laps.length, 0);
  o.clock.increment(1);
  assert.equal(o.laps.length, 1);
  o.send({ type: "TOOK_OFF" });
  assert.ok(o.s().matches({ welcome: "lap", body: "flying" }));
  o.send({ type: "LANDED", at: "perched", room: ROOM });
  assert.ok(o.s().matches({ welcome: "given", body: "perched", voice: "speaking" }));
  assert.equal(o.says(), GREETING[0]);
  // coming back to the home page later does not earn another
  o.send({ type: "PAGE", home: false, still: false });
  o.send({ type: "PAGE", home: true, still: false });
  o.clock.increment(BEFORE_LAP * 3);
  assert.equal(o.laps.length, 1);
});

test("owl: no welcome away from the home page, but it is still owed there", () => {
  const o = owl();
  o.send({ type: "PAGE", home: false, still: false });
  o.clock.increment(10000);
  assert.equal(o.laps.length, 0);
  assert.ok(o.s().matches({ welcome: "owed", voice: "silent" }));
  o.send({ type: "PAGE", home: true, still: false });
  o.clock.increment(BEFORE_LAP);
  assert.equal(o.laps.length, 1);
});

test("owl: leaving before the lap begins keeps it owed; scrolling, or motion turned off, forgoes it", () => {
  let o = owl();
  o.send({ type: "PAGE", home: true, still: false });
  o.clock.increment(500);
  o.send({ type: "PAGE", home: false, still: false });
  o.clock.increment(5000);
  assert.equal(o.laps.length, 0);
  assert.ok(o.s().matches({ welcome: "owed" }));

  o = owl();
  o.send({ type: "PAGE", home: true, still: false });
  o.send({ type: "SCROLLED" });
  o.clock.increment(5000);
  assert.equal(o.laps.length, 0);
  assert.ok(o.s().matches({ welcome: "given" }));

  o = owl();
  o.send({ type: "PAGE", home: true, still: true });
  o.clock.increment(5000);
  assert.equal(o.laps.length, 0);
  assert.ok(o.s().matches({ welcome: "given" }));
});

test("owl: what it says runs to the end and stops, even if the page is changed under it", () => {
  // the bug this machine was written for: go to another page while the first line is up, and it stayed up for ever
  const o = welcomed();
  assert.equal(o.says(), GREETING[0]);
  o.clock.increment(600);
  o.send({ type: "PAGE", home: false, still: false }); // off to the blog
  assert.equal(o.says(), GREETING[0], "still saying it");
  // on the new page it is put straight at the heading there
  o.send({ type: "SETTLED", at: "perched", room: { side: "right", below: true } });
  assert.deepEqual(o.s().context.place, { side: "right", below: true }, "the bubble moves to where there is room");
  assert.equal(o.says(), GREETING[0]);
  o.clock.increment(LINE - 600);
  assert.equal(o.says(), GREETING[1], "on to the next line, on time");
  o.send({ type: "PAGE", home: true, still: false }); // and back again
  o.clock.increment(LINE);
  assert.equal(o.says(), null, "and then silence");
  assert.ok(o.s().matches({ voice: "silent" }));
  assert.deepEqual(o.s().context.lines, []);
});

test("owl: each line stays up for exactly its time", () => {
  const o = welcomed();
  for (const line of GREETING) {
    assert.equal(o.says(), line);
    o.clock.increment(LINE - 1);
    assert.equal(o.says(), line);
    o.clock.increment(1);
  }
  assert.equal(o.says(), null);
});

test("owl: scrolling, a tap, or landing somewhere with no room all cut it short", () => {
  for (const event of [{ type: "SCROLLED" }, { type: "HUSH" }, { type: "LANDED", at: "home", room: null }, { type: "SETTLED", at: "perched", room: null }]) {
    const o = welcomed();
    if (event.type === "LANDED") o.send({ type: "TOOK_OFF" });
    o.send(event);
    assert.equal(o.says(), null, event.type);
    o.clock.increment(LINE * 3);
    assert.equal(o.says(), null, "and it does not start up again");
  }
});

test("owl: a lap with nowhere to put a bubble ends in silence; a lap that cannot be flown is let go", () => {
  let o = owl();
  o.send({ type: "PAGE", home: true, still: false });
  o.clock.increment(BEFORE_LAP);
  o.send({ type: "TOOK_OFF" });
  o.send({ type: "LANDED", at: "perched", room: null });
  assert.ok(o.s().matches({ welcome: "given", voice: "silent" }));

  o = owl();
  o.send({ type: "PAGE", home: true, still: false });
  o.clock.increment(BEFORE_LAP);
  o.send({ type: "GROUNDED" });
  assert.ok(o.s().matches({ welcome: "given", voice: "silent", body: "home" }));
});

test("owl: where it is follows what it is told, and it can only land from the air", () => {
  const o = owl();
  o.send({ type: "LANDED", at: "roost", room: null });
  assert.ok(o.s().matches({ body: "home" }), "landing means nothing if it was not flying");
  o.send({ type: "TOOK_OFF" });
  assert.ok(o.s().matches({ body: "flying" }));
  o.send({ type: "LANDED", at: "roost", room: null });
  assert.ok(o.s().matches({ body: "roost" }));
  o.send({ type: "SETTLED", at: "perched", room: null });
  assert.ok(o.s().matches({ body: "perched" }));
  o.send({ type: "TOOK_OFF" });
  o.send({ type: "TOOK_OFF" });
  assert.ok(o.s().matches({ body: "flying" }), "changing course in the air is still flying");
  o.send({ type: "SETTLED", at: "home", room: null });
  assert.ok(o.s().matches({ body: "home" }));
});

// --- the cube -------------------------------------------------------------------
import { ADMIRE, LEFT_ALONE, PONDER, cubeMachine } from "../lib/machines/cube.ts";
import { GIVE_UP, SWING, bookMachine } from "../lib/machines/book.ts";

function cube() {
  const clock = new SimulatedClock(), actor = createActor(cubeMachine, { clock }), asked = [];
  actor.on("solve", () => asked.push("solve"));
  actor.on("scramble", () => asked.push("scramble"));
  actor.start();
  return { clock, asked, at: () => actor.getSnapshot().value, send: (e) => actor.send(e) };
}

test("cube: nothing until it is seen; then solve, admire, scramble, ponder, and round again", () => {
  const c = cube();
  c.clock.increment(60000);
  assert.equal(c.at(), "asleep");
  assert.deepEqual(c.asked, []);
  c.send({ type: "SEEN" });
  assert.equal(c.at(), "solving");
  c.send({ type: "DONE", solved: true });
  assert.equal(c.at(), "admiring");
  c.clock.increment(ADMIRE - 1);
  assert.equal(c.at(), "admiring");
  c.clock.increment(1);
  assert.equal(c.at(), "scrambling");
  c.send({ type: "DONE", solved: false });
  assert.equal(c.at(), "pondering");
  c.clock.increment(PONDER);
  assert.equal(c.at(), "solving");
  assert.deepEqual(c.asked, ["solve", "scramble", "solve"]);
  // seeing it again (scrolled away and back) changes nothing
  c.send({ type: "SEEN" });
  assert.deepEqual(c.asked, ["solve", "scramble", "solve"]);
});

test("cube: if its turns did not solve it, it thinks again rather than admiring a muddle", () => {
  const c = cube();
  c.send({ type: "SEEN" });
  c.send({ type: "DONE", solved: false });
  assert.equal(c.at(), "solving");
  assert.deepEqual(c.asked, ["solve", "solve"]);
});

test("cube: a hand on it stops it; every touch starts the wait again; left alone it carries on from where it is", () => {
  const c = cube();
  c.send({ type: "SEEN" });
  c.send({ type: "HELD" });
  assert.equal(c.at(), "held");
  c.clock.increment(LEFT_ALONE - 100);
  c.send({ type: "TURNED" });
  c.send({ type: "DONE", solved: false });
  c.clock.increment(LEFT_ALONE - 100);
  assert.equal(c.at(), "held", "the wait began again at the last touch");
  c.clock.increment(100);
  assert.equal(c.at(), "solving");
  assert.deepEqual(c.asked, ["solve", "solve"]);
});

test("cube: solved by hand, it is admired and then scrambled like any other", () => {
  const c = cube();
  c.send({ type: "SEEN" });
  c.send({ type: "TURNED" });
  c.send({ type: "DONE", solved: true });
  c.clock.increment(LEFT_ALONE);
  assert.equal(c.at(), "admiring");
  c.clock.increment(ADMIRE);
  assert.equal(c.at(), "scrambling");
  // and a hand on it while it is scrambling or admiring stops that too
  c.send({ type: "HELD" });
  assert.equal(c.at(), "held");
});

// --- the book -------------------------------------------------------------------
function book(blog) {
  const clock = new SimulatedClock(), actor = createActor(bookMachine, { clock, input: { blog } }), went = [];
  actor.on("go", () => went.push(clock.now()));
  actor.start();
  return { clock, went, s: () => actor.getSnapshot(), send: (e) => actor.send(e) };
}

test("book: it starts open inside the blog and closed anywhere else", () => {
  assert.equal(book(true).s().value, "open");
  assert.equal(book(false).s().value, "closed");
});

test("book: tapped, the cover swings open first and only then does it go to the blog", () => {
  const b = book(false);
  b.send({ type: "TAP" });
  assert.equal(b.s().value, "opening");
  assert.equal(b.s().context.taps, 1);
  b.clock.increment(SWING - 1);
  assert.deepEqual(b.went, []);
  b.clock.increment(1);
  assert.deepEqual(b.went, [SWING]);
  assert.equal(b.s().value, "leaving");
  b.send({ type: "PAGE", blog: true });
  assert.equal(b.s().value, "open");
  // out of the blog again, it shuts
  b.send({ type: "PAGE", blog: false });
  assert.equal(b.s().value, "closed");
});

test("book: it cannot be tapped open twice, and taps inside the blog are left to the link", () => {
  const b = book(false);
  b.send({ type: "TAP" });
  assert.equal(b.s().can({ type: "TAP" }), false);
  b.send({ type: "TAP" });
  b.clock.increment(SWING);
  assert.equal(b.went.length, 1);
  assert.equal(b.s().context.taps, 1);
  assert.equal(book(true).s().can({ type: "TAP" }), false);
});

test("book: if the blog never arrives it shuts again and can be tried again", () => {
  const b = book(false);
  b.send({ type: "TAP" });
  b.clock.increment(SWING);
  assert.equal(b.s().value, "leaving");
  b.clock.increment(GIVE_UP);
  assert.equal(b.s().value, "closed");
  b.send({ type: "TAP" });
  assert.equal(b.s().value, "opening");
  assert.equal(b.s().context.taps, 2);
});
