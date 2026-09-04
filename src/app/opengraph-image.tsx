import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Muhammad Ahmad Barkat — Software Engineer Portfolio";
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
          backgroundColor: "#081C15",
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
            background: "radial-gradient(circle, rgba(82, 183, 136, 0.2) 0%, transparent 70%)",
          }}
        />

        {/* Top Header Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              background: "rgba(82, 183, 136, 0.15)",
              border: "1px solid rgba(82, 183, 136, 0.4)",
              color: "#52B788",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.15em",
            }}
          >
            MAB // PORTFOLIO 2026
          </div>
        </div>

        {/* Center Main Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 900,
              color: "#F0EDE8",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
            }}
          >
            Muhammad Ahmad Barkat
          </div>
          <div
            style={{
              fontSize: "36px",
              fontWeight: 700,
              color: "#52B788",
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
            borderTop: "1px solid rgba(82, 183, 136, 0.2)",
            paddingTop: "24px",
            color: "rgba(240, 237, 232, 0.6)",
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
