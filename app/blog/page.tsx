import { BlogPosts } from "@/app/components/posts";

export const metadata = {
  title: "Blog",
  description: "Read my blog posts.",
};

export default function BlogPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
      <section className="animate-fade-blur">
        <h1 className="text-2xl font-semibold mb-8 mt-8 text-foreground">
          Blog
        </h1>
        <BlogPosts />
      </section>
    </main>
  );
}
