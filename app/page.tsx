import Link from "next/link";
import Image from "next/image";
import WorkSection from "./components/work-section";
import Hero from "@/content/hero.mdx";
import Contact from "@/content/contact.mdx";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xs border-b border-border/30">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-lg font-medium tracking-tight hover:text-foreground-muted transition-colors"
          >
            <Image
              src="/zoro.png"
              alt="Zoro"
              width={24}
              height={24}
              className="rounded-full"
            />
            13point5
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-25 flex flex-col gap-10">
        {/* Hero Section */}
        <section className="animate-fade-blur">
          <Hero />
        </section>

        {/* Sample Blog Link */}
        <section className="animate-fade-blur animation-delay-100">
          <div className="bg-accent border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              📚 Markdown & Math Guide
            </h2>
            <p className="text-foreground-muted mb-4">
              Check out a comprehensive guide showcasing all supported markdown
              elements and mathematical notation.
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-foreground font-medium hover:text-foreground-muted transition-colors underline"
            >
              View Sample Blog →
            </Link>
          </div>
        </section>

        {/* Work Section with filters */}
        <WorkSection />

        {/* Contact Section */}
        <section id="contact" className="animate-fade-blur animation-delay-200">
          <Contact />
        </section>
      </main>
    </div>
  );
}
