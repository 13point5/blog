import { BlogPosts } from "@/app/components/posts";
import { Art } from "@/app/components/art";

export const metadata = {
  title: "Blog",
  description: "Notes on RL, LLMs, and benchmarks by Sriraam.",
};

export default function BlogPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-28 pb-8">
      {/* A rainy skyline across the top of the page */}
      <div className="animate-fade-blur -mt-10 mb-8" aria-hidden="true">
        <Art scene="rain-city" maxPx={380} />
      </div>

      <section className="animate-fade-blur">
        <h1 className="d-xl mb-1"><span data-perch="7">Blog</span></h1>
        <p className="text-foreground-muted mb-6">Notes on RL, LLMs, and benchmarks.</p>
        <BlogPosts />
      </section>
    </div>
  );
}
