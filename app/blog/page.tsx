import { BlogPosts } from "@/app/components/posts";

export const metadata = {
  title: "Blog",
  description: "Notes on RL, LLMs, and benchmarks by Sriraam.",
};

export default function BlogPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-32 pb-8">
      <section className="animate-fade-blur">
        <h1 className="d-xl mb-1"><span data-perch="">Blog</span></h1>
        <p className="text-foreground-muted mb-6">Notes on RL, LLMs, and benchmarks.</p>
        <BlogPosts contents />
      </section>
    </div>
  );
}
