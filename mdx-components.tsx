import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import Image from "next/image";
import { Socials } from "./app/components/socials";
import { IconLink } from "./app/components/icon-link";

// Custom components for MDX content
const components: MDXComponents = {
  Socials,
  IconLink,
  // Headings
  h1: ({ children }) => (
    <h1 className="text-3xl font-semibold mb-6 mt-8 text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-semibold mb-4 mt-6 text-foreground">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-semibold mb-3 mt-5 text-foreground">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-lg font-semibold mb-2 mt-4 text-foreground">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-base font-semibold mb-2 mt-3 text-foreground">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-sm font-semibold mb-2 mt-3 text-foreground">
      {children}
    </h6>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="text-foreground leading-relaxed mb-4">{children}</p>
  ),

  // Links
  a: ({ href, children }) => {
    const isExternal = href?.startsWith("http");
    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-foreground font-medium transition-colors underline decoration-foreground-muted hover:decoration-foreground underline-offset-2"
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href || "#"}
        className="text-foreground font-medium transition-colors underline decoration-foreground-muted hover:decoration-foreground underline-offset-2"
      >
        {children}
      </Link>
    );
  },

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc ml-6 text-foreground mb-4 space-y-2">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal ml-6 text-foreground mb-4 space-y-2">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Emphasis
  strong: ({ children }) => (
    <strong className="text-foreground font-semibold">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,

  // Code
  code: ({ children, className }) => {
    // Inline code (no className means it's inline)
    if (!className) {
      return (
        <code className="bg-accent px-1.5 py-0.5 rounded text-sm font-mono text-foreground border border-border">
          {children}
        </code>
      );
    }
    // Code block
    return <code className={className}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="bg-accent p-4 rounded-lg overflow-x-auto mb-4 text-sm border border-border">
      {children}
    </pre>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-accent-light bg-accent/50 pl-4 py-2 italic text-foreground mb-4 rounded-r">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => <hr className="section-divider my-8" />,

  // Tables
  table: ({ children }) => (
    <div className="overflow-x-auto mb-6 rounded-lg border border-border overflow-hidden">
      <table className="min-w-full">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-accent border-b border-border">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="divide-y divide-border">{children}</tbody>
  ),
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-r border-border last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-4 py-3 text-sm text-foreground border-r border-border last:border-r-0">
      {children}
    </td>
  ),

  // Task lists (from GFM)
  input: ({ type, checked, disabled }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="mr-2 accent-foreground"
        />
      );
    }
    return <input type={type} />;
  },

  // Details/Summary (for collapsible sections)
  details: ({ children }) => (
    <details className="mb-4 border border-border rounded-lg p-4 bg-accent/30">
      {children}
    </details>
  ),
  summary: ({ children }) => (
    <summary className="cursor-pointer font-medium text-foreground hover:text-foreground-muted transition-colors">
      {children}
    </summary>
  ),

  // Inline images
  img: ({ src, alt }) => {
    // Handle external images with Next.js Image component
    if (src?.startsWith("http")) {
      return (
        <Image
          src={src}
          alt={alt || ""}
          width={800}
          height={400}
          className="max-w-full h-auto rounded-lg my-4 border border-border"
          unoptimized
        />
      );
    }
    // For local images, use standard img tag or handle accordingly
    return (
      <Image
        src={src || ""}
        alt={alt || ""}
        width={800}
        height={400}
        className="max-w-full h-auto rounded-lg my-4 border border-border"
      />
    );
  },

  // Deleted text (strikethrough from GFM)
  del: ({ children }) => (
    <del className="text-foreground line-through opacity-70">{children}</del>
  ),

  // Superscript and subscript
  sup: ({ children }) => <sup className="text-xs">{children}</sup>,
  sub: ({ children }) => <sub className="text-xs">{children}</sub>,
};

export function useMDXComponents(
  baseComponents?: MDXComponents
): MDXComponents {
  return {
    ...baseComponents,
    ...components,
  };
}
