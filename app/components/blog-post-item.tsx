import Link from "next/link";
import { formatDate, parseTags, readingMinutes, type Metadata } from "@/app/blog/utils";
import { PixelScene } from "./pixel-scene";
import { PixelWindow } from "./pixel-window";
import { DEFAULT_COVER } from "@/lib/pixel";

type BlogPostItemProps = {
  slug: string;
  metadata: Metadata;
  content: string;
};

/** A post, shown as a little desktop window with an animated cover. */
export function BlogPostItem({ slug, metadata, content }: BlogPostItemProps) {
  const tags = parseTags(metadata.tags);
  return (
    <Link href={`/blog/${slug}`} className="block px-card px-window h-full">
      <PixelWindow title={`${slug}.px`} className="!border-0 !shadow-none h-full flex flex-col" bodyClassName="flex flex-col flex-1">
        <div className="border-b-[3px] border-frame">
          <PixelScene scene={metadata.cover ?? DEFAULT_COVER} />
        </div>
        <article className="p-4 flex flex-col gap-2 flex-1">
          <div className="flex flex-wrap gap-1.5">
            {metadata.placeholder === "true" && <span className="px-tag px-tag-warn">placeholder</span>}
            {tags.map((t) => (
              <span key={t} className="px-tag">{t}</span>
            ))}
          </div>
          <h3 className="d-md">{metadata.title}</h3>
          <p className="text-[0.9em] text-foreground-muted leading-snug line-clamp-3">{metadata.summary}</p>
          <p className="d-xs text-foreground-muted mt-auto pt-2 flex justify-between gap-2">
            <time dateTime={metadata.publishedAt}>{formatDate(metadata.publishedAt, false, true)}</time>
            <span>{readingMinutes(content)} min read</span>
          </p>
        </article>
      </PixelWindow>
    </Link>
  );
}
