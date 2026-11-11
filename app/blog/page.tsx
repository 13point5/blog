import { BlogPosts } from "@/app/components/posts";
import { PixelScene } from "@/app/components/pixel-scene";

export const metadata = {
  title: "Blog",
  description: "Notes on RL, LLMs, and benchmarks by Sriraam.",
};

export default function BlogPage() {
  return (
    <div className="relative max-w-2xl mx-auto px-5 pt-28 pb-8">
      <section className="animate-fade-blur">
        <h1 className="d-xl mb-1">Blog</h1>
        <p className="text-foreground-muted mb-6">Notes on RL, LLMs, and benchmarks.</p>
        <BlogPosts />
      </section>

      {/* A rainy skyline in the margin, on screens wide enough to have one */}
      <aside className="hidden xl:block absolute left-full top-29 ml-10 w-64 animate-fade-blur animation-delay-100" aria-hidden="true">
        <PixelScene scene="rain-city" />
      </aside>
    </div>
  );
}
