import NextLink from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

type LinkVariant = "default" | "muted" | "underline";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  variant?: LinkVariant;
  icon?: string;
  iconSize?: number;
  iconClassName?: string;
  external?: boolean;
};

const variantStyles: Record<LinkVariant, string> = {
  default:
    "text-foreground font-medium transition-colors hover:text-foreground-muted",
  muted:
    "text-foreground-muted hover:text-foreground transition-colors",
  underline:
    "text-foreground font-medium transition-colors underline decoration-foreground-muted hover:decoration-foreground underline-offset-2",
};

export function Link({
  href,
  variant = "default",
  icon,
  iconSize = 18,
  iconClassName,
  external,
  className,
  children,
  ...props
}: Props) {
  const isExternal = external ?? href.startsWith("http");
  const styles = cn(
    variantStyles[variant],
    icon && "inline-flex items-baseline gap-0.5",
    className
  );

  const content = (
    <>
      {icon && (
        <Image
          src={icon}
          alt=""
          width={iconSize}
          height={iconSize}
          className={cn("rounded-sm self-center translate-y-px", iconClassName)}
        />
      )}
      {children}
    </>
  );

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={styles}
        {...props}
      >
        {content}
      </a>
    );
  }

  return (
    <NextLink href={href} className={styles} {...props}>
      {content}
    </NextLink>
  );
}
