import { BlogPosts } from "@/app/components/posts";
import { Art } from "@/app/components/art";

export const metadata = {
  title: "Blog",
  description: "Notes on RL, LLMs, and benchmarks by Sriraam.",
};

export default function BlogPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-20 pb-8">
      {/* A grand library, with a stairwell that won't sit still, across the top of the page */}
      <div className="animate-fade-blur -mt-6 mb-8" aria-hidden="true">
        <Art scene="library" maxPx={400} />
        {/* the owl's first perch: the bottom edge of the picture */}
        <div data-perch="0" />
      </div>

      <section className="animate-fade-blur">
        <h1 className="d-xl mb-1">Blog</h1>
        <p className="text-foreground-muted mb-6">Notes on RL, LLMs, and benchmarks.</p>
        <BlogPosts contents />
      </section>
    </div>
  );
}
