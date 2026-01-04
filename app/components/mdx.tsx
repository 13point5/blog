import Link from "next/link";
import Image from "next/image";
import { MDXRemote } from "next-mdx-remote/rsc";
import React from "react";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import rehypePrettyCode from "rehype-pretty-code";
import type { Options } from "rehype-pretty-code";
import { CopyButton } from "@/components/ui/copy-button";
import { getIconForLanguageExtension } from "@/components/language-icons";

function CustomLink(props: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const href = props.href || "";

  if (href.startsWith("/")) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a {...props} />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

function RoundedImage(props: React.ComponentProps<typeof Image>) {
  return <Image className="rounded-lg" {...props} />;
}

function slugify(str: string) {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

const headingStyles: Record<number, string> = {
  1: "text-3xl font-semibold mb-6 mt-8 text-foreground",
  2: "text-2xl font-semibold mb-4 mt-6 text-foreground",
  3: "text-xl font-semibold mb-3 mt-5 text-foreground",
  4: "text-lg font-semibold mb-2 mt-4 text-foreground",
  5: "text-base font-semibold mb-2 mt-3 text-foreground",
  6: "text-sm font-semibold mb-2 mt-3 text-foreground",
};

function createHeading(level: number) {
  const Heading = ({ children }: { children: React.ReactNode }) => {
    const slug = slugify(String(children));
    return React.createElement(
      `h${level}`,
      { id: slug, className: headingStyles[level] },
      [
        React.createElement("a", {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: "anchor",
        }),
      ],
      children
    );
  };

  Heading.displayName = `Heading${level}`;
  return Heading;
}

// Code component that handles both inline code and code blocks
function Code({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & {
  "data-language"?: string;
  __raw__?: string;
}) {
  const isInlineCode =
    typeof children === "string" && !className?.includes("language-");

  // Inline code
  if (isInlineCode) {
    return (
      <code
        className="bg-accent px-1.5 py-0.5 rounded text-sm font-mono text-foreground border border-border"
        {...props}
      >
        {children}
      </code>
    );
  }

  // Code block - rehype-pretty-code will handle the syntax highlighting
  const rawCode = (props as { __raw__?: string }).__raw__;

  return (
    <>
      {rawCode && <CopyButton value={rawCode} />}
      <code className={className} {...props}>
        {children}
      </code>
    </>
  );
}

// Figure component for code blocks
function Figure({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  // Check if this is a code block figure from rehype-pretty-code
  const dataAttr = (props as Record<string, unknown>)[
    "data-rehype-pretty-code-figure"
  ];
  if (dataAttr !== undefined) {
    return (
      <figure className={`group/code ${className || ""}`} {...props}>
        {children}
      </figure>
    );
  }
  return (
    <figure className={className} {...props}>
      {children}
    </figure>
  );
}

// Figcaption for code block titles
function Figcaption({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLElement> & { "data-language"?: string }) {
  const language = props["data-language"];
  const icon = language ? getIconForLanguageExtension(language) : null;

  return (
    <figcaption className={`flex items-center gap-2 ${className || ""}`} {...props}>
      {icon}
      {children}
    </figcaption>
  );
}

// Pre component for code blocks
function Pre({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLPreElement>) {
  return (
    <pre className={`no-scrollbar ${className || ""}`} {...props}>
      {children}
    </pre>
  );
}

const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink,
  code: Code,
  pre: Pre,
  figure: Figure,
  figcaption: Figcaption,
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote className="border-l-4 border-accent-light bg-accent/50 pl-4 py-2 italic text-foreground mb-4 rounded-r">
      {children}
    </blockquote>
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="ml-6 text-foreground mb-4 space-y-2 [&:has(input[type=checkbox])]:list-none list-disc">
      {children}
    </ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol className="list-decimal ml-6 text-foreground mb-4 space-y-2">
      {children}
    </ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p className="text-foreground leading-relaxed mb-4">{children}</p>
  ),
  strong: ({ children }: { children: React.ReactNode }) => (
    <strong className="text-foreground font-semibold">{children}</strong>
  ),
  hr: () => <hr className="section-divider my-8" />,
  table: ({ children }: { children: React.ReactNode }) => (
    <div className="overflow-x-auto mb-6 rounded-lg border border-border overflow-hidden">
      <table className="min-w-full">{children}</table>
    </div>
  ),
  thead: ({ children }: { children: React.ReactNode }) => (
    <thead className="bg-accent border-b border-border">{children}</thead>
  ),
  tbody: ({ children }: { children: React.ReactNode }) => (
    <tbody className="divide-y divide-border">{children}</tbody>
  ),
  th: ({ children }: { children: React.ReactNode }) => (
    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-r border-border last:border-r-0">
      {children}
    </th>
  ),
  td: ({ children }: { children: React.ReactNode }) => (
    <td className="px-4 py-3 text-sm text-foreground border-r border-border last:border-r-0">
      {children}
    </td>
  ),
  input: ({
    type,
    checked,
    disabled,
  }: {
    type?: string;
    checked?: boolean;
    disabled?: boolean;
  }) => {
    if (type === "checkbox") {
      return (
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          readOnly
          className="mr-2 accent-foreground"
        />
      );
    }
    return <input type={type} />;
  },
};

// Rehype Pretty Code options
const rehypePrettyCodeOptions: Options = {
  theme: {
    dark: "github-dark",
    light: "github-light",
  },
  keepBackground: false,
  defaultLang: "plaintext",
  transformers: [
    {
      pre(node) {
        node.properties["class"] =
          "no-scrollbar min-w-0 overflow-x-auto outline-none !bg-transparent";
      },
      code(node) {
        if (node.tagName === "code") {
          // Store raw code for copy button
          node.properties["__raw__"] = this.source;
          // Add line numbers
          node.properties["data-line-numbers"] = "";
        }
      },
      line(node) {
        node.properties["data-line"] = "";
      },
    },
  ],
};

export function CustomMDX(props: { source: string }) {
  return (
    <MDXRemote
      source={props.source}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm, remarkMath],
          rehypePlugins: [
            rehypeKatex,
            [rehypePrettyCode, rehypePrettyCodeOptions],
          ],
        },
      }}
      components={components}
    />
  );
}
