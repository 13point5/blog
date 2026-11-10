import { getSortedPosts } from "@/app/blog/utils";
import { BlogPostItem } from "./blog-post-item";

export function BlogPosts({ limit }: { limit?: number }) {
  const posts = getSortedPosts().slice(0, limit);

  return (
    <ul className="divide-y divide-border not-prose">
      {posts.map((post) => (
        <li key={post.slug}>
          <BlogPostItem slug={post.slug} metadata={post.metadata} />
        </li>
      ))}
    </ul>
  );
}
