import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "sriraam's Blog";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  const zoroImage = await fetch(
    new URL("../../public/zoro.png", import.meta.url)
  ).then((res) => res.arrayBuffer());

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
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#1a1a1a",
              letterSpacing: "-0.03em",
            }}
          >
            Sriraam
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#666666",
              lineHeight: 1.4,
            }}
          >
            Founding Engineer at Decode. Learning RL
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#999999",
              marginTop: 8,
            }}
          >
            /blog
          </div>
        </div>

        {/* Right side - Zoro image */}
        <img
          src={zoroImage as unknown as string}
          alt="Zoro"
          width={280}
          height={280}
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
