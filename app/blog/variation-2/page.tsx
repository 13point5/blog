import SampleBlog from "@/content/sample-blog.mdx";
import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import Image from "next/image";

export default function BlogVariation2() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
        <article className="prose prose-lg animate-fade-blur">
          {/* Variation 2: Full Header with Author and Tags */}
          <h1 className="mb-3">Complete Markdown and Math Guide</h1>
          
          <div className="flex items-center gap-4 text-sm text-foreground-muted mb-4">
            <div className="flex items-center gap-2">
              <Image 
                src="/zoro.png" 
                alt="Author" 
                width={24} 
                height={24} 
                className="rounded-full"
              />
              <span>13point5</span>
            </div>
            <span>•</span>
            <time>December 21, 2025</time>
            <span>•</span>
            <span>10 min read</span>
          </div>

          <div className="flex gap-2 mb-8">
            <span className="px-3 py-1 text-xs bg-foreground/5 rounded-full">Markdown</span>
            <span className="px-3 py-1 text-xs bg-foreground/5 rounded-full">Math</span>
            <span className="px-3 py-1 text-xs bg-foreground/5 rounded-full">Tutorial</span>
          </div>

          <Image 
            src="/decode.png" 
            alt="Blog cover" 
            width={800} 
            height={400} 
            className="rounded-lg mb-12"
          />
          
          <SampleBlog />
        </article>
      </main>

      <Footer />
    </div>
  );
}
