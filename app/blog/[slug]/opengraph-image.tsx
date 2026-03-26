import { getBlogPosts } from "@/app/blog/utils";
import {
  createGitHubStyleOgImage,
  ogContentType,
  ogSize,
} from "@/lib/og-image";

export const alt = "Blog Post";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);
  const title = post?.metadata.title || "Blog Post";
  const subtitle = post?.metadata.subtitle;

  return createGitHubStyleOgImage({
    title,
    subtitle,
  });
}
