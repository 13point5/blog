import Link from "next/link";
import { getBlogPosts } from "@/app/blog/utils";
import { BlogPostItem } from "./blog-post-item";

export default function WorkSection() {
  const posts = getBlogPosts()
    .filter((post) => post.metadata.sample !== "true")
    .sort((a, b) => b.metadata.publishedAt.localeCompare(a.metadata.publishedAt))
    .slice(0, 5);

  return (
    <section className="writing-section" id="blog" aria-labelledby="writing-title">
      <div className="section-heading">
        <h2 id="writing-title">Writing</h2>
        <Link className="text-link" href="/blog">
          View all
        </Link>
      </div>
      <div className="essay-list">
        {posts.map((post) => (
          <BlogPostItem key={post.slug} {...post} />
        ))}
      </div>
    </section>
  );
}
