import NextLink from "next/link";
import { cn } from "@/lib/utils";

type LinkVariant = "default" | "muted" | "underline";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: LinkVariant;
  external?: boolean;
};

const variantStyles: Record<LinkVariant, string> = {
  default: "link-default",
  muted:
    "text-foreground-muted hover:text-foreground transition-colors",
  underline:
    "text-foreground font-medium transition-colors underline decoration-foreground-muted hover:decoration-foreground underline-offset-2",
};

export function Link({
  href,
  variant = "default",
  external,
  className,
  children,
  ...props
}: Props) {
  const isExternal = external ?? href.startsWith("http");
  const styles = cn(variantStyles[variant], className);

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <NextLink href={href} className={styles} {...props}>
      {children}
    </NextLink>
  );
}
