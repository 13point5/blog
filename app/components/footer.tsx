import { Socials } from "./socials";

export function Footer() {
  return (
    <footer className="folio-footer folio-width">
      <figure className="footer-quote">
        <blockquote>“What I cannot create, I do not understand.”</blockquote>
        <figcaption>— Richard Feynman</figcaption>
      </figure>
      <Socials />
    </footer>
  );
}
