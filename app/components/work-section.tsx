import { getBlogPosts } from "@/app/blog/utils";
import { BlogPostItem } from "./blog-post-item";
import { GetStartedLink } from "./vintage/get-started-link";

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
    <section id="blog" className="animate-fade-blur animation-delay-100">
      <div className="mb-8 flex items-end justify-between gap-4 border-b border-[var(--ink)]/15 pb-4">
        <div>
          <p className="font-[family-name:var(--font-script)] text-lg text-[var(--mustard)]">
            from the desk
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
            Letters &amp; notes
          </h2>
        </div>
        <GetStartedLink href="/blog" className="text-base">
          View all
        </GetStartedLink>
      </div>

      <div className="divide-y divide-[var(--ink)]/10">
        {posts.map((post) => (
          <BlogPostItem
            key={post.slug}
            slug={post.slug}
            metadata={post.metadata}
          />
        ))}
      </div>
    </section>
  );
}
