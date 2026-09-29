# Writing studio

Open `/studio` to write, format text, insert links, images by URL, tables, lists,
quotes and code blocks. The details panel edits the title, summary, date,
category, cover image, draft flag and shelf object. **MDX** opens the complete
document, including frontmatter. The public collection and reader are unchanged.

## Two workspaces

- **Local:** run `npm run dev` and visit `http://localhost:3000/studio`.
  Changes autosave to `app/blog/posts/*.mdx` after a brief pause. Save or
  Cmd/Ctrl-S saves immediately. Commit and push files through the existing PR
  workflow to publish them. New notes start as drafts.
- **Vercel:** edit freely without signing in. Drafts are saved in this browser
  on this origin, not to GitHub. Export downloads a complete `.mdx` file that
  can be placed in `app/blog/posts`. Clearing browser data removes these drafts.

Custom JSX (RewardLab, galleries, tweets, etc.), expressions, equations,
reference links and code blocks with special options are protected source
cards in the visual editor. They are preserved exactly, and can be changed in
MDX mode. The editor never executes authored JavaScript. The article page
provides the actual interactive rendering after the file is saved.

Browser recovery copies are kept until the matching source has been saved
locally. A changed disk revision stops autosave: export the browser version,
then use **Load disk version** to resolve the conflict. Saving is serialized,
revision checked and uses atomic replacement. As with any file editor, avoid
simultaneous external writes to the same file during a save.

The write endpoint is disabled in production and on Vercel. Local requests
require a loopback URL, same-origin POST, JSON and a process-local capability.
Filenames are restricted to lowercase letters, numbers and hyphens. Request
bodies are limited to 1 MB, and symlink targets are rejected. No repository
credential is sent to the browser.

The workflow is inspired by Maggie Appleton’s local writing editor; this
implementation uses MDXEditor with a separate source-preservation layer.

Run `npm run test:studio` for real-content round trips and metadata validation.
