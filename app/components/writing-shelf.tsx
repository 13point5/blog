import Link from "next/link";
import type { Metadata } from "../blog/utils";
import { StudioArt } from "./studio-art";

type Post = { slug: string; metadata: Metadata };

export function WritingShelf({ posts }: { posts: Post[] }) {
  return (
    <ul className="object-grid">
      {posts.map((post, index) => (
        <li key={post.slug}>
          <Link href={`/blog/${post.slug}`} scroll={false} className="collection-object" aria-label={`${post.metadata.title}${post.metadata.sample === "true" ? " — sample post" : ""}`}>
            <div className="object-space">
              <StudioArt kind={post.metadata.artwork} label={post.metadata.objectLabel || post.metadata.title} number={String(index + 1).padStart(2, "0")} />
            </div>
            <div className="object-caption"><span>{post.metadata.title}</span><small>{post.metadata.sample === "true" ? "sample" : "essay"}</small></div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
