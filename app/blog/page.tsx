import Blog from "@/content/blog.mdx";

export default function BlogPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
      <section className="animate-fade-blur">
        <Blog />
      </section>
    </main>
  );
}
