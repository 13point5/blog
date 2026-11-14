import { getSortedPosts } from "@/app/blog/utils";
import { BlogPostItem } from "./blog-post-item";

/** `contents` lists each post in the owl's contents menu (used on the blog index). */
export function BlogPosts({ limit, contents }: { limit?: number; contents?: boolean }) {
  const posts = getSortedPosts().slice(0, limit);

  return (
    <ul className="divide-y divide-border not-prose">
      {posts.map((post) => (
        <li key={post.slug} data-toc={contents ? post.metadata.title : undefined}>
          <BlogPostItem slug={post.slug} metadata={post.metadata} />
        </li>
      ))}
    </ul>
  );
}
