import { Socials } from "./socials";
import { FloppyDisk } from "./motifs";

export function Footer() {
  return (
    <footer className="folio-footer folio-width">
      <div className="folio-footer-inner">
        <div className="folio-footer-motif" aria-hidden="true">
          <FloppyDisk className="motif-floppy-footer" />
        </div>
        <figure className="folio-quote">
          <blockquote>What I cannot create, I do not understand.</blockquote>
          <figcaption>- Richard Feynman</figcaption>
        </figure>
        <div className="folio-socials">
          <Socials />
        </div>
      </div>
    </footer>
  );
}
