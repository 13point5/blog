import { ExternalLink } from "@/components/ui/external-link";

export const Socials = () => {
  return (
    <div className="flex items-center gap-2">
      <ExternalLink href="https://x.com/27upon2">twitter</ExternalLink>
      <span className="text-foreground-muted">•</span>
      <ExternalLink href="https://github.com/13point5">github</ExternalLink>
      <span className="text-foreground-muted">•</span>
      <ExternalLink href="https://www.linkedin.com/in/13point5">
        linkedin
      </ExternalLink>
    </div>
  );
};
