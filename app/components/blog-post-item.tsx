import Link from "next/link";
import { formatDate, type Metadata } from "@/app/blog/utils";

export function BlogPostItem({ slug, metadata }: { slug: string; metadata: Metadata }) {
  return (
    <article className="essay-row">
      <div className="essay-details">
        <h3>
          <Link href={`/blog/${slug}`}>{metadata.title}</Link>
        </h3>
      </div>
      <div className="essay-date">
        {metadata.sample === "true" ? (
          <span>Sample essay</span>
        ) : (
          <time dateTime={metadata.publishedAt}>{formatDate(metadata.publishedAt, false, true)}</time>
        )}
      </div>
    </article>
  );
}
