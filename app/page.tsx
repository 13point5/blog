import Link from "next/link";
import Image from "next/image";
import WorkSection from "./components/work-section";
import Hero from "@/content/hero.mdx";
import Contact from "@/content/contact.mdx";
import { ExternalLink } from "@/components/ui/external-link";

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

          <div className="flex items-center gap-2 mt-4 text-sm">
            <ExternalLink href="https://x.com/27upon2">twitter</ExternalLink>
            <span className="text-foreground-muted">•</span>
            <ExternalLink href="https://github.com/13point5">
              github
            </ExternalLink>
            <span className="text-foreground-muted">•</span>
            <ExternalLink href="https://www.linkedin.com/in/13point5">
              linkedin
            </ExternalLink>
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
