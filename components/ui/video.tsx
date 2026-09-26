import { cn } from "@/lib/utils";

type VideoProps = {
  src: string;
  poster?: string;
  caption?: string;
  className?: string;
};

export function Video({ src, poster, caption, className }: VideoProps) {
  return (
    <figure className={cn("my-8", className)}>
      <video
        controls
        playsInline
        preload="metadata"
        poster={poster}
        className="w-full rounded-lg border border-border bg-black"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {caption ? (
        <figcaption className="mt-3 text-center text-sm text-foreground-muted">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
