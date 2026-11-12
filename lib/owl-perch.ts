// Where the owl stands. This is pure geometry with no DOM in it, so the rules
// can be tested on their own (see tests/owl-perch.test.mjs):
//
//   1. While any heading is fully on screen, the owl stands at a heading.
//   2. It stays at the heading it is on for as long as that heading is on screen.
//   3. It never covers anything: text, pictures, buttons.
//   4. Only when no heading is on screen does it go home (the caller sends it
//      to its place beside the name in the header).

export type Rect = { left: number; top: number; right: number; bottom: number };

/** One line of a heading: the box its letters fill, the line they sit on, and how high capitals reach. */
export type Line = Rect & { base: number; cap: number };
export type Heading = { id: number; lines: Line[] };

export type Layout = {
  /** headings in reading order, in screen coordinates */
  headings: Heading[];
  /** everything the owl must not cover, the headings' own lines included */
  obstacles: Rect[];
  /** the part of the screen the owl may use: below the header if it is showing */
  view: Rect;
  owl: { w: number; h: number };
  /** the heading the owl is on now, if any */
  current?: number | null;
  /** space kept between a line's last letter and the owl */
  gap?: number;
};

export type Perch = {
  heading: number;
  /** beside the end of a line, or standing on top of the heading */
  kind: "beside" | "above";
  /** centre of the owl */
  x: number;
  /** its feet */
  y: number;
};

export const perchRect = (p: { x: number; y: number }, owl: { w: number; h: number }): Rect => ({
  left: p.x - owl.w / 2, right: p.x + owl.w / 2, top: p.y - owl.h, bottom: p.y,
});

const overlaps = (a: Rect, b: Rect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** A heading counts as on screen only when every line of it is inside the usable view. */
export function isVisible(h: Heading, view: Rect) {
  return h.lines.length > 0 && h.lines.every((l) => l.top >= view.top && l.bottom <= view.bottom && l.right > view.left && l.left < view.right);
}

/** Every place the owl could stand at a heading, best first. */
export function candidates(h: Heading, layout: Layout): Perch[] {
  const { w } = layout.owl;
  const gap = layout.gap ?? 6;
  const out: Perch[] = [];
  // after the last word of a line, feet on the baseline: the last line first
  for (let i = h.lines.length - 1; i >= 0; i--) {
    const l = h.lines[i];
    out.push({ heading: h.id, kind: "beside", x: l.right + gap + w / 2, y: l.base });
  }
  // standing on top of the first line: at its right end, then at its start
  const first = h.lines[0];
  const rightEnd = Math.max(first.left, first.right - w) + w / 2;
  out.push({ heading: h.id, kind: "above", x: rightEnd, y: first.cap });
  if (first.left + w / 2 !== rightEnd) out.push({ heading: h.id, kind: "above", x: first.left + w / 2, y: first.cap });
  return out;
}

/** Is this spot inside the view and clear of everything, with a little air round it? */
export function isFree(p: Perch, layout: Layout) {
  const r = perchRect(p, layout.owl);
  const { view } = layout;
  if (r.left < view.left || r.right > view.right || r.top < view.top || r.bottom > view.bottom) return false;
  // a little air above and to the sides; its feet may touch what it stands on
  const probe = { left: r.left - 1, right: r.right + 2, top: r.top - 3, bottom: r.bottom - 1 };
  return !layout.obstacles.some((o) => overlaps(probe, o));
}

const firstFree = (h: Heading, layout: Layout) => candidates(h, layout).find((p) => isFree(p, layout)) ?? null;

/**
 * Choose the owl's place. Returns null only when it should go home: no heading
 * is on screen, or (rarely) none of the visible ones has anywhere free to stand.
 */
export function choosePerch(layout: Layout): Perch | null {
  const visible = layout.headings.filter((h) => isVisible(h, layout.view));
  // stay put while the heading it is on remains on screen
  const here = visible.find((h) => h.id === layout.current);
  if (here) {
    const p = firstFree(here, layout);
    if (p) return p;
  }
  for (const h of visible) {
    const p = firstFree(h, layout);
    if (p) return p;
  }
  return null;
}
