import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  prepareVisual,
  restoreVisual,
  splitDocument,
  updateMetadata,
  validateDocument,
  blankDocument,
} from "../app/studio/document.ts";

test("every real article round-trips its protected content exactly", () => {
  for (const filename of fs
    .readdirSync("app/blog/posts")
    .filter((file) => file.endsWith(".mdx"))) {
    const source = fs.readFileSync(`app/blog/posts/${filename}`, "utf8");
    validateDocument(source);
    const { body } = splitDocument(source);
    const { markdown, islands } = prepareVisual(body);
    assert.equal(restoreVisual(markdown, islands), body, filename);
    for (const island of islands)
      assert.ok(
        restoreVisual(markdown + "\n\nNew prose.", islands).includes(
          island.source,
        ),
        filename,
      );
  }
});

test("equations, JSX, expressions, imports and code options remain inert source", () => {
  const body =
    'import X from "./x"\n\n# Hello\n\n<RewardLab />\n\n$$\nx^2\n$$\n\nSome {dangerous()} text and $x$.\n\n```python title="model.py"\nprint(1)\n```\n';
  const { markdown, islands } = prepareVisual(body);
  assert.equal(islands.length, 5);
  assert.ok(!markdown.includes("dangerous()"));
  assert.ok(!markdown.includes("import X"));
  assert.equal(restoreVisual(markdown, islands), body);
});

test("metadata edits retain unknown fields and body without escaping corruption", () => {
  const source = blankDocument("test").source.replace(
    "draft: true",
    "customField: keep-me\ndraft: true",
  );
  const changed = updateMetadata(source, "title", 'A "model": it\'s useful');
  const parsed = splitDocument(changed);
  assert.equal(parsed.metadata.title, 'A "model": it\'s useful');
  assert.equal(parsed.metadata.customField, "keep-me");
  assert.equal(parsed.body, splitDocument(source).body);
  validateDocument(changed);
});

test("invalid documents fail validation without executing source", () => {
  assert.throws(() => validateDocument("No frontmatter"));
  assert.throws(() =>
    validateDocument(blankDocument("test").source + "\n<Broken"),
  );
  assert.throws(() =>
    validateDocument(updateMetadata(blankDocument("test").source, "title", "")),
  );
  globalThis.studioExecuted = false;
  validateDocument(
    blankDocument("test").source + "\n{globalThis.studioExecuted = true}\n",
  );
  assert.equal(globalThis.studioExecuted, false);
});
