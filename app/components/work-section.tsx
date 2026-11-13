import Link from "next/link";
import { BlogPosts } from "./posts";
import { Glyph } from "./glyph";

export default function WorkSection() {
  return (
    <section id="blog" className="animate-fade-blur animation-delay-100" data-toc="Writing">
      <div className="flex items-center justify-between gap-4 mb-1">
        <h2 className="d-lg"><span data-perch="">Writing</span></h2>
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
