import Link from "next/link";
import { cn } from "@/lib/utils";

type GetStartedLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

export function GetStartedLink({
  href,
  children,
  className,
}: GetStartedLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-4 font-[family-name:var(--font-display)] text-lg tracking-wide text-[var(--ink)] transition-opacity hover:opacity-70",
        className
      )}
    >
      <span>{children}</span>
      <span
        aria-hidden
        className="relative h-px w-16 bg-[var(--ink)] transition-all duration-500 group-hover:w-24"
      >
        <span className="absolute -right-0.5 top-1/2 h-2 w-2 -translate-y-1/2 rotate-45 border-r border-t border-[var(--ink)]" />
      </span>
    </Link>
  );
}
