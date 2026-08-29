"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Layout Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          backgroundColor: "#0A0B10",
          color: "#F5F2EB",
          fontFamily: "-apple-system, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            maxWidth: "500px",
            textAlign: "center",
            background: "#10121A",
            border: "1px solid rgba(245, 242, 235, 0.2)",
            padding: "3rem 2rem",
            borderRadius: "6px",
          }}
        >
          <h2 style={{ fontSize: "1.8rem", marginBottom: "1rem" }}>CRITICAL SYSTEM INTERRUPT</h2>
          <p style={{ color: "#A0A6B8", marginBottom: "2rem", fontSize: "0.95rem" }}>
            {error.message || "A core system error occurred."}
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: "#2148FF",
              color: "#FFF",
              border: "none",
              padding: "0.8rem 1.6rem",
              borderRadius: "4px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            REINITIALIZE ARENA
          </button>
        </div>
      </body>
    </html>
  );
}
