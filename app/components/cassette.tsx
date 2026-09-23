import Link from "next/link";
import type { Post } from "@/app/blog/utils";

function Reel() {
  return (
    <svg className="reel" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="19" fill="#f4f1ea" />
      <circle cx="20" cy="20" r="7.5" fill="none" stroke="#1d1c1a" strokeWidth="2" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <rect
          key={deg}
          x="17.5"
          y="3.5"
          width="5"
          height="8"
          rx="1.5"
          fill="var(--sw-deep)"
          transform={`rotate(${deg} 20 20)`}
        />
      ))}
    </svg>
  );
}

/** A post as a cassette tape with a lined liner-note card underneath. */
export function Cassette({ post }: { post: Post }) {
  const { metadata, slug, issue, swatch, minutes } = post;
  const month = metadata.publishedAt.slice(0, 7);

  return (
    <Link href={`/blog/${slug}`} className={`tape swatch-${swatch}`}>
      <div className="cassette" aria-hidden="true">
        <div className="cassette-label">
          <div className="cassette-head">
            <span className="cassette-side">A</span>
            <span className="cassette-title">{metadata.title}</span>
          </div>
          <div className="cassette-window">
            <Reel />
            <span className="tape-pane" />
            <Reel />
          </div>
        </div>
        <div className="cassette-foot" />
      </div>
      <h3 className="sr-only">{metadata.title}</h3>
      <p className="note-card">{metadata.summary}</p>
      <div className="px-1 flex flex-col gap-0.5 font-mono text-xs">
        <time dateTime={metadata.publishedAt} className="font-bold">
          {month}
        </time>
        <span className="text-foreground-muted">
          side A · No. {String(issue).padStart(2, "0")} · {minutes} min
        </span>
      </div>
    </Link>
  );
}
