import Link from "next/link";
import { pad, stampDate, type Post } from "@/app/blog/utils";

/** A post as a 3.5" floppy. Hovering slides the metal shutter open. */
export function Floppy({ post }: { post: Post }) {
  const { metadata, slug, issue, swatch, words } = post;
  const size = words >= 1000 ? `${(words / 1000).toFixed(1)}K` : `${words}`;

  return (
    <Link
      href={`/blog/${slug}`}
      className={`disk swatch-${swatch}`}
      aria-label={`${metadata.title}, published ${metadata.publishedAt}`}
    >
      <div className="floppy" aria-hidden="true">
        <span className="floppy-media" />
        <span className="floppy-arrow" />
        <span className="floppy-shutter">
          <span className="floppy-issue">{pad(issue)}</span>
          <span className="floppy-window" />
        </span>
        <span className="floppy-edge">HD</span>
        <span className="floppy-label">
          <span className="floppy-meta">
            <span>{metadata.author ?? "Sriraam"}</span>
            <span>{size} words</span>
          </span>
          <span className="floppy-summary">{metadata.summary}</span>
          <span className="floppy-title">{metadata.title}</span>
          <span className="floppy-scribble">vol.{issue}</span>
          <span className="floppy-barcode" />
        </span>
        <span className="floppy-date">{stampDate(metadata.publishedAt)}</span>
        <span className="floppy-notch floppy-notch-r" />
      </div>
    </Link>
  );
}
