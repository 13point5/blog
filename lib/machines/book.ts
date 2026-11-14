import { assign, emit, setup } from "xstate";

// The book in the header that is the link to the blog. Tapped on any other
// page, its cover swings open first and only then does the blog appear; inside
// the blog it lies open. As a state machine:
//
//   closed ──TAP──▶ opening ──(the swing)──▶ leaving ──PAGE, the blog──▶ open
//      ▲                                        │                         │
//      └────────── PAGE, not the blog, or it never arrives ◀──────────────┘
//
// The header tells it which page is showing (PAGE) and goes to the blog when it
// emits "go".

/** How long the cover takes to swing open, and how long to wait for the blog before giving up on it. */
export const SWING = 380, GIVE_UP = 5000;

export type BookEvent = { type: "TAP" } | { type: "PAGE"; blog: boolean };

export const bookMachine = setup({
  types: {
    context: {} as { taps: number; blog: boolean },
    events: {} as BookEvent,
    input: {} as { blog: boolean },
    emitted: {} as { type: "go" },
  },
  delays: { SWING, GIVE_UP },
  guards: {
    startsInTheBlog: ({ context }) => context.blog,
    inTheBlog: ({ event }) => event.type === "PAGE" && event.blog,
    outOfTheBlog: ({ event }) => event.type === "PAGE" && !event.blog,
  },
}).createMachine({
  id: "book",
  // `taps` counts the times it has been opened by a tap: the drawing starts its swing when the count goes up
  context: ({ input }) => ({ taps: 0, blog: input.blog }),
  initial: "unknown",
  states: {
    // which way it starts depends on the page the site was opened at
    unknown: { always: [{ guard: "startsInTheBlog", target: "open" }, { target: "closed" }] },
    closed: {
      on: {
        TAP: { target: "opening", actions: assign(({ context }) => ({ taps: context.taps + 1 })) },
        PAGE: { guard: "inTheBlog", target: "open" },
      },
    },
    opening: {
      after: { SWING: "leaving" },
      on: { PAGE: { guard: "inTheBlog", target: "open" } },
    },
    leaving: {
      entry: emit({ type: "go" }),
      after: { GIVE_UP: "closed" },
      on: { PAGE: { guard: "inTheBlog", target: "open" } },
    },
    open: { on: { PAGE: { guard: "outOfTheBlog", target: "closed" } } },
  },
});
