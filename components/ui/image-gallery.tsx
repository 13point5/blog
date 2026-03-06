"use client";

import { useState } from "react";
import NextImage from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Stepper, useAutoPlay } from "pasito";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContentFullscreen,
  DialogTitle,
} from "@/components/ui/dialog";
import "pasito/styles.css";

type GalleryImage = {
  src: string;
  alt: string;
  caption?: string;
};

type ImageGalleryProps = {
  images?: GalleryImage[];
  className?: string;
  fullWidth?: boolean;
  showBorder?: boolean;
};

export function ImageGallery({
  images = [],
  className,
  fullWidth = true,
  showBorder = true,
}: ImageGalleryProps) {
  const [active, setActive] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { filling, fillDuration } = useAutoPlay({
    count: images.length,
    active,
    onStepChange: setActive,
    stepDuration: 4000,
    loop: true,
  });

  if (!images?.length) return null;

  const currentImage = images[active];

  const galleryContent = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-[90vw] overflow-hidden rounded-md">
        <NextImage
          src={currentImage.src}
          alt={currentImage.alt}
          width={1920}
          height={1080}
          className="max-w-full max-h-[75vh] w-auto h-auto object-contain"
          unoptimized={currentImage.src.startsWith("http")}
        />
        {images.length > 1 && (
          <div
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActive((i) => (i > 0 ? i - 1 : images.length - 1));
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/50 backdrop-blur-xl transition-colors hover:bg-white/70 text-neutral-900"
              aria-label="Previous"
            >
              <ChevronLeft className="size-4" />
            </button>
            <Stepper
              count={images.length}
              active={active}
              onStepClick={setActive}
              filling={filling}
              fillDuration={fillDuration}
              className="image-gallery-stepper image-gallery-stepper-fullscreen"
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActive((i) => (i < images.length - 1 ? i + 1 : 0));
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/50 backdrop-blur-xl transition-colors hover:bg-white/70 text-neutral-900"
              aria-label="Next"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
      {currentImage.caption && (
        <p className="text-white/80 text-sm text-center max-w-2xl">
          {currentImage.caption}
        </p>
      )}
    </div>
  );

  if (images.length === 1) {
    return (
      <>
        <figure
          className={cn(
            "group relative flex flex-col gap-2 mb-4 mx-auto cursor-pointer",
            fullWidth ? "w-full" : "max-w-lg",
            className
          )}
          onClick={() => setIsFullscreen(true)}
        >
          <NextImage
            src={currentImage.src}
            alt={currentImage.alt}
            width={500}
            height={350}
            className={cn(
              "w-full h-auto rounded-md",
              showBorder && "border border-border"
            )}
            unoptimized={currentImage.src.startsWith("http")}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white"
            aria-label="Open fullscreen"
          >
            <Maximize2 className="size-3" />
          </button>
          {currentImage.caption && (
            <figcaption className="text-center text-sm text-foreground-muted">
              {currentImage.caption}
            </figcaption>
          )}
        </figure>
        <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
          <GalleryFullscreenDialog
            onClose={() => setIsFullscreen(false)}
            content={galleryContent}
            title={currentImage.alt}
          />
        </Dialog>
      </>
    );
  }

  return (
    <>
      <figure
        className={cn(
          "group relative flex flex-col gap-2 mb-4 mx-auto items-center cursor-pointer",
          fullWidth ? "w-full" : "max-w-lg",
          className
        )}
        onClick={() => setIsFullscreen(true)}
      >
        <div className="relative w-full overflow-hidden rounded-md">
          <NextImage
            src={currentImage.src}
            alt={currentImage.alt}
            width={500}
            height={350}
            className={cn(
              "w-full h-auto",
              showBorder && "border border-border"
            )}
            unoptimized={currentImage.src.startsWith("http")}
          />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFullscreen(true);
            }}
            className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-white/40 backdrop-blur-xl hover:bg-white/55 text-neutral-900"
            aria-label="Open fullscreen"
          >
            <Maximize2 className="size-3" />
          </button>
          <div
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() =>
                setActive((i) => (i > 0 ? i - 1 : images.length - 1))
              }
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/40 backdrop-blur-xl transition-colors hover:bg-white/55 text-neutral-900"
              aria-label="Previous"
            >
              <ChevronLeft className="size-3" />
            </button>
            <Stepper
              count={images.length}
              active={active}
              onStepClick={setActive}
              filling={filling}
              fillDuration={fillDuration}
              className="image-gallery-stepper image-gallery-stepper-glass"
            />
            <button
              type="button"
              onClick={() =>
                setActive((i) => (i < images.length - 1 ? i + 1 : 0))
              }
              className="flex h-6 w-6 items-center justify-center rounded-full bg-white/40 backdrop-blur-xl transition-colors hover:bg-white/55 text-neutral-900"
              aria-label="Next"
            >
              <ChevronRight className="size-3" />
            </button>
          </div>
        </div>
        {currentImage.caption && (
          <figcaption className="text-center text-sm text-foreground-muted">
            {currentImage.caption}
          </figcaption>
        )}
      </figure>
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <GalleryFullscreenDialog
          onClose={() => setIsFullscreen(false)}
          content={galleryContent}
          title={currentImage.alt}
        />
      </Dialog>
    </>
  );
}

function GalleryFullscreenDialog({
  onClose,
  content,
  title,
}: {
  onClose: () => void;
  content: React.ReactNode;
  title: string;
}) {
  return (
    <DialogContentFullscreen
      className="cursor-default"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <DialogTitle className="sr-only">{title}</DialogTitle>
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        aria-label="Close fullscreen"
      >
        <X className="size-4" />
      </button>
      <div
        className="relative flex flex-col items-center gallery-fullscreen cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </div>
    </DialogContentFullscreen>
  );
}
