import { Socials } from "./socials";

export function Footer() {
  return (
    <footer className="folio-footer folio-width">
      <div className="folio-footer-inner">
        <figure className="folio-quote">
          <blockquote>What I cannot create, I do not understand.</blockquote>
          <figcaption>— Richard Feynman</figcaption>
        </figure>
        <div className="folio-socials">
          <Socials />
        </div>
      </div>
    </footer>
  );
}
