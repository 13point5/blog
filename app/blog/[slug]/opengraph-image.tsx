import { getSortedPosts, pad } from "@/app/blog/utils";
import { ogSize, renderOgImage } from "@/lib/og-image";

export const alt = "Blog Post";
export const size = ogSize;
export const contentType = "image/png";

// Mirrors the .swatch-* colours in globals.css
const SWATCH_HEX: Record<string, string> = {
  tangerine: "#f08a2e",
  cobalt: "#3d5fc4",
  grass: "#45a854",
  tomato: "#e0412f",
  lemon: "#e2ed3c",
  navy: "#28377d",
  bubblegum: "#f28bb5",
  graphite: "#2a292e",
};

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getSortedPosts().find((post) => post.slug === slug);

  return renderOgImage({
    title: post?.metadata.title || "Blog Post",
    kicker: post ? `field notes · No. ${pad(post.issue)}` : "field notes",
    subtitle: "by Sriraam · Chakra Labs",
    accent: post ? SWATCH_HEX[post.swatch] : undefined,
  });
}
