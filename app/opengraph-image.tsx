import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Sriraam - Founding Engineer at Decode";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
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
        </div>

        {/* Right side - Zoro image */}
        <img
          src={zoroSrc}
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
