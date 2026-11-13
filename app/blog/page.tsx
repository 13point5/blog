import { BlogPosts } from "@/app/components/posts";
import { Art } from "@/app/components/art";

export const metadata = {
  title: "Blog",
  description: "Notes on RL, LLMs, and benchmarks by Sriraam.",
};

export default function BlogPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-32 pb-8">
      {/* The grand staircase, right across the page. Stairs, portraits and ghosts all answer a tap. */}
      <div className="animate-fade-blur -mt-6 mb-12" aria-hidden="true">
        <Art scene="stairwell" maxPx={520} interactive />
      </div>

      <section className="animate-fade-blur">
        <h1 className="d-xl mb-1"><span data-perch="">Blog</span></h1>
        <p className="text-foreground-muted mb-6">Notes on RL, LLMs, and benchmarks.</p>
        <BlogPosts contents />
      </section>
    </div>
  );
}
