import { ImageResponse } from "next/og";

export const runtime = "edge";

// Next.js File Conventions: opengraph-image.tsx auto-generates /opengraph-image
// on the route it lives under. Place it at the app root so every page inherits
// the same OG card unless they override their own.
export const alt = "briefly — AI summaries for the articles you save";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(circle at 30% 30%, rgba(124,58,237,0.35) 0%, transparent 60%), #0a0a0a",
          color: "#fafafa",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 28,
            fontWeight: 600,
            color: "#a78bfa",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          <span style={{ fontSize: 40 }}>✦</span>
          briefly
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 88,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            marginTop: 36,
            maxWidth: 900,
          }}
        >
          The shorter way to read the web.
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#a1a1aa",
            marginTop: 28,
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Paste any article. Get a 3-sentence TL;DR, 5 key points, and tags —
          powered by Claude.
        </div>
      </div>
    ),
    { ...size },
  );
}
