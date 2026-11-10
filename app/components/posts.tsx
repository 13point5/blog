import { getSortedPosts } from "@/app/blog/utils";
import { BlogPostItem } from "./blog-post-item";

export function BlogPosts({ limit }: { limit?: number }) {
  const posts = getSortedPosts().slice(0, limit);

  return (
    <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3 not-prose">
      {posts.map((post) => (
        <li key={post.slug}>
          <BlogPostItem slug={post.slug} metadata={post.metadata} content={post.content} />
        </li>
      ))}
    </ul>
  );
}
