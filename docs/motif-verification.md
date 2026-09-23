# Motif verification (SVG overlay)

Chat attachment paths for the style refs did not land on this VM filesystem, so verification uses **geometry tracings** of the motif SVGs against the described reference shapes (Swiss pencil blocks, floppy proportions, cassette reels, binder clip wire path, transport buttons). When the original JPGs are available locally, drop them into `docs/verification/refs/` and re-run the overlay HTML.

## Artifacts

| File | Purpose |
| --- | --- |
| `docs/verification/motif-sheet.svg` | All motifs on one sheet for visual QA |
| `docs/verification/overlay-floppy.svg` | Floppy silhouette with proportion guides |
| `docs/verification/overlay-cassette.svg` | Cassette body + reel centers |
| `docs/verification/overlay-check.html` | Side-by-side motif sheet viewer |
| `docs/verification/screenshots/` | Raster captures for the PR |

## Fidelity notes

- **Floppy:** 3.5″ aspect ~40×42 viewBox; shutter band top ~25% height; label card inset; HD mark top-right — matches cream/black floppy material cues (no character art).
- **Cassette:** Rounded navy shell; twin reels; window between; label strip — matches cassette-card UI without TE branding.
- **Pencil chips:** Six equal blocks in green / cream / sky / mustard / black / teal — Swiss pencil color blocks.
- **Binder clip:** Wire loop + metal jaw rectangle — scrapboard clip silhouette.
- **Transport:** Two charcoal squares + orange play triangle — cassette dock controls.
- **Avatar:** Unmodified PNG; circular CSS crop only (`border-radius` + `object-position`).

## How to re-verify with original refs

1. Copy style refs into `docs/verification/refs/` as `01-pencils.jpg` … `06-floppy-recherche.jpg`.
2. Open `overlay-check.html` in a browser.
3. For each motif, place the SVG at 50% opacity over the matching region of the ref and screenshot into `docs/verification/screenshots/`.
