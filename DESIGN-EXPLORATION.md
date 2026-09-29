# Simple colorful object grid

Branch: `explore/color-studio`; draft PR #18. Original base: `main` at `6baab35`.

Restored the simple grid from `02b529a` at the owner's request. The shelf, record-bin, scattered-desk, and hanging-sculpture experiments have been removed.

The homepage shows three columns on desktop and two on phones. Colorful floppy disks, a cassette, a game cartridge, a record, and a book link directly to full article pages. The supplied avatar, compact header, neutral gray background, indigo interface accents, and full About page remain. The grid retains its original small hover responses and reduced-motion support.

The original Vibe RL article and five sourced draft technical notes remain, including their diagrams and references. Drafts remain excluded from indexing and the sitemap. The old `/browse` route redirects to the homepage.

Validation: lint, production build, and a desktop/mobile browser smoke check before pushing. The owner reviews the protected Vercel preview without browser sign-in here.

Production main remains unchanged.

## Article opening transitions

Every object now enters the same retro media terminal. Its five bays (disk, tape, cartridge, vinyl, and paper) are always visible in fixed positions. Only the selected bay lights up. The vinyl sleeve slips off before insertion; the other objects align and slide into their matching slots with a slower eased motion.

The real article DOM loads during insertion. Once the route is ready, it appears inside the device screen, then the camera and live page expand together to fill the browser. There is no screenshot, duplicate article, or hard cut to a separate rendering. Timing is 1.45 seconds for insertion, a 0.3-second screen reveal, and a 1.05-second zoom. Slow navigation waits at the terminal; Skip animation remains available throughout.

The simple grid is unchanged. Normal article URLs, modified clicks, keyboard navigation, history cancellation, reduced-motion bypass, and full About pages are retained. No new dependencies.

Validation: lint and production build, all six media objects, desktop/mobile screen framing and landing, browser Back, Skip, keyboard navigation, reduced motion, and delayed navigation.
