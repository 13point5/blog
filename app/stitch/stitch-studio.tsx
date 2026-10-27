"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  chartToPattern,
  DEFAULT_CONVERT,
  imageToPattern,
  stitchCounts,
  type ConvertOptions,
  type Pattern,
} from "@/lib/stitch/pattern";
import {
  FABRICS,
  outlineEdges,
  outlineThread,
  renderChart,
  renderStitched,
  skeinsFor,
  type FabricId,
  type RenderOptions,
} from "@/lib/stitch/render";
import { SAMPLES, type Sample } from "@/lib/stitch/samples";

type Source =
  | { kind: "chart"; id: string; title: string; pattern: Pattern }
  | { kind: "image"; id: string; title: string; image: HTMLImageElement };

type View = "stitched" | "chart";

const FABRIC_COUNTS = [11, 14, 16, 18] as const;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Pick a stitch size that keeps the canvas detailed but within sane memory. */
function cellSizeFor(p: Pattern, margin: number) {
  const span = Math.max(p.cols, p.rows) + margin * 2;
  return Math.max(12, Math.min(36, Math.floor(2600 / span)));
}

export function StitchStudio() {
  const [source, setSource] = useState<Source | null>(null);
  const [convert, setConvert] = useState<ConvertOptions>(DEFAULT_CONVERT);
  const [fabric, setFabric] = useState<FabricId>("white");
  const [strands, setStrands] = useState<1 | 2 | 3>(2);
  const [backstitch, setBackstitch] = useState(false);
  const [hoop, setHoop] = useState(false);
  const [fabricCount, setFabricCount] = useState<number>(14);
  const [view, setView] = useState<View>("stitched");
  const [pattern, setPattern] = useState<Pattern | null>(null);
  const [busy, setBusy] = useState(true);
  const [dragging, setDragging] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectSample = useCallback(async (s: Sample) => {
    setFabric(s.fabric);
    setBackstitch(!!s.backstitch);
    if (s.kind === "chart") {
      setSource({ kind: "chart", id: s.id, title: s.title, pattern: chartToPattern(s.grid, s.key) });
    } else {
      setConvert((c) => ({ ...c, width: s.width, colors: s.colors }));
      const image = await loadImage(s.src);
      setSource({ kind: "image", id: s.id, title: s.title, image });
    }
  }, []);

  const openFile = useCallback(async (file: File | undefined | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    try {
      const image = await loadImage(url);
      setConvert((c) => ({ ...c, width: DEFAULT_CONVERT.width, colors: DEFAULT_CONVERT.colors }));
      setSource({ kind: "image", id: `upload-${Date.now()}`, title: file.name.replace(/\.[^.]+$/, ""), image });
    } finally {
      URL.revokeObjectURL(url);
    }
  }, []);

  useEffect(() => {
    selectSample(SAMPLES[0]);
  }, [selectSample]);

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) => i.type.startsWith("image/"));
      if (item) openFile(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [openFile]);

  // Image -> chart (debounced so sliders stay smooth).
  useEffect(() => {
    if (!source) return;
    if (source.kind === "chart") {
      setPattern(source.pattern);
      return;
    }
    setBusy(true);
    const t = setTimeout(() => setPattern(imageToPattern(source.image, convert)), 120);
    return () => clearTimeout(t);
  }, [source, convert]);

  const margin = hoop ? 0 : 5;
  const renderOpts = useMemo<RenderOptions | null>(
    () => (pattern ? { fabric, strands, backstitch, hoop, margin, cell: cellSizeFor(pattern, margin) } : null),
    [pattern, fabric, strands, backstitch, hoop, margin]
  );

  // Chart -> pixels. Deferred a frame so the "stitching" state can paint first.
  useEffect(() => {
    if (!pattern || !renderOpts || !canvasRef.current) return;
    setBusy(true);
    const canvas = canvasRef.current;
    const id = setTimeout(() => {
      if (view === "stitched") renderStitched(canvas, pattern, renderOpts);
      else renderChart(canvas, pattern, Math.max(14, Math.min(26, Math.floor(1800 / Math.max(pattern.cols, pattern.rows)))));
      setBusy(false);
    }, 30);
    return () => clearTimeout(id);
  }, [pattern, renderOpts, view]);

  const download = () => {
    canvasRef.current?.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${(source?.title ?? "stitch").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${view}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
  };

  return (
    <div className="mt-8 flex flex-col gap-10">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div
          className={cn(
            "relative rounded-xl border border-border bg-background-card overflow-hidden transition-colors",
            dragging && "border-foreground"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            openFile(e.dataTransfer.files?.[0]);
          }}
        >
          <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-border">
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "stitched", label: "Stitched" },
                { value: "chart", label: "Chart" },
              ]}
            />
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                <ImagePlus /> <span className="hidden sm:inline">Upload</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={download} disabled={busy}>
                <Download /> <span className="hidden sm:inline">PNG</span>
              </Button>
            </div>
          </div>

          <Preview canvasRef={canvasRef} busy={busy} loupe={view === "stitched"} />

          {dragging && (
            <div className="absolute inset-0 grid place-items-center bg-background/80 text-sm font-medium pointer-events-none">
              Drop an image to stitch it
            </div>
          )}
        </div>

        <Controls
          isImage={source?.kind === "image"}
          convert={convert}
          setConvert={setConvert}
          fabric={fabric}
          setFabric={setFabric}
          fabricCount={fabricCount}
          setFabricCount={setFabricCount}
          strands={strands}
          setStrands={setStrands}
          backstitch={backstitch}
          setBackstitch={setBackstitch}
          hoop={hoop}
          setHoop={setHoop}
        />
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          openFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {pattern && (
        <ThreadKey
          pattern={pattern}
          title={source?.title ?? ""}
          fabric={fabric}
          fabricCount={fabricCount}
          strands={strands}
          backstitch={backstitch}
        />
      )}

      <Gallery activeId={source?.id} onSelect={selectSample} onUpload={() => fileRef.current?.click()} />
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Preview({
  canvasRef,
  busy,
  loupe,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  busy: boolean;
  loupe: boolean;
}) {
  const loupeRef = useRef<HTMLCanvasElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const SIZE = 168;
  const ZOOM = 3;

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!loupe || e.pointerType !== "mouse") return;
    const canvas = canvasRef.current;
    const lens = loupeRef.current;
    if (!canvas || !lens) return;
    const rect = canvas.getBoundingClientRect();
    const k = canvas.width / rect.width;
    const cx = (e.clientX - rect.left) * k;
    const cy = (e.clientY - rect.top) * k;
    const dpr = window.devicePixelRatio || 1;
    lens.width = SIZE * dpr;
    lens.height = SIZE * dpr;
    const span = (SIZE * k) / ZOOM;
    const ctx = lens.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, lens.width, lens.height);
    ctx.drawImage(canvas, cx - span / 2, cy - span / 2, span, span, 0, 0, lens.width, lens.height);
    const parent = canvas.parentElement!.getBoundingClientRect();
    setPos({ x: e.clientX - parent.left, y: e.clientY - parent.top });
  };

  return (
    <div className="relative flex items-center justify-center p-4 sm:p-6 min-h-[320px] bg-[radial-gradient(circle_at_30%_20%,var(--background-alt),transparent_70%)]">
      <canvas
        ref={canvasRef}
        onPointerMove={onMove}
        onPointerLeave={() => setPos(null)}
        className={cn(
          "max-w-full max-h-[72vh] w-auto h-auto rounded-sm transition-opacity duration-300",
          busy && "opacity-60",
          loupe && "cursor-zoom-in"
        )}
      />
      <canvas
        ref={loupeRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-full border-2 border-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
          !pos && "hidden"
        )}
        style={{
          width: SIZE,
          height: SIZE,
          left: (pos?.x ?? 0) - SIZE / 2,
          top: (pos?.y ?? 0) - SIZE / 2,
        }}
      />
      {busy && (
        <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-xs text-foreground-muted shadow-sm">
          <Loader2 className="size-3 animate-spin" /> stitching…
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Controls(props: {
  isImage: boolean;
  convert: ConvertOptions;
  setConvert: React.Dispatch<React.SetStateAction<ConvertOptions>>;
  fabric: FabricId;
  setFabric: (f: FabricId) => void;
  fabricCount: number;
  setFabricCount: (n: number) => void;
  strands: 1 | 2 | 3;
  setStrands: (n: 1 | 2 | 3) => void;
  backstitch: boolean;
  setBackstitch: (b: boolean) => void;
  hoop: boolean;
  setHoop: (b: boolean) => void;
}) {
  const { convert, setConvert } = props;
  const set = <K extends keyof ConvertOptions>(k: K, v: ConvertOptions[K]) => setConvert((c) => ({ ...c, [k]: v }));

  return (
    <aside className="flex flex-col gap-6 text-sm">
      {props.isImage && (
        <Group title="Pattern">
          <Slider label="Width" unit="stitches" min={20} max={140} value={convert.width} onChange={(v) => set("width", v)} />
          <Slider label="Colours" unit="threads" min={2} max={32} value={convert.colors} onChange={(v) => set("colors", v)} />
          <Toggle label="Remove background" checked={convert.removeBackground} onChange={(v) => set("removeBackground", v)} />
          {convert.removeBackground && (
            <Slider label="Tolerance" min={2} max={40} value={convert.backgroundTolerance} onChange={(v) => set("backgroundTolerance", v)} />
          )}
          <Toggle
            label="Tidy confetti"
            hint="Merge lone single stitches into their neighbours"
            checked={convert.cleanup}
            onChange={(v) => set("cleanup", v)}
          />
          <Toggle label="Match DMC threads" checked={convert.dmc} onChange={(v) => set("dmc", v)} />
        </Group>
      )}

      <Group title="Fabric">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(FABRICS) as FabricId[]).map((id) => {
            const f = FABRICS[id];
            return (
              <button
                key={id}
                type="button"
                title={f.label}
                aria-label={f.label}
                aria-pressed={props.fabric === id}
                onClick={() => props.setFabric(id)}
                className={cn(
                  "size-8 rounded-full border border-border cursor-pointer transition-transform hover:scale-110",
                  props.fabric === id && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                )}
                style={{
                  backgroundColor: `rgb(${f.base.join(",")})`,
                  backgroundImage: `radial-gradient(rgb(${f.hole.join(",")}) 18%, transparent 22%)`,
                  backgroundSize: "6px 6px",
                }}
              />
            );
          })}
        </div>
        <Field label="Aida count">
          <Segmented
            value={String(props.fabricCount)}
            onChange={(v) => props.setFabricCount(Number(v))}
            options={FABRIC_COUNTS.map((n) => ({ value: String(n), label: `${n}` }))}
          />
        </Field>
      </Group>

      <Group title="Thread">
        <Field label="Strands of floss">
          <Segmented
            value={String(props.strands)}
            onChange={(v) => props.setStrands(Number(v) as 1 | 2 | 3)}
            options={[1, 2, 3].map((n) => ({ value: String(n), label: String(n) }))}
          />
        </Field>
        <Toggle
          label="Backstitch outline"
          hint="One strand around shapes and strong colour changes"
          checked={props.backstitch}
          onChange={props.setBackstitch}
        />
        <Toggle label="Show in a hoop" checked={props.hoop} onChange={props.setHoop} />
      </Group>
    </aside>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground-muted">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      {children}
    </div>
  );
}

function Slider(props: { label: string; unit?: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex justify-between">
        <span>{props.label}</span>
        <span className="tabular-nums text-foreground-muted">
          {props.value}
          {props.unit ? ` ${props.unit}` : ""}
        </span>
      </span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="w-full accent-[var(--foreground)] cursor-pointer"
      />
    </label>
  );
}

function Toggle(props: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      onClick={() => props.onChange(!props.checked)}
      className="flex items-start justify-between gap-3 text-left cursor-pointer group"
    >
      <span className="flex flex-col">
        <span>{props.label}</span>
        {props.hint && <span className="text-xs text-foreground-muted leading-snug">{props.hint}</span>}
      </span>
      <span
        className={cn(
          "mt-0.5 relative h-5 w-9 shrink-0 rounded-full border border-border transition-colors",
          props.checked ? "bg-foreground" : "bg-background-alt"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-3.5 rounded-full bg-background shadow-sm transition-transform",
            props.checked && "translate-x-4"
          )}
        />
      </span>
    </button>
  );
}

function Segmented<T extends string>(props: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="inline-flex rounded-lg bg-background-alt p-0.5 text-sm">
      {props.options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={props.value === o.value}
          onClick={() => props.onChange(o.value)}
          className={cn(
            "px-2.5 py-1 rounded-md cursor-pointer transition-colors",
            props.value === o.value
              ? "bg-background-card text-foreground shadow-sm"
              : "text-foreground-muted hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function ThreadSwatch({ hex, fabric }: { hex: string; fabric: FabricId }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const swatch = chartToPattern(["xx", "xx"], { x: "B5200" });
    const n = parseInt(hex.slice(1), 16);
    swatch.palette[0] = { ...swatch.palette[0], rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], hex };
    renderStitched(ref.current, swatch, { fabric, strands: 2, backstitch: false, hoop: false, margin: 0, cell: 16 });
  }, [hex, fabric]);
  return <canvas ref={ref} className="size-7 rounded-[3px] shrink-0" aria-hidden />;
}

function ThreadKey(props: {
  pattern: Pattern;
  title: string;
  fabric: FabricId;
  fabricCount: number;
  strands: 1 | 2 | 3;
  backstitch: boolean;
}) {
  const { pattern: p, fabricCount } = props;
  const counts = useMemo(() => stitchCounts(p), [p]);
  const total = counts.reduce((a, b) => a + b, 0);
  const outline = useMemo(() => (props.backstitch ? outlineThread(p) : null), [p, props.backstitch]);
  const outlineLen = useMemo(() => (props.backstitch ? outlineEdges(p).length : 0), [p, props.backstitch]);
  const inches = (n: number) => n / fabricCount;
  const size = `${inches(p.cols).toFixed(1)} × ${inches(p.rows).toFixed(1)} in (${(inches(p.cols) * 2.54).toFixed(1)} × ${(inches(p.rows) * 2.54).toFixed(1)} cm)`;
  const skeins = (n: number) => Math.max(1, Math.ceil(skeinsFor(n, props.strands, fabricCount)));

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-xl font-semibold">Thread key</h2>
        <p className="text-sm text-foreground-muted">
          {p.cols} × {p.rows} stitches · {total.toLocaleString()} crosses · {size} on {fabricCount}-count aida
        </p>
      </div>
      <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
        {p.palette.map((e, i) => (
          <div key={e.hex + i} className="flex items-center gap-3 py-1.5 border-b border-border/60 text-sm">
            <span className="w-4 text-center text-foreground-muted">{e.symbol}</span>
            <ThreadSwatch hex={e.hex} fabric={props.fabric} />
            <span className="min-w-0 flex-1 truncate">
              {e.code ? (
                <>
                  <span className="font-medium tabular-nums">DMC {e.code}</span>{" "}
                  <span className="text-foreground-muted">{e.name}</span>
                </>
              ) : (
                <span className="font-mono text-foreground-muted">{e.hex}</span>
              )}
            </span>
            <span className="text-xs tabular-nums text-foreground-muted whitespace-nowrap" title={`${counts[i]} stitches`}>
              {counts[i].toLocaleString()} · {skeins(counts[i])} sk
            </span>
          </div>
        ))}
        {outline && (
          <div className="flex items-center gap-3 py-1.5 border-b border-border/60 text-sm">
            <span className="w-4 text-center text-foreground-muted">—</span>
            <span className="size-7 shrink-0 grid place-items-center">
              <span className="block h-1 w-6 rounded-full" style={{ background: outline.hex }} />
            </span>
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium tabular-nums">DMC {outline.code}</span>{" "}
              <span className="text-foreground-muted">backstitch, 1 strand</span>
            </span>
            <span className="text-xs tabular-nums text-foreground-muted whitespace-nowrap">{outlineLen} st</span>
          </div>
        )}
      </div>
      <p className="text-xs text-foreground-muted">
        Skeins assume {props.strands}-strand cross stitch on {fabricCount}-count with a little waste. Thread colours:{" "}
        <a href="https://makebead.com/" className="link-default" target="_blank" rel="noreferrer">
          MakeBead
        </a>{" "}
        craft-color-codes (CC BY 4.0).
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Gallery({
  activeId,
  onSelect,
  onUpload,
}: {
  activeId?: string;
  onSelect: (s: Sample) => void;
  onUpload: () => void;
}) {
  const [thumbs, setThumbs] = useState<Record<string, string>>({});

  // Stitch the thumbnails one at a time, after the main canvas has had its turn.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const s of SAMPLES) {
        await new Promise((r) => setTimeout(r, 60));
        if (cancelled) return;
        const pattern =
          s.kind === "chart"
            ? chartToPattern(s.grid, s.key)
            : imageToPattern(await loadImage(s.src), { ...DEFAULT_CONVERT, width: s.width, colors: s.colors });
        const canvas = document.createElement("canvas");
        const cell = Math.max(8, Math.floor(420 / Math.max(pattern.cols + 6, pattern.rows + 6)));
        renderStitched(canvas, pattern, { fabric: s.fabric, strands: 2, backstitch: !!s.backstitch, hoop: false, margin: 3, cell });
        const url = canvas.toDataURL("image/jpeg", 0.88);
        if (!cancelled) setThumbs((t) => ({ ...t, [s.id]: url }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-semibold">Gallery</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={onUpload}
          className="group aspect-[4/5] rounded-xl border border-dashed border-border flex flex-col items-center justify-center gap-2 text-sm text-foreground-muted hover:text-foreground hover:border-foreground transition-colors cursor-pointer"
        >
          <ImagePlus className="size-6 transition-transform group-hover:-translate-y-0.5" />
          <span className="font-medium">Stitch your own</span>
          <span className="text-xs px-4 text-center">Upload, drop or paste an image</span>
        </button>
        {SAMPLES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s)}
            className={cn(
              "group flex flex-col gap-2 text-left cursor-pointer",
              activeId === s.id && "[&_.thumb]:ring-2 [&_.thumb]:ring-foreground"
            )}
          >
            <div className="thumb aspect-[4/5] rounded-xl overflow-hidden border border-border bg-background-alt grid place-items-center transition-transform group-hover:-translate-y-0.5">
              {thumbs[s.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbs[s.id]} alt={s.title} className="h-full w-full object-cover" />
              ) : (
                <Loader2 className="size-4 animate-spin text-foreground-muted" />
              )}
            </div>
            <span className="text-sm font-medium">{s.title}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
