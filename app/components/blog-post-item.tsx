import Link from "next/link";
import { formatDate, type Metadata } from "@/app/blog/utils";
import { PostIcon } from "./post-icon";

type BlogPostItemProps = {
  slug: string;
  metadata: Metadata;
};

/** One post: its little card, its title, its date. Nothing else. */
export function BlogPostItem({ slug, metadata }: BlogPostItemProps) {
  return (
    <Link href={`/blog/${slug}`} className="group flex items-center gap-4 py-4">
      <PostIcon name={metadata.cover} className="transition-transform duration-150 group-hover:-rotate-3" />
      <span className="min-w-0 flex-1">
        <span className="font-display d-md block leading-snug group-hover:text-link-hover transition-colors">{metadata.title}</span>
        <time dateTime={metadata.publishedAt} className="block text-sm text-foreground-muted tabular-nums mt-0.5">
          {formatDate(metadata.publishedAt, false, true)}
          {metadata.placeholder === "true" && <span> · placeholder</span>}
        </time>
      </span>
    </Link>
  );
}
