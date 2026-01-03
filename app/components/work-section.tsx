import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getBlogPosts } from "@/app/blog/utils";

export default function WorkSection() {
  const posts = getBlogPosts()
    .sort((a, b) => {
      if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
        return -1;
      }
      return 1;
    })
    .slice(0, 3); // Show only the 3 most recent posts

  return (
    <section id="blog" className="animate-fade-blur animation-delay-100">
      <div className="flex items-center justify-between mb-6">
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

      {/* Items grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="block group bg-background-card rounded-2xl p-5 border border-transparent hover:border-border transition-colors duration-200"
          >
            {/* Image */}
            <div className="aspect-video lg:aspect-4/3 bg-background rounded-xl mb-4 overflow-hidden flex items-center justify-center">
              {post.metadata.image ? (
                <img
                  src={post.metadata.image}
                  alt={post.metadata.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-5xl opacity-20">✍️</div>
              )}
            </div>

            {/* Title */}
            <h3 className="font-medium">{post.metadata.title}</h3>
          </Link>
        ))}
      </div>
    </section>
  );
}
