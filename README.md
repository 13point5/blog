This is a [Next.js](https://nextjs.org) project with comprehensive MDX, Markdown, and Math support.

## ✨ Features

- 📝 **Full Markdown Support** - All standard markdown elements
- 🧮 **LaTeX Math Equations** - Both inline (`$...$`) and block (`$$...$$`) equations with KaTeX
- 📊 **GitHub Flavored Markdown** - Tables, task lists, strikethrough, footnotes
- 🎨 **Beautiful Styling** - Tailwind CSS with custom components
- 🖼️ **Optimized Images** - Next.js Image component integration
- 📚 **MDX Components** - Interactive React components in markdown

### Math Support Examples

- Inline: `$E = mc^2$` → $E = mc^2$
- Block equations with full LaTeX support
- Matrices, integrals, summations, and more

### Markdown Features

- All heading levels (H1-H6)
- Lists (ordered, unordered, nested, task lists)
- Tables with alignment
- Code blocks with syntax highlighting
- Blockquotes and collapsible sections
- Footnotes and references
- And much more!

## 🚀 Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 📖 Sample Blog

Visit `/blog` to see a comprehensive demonstration of all markdown and math features. The sample blog includes:

- All markdown syntax elements
- Mathematical equations (inline and block)
- Complex tables and task lists
- Code examples in multiple languages
- Collapsible sections
- Footnotes and references

See [MARKDOWN_MATH_GUIDE.md](./MARKDOWN_MATH_GUIDE.md) for detailed documentation on using all features.

## 📦 Key Dependencies

- `@next/mdx` - MDX support for Next.js
- `remark-math` - Parse math in markdown
- `rehype-katex` - Render math with KaTeX
- `remark-gfm` - GitHub Flavored Markdown support

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
