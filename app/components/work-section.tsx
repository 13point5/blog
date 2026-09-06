import Link from "next/link";
import { getBlogPosts } from "@/app/blog/utils";
import { BlogPostItem } from "./blog-post-item";

export default function WorkSection() {
  const posts = getBlogPosts().sort((a, b) => {
    const sampleOrder = Number(a.metadata.sample === "true") - Number(b.metadata.sample === "true");
    return sampleOrder || b.metadata.publishedAt.localeCompare(a.metadata.publishedAt);
  });
  return (
    <section className="writing-section" id="blog" aria-labelledby="writing-title">
      <div className="section-heading"><h2 id="writing-title">Writing</h2><Link className="text-link" href="/blog">View all</Link></div>
      <div className="essay-list">{posts.slice(0, 5).map((post) => <BlogPostItem key={post.slug} {...post} />)}</div>
    </section>
  );
}
