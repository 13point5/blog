import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDate, getBlogPosts } from "@/app/blog/utils";

export default function WorkSection() {
  const posts = getBlogPosts()
    .sort((a, b) => {
      if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
        return -1;
      }
      return 1;
    })
    .slice(0, 5);

  return (
    <section id="blog" className="animate-fade-blur animation-delay-100">
      <div className="flex items-center justify-between mb-4 mt-6">
        <h2 className="text-2xl font-semibold text-foreground">blog</h2>

        <Link href="/blog">
          <Button variant="ghost" className="gap-2 group">
            View All
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Button>
        </Link>
      </div>

      <div className="space-y-1">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block group"
          >
            <article className="flex items-center justify-between gap-4 py-2">
              <div className="flex items-center gap-3 min-w-0">
                {post.metadata.image && (
                  <img
                    src={post.metadata.image}
                    alt=""
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                )}
                <h3 className="font-medium group-hover:text-foreground-muted transition-colors truncate">
                  {post.metadata.title}
                </h3>
              </div>
              <time
                dateTime={post.metadata.publishedAt}
                className="hidden sm:block text-sm text-foreground-muted whitespace-nowrap"
              >
                {formatDate(post.metadata.publishedAt, false, true)}
              </time>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
