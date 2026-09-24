"use client";

import { createContext, useContext, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { StudioArt } from "./studio-art";

type Entry = { slug: string; title: string; kind?: string; label: string; number: string };
type ActiveEntry = Entry & { from: string; started: number };
const TransitionContext = createContext<(event: MouseEvent<HTMLAnchorElement>, entry: Entry) => void>(() => {});
const DURATION = 1150;

export function useArticleTransition() { return useContext(TransitionContext); }

function Reader({ kind }: { kind: string }) {
  if (kind === "record") return <div className="entry-turntable"><div className="entry-platter" /><div className="entry-tonearm" /><i className="entry-power" /></div>;
  if (kind === "book") return <div className="entry-bookstand"><div /><span /></div>;
  return <><div className={`entry-monitor entry-monitor-${kind}`}><div className="entry-screen"><div className="entry-screen-paper"><i /><i /><i /><i /></div><span>READING<span className="entry-screen-cursor">_</span></span></div><span className="entry-monitor-mark">S / R</span></div><div className={`entry-reader entry-reader-${kind}`}>
    <div className="entry-reader-top"><span className="entry-slot" /></div>
    <div className="entry-reader-face">
      {kind === "tape" ? <><div className="entry-deck-window"><i /><span /><i /></div><div className="entry-deck-keys"><i /><i /><i /><i /></div></> : kind === "cartridge" ? <><span className="entry-console-cross" /><span className="entry-console-buttons"><i /><i /></span></> : <><span className="entry-drive-mark">3.5</span><span className="entry-eject" /></>}
      <i className="entry-power" />
    </div>
  </div></>;
}

export function ArticleTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [active, setActive] = useState<ActiveEntry | null>(null);
  const [leaving, setLeaving] = useState(false);
  const content = useRef<HTMLDivElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const lock = useRef(false);
  const arrived = useRef(false);

  function finish() {
    lock.current = false;
    setActive(null);
    setLeaving(false);
    if (content.current) content.current.inert = false;
    requestAnimationFrame(() => document.getElementById("main-content")?.focus({ preventScroll: true }));
  }

  function open(event: MouseEvent<HTMLAnchorElement>, entry: Entry) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    event.preventDefault();
    if (lock.current) return;
    lock.current = true;
    arrived.current = false;
    setLeaving(false);
    setActive({ ...entry, from: pathname, started: performance.now() });
    router.push(`/blog/${entry.slug}`);
  }

  useEffect(() => {
    if (!active) return;
    const element = content.current;
    if (element) element.inert = true;
    skip.current?.focus({ preventScroll: true });
    // A backgrounded tab must not leave an obsolete transition covering the page.
    const onPageShow = () => finish();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotion = () => { if (motion.matches) finish(); };
    window.addEventListener("popstate", onPageShow);
    window.addEventListener("pageshow", onPageShow);
    motion.addEventListener("change", onMotion);
    return () => {
      if (element) element.inert = false;
      window.removeEventListener("popstate", onPageShow);
      window.removeEventListener("pageshow", onPageShow);
      motion.removeEventListener("change", onMotion);
    };
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const target = `/blog/${active.slug}`;
    if (pathname === target) arrived.current = true;
    // Other navigation (including history) takes precedence over the animation.
    if (pathname !== target && (pathname !== active.from || arrived.current)) {
      const cancel = window.setTimeout(finish, 0);
      return () => window.clearTimeout(cancel);
    }
    if (pathname !== target) return;
    const remaining = Math.max(0, DURATION - (performance.now() - active.started));
    const fade = window.setTimeout(() => setLeaving(true), remaining);
    const done = window.setTimeout(finish, remaining + 160);
    return () => { window.clearTimeout(fade); window.clearTimeout(done); };
  }, [active, pathname]);

  const kind = active?.kind === "disk-white" ? "disk" : active?.kind || "disk";
  return <TransitionContext.Provider value={open}>
    <div ref={content} className="site-content">{children}</div>
    {active && <div className={`article-entry${leaving ? " article-entry-leaving" : ""}`}>
      <div className={`entry-stage entry-${kind}`} aria-hidden="true">
        <div className="entry-ground" />
        <div className="entry-insertion-mask"><div className="entry-moving-object"><StudioArt kind={active.kind} label={active.label} number={active.number} /></div></div>
        <Reader kind={kind} />
      </div>
      <p className="entry-status" role="status">Opening <span>{active.title}</span></p>
      <button ref={skip} className="entry-skip" onClick={finish}>Skip animation <span aria-hidden="true">↗</span></button>
    </div>}
  </TransitionContext.Provider>;
}
