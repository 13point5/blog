import SampleBlog from "@/content/sample-blog.mdx";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import Image from "next/image";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
        <article className="prose prose-lg animate-fade-blur">
          <h1>Complete Markdown and Math Guide</h1>
          <p className="text-foreground-muted text-sm">December 21, 2025</p>
          <Image 
            src="/decode.png" 
            alt="Blog cover" 
            width={800} 
            height={400} 
            className="rounded-lg my-8"
          />
          <SampleBlog />
        </article>
      </main>

      <Footer />
    </div>
  );
}
