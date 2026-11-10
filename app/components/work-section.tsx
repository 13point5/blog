import Link from "next/link";
import { BlogPosts } from "./posts";

export default function WorkSection() {
  return (
    <section id="blog" className="animate-fade-blur animation-delay-300">
      <div className="flex items-end justify-between gap-4 mb-5">
        <h2 className="d-xl">latest posts</h2>
        <Link href="/blog" className="px-btn !py-1">
          view all <span aria-hidden="true">▸</span>
        </Link>
      </div>
      <BlogPosts limit={3} />
    </section>
  );
}
