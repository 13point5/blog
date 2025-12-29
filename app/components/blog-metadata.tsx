import NextImage from "next/image";

export type BlogMetadataProps = {
  author: string;
  date: string;
  coverImage?: string;
};

export function BlogMetadata({ author, date, coverImage }: BlogMetadataProps) {
  return (
    <div className="mb-8 -mt-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <time>{date}</time>
        <span>•</span>
        <span>{author}</span>
      </div>

      {coverImage && (
        <div className="max-w-lg mx-auto">
          <NextImage
            src={coverImage}
            alt="Blog cover"
            width={500}
            height={350}
            className="h-auto rounded-lg"
            unoptimized={coverImage.startsWith("http")}
          />
        </div>
      )}
    </div>
  );
}
