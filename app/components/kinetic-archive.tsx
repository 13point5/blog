"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { Pause, Play, ArrowUpRight } from "lucide-react";
import type { Metadata } from "../blog/utils";
import { StudioArt } from "./studio-art";

type Post = { slug: string; metadata: Metadata };
const positions = [
  { x: 18.5, y: 31.25, mx: 25, my: 23, turn: -9, tilt: -5 },
  { x: 48.5, y: 23.61, mx: 73, my: 16, turn: 8, tilt: 3 },
  { x: 79, y: 29.86, mx: 25, my: 51, turn: -12, tilt: -3 },
  { x: 16, y: 64.58, mx: 73, my: 45, turn: 10, tilt: 4 },
  { x: 45.5, y: 66.67, mx: 26, my: 76, turn: -8, tilt: -4 },
  { x: 76.5, y: 63.19, mx: 73, my: 71, turn: 11, tilt: 4 },
];

function Suspension() {
  return <>
    <svg className="suspension suspension-wide" viewBox="0 0 1000 720" preserveAspectRatio="none" aria-hidden="true">
      <path className="suspension-stem" d="M480 0V87" />
      <path className="suspension-arm" d="M165 154Q480 20 790 154" />
      <path d="M165 154L185 225M490 87L485 170M790 154V215" />
      <path d="M345 102L334.5 334.5M655 105L716 352.25" />
      <path className="suspension-arm" d="M120 419Q340 255 538 409M629 388Q715 307 805 407" />
      <path d="M120 419L160 465M538 409L455 480M805 407L765 455" />
      <circle cx="480" cy="87" r="3" /><circle cx="345" cy="102" r="2.5" /><circle cx="655" cy="105" r="2.5" />
      <circle cx="334.5" cy="334.5" r="2.5" /><circle cx="716" cy="352.25" r="2.5" />
    </svg>
    <svg className="suspension suspension-narrow" viewBox="0 0 430 950" preserveAspectRatio="none" aria-hidden="true">
      <path className="suspension-stem" d="M210 0V84" />
      <path className="suspension-arm" d="M75 130Q210 37 344 114" />
      <path d="M75 130L107.5 218.5M344 114L313.9 152M203 84L182 359" />
      <path className="suspension-arm" d="M72 418Q180 311 346 373" />
      <path d="M72 418L107.5 484.5M346 373L313.9 427.5M182 359L182 611" />
      <path className="suspension-arm" d="M78 673Q187 560 345 629" />
      <path d="M78 673L111.8 722M345 629L313.9 674.5" />
      <circle cx="210" cy="84" r="2.5" /><circle cx="182" cy="359" r="2.5" /><circle cx="182" cy="611" r="2.5" />
    </svg>
  </>;
}

export function KineticArchive({ posts }: { posts: Post[] }) {
  const [paused, setPaused] = useState(false);
  const [inspecting, setInspecting] = useState<string | null>(null);
  const rig = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ x: number; y: number; dragged: boolean } | null>(null);
  const ignoreClick = useRef(false);

  function pose(x: number, y: number) {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    rig.current?.style.setProperty("--view-y", `${x}deg`);
    rig.current?.style.setProperty("--view-x", `${y}deg`);
  }
  function start(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    ignoreClick.current = false;
    gesture.current = { x: event.clientX, y: event.clientY, dragged: false };
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    const origin = gesture.current;
    if (origin) {
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.3) origin.dragged = true;
      if (origin.dragged) pose(Math.max(-20, Math.min(20, dx * .12)), 0);
    } else if (event.pointerType === "mouse") {
      const box = event.currentTarget.getBoundingClientRect();
      pose(((event.clientX - box.left) / box.width - .5) * 12, -((event.clientY - box.top) / box.height - .5) * 4);
    }
  }
  function release() {
    ignoreClick.current = gesture.current?.dragged || false;
    gesture.current = null;
    pose(0, 0);
  }

  const featured = posts.slice(0, positions.length);
  return <div className="kinetic-archive" data-motion={paused ? "paused" : "playing"}>
    <div className="archive-heading">
      <div><h1>Thoughts in motion.</h1><p>Notes on learning & making.</p></div>
      <Link className="archive-index-link" href="/browse">Index <span>{String(posts.length).padStart(2, "0")}</span><ArrowUpRight size={13} aria-hidden="true" /></Link>
    </div>
    <div className="kinetic-stage" onPointerDown={start} onPointerMove={move} onPointerUp={release}
      onPointerCancel={() => { gesture.current = null; ignoreClick.current = false; pose(0, 0); }}
      onPointerLeave={() => { if (gesture.current) release(); pose(0, 0); }}
      onClickCapture={event => {
        if (ignoreClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); }
        ignoreClick.current = false;
      }}>
      <div className="mobile-floor-shadow" aria-hidden="true" />
      <div className="mobile-viewpoint" ref={rig}>
        <div className="mobile-assembly">
          <Suspension />
          <ul className="suspended-objects" aria-label="Explore the collection">
            {featured.map((post, index) => {
              const place = positions[index];
              const style = {
                "--x": `${place.x}%`, "--y": `${place.y}%`, "--mobile-x": `${place.mx}%`, "--mobile-y": `${place.my}%`,
                "--turn": `${place.turn}deg`, "--tilt": `${place.tilt}deg`, "--swing-delay": `${index * -2.7}s`,
              } as CSSProperties;
              return <li className="hanging-artifact" key={post.slug} style={style}>
                <Link href={`/blog/${post.slug}`} className="artifact-link" draggable={false} aria-label={`Read ${post.metadata.title}`}
                  onMouseEnter={() => setInspecting(post.slug)} onMouseLeave={() => setInspecting(null)}
                  onFocus={() => setInspecting(post.slug)} onBlur={() => setInspecting(null)}>
                  <div className="artifact-swing">
                    <span className="hanging-loop" aria-hidden="true" />
                    <div className={`artifact-volume artifact-${post.metadata.artwork || "disk"}`}>
                      <div className="artifact-edge" aria-hidden="true" />
                      <StudioArt kind={post.metadata.artwork} label={post.metadata.objectLabel || post.metadata.title} number={String(index + 1).padStart(2, "0")} />
                    </div>
                    <span className="artifact-caption"><small>{String(index + 1).padStart(2, "0")}</small>{post.metadata.objectLabel || post.metadata.title}<ArrowUpRight size={11} aria-hidden="true" /></span>
                  </div>
                </Link>
              </li>;
            })}
          </ul>
        </div>
      </div>
    </div>
    <div className="archive-bottom">
      <p className="sculpture-instruction"><span className="pointer-instruction">Move a little. Follow your curiosity.</span><span className="touch-instruction">Drag gently to turn. Tap a piece to read.</span></p>
      <button className="motion-control" aria-pressed={paused} aria-label={paused ? "Resume sculpture motion" : "Pause sculpture motion"} onClick={() => { pose(0, 0); setPaused(value => !value); }}>
        {paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}<span>{paused ? "Still" : "In motion"}</span>
      </button>
    </div>
    <p className="inspected-title" aria-hidden="true">{posts.find(post => post.slug === inspecting)?.metadata.title || "A few ideas, loosely connected."}</p>
  </div>;
}
