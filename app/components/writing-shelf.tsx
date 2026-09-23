"use client";

import { useState } from "react";
import Link from "next/link";
import { Grid2X2, List, ArrowUpRight } from "lucide-react";
import type { Metadata } from "../blog/utils";
import { StudioArt } from "./studio-art";

type Post = { slug: string; metadata: Metadata };
const categories = ["Everything", "Experiments", "Learning", "Field notes"];

export function WritingShelf({ posts }: { posts: Post[] }) {
  const [category, setCategory] = useState("Everything");
  const [view, setView] = useState<"gallery" | "list">("gallery");
  const filtered = posts.filter(p => category === "Everything" || (p.metadata.category || "Experiments") === category);
  return <>
    <div className="shelf-controls"><div className="category-tabs" role="group" aria-label="Filter writing">{categories.map(c => <button key={c} aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>)}</div><div className="view-tabs" role="group" aria-label="Writing layout"><button aria-label="Gallery view" aria-pressed={view === 'gallery'} onClick={() => setView('gallery')}><Grid2X2 size={16} /></button><button aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={18} /></button></div></div>
    <div className={`writing-grid ${view === 'list' ? 'writing-list' : ''}`}>
      {filtered.map((post) => <Link key={post.slug} href={`/blog/${post.slug}`} className="writing-card"><div className="card-art"><StudioArt kind={post.metadata.artwork || 'disk'} label={post.metadata.artwork === 'tape' ? 'THE LEARNING LOOP' : post.metadata.artwork === 'paper' ? 'ROOM TO THINK.' : post.metadata.artwork === 'disk-green' ? 'TRUST, BUT VERIFY.' : 'VIBE / RL'} number={String(posts.indexOf(post) + 1).padStart(2, '0')} /><span className="card-open"><ArrowUpRight size={20} /></span></div><div className="card-copy"><div className="card-meta"><span>{post.metadata.category || 'Experiments'}</span><span>{post.metadata.sample === 'true' ? 'SAMPLE POST' : new Date(post.metadata.publishedAt + 'T12:00:00Z').toLocaleDateString('en-US', {month:'short', year:'numeric', timeZone:'UTC'})}</span></div><h3>{post.metadata.title}</h3><p>{post.metadata.summary}</p><span className="read-link">Open notebook ↗</span></div></Link>)}
    </div><p className="shelf-note" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'} · Sample posts are fictional pieces for this design exploration.</p>
  </>;
}
