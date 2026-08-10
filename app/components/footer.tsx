import { Socials } from "./socials";
import { PostageStamp } from "./vintage/postage-stamp";

export function Footer() {
  return (
    <footer className="border-t border-[var(--ink)]/10 bg-[var(--parchment)]">
      <div className="max-w-3xl mx-auto px-6 py-10 flex flex-col items-center justify-center gap-5">
        <PostageStamp
          src="/images/vintage/stamp-evals-scales.webp"
          alt="Evaluation scales stamp"
          size="sm"
          className="rotate-1 opacity-90"
        />
        <figure className="flex flex-col items-center">
          <blockquote className="font-[family-name:var(--font-display)] text-[var(--ink-muted)] text-base text-center italic">
            What I cannot create, I do not understand.
          </blockquote>
          <figcaption className="font-[family-name:var(--font-script)] text-[var(--mustard)] text-base mt-2">
            — Richard Feynman
          </figcaption>
        </figure>
        <Socials />
      </div>
    </footer>
  );
}
