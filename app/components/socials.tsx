import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandX,
} from "@tabler/icons-react";

const links = [
  { href: "https://x.com/27upon2", label: "twitter", icon: IconBrandX },
  { href: "https://github.com/13point5", label: "github", icon: IconBrandGithub },
  {
    href: "https://www.linkedin.com/in/13point5",
    label: "linkedin",
    icon: IconBrandLinkedin,
  },
];

/** Social links as tape-deck transport keys. */
export const Socials = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {links.map(({ href, label, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="key"
        >
          <Icon aria-hidden="true" />
          {label}
        </a>
      ))}
    </div>
  );
};
