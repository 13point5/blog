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
  const summary = post?.metadata.summary;

  const zoroData = await readFile(join(process.cwd(), "public/zoro.png"));
  const zoroBase64 = `data:image/png;base64,${zoroData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#0d1117",
          padding: "60px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            paddingRight: "60px",
          }}
        >
          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: "#e6edf3",
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </div>
          {summary && (
            <div
              style={{
                fontSize: 24,
                color: "#8b949e",
                marginTop: 20,
                lineHeight: 1.5,
              }}
            >
              {summary.length > 120
                ? summary.substring(0, 120) + "..."
                : summary}
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 32,
              gap: 10,
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: "#58a6ff",
                fontWeight: 600,
              }}
            >
              sriraam.me
            </div>
          </div>
        </div>

        <img
          src={zoroBase64}
          alt="Sriraam"
          width={200}
          height={200}
          style={{
            borderRadius: "50%",
            border: "3px solid #30363d",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
