import { BlogPosts } from "@/app/components/posts";
import { getSortedPosts, pad } from "@/app/blog/utils";

export const metadata = {
  title: "Blog",
  description: "Thoughts on AI, engineering, and development by 13point5.",
};

export default function BlogPage() {
  const count = getSortedPosts().length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-16">
      <section className="animate-fade-blur">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-12">
          <div>
            <h1 className="font-dot font-black text-6xl sm:text-7xl leading-none tracking-tight">
              ARCHIVE
            </h1>
            <p className="font-serif italic text-lg text-foreground-muted mt-2">
              every disk I&apos;ve written, newest on top
            </p>
          </div>
          <p className="kicker">
            {pad(count)} {count === 1 ? "disk" : "disks"} · 1.44 MB each
            <span className="animate-caret" aria-hidden="true">
              _
            </span>
          </p>
        </div>
        <BlogPosts />
      </section>
    </div>
  );
}
