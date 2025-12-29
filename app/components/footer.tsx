import { Socials } from "./socials";

export function Footer() {
  return (
    <footer className="border-t border-border/30 bg-background/80 backdrop-blur-xs">
      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col items-center gap-4">
        <figure className="flex flex-col items-center">
          <blockquote className="text-foreground-muted text-sm text-center">
            What I cannot create, I do not understand.
          </blockquote>
          <figcaption className="text-foreground-muted text-sm mt-1 self-end">
            - Richard Feynman
          </figcaption>
        </figure>
        <Socials />
      </div>
    </footer>
  );
}
