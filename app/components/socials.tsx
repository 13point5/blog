import { Glyph, type GlyphName } from "./glyph";

const LINKS: { href: string; label: string; glyph: GlyphName }[] = [
  { href: "https://x.com/27upon2", label: "X (Twitter)", glyph: "x" },
  { href: "https://github.com/13point5", label: "GitHub", glyph: "github" },
  { href: "https://www.linkedin.com/in/13point5", label: "LinkedIn", glyph: "linkedin" },
];

export const Socials = () => {
  return (
    <div className="flex items-center gap-2">
      {LINKS.map(({ href, label, glyph }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          className="grid place-items-center size-10 text-foreground-muted hover:text-link-hover transition-colors"
        >
          <Glyph name={glyph} scale={1} />
        </a>
      ))}
    </div>
  );
};
