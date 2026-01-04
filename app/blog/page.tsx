import { BlogPosts } from "@/app/components/posts";

export const metadata = {
  title: "Blog",
  description: "Thoughts on AI, engineering, and development by 13point5.",
};

export default function BlogPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
      <section className="animate-fade-blur">
        <h1 className="text-2xl font-semibold mb-4 mt-6 text-foreground">
          blog
        </h1>
        <BlogPosts />
      </section>
    </main>
  );
}
