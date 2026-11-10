import { BlogPosts } from "@/app/components/posts";
import { PixelScene } from "@/app/components/pixel-scene";

export const metadata = {
  title: "Blog",
  description: "Notes on RL, LLMs, and benchmarks by Sriraam.",
};

export default function BlogPage() {
  return (
    <>
      {/* A rainy skyline bleeding in from the corner, behind everything */}
      <div className="hidden lg:block absolute top-6 right-0 w-[min(34vw,30rem)] -z-10 opacity-80" aria-hidden="true">
        <PixelScene scene="rain-city" className="art-corner" />
      </div>
      <div className="max-w-2xl mx-auto px-5 pt-28 pb-8">
        <section className="animate-fade-blur">
          <h1 className="d-xl mb-1">Blog</h1>
          <p className="text-foreground-muted mb-6">Notes on RL, LLMs, and benchmarks.</p>
          <BlogPosts />
        </section>
      </div>
    </>
  );
}
