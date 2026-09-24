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

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getBlogPosts().find((post) => post.slug === slug);
  const title = post?.metadata.title || "Blog Post";

  const avatarData = await readFile(join(process.cwd(), "public/avatar.jpeg"));
  const avatarSrc = Uint8Array.from(avatarData).buffer;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#f3f4f6",
          padding: "80px 100px",
          borderBottom: "16px solid #4259a8",
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
              color: "#252830",
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
            <span>Applied Researcher at Chakra Labs</span>
          </div>
        </div>

        {/* Right side - Sriraam avatar */}
        <img
          src={avatarSrc as unknown as string}
          alt="Sriraam"
          width={220}
          height={220}
          style={{
            borderRadius: "8px",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
