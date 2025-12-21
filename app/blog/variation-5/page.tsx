import SampleBlog from "@/content/sample-blog.mdx";
import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import Image from "next/image";

export default function BlogVariation5() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
        <article className="prose prose-lg animate-fade-blur">
          {/* Variation 5: Side-by-side Title and Cover */}
          <div className="grid md:grid-cols-2 gap-8 mb-12 items-center">
            <div>
              <h1 className="mb-3">Complete Markdown and Math Guide</h1>
              <p className="text-lg text-foreground-muted mb-4">
                A comprehensive guide to markdown syntax and mathematical notation in MDX
              </p>
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
              </div>
              <div className="flex gap-2">
                <span className="px-3 py-1 text-xs bg-foreground/5 rounded-full border border-border/30">Markdown</span>
                <span className="px-3 py-1 text-xs bg-foreground/5 rounded-full border border-border/30">Math</span>
              </div>
            </div>
            <div className="relative w-full h-[300px] rounded-xl overflow-hidden">
              <Image 
                src="/decode.png" 
                alt="Blog cover" 
                fill
                className="object-cover"
              />
            </div>
          </div>
          
          <SampleBlog />
        </article>
      </main>

      <Footer />
    </div>
  );
}
