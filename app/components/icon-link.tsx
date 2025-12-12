import Image from "next/image";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  icon: string;
  children: React.ReactNode;
  imageClassName?: string;
  imageWidth?: number;
  imageHeight?: number;
};

export function IconLink({
  href,
  icon,
  children,
  imageClassName,
  imageWidth,
  imageHeight,
}: Props) {
  const imageSize = imageWidth ?? imageHeight ?? 18;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-baseline gap-0.5 text-foreground font-medium hover:text-foreground-muted transition-colors underline decoration-border hover:decoration-foreground-muted underline-offset-2"
    >
      <Image
        src={icon}
        alt=""
        width={imageSize}
        height={imageSize}
        className={cn("rounded-sm self-center translate-y-px", imageClassName)}
      />
      {children}
    </a>
  );
}
