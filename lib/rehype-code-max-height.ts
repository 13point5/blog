import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";

const MAX_HEIGHT_REGEX =
  /maxHeight="([^"]*)"|maxHeight=(\S+)|max-height="([^"]*)"|max-height=(\S+)/;

/**
 * Rehype plugin that parses code block meta strings for:
 * - maxHeight: max-height + overflow-y on pre for scrollable blocks
 * - showLineNumbers: show line numbers (hidden by default)
 *
 * Usage in MDX:
 * ```python maxHeight="400px"
 * ```python showLineNumbers
 * ```python title="file.py" maxHeight="400px" showLineNumbers
 */
export function rehypeCodeMaxHeight() {
  return (tree: Root) => {
    visit(tree, "element", (node, _index, parent) => {
      if (node.tagName !== "code") return;

      const codeNode = node as Element;
      const meta =
        (codeNode.data as { meta?: string } | undefined)?.meta ??
        (codeNode.properties as { metastring?: string } | undefined)?.metastring ??
        "";

      if (meta.includes("showLineNumbers")) {
        codeNode.properties = codeNode.properties ?? {};
        codeNode.properties["data-line-numbers"] = "";
      }

      const match = meta.match(MAX_HEIGHT_REGEX);
      if (!match) return;

      const value =
        match[1] ?? match[2] ?? match[3] ?? match[4];
      if (!value) return;

      // Parent of code should be pre
      const preParent = parent as Element | undefined;
      if (!preParent || preParent.type !== "element" || preParent.tagName !== "pre") {
        return;
      }

      const pre = preParent;
      const existingStyle =
        typeof pre.properties?.style === "string"
          ? pre.properties.style
          : "";
      const newStyle = `${existingStyle} max-height: ${value}; overflow-y: auto;`.trim();
      pre.properties = pre.properties ?? {};
      pre.properties.style = newStyle;
      pre.properties["data-max-height"] = value;
      // Add class so Pre component can detect it (class is what rehype uses)
      const existingClass =
        typeof pre.properties?.class === "string"
          ? pre.properties.class
          : Array.isArray(pre.properties?.class)
            ? (pre.properties.class as string[]).join(" ")
            : "";
      pre.properties.class = `${existingClass} max-h-scroll`.trim();
    });
  };
}
