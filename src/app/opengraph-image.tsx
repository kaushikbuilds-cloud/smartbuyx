import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #9333ea 0%, #4f46e5 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "rgba(255,255,255,0.15)",
              color: "white",
              fontSize: 56,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <span style={{ color: "white", fontSize: 72, fontWeight: 800, letterSpacing: -1 }}>SmartBuyX</span>
        </div>
        <span style={{ color: "white", fontSize: 34, opacity: 0.92, textAlign: "center", maxWidth: 900 }}>
          India&apos;s AI Commerce + Construction Super-App
        </span>
        <span style={{ color: "white", fontSize: 24, opacity: 0.75, marginTop: 16 }}>
          Shop. Build. Create. All in one place.
        </span>
      </div>
    ),
    { ...size }
  );
}
