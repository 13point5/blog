import Link from "next/link";
import WorkSection from "./components/WorkSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/30">
        <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-medium tracking-tight">
            13point5
          </Link>
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-32 pb-20">
        {/* Hero Section */}
        <section className="mb-12 animate-fade-blur">
          <h1 className="text-2xl font-medium mb-6">hey, i&apos;m sriraam</h1>
          <p className="text-foreground-muted leading-relaxed max-w-xl">
            Founding Engineer at{" "}
            <a href="#" className="text-foreground hover-underline font-medium">
              Decode
            </a>
            , building a browser and whiteboard for Claude Code. Currently
            studying Reinforcement Learning by building an open source{" "}
            <a href="#" className="text-foreground hover-underline font-medium">
              SWE-Grep
            </a>{" "}
            model under{" "}
            <span className="text-foreground">Prof Graham Neubig</span>. I also
            build RL environments through{" "}
            <a href="#" className="text-foreground hover-underline">
              Prime Intellect
            </a>{" "}
            &apos;s bounty program. Previously studied Learning Design at{" "}
            <span className="text-foreground">Harvard</span> which has led me to
            see many UX problems as learning problems.
          </p>

          <div className="flex items-center gap-4 mt-8 text-sm">
            <a
              href="#"
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              twitter →
            </a>
            <a
              href="#"
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              github →
            </a>
            <a
              href="#"
              className="text-foreground-muted hover:text-foreground transition-colors"
            >
              linkedin →
            </a>
          </div>
        </section>

        {/* Work Section with filters */}
        <WorkSection />

        {/* Contact Section */}
        <section id="contact" className="animate-fade-blur animation-delay-200">
          <h2 className="text-2xl font-medium mb-4">say hi!</h2>
          <p className="text-foreground-muted leading-relaxed max-w-xl">
            I love meeting people working on interesting problems. Always happy
            to chat about Agents, RL, design, education, or whatever you&apos;re
            building.
            <br />
            <a
              href="https://twitter.com/13point5"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover-underline font-medium"
            >
              DM on Twitter
            </a>
            .
          </p>
        </section>
      </main>
    </div>
  );
}
