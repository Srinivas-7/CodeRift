"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Arena Error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 120px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 1.5rem",
      }}
    >
      <div
        className="editorial-card"
        style={{
          maxWidth: "540px",
          width: "100%",
          padding: "3rem 2.5rem",
          textAlign: "center",
          background: "var(--bg-surface)",
          border: "1px solid var(--accent-vermillion)",
          borderRadius: "4px",
          boxShadow: "16px 16px 0px rgba(255, 55, 20, 0.2)",
        }}
      >
        <div style={{ display: "inline-flex", color: "var(--accent-vermillion)", marginBottom: "1.25rem" }}>
          <AlertTriangle size={42} />
        </div>

        <span
          className="editorial-stamp"
          style={{ borderColor: "var(--accent-vermillion)", color: "var(--accent-vermillion)", marginBottom: "1rem" }}
        >
          ANOMALY DETECTED // ERROR 500
        </span>

        <h1
          className="font-grotesk"
          style={{
            fontSize: "2rem",
            textTransform: "uppercase",
            color: "#FFF",
            marginBottom: "0.5rem",
          }}
        >
          ARENA INTERRUPTION
        </h1>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "2rem", lineHeight: 1.6 }}>
          {error.message || "An unexpected error occurred while loading this arena module."}
        </p>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={() => reset()}
            className="btn-editorial-primary"
            style={{ fontSize: "0.9rem", padding: "0.8rem 1.5rem" }}
          >
            <RotateCcw size={16} /> RETRY ACTION
          </button>

          <Link
            href="/dashboard"
            className="btn-editorial-outline"
            style={{ fontSize: "0.9rem", padding: "0.8rem 1.5rem" }}
          >
            <Home size={16} /> RETURN DASHBOARD
          </Link>
        </div>
      </div>
    </div>
  );
}
