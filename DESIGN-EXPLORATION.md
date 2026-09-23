# Object collection — second direction

Branch: `explore/color-studio`; draft PR #18. Original base: `main` at `6baab35`.

## Direction

A collection of six freestanding objects on a cool gray surface. No hero, featured card, topic strip, filters, large title, colorful panel backgrounds, or promotional footer. A small avatar/name header contains an About dialog and theme toggle. Each object's caption is its article title; samples carry a small label.

The objects are two floppy disks, a cassette, a game cartridge, a record with its sleeve, and a clothbound book. They are original CSS artwork with cool blue, indigo, slate, gray, and charcoal materials. Red and brown are not interface accents.

Opening an object uses a route-backed reading dialog, leaving the collection behind it. Escape, the close button, and browser Back return to the collection; direct URLs and reloads render standalone articles. Radix provides modal focus management and scroll locking. Opening an article in a new tab still works.

## Review decisions

- The first version used physical objects inside conventional editorial cards. This revision makes the objects the navigation.
- Removed large artwork and duplicated summaries from article headers; the reading sheet starts with its title and metadata.
- Equal grid cells make the collection scannable; varied silhouettes provide variation without more interface chrome.
- Reduced decorative lettering and kept readable captions outside the objects.
- Cool neutral background and text let blue/indigo objects provide the color.
- Three columns on desktop, two on phones. Artwork scales down at 800, 600, and 370px. Reduced-motion support disables transitions.

The real Vibe RL article is preserved and appears first. Five explicitly fictional sample entries demonstrate code, tables, quotes, callouts, checklists, details, and an interactive reward-weight calculation. Samples have noindex metadata and are excluded from the sitemap.

## Development

The existing v6 lockfile is supported by pnpm 8:

```sh
npx pnpm@8.15.9 install --frozen-lockfile
npm run dev
npm run lint
npm run build
```

No dependencies added. Production main remains unchanged. Browser visual verification requires access to the Vercel-protected preview.
