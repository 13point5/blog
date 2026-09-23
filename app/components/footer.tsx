import { Socials } from "./socials";

export function Footer() {
  return (
    <footer className="desk-foot">
      <div className="desk-foot-inner">
        <svg className="cartridge" viewBox="0 0 54 72" aria-hidden="true">
          <rect x="4" y="8" width="46" height="60" rx="4" fill="#c1121f" />
          <rect x="8" y="2" width="34" height="10" rx="3" fill="#9b0e18" />
          <rect x="10" y="18" width="34" height="28" rx="2" fill="#d9d4cc" />
          <rect x="14" y="22" width="16" height="2" fill="#111" opacity="0.35" />
          <rect x="14" y="27" width="22" height="2" fill="#111" opacity="0.2" />
          <rect x="14" y="32" width="12" height="2" fill="#111" opacity="0.2" />
          <path d="M27 52 l4 5 h-8 z" fill="#7a0c14" />
        </svg>
        <figure>
          <blockquote>What I cannot create, I do not understand.</blockquote>
          <figcaption>Richard Feynman</figcaption>
        </figure>
        <Socials />
      </div>
    </footer>
  );
}
