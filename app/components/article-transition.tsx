"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { StudioArt } from "./studio-art";

type Entry = { slug: string; title: string; kind?: string; label: string; number: string };
type ActiveEntry = Entry & { from: string; started: number };
type Frame = { x: number; y: number; width: number; height: number; viewportWidth: number; viewportHeight: number };
type Phase = "inserting" | "screen" | "zoom";
const TransitionContext = createContext<(event: MouseEvent<HTMLAnchorElement>, entry: Entry) => void>(() => {});
const INSERT_MS = 1450;
const SCREEN_MS = 300;
const ZOOM_MS = 1050;
const bays = ["disk", "tape", "cartridge", "record", "book"];
const bayNames: Record<string, string> = { disk: "Disk", tape: "Tape", cartridge: "Cart", record: "Vinyl", book: "Paper" };

export function useArticleTransition() { return useContext(TransitionContext); }

export function ArticleTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<ActiveEntry | null>(null);
  const [phase, setPhase] = useState<Phase>("inserting");
  const [frame, setFrame] = useState<Frame | null>(null);
  const content = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const lock = useRef(false);
  const arrived = useRef(false);

  function finish() {
    lock.current = false;
    setActive(null);
    setFrame(null);
    setPhase("inserting");
    if (content.current) content.current.inert = false;
    requestAnimationFrame(() => document.getElementById("main-content")?.focus({ preventScroll: true }));
  }

  function open(event: MouseEvent<HTMLAnchorElement>, entry: Entry) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    arrived.current = false;
    setPhase("inserting");
    setActive({ ...entry, from: pathname, started: performance.now() });
    router.push(`/blog/${entry.slug}`);
  }

  useEffect(() => {
    if (!active) return;
    const element = content.current;
    if (element) element.inert = true;
    skip.current?.focus({ preventScroll: true });
    const measure = () => {
      const box = screen.current?.getBoundingClientRect();
      const bounds = viewport.current?.getBoundingClientRect();
      if (box && bounds) setFrame({ x: box.x, y: box.y, width: box.width, height: box.height, viewportWidth: bounds.width, viewportHeight: bounds.height });
    };
    const raf = requestAnimationFrame(measure);
    // History, orientation changes, and restored tabs should never trap a reader.
    const cancel = () => finish();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => { if (motion.matches) finish(); };
    window.addEventListener("popstate", cancel);
    window.addEventListener("pageshow", cancel);
    window.addEventListener("resize", cancel);
    motion.addEventListener("change", onMotion);
    return () => {
      cancelAnimationFrame(raf);
      if (element) element.inert = false;
      window.removeEventListener("popstate", cancel);
      window.removeEventListener("pageshow", cancel);
      window.removeEventListener("resize", cancel);
      motion.removeEventListener("change", onMotion);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const target = `/blog/${active.slug}`;
    if (pathname === target) arrived.current = true;
    if (pathname !== target && (pathname !== active.from || arrived.current)) {
      const cancel = window.setTimeout(finish, 0);
      return () => window.clearTimeout(cancel);
    }
    if (pathname !== target) return;
    const remaining = Math.max(0, INSERT_MS - (performance.now() - active.started));
    const show = window.setTimeout(() => { window.scrollTo(0, 0); setPhase("screen"); }, remaining);
    const zoom = window.setTimeout(() => setPhase("zoom"), remaining + SCREEN_MS);
    const done = window.setTimeout(finish, remaining + SCREEN_MS + ZOOM_MS + 40);
    return () => { window.clearTimeout(show); window.clearTimeout(zoom); window.clearTimeout(done); };
  }, [active, pathname]);

  const kind = active?.kind === "disk-white" ? "disk" : active?.kind || "disk";
  const zooming = phase === "zoom";
  const preview = active && frame;
  const windowStyle: CSSProperties | undefined = preview ? {
    clipPath: zooming ? "inset(0px 0px 0px 0px round 0px)" : `inset(${frame.y}px ${frame.viewportWidth - frame.x - frame.width}px ${frame.viewportHeight - frame.y - frame.height}px ${frame.x}px round 7px)`,
  } : undefined;
  const pageStyle: CSSProperties | undefined = preview ? {
    width: frame.viewportWidth,
    transform: zooming ? "translate3d(0px, 0px, 0px) scale(1)" : `translate3d(${frame.x}px, ${frame.y}px, 0px) scale(${frame.width / frame.viewportWidth})`,
  } : undefined;
  const cameraStyle: CSSProperties | undefined = frame ? {
    transformOrigin: `${frame.x + frame.width / 2}px ${frame.y + frame.height / 2}px`,
    transform: zooming ? `translate3d(${frame.viewportWidth / 2 - frame.x - frame.width / 2}px, ${frame.viewportHeight / 2 - frame.y - frame.height / 2}px, 0) scale(${Math.max(frame.viewportWidth / frame.width, frame.viewportHeight / frame.height) * 1.18})` : "translate3d(0px, 0px, 0px) scale(1)",
  } : undefined;

  return <TransitionContext.Provider value={open}>
    {/* This is the actual article DOM, first framed by the screen, then expanded. */}
    <div ref={viewport} className={`site-window${active ? " site-window-loading" : ""}`} data-phase={phase} style={windowStyle}>
      <div ref={content} className="site-content" style={pageStyle}>{children}</div>
    </div>
    {active && <div className="article-entry" data-phase={phase}>
      <div className="entry-camera" style={cameraStyle} aria-hidden="true">
        <div className={`entry-stage entry-${kind}`}>
          <div className="entry-ground" />
          <div className="entry-computer">
            <div className="entry-monitor"><div ref={screen} className="entry-screen"><span className="entry-screen-prompt">READING<span>_</span></span></div></div>
            <div className="entry-brand"><span>S / R</span><i className="entry-power" /><span>MEDIA TERMINAL</span></div>
            {bays.map(bay => <div key={bay} className={`entry-bay entry-bay-${bay}${bay === kind ? " entry-bay-active" : ""}`}><span className="entry-bay-label">{bayNames[bay]}</span><div className="entry-slot" /><i className="entry-bay-light" /></div>)}
            <div className="entry-vents"><i /><i /><i /><i /><i /></div>
          </div>
          <div className="entry-insertion-mask"><div className="entry-moving-object"><StudioArt kind={active.kind} label={active.label} number={active.number} /></div></div>
        </div>
      </div>
      <div className="entry-caption"><p className="entry-status" role="status">Opening <span>{active.title}</span></p></div>
    </div>}
    {active && <button ref={skip} className="entry-skip" onClick={finish}>Skip animation <span aria-hidden="true">↗</span></button>}
  </TransitionContext.Provider>;
}
