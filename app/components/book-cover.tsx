import { formatDate, pad, type Post } from "@/app/blog/utils";
import { QuillIcon } from "./icons";

/** Post header as a vintage three-band paperback cover. */
export function BookCover({ post }: { post: Post }) {
  const { metadata, issue, minutes } = post;

  return (
    <header className="book">
      <div className="book-band">
        <span>Sriraam · Field Notes</span>
        <span>No. {pad(issue)}</span>
      </div>
      <div className="book-panel">
        <h1 className="book-title">{metadata.title}</h1>
        <div className="book-rule" aria-hidden="true" />
        <p className="book-author">{metadata.author ?? "Sriraam"}</p>
      </div>
      <div className="book-band">
        <time dateTime={metadata.publishedAt}>
          {formatDate(metadata.publishedAt, false, true)}
        </time>
        <span className="book-emblem">
          <QuillIcon />
        </span>
        <span>{minutes} min read</span>
      </div>
    </header>
  );
}
