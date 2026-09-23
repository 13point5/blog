# Retro-tech motif set

Quiet product-design accents for the research-folio homepage. Motifs are SVG + CSS; they should stay sparse so writing stays calm.

## Palette tokens (`--rt-*` in `app/globals.css`)

| Token | Light role | Source cue |
| --- | --- | --- |
| `--rt-cream` / `--rt-cream-deep` | Paper / label fills | Cream scrapbook + floppy paper |
| `--rt-ink` / `--rt-charcoal` | Silhouettes, barcodes | Swiss black + hardware charcoal |
| `--rt-navy` | Cassette body | Cassette / track UI |
| `--rt-mustard` | Pencil chip | Hex pencils product render |
| `--rt-teal` | Floppy label accent | Black floppy “Recherche” type |
| `--rt-sky` / `--rt-green` | Pencil chips | Swiss color blocks |
| `--rt-play` | Play button only | Cassette transport orange |
| `--rt-cartridge` | Reserved rare accent | Game Boy cartridge red (unused on homepage) |

Light-mode paper is the avatar’s own background (`--background: #e7e4df`). Blue links stay as on `main`. Dark mode remaps `--rt-*` to lighter ink on charcoal.

## Motifs (`app/components/motifs/`)

| Name | Component | Where used |
| --- | --- | --- |
| Pencil chips | `PencilChips` | Homepage intro, under the name |
| Barcode stripe | `Barcode` | Homepage intro, beside chips |
| Binder clip | `BinderClip` | Homepage motif rail |
| Cassette | `Cassette` | Homepage motif rail |
| Play transport | `PlayTransport` | Homepage motif rail |
| Floppy disk | `FloppyDisk` | Homepage motif rail + footer |
| Paper grain | `.folio-grain` CSS | Soft homepage atmosphere |

Avatar: `public/images/avatar.jpg` — the original JPEG, committed byte-for-byte (not redrawn). The illustration’s paper is `#e7e4df` (sampled from the empty region). Light-mode `--background` uses that same color so the circular crop doesn’t show a cooler gray halo against the page. Dark mode still shows the photo’s baked-in paper inside the circle.

## Rules of thumb

- Prefer SVG/CSS over photos; never paste copyrighted character art from refs.
- One quiet accent group on the homepage is enough — do not stack every motif into the first viewport as competing chrome.
- Writing list and essay prose stay unadorned.
- Cartridge red is reserved; do not use it as a global theme color.

## Verification

See `docs/motif-verification.md` and `docs/verification/` for SVG overlay checks against style-ref geometry.
