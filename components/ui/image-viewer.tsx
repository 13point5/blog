"use client";

import { useState } from "react";
import NextImage from "next/image";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageViewerProps = {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
};

export function ImageViewer({ src, alt, caption, className }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

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

  return (
    <>
      <figure className={cn("my-4", className)}>
        <button
          onClick={openLightbox}
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
          className="fixed inset-0 z-[100] flex flex-col bg-black/90"
          onClick={closeLightbox}
        >
          {/* Top Bar */}
          <div className="flex items-center justify-end p-4 shrink-0">
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
                src={src}
                alt={alt}
                width={1200}
                height={800}
                className="max-w-full max-h-[70vh] w-auto h-auto rounded-lg object-contain"
                unoptimized={src.startsWith("http")}
              />
            </div>
          </div>

          {/* Bottom Caption */}
          {caption && (
            <div className="p-4 shrink-0">
              <p className="text-white/80 text-sm text-center">{caption}</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
