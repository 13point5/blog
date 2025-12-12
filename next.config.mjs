import createMDX from "@next/mdx";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

// Create an async wrapper to load plugins
async function createMDXConfig() {
  const remarkMath = (await import("remark-math")).default;
  const rehypeKatex = (await import("rehype-katex")).default;
  const remarkGfm = (await import("remark-gfm")).default;

  const withMDX = createMDX({
    options: {
      remarkPlugins: [remarkMath, remarkGfm],
      rehypePlugins: [rehypeKatex],
    },
  });

  return withMDX(nextConfig);
}

export default createMDXConfig();
