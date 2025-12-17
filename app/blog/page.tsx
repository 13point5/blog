import SampleBlog from "@/content/sample-blog.mdx";
import { Header } from "../components/header";
import { Footer } from "../components/footer";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header breadcrumb="Markdown & Math Guide" />

      <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
        <article className="prose prose-lg animate-fade-blur">
          <SampleBlog />
        </article>
      </main>

      <Footer />
    </div>
  );
}
