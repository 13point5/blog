import SampleBlog from "@/content/sample-blog.mdx";
import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import Image from "next/image";

export default function BlogVariation1() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
        <article className="prose prose-lg animate-fade-blur">
          {/* Variation 1: Minimal Header - Title and Date only */}
          <h1 className="mb-2">Complete Markdown and Math Guide</h1>
          <p className="text-foreground-muted text-sm mb-8">December 21, 2025</p>
          
          <SampleBlog />
        </article>
      </main>

      <Footer />
    </div>
  );
}
