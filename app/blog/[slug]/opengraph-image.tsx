import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getBlogPosts } from "@/app/blog/utils";

export const alt = "Blog Post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);

  return [
    {
      id: slug,
      alt: post?.metadata.title || "Blog Post",
      size,
      contentType,
    },
  ];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);
  const title = post?.metadata.title || "Blog Post";

  const zoroData = await readFile(join(process.cwd(), "public/zoro.png"));
  const zoroSrc = Uint8Array.from(zoroData).buffer;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          padding: "80px 100px",
        }}
      >
        {/* Left side - Text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            maxWidth: 750,
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: "-0.02em",
              lineHeight: 1.2,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#666666",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontWeight: 600 }}>Sriraam</span>
            <span style={{ color: "#999999" }}>·</span>
            <span>Founding Engineer at Decode. Learning RL</span>
          </div>
        </div>

        {/* Right side - Zoro image */}
        <img
          src={zoroSrc}
          alt="Zoro"
          width={220}
          height={220}
          style={{
            borderRadius: "50%",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
