import SampleBlog from "@/content/sample-blog.mdx";
import { Header } from "../components/header";
import { Footer } from "../components/footer";
import Image from "next/image";
import Link from "next/link";

export default function BlogPage() {
  const variations = [
    {
      href: "/blog/variation-1",
      title: "Variation 1: Minimal",
      description: "Simple title and date only"
    },
    {
      href: "/blog/variation-2",
      title: "Variation 2: Full Header",
      description: "Author, date, read time, tags, and cover image"
    },
    {
      href: "/blog/variation-3",
      title: "Variation 3: Hero Style",
      description: "Centered text with large hero image"
    },
    {
      href: "/blog/variation-4",
      title: "Variation 4: Cover First",
      description: "Full-width cover with overlay and floating title card"
    },
    {
      href: "/blog/variation-5",
      title: "Variation 5: Side-by-Side",
      description: "Title info alongside cover image"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-5xl mx-auto px-6 pt-14 pb-16">
        <div className="mb-16 animate-fade-blur">
          <h1 className="text-4xl font-bold mb-4">Blog Header Variations</h1>
          <p className="text-foreground-muted mb-8">
            Explore different header styles for blog posts. Each variation uses the same markdown content with different layouts.
          </p>

          <div className="grid gap-4 mb-12">
            {variations.map((variation) => (
              <Link
                key={variation.href}
                href={variation.href}
                className="block p-6 border border-border/30 rounded-lg hover:border-border hover:bg-foreground/5 transition-all"
              >
                <h3 className="text-lg font-semibold mb-1">{variation.title}</h3>
                <p className="text-sm text-foreground-muted">{variation.description}</p>
              </Link>
            ))}
          </div>
        </div>

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
