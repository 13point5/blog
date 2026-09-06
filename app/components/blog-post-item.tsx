import Link from "next/link";
import { formatDate, type Metadata } from "@/app/blog/utils";
export function BlogPostItem({ slug, metadata }: { slug: string; metadata: Metadata }) {
  return <Link href={`/blog/${slug}`} className="essay-row"><div className="essay-date">{metadata.sample === "true" ? <span className="sample-label">Sample essay</span> : <time dateTime={metadata.publishedAt}>{formatDate(metadata.publishedAt, false, true)}</time>}</div><div className="essay-details"><h3>{metadata.title}</h3><p>{metadata.summary}</p></div><span className="essay-arrow" aria-hidden="true">↗</span></Link>;
}
