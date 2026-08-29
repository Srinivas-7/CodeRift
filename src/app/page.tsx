import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  ArrowRight,
  Sparkles,
  Check,
  ExternalLink,
  Users,
  Shield,
  Target,
  Flame,
  Layers,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div style={{ overflow: "hidden", minHeight: "100vh" }}>
      {/* 1. HERO POSTER COMPOSITION */}
      <section
        style={{
          position: "relative",
          padding: "4.5rem 0 6rem",
          borderBottom: "1px solid var(--border-editorial)",
        }}
      >
        <div className="app-container">
          {/* Masthead Metadata Strip */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "3rem",
              paddingBottom: "1rem",
              borderBottom: "1px solid var(--border-editorial)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span className="editorial-stamp" style={{ borderColor: "var(--accent-cobalt)", color: "#FFF", background: "rgba(33, 72, 255, 0.15)" }}>
                EDITORIAL DSA SYSTEM
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                STRIVER SDE SHEET (EXACT 191)
              </span>
            </div>

            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
              HABIT SPECIFICATION: <strong style={{ color: "var(--accent-vermillion)" }}>03 PROBLEMS / 24H</strong>
            </div>
          </div>

          {/* Editorial Dramatic Poster Typography */}
          <div style={{ position: "relative", marginBottom: "4rem" }}>
            <div
              className="display-huge"
              style={{
                color: "var(--text-primary)",
                userSelect: "none",
                opacity: 0.95,
              }}
            >
              191
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                alignItems: "baseline",
                gap: "2rem",
                marginTop: "-1rem",
              }}
            >
              <div>
                <h1
                  className="font-grotesk"
                  style={{
                    fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
                    fontWeight: 900,
                    lineHeight: 0.9,
                    letterSpacing: "-0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  PROBLEMS.
                </h1>
                <div
                  className="font-serif serif-italic"
                  style={{
                    fontSize: "clamp(2rem, 5vw, 4rem)",
                    color: "var(--accent-cobalt)",
                    lineHeight: 1,
                  }}
                >
                  Three Every Single Day.
                </div>
              </div>

              <div style={{ maxWidth: "440px" }}>
                <p
                  style={{
                    fontSize: "1.15rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: "1.5rem",
                  }}
                >
                  Stop staring at an overwhelming 191-problem mountain. Take three today. Solve on LeetCode. Beat your close friends.
                </p>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <Link
                    href={user ? "/dashboard" : "/login"}
                    className="btn-editorial-primary"
                    style={{ fontSize: "1rem", padding: "1rem 2rem" }}
                  >
                    GET IN TO ARENA →
                  </Link>

                  <Link
                    href={user ? "/groups" : "/login"}
                    className="btn-editorial-outline"
                    style={{ fontSize: "0.95rem", padding: "1rem 1.8rem" }}
                  >
                    JOIN A SQUAD
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* High-Contrast Asymmetric Manifesto Blocks */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "1.75rem",
            }}
          >
            {/* Block 1: The Habit Loop */}
            <div
              className="editorial-card"
              style={{
                padding: "2.75rem 2.25rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-editorial)",
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.2s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Flame size={16} style={{ color: "var(--accent-cobalt)" }} />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--accent-cobalt)",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    01 // THE HABIT LOOP
                  </span>
                </div>

                <h3
                  className="font-grotesk"
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                  }}
                >
                  Never 191. Only 3.
                </h3>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.65 }}>
                  191 problems is overwhelming. 3 problems is manageable every single day. By focusing strictly on today's batch, you eliminate burnout and build compound consistency.
                </p>
              </div>
            </div>

            {/* Block 2: Real LeetCode Environment */}
            <div
              className="editorial-card"
              style={{
                padding: "2.75rem 2.25rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-editorial)",
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.2s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <ExternalLink size={16} style={{ color: "var(--accent-vermillion)" }} />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--accent-vermillion)",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    02 // REAL ENVIRONMENT
                  </span>
                </div>

                <h3
                  className="font-grotesk"
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                  }}
                >
                  Solve on LeetCode.
                </h3>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.65 }}>
                  No artificial in-browser code editor toys. Open the authentic LeetCode problem, submit your code, and click Verify. Our backend verifies your accepted submission via GraphQL.
                </p>
              </div>
            </div>

            {/* Block 3: Private Social Squads */}
            <div
              className="editorial-card"
              style={{
                padding: "2.75rem 2.25rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-editorial)",
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.2s ease",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Users size={16} style={{ color: "var(--accent-acid)" }} />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      color: "var(--accent-acid)",
                      fontWeight: 800,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                    }}
                  >
                    03 // PRIVATE SQUADS
                  </span>
                </div>

                <h3
                  className="font-grotesk"
                  style={{
                    fontSize: "1.65rem",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                  }}
                >
                  Compete with Friends.
                </h3>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.65 }}>
                  Compete strictly with friends you invite. Track who solved today's 3, battle for the weekly #1 crown, and receive live notifications when friends pass your rank.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 191 STRIVER SHEET DISCIPLINE SECTION */}
      <section style={{ padding: "6rem 0", borderBottom: "1px solid var(--border-editorial)" }}>
        <div className="app-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "4rem",
              alignItems: "center",
            }}
          >
            <div>
              <span className="editorial-stamp" style={{ borderColor: "var(--border-editorial)", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                CURATED ARCHIVE SPECIFICATION
              </span>

              <h2
                className="font-grotesk"
                style={{
                  fontSize: "clamp(2rem, 5vw, 3.5rem)",
                  lineHeight: 1.05,
                  textTransform: "uppercase",
                  marginBottom: "1.5rem",
                }}
              >
                STRICTLY THE APPROVED 191 SDE SHEET.
              </h2>

              <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                No randomly generated questions. No AI filler problems. Exactly the 191 high-impact interview problems across Arrays, Linked Lists, Trees, Dynamic Programming, and Graphs.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--text-primary)" }}>
                  <Check size={16} style={{ color: "var(--accent-acid)" }} /> 27 Core SDE Sheet Interview Categories
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--text-primary)" }}>
                  <Check size={16} style={{ color: "var(--accent-acid)" }} /> Streak Shields Protection against Burnout
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--text-primary)" }}>
                  <Check size={16} style={{ color: "var(--accent-acid)" }} /> Automatic Telemetry & Server-Verified XP
                </div>
              </div>
            </div>

            {/* Visual Editorial Typography Box */}
            <div
              style={{
                background: "var(--bg-surface)",
                border: "2px solid var(--text-primary)",
                padding: "3rem 2.5rem",
                borderRadius: "4px",
                boxShadow: "16px 16px 0px var(--accent-cobalt)",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
                ARENA HABIT TELEMETRY // 24H CYCLE
              </div>

              <div
                className="font-serif"
                style={{
                  fontSize: "4.5rem",
                  lineHeight: 0.9,
                  color: "#FFFFFF",
                  marginBottom: "0.5rem",
                }}
              >
                03 / 03
              </div>

              <div className="font-grotesk" style={{ fontSize: "1.4rem", fontWeight: 800, textTransform: "uppercase", color: "var(--accent-acid)", marginBottom: "1.5rem" }}>
                TODAY'S MISSION COMPLETE.
              </div>

              <div className="editorial-rule" />

              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-muted)" }}>STREAK ENGINE:</span>
                <span style={{ color: "var(--accent-vermillion)", fontWeight: 700 }}>ACTIVE • SHIELDED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FINAL CALL TO ACTION */}
      <section style={{ padding: "6rem 0 8rem", textAlign: "center" }}>
        <div className="app-container" style={{ maxWidth: "780px" }}>
          <h2
            className="font-grotesk"
            style={{
              fontSize: "clamp(2.4rem, 6vw, 4rem)",
              lineHeight: 1,
              textTransform: "uppercase",
              marginBottom: "1.25rem",
            }}
          >
            START TODAY'S THREE.
          </h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.15rem", lineHeight: 1.6, marginBottom: "2.5rem" }}>
            Sign in with Google in one click. Connect your LeetCode handle. Enter your arena run.
          </p>

          <Link
            href={user ? "/dashboard" : "/login"}
            className="btn-editorial-primary"
            style={{ fontSize: "1.1rem", padding: "1.1rem 2.8rem" }}
          >
            GET IN TO ARENA →
          </Link>
        </div>
      </section>
    </div>
  );
}
