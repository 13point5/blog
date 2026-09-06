import { getBlogPosts } from "@/app/blog/utils";

export const baseUrl = "https://www.sriraam.me";

export default async function sitemap() {
  const blogs = getBlogPosts().filter((post) => post.metadata.sample !== "true").map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.metadata.publishedAt,
  }));

  const routes = ["", "/blog"].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split("T")[0],
  }));

  return [...routes, ...blogs];
}

