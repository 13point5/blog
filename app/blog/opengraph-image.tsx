import {
  createGitHubStyleOgImage,
  ogContentType,
  ogSize,
} from "@/lib/og-image";

export const alt = "Sriraam's Blog";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return createGitHubStyleOgImage({
    title: "sriraam blog",
  });
}
