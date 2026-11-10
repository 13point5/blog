import Link from "next/link";
import { formatDate, type Metadata } from "@/app/blog/utils";

type BlogPostItemProps = {
  slug: string;
  metadata: Metadata;
};

export function BlogPostItem({ slug, metadata }: BlogPostItemProps) {
  return (
    <Link href={`/blog/${slug}`} className="group grid sm:grid-cols-[7.5rem_1fr] gap-x-4 gap-y-0.5 py-5">
      <time dateTime={metadata.publishedAt} className="text-sm text-foreground-muted tabular-nums sm:pt-1">
        {formatDate(metadata.publishedAt, false, true)}
      </time>
      <span className="min-w-0">
        <span className="font-display d-md block group-hover:text-link-hover transition-colors">
          {metadata.title}
        </span>
        <span className="block text-sm text-foreground-muted mt-1 leading-relaxed">
          {metadata.placeholder === "true" && <em>Placeholder. </em>}
          {metadata.summary}
        </span>
      </span>
    </Link>
  );
}
