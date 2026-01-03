import Link from "next/link";
import { formatDate, getBlogPosts } from "@/app/blog/utils";

export function BlogPosts() {
  const allBlogs = getBlogPosts();

  return (
    <div className="space-y-4 not-prose">
      {allBlogs
        .sort((a, b) => {
          if (
            new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)
          ) {
            return -1;
          }
          return 1;
        })
        .map((post) => (
          <Link
            key={post.slug}
            className="block group"
            href={`/blog/${post.slug}`}
          >
            <article className="flex items-baseline justify-between gap-4 py-3 border-b border-border/50 hover:border-border transition-colors">
              <h4 className="text-lg font-medium group-hover:text-foreground-muted transition-colors flex-1">
                {post.metadata.title}
              </h4>
              <time
                dateTime={post.metadata.publishedAt}
                className="text-sm text-foreground-muted whitespace-nowrap"
              >
                {formatDate(post.metadata.publishedAt)}
              </time>
            </article>
          </Link>
        ))}
    </div>
  );
}

