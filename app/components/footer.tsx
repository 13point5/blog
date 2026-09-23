import { Socials } from "./socials";
import { FountainPenIcon } from "./icons";

export function Footer() {
  return (
    <footer className="mt-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-10 flex flex-col items-center gap-8">
        <figure className="flex flex-col items-center text-center max-w-md">
          <blockquote className="font-serif italic text-2xl sm:text-3xl leading-tight text-balance">
            “What I cannot create, I do not understand.”
          </blockquote>
          <figcaption className="relative font-hand text-2xl text-foreground-muted mt-2 self-end -rotate-2 pr-12">
            — Richard Feynman
            <FountainPenIcon className="absolute -right-3 -top-7 size-16 -rotate-6" />
          </figcaption>
        </figure>
        <Socials />
        <p className="kicker text-[10px]! text-center">
          set in Archivo, Newsreader &amp; Doto · drawn with pencils
        </p>
      </div>
    </footer>
  );
}
