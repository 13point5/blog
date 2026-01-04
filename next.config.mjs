import createMDX from "@next/mdx";
import rehypePrettyCode from "rehype-pretty-code";
import { transformers } from "./lib/highlight-code.mjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

/** @type {import('rehype-pretty-code').Options} */
const rehypePrettyCodeOptions = {
  theme: {
    dark: "github-dark",
    light: "github-light",
  },
  transformers,
  keepBackground: false,
  defaultLang: "plaintext",
};

// Create an async wrapper to load plugins
async function createMDXConfig() {
  const remarkMath = (await import("remark-math")).default;
  const rehypeKatex = (await import("rehype-katex")).default;
  const remarkGfm = (await import("remark-gfm")).default;

  const withMDX = createMDX({
    options: {
      remarkPlugins: [remarkMath, remarkGfm],
      rehypePlugins: [rehypeKatex, [rehypePrettyCode, rehypePrettyCodeOptions]],
    },
  });

  return withMDX(nextConfig);
}

export default createMDXConfig();
