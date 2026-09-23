import { ogSize, renderOgImage } from "@/lib/og-image";

export const alt = "Sriraam - Applied Researcher at Chakra Labs";
export const size = ogSize;
export const contentType = "image/png";

export default async function Image() {
  return renderOgImage({ title: "sriraam", kicker: "hey" });
}
