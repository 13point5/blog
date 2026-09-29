"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  linkPlugin,
  linkDialogPlugin,
  imagePlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
  markdownShortcutPlugin,
  jsxPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  BlockTypeSelect,
  ListsToggle,
  CreateLink,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  InsertCodeBlock,
  ConditionalContents,
  ChangeCodeMirrorLanguage,
  type JsxEditorProps,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { Code2, LockKeyhole } from "lucide-react";
import {
  prepareVisual,
  restoreVisual,
  splitDocument,
  type Island,
} from "./document";

const SourceContext = createContext<{
  islands: Island[];
  onSource: () => void;
}>({ islands: [], onSource: () => {} });
function SourceBlock({ mdastNode }: JsxEditorProps) {
  const { islands, onSource } = useContext(SourceContext);
  const id = mdastNode.attributes.find(
    (attribute) =>
      attribute.type === "mdxJsxAttribute" && attribute.name === "id",
  );
  const island = islands.find(
    (item) => id && "value" in id && item.id === id.value,
  );
  return (
    <div className="studio-island" contentEditable={false}>
      <div>
        <span>
          <LockKeyhole size={12} />
          {island?.label || "Source block"}
        </span>
        <button onClick={onSource}>
          <Code2 size={12} /> Edit in MDX
        </button>
      </div>
      <pre>{island?.source}</pre>
      <small>Preserved exactly · rendered on the article page</small>
    </div>
  );
}

export default function VisualEditor({
  source,
  onChange,
  onError,
  onSource,
}: {
  source: string;
  onChange: (source: string) => void;
  onError: (message: string) => void;
  onSource: () => void;
}) {
  const latest = useRef(source);
  useEffect(() => {
    latest.current = source;
  }, [source]);
  const [initial] = useState(() => {
    try {
      return { ...prepareVisual(splitDocument(source).body), error: "" };
    } catch (error) {
      return { markdown: "", islands: [], error: (error as Error).message };
    }
  });
  const context = useMemo(
    () => ({ islands: initial.islands, onSource }),
    [initial.islands, onSource],
  );
  if (initial.error)
    return (
      <div className="studio-notice" role="alert">
        {initial.error}
        <button onClick={onSource}>Open MDX source</button>
      </div>
    );
  return (
    <SourceContext.Provider value={context}>
      <MDXEditor
        markdown={initial.markdown}
        contentEditableClassName="studio-prose"
        placeholder="Start with a question…"
        aria-label="Article body"
        onChange={(markdown, initialNormalization) => {
          if (initialNormalization) return;
          try {
            const { prefix } = splitDocument(latest.current);
            onChange(
              prefix +
                "\n" +
                restoreVisual(markdown, initial.islands).trim() +
                "\n",
            );
          } catch (error) {
            onError((error as Error).message);
          }
        }}
        onError={(error) => onError(error.error)}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          linkPlugin(),
          linkDialogPlugin(),
          tablePlugin(),
          imagePlugin({ disableImageResize: true }),
          codeBlockPlugin({ defaultCodeBlockLanguage: "python" }),
          codeMirrorPlugin({
            codeBlockLanguages: {
              "": "Plain text",
              text: "Plain text",
              python: "Python",
              javascript: "JavaScript",
              typescript: "TypeScript",
              json: "JSON",
              bash: "Shell",
              lean: "Lean",
              toml: "TOML",
            },
          }),
          jsxPlugin({
            jsxComponentDescriptors: [
              {
                name: "StudioSource",
                kind: "flow",
                props: [{ name: "id", type: "string" }],
                hasChildren: false,
                Editor: SourceBlock,
              },
            ],
          }),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <ConditionalContents
                options={[
                  {
                    when: (editor) => editor?.editorType === "codeblock",
                    contents: () => (
                      <>
                        <ChangeCodeMirrorLanguage />
                      </>
                    ),
                  },
                  {
                    fallback: () => (
                      <>
                        <UndoRedo />
                        <BlockTypeSelect />
                        <BoldItalicUnderlineToggles
                          options={["Bold", "Italic"]}
                        />
                        <ListsToggle />
                        <CreateLink />
                        <InsertImage />
                        <InsertTable />
                        <InsertCodeBlock />
                        <InsertThematicBreak />
                      </>
                    ),
                  },
                ]}
              />
            ),
          }),
        ]}
      />
    </SourceContext.Provider>
  );
}
