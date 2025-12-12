import Link from "next/link";
import Image from "next/image";
import WorkSection from "./components/work-section";
import Bio from "@/content/bio.mdx";
import Contact from "@/content/contact.mdx";
import { SettingsDropdown } from "./components/settings-dropdown";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-xs border-b border-border/30">
        <nav className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
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
          <SettingsDropdown />
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-12 pb-25 flex flex-col gap-6">
        {/* Hero Section */}
        <section className="animate-fade-blur">
          <Bio />
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
