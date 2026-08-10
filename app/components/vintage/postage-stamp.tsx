import Image from "next/image";
import { cn } from "@/lib/utils";

type PostageStampProps = {
  src: string;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const sizeMap = {
  sm: { box: "w-14 h-14", px: 56 },
  md: { box: "w-20 h-20", px: 80 },
  lg: { box: "w-28 h-28", px: 112 },
} as const;

export function PostageStamp({
  src,
  alt,
  size = "md",
  className,
  priority = false,
}: PostageStampProps) {
  const dims = sizeMap[size];

  return (
    <div
      className={cn(
        "postage-stamp relative shrink-0 overflow-hidden bg-[var(--parchment)]",
        dims.box,
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={dims.px}
        height={dims.px}
        priority={priority}
        unoptimized
        className="h-full w-full object-cover"
      />
    </div>
  );
}
