import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const BG_RAISED = "#1f2229";
const ACCENT = "#5aa3d6";
const BAR_DIM = "#7fb6dd";
const BAR_MID = "#a9d0ea";
const BAR_BRIGHT = "#dfeefa";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          gap: 2,
          padding: "8px 7px",
          background: BG_RAISED,
          border: `1px solid ${ACCENT}`,
          borderRadius: 7,
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 8,
            height: 4,
            borderRadius: 2,
            background: BAR_DIM,
          }}
        />
        <div
          style={{
            display: "flex",
            width: 12,
            height: 4,
            borderRadius: 2,
            background: BAR_MID,
          }}
        />
        <div
          style={{
            display: "flex",
            width: 18,
            height: 4,
            borderRadius: 2,
            background: BAR_BRIGHT,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
