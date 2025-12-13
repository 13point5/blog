"use client";

import { useState } from "react";
import NextImage from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type GalleryImage = {
  src: string;
  alt: string;
  caption?: string;
};

type ImageGalleryProps = {
  images: GalleryImage[];
  className?: string;
};

export function ImageGallery({ images, className }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  };

  const currentImage = images[currentIndex];

  if (!images.length) return null;

  return (
    <figure className={cn("my-4", className)}>
      {/* Image */}
      <NextImage
        src={currentImage.src}
        alt={currentImage.alt}
        width={800}
        height={400}
        className="w-full h-auto rounded-lg border border-border"
        unoptimized={currentImage.src.startsWith("http")}
      />

      {/* Navigation Controls */}
      <div className="flex items-center justify-center gap-4 mt-3">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className={cn(
            "p-2 rounded-full border border-border transition-all",
            currentIndex === 0
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-accent"
          )}
          aria-label="Previous image"
        >
          <ChevronLeft className="size-4" />
        </button>

        <span className="text-sm text-foreground-muted tabular-nums">
          {currentIndex + 1} / {images.length}
        </span>

        <button
          onClick={goToNext}
          disabled={currentIndex === images.length - 1}
          className={cn(
            "p-2 rounded-full border border-border transition-all",
            currentIndex === images.length - 1
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-accent"
          )}
          aria-label="Next image"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* Caption */}
      {currentImage.caption && (
        <figcaption className="text-center text-sm text-foreground-muted mt-2">
          {currentImage.caption}
        </figcaption>
      )}
    </figure>
  );
}
