"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Download,
  FileText,
  Plus,
  Search,
  Save,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  blankDocument,
  splitDocument,
  updateMetadata,
  validateDocument,
  type StudioDocument,
} from "./document";

const VisualEditor = dynamic(() => import("./visual-editor"), {
  ssr: false,
  loading: () => <p className="studio-loading">Opening the page…</p>,
});
const storageKey = "sriraam-writing-studio-v1";
const titleOf = (doc: StudioDocument) => {
  try {
    return String(splitDocument(doc.source).metadata.title || doc.slug);
  } catch {
    return doc.slug;
  }
};

export function WritingStudio({
  initialDocuments,
  token,
}: {
  initialDocuments: StudioDocument[];
  token: string | null;
}) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [selected, setSelected] = useState(initialDocuments[0]?.slug || "");
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"visual" | "source">("visual");
  const [generation, setGeneration] = useState(0);
  const [query, setQuery] = useState("");
  const [details, setDetails] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSlug, setNewSlug] = useState("");
  const [notice, setNotice] = useState("");
  const [storageError, setStorageError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Record<string, StudioDocument>>(
    {},
  );
  const saved = useRef(
    new Map(initialDocuments.map((doc) => [doc.slug, doc.source])),
  );
  const savingRef = useRef(false);
  const current = documents.find((doc) => doc.slug === selected);
  const currentRef = useRef(current);
  currentRef.current = current;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const drafts: StudioDocument[] = JSON.parse(raw);
        if (!Array.isArray(drafts)) throw new Error("Invalid recovery data");
        const safe = drafts.filter(
          (doc) =>
            typeof doc.slug === "string" &&
            typeof doc.source === "string" &&
            (doc.revision === null || typeof doc.revision === "string"),
        );
        setDocuments((previous) => [
          ...previous.map(
            (doc) => safe.find((draft) => draft.slug === doc.slug) || doc,
          ),
          ...safe.filter(
            (draft) => !previous.some((doc) => doc.slug === draft.slug),
          ),
        ]);
        if (safe.length) setNotice("Your browser drafts have been restored.");
      }
    } catch {
      setStorageError(
        "Browser recovery is unavailable. Export your MDX to keep a copy.",
      );
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify(
          documents.filter((doc) => saved.current.get(doc.slug) !== doc.source),
        ),
      );
    } catch {
      setStorageError(
        "Browser storage is full or unavailable. Export your MDX to keep a copy.",
      );
    }
  }, [documents, ready]);

  const change = useCallback(
    (source: string) => {
      setDocuments((previous) =>
        previous.map((doc) =>
          doc.slug === selected ? { ...doc, source } : doc,
        ),
      );
      setErrors((previous) => ({ ...previous, [selected]: "" }));
      setNotice("");
    },
    [selected],
  );

  const save = useCallback(
    async (doc: StudioDocument) => {
      if (
        !token ||
        savingRef.current ||
        conflicts[doc.slug] ||
        saved.current.get(doc.slug) === doc.source
      )
        return;
      try {
        validateDocument(doc.source);
      } catch (error) {
        setErrors((previous) => ({
          ...previous,
          [doc.slug]: String((error as Error).message),
        }));
        return;
      }
      savingRef.current = true;
      setSaving(doc.slug);
      try {
        const response = await fetch("/api/studio", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Studio-Token": token,
          },
          body: JSON.stringify(doc),
        });
        const result = await response.json();
        if (response.status === 409) {
          const diskDoc = {
            slug: doc.slug,
            source: result.disk || blankDocument(doc.slug).source,
            revision: result.diskRevision,
          };
          setConflicts((previous) => ({ ...previous, [doc.slug]: diskDoc }));
          throw new Error(
            "This file changed on disk. Export your version, then load the disk version to continue.",
          );
        }
        if (!response.ok) throw new Error(result.error || "Could not save.");
        saved.current.set(doc.slug, doc.source);
        setDocuments((previous) =>
          previous.map((item) =>
            item.slug === doc.slug
              ? { ...item, revision: result.revision }
              : item,
          ),
        );
        setErrors((previous) => ({ ...previous, [doc.slug]: "" }));
      } catch (error) {
        setErrors((previous) => ({
          ...previous,
          [doc.slug]: (error as Error).message,
        }));
      } finally {
        savingRef.current = false;
        setSaving(null);
      }
    },
    [token, conflicts],
  );

  useEffect(() => {
    if (!ready || !token || saving) return;
    const pending = documents.find(
      (doc) =>
        saved.current.get(doc.slug) !== doc.source &&
        !errors[doc.slug] &&
        !conflicts[doc.slug],
    );
    if (!pending) return;
    const timeout = setTimeout(() => void save(pending), 1400);
    return () => clearTimeout(timeout);
  }, [documents, ready, token, save, saving, errors, conflicts]);

  useEffect(() => {
    function keydown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (currentRef.current) {
          if (token) void save(currentRef.current);
          else
            setNotice(
              "Draft kept in this browser. Export MDX when you’re ready.",
            );
        }
      }
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [save, token]);

  function exportDocument() {
    if (!current) return;
    const url = URL.createObjectURL(
      new Blob([current.source], { type: "text/markdown;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${current.slug}.mdx`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("MDX exported.");
  }
  function createDocument(event: React.FormEvent) {
    event.preventDefault();
    const slug = newSlug.trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) {
      setNotice("Use lowercase letters, numbers, and hyphens.");
      return;
    }
    if (documents.some((doc) => doc.slug === slug)) {
      setNotice("That filename already exists. Choose another.");
      return;
    }
    setDocuments((previous) => [...previous, blankDocument(slug)]);
    setSelected(slug);
    setMode("visual");
    setCreating(false);
    setNewSlug("");
    setDetails(true);
    setNotice("New note created as a draft.");
  }
  function switchMode(next: "visual" | "source") {
    if (next === "visual" && current) {
      try {
        validateDocument(current.source);
      } catch (error) {
        setErrors((previous) => ({
          ...previous,
          [selected]: (error as Error).message,
        }));
        return;
      }
    }
    setMode(next);
    setGeneration((value) => value + 1);
  }
  let metadata: Record<string, unknown> = {},
    parseError = "";
  if (current) {
    try {
      metadata = splitDocument(current.source).metadata;
    } catch (error) {
      parseError = (error as Error).message;
    }
  }
  const dirty = current && saved.current.get(current.slug) !== current.source;
  const status =
    saving === selected
      ? "Saving to file…"
      : errors[selected]
        ? "Needs attention"
        : token
          ? dirty
            ? "Draft in browser · file save pending"
            : "Saved to file"
          : dirty
            ? "Draft saved in this browser"
            : "Browser workspace";
  const field = (key: string, value: string | boolean) => {
    if (current) change(updateMetadata(current.source, key, value));
  };

  return (
    <section className="writing-studio" aria-label="Writing studio">
      <div className="studio-heading">
        <div>
          <Link href="/" className="studio-back">
            <ArrowLeft size={13} /> Back to collection
          </Link>
          <h1>
            Writing room<span> / studio</span>
          </h1>
          <p>A little space to think out loud.</p>
        </div>
        <span className="studio-environment">
          <i />
          {token ? "Local workspace" : "Browser workspace"}
        </span>
      </div>
      <div className="studio-workspace">
        <aside className="studio-sidebar" aria-label="Documents">
          <div className="studio-sidebar-title">
            <span>
              YOUR PAGES{" "}
              <small>{documents.length.toString().padStart(2, "0")}</small>
            </span>
            <button
              onClick={() => setCreating(!creating)}
              aria-label="New note"
            >
              <Plus size={18} />
            </button>
          </div>
          {creating && (
            <form className="studio-create" onSubmit={createDocument}>
              <label htmlFor="new-slug">Filename</label>
              <input
                id="new-slug"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="a-new-idea"
                autoFocus
                required
              />
              <button type="submit">Create draft</button>
            </form>
          )}
          <label className="studio-search">
            <Search size={14} />
            <input
              aria-label="Find a page"
              placeholder="Find a page…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <nav className="studio-documents" aria-label="Choose a page">
            {documents
              .filter((doc) =>
                `${titleOf(doc)} ${doc.slug}`
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((doc) => (
                <button
                  key={doc.slug}
                  aria-current={selected === doc.slug ? "page" : undefined}
                  onClick={() => {
                    setSelected(doc.slug);
                    setMode("visual");
                    setGeneration((value) => value + 1);
                    setNotice("");
                  }}
                >
                  <FileText size={15} />
                  <span>
                    {titleOf(doc)}
                    <small>{doc.slug}.mdx</small>
                  </span>
                  {saved.current.get(doc.slug) !== doc.source && (
                    <i aria-label="Browser draft" />
                  )}
                </button>
              ))}
          </nav>
          <div className="studio-sidebar-foot">
            <span>YOUR WORDS, YOUR FILES</span>
            <p>
              {token
                ? "Changes autosave to your local MDX files. Commit and push to publish."
                : "Edits stay in this browser. Export MDX to add them to your repository."}
            </p>
            <a
              href="/studio"
              onClick={(e) => {
                e.preventDefault();
                setNotice(
                  "Run npm run dev in this repository and open /studio on localhost to save directly to your MDX files.",
                );
              }}
            >
              How file saving works <ArrowUpRight size={12} />
            </a>
          </div>
        </aside>
        <div className="studio-main">
          <div className="studio-controls">
            <div className="studio-mode" aria-label="Editor mode">
              <button
                aria-pressed={mode === "visual"}
                onClick={() => switchMode("visual")}
              >
                Write
              </button>
              <button
                aria-pressed={mode === "source"}
                onClick={() => switchMode("source")}
              >
                MDX
              </button>
            </div>
            <div className="studio-actions">
              <button
                className={details ? "is-active" : ""}
                aria-label="Page details"
                aria-expanded={details}
                onClick={() => setDetails(!details)}
              >
                <SlidersHorizontal size={15} />
                <span>Details</span>
              </button>
              <button onClick={exportDocument} disabled={!current || !ready}>
                <Download size={15} />
                <span>Export</span>
              </button>
              {token && (
                <button
                  onClick={() => current && void save(current)}
                  disabled={Boolean(saving) || !dirty}
                >
                  <Save size={15} />
                  <span>Save</span>
                </button>
              )}
            </div>
          </div>
          <div className="studio-status" role="status">
            <span>
              <i className={dirty ? "is-dirty" : ""} />
              {storageError || status}
            </span>
            <small>{current?.slug}.mdx</small>
          </div>
          {(notice || errors[selected] || parseError) && (
            <div
              className="studio-notice"
              role={errors[selected] || parseError ? "alert" : "status"}
            >
              {errors[selected] || parseError || notice}
              {conflicts[selected] && (
                <button
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Replace this browser draft with the disk version? Export first if you want to keep both.",
                      )
                    )
                      return;
                    const disk = conflicts[selected];
                    saved.current.set(selected, disk.source);
                    setDocuments((previous) =>
                      previous.map((doc) =>
                        doc.slug === selected ? disk : doc,
                      ),
                    );
                    setConflicts((previous) => {
                      const next = { ...previous };
                      delete next[selected];
                      return next;
                    });
                    setErrors((previous) => ({ ...previous, [selected]: "" }));
                    setGeneration((value) => value + 1);
                  }}
                >
                  Load disk version
                </button>
              )}
              <button
                aria-label="Dismiss notice"
                onClick={() => setNotice("")}
                hidden={Boolean(errors[selected] || parseError)}
              >
                <X size={14} />
              </button>
            </div>
          )}
          {details && current && !parseError && (
            <div className="studio-details">
              <label>
                Title
                <input
                  value={String(metadata.title || "")}
                  onChange={(e) => field("title", e.target.value)}
                />
              </label>
              <label className="studio-details-wide">
                Summary
                <textarea
                  rows={2}
                  value={String(metadata.summary || "")}
                  onChange={(e) => field("summary", e.target.value)}
                />
              </label>
              <label>
                Date
                <input
                  type="date"
                  value={String(metadata.publishedAt || "")}
                  onChange={(e) => field("publishedAt", e.target.value)}
                />
              </label>
              <label>
                Category
                <input
                  value={String(metadata.category || "")}
                  onChange={(e) => field("category", e.target.value)}
                />
              </label>
              <label>
                Shelf object
                <select
                  value={String(metadata.artwork || "floppy")}
                  onChange={(e) => field("artwork", e.target.value)}
                >
                  {[
                    "floppy",
                    "tape",
                    "cartridge",
                    "record",
                    "book",
                    "disk-white",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Object label
                <input
                  value={String(metadata.objectLabel || "")}
                  onChange={(e) => field("objectLabel", e.target.value)}
                />
              </label>
              <label className="studio-details-wide">
                Cover image URL
                <input
                  value={String(metadata.image || "")}
                  onChange={(e) => field("image", e.target.value)}
                  placeholder="/images/your-image.svg"
                />
              </label>
              <label className="studio-details-wide">
                Cover image description
                <input
                  value={String(metadata.imageAlt || "")}
                  onChange={(e) => field("imageAlt", e.target.value)}
                />
              </label>
              <label className="studio-check">
                <input
                  type="checkbox"
                  checked={metadata.draft === true || metadata.draft === "true"}
                  onChange={(e) => field("draft", e.target.checked)}
                />{" "}
                Mark as draft
              </label>
            </div>
          )}
          {!ready ? (
            <p className="studio-loading">Opening your workspace…</p>
          ) : (
            current && (
              <>
                {mode === "source" || parseError ? (
                  <div className="studio-source-wrap">
                    <p>
                      Full document · metadata, prose, and embedded components
                    </p>
                    <textarea
                      className="studio-source"
                      aria-label="MDX source"
                      spellCheck={false}
                      value={current.source}
                      onChange={(e) => change(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="studio-paper">
                    <div className="studio-paper-heading">
                      <span>{String(metadata.category || "NOTE")}</span>
                      <textarea
                        className="studio-title"
                        rows={2}
                        aria-label="Article title"
                        value={String(metadata.title || "")}
                        onChange={(e) => field("title", e.target.value)}
                        placeholder="Untitled note"
                      />
                      <textarea
                        aria-label="Article summary"
                        rows={2}
                        value={String(metadata.summary || "")}
                        onChange={(e) => field("summary", e.target.value)}
                        placeholder="What is this page about?"
                      />
                    </div>
                    <VisualEditor
                      key={`${selected}-${generation}`}
                      source={current.source}
                      onChange={change}
                      onError={(message) =>
                        setErrors((previous) => ({
                          ...previous,
                          [selected]: message,
                        }))
                      }
                      onSource={() => switchMode("source")}
                    />
                  </div>
                )}
                <div className="studio-bottom">
                  <span>{splitWords(current.source)} words</span>
                  <span>
                    {mode === "visual"
                      ? "Markdown shortcuts work here, too."
                      : "Custom components are preserved as MDX."}
                  </span>
                  <span>⌘ / Ctrl S</span>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </section>
  );
}

function splitWords(source: string) {
  try {
    return splitDocument(source).body.trim().split(/\s+/).filter(Boolean)
      .length;
  } catch {
    return 0;
  }
}
