import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import { Socials } from "./app/components/socials";

// Custom components for MDX content
const components: MDXComponents = {
  Socials,
  // Headings
  h1: ({ children }) => (
    <h1 className="text-2xl font-medium mb-6">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-2xl font-medium mb-4">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-xl font-medium mb-3">{children}</h3>
  ),

  // Paragraphs
  p: ({ children }) => (
    <p className="text-foreground-muted leading-relaxed max-w-xl mb-4">
      {children}
    </p>
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
          className="text-foreground font-medium hover:text-foreground-muted transition-colors"
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        href={href || "#"}
        className="text-foreground font-medium hover:text-foreground-muted transition-colors"
      >
        {children}
      </Link>
    );
  },

  // Lists
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-foreground-muted mb-4 space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-foreground-muted mb-4 space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,

  // Emphasis
  strong: ({ children }) => (
    <strong className="text-foreground font-medium">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,

  // Code
  code: ({ children }) => (
    <code className="bg-accent px-1.5 py-0.5 rounded text-sm font-mono">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="bg-accent p-4 rounded-lg overflow-x-auto mb-4 text-sm">
      {children}
    </pre>
  ),

  // Blockquote
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-border pl-4 italic text-foreground-muted mb-4">
      {children}
    </blockquote>
  ),

  // Horizontal rule
  hr: () => <hr className="section-divider my-8" />,
};

export function useMDXComponents(
  baseComponents?: MDXComponents
): MDXComponents {
  return {
    ...baseComponents,
    ...components,
  };
}
