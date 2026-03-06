# AGENTS.md

## Cursor Cloud specific instructions

This is a Next.js 16 portfolio/blog site (single service, no database, no backend APIs).

### Quick reference

- **Package manager:** pnpm (lockfile: `pnpm-lock.yaml`)
- **Dev server:** `pnpm dev` (runs on port 3000, uses `--webpack` flag)
- **Lint:** `pnpm lint` (ESLint 9 flat config)
- **Build:** `pnpm build`
- **No automated test suite** — there is no `test` script in `package.json`.

### Gotchas

- pnpm 10 blocks build scripts by default. `package.json` includes `pnpm.onlyBuiltDependencies` to allow `sharp`, `msw`, and `unrs-resolver` to build. If new native deps are added, they must be added to that allowlist.
- Blog content lives in `app/blog/posts/*.mdx`. Adding a new `.mdx` file with valid frontmatter automatically creates a new blog route.
- The dev script uses `next dev --webpack` (not Turbopack). The build script similarly uses `next build --webpack`.
