import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Sriraam - Applied Researcher at Chakra Labs";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
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
          }}
        >
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              color: "#252830",
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
            Applied Researcher at Chakra Labs
          </div>
        </div>

        {/* Right side - Sriraam avatar */}
        <img
          src={avatarSrc as unknown as string}
          alt="Sriraam"
          width={280}
          height={280}
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
