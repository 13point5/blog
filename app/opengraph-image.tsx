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
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: "#e6edf3",
                letterSpacing: "-0.03em",
              }}
            >
              Sriraam
            </div>
            <div
              style={{
                fontSize: 28,
                color: "#8b949e",
                lineHeight: 1.5,
              }}
            >
              Founding Engineer at Decode
            </div>
          </div>

          {/* Right side - Profile pic */}
          <div
            style={{
              display: "flex",
              width: 200,
              height: 200,
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
              width={200}
              height={200}
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
