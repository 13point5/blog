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
              marginTop: 16,
            }}
          >
            Founding Engineer at Decode. Learning RL
          </div>
        </div>

        <img
          src={zoroBase64}
          alt="Sriraam"
          width={240}
          height={240}
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
