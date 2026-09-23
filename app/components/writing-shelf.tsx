"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { Shuffle } from "lucide-react";
import type { Metadata } from "../blog/utils";
import { StudioArt } from "./studio-art";

type Post = { slug: string; metadata: Metadata };

// Coordinates describe a loose desk, with a separate staggered arrangement for phones.
// Every object has the same hit area, so any object can safely occupy any position.
const places = [
  { x: .07, y: 0, mobileX: 0, mobileY: 0, angle: -11 },
  { x: .55, y: .07, mobileX: 1, mobileY: .16, angle: 8 },
  { x: .98, y: .34, mobileX: 0, mobileY: .37, angle: -7 },
  { x: .01, y: .57, mobileX: 1, mobileY: .53, angle: -9 },
  { x: .47, y: .64, mobileX: 0, mobileY: .74, angle: 7 },
  { x: .93, y: 1, mobileX: 1, mobileY: 1, angle: 10 },
];

export function WritingShelf({ posts }: { posts: Post[] }) {
  const [positions, setPositions] = useState(() => posts.map((_, index) => index));
  const [mixCount, setMixCount] = useState(0);

  function mixCollection() {
    const next = [...positions];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    // Even an unlucky random draw should produce a visible change.
    if (next.length > 1 && next.every((position, i) => position === positions[i])) {
      next.push(next.shift()!);
    }
    setPositions(next);
    setMixCount(count => count + 1);
  }

  return (
    <>
      <div className="desk-toolbar">
        <h1 className="collection-intro">A few things I’ve been thinking about.</h1>
        {posts.length > 1 && <button className="mix-button" onClick={mixCollection} aria-label="Mix up the collection">
          <Shuffle key={mixCount} size={13} aria-hidden="true" className={mixCount ? "mix-icon-active" : ""} />
          <span>mix it up</span>
        </button>}
      </div>
      <p className="sr-only" role="status">{mixCount ? `Arrangement ${mixCount + 1}. All ${posts.length} articles are still available.` : ""}</p>
      <ul className="object-desk" style={{ "--desk-bands": Math.max(1, Math.ceil(posts.length / places.length)) } as CSSProperties}>
      {posts.map((post, index) => {
        const position = positions[index];
        const place = places[position % places.length];
        const style = {
          "--desk-x": place.x, "--desk-y": place.y,
          "--mobile-x": place.mobileX, "--mobile-y": place.mobileY,
          "--desk-band": Math.floor(position / places.length),
          "--desk-angle": `${place.angle}deg`, "--arrival-delay": `${index * 65}ms`,
        } as CSSProperties;
        return <li key={post.slug} style={style}>
          <Link href={`/blog/${post.slug}`} className="collection-object" aria-label={`${post.metadata.title}${post.metadata.draft === "true" ? " — draft note" : ""}`}>
            <div className="object-space">
              <StudioArt kind={post.metadata.artwork} label={post.metadata.objectLabel || post.metadata.title} number={String(index + 1).padStart(2, "0")} />
            </div>
            <div className="object-caption"><span>{post.metadata.title}</span><small>{post.metadata.draft === "true" ? "note" : "essay"}</small></div>
          </Link>
        </li>;
      })}
      </ul>
    </>
  );
}
