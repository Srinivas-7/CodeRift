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
  Terminal,
  Zap,
  Cpu,
  Trophy,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div style={{ position: "relative", minHeight: "100vh", paddingBottom: "6rem" }}>
      {/* 1. HERO NEO-BRUTALIST SECTION */}
      <section
        style={{
          position: "relative",
          padding: "3.5rem 0 4.5rem",
        }}
      >
        <div className="app-container">
          {/* Masthead Tag Strip */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "1rem",
              marginBottom: "2rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <span className="editorial-stamp">
                <Zap size={14} fill="#000000" />
                GAMIFIED DSA ARENA
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  color: "var(--text-primary)",
                  fontWeight: 800,
                  background: "var(--bg-surface)",
                  padding: "0.35rem 0.75rem",
                  border: "2px solid var(--border-neo-strong)",
                  borderRadius: "4px",
                  boxShadow: "2px 2px 0px var(--shadow-neo)",
                }}
              >
                191 SDE SHEET ROADMAP
              </span>
            </div>

            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                color: "var(--text-primary)",
                fontWeight: 800,
                background: "var(--bg-surface)",
                padding: "0.35rem 0.75rem",
                border: "2px solid var(--border-neo-strong)",
                borderRadius: "4px",
                boxShadow: "2px 2px 0px var(--shadow-neo)",
              }}
            >
              DAILY CADENCE: <strong style={{ color: "var(--accent-vermillion)" }}>03 MISSIONS / 24H</strong>
            </div>
          </div>

          {/* AUTHENTIC NEO-BRUTALIST HERO BANNER (Clean, Raw, High-Impact - No Fake OS Chrome) */}
          <div className="neo-hero-card" style={{ marginBottom: "3rem" }}>
            {/* Kicker */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div className="pixel-kicker">
                // CODERIFT DISCIPLINE · 3 QUESTIONS EVERY 24 HOURS
              </div>
            </div>

            {/* Pixel Headline */}
            <div style={{ marginBottom: "2rem" }}>
              <h1
                className="display-pixel"
                style={{
                  marginBottom: "0.4rem",
                }}
              >
                191 PROBLEMS.
              </h1>
              <div
                className="font-pixel"
                style={{
                  fontSize: "clamp(1.8rem, 4.8vw, 3.8rem)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  letterSpacing: "0.02em",
                  lineHeight: 1.1,
                }}
              >
                THREE EVERY SINGLE DAY.
              </div>
            </div>

            {/* Grid Split: Intro & Hardware Card */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
                gap: "2.5rem",
                alignItems: "center",
                borderTop: "3px solid var(--border-neo-strong)",
                paddingTop: "2rem",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "1.15rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.65,
                    marginBottom: "1.75rem",
                    fontWeight: 500,
                  }}
                >
                  Stop staring at an intimidating 191-problem mountain. We break it down into 3 manageable challenges every 24 hours. Solve authentically on LeetCode & GFG, maintain daily streaks, and conquer private squad leaderboards with your friends.
                </p>

                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  <Link
                    href={user ? "/dashboard" : "/login"}
                    className="btn-editorial-primary"
                    style={{ fontSize: "1rem", padding: "0.95rem 2rem" }}
                  >
                    GET IN TO ARENA →
                  </Link>

                  <Link
                    href={user ? "/groups" : "/login"}
                    className="btn-editorial-outline"
                    style={{ fontSize: "0.95rem", padding: "0.95rem 1.8rem" }}
                  >
                    JOIN A SQUAD
                  </Link>
                </div>
              </div>

              {/* High-Voltage Neo-Brutalist Telemetry Box */}
              <div
                style={{
                  background: "var(--bg-card)",
                  border: "3px solid var(--border-neo-strong)",
                  borderRadius: "6px",
                  padding: "1.75rem",
                  boxShadow: "5px 5px 0px var(--shadow-neo)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1.25rem",
                    borderBottom: "2px solid var(--border-neo-strong)",
                    paddingBottom: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Cpu size={18} color="var(--accent-purple)" />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", fontWeight: 800, letterSpacing: "0.08em", color: "var(--text-primary)" }}>
                      TELEMETRY ENGINE
                    </span>
                  </div>
                  <span className="badge-diff-easy">
                    ONLINE
                  </span>
                </div>

                {/* Processing Unit Screen */}
                <div
                  style={{
                    background: "var(--bg-paper)",
                    border: "2px solid var(--border-neo-strong)",
                    borderRadius: "4px",
                    padding: "1rem",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    marginBottom: "1.25rem",
                    boxShadow: "2px 2px 0px var(--shadow-neo)",
                  }}
                >
                  <div style={{ color: "var(--accent-acid)", fontWeight: 800, marginBottom: "0.35rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Check size={16} /> BATCH STATUS: 3/3 QUESTIONS READY
                  </div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                    GRAPHQL SYNC: LEETCODE + GFG VERIFIED
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", textAlign: "center" }}>
                  <div
                    style={{
                      padding: "0.85rem",
                      background: "var(--bg-surface)",
                      border: "2px solid var(--border-neo-strong)",
                      borderRadius: "4px",
                      boxShadow: "3px 3px 0px var(--shadow-neo)",
                    }}
                  >
                    <div className="font-pixel" style={{ fontSize: "1.8rem", color: "var(--accent-purple)", fontWeight: 700 }}>
                      191
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 800 }}>
                      CURATED PROBLEMS
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "0.85rem",
                      background: "var(--bg-surface)",
                      border: "2px solid var(--border-neo-strong)",
                      borderRadius: "4px",
                      boxShadow: "3px 3px 0px var(--shadow-neo)",
                    }}
                  >
                    <div className="font-pixel" style={{ fontSize: "1.8rem", color: "var(--accent-vermillion)", fontWeight: 700 }}>
                      24H
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 800 }}>
                      RESET ROTATION
                    </div>
                  </div>
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
                padding: "2.25rem 2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Flame size={20} style={{ color: "var(--accent-purple)" }} />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      color: "var(--accent-purple)",
                      fontWeight: 900,
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
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                  }}
                >
                  Never 191. Only 3.
                </h3>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.65 }}>
                  191 problems is intimidating. 3 problems is achievable every single day. By focusing strictly on today's batch, you eliminate burnout and build compound consistency.
                </p>
              </div>
            </div>

            {/* Block 2: Real LeetCode Environment */}
            <div
              className="editorial-card"
              style={{
                padding: "2.25rem 2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <ExternalLink size={20} style={{ color: "var(--accent-vermillion)" }} />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      color: "var(--accent-vermillion)",
                      fontWeight: 900,
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
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                  }}
                >
                  Solve on LeetCode & GFG.
                </h3>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.65 }}>
                  No artificial in-browser code editor toys. Open the authentic LeetCode problem, submit your solution, and verify seamlessly. Our backend verifies your accepted submission in real-time.
                </p>
              </div>
            </div>

            {/* Block 3: Private Social Squads */}
            <div
              className="editorial-card"
              style={{
                padding: "2.25rem 2rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <Users size={20} style={{ color: "var(--accent-acid)" }} />
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      color: "var(--accent-acid)",
                      fontWeight: 900,
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
                    fontWeight: 900,
                    color: "var(--text-primary)",
                    marginBottom: "0.75rem",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                  }}
                >
                  Compete with Friends.
                </h3>

                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.65 }}>
                  Compete strictly with friends you invite. Track who solved today's 3, battle for the weekly #1 crown, and receive live updates when squad members pass your rank.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE 191 STRIVER SHEET DISCIPLINE SECTION */}
      <section style={{ padding: "3rem 0 4rem" }}>
        <div className="app-container">
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "3rem",
              alignItems: "center",
            }}
          >
            <div>
              <span className="editorial-stamp" style={{ marginBottom: "1.25rem" }}>
                CURATED ARCHIVE SPECIFICATION
              </span>

              <h2
                className="font-pixel"
                style={{
                  fontSize: "clamp(2rem, 4.5vw, 3.2rem)",
                  lineHeight: 1.05,
                  color: "var(--text-primary)",
                  marginBottom: "1.5rem",
                }}
              >
                STRICTLY THE APPROVED 191 SDE SHEET.
              </h2>

              <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.7, marginBottom: "2rem" }}>
                No randomly generated filler. Exactly the 191 battle-tested interview problems across Arrays, Linked Lists, Trees, Dynamic Programming, and Graphs.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--text-primary)", fontWeight: 700 }}>
                  <Check size={18} style={{ color: "var(--accent-acid)" }} /> 27 Core SDE Sheet Interview Categories
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--text-primary)", fontWeight: 700 }}>
                  <Check size={18} style={{ color: "var(--accent-acid)" }} /> Streak Shields Protection against Burnout
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--text-primary)", fontWeight: 700 }}>
                  <Check size={18} style={{ color: "var(--accent-acid)" }} /> Automatic Telemetry & Server-Verified XP
                </div>
              </div>
            </div>

            {/* Visual Neo-Brutalist Telemetry Card */}
            <div
              className="neo-card"
              style={{
                background: "var(--bg-surface)",
                padding: "2.75rem 2.25rem",
                boxShadow: "8px 8px 0px var(--shadow-neo)",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1rem", fontWeight: 800 }}>
                ARENA HABIT TELEMETRY // 24H CYCLE
              </div>

              <div
                className="font-pixel"
                style={{
                  fontSize: "4.5rem",
                  lineHeight: 0.9,
                  color: "var(--accent-purple)",
                  marginBottom: "0.5rem",
                }}
              >
                03 / 03
              </div>

              <div className="font-grotesk" style={{ fontSize: "1.3rem", fontWeight: 900, textTransform: "uppercase", color: "var(--accent-acid)", marginBottom: "1.5rem" }}>
                TODAY'S MISSION COMPLETE.
              </div>

              <div className="editorial-rule" />

              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                <span style={{ color: "var(--text-muted)" }}>STREAK ENGINE:</span>
                <span style={{ color: "var(--accent-vermillion)", fontWeight: 900 }}>ACTIVE • SHIELDED</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FINAL CALL TO ACTION */}
      <section style={{ padding: "4rem 0 5rem", textAlign: "center" }}>
        <div className="app-container" style={{ maxWidth: "780px" }}>
          <h2
            className="font-pixel"
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
              lineHeight: 1.05,
              color: "var(--accent-purple)",
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
            style={{ fontSize: "1.05rem", padding: "1.1rem 2.8rem" }}
          >
            GET IN TO ARENA →
          </Link>
        </div>
      </section>
    </div>
  );
}
