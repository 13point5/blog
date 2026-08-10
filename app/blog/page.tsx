import { BlogPosts } from "@/app/components/posts";
import { PostageStamp } from "@/app/components/vintage/postage-stamp";

export const metadata = {
  title: "Letters",
  description:
    "Notes on LLMs, reinforcement learning, architectures, and evals.",
};

export default function BlogPage() {
  return (
    <main className="relative mx-auto max-w-3xl px-6 pt-20 pb-20">
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <section className="animate-fade-blur relative">
        <div className="mb-10 flex flex-col items-center text-center">
          <PostageStamp
            src="/images/vintage/stamp-architecture-columns.webp"
            alt="Architecture columns stamp"
            size="md"
            className="mb-6 rotate-[-1.5deg]"
          />
          <p className="font-[family-name:var(--font-script)] text-xl text-[var(--mustard)]">
            a correspondence
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--ink)] sm:text-5xl">
            Letters
          </h1>
          <p className="mt-4 max-w-md text-[var(--ink-muted)] leading-relaxed">
            Field notes on language models, reinforcement learning,
            architectures, and the craft of evaluation — stamped in a modern
            vintage hand.
          </p>
        </div>
        <div className="border-t border-[var(--ink)]/15">
          <BlogPosts />
        </div>
      </section>
    </main>
  );
}
