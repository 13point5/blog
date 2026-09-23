import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getBlogPosts } from "../blog/utils";

export const metadata = { title: "Index", description: "An index of notes and experiments on learning and making." };

export default function BrowsePage() {
  const posts = getBlogPosts().sort((a, b) =>
    Number(a.metadata.draft === "true") - Number(b.metadata.draft === "true") ||
    b.metadata.publishedAt.localeCompare(a.metadata.publishedAt),
  );
  return <section className="collection text-index" aria-labelledby="index-heading">
    <Link className="back-link" href="/">← Collection</Link>
    <header className="index-heading"><h1 id="index-heading">Index</h1><span>{String(posts.length).padStart(2, "0")} pieces, and counting.</span></header>
    <ol className="index-entries">{posts.map((post, index) => <li key={post.slug}>
      <Link href={`/blog/${post.slug}`}><span className="index-number">{String(index + 1).padStart(2, "0")}</span><div><h2>{post.metadata.title}</h2><p>{post.metadata.category} · {post.metadata.draft === "true" ? "Draft note" : "Essay"}</p></div><ArrowUpRight size={17} aria-hidden="true" /></Link>
    </li>)}</ol>
  </section>;
}
