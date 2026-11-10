import { BlogPosts } from "@/app/components/posts";
import { getBlogPosts } from "@/app/blog/utils";

export const metadata = {
  title: "Blog",
  description: "Notes on RL, LLMs, and benchmarks by Sriraam.",
};

export default function BlogPage() {
  const count = getBlogPosts().length;
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-22 pb-16">
      <section className="animate-fade-blur">
        <h1 className="d-2xl mb-1">blog</h1>
        <p className="text-foreground-muted mb-8">
          {count} posts on RL, LLMs, and benchmarks. Every cover is drawn in code and animated.
        </p>
        <BlogPosts />
      </section>
    </div>
  );
}
