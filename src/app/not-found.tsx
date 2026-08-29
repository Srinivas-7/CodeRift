import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
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
          maxWidth: "520px",
          width: "100%",
          padding: "3.5rem 2.5rem",
          textAlign: "center",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-editorial-strong)",
          borderRadius: "4px",
          boxShadow: "16px 16px 0px rgba(0, 0, 0, 0.4)",
        }}
      >
        <div style={{ display: "inline-flex", color: "var(--accent-cobalt)", marginBottom: "1.25rem" }}>
          <Compass size={44} />
        </div>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-cobalt)", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          PAGE 404 // VOID ARCHIVE
        </div>

        <h1
          className="font-grotesk"
          style={{
            fontSize: "2.4rem",
            textTransform: "uppercase",
            color: "#FFF",
            marginBottom: "0.75rem",
          }}
        >
          SECTOR NOT FOUND
        </h1>

        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "2rem", lineHeight: 1.6 }}>
          The problem, squad, or roadmap sector you are attempting to access does not exist or has been relocated.
        </p>

        <Link
          href="/dashboard"
          className="btn-editorial-primary"
          style={{ fontSize: "0.9rem", padding: "0.8rem 1.8rem" }}
        >
          <ArrowLeft size={16} /> RETURN TO COMMAND CENTER
        </Link>
      </div>
    </div>
  );
}
