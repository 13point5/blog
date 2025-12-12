# Markdown and Math Support Guide

This project now has comprehensive support for markdown and mathematical notation in MDX files.

## 🎯 Features Added

### ✅ Math Support

- **Inline Math**: Use `$...$` for inline equations like $E = mc^2$
- **Block Math**: Use `$$...$$` for display equations

```markdown
Inline: The formula $a^2 + b^2 = c^2$ is the Pythagorean theorem.

Block:
$$
x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
$$
```

### ✅ GitHub Flavored Markdown (GFM)

All GFM features are supported including:

#### Tables

```markdown
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
```

#### Task Lists

```markdown
- [x] Completed task
- [ ] Incomplete task
- [x] Another completed task
```

#### Strikethrough

```markdown
~~This text is crossed out~~
```

#### Footnotes

```markdown
Here's a sentence with a footnote[^1].

[^1]: This is the footnote content.
```

### ✅ Enhanced Markdown Elements

- **All heading levels** (H1-H6) with consistent styling
- **Lists**: Ordered, unordered, and nested
- **Code blocks** with syntax highlighting
- **Inline code** with proper styling
- **Blockquotes** with enhanced styling
- **Links**: Internal and external with auto-detection
- **Images**: Responsive with Next.js Image optimization
- **Horizontal rules** for content separation
- **Details/Summary**: Collapsible sections

## 📦 Installed Packages

```json
{
  "remark-math": "^6.0.0",
  "rehype-katex": "^7.0.1",
  "remark-gfm": "^4.0.1"
}
```

## ⚙️ Configuration

### next.config.mjs

```javascript
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkMath, remarkGfm],
    rehypePlugins: [rehypeKatex],
  },
});
```

### layout.tsx

KaTeX CSS is included for math rendering:

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
/>
```

## 🎨 Styled Components

All markdown elements have been styled with Tailwind CSS classes:

- Tables with hover effects and borders
- Math equations with proper spacing
- Code blocks with background and borders
- Blockquotes with left border accent
- Task lists with checkbox styling
- Footnotes with superscript links

## 📝 Example Usage

### Creating a Blog Post

1. Create a new `.mdx` file in the `content/` directory:

```mdx
# My Blog Post

This is a paragraph with **bold** and *italic* text.

## Math Examples

The Pythagorean theorem: $a^2 + b^2 = c^2$

Block equation:

$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$

## Code Example

```javascript
function hello() {
  console.log("Hello, World!");
}
```

## Table

| Feature | Status |
|---------|--------|
| Math    | ✅     |
| Tables  | ✅     |
```

2. Import and use in a page:

```tsx
import MyBlogPost from "@/content/my-blog-post.mdx";

export default function BlogPage() {
  return (
    <article>
      <MyBlogPost />
    </article>
  );
}
```

## 🔗 Sample Blog

Visit `/blog` to see a comprehensive demonstration of all supported features including:

- All markdown syntax elements
- Inline and block math equations
- Complex tables
- Code blocks with multiple languages
- Task lists
- Collapsible sections
- Footnotes
- And more!

## 📚 Resources

- [MDX Documentation](https://mdxjs.com/)
- [KaTeX Documentation](https://katex.org/)
- [Remark Math](https://github.com/remarkjs/remark-math)
- [GitHub Flavored Markdown](https://github.github.com/gfm/)

## 🎓 Math Syntax Quick Reference

### Common Symbols

```latex
Greek letters: \alpha, \beta, \gamma, \Delta, \Omega
Operators: \sum, \prod, \int, \lim
Relations: \leq, \geq, \approx, \equiv
Sets: \in, \subset, \cup, \cap
Logic: \forall, \exists, \neg, \land, \lor
```

### Common Structures

```latex
Fractions: \frac{numerator}{denominator}
Square root: \sqrt{x}
Nth root: \sqrt[n]{x}
Powers: x^2, x^{2+n}
Subscripts: x_i, x_{i+1}
Matrices: \begin{pmatrix} a & b \\ c & d \end{pmatrix}
```

### Example Equations

```latex
Quadratic: x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}
Summation: \sum_{i=1}^{n} i = \frac{n(n+1)}{2}
Integral: \int_a^b f(x)\,dx
Limit: \lim_{x \to \infty} \frac{1}{x} = 0
Matrix: A = \begin{bmatrix} 1 & 2 \\ 3 & 4 \end{bmatrix}
```

## 🐛 Troubleshooting

### Math not rendering?

1. Ensure KaTeX CSS is loaded in `layout.tsx`
2. Check that `remark-math` and `rehype-katex` are in `next.config.mjs`
3. Verify your LaTeX syntax is correct

### Tables not displaying properly?

1. Make sure `remark-gfm` is configured
2. Check table syntax (pipes must align properly)
3. Ensure there's a blank line before and after the table

### Code blocks not styled?

1. Verify the language identifier is on the opening fence
2. Check that global CSS is properly imported
3. Ensure Tailwind classes are not being purged

## 🚀 Performance

- KaTeX is loaded from CDN for optimal caching
- Math rendering is done at build time (SSG)
- Images use Next.js Image component for optimization
- CSS is scoped and minimal

---

*For more information or issues, please refer to the documentation or create an issue on GitHub.*
