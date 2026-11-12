import { Socials } from "./socials";
import { Art } from "./art";

export function Footer() {
  return (
    <footer className="pt-10">
      <div className="max-w-2xl w-full mx-auto px-5">
        <div className="section-divider mb-8" />
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <figure>
            <blockquote className="font-display italic d-md">
              What I cannot create, I do not understand.
            </blockquote>
            <figcaption className="text-foreground-muted text-sm mt-1">Richard Feynman</figcaption>
          </figure>
          <Socials />
        </div>
      </div>
      {/* The page ends at the castle. It has no sky of its own: the page is the
          sky, so it changes with the light and dark themes. */}
      <div className="mt-6" data-toc="The castle">
        <Art scene="hogwarts" maxPx={520} />
      </div>
    </footer>
  );
}
