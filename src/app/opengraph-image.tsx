import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "AHMAD Barkat — Software Engineer Portfolio";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#0B3D91",
          padding: "80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Background Accent Grid */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59, 167, 242, 0.2) 0%, transparent 70%)",
          }}
        />

        {/* Top Header: the mark and a badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <svg width="64" height="64" viewBox="0 0 48 48">
            <path d="M6 42 24 5 42 42H34.5L24 20.4 13.5 42Z" fill="#E8F6FF" />
            <rect x="18.9" y="32.6" width="10.2" height="4.4" rx="0.6" fill="#7FE7D6" />
          </svg>
          <div
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(59, 167, 242, 0.15)",
              border: "1px solid rgba(59, 167, 242, 0.4)",
              color: "#3BA7F2",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            PORTFOLIO 2026
          </div>
        </div>

        {/* Center Main Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "#E8F6FF",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            AHMAD Barkat
          </div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#3BA7F2",
              letterSpacing: "0.05em",
            }}
          >
            Software Engineer & UI Architect
          </div>
        </div>

        {/* Footer Subtext */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
            borderTop: "1px solid rgba(59, 167, 242, 0.2)",
            paddingTop: "24px",
            color: "rgba(232, 246, 255, 0.6)",
            fontSize: "20px",
          }}
        >
          <span>Interactive Digital Experiences</span>
          <span>ahmadbarkat.dev</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
