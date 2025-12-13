"use client";

import { useState } from "react";
import NextImage from "next/image";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageViewerProps = {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
};

export function ImageViewer({ src, alt, caption, className }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <figure className={cn("my-4", className)}>
        <button
          onClick={() => setIsOpen(true)}
          className="block w-full cursor-zoom-in"
        >
          <NextImage
            src={src}
            alt={alt}
            width={800}
            height={400}
            className="w-full h-auto rounded-lg border border-border"
            unoptimized={src.startsWith("http")}
          />
        </button>
        {caption && (
          <figcaption className="text-center text-sm text-foreground-muted mt-2">
            {caption}
          </figcaption>
        )}
      </figure>

      {/* Lightbox Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-white hover:text-white/80 transition-colors"
            aria-label="Close"
          >
            <X className="size-6" />
          </button>
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <NextImage
              src={src}
              alt={alt}
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] w-auto h-auto rounded-lg object-contain"
              unoptimized={src.startsWith("http")}
            />
            {caption && (
              <p className="text-center text-white/80 text-sm mt-3">{caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
