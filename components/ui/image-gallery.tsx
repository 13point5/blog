"use client";

import { useState } from "react";
import NextImage from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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
  const [isOpen, setIsOpen] = useState(false);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  const currentImage = images[currentIndex];

  if (!images.length) return null;

  return (
    <>
      <figure className={cn("my-4", className)}>
        <div className="relative">
          {/* Previous Button */}
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={cn(
              "absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border transition-all",
              currentIndex === 0
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-background opacity-70 hover:opacity-100"
            )}
            aria-label="Previous image"
          >
            <ChevronLeft className="size-5" />
          </button>

          {/* Image */}
          <button
            onClick={() => setIsOpen(true)}
            className="block w-full cursor-zoom-in"
          >
            <NextImage
              src={currentImage.src}
              alt={currentImage.alt}
              width={800}
              height={400}
              className="w-full h-auto rounded-lg border border-border"
              unoptimized={currentImage.src.startsWith("http")}
            />
          </button>

          {/* Next Button */}
          <button
            onClick={goToNext}
            disabled={currentIndex === images.length - 1}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border transition-all",
              currentIndex === images.length - 1
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-background opacity-70 hover:opacity-100"
            )}
            aria-label="Next image"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        {/* Position Indicators */}
        <div className="flex justify-center gap-2 mt-3">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                "size-2 rounded-full border border-foreground-muted transition-colors",
                index <= currentIndex
                  ? "bg-foreground-muted"
                  : "bg-transparent"
              )}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>

        {/* Caption */}
        {currentImage.caption && (
          <figcaption className="text-center text-sm text-foreground-muted mt-2">
            {currentImage.caption}
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

          {/* Previous Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            disabled={currentIndex === 0}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white transition-all",
              currentIndex === 0
                ? "opacity-30 cursor-not-allowed"
                : "hover:text-white/80"
            )}
            aria-label="Previous image"
          >
            <ChevronLeft className="size-8" />
          </button>

          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <NextImage
              src={currentImage.src}
              alt={currentImage.alt}
              width={1200}
              height={800}
              className="max-w-full max-h-[85vh] w-auto h-auto rounded-lg object-contain"
              unoptimized={currentImage.src.startsWith("http")}
            />

            {/* Position Indicators in Lightbox */}
            <div className="flex justify-center gap-2 mt-3">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToIndex(index)}
                  className={cn(
                    "size-2.5 rounded-full border border-white/50 transition-colors",
                    index <= currentIndex ? "bg-white" : "bg-transparent"
                  )}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>

            {currentImage.caption && (
              <p className="text-center text-white/80 text-sm mt-2">
                {currentImage.caption}
              </p>
            )}
          </div>

          {/* Next Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            disabled={currentIndex === images.length - 1}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white transition-all",
              currentIndex === images.length - 1
                ? "opacity-30 cursor-not-allowed"
                : "hover:text-white/80"
            )}
            aria-label="Next image"
          >
            <ChevronRight className="size-8" />
          </button>
        </div>
      )}
    </>
  );
}
