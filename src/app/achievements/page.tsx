import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Award, Trophy, Sparkles, CheckCircle2, Lock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AchievementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  let allAchievements: any[] = [];
  let userAchievements: any[] = [];

  try {
    const [achs, userAchs] = await Promise.all([
      db.achievement.findMany({
        orderBy: { xpReward: "asc" },
      }),
      db.userAchievement.findMany({
        where: { userId: user.id },
        select: { achievementId: true, unlockedAt: true },
      }),
    ]);
    allAchievements = achs;
    userAchievements = userAchs;
  } catch (err) {
    console.error("Achievements fetch error:", err);
  }

  const unlockedMap = new Map(
    userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt])
  );

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
          ARCHIVE HONORS // MASTERY BADGES
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
          ACHIEVEMENT ROOM.
        </h1>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
          {unlockedMap.size} OF {allAchievements.length} BADGES UNLOCKED
        </div>
      </div>

      {/* Badges Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
          gap: "1.5rem",
        }}
      >
        {allAchievements.map((ach) => {
          const isUnlocked = unlockedMap.has(ach.id);

          return (
            <div
              key={ach.id}
              className="editorial-card"
              style={{
                padding: "2rem",
                background: isUnlocked ? "var(--bg-surface)" : "rgba(10, 11, 16, 0.4)",
                border: isUnlocked ? "1px solid var(--border-editorial-strong)" : "1px solid rgba(245, 242, 235, 0.05)",
                opacity: isUnlocked ? 1 : 0.6,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "2.4rem" }}>{ach.icon}</div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: isUnlocked ? "var(--accent-acid)" : "var(--text-muted)",
                      border: "1px solid var(--border-editorial)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "2px",
                    }}
                  >
                    {isUnlocked ? "UNLOCKED" : "LOCKED"}
                  </span>
                </div>

                <h3 className="font-grotesk" style={{ fontSize: "1.25rem", textTransform: "uppercase", color: "#FFF", marginBottom: "0.4rem" }}>
                  {ach.name}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
                  {ach.description}
                </p>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-editorial)",
                  paddingTop: "0.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                }}
              >
                <span style={{ color: "var(--text-muted)" }}>REWARD:</span>
                <strong style={{ color: "var(--accent-amber)" }}>+{ach.xpReward} PTS</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
