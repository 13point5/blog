import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getBlogPosts } from "@/app/blog/utils";
import { BlogPostItem } from "./blog-post-item";

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
          <BlogPostItem
            key={post.slug}
            slug={post.slug}
            metadata={post.metadata}
          />
        ))}
      </div>
    </section>
  );
}
