import Link from "next/link";
import { BlogPosts } from "./posts";
import { Toy } from "./toys";

export default function WorkSection() {
  return (
    <section id="blog" className="animate-fade-blur animation-delay-100" data-toc="Writing">
      <div className="flex items-baseline justify-between gap-4 mb-1">
        <h2 className="d-lg flex items-end gap-3" data-perch="">
          Writing <Toy id="floppy" scale={2} rows={19} className="mb-1" />
        </h2>
        <Link href="/blog" className="text-sm text-foreground-muted hover:text-foreground transition-colors">
          all posts
        </Link>
      </div>
      <BlogPosts limit={5} />
    </section>
  );
}
