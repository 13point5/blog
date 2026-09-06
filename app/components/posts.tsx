import { getBlogPosts } from "@/app/blog/utils";
import { BlogPostItem } from "./blog-post-item";

export function BlogPosts() {
  const allBlogs = getBlogPosts()
    .filter((post) => post.metadata.sample !== "true")
    .sort((a, b) => {
      if (new Date(a.metadata.publishedAt) > new Date(b.metadata.publishedAt)) {
        return -1;
      }
      return 1;
    });

  return (
    <div className="essay-list not-prose">
      {allBlogs.map((post) => (
        <BlogPostItem key={post.slug} slug={post.slug} metadata={post.metadata} />
      ))}
    </div>
  );
}
