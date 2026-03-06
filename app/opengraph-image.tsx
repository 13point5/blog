import {
  createGitHubStyleOgImage,
  ogContentType,
  ogSize,
} from "@/lib/og-image";

export const alt = "Sriraam - Founding Engineer at Decode";
export const size = ogSize;
export const contentType = ogContentType;

export default async function Image() {
  return createGitHubStyleOgImage({
    title: "sriraam",
    subtitle: "Founding Engineer at Decode. Learning RL.",
  });
}
