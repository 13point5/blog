const LINKS = [
  { href: "https://x.com/27upon2", label: "twitter" },
  { href: "https://github.com/13point5", label: "github" },
  { href: "https://www.linkedin.com/in/13point5", label: "linkedin" },
];

export const Socials = () => {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {LINKS.map((l) => (
        <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="px-btn !py-1">
          {l.label}
        </a>
      ))}
    </div>
  );
};
