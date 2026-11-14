import Link from "next/link";
import { BlogPosts } from "./posts";
import { Glyph } from "./glyph";

export default function WorkSection() {
  return (
    // Called "Blog" here as everywhere else: in the owl's map, and on the page this links to.
    <section id="blog" className="animate-fade-blur animation-delay-100" data-toc="Blog">
      <div className="flex items-center justify-between gap-4 mb-1">
        {/* the same size as "Hi" above it and as the heading of the blog page itself */}
        <h2 className="d-xl"><span data-perch="">Blog</span></h2>
        <Link
          href="/blog"
          aria-label="All posts"
          title="All posts"
          className="grid place-items-center size-10 -mr-2 text-foreground-muted hover:text-link-hover transition-colors"
        >
          <Glyph name="arrow" />
        </Link>
      </div>
      <BlogPosts limit={5} />
    </section>
  );
}
