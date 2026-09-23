import Link from "next/link";
import { formatDate, Metadata } from "@/app/blog/utils";

type BlogPostItemProps = {
  slug: string;
  metadata: Metadata;
};

export function BlogPostItem({ slug, metadata }: BlogPostItemProps) {
  return (
    <Link href={`/blog/${slug}`} className="track-row group">
      <span className="track-dot" aria-hidden="true" />
      <span className="track-title">{metadata.title}</span>
      <time className="track-date" dateTime={metadata.publishedAt}>
        {formatDate(metadata.publishedAt, false, true)}
      </time>
    </Link>
  );
}
