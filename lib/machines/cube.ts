import { assign, emit, setup } from "xstate";

// What the puzzle cube is doing, as a state machine: the order of things and
// the pauses between them. The component (app/components/cube.tsx) owns the
// cube itself and the turning of it; it makes the turns this machine asks for
// (by emitting "solve" or "scramble") and reports back when they are all made.
//
//   asleep ──SEEN──▶ solving ──DONE, solved──▶ admiring ──(a pause)──▶ scrambling
//                       ▲                                                  │
//                       └───────(a pause)── pondering ◀────────DONE────────┘
//
// A finger on it at any time puts it in "held": it drops what it was doing and
// waits. Left alone for a few seconds it goes back to solving, from wherever
// the cube now is, or to admiring it if the hand happened to solve it.

/** How long it sits solved, how long it looks at a new scramble before starting, and how long after a hand lets go it waits. */
export const ADMIRE = 2400, PONDER = 900, LEFT_ALONE = 3200;

export type CubeEvent =
  /** it has come on screen */
  | { type: "SEEN" }
  /** every turn it was asked to make has been made; is the cube now solved? */
  | { type: "DONE"; solved: boolean }
  /** a finger has come down on it */
  | { type: "HELD" }
  /** it has been given a turn by hand */
  | { type: "TURNED" };

export const cubeMachine = setup({
  types: {
    context: {} as { solved: boolean },
    events: {} as CubeEvent,
    emitted: {} as { type: "solve" } | { type: "scramble" },
  },
  delays: { ADMIRE, PONDER, LEFT_ALONE },
  guards: {
    solved: ({ event }) => event.type === "DONE" && event.solved,
    leftSolved: ({ context }) => context.solved,
  },
}).createMachine({
  id: "cube",
  initial: "asleep",
  context: { solved: false },
  on: { HELD: ".held", TURNED: ".held" },
  states: {
    // scrambled when the page loaded, and waiting to be looked at
    asleep: { on: { SEEN: "solving" } },
    solving: {
      entry: emit({ type: "solve" }),
      on: {
        // (if the turns it was given somehow did not solve it, it thinks again)
        DONE: [{ guard: "solved", target: "admiring" }, { target: "solving", reenter: true }],
      },
    },
    admiring: { after: { ADMIRE: "scrambling" } },
    scrambling: { entry: emit({ type: "scramble" }), on: { DONE: "pondering" } },
    pondering: { after: { PONDER: "solving" } },
    held: {
      // every touch starts the wait again
      on: {
        HELD: { target: "held", reenter: true },
        TURNED: { target: "held", reenter: true },
        DONE: { actions: assign(({ event }) => ({ solved: event.solved })) },
      },
      after: { LEFT_ALONE: [{ guard: "leftSolved", target: "admiring" }, { target: "solving" }] },
    },
  },
});
