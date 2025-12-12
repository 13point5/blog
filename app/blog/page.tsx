import Link from "next/link";
import Image from "next/image";
import SampleBlog from "@/content/sample-blog.mdx";
import { SettingsDropdown } from "../components/settings-dropdown";

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-background/80 backdrop-blur-xs border-b border-border/30">
        <nav className="max-w-5xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center">
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
            <span className="text-foreground-muted mx-2">/</span>
            <span className="text-lg font-medium tracking-tight">
              Markdown & Math Guide
            </span>
          </div>
          <SettingsDropdown />
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-12 pb-16">
        <article className="prose prose-lg animate-fade-blur">
          <SampleBlog />
        </article>
      </main>
    </div>
  );
}
