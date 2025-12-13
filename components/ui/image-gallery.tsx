"use client";

import { useState } from "react";
import NextImage from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
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
  const [zoom, setZoom] = useState(1);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : prev));
  };

  const openLightbox = () => {
    setIsOpen(true);
    setZoom(1);
  };

  const closeLightbox = () => {
    setIsOpen(false);
    setZoom(1);
  };

  const zoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const currentImage = images[currentIndex];

  if (!images.length) return null;

  return (
    <>
      <figure className={cn("my-4", className)}>
        {/* Image */}
        <button
          onClick={openLightbox}
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

      {/* Lightbox Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black/90"
          onClick={closeLightbox}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 shrink-0">
            <span className="text-white/80 text-sm tabular-nums">
              {currentIndex + 1} / {images.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  zoomOut();
                }}
                disabled={zoom <= 0.5}
                className={cn(
                  "p-2 text-white rounded-full transition-colors",
                  zoom <= 0.5 ? "opacity-30" : "hover:bg-white/10"
                )}
                aria-label="Zoom out"
              >
                <ZoomOut className="size-5" />
              </button>
              <span className="text-white/80 text-sm w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  zoomIn();
                }}
                disabled={zoom >= 3}
                className={cn(
                  "p-2 text-white rounded-full transition-colors",
                  zoom >= 3 ? "opacity-30" : "hover:bg-white/10"
                )}
                aria-label="Zoom in"
              >
                <ZoomIn className="size-5" />
              </button>
              <button
                onClick={closeLightbox}
                className="p-2 text-white hover:bg-white/10 rounded-full transition-colors ml-2"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div
            className="flex-1 flex items-center justify-center overflow-auto p-4 min-h-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="transition-transform duration-200"
              style={{ transform: `scale(${zoom})` }}
            >
              <NextImage
                src={currentImage.src}
                alt={currentImage.alt}
                width={1200}
                height={800}
                className="max-w-full max-h-[70vh] w-auto h-auto rounded-lg object-contain"
                unoptimized={currentImage.src.startsWith("http")}
              />
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-center gap-4 p-4 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              disabled={currentIndex === 0}
              className={cn(
                "p-3 text-white rounded-full transition-all",
                currentIndex === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-white/10"
              )}
              aria-label="Previous image"
            >
              <ChevronLeft className="size-6" />
            </button>

            {currentImage.caption && (
              <p className="text-white/80 text-sm text-center max-w-md">
                {currentImage.caption}
              </p>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              disabled={currentIndex === images.length - 1}
              className={cn(
                "p-3 text-white rounded-full transition-all",
                currentIndex === images.length - 1
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:bg-white/10"
              )}
              aria-label="Next image"
            >
              <ChevronRight className="size-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
