import { Socials } from "./socials";
import { PianoKeys } from "./toys";

export function Footer() {
  return (
    <footer className="max-w-2xl w-full mx-auto px-5 pt-10 pb-12">
      <div className="mb-8" data-perch="0">
        <PianoKeys />
        <div className="section-divider" />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
        <figure>
          <blockquote className="font-display italic d-md">
            What I cannot create, I do not understand.
          </blockquote>
          <figcaption className="text-foreground-muted text-sm mt-1">Richard Feynman</figcaption>
        </figure>
        <Socials />
      </div>
    </footer>
  );
}
