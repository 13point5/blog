"use client";

import Link from "next/link";
import type { Metadata } from "../blog/utils";
import { useArticleTransition } from "./article-transition";
import { StudioArt } from "./studio-art";

type Post = { slug: string; metadata: Metadata };

export function WritingShelf({ posts }: { posts: Post[] }) {
  const openArticle = useArticleTransition();
  return (
    <ul className="object-grid">
      {posts.map((post, index) => (
        <li key={post.slug}>
          <Link href={`/blog/${post.slug}`} className="collection-object" onClick={event => openArticle(event, { slug: post.slug, title: post.metadata.title, kind: post.metadata.artwork, label: post.metadata.objectLabel || post.metadata.title, number: String(index + 1).padStart(2, "0") })} aria-label={`${post.metadata.title}${post.metadata.draft === "true" ? " — draft note" : ""}`}>
            <div className="object-space">
              <StudioArt kind={post.metadata.artwork} label={post.metadata.objectLabel || post.metadata.title} number={String(index + 1).padStart(2, "0")} />
            </div>
            <div className="object-caption"><span>{post.metadata.title}</span><small>{post.metadata.draft === "true" ? "note" : "essay"}</small></div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
