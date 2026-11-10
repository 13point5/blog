import { BlogPosts } from "@/app/components/posts";

export const metadata = {
  title: "Blog",
  description: "Notes on RL, LLMs, and benchmarks by Sriraam.",
};

export default function BlogPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-28 pb-8">
      <section className="animate-fade-blur">
        <h1 className="d-xl mb-6">Blog</h1>
        <BlogPosts />
      </section>
    </div>
  );
}
