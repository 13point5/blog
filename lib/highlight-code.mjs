/** @type {import('shiki').ShikiTransformer[]} */
export const transformers = [
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
];
