# Color studio exploration

Branch: `explore/color-studio`, based on `main` at `6baab35`.

## Direction

Warm ivory paper, cobalt, vermilion, citron, and leaf green. Serif display type with sans-serif reading text. A tilted portrait uses the supplied avatar unchanged. Original CSS objects (floppy disks, a cassette, a taped note, and pencils) echo the reference board without embedding the reference images.

The homepage pairs an expressive introduction with a spacious notebook shelf. Writing can be filtered by topic or viewed as a compact list. Article pages use a narrower reading column and restrained accents. Light and dark themes persist across visits; reduced-motion preferences are respected.

## Demonstration content

The existing Vibe RL article remains intact and appears first. Three fictional sample articles demonstrate tables, highlighted code with copying, checklists, quotes, callouts, expandable notes, color studies, and an interactive reward-weight calculation. Samples are labeled on cards and article pages, carry noindex metadata, and are excluded from the sitemap.

## Development

The existing v6 lockfile is supported by pnpm 8:

```sh
npx pnpm@8.15.9 install --frozen-lockfile
npm run dev
npm run lint
npm run build
```

No dependencies were added. No production branch merge is included in this exploration.
