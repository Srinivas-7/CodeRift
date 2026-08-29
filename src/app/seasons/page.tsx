import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import { Trophy, Calendar, Sparkles, Award } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SeasonsPage() {
  const user = await getCurrentUser();
  let currentSeason: any = null;
  try {
    currentSeason = await db.season.findFirst({
      where: { isActive: true },
    });
  } catch (err) {
    console.error("Seasons fetch error:", err);
  }

  return (
    <div className="app-container" style={{ padding: "3rem 1.5rem 6rem", maxWidth: "1100px" }}>
      {/* Top Header */}
      <div
        style={{
          paddingBottom: "1.5rem",
          borderBottom: "1px solid var(--border-editorial)",
          marginBottom: "3rem",
        }}
      >
        <span className="editorial-stamp" style={{ borderColor: "var(--accent-cobalt)", color: "#FFF", marginBottom: "0.5rem" }}>
          COMPETITIVE CYCLES // 3-MONTH CADENCE
        </span>
        <h1
          className="font-grotesk"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            textTransform: "uppercase",
            lineHeight: 0.95,
            letterSpacing: "-0.03em",
          }}
        >
          SEASONS ARCHIVE.
        </h1>
      </div>

      {/* Active Season Banner */}
      {currentSeason && (
        <div
          className="editorial-card"
          style={{
            padding: "3rem",
            background: "var(--bg-surface)",
            border: "2px solid var(--accent-cobalt)",
            borderRadius: "4px",
            boxShadow: "16px 16px 0px rgba(33, 72, 255, 0.2)",
            marginBottom: "3.5rem",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <span className="editorial-stamp" style={{ borderColor: "var(--accent-acid)", color: "var(--accent-acid)", marginBottom: "0.5rem" }}>
                CURRENT ACTIVE SEASON
              </span>
              <h2 className="font-grotesk" style={{ fontSize: "2.4rem", textTransform: "uppercase", color: "#FFF" }}>
                {currentSeason.name}
              </h2>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", textAlign: "right" }}>
              <div>CYCLE: {new Date(currentSeason.startDate).toLocaleDateString()} — {new Date(currentSeason.endDate).toLocaleDateString()}</div>
            </div>
          </div>

          <p style={{ color: "var(--text-secondary)", fontSize: "1.05rem", lineHeight: 1.6, maxWidth: "680px", marginBottom: "2rem" }}>
            Season 01 introduces the 191 SDE Roadmap, squad leaderboards, and streak protection mechanics.
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link href="/leaderboard" className="btn-editorial-primary">
              VIEW SEASON STANDINGS →
            </Link>
            <Link href="/dashboard" className="btn-editorial-outline">
              SOLVE TODAY'S 3
            </Link>
          </div>
        </div>
      )}

      {/* Season History Note */}
      <div className="editorial-card" style={{ padding: "2.5rem", textAlign: "center" }}>
        <h3 className="font-grotesk" style={{ fontSize: "1.3rem", textTransform: "uppercase", color: "#FFF", marginBottom: "0.5rem" }}>
          PREVIOUS SEASONS
        </h3>
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>
          DSA Arena is currently in Season 01. Previous season archives will appear here once Season 01 concludes.
        </p>
      </div>
    </div>
  );
}
