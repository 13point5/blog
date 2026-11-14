import { assign, emit, raise, setup } from "xstate";

// What the owl is doing, as a state machine. It lives as long as the site is
// open, not as long as a page is: moving between pages is something that
// happens to it (the PAGE event), not something that restarts it. So whatever
// it has begun, it finishes: a remark keeps to its timing and then stops,
// whichever page it is on by then.
//
// It does three things at once, each with its own states:
//
//   body     where it is: at home beside the name, flying, perched at a
//            heading, or roosting on the signpost
//   welcome  the lap of honour, owed once, on the home page only
//   voice    what it is saying, one line after another, then silence
//
// The page code does the looking and the flying, and tells the machine what
// happened (TOOK_OFF, LANDED, SCROLLED...). The machine decides what follows,
// and asks for a lap by emitting "lap".

/** Which way the speech bubble opens: to the left or right of the owl, above it or below. */
export type Place = { side: "left" | "right"; below: boolean };
export type Spot = "home" | "perched" | "roost";

/** What the owl says after its welcome lap, one line after another: its own hello-world, then a hint. */
export const GREETING = ["hoo-llo, world!", "tap me for a map"];
/** How long it waits at home before setting off on the lap, and how long each line stays up. */
export const BEFORE_LAP = 1100, LINE = 2600;

export type OwlEvent =
  /** a page has been shown: the first one, or one arrived at by a link */
  | { type: "PAGE"; home: boolean; still: boolean }
  | { type: "SCROLLED" }
  | { type: "TOOK_OFF" }
  /** it has come down; `room` is where a bubble could go without covering anything, if anywhere */
  | { type: "LANDED"; at: Spot; room: Place | null }
  /** it has been put somewhere without flying there (a new page, say); `room` as for LANDED */
  | { type: "SETTLED"; at: Spot; room: Place | null }
  /** the lap it was asked for cannot be flown after all */
  | { type: "GROUNDED" }
  | { type: "SAY"; lines: string[]; place: Place }
  | { type: "HUSH" };

export const owlMachine = setup({
  types: {
    context: {} as { lines: string[]; line: number; place: Place | null },
    events: {} as OwlEvent,
    emitted: {} as { type: "lap" },
  },
  delays: { BEFORE_LAP, LINE },
  guards: {
    onHomePage: ({ event }) => event.type === "PAGE" && event.home,
    onHomePageAndFreeToMove: ({ event }) => event.type === "PAGE" && event.home && !event.still,
    leftHomePage: ({ event }) => event.type === "PAGE" && !event.home,
    at: ({ event }, spot: Spot) => (event.type === "LANDED" || event.type === "SETTLED") && event.at === spot,
    hasRoom: ({ event }) => (event.type === "LANDED" || event.type === "SETTLED") && event.room !== null,
    hasMoreToSay: ({ context }) => context.line + 1 < context.lines.length,
  },
}).createMachine({
  id: "owl",
  type: "parallel",
  context: { lines: [], line: 0, place: null },
  states: {
    body: {
      initial: "home",
      on: {
        TOOK_OFF: ".flying",
        SETTLED: [
          { guard: { type: "at", params: "home" }, target: ".home" },
          { guard: { type: "at", params: "roost" }, target: ".roost" },
          { target: ".perched" },
        ],
      },
      states: {
        home: {},
        perched: {},
        roost: {},
        flying: {
          on: {
            LANDED: [
              { guard: { type: "at", params: "home" }, target: "home" },
              { guard: { type: "at", params: "roost" }, target: "roost" },
              { target: "perched" },
            ],
          },
        },
      },
    },

    welcome: {
      initial: "owed",
      states: {
        // not given yet: it waits for the home page
        owed: {
          on: {
            PAGE: [
              { guard: "onHomePageAndFreeToMove", target: "waiting" },
              // with motion turned off there is no lap to fly, and that counts as having had it
              { guard: "onHomePage", target: "given" },
            ],
          },
        },
        // at home beside the name for a moment first
        waiting: {
          after: { BEFORE_LAP: "lap" },
          on: {
            SCROLLED: "given", // the reader has got on with it
            PAGE: { guard: "leftHomePage", target: "owed" }, // gone before it began: still owed
          },
        },
        // out over the page and round; then, where there is room, a word
        lap: {
          entry: emit({ type: "lap" }),
          on: {
            LANDED: {
              target: "given",
              actions: raise(({ event }) => (event.room ? { type: "SAY" as const, lines: GREETING, place: event.room } : { type: "HUSH" as const })),
            },
            SCROLLED: "given",
            GROUNDED: "given",
          },
        },
        given: {},
      },
    },

    voice: {
      initial: "silent",
      states: {
        silent: {
          entry: assign({ lines: [], line: 0, place: null }),
          on: {
            SAY: { target: "speaking", actions: assign(({ event }) => ({ lines: event.lines, line: 0, place: event.place })) },
          },
        },
        speaking: {
          // one line at a time; the timer belongs to the owl, so nothing the page does can strand a line on screen
          after: {
            LINE: [
              { guard: "hasMoreToSay", target: "speaking", reenter: true, actions: assign(({ context }) => ({ line: context.line + 1 })) },
              { target: "silent" },
            ],
          },
          on: {
            SAY: { target: "speaking", reenter: true, actions: assign(({ event }) => ({ lines: event.lines, line: 0, place: event.place })) },
            HUSH: "silent",
            SCROLLED: "silent",
            // it has moved while talking: the bubble goes wherever there is room at the new spot, or goes away
            LANDED: [{ guard: "hasRoom", actions: assign(({ event }) => ({ place: event.room })) }, { target: "silent" }],
            SETTLED: [{ guard: "hasRoom", actions: assign(({ event }) => ({ place: event.room })) }, { target: "silent" }],
          },
        },
      },
    },
  },
});

/** What is in the speech bubble just now, if anything. */
export const saying = (s: { matches: (v: { voice: "speaking" }) => boolean; context: { lines: string[]; line: number } }) =>
  s.matches({ voice: "speaking" }) ? (s.context.lines[s.context.line] ?? null) : null;
