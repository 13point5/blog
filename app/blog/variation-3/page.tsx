import SampleBlog from "@/content/sample-blog.mdx";
import { Header } from "../../components/header";
import { Footer } from "../../components/footer";
import Image from "next/image";

export default function BlogVariation3() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
        {/* Variation 3: Hero-style Header with Centered Text */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <h1 className="text-5xl font-bold mb-4">Complete Markdown and Math Guide</h1>
            <p className="text-xl text-foreground-muted mb-6">
              A comprehensive guide to markdown syntax and mathematical notation
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-foreground-muted">
              <div className="flex items-center gap-2">
                <Image 
                  src="/zoro.png" 
                  alt="Author" 
                  width={28} 
                  height={28} 
                  className="rounded-full"
                />
                <span>13point5</span>
              </div>
              <span>•</span>
              <time>December 21, 2025</time>
            </div>
          </div>

          <div className="relative w-full h-[400px] rounded-2xl overflow-hidden mb-12">
            <Image 
              src="/decode.png" 
              alt="Blog cover" 
              fill
              className="object-cover"
            />
          </div>
        </div>

        <article className="prose prose-lg animate-fade-blur">
          <SampleBlog />
        </article>
      </main>

      <Footer />
    </div>
  );
}
