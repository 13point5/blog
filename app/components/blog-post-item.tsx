import Link from "next/link";
import { formatDate, Metadata } from "@/app/blog/utils";

type BlogPostItemProps = {
  slug: string;
  metadata: Metadata;
};

export function BlogPostItem({ slug, metadata }: BlogPostItemProps) {
  return (
    <Link href={`/blog/${slug}`} className="block group">
      <article className="flex items-start justify-between gap-4 py-2">
        <div className="flex items-start gap-3 min-w-0">
          {metadata.image && (
            <img
              src={metadata.image}
              alt=""
              className="w-8 h-8 rounded object-cover flex-shrink-0"
            />
          )}
          <h3 className="font-medium group-hover:text-foreground-muted transition-colors">
            {metadata.title}
          </h3>
        </div>
        <time
          dateTime={metadata.publishedAt}
          className="hidden sm:block text-sm text-foreground-muted whitespace-nowrap"
        >
          {formatDate(metadata.publishedAt, false, true)}
        </time>
      </article>
    </Link>
  );
}

