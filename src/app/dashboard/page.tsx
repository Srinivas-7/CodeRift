import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getOrCreateDailyChallenge } from "@/lib/daily-challenge";
import { db } from "@/lib/db";
import Link from "next/link";
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
  ]);

  let groupLeaderboard: any[] = [];
  let userRankInGroup = 1;

  if (primaryMembership) {
    const allMembers = primaryMembership.group.members;
    groupLeaderboard = [...allMembers].sort((a, b) => b.user.xp - a.user.xp);
    userRankInGroup = groupLeaderboard.findIndex((m) => m.userId === user.id) + 1;
  }

  const todayXpGained = todayTransactions.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
  const yesterdayXpGained = yesterdayTransactions.reduce((acc: number, t: any) => acc + (t.amount || 0), 0);
  const isImproved = todayXpGained >= yesterdayXpGained;
  const roadmapPercent = Math.round((totalSolvedCount / 191) * 100);

  return (
    <div className="app-container" style={{ padding: "3rem 1.5rem 6rem" }}>
      {/* 1. TOP EDITORIAL MASTHEAD STRIP */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "1.5rem",
          paddingBottom: "1.5rem",
          borderBottom: "1px solid var(--border-editorial)",
          marginBottom: "3rem",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              color: "var(--accent-cobalt)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: "0.3rem",
            }}
          >
            DAILY ISSUE // 24-HOUR RUN
          </div>
          <h1
            className="font-grotesk"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              textTransform: "uppercase",
              lineHeight: 1,
              letterSpacing: "-0.03em",
            }}
          >
            WELCOME, {user.username}.
          </h1>
        </div>

        {/* Minimalist Stat Stamps */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <div
            style={{
              border: "1px solid var(--border-editorial)",
              padding: "0.65rem 1.25rem",
              borderRadius: "2px",
              background: "var(--bg-surface)",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Current Streak
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-vermillion)" }}>
              🔥 {user.currentStreak} DAYS
            </div>
          </div>

          <div
            style={{
              border: "1px solid var(--border-editorial)",
              padding: "0.65rem 1.25rem",
              borderRadius: "2px",
              background: "var(--bg-surface)",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Streak Shields
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 800, color: "var(--accent-acid)" }}>
              {user.streakShields} / 3
            </div>
          </div>
        </div>
      </div>

      {/* 2. RIVALRY NOTIFICATION BANNER (if any) */}
      {notifications.length > 0 && notifications[0].type === "OVERTAKEN" && (
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--accent-vermillion)",
            borderRadius: "4px",
            padding: "1.25rem 1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "3rem",
          }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-grotesk)", fontWeight: 800, color: "#FFF", fontSize: "1.1rem" }}>
              {notifications[0].message}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Solve today's 3 on LeetCode to take back your standing!
            </div>
          </div>
          <Link
            href={notifications[0].link || "/groups"}
            className="btn-editorial-vermillion"
            style={{ fontSize: "0.85rem", padding: "0.6rem 1.25rem" }}
          >
            TAKE BACK STANDING →
          </Link>
        </div>
      )}

      {/* 3. TODAY'S 3 MISSION (DOMINANT EDITORIAL SECTION) */}
      <div style={{ marginBottom: "4rem" }}>
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <div>
            <span className="editorial-stamp" style={{ borderColor: "var(--accent-cobalt)", color: "#FFF", marginBottom: "0.5rem" }}>
              SDE SHEET DAY {dailyData.dayNumber ? dailyData.dayNumber.toString().padStart(2, "0") : "01"} // EXACT SEQUENCE
            </span>
            <h2
              className="font-grotesk"
              style={{
                fontSize: "clamp(2rem, 5vw, 3rem)",
                textTransform: "uppercase",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              TODAY'S THREE.
            </h2>
          </div>

          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "1.2rem",
              fontWeight: 800,
              color: dailyData.isComplete ? "var(--accent-acid)" : "var(--accent-cobalt)",
            }}
          >
            {dailyData.solvedCount} / 03 COMPLETED {dailyData.isComplete && "🎉"}
          </div>
        </div>

        {/* 3 Problems Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {dailyData.problems.map((prob, idx) => {
            const isDone = prob.isSolved;
            const xpReward =
              prob.difficulty === "Easy"
                ? 100
                : prob.difficulty === "Hard"
                ? 300
                : 200;

            return (
              <div
                key={prob.id}
                className="editorial-card"
                style={{
                  padding: "2rem",
                  background: isDone ? "rgba(16, 185, 129, 0.04)" : "var(--bg-surface)",
                  border: isDone
                    ? "1px solid rgba(16, 185, 129, 0.4)"
                    : "1px solid var(--border-editorial)",
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
                        fontSize: "0.85rem",
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
                      {prob.difficulty} (+{xpReward} XP)
                    </span>
                  </div>

                  <h3
                    className="font-serif"
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: 400,
                      color: isDone ? "var(--accent-acid)" : "#FFFFFF",
                      marginBottom: "0.4rem",
                      lineHeight: 1.2,
                    }}
                  >
                    {prob.title}
                  </h3>

                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      marginBottom: "2rem",
                    }}
                  >
                    CATEGORY: <strong style={{ color: "var(--text-secondary)" }}>{prob.category}</strong>
                  </div>
                </div>

                {/* Actions: Solve on LeetCode & Verify */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    borderTop: "1px solid var(--border-editorial)",
                    paddingTop: "1.25rem",
                  }}
                >
                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <a
                      href={prob.leetcodeUrl || `https://leetcode.com/problemset/all/?search=${encodeURIComponent(prob.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-leetcode"
                      style={{ flex: 1, textAlign: "center" }}
                    >
                      SOLVE ON LEETCODE ↗
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
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "2rem",
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
            <h3 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "#FFF" }}>
              {primaryMembership ? primaryMembership.group.name : "SQUAD STANDINGS"}
            </h3>
            <Link
              href="/groups"
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-cobalt)",
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
              }}
            >
              ALL SQUADS →
            </Link>
          </div>

          {primaryMembership ? (
            <div>
              <div
                style={{
                  border: "1px solid var(--border-editorial)",
                  background: "var(--bg-card)",
                  padding: "1rem",
                  borderRadius: "2px",
                  marginBottom: "1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Your Standing
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 900, color: userRankInGroup === 1 ? "var(--accent-amber)" : "#FFF" }}>
                    #{userRankInGroup}{" "}
                    <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      of {primaryMembership.group.members.length} members
                    </span>
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 800, fontSize: "1.2rem", color: "var(--text-primary)" }}>
                  {user.xp.toLocaleString()} XP
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
                      padding: "0.5rem 0.75rem",
                      background: m.userId === user.id ? "rgba(33, 72, 255, 0.15)" : "transparent",
                      borderBottom: "1px solid var(--border-editorial)",
                      fontSize: "0.85rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--text-muted)" }}>
                        0{idx + 1}
                      </span>
                      <span style={{ fontWeight: 700, color: m.userId === user.id ? "#FFF" : "var(--text-secondary)" }}>
                        {m.user.username} {m.userId === user.id && "(You)"}
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {m.user.xp.toLocaleString()} XP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
              <h4 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "#FFF", marginBottom: "0.4rem" }}>
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
            <h3 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "#FFF" }}>
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
                border: "1px solid var(--border-editorial)",
                background: "var(--bg-card)",
                padding: "1rem",
                borderRadius: "2px",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Yesterday
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 800, color: "#FFF", margin: "0.3rem 0" }}>
                {yesterdayXpGained} XP
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Streak: {Math.max(0, user.currentStreak - 1)}D
              </div>
            </div>

            <div
              style={{
                border: "1px solid var(--accent-cobalt)",
                background: "rgba(33, 72, 255, 0.08)",
                padding: "1rem",
                borderRadius: "2px",
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--accent-cobalt)", textTransform: "uppercase", fontWeight: 700 }}>
                Today
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.4rem", fontWeight: 800, color: "#FFF", margin: "0.3rem 0" }}>
                {todayXpGained} XP
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--accent-acid)", fontWeight: 700 }}>
                {dailyData.solvedCount} / 3 Solved
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
            <h3 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "#FFF" }}>
              191 SDE ROADMAP
            </h3>
            <Link
              href="/problems"
              style={{
                fontSize: "0.75rem",
                color: "var(--accent-cobalt)",
                textDecoration: "none",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
              }}
            >
              CATALOG →
            </Link>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span className="font-serif" style={{ fontSize: "2rem", lineHeight: 1, color: "#FFF" }}>
                {totalSolvedCount} <span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>/ 191</span>
              </span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cobalt)", fontWeight: 800 }}>
                {roadmapPercent}%
              </span>
            </div>

            <div className="progress-bar-bg">
              <div className="progress-bar-fill-cobalt" style={{ width: `${roadmapPercent}%` }} />
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
