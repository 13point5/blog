import SampleBlog from "@/content/sample-blog.mdx";

export default function BlogPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
      <article className="prose prose-lg animate-fade-blur">
        <SampleBlog />
      </article>
    </main>
  );
}
