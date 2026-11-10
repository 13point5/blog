import Link from "next/link";
import { formatDate, type Metadata } from "@/app/blog/utils";

type BlogPostItemProps = {
  slug: string;
  metadata: Metadata;
};

export function BlogPostItem({ slug, metadata }: BlogPostItemProps) {
  return (
    <Link href={`/blog/${slug}`} className="group flex items-baseline justify-between gap-6 py-2.5">
      <span className="min-w-0">
        <span className="group-hover:text-link-hover transition-colors">{metadata.title}</span>
        {metadata.placeholder === "true" && (
          <span className="ml-2 text-xs text-foreground-muted">placeholder</span>
        )}
      </span>
      <time dateTime={metadata.publishedAt} className="hidden sm:block text-sm text-foreground-muted whitespace-nowrap tabular-nums">
        {formatDate(metadata.publishedAt, false, true)}
      </time>
    </Link>
  );
}
