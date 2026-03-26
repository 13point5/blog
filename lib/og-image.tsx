import { ImageResponse } from "next/og";

export const ogSize = {
  width: 1200,
  height: 630,
} as const;

export const ogContentType = "image/png";

const PROFILE_IMAGE_URL = "https://github.com/13point5.png?size=256";

type OgImageOptions = {
  title: string;
  subtitle?: string;
};

function getTitleFontSize(title: string) {
  if (title.length > 85) {
    return 52;
  }
  if (title.length > 55) {
    return 62;
  }
  return 72;
}

export function createGitHubStyleOgImage({ title, subtitle }: OgImageOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: "#0d1117",
          padding: "44px",
        }}
      >
        <div
          style={{
            height: "100%",
            width: "100%",
            border: "1px solid #30363d",
            borderRadius: "16px",
            background: "#0d1117",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "56px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: "760px",
              gap: "18px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: getTitleFontSize(title),
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#f0f6fc",
                fontWeight: 700,
              }}
            >
              {title}
            </div>

            {subtitle ? (
              <div
                style={{
                  display: "flex",
                  fontSize: 30,
                  lineHeight: 1.3,
                  color: "#8b949e",
                  fontWeight: 500,
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>

          <div
            style={{
              display: "flex",
              height: 236,
              width: 236,
              borderRadius: "9999px",
              border: "2px solid #30363d",
              overflow: "hidden",
              backgroundColor: "#161b22",
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={PROFILE_IMAGE_URL}
              alt="Sriraam profile picture"
              width={236}
              height={236}
              style={{
                height: "100%",
                width: "100%",
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
    }
  );
}
