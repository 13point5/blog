import { cn } from "@/lib/utils";

type Props = {
  title: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** element shown at the left of the title bar */
  icon?: React.ReactNode;
};

/** A retro desktop window: title bar, three decorative buttons, hard shadow. */
export function PixelWindow({ title, icon, children, className, bodyClassName }: Props) {
  return (
    <div className={cn("px-window", className)}>
      <div className="px-titlebar">
        {icon}
        <span className="truncate min-w-0 flex-1">{title}</span>
        <span className="flex gap-1" aria-hidden="true">
          <span className="px-winbtn"><span className="block w-2 h-0.5 bg-current translate-y-1" /></span>
          <span className="px-winbtn"><span className="block w-2 h-2 border-2 border-current" /></span>
          <span className="px-winbtn text-[11px] leading-none font-bold">✕</span>
        </span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
