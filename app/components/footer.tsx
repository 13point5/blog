import { Socials } from "./socials";
import { Art } from "./art";
import { Ornament } from "./glyph";

export function Footer() {
  return (
    <footer className="pt-16">
      {/* everything here is centred on one axis: ornament, quote, name, links */}
      <div className="max-w-2xl w-full mx-auto px-5 flex flex-col items-center text-center">
        <Ornament className="text-foreground-muted mb-7" />
        <figure>
          <blockquote className="font-display italic d-md text-balance">
            What I cannot create, I do not understand.
          </blockquote>
          <figcaption className="text-foreground-muted text-sm mt-1.5">Richard Feynman</figcaption>
        </figure>
        <div className="mt-5">
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
