"use client";

import Link from "next/link";
import { useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "../blog/utils";
import { StudioArt } from "./studio-art";

type Post = { slug: string; metadata: Metadata };
type Shelf = { name: string; description: string; posts: Post[] };
export type CollectionView = "library" | "store";

function organize(posts: Post[]): Shelf[] {
  const learning = (post: Post) => /experiments|reinforcement|world models/i.test(post.metadata.category || "");
  return [
    { name: "Learning machines", description: "Rewards, environments & imagined worlds", posts: posts.filter(learning) },
    { name: "Understanding machines", description: "Architectures, evaluations & proof", posts: posts.filter(post => !learning(post)) },
  ].filter(shelf => shelf.posts.length);
}

function Artwork({ post, number }: { post: Post; number: number }) {
  return <StudioArt kind={post.metadata.artwork} label={post.metadata.objectLabel || post.metadata.title} number={String(number).padStart(2, "0")} />;
}

function Library({ shelves, posts }: { shelves: Shelf[]; posts: Post[] }) {
  return <div className="media-library">
    <p className="shelf-hint">Swipe along the shelves <span aria-hidden="true">↔</span></p>
    {shelves.map((shelf, shelfIndex) => <section className="library-section" key={shelf.name} aria-labelledby={`shelf-${shelfIndex}`}>
      <header className="shelf-heading">
        <span className="shelf-number" aria-hidden="true">0{shelfIndex + 1}</span>
        <div><h2 id={`shelf-${shelfIndex}`}>{shelf.name}</h2><p>{shelf.description}</p></div>
        <span className="shelf-count">{shelf.posts.length} pieces</span>
      </header>
      <div className="shelf-viewport" tabIndex={0} role="region" aria-label={`${shelf.name} shelf, scroll to browse`}>
        <div className="shelf-track">
          <div className="shelf-ledge" aria-hidden="true" />
          <ul className="shelf-items">
            {shelf.posts.map((post, index) => <li key={post.slug} style={{ "--rest-angle": `${[-3, 2, -1][index % 3]}deg` } as CSSProperties}>
              <Link href={`/blog/${post.slug}`} className="collection-object shelf-object" aria-label={post.metadata.title}>
                <div className="shelf-art"><Artwork post={post} number={posts.indexOf(post) + 1} /></div>
                <div className="object-caption"><span>{post.metadata.title}</span><small>{post.metadata.draft === "true" ? "note" : "essay"}</small></div>
              </Link>
            </li>)}
          </ul>
        </div>
      </div>
    </section>)}
  </div>;
}

function RecordStore({ shelves, posts }: { shelves: Shelf[]; posts: Post[] }) {
  const [shelfIndex, setShelfIndex] = useState(0);
  const [active, setActive] = useState(0);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const shelf = shelves[shelfIndex];
  const selected = shelf.posts[active];
  const move = (step: number) => setActive(index => (index + step + shelf.posts.length) % shelf.posts.length);

  function startSwipe(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    gesture.current = { x: event.clientX, y: event.clientY };
    suppressClick.current = false;
  }
  function endSwipe(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(event.clientY - start.y) * 1.5) {
      suppressClick.current = true;
      move(dx < 0 ? 1 : -1);
    }
  }

  return <div className="record-store">
    <div className="bin-tabs" role="group" aria-label="Choose a collection">
      {shelves.map((item, index) => <button key={item.name} aria-pressed={shelfIndex === index} onClick={() => { setShelfIndex(index); setActive(0); }}>
        <span>{item.name}</span><small>{String(item.posts.length).padStart(2, "0")}</small>
      </button>)}
    </div>
    <section className="bin-browser" aria-label={shelf.name}>
      <div className="bin-column">
        <div className="record-bin" role="group" aria-roledescription="carousel" aria-label="Browse the objects. Use Left and Right arrow keys to flip through." tabIndex={0}
          onKeyDown={event => {
            if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); move(event.key === "ArrowRight" ? 1 : -1); }
            if (event.key === "Home" || event.key === "End") { event.preventDefault(); event.currentTarget.focus({ preventScroll: true }); setActive(event.key === "Home" ? 0 : shelf.posts.length - 1); }
          }}
          onPointerDown={startSwipe} onPointerUp={endSwipe} onPointerCancel={() => { gesture.current = null; }}
          onClickCapture={event => { if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); } suppressClick.current = false; }}>
          <div className="bin-back" aria-hidden="true" />
          {shelf.posts.map((post, index) => {
            const depth = (index - active + shelf.posts.length) % shelf.posts.length;
            const style = { "--depth": depth, zIndex: shelf.posts.length - depth + 1 } as CSSProperties;
            return <div key={post.slug} className={`bin-item ${depth === 0 ? "is-selected" : ""}`} style={style}>
              {depth === 0 ? <Link href={`/blog/${post.slug}`} className="collection-object bin-object" draggable={false} aria-label={`Read ${post.metadata.title}`}><Artwork post={post} number={posts.indexOf(post) + 1} /></Link>
                : <div className="bin-object" aria-hidden="true"><Artwork post={post} number={posts.indexOf(post) + 1} /></div>}
            </div>;
          })}
          <div className="bin-front" aria-hidden="true"><span>COLLECTION / 0{shelfIndex + 1}</span><i /></div>
        </div>
        <div className="bin-controls">
          <button aria-label="Previous piece" onClick={() => move(-1)} disabled={shelf.posts.length < 2}><ArrowLeft size={17} /></button>
          <span aria-hidden="true">{String(active + 1).padStart(2, "0")} <i>/</i> {String(shelf.posts.length).padStart(2, "0")}</span>
          <button aria-label="Next piece" onClick={() => move(1)} disabled={shelf.posts.length < 2}><ArrowRight size={17} /></button>
        </div>
        <p className="bin-hint">Flip through, find a thought.</p>
      </div>
      <div className="bin-description" key={selected.slug}>
        <p className="bin-category">{selected.metadata.category}</p>
        <h2><Link href={`/blog/${selected.slug}`}>{selected.metadata.title}</Link></h2>
        <p className="bin-summary">{selected.metadata.summary}</p>
        <Link href={`/blog/${selected.slug}`} className="read-piece">Read {selected.metadata.draft === "true" ? "the note" : "the essay"} <ArrowRight size={15} aria-hidden="true" /></Link>
      </div>
      <p className="sr-only" role="status">{active + 1} of {shelf.posts.length}: {selected.metadata.title}</p>
    </section>
  </div>;
}

export function WritingShelf({ posts, view = "library" }: { posts: Post[]; view?: CollectionView }) {
  const shelves = organize(posts);
  return <>
    <div className="collection-toolbar">
      <h1 className="collection-intro">A small library of ideas.</h1>
      <nav className="collection-views" aria-label="Collection presentation">
        <Link href="/" aria-current={view === "library" ? "page" : undefined}>Library</Link>
        <Link href="/browse" aria-current={view === "store" ? "page" : undefined}>Record store</Link>
      </nav>
    </div>
    {shelves.length === 0 ? <p className="collection-empty">The first piece is on its way.</p> : view === "library" ? <Library shelves={shelves} posts={posts} /> : <RecordStore shelves={shelves} posts={posts} />}
  </>;
}
