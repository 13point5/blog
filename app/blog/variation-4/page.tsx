import SampleBlog from "@/content/sample-blog.mdx";
import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import Image from "next/image";

export default function BlogVariation4() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Variation 4: Cover Image First, then Title */}
      <div className="relative w-full h-[500px] mb-8">
        <Image 
          src="/decode.png" 
          alt="Blog cover" 
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      </div>

      <main className="max-w-5xl mx-auto px-6 -mt-32 relative pb-16">
        <article className="prose prose-lg animate-fade-blur">
          <div className="bg-background/95 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-border/30">
            <h1 className="mb-3">Complete Markdown and Math Guide</h1>
            <div className="flex items-center gap-4 text-sm text-foreground-muted">
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
          </div>
          
          <SampleBlog />
        </article>
      </main>

      <Footer />
    </div>
  );
}
