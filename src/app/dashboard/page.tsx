import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateDailyChallenge } from "@/lib/daily-challenge";
import { compareLeaderboardRank } from "@/lib/scoring";
import { getUtcDateStr, getPastDateStr } from "@/lib/streaks";
import { db } from "@/lib/db";
import { getProblemPlatformInfo } from "@/lib/platform";
import Link from "next/link";
import { DailyResetCountdown } from "@/components/dashboard/DailyResetCountdown";
import {
  Flame,
  Shield,
  Trophy,
  Zap,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Check,
  Sparkles,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const todayStr = getUtcDateStr();
  const yesterdayStr = getPastDateStr(todayStr, 1);

  const todayMidnight = new Date(new Date().setHours(0, 0, 0, 0));
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayMidnight = new Date(new Date(yesterday).setHours(0, 0, 0, 0));

  // Run all database fetches concurrently in parallel
  const [
    dailyData,
    primaryMembership,
    todayTransactions,
    yesterdayTransactions,
    totalSolvedCount,
    notifications,
    yesterdayRecord,
    todayRecord,
  ] = await Promise.all([
    getOrCreateDailyChallenge(user.id),
    db.groupMember.findFirst({
      where: { userId: user.id },
      include: {
        group: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    }),
    db.xpTransaction.findMany({
      where: {
        userId: user.id,
        createdAt: { gte: todayMidnight },
      },
    }),
    db.xpTransaction.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: yesterdayMidnight,
          lt: todayMidnight,
        },
      },
    }),
    db.userProblemStatus.count({
      where: {
        userId: user.id,
        status: { in: ["SOLVED", "OPTIMAL"] },
      },
    }),
    db.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    db.streakRecord.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: yesterdayStr,
        },
      },
    }),
    db.streakRecord.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: todayStr,
        },
      },
    }),
  ]);

  let groupLeaderboard: any[] = [];
  let userRankInGroup = 1;

  if (primaryMembership?.group?.members) {
    const allMembers = primaryMembership.group.members || [];
    groupLeaderboard = [...allMembers].sort((a, b) => compareLeaderboardRank(a?.user, b?.user));
    userRankInGroup = groupLeaderboard.findIndex((m) => m.userId === user.id) + 1;
  }

  // Validate rivalry notifications against active squad memberships
  let validOvertakenNotification: any = null;
  for (const notif of notifications) {
    if (notif.type === "OVERTAKEN") {
      const groupId = notif.link?.replace("/groups/", "")?.trim();
      if (groupId) {
        let isMember = false;
        if (primaryMembership?.groupId === groupId && primaryMembership?.group) {
          isMember = true;
        } else {
          const gm = await db.groupMember.findFirst({
            where: { userId: user.id, groupId },
            include: { group: true },
          });
          if (gm?.group) {
            isMember = true;
          }
        }

        if (isMember) {
          validOvertakenNotification = notif;
          break;
        } else {
          // Group is disbanded or user is no longer a member - purge stale notification
          try {
            await db.notification.delete({ where: { id: notif.id } });
          } catch {}
        }
      }
    }
  }

  const todayXpGained = todayTransactions.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
  const yesterdayXpGained = yesterdayTransactions.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
  const isImproved = todayXpGained >= yesterdayXpGained;
  const roadmapPercent = Math.round((totalSolvedCount / 191) * 100);

  return (
    <div className="app-container" style={{ padding: "3rem 1.5rem 6rem" }}>
      {/* 1. TOP MASTHEAD STRIP */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1.5rem",
          paddingBottom: "1.5rem",
          borderBottom: "2px solid var(--border-editorial)",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <div className="pixel-kicker" style={{ marginBottom: "0.4rem" }}>
            // DAILY ISSUE · 24-HOUR ARENA RUN
          </div>
          <h1
            className="font-pixel"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              textTransform: "uppercase",
              lineHeight: 1,
              color: "var(--text-primary)",
            }}
          >
            WELCOME, {user.username}.
          </h1>
        </div>

        {/* Minimalist Neo-Brutalist Stat Stamps */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div
            style={{
              border: "2px solid var(--border-neo-strong)",
              padding: "0.65rem 1.25rem",
              borderRadius: "6px",
              background: "var(--bg-surface)",
              boxShadow: "3px 3px 0px var(--shadow-neo)",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Current Streak
            </div>
            <div style={{ fontFamily: "var(--font-pixel)", fontSize: "1.3rem", fontWeight: 700, color: "var(--accent-vermillion)" }}>
              🔥 {user.currentStreak} DAYS
            </div>
          </div>

          <div
            style={{
              border: "2px solid var(--border-neo-strong)",
              padding: "0.65rem 1.25rem",
              borderRadius: "6px",
              background: "var(--bg-surface)",
              boxShadow: "3px 3px 0px var(--shadow-neo)",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Streak Shields
            </div>
            <div style={{ fontFamily: "var(--font-pixel)", fontSize: "1.3rem", fontWeight: 700, color: "var(--accent-acid)" }}>
              🛡️ {user.streakShields} / 3
            </div>
          </div>
        </div>
      </div>

      {/* 2. RIVALRY NOTIFICATION BANNER (if any) */}
      {validOvertakenNotification && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "2px solid var(--accent-vermillion)",
            borderRadius: "8px",
            boxShadow: "4px 4px 0px var(--shadow-neo)",
            padding: "1.25rem 1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-grotesk)", fontWeight: 800, color: "var(--text-primary)", fontSize: "1.1rem" }}>
              {validOvertakenNotification.message}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Solve today's 3 on LeetCode to take back your standing!
            </div>
          </div>
          <Link
            href={validOvertakenNotification.link || "/groups"}
            className="btn-editorial-vermillion"
            style={{ fontSize: "0.85rem", padding: "0.6rem 1.25rem" }}
          >
            TAKE BACK STANDING →
          </Link>
        </div>
      )}

      {/* 3. TODAY'S 3 MISSION (DOMINANT SECTION) */}
      <div style={{ marginBottom: "3.5rem" }}>
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <span className="editorial-stamp" style={{ marginBottom: "0.6rem" }}>
              {dailyData.phase ? `PHASE ${dailyData.phase} // DAY ${(dailyData.phaseDay || 1).toString().padStart(2, "0")} OF 32` : `SDE SHEET DAY ${(dailyData.dayNumber || 1).toString().padStart(2, "0")}`} // EXACT SEQUENCE
            </span>
            <h2
              className="font-pixel"
              style={{
                fontSize: "clamp(2rem, 5vw, 2.8rem)",
                textTransform: "uppercase",
                lineHeight: 1,
                color: "var(--accent-purple)",
              }}
            >
              TODAY'S THREE.
            </h2>
          </div>

          <div
            style={{
              fontFamily: "var(--font-pixel)",
              fontSize: "1.3rem",
              fontWeight: 700,
              color: dailyData.isComplete ? "var(--accent-acid)" : "var(--accent-purple)",
            }}
          >
            {dailyData.solvedCount} / {dailyData.totalCount ? dailyData.totalCount.toString().padStart(2, "0") : "03"} COMPLETED {dailyData.isComplete && "🎉"}
          </div>
        </div>

        {/* Live Daily Reset Timer & Status Banner */}
        <DailyResetCountdown
          nextResetIso={dailyData.nextResetIso}
          isComplete={dailyData.isComplete}
          dayNumber={dailyData.dayNumber || 1}
          solvedCount={dailyData.solvedCount || 0}
          totalCount={dailyData.totalCount || 3}
        />

        {/* 3 Problems Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
            gap: "1.5rem",
          }}
        >
          {dailyData.problems.length === 0 ? (
            <div
              className="editorial-card"
              style={{
                gridColumn: "1 / -1",
                padding: "2.5rem",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--accent-acid)", fontWeight: 800, marginBottom: "0.5rem" }}>
                COMPETITION CONCLUDED // ALL 191 SDE SHEET PROBLEMS DISPATCHED
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", maxWidth: "600px", margin: "0 auto" }}>
                You have completed the 64-day competition roadmap. Practice existing problems or check the squad leaderboard.
              </p>
            </div>
          ) : dailyData.problems.map((prob, idx) => {
            const isDone = prob.isSolved;
            const pointReward =
              prob.difficulty === "Easy"
                ? 10
                : prob.difficulty === "Hard"
                ? 30
                : 20;

            return (
              <div
                key={prob.id}
                className="editorial-card"
                style={{
                  padding: "1.75rem",
                  background: isDone ? "rgba(16, 185, 129, 0.08)" : "var(--bg-surface)",
                  borderColor: isDone ? "rgba(16, 185, 129, 0.6)" : "var(--border-neo-strong)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        fontWeight: 800,
                      }}
                    >
                      [N° 0{idx + 1} / SDE #{prob.orderInSheet}]
                    </span>
                    <span
                      className={
                        prob.difficulty === "Easy"
                          ? "badge-diff-easy"
                          : prob.difficulty === "Hard"
                          ? "badge-diff-hard"
                          : "badge-diff-medium"
                      }
                    >
                      {prob.difficulty} (+{pointReward} PTS)
                    </span>
                  </div>

                  <h3
                    className="font-grotesk"
                    style={{
                      fontSize: "1.45rem",
                      fontWeight: 800,
                      color: isDone ? "var(--accent-acid)" : "var(--text-primary)",
                      marginBottom: "0.4rem",
                      lineHeight: 1.25,
                    }}
                  >
                    {prob.title}
                  </h3>

                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      marginBottom: "1.75rem",
                    }}
                  >
                    CATEGORY: <strong style={{ color: "var(--text-secondary)" }}>{prob.category}</strong>
                  </div>
                </div>

                {/* Actions: Solve on LeetCode / GFG & Verify */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    borderTop: "1px solid var(--border-editorial)",
                    paddingTop: "1.25rem",
                  }}
                >
                  {(() => {
                    const platformInfo = getProblemPlatformInfo(prob.leetcodeUrl);
                    const defaultUrl =
                      platformInfo.platform === "GFG"
                        ? `https://www.geeksforgeeks.org/problems/${encodeURIComponent(prob.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}/1`
                        : `https://leetcode.com/problemset/all/?search=${encodeURIComponent(prob.title)}`;
                    return (
                      <div style={{ display: "flex", gap: "0.6rem" }}>
                        <a
                          href={prob.leetcodeUrl || defaultUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={platformInfo.btnClassName}
                          style={{ flex: 1, textAlign: "center" }}
                        >
                          {platformInfo.solveButtonText}
                        </a>

                        <Link
                          href={`/problems/${prob.id}`}
                          className="btn-editorial-outline"
                          style={{
                            padding: "0.6rem 0.9rem",
                            color: isDone ? "var(--accent-acid)" : "var(--text-primary)",
                          }}
                        >
                          {isDone ? "✓ Cleared" : "Verify →"}
                        </Link>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. THREE-COLUMN EDITORIAL ROSTER (Squad Standings | You vs Yesterday | 191 Roadmap) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "1.75rem",
        }}
      >
        {/* Col 1: Squad Standings */}
        <div className="editorial-card" style={{ padding: "2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "var(--text-primary)", fontWeight: 800 }}>
              {primaryMembership ? primaryMembership.group.name : "SQUAD STANDINGS"}
            </h3>
            <Link
              href="/groups"
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-purple)",
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
              }}
            >
              ALL SQUADS →
            </Link>
          </div>

          {primaryMembership ? (
            <div>
              <div
                style={{
                  border: "2px solid var(--border-neo-strong)",
                  background: "var(--bg-card)",
                  padding: "1rem",
                  borderRadius: "6px",
                  marginBottom: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  boxShadow: "2px 2px 0px var(--shadow-neo)",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Your Standing
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 900, color: userRankInGroup === 1 ? "var(--accent-amber)" : "var(--text-primary)" }}>
                    #{userRankInGroup}{" "}
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      of {primaryMembership.group.members.length} members
                    </span>
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-pixel)", fontWeight: 700, fontSize: "1.2rem", color: "var(--accent-purple)" }}>
                  {((user.score ?? user.xp) || 0).toLocaleString()} PTS
                </div>
              </div>

              {/* Mini Roster */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {groupLeaderboard.slice(0, 3).map((m, idx) => (
                  <div
                    key={m.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "0.6rem 0.75rem",
                      background: m.userId === user.id ? "var(--accent-purple-subtle)" : "transparent",
                      borderRadius: "4px",
                      borderBottom: "1px solid var(--border-editorial)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--text-muted)" }}>
                        0{idx + 1}
                      </span>
                      <span style={{ fontWeight: 700, color: m.userId === user.id ? "var(--accent-purple)" : "var(--text-primary)" }}>
                        {m.user.username} {m.userId === user.id && "(You)"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 700 }}>
                      {((m.user?.score ?? m.user?.xp) || 0).toLocaleString()} PTS
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <h4 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "var(--text-primary)", fontWeight: 800, marginBottom: "0.4rem" }}>
                YOU'RE SOLO.
              </h4>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                Create a squad or enter an invite code to start competing with friends.
              </p>
              <Link href="/groups" className="btn-editorial-primary" style={{ fontSize: "0.8rem", padding: "0.6rem 1.2rem" }}>
                CREATE SQUAD
              </Link>
            </div>
          )}
        </div>

        {/* Col 2: You vs Yesterday */}
        <div className="editorial-card" style={{ padding: "2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "var(--text-primary)", fontWeight: 800 }}>
              YOU VS YESTERDAY
            </h3>
            <span className={isImproved ? "badge-rank-up" : "badge-rank-same"}>
              {isImproved ? "↑ IMPROVED" : "= ON TRACK"}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                border: "2px solid var(--border-neo-strong)",
                background: "var(--bg-card)",
                padding: "1rem",
                borderRadius: "6px",
                textAlign: "center",
                boxShadow: "2px 2px 0px var(--shadow-neo)",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Yesterday
              </div>
              <div style={{ fontFamily: "var(--font-pixel)", fontSize: "1.3rem", fontWeight: 700, color: "var(--text-primary)", margin: "0.3rem 0" }}>
                {yesterdayXpGained} PTS
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {yesterdayRecord?.solvedCount ? `🔥 ${yesterdayRecord.solvedCount} Solved` : (yesterdayRecord?.shieldUsed ? `🛡️ Shield Used` : `0 Solved`)}
              </div>
            </div>

            <div
              style={{
                border: "2px solid var(--accent-purple)",
                background: "var(--accent-purple-subtle)",
                padding: "1rem",
                borderRadius: "6px",
                textAlign: "center",
                boxShadow: "2px 2px 0px var(--shadow-neo)",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--accent-purple)", textTransform: "uppercase", fontWeight: 800 }}>
                Today
              </div>
              <div style={{ fontFamily: "var(--font-pixel)", fontSize: "1.3rem", fontWeight: 700, color: "var(--accent-purple)", margin: "0.3rem 0" }}>
                {todayXpGained} PTS
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--accent-acid)", fontWeight: 700 }}>
                {todayRecord?.solvedCount ? `🔥 ${todayRecord.solvedCount} Solved` : `${dailyData.solvedCount} / ${dailyData.totalCount ?? 3} Solved`}
              </div>
            </div>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.6 }}>
            Personal consistency is the ultimate metric. Every solved problem brings you closer to SDE sheet mastery.
          </p>
        </div>

        {/* Col 3: 191 Roadmap Progression */}
        <div className="editorial-card" style={{ padding: "2rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <h3 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "var(--text-primary)", fontWeight: 800 }}>
              191 SDE ROADMAP
            </h3>
            <Link
              href="/problems"
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-purple)",
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
                fontWeight: 800,
              }}
            >
              CATALOG →
            </Link>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span className="font-pixel" style={{ fontSize: "1.8rem", lineHeight: 1, color: "var(--text-primary)" }}>
                {totalSolvedCount} <span style={{ fontSize: "1.1rem", color: "var(--text-muted)" }}>/ 191</span>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-purple)", fontWeight: 800 }}>
                {roadmapPercent}%
              </span>
            </div>

            <div className="progress-bar-bg">
              <div className="progress-bar-fill-purple" style={{ width: `${roadmapPercent}%` }} />
            </div>
          </div>

          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", lineHeight: 1.6 }}>
            Categorized across the 27 official Striver SDE Sheet topics. Continue solving your daily 3.
          </p>
        </div>
      </div>
    </div>
  );
}
