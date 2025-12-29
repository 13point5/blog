import NextImage from "next/image";
import { cn } from "@/lib/utils";

type ImageViewerProps = {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  showBorder?: boolean;
};

export function ImageViewer({
  src,
  alt,
  caption,
  className,
  showBorder = true,
}: ImageViewerProps) {
  return (
    <span className={cn("block my-4 mx-auto max-w-lg", className)}>
      <NextImage
        src={src}
        alt={alt}
        width={500}
        height={350}
        className={cn(
          "w-full h-auto rounded-lg",
          showBorder && "border border-border"
        )}
        unoptimized={src.startsWith("http")}
      />
      {caption && (
        <span className="block text-center text-sm text-foreground-muted mt-2">
          {caption}
        </span>
      )}
    </span>
  );
}
