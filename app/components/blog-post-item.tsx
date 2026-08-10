import Link from "next/link";
import { formatDate, Metadata } from "@/app/blog/utils";
import { PostageStamp } from "@/app/components/vintage/postage-stamp";
import { MOTIF_STAMPS, resolveMotif } from "@/lib/blog-motifs";

type BlogPostItemProps = {
  slug: string;
  metadata: Metadata;
};

export function BlogPostItem({ slug, metadata }: BlogPostItemProps) {
  const motif = resolveMotif(metadata.motif);
  const stamp = metadata.stamp
    ? { src: metadata.stamp, alt: metadata.title }
    : MOTIF_STAMPS[motif];

  return (
    <Link href={`/blog/${slug}`} className="block group">
      <article className="blog-postcard flex items-start gap-4 py-5 transition-colors">
        <PostageStamp
          src={stamp.src}
          alt={stamp.alt}
          size="sm"
          className="mt-0.5 transition-transform duration-500 group-hover:-rotate-2 group-hover:scale-[1.03]"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-[family-name:var(--font-display)] text-xl leading-snug tracking-tight text-[var(--ink)] group-hover:text-[var(--ink-muted)] transition-colors">
              {metadata.title}
            </h3>
            <time
              dateTime={metadata.publishedAt}
              className="hidden sm:block shrink-0 font-[family-name:var(--font-script)] text-base text-[var(--ink-muted)]"
            >
              {formatDate(metadata.publishedAt, false, true)}
            </time>
          </div>
          {metadata.summary && (
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-muted)] line-clamp-2">
              {metadata.summary}
            </p>
          )}
          <p className="mt-2 font-[family-name:var(--font-script)] text-sm text-[var(--mustard)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            open letter →
          </p>
        </div>
      </article>
    </Link>
  );
}
