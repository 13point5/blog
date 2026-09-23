import { ogSize, renderOgImage } from "@/lib/og-image";

export const alt = "Sriraam's Blog";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({
    title: "sriraam / blog",
    kicker: "archive",
    accent: "#3d5fc4",
  });
}
