import NextImage from "next/image";
import { cn } from "@/lib/utils";

type ImageViewerProps = {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
};

export function ImageViewer({ src, alt, caption, className }: ImageViewerProps) {
  return (
    <figure className={cn("my-4", className)}>
      <NextImage
        src={src}
        alt={alt}
        width={800}
        height={400}
        className="w-full h-auto rounded-lg border border-border"
        unoptimized={src.startsWith("http")}
      />
      {caption && (
        <figcaption className="text-center text-sm text-foreground-muted mt-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
