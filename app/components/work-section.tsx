import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSortedPosts } from "@/app/blog/utils";
import { Cassette } from "./cassette";

export default function WorkSection() {
  const posts = getSortedPosts().slice(0, 5);

  return (
    <section
      id="blog"
      aria-labelledby="blog-heading"
      className="animate-fade-blur animation-delay-200 mt-24"
    >
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h2
            id="blog-heading"
            className="font-dot font-black text-5xl sm:text-6xl leading-none tracking-tight"
          >
            BLOG
          </h2>
          <p className="font-serif italic text-foreground-muted mt-1">
            recent tapes, side A first
          </p>
        </div>
        <Link href="/blog" className="key key-play shrink-0">
          view all
          <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <div className="tape-rail">
        {posts.map((post) => (
          <Cassette key={post.slug} post={post} />
        ))}
      </div>
    </section>
  );
}
