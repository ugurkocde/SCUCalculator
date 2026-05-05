import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BG_BASE = "#1a1c22";
const BG_RAISED = "#1f2229";
const ACCENT = "#5aa3d6";
const ACCENT_FG = "#bcdaf0";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BG_BASE,
        }}
      >
        <div
          style={{
            width: 144,
            height: 144,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: 14,
            padding: "0 30px",
            background: BG_RAISED,
            border: `2px solid ${ACCENT}`,
            borderRadius: 32,
            boxSizing: "border-box",
            boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.04)`,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 36,
              height: 16,
              borderRadius: 8,
              background: ACCENT_FG,
              opacity: 0.35,
            }}
          />
          <div
            style={{
              display: "flex",
              width: 56,
              height: 16,
              borderRadius: 8,
              background: ACCENT_FG,
              opacity: 0.65,
            }}
          />
          <div
            style={{
              display: "flex",
              width: 84,
              height: 16,
              borderRadius: 8,
              background: ACCENT_FG,
              opacity: 1,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
