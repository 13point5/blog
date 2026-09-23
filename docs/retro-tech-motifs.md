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
| Binder clip | `BinderClip` | Homepage pin control. Toggles the short personal note. |
| Floppy disk | `FloppyDisk` | One 22px mark in the homepage margin |
| Paper grain | `.folio-grain` CSS | Very light homepage atmosphere |

Pencil chips, barcode, cassette, and transport buttons are still in `app/components/motifs/` but are not placed on the page. The writing list has no cassette or “tracks” heading.

Avatar: `public/images/avatar.jpg` — the original JPEG, committed byte-for-byte (not redrawn). The illustration’s paper is `#e7e4df` (sampled from the empty region). Light-mode `--background` uses that same color so the circular crop doesn’t show a cooler gray halo against the page. Dark mode still shows the photo’s baked-in paper inside the circle.

## Rules of thumb

- Prefer SVG/CSS over photos; never paste copyrighted character art from refs.
- The homepage name is plain roman. The floppy is a margin accent. The only interactive motif is the pin.
- Writing list and essay prose stay unadorned.
- Cartridge red is reserved; do not use it as a global theme color.

## Verification

See `docs/motif-verification.md` and `docs/verification/` for SVG overlay checks against style-ref geometry.
