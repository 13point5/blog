# Simple colorful object grid

Branch: `explore/color-studio`; draft PR #18. Original base: `main` at `6baab35`.

Restored the simple grid from `02b529a` at the owner's request. The shelf, record-bin, scattered-desk, and hanging-sculpture experiments have been removed.

The homepage shows three columns on desktop and two on phones. Colorful floppy disks, a cassette, a game cartridge, a record, and a book link directly to full article pages. The supplied avatar, compact header, neutral gray background, indigo interface accents, and full About page remain. The grid retains its original small hover responses and reduced-motion support.

The original Vibe RL article and five sourced draft technical notes remain, including their diagrams and references. Drafts remain excluded from indexing and the sitemap. The old `/browse` route redirects to the homepage.

Validation: lint, production build, and a desktop/mobile browser smoke check before pushing. The owner reviews the protected Vercel preview without browser sign-in here.

Production main remains unchanged.

## Article opening transitions

The grid now has a brief, skippable loading scene on ordinary article clicks. A floppy tilts into a retro computer, a cassette loads into a deck, a cartridge slots into a console, vinyl leaves its sleeve and settles on a turntable, and the book opens on a stand. All hardware shares a restrained gray/blue palette. The screen and indicator light respond after insertion.

A layout-level provider keeps the scene visible while the real article route loads underneath. The 1.15-second motion finishes before a short fade reveals the full page; slow navigation can keep the scene visible, and Skip animation always removes it. History navigation cancels the scene. Modified clicks remain normal browser links. Reduced motion bypasses the scene entirely. The artwork is CSS with perspective, and adds no animation dependencies.

Validation includes all six objects, mobile rendering, Skip animation, keyboard activation, browser Back, modified clicks, and reduced motion. Lint and production build pass.
