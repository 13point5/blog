import { Link } from "@/components/ui/link";

export const Socials = () => {
  return (
    <div className="flex items-center gap-2">
      <Link href="https://x.com/27upon2" variant="muted">twitter</Link>
      <span className="text-foreground-muted">•</span>
      <Link href="https://github.com/13point5" variant="muted">github</Link>
      <span className="text-foreground-muted">•</span>
      <Link href="https://www.linkedin.com/in/13point5" variant="muted">
        linkedin
      </Link>
    </div>
  );
};
