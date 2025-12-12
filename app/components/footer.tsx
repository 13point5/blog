import { Socials } from "./socials";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background/80 backdrop-blur-xs">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-foreground-muted text-sm italic">
          &ldquo;What I cannot create, I do not understand.&rdquo;
          <span className="not-italic ml-2">— Richard Feynman</span>
        </p>
        <Socials />
      </div>
    </footer>
  );
}
