# Thoughts in motion — kinetic archive

Branch: `explore/color-studio`; draft PR #18. Original base: `main` at `6baab35`.

## Design reasoning

The collection contains six very different objects, each representing a piece of writing. A grid treats them as interchangeable cards; furniture assigns them literal storage slots. This iteration instead uses balance and connection to make the collection feel like a single composition.

The homepage is a hanging mobile. Thin curved arms link the colorful disk, cartridge, book, cassette, record, and second disk. A neutral gray surface and compact header give the objects space. Indigo remains the interface accent. Each object is an ordinary link to its full article; About is still a full page. `/browse` is now a complete text index for readers looking for a title rather than exploring the sculpture.

The sculpture has shallow CSS 3D depth, a very slow whole-composition movement, and slight independent swings. Pointer movement changes perspective; horizontal touch dragging turns the assembly. Motion settles on hover or keyboard focus. A pause button and reduced-motion support keep browsing under the reader's control. There is no WebGL, extra dependency, canvas navigation, or required gesture.

Phones get a taller, two-sided composition with their own suspension geometry, not a shrunken desktop layout. Vertical scrolling remains available; horizontal drags suppress accidental article activation.

## References

- [Alexander Calder: Modern from the Start — MoMA](https://www.moma.org/calendar/exhibitions/5209): balance, independent elements, and movement as part of the composition.
- [Lobster Trap and Fish Tail — MoMA](https://www.moma.org/collection/works/81621): fine supporting structures and separate suspended forms.
- [Teenage Engineering Field System](https://teenage.engineering/products/field-system): a coherent family of distinct objects with restrained surrounding UI.
- [DIA's design process](https://dia.tv/input/): motion developed from the underlying design system.

These informed the organizing idea. The suspension artwork is original SVG; the existing object artwork remains native HTML/CSS. No reference-site assets were copied.

## Content retained

The original Vibe RL article is intact. Five sourced draft explainers cover reward design and RL, evaluation, Transformer architecture, proof checking, and world models. They remain labeled as drafts and excluded from indexing and the sitemap. Each has an original SVG diagram with descriptive alt text and references. No fabricated research results or experiments are attributed to the owner. The supplied avatar is retained.

## Validation

Desktop, phone, and dark-mode renders are inspected locally. Browser checks cover responsive overflow and link target separation, pausing, keyboard article navigation, the index, reduced motion, horizontal touch dragging, and a subsequent native touch tap. Lint and a production build are run before pushing.

```sh
npm run lint
npm run build
```

The owner reviews the protected Vercel branch preview; do not request browser sign-in. This remains an exploration branch. Production main is unchanged.
