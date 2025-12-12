import Link from "next/link";
import SampleBlog from "@/content/sample-blog.mdx";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xs border-b border-border/30">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-lg font-medium tracking-tight hover:text-foreground-muted transition-colors"
          >
            ← Back to Home
          </Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-24 pb-16">
        <article className="prose prose-lg">
          <SampleBlog />
        </article>
      </main>
    </div>
  );
}
