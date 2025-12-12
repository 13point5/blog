import { cn } from "@/lib/utils";

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement>;

export function ExternalLink({ className, ...props }: Props) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "text-foreground-muted hover:text-foreground transition-colors",
        className
      )}
      {...props}
    />
  );
}
