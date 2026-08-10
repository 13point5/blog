import { cn } from "@/lib/utils";

type HighlightMarkProps = {
  children: React.ReactNode;
  className?: string;
};

export function HighlightMark({ children, className }: HighlightMarkProps) {
  return (
    <span className={cn("highlight-mark", className)}>{children}</span>
  );
}
