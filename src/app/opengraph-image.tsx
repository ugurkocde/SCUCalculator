import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Microsoft Security Copilot SCU Calculator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "radial-gradient(circle at 90% 10%, rgba(163,230,53,0.18), rgba(15,23,42,0) 60%), linear-gradient(135deg, #020617 0%, #0b1120 50%, #0f172a 100%)",
          color: "#e2e8f0",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span
            style={{
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: "#bef264",
            }}
          >
            Security Copilot SCU Calculator
          </span>
          <span
            style={{
              fontSize: 76,
              lineHeight: 1.05,
              fontWeight: 600,
              color: "#f8fafc",
              maxWidth: 1000,
              letterSpacing: "-0.02em",
            }}
          >
            What will Security Copilot cost you?
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <span style={{ fontSize: 28, color: "#94a3b8" }}>
            Three answers. Live monthly estimate. No Azure login required.
          </span>
          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "center",
              fontSize: 24,
              color: "#cbd5f5",
            }}
          >
            <span
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(163,230,53,0.12)",
                color: "#d9f99d",
                fontWeight: 600,
              }}
            >
              E5 / E7 included pool
            </span>
            <span
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              Per-agent SCU rates
            </span>
            <span
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              Microsoft-sourced
            </span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
