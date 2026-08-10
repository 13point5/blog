import Image from "next/image";
import { HighlightMark } from "./components/vintage/highlight-mark";
import { GetStartedLink } from "./components/vintage/get-started-link";
import WorkSection from "./components/work-section";

export default function Home() {
  return (
    <>
      {/* Full-bleed vintage hero */}
      <section className="hero-parchment relative min-h-[100svh] overflow-hidden">
        <div className="paper-grain pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto flex min-h-[100svh] max-w-3xl flex-col items-center justify-center px-6 pb-12 pt-16 text-center">
          <p className="animate-hero-rise font-[family-name:var(--font-display)] text-5xl tracking-[0.08em] text-[var(--ink)] sm:text-6xl md:text-7xl">
            sriraam
          </p>

          <div className="animate-hero-rise animation-delay-100 mt-5 w-full">
            <Image
              src="/images/vintage/hero-automaton-books.webp"
              alt="Vintage woodcut of a clockwork mind resting on books"
              width={720}
              height={960}
              priority
              unoptimized
              className="mx-auto h-auto w-full max-w-[200px] sm:max-w-[240px] object-contain"
            />
          </div>

          <blockquote className="animate-hero-rise animation-delay-200 mt-6 max-w-lg">
            <p className="font-[family-name:var(--font-display)] text-2xl leading-snug tracking-tight text-[var(--ink)] sm:text-3xl">
              “Models are a uniquely portable{" "}
              <HighlightMark>magic.</HighlightMark>”
            </p>
            <footer className="mt-3 font-[family-name:var(--font-display)] text-sm text-[var(--ink-muted)]">
              — on LLMs, RL, and the craft of evaluation
            </footer>
          </blockquote>

          <div className="animate-hero-rise animation-delay-300 mt-8">
            <GetStartedLink href="/blog">Get Started</GetStartedLink>
          </div>
        </div>
      </section>

      {/* Intro + blog */}
      <main className="relative mx-auto max-w-3xl px-6 pb-24 pt-16">
        <div className="paper-grain pointer-events-none absolute inset-0 opacity-40" aria-hidden />
        <section className="animate-fade-blur relative mb-20">
          <p className="font-[family-name:var(--font-script)] text-xl text-[var(--mustard)]">
            Sincerely,
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-tight text-[var(--ink)]">
            hey, i&apos;m sriraam
          </h2>
          <div className="mt-6 space-y-4 text-[var(--ink)]/85 leading-relaxed">
            <p>
              Founding Engineer at{" "}
              <a
                href="https://decode.dev/"
                className="link-default"
                target="_blank"
                rel="noopener noreferrer"
              >
                Decode
              </a>{" "}
              where we&apos;re building a browser and whiteboard for Coding Agents.
            </p>
            <p>
              I write about reinforcement learning, language model architectures,
              evaluation craft, and the quiet systems work behind agents that
              actually learn.
            </p>
            <p className="text-[var(--ink-muted)]">
              Previously: RAG and structured extraction at Silvertrain AI. Learning
              design at Harvard. Hogwarts, anime, and K-dramas in the margins.
            </p>
          </div>
        </section>

        <WorkSection />
      </main>
    </>
  );
}
