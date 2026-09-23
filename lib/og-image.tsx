import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ogSize = { width: 1200, height: 630 };

// Pencil colours from the site, printed as a row of bars
const PENCILS = ["#45a854", "#5b7fb8", "#eba43c", "#2a292e", "#dcd3c4", "#e0412f"];

/**
 * Social card: the avatar peeks in from the bottom-left corner (the
 * illustration is cropped on those edges and its background matches the
 * card), with the title set on the right.
 */
export async function renderOgImage({
  title,
  kicker,
  subtitle = "Applied Researcher at Chakra Labs",
  accent = "#f08a2e",
}: {
  title: string;
  kicker: string;
  subtitle?: string;
  accent?: string;
}) {
  const avatar = await readFile(join(process.cwd(), "public/avatar.png"));
  const avatarSrc = `data:image/png;base64,${avatar.toString("base64")}`;
  const long = title.length > 22;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#e8e5df",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt=""
          width={560}
          height={560}
          style={{ position: "absolute", left: 0, bottom: 0 }}
        />
        <div
          style={{
            position: "absolute",
            left: 560,
            right: 70,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 14px",
              backgroundColor: "#1d1c1a",
              color: "#e8e5df",
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              fontSize: long ? 60 : 96,
              fontWeight: 700,
              color: "#1d1c1a",
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              textShadow: `5px 5px 0 ${accent}`,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 28, color: "#5e594f" }}>{subtitle}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {PENCILS.map((color, i) => (
              <div
                key={color}
                style={{
                  width: 56 + ((i * 37) % 40),
                  height: 16,
                  backgroundColor: color,
                  borderRadius: 3,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    ),
    ogSize
  );
}
