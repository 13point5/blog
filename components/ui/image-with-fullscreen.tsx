"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import NextImage from "next/image";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ImageWithFullscreenProps = {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  fullWidth?: boolean;
  showBorder?: boolean;
  width?: number;
  height?: number;
  children?: React.ReactNode;
};

export function ImageWithFullscreen({
  src,
  alt,
  caption,
  className,
  fullWidth = true,
  showBorder = true,
  width = 500,
  height = 350,
  children,
}: ImageWithFullscreenProps) {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  const inlineImage = children ?? (
    <NextImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn(
        "w-full h-auto rounded-md",
        showBorder && "border border-border"
      )}
      unoptimized={src.startsWith("http")}
    />
  );

  const hasMaxWidthOverride =
    fullWidth || (typeof className === "string" && /max-w-/.test(className));

  return (
    <>
      <figure
        className={cn(
          "group flex flex-col gap-2 mb-4 mx-auto cursor-pointer",
          fullWidth ? "w-full" : !hasMaxWidthOverride && "max-w-lg",
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <div
          className={cn(
            "relative max-w-full mx-auto",
            fullWidth ? "w-full" : "inline-block"
          )}
        >
          {inlineImage}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md bg-black/60 hover:bg-black/80 text-white"
            aria-label="Open fullscreen"
          >
            <Maximize2 className="size-3" />
          </button>
        </div>
        {caption && (
          <figcaption className="text-center text-sm text-foreground-muted">
            {caption}
          </figcaption>
        )}
      </figure>

      {isOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label="Image fullscreen view"
          >
          <button
            type="button"
            onClick={close}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close fullscreen"
          >
            <X className="size-4" />
          </button>
          <div
            className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <NextImage
              src={src}
              alt={alt}
              width={1920}
              height={1080}
              className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-md"
              unoptimized={src.startsWith("http")}
            />
            {caption && (
              <p className="text-white/80 text-sm mt-4 text-center max-w-full">
                {caption}
              </p>
            )}
          </div>
        </div>,
          document.body
        )}
    </>
  );
}
