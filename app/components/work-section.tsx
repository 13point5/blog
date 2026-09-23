import Link from "next/link";
import { getBlogPosts } from "@/app/blog/utils";
import { BlogPostItem } from "./blog-post-item";

export default function WorkSection() {
  const posts = getBlogPosts()
    .sort((a, b) => {
      if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
        return -1;
      }
      return 1;
    })
    .slice(0, 5);

  return (
    <section id="blog" className="tracks">
      <div className="tracks-head">
        <h2>TRACKS</h2>
        <Link className="tracks-note" href="/blog">
          view all
        </Link>
      </div>
      <div>
        {posts.map((post) => (
          <BlogPostItem key={post.slug} slug={post.slug} metadata={post.metadata} />
        ))}
      </div>
    </section>
  );
}
