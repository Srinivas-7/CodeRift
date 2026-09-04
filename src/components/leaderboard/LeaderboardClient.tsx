"use client";

import { useState } from "react";
import { getAvatar } from "@/data/avatars";
import Link from "next/link";
import { Users, Globe, ArrowUp, ArrowDown, Minus, Flame, Trophy } from "lucide-react";
import { compareLeaderboardRank } from "@/lib/scoring";

interface LeaderboardClientProps {
  myGroupMembers: any[];
  myGroupName: string;
  globalUsers: any[];
  currentUser: any;
}

export function LeaderboardClient({
  myGroupMembers,
  myGroupName,
  globalUsers,
  currentUser,
}: LeaderboardClientProps) {
  const [activeTab, setActiveTab] = useState<"MY_GROUP" | "GLOBAL">("MY_GROUP");

  const displayList =
    activeTab === "MY_GROUP" && myGroupMembers.length > 0
      ? myGroupMembers.map((m) => m.user)
      : globalUsers;

  const sortedList = [...displayList].sort((a, b) => compareLeaderboardRank(a, b));

  const top1 = sortedList[0];
  const top2 = sortedList[1];
  const top3 = sortedList[2];

  return (
    <div className="app-container" style={{ padding: "3rem 1.5rem 6rem" }}>
      {/* Top Header */}
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
          <span className="editorial-stamp" style={{ borderColor: "var(--accent-cobalt)", color: "#FFF", marginBottom: "0.5rem" }}>
            WARRIOR RANKINGS // ARENA STANDINGS
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
            STANDINGS.
          </h1>
        </div>

        {/* Tab Switcher: [ MY GROUP ] [ GLOBAL ] */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-editorial)",
            borderRadius: "2px",
            padding: "0.3rem",
            display: "flex",
            gap: "0.3rem",
          }}
        >
          <button
            onClick={() => setActiveTab("MY_GROUP")}
            className="font-grotesk"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: activeTab === "MY_GROUP" ? "var(--text-primary)" : "transparent",
              color: activeTab === "MY_GROUP" ? "var(--text-dark)" : "var(--text-muted)",
              border: "none",
              padding: "0.5rem 1.2rem",
              borderRadius: "2px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <Users size={15} /> MY SQUAD ({myGroupName || "Squad"})
          </button>

          <button
            onClick={() => setActiveTab("GLOBAL")}
            className="font-grotesk"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: activeTab === "GLOBAL" ? "var(--text-primary)" : "transparent",
              color: activeTab === "GLOBAL" ? "var(--text-dark)" : "var(--text-muted)",
              border: "none",
              padding: "0.5rem 1.2rem",
              borderRadius: "2px",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            <Globe size={15} /> GLOBAL ARENA
          </button>
        </div>
      </div>

      {sortedList.length === 0 ? (
        <div
          className="editorial-card"
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            textAlign: "center",
            padding: "4rem 2rem",
          }}
        >
          <h3 className="font-grotesk" style={{ fontSize: "1.6rem", textTransform: "uppercase", color: "#FFF", marginBottom: "0.5rem" }}>
            NO STANDINGS RECORDED YET
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "2rem" }}>
            Solve today's 3 on LeetCode or invite friends to your squad to kick off the leaderboard race!
          </p>
          <Link href="/dashboard" className="btn-editorial-primary">
            GO TO TODAY'S MISSION →
          </Link>
        </div>
      ) : (
        <>
          {/* Top 3 High-Fashion Editorial Blocks */}
          {sortedList.length >= 3 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.5rem",
                marginBottom: "3.5rem",
              }}
            >
              {/* #1 Gold / Champion */}
              {top1 && (
                <div
                  className="editorial-card"
                  style={{
                    padding: "2.5rem 2rem",
                    border: "2px solid var(--accent-cobalt)",
                    background: "var(--bg-surface)",
                    boxShadow: "12px 12px 0px rgba(33, 72, 255, 0.2)",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-cobalt)", fontWeight: 800, marginBottom: "0.5rem" }}>
                    [RANK N° 01 // ARENA CHAMPION]
                  </div>
                  <h3 className="font-serif" style={{ fontSize: "2.5rem", lineHeight: 1, color: "#FFFFFF", marginBottom: "0.5rem" }}>
                    {top1.username}
                  </h3>
                  <div className="font-mono" style={{ fontSize: "1.6rem", fontWeight: 800, color: "var(--accent-cobalt)", marginBottom: "1rem" }}>
                    {((top1.score ?? top1.xp) || 0).toLocaleString()} SCORE
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    LVL {top1.level} • {top1.totalSolved} / 191 Solved • 🔥 {top1.currentStreak}D Streak
                  </div>
                </div>
              )}

              {/* #2 Silver */}
              {top2 && (
                <div
                  className="editorial-card"
                  style={{
                    padding: "2.5rem 2rem",
                    background: "var(--bg-surface)",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 800, marginBottom: "0.5rem" }}>
                    [RANK N° 02]
                  </div>
                  <h3 className="font-serif" style={{ fontSize: "2.2rem", lineHeight: 1, color: "#FFFFFF", marginBottom: "0.5rem" }}>
                    {top2.username}
                  </h3>
                  <div className="font-mono" style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1rem" }}>
                    {((top2.score ?? top2.xp) || 0).toLocaleString()} SCORE
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    LVL {top2.level} • {top2.totalSolved} Solved • 🔥 {top2.currentStreak}D Streak
                  </div>
                </div>
              )}

              {/* #3 Bronze */}
              {top3 && (
                <div
                  className="editorial-card"
                  style={{
                    padding: "2.5rem 2rem",
                    background: "var(--bg-surface)",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 800, marginBottom: "0.5rem" }}>
                    [RANK N° 03]
                  </div>
                  <h3 className="font-serif" style={{ fontSize: "2.2rem", lineHeight: 1, color: "#FFFFFF", marginBottom: "0.5rem" }}>
                    {top3.username}
                  </h3>
                  <div className="font-mono" style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "1rem" }}>
                    {((top3.score ?? top3.xp) || 0).toLocaleString()} SCORE
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    LVL {top3.level} • {top3.totalSolved} Solved • 🔥 {top3.currentStreak}D Streak
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Single User Note */}
          {sortedList.length === 1 && (
            <div
              className="editorial-card"
              style={{
                maxWidth: "680px",
                margin: "0 auto 2.5rem",
                padding: "2rem",
                textAlign: "center",
              }}
            >
              <h3 className="font-grotesk" style={{ fontSize: "1.4rem", textTransform: "uppercase", color: "#FFF", marginBottom: "0.4rem" }}>
                YOU'RE CURRENTLY #1.
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                Invite your friends with your squad code to start competing for the crown!
              </p>
              <Link href="/groups" className="btn-editorial-primary" style={{ fontSize: "0.85rem" }}>
                GET SQUAD INVITE CODE →
              </Link>
            </div>
          )}

          {/* Full Magazine Ranking Table */}
          <div className="editorial-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {sortedList.map((u, idx) => {
                const rank = idx + 1;
                const isUser = u.id === currentUser?.id;

                return (
                  <div
                    key={u.id}
                    style={{
                      background: isUser ? "rgba(33, 72, 255, 0.12)" : "transparent",
                      borderBottom: "1px solid var(--border-editorial)",
                      padding: "1rem 1.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                    }}
                  >
                    {/* Left: Rank, Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "1.2rem",
                          fontWeight: 900,
                          color: rank === 1 ? "var(--accent-amber)" : "var(--text-muted)",
                          width: "36px",
                        }}
                      >
                        {rank.toString().padStart(2, "0")}
                      </span>

                      <div>
                        <div style={{ fontWeight: 700, fontSize: "1.05rem", color: isUser ? "#FFF" : "var(--text-primary)" }}>
                          {u.username} {isUser && <span style={{ color: "var(--accent-cobalt)", fontSize: "0.8rem" }}>(You)</span>}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          LVL {u.level} • {u.totalSolved} / 191 Solved
                        </div>
                      </div>
                    </div>

                    {/* Right: Streak & XP */}
                    <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                      <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-vermillion)", fontSize: "0.85rem", fontWeight: 700 }}>
                        🔥 {u.currentStreak}D
                      </div>

                      <div style={{ fontFamily: "var(--font-mono)", fontWeight: 900, fontSize: "1.25rem", color: "#FFF", minWidth: "110px", textAlign: "right" }}>
                        {((u.score ?? u.xp) || 0).toLocaleString()} SCORE
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
