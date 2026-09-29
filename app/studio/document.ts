import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkMdx from "remark-mdx";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { parseDocument } from "yaml";

export type StudioDocument = {
  slug: string;
  source: string;
  revision: string | null;
};
export type Island = { id: string; label: string; source: string };
const parser = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkGfm)
  .use(remarkMath);
type Node = {
  type: string;
  name?: string;
  meta?: string | null;
  children?: Node[];
  position?: { start: { offset?: number }; end: { offset?: number } };
};

export function splitDocument(source: string) {
  const match = /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(source);
  if (!match)
    throw new Error(
      "Add YAML metadata between --- lines at the top of the document.",
    );
  const yaml = parseDocument(match[2], { uniqueKeys: true });
  if (yaml.errors.length) throw new Error(yaml.errors[0].message);
  const metadata = yaml.toJSON() as Record<string, unknown>;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    throw new Error("Metadata must be a list of named fields.");
  return {
    prefix: match[0],
    body: source.slice(match[0].length),
    metadata,
    yaml,
    opening: match[1],
    closing: match[3],
  };
}

export function updateMetadata(
  source: string,
  key: string,
  value: string | boolean,
) {
  const document = splitDocument(source);
  document.yaml.set(key, value);
  // Keep long summaries on one line, also compatible with existing content tooling.
  return `${document.opening}${document.yaml.toString({ lineWidth: 0 }).trimEnd()}${document.closing}${document.body}`;
}

function needsProtection(node: Node): boolean {
  return (
    node.type.startsWith("mdx") ||
    [
      "math",
      "inlineMath",
      "definition",
      "linkReference",
      "imageReference",
      "footnoteDefinition",
      "footnoteReference",
      "html",
    ].includes(node.type) ||
    (node.type === "code" && Boolean(node.meta)) ||
    Boolean(node.children?.some(needsProtection))
  );
}

/** Unsupported MDX is a source island. Never evaluate authored JavaScript. */
export function prepareVisual(body: string) {
  const tree = parser.parse(body);
  const islands: Island[] = [];
  let markdown = "",
    cursor = 0;
  for (const node of tree.children as Node[]) {
    if (!needsProtection(node)) continue;
    const start = node.position!.start.offset!,
      end = node.position!.end.offset!;
    const id = `source-${islands.length}`;
    islands.push({
      id,
      label:
        node.name ||
        (node.type === "code"
          ? "Code with options"
          : node.type === "math"
            ? "Equation"
            : "MDX / embedded content"),
      source: body.slice(start, end),
    });
    markdown += body.slice(cursor, start) + `<StudioSource id="${id}" />`;
    cursor = end;
  }
  return { markdown: markdown + body.slice(cursor), islands };
}

export function restoreVisual(markdown: string, islands: Island[]) {
  let restored = markdown;
  for (const island of islands) {
    const pattern = new RegExp(
      `<StudioSource\\s+id=["']${island.id}["']\\s*\\/>`,
      "g",
    );
    const matches = restored.match(pattern);
    // Deletion is intentional; duplication is also safe and preserves the source.
    if (matches) restored = restored.replace(pattern, () => island.source);
  }
  if (restored.includes("<StudioSource"))
    throw new Error(
      "An embedded source block could not be restored. Switch to MDX to recover it.",
    );
  return restored;
}

export function validateDocument(source: string) {
  const { metadata, body } = splitDocument(source);
  if (typeof metadata.title !== "string" || !metadata.title.trim())
    throw new Error("A title is required.");
  if (typeof metadata.summary !== "string")
    throw new Error("A summary is required.");
  if (
    typeof metadata.publishedAt !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(metadata.publishedAt) ||
    Number.isNaN(Date.parse(metadata.publishedAt))
  )
    throw new Error("Use a date in YYYY-MM-DD format.");
  parser.parse(body);
}

export function blankDocument(slug: string): StudioDocument {
  return {
    slug,
    revision: null,
    source: `---\ntitle: Untitled note\npublishedAt: '${new Date().toISOString().slice(0, 10)}'\nsummary: A thought worth keeping.\ncategory: Notes\nartwork: floppy\nobjectLabel: NEW NOTE\ndraft: true\n---\n\nStart with a question.\n`,
  };
}
