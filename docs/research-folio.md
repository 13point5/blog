# Research folio experiment — simpler edition

Branch: `experiment/research-folio`, draft PR #13. The original elaborate direction is preserved in Git history.

## Direction

A quiet, single-column personal blog. Keep EB Garamond headings, Source Serif 4 prose, Geist metadata, parchment/oxblood light colors, and cream-on-dark evening colors.

Remove the framed hero, illustration captions, Roman-numbered research grid, featured article card, badges, decorative section rules, drop cap, repeated arrows, flourishes, and elaborate footer. Research interests are prose; writing is a plain list. Sample essays remain explicitly labeled and excluded from indexing.

Two small ink-only spot illustrations replace the three dense engravings. Source PNGs were generated with actual RGBA transparency, then encoded as WebP with alpha preserved. CSS colors only the ink: charcoal in light mode, pale ink in dark mode. No background fill, framing, cropping, or blend-mode paper matching. Both original generations are 1254 × 1254, displayed at about 105–170px wide.

## Artwork

Built-in image generation, two requests, no variants or retries. Project assets:
- `public/images/folio/learning-sketch.webp`
- `public/images/folio/drawing-sketch.webp`

Exact generation prompts:

```json
{"prompts":{"drawing-sketch":"Use case: illustration-story.\nAsset type: tiny website spot illustration, drawing-sketch.\nCreate ONE simple handmade charcoal ink sketch: ONE old-fashioned drafting compass poised above exactly TWO small rectangular outlines, a sparse illustration of a tool drawing geometric shapes. Modest industrial revolution / 1850 printer's spot illustration, as simple and charming as the line drawing within an old postage stamp, but absolutely NO stamp border or frame. Thin slightly irregular hand-drawn lines, only roughly 30–60 pen strokes total, very sparse hatching, broad blank spaces, no elaborate detail. Clearly recognizable old-fashioned compass with two open pointed legs and small hinge. No hand, person, robot, extra objects or scenery. Readable when displayed at 170 pixels wide.\n1024x1024 square canvas, isolated objects together occupying central 65–75% of canvas. Ink-only dark charcoal marks on genuinely transparent alpha background. All blank spaces, including within the compass and rectangle outlines, must be fully transparent. No sheet of paper, white fill, paper texture, colored background, wash, shadows, checkerboard drawing, text, border, photorealism, or dense engraved shading.","learning-sketch":"Use case: illustration-story.\nAsset type: tiny website spot illustration, learning-sketch.\nCreate ONE simple handmade charcoal ink sketch: ONE small open book beside ONE simple iron flywheel with exactly four spokes. Modest industrial revolution / 1850 printer's spot illustration, as simple and charming as the line drawing within an old postage stamp, but absolutely NO stamp border or frame. Thin slightly irregular hand-drawn lines, only roughly 30–60 pen strokes total, very sparse hatching, broad blank spaces, no elaborate detail. The open book has blank pages and a few page-edge strokes; the flywheel has a simple rim, hub and four spokes. No extra objects or scenery. Readable when displayed at 160 pixels wide.\n1024x1024 square canvas, isolated objects together occupying central 65–75% of canvas. Ink-only dark charcoal marks on genuinely transparent alpha background. All blank spaces, including inside book pages and wheel, must be fully transparent. No white fill, paper, paper texture, colored background, wash, shadows, checkerboard drawing, text, border, photorealism, dense engraved shading, or complex gears."},"paths":{"learning-sketch":"/workspace/scratch/b8dedf1f94b2/generated_images/exec-f7f32a6a-41b8-4997-a7c4-ecf32898c3a7.png","drawing-sketch":"/workspace/scratch/b8dedf1f94b2/generated_images/exec-bea2f6a2-f9ee-435e-82a4-535a237a3d00.png"}}

```
