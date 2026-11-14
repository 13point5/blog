// End-to-end check of the owl on the real pages, at phone and desktop sizes.
//
//   pnpm build && pnpm start        (in one terminal)
//   pnpm test:e2e                   (in another; BASE_URL defaults to http://localhost:3000)
//
// Needs Playwright with a Chromium build (`npx playwright install chromium`).
// The welcome (a lap of the page and a word) is for the home page only: it
// checks that the owl gives it there and nowhere else, and that its speech
// bubble covers no text.
// Then, at every scroll position, going down and coming back up, it asserts:
//   - if a heading is fully on screen (with an owl's height of room above it),
//     the owl is at a heading, not in the header
//   - if none is, the owl is in its slot beside the name, pinned to the screen
//   - whenever the signpost at the foot of the page has room for it, it sits there
//   - the owl never covers text, a picture or a button
//   - it does not leave a heading that is still on screen

import { createRequire } from "node:module";

let chromium;
try {
  ({ chromium } = createRequire(import.meta.url)("playwright"));
} catch {
  console.error("Playwright is not installed; run `pnpm add -D playwright && npx playwright install chromium` to use this check.");
  process.exit(2);
}

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PAGES = ["/", "/blog", "/blog/gdpx", "/blog/grpo-from-scratch", "/blog/vibe-rl"];
const VIEWPORTS = [{ width: 390, height: 844 }, { width: 1440, height: 900 }];
const failures = [];
let checks = 0;

/** Read the owl and the page independently of the site's own logic. */
const probe = () => {
  const OWL_H = 46;
  const owl = document.querySelector("[data-owl]");
  const body = owl.querySelector("button").getBoundingClientRect();
  const header = document.querySelector("header");
  const top = (header.dataset.hidden !== "true" ? header.offsetHeight : 0) + 4;
  const vh = innerHeight;
  const range = document.createRange();
  // the part of a box that actually shows, after scrolling or collapsed ancestors cut it off
  const shown = (r, el) => {
    const o = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.overflowX === "visible" && cs.overflowY === "visible") continue;
      const c = p.getBoundingClientRect();
      o.left = Math.max(o.left, c.left); o.top = Math.max(o.top, c.top); o.right = Math.min(o.right, c.right); o.bottom = Math.min(o.bottom, c.bottom);
    }
    return o.right - o.left >= 1 && o.bottom - o.top >= 1 ? o : null;
  };
  // headings fully on screen, with an owl's height of room above the first baseline
  const headings = [...document.querySelectorAll("[data-perch], .post-body h1, .post-body h2, .post-body h3")];
  const onScreen = (el) => {
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter((r) => r.width > 1 && r.height > 1).sort((p, q) => p.top - q.top);
    if (!rects.length) return false;
    const first = rects[0];
    return first.bottom - first.height * 0.2 - OWL_H >= top && rects.every((r) => r.top >= top && r.bottom <= vh - 6);
  };
  const visible = headings.map((el, i) => (onScreen(el) ? i : -1)).filter((i) => i >= 0);
  // anything showing under the owl's body
  const box = { left: body.left + 2, right: body.right - 2, top: body.top + 2, bottom: body.bottom - 3 };
  const over = (r) => r && r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > box.top;
  const hits = [];
  if (box.bottom > 0 && box.top < vh && owl.dataset.owlState === "perched") {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (!n.textContent.trim() || n.parentElement.closest("header, [data-owl-menu]")) continue;
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (over(shown({ left: r.left, right: r.right, top: r.top + r.height * 0.22, bottom: r.bottom - r.height * 0.08 }, n.parentElement))) hits.push("text: " + n.textContent.trim().slice(0, 28));
      }
    }
    for (const el of document.querySelectorAll("main canvas, main img, main svg, main button, main pre, main table, footer canvas")) {
      if (over(shown(el.getBoundingClientRect(), el.parentElement))) hits.push(el.tagName.toLowerCase());
    }
  }
  // the signpost in the castle scene: is there room for the owl on it right now?
  let roost = false;
  const scene = document.querySelector('canvas[data-scene="hogwarts"]');
  if (scene) {
    const r = scene.getBoundingClientRect();
    const k = r.width / scene.width;
    const signTop = r.top + 62 * k, signX = r.left + (Math.floor(scene.width / 2) - 61.5) * k;
    roost = signTop - OWL_H >= top && signTop + 9 * k <= vh - 6 && signX - 23 >= 4 && signX + 23 <= innerWidth - 4;
  }
  const slot = document.querySelector("[data-owl-home]").getBoundingClientRect();
  const name = header.querySelector("a").getBoundingClientRect();
  return {
    state: owl.dataset.owlState, heading: owl.dataset.owlHeading, visible, roost, hits: [...new Set(hits)],
    atSlot: Math.abs(body.left - slot.left) < 3 && Math.abs(body.bottom - slot.bottom) < 3,
    slotBesideName: slot.left - name.right >= 0 && slot.left - name.right < 24,
    // where its body is on the page, to tell later whether it could have stayed
    bodyTop: body.top + scrollY, bodyBottom: body.bottom + scrollY, viewTop: top, scrollY,
    pinned: getComputedStyle(owl).position === "fixed",
  };
};

/** After the welcome, whatever the owl says must not sit on top of text. */
const bubbleHits = () => {
  const b = document.querySelector(".px-bubble")?.getBoundingClientRect();
  if (!b) return null;
  const hits = [];
  const range = document.createRange();
  const walker = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.textContent.trim()) continue;
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      const t = r.top + r.height * 0.22, bt = r.bottom - r.height * 0.08;
      if (r.left < b.right && r.right > b.left && t < b.bottom && bt > b.top) hits.push(n.textContent.trim().slice(0, 28));
    }
  }
  return { hits: [...new Set(hits)], inView: b.left >= 0 && b.right <= innerWidth && b.top >= 0 };
};

const browser = await chromium.launch();
for (const viewport of VIEWPORTS) {
  for (const url of PAGES) {
    const page = await (await browser.newContext({ viewport })).newPage();
    const where = (y) => `${viewport.width}px ${url} @${y}`;
    const fail = (y, msg) => failures.push(`${where(y)}: ${msg}`);
    await page.goto(BASE + url, { waitUntil: "networkidle" });
    // the welcome: on the home page a lap, a landing, then (where there is room) a word; elsewhere, nothing
    await page.waitForTimeout(1900);
    const early = await page.evaluate(() => ({ state: document.querySelector("[data-owl]")?.dataset.owlState, bubble: !!document.querySelector(".px-bubble") }));
    checks++;
    if (url === "/" && early.state !== "flying") failures.push(`${viewport.width}px ${url}: no welcome flight on the home page (owl is ${early.state})`);
    if (url !== "/" && (early.state === "flying" || early.bubble)) failures.push(`${viewport.width}px ${url}: the owl gave its welcome away from the home page`);
    await page.waitForTimeout(2900);
    const said = await page.evaluate(bubbleHits);
    const words = await page.evaluate(() => document.querySelector(".px-bubble")?.textContent ?? "");
    checks++;
    if (url === "/" && said && !/world/.test(words)) failures.push(`${viewport.width}px ${url}: the owl said "${words}", not its hello-world`);
    if (url !== "/" && said) failures.push(`${viewport.width}px ${url}: the owl spoke away from the home page`);
    if (said && said.hits.length) failures.push(`${viewport.width}px ${url}: the owl's bubble covers "${said.hits.join('", "')}"`);
    if (said && !said.inView) failures.push(`${viewport.width}px ${url}: the owl's bubble runs off the screen`);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const step = Math.round(viewport.height * 0.45);
    const stops = [];
    for (let y = 0; y < max; y += step) stops.push(y);
    stops.push(max);
    let prev = null;
    for (const y of [...stops, ...stops.slice(0, -1).reverse()]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
      // let scrolling settle and any flight finish
      await page.waitForTimeout(320);
      await page.waitForFunction(() => document.querySelector("[data-owl]")?.dataset.owlState !== "flying", null, { timeout: 4000 }).catch(() => fail(y, "still flying after 4s"));
      await page.waitForTimeout(120);
      const s = await page.evaluate(probe);
      checks++;
      if (!s.slotBesideName) fail(y, "the owl's home is not beside the name");
      if (s.roost) {
        if (s.state !== "roost") fail(y, `the signpost is on screen with room for the owl, but it is ${s.state}`);
      } else {
        if (s.state === "roost") fail(y, "on the signpost although it is not fully on screen");
        if (s.visible.length > 0 && s.state !== "perched") fail(y, `${s.visible.length} heading(s) on screen but the owl is ${s.state}`);
        if (s.visible.length === 0 && s.state !== "home") fail(y, `no heading on screen but the owl is ${s.state}`);
      }
      if (s.state === "home" && !s.atSlot) fail(y, "home, but not in its slot beside the name");
      // at home it must be fixed to the screen, or it shudders as the page scrolls under it
      if (s.state === "home" && !s.pinned) fail(y, "home, but not pinned to the screen");
      if (s.state !== "home" && s.pinned) fail(y, "away from home, but pinned to the screen instead of the page");
      if (s.hits.length) fail(y, `covers ${s.hits.join(", ")}`);
      // It must not leave a heading that is still on screen, so long as the
      // spot it had there is still inside the usable view.
      if (prev && prev.state === "perched" && s.state === "perched" && prev.heading !== s.heading && s.visible.includes(Number(prev.heading))) {
        const couldStay = prev.bodyTop - s.scrollY >= s.viewTop && prev.bodyBottom - s.scrollY <= viewport.height - 6;
        if (couldStay) fail(y, `left heading ${prev.heading} for ${s.heading} while it was still on screen`);
      }
      prev = s;
    }
    await page.context().close();
  }
}
await browser.close();
console.log(`${checks} positions checked, ${failures.length} failure(s)`);
for (const f of failures) console.log("  FAIL " + f);
process.exit(failures.length ? 1 : 0);
