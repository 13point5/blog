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
  const subtitle = post?.metadata.summary;

  const zoroData = await readFile(join(process.cwd(), "public/zoro.png"));
  const zoroSrc = Uint8Array.from(zoroData).buffer;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0d1117",
          padding: "60px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flex: 1,
          }}
        >
          {/* Left side - Text */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 800,
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: "#e6edf3",
                lineHeight: 1.3,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div
                style={{
                  fontSize: 24,
                  color: "#8b949e",
                  lineHeight: 1.5,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {/* Right side - Profile pic */}
          <div
            style={{
              display: "flex",
              width: 180,
              height: 180,
              borderRadius: "50%",
              overflow: "hidden",
              border: "3px solid #30363d",
              flexShrink: 0,
              marginLeft: 40,
            }}
          >
            <img
              src={zoroSrc as unknown as string}
              alt="Profile"
              width={180}
              height={180}
              style={{ objectFit: "cover" }}
            />
          </div>
        </div>

        {/* Bottom - domain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div style={{ fontSize: 20, color: "#484f58" }}>sriraam.me</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
