"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Globe, Trophy, Crown } from "lucide-react";
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
          borderBottom: "2px solid var(--border-editorial)",
          marginBottom: "2.5rem",
        }}
      >
        <div>
          <div className="pixel-kicker" style={{ marginBottom: "0.4rem" }}>
            // WARRIOR RANKINGS · ARENA STANDINGS
          </div>
          <h1
            className="font-pixel"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 4rem)",
              textTransform: "uppercase",
              lineHeight: 0.95,
              color: "var(--accent-purple)",
            }}
          >
            STANDINGS.
          </h1>
        </div>

        {/* Tab Switcher: [ MY SQUAD ] [ GLOBAL ] */}
        <div
          style={{
            background: "var(--bg-surface)",
            border: "2px solid var(--border-neo-strong)",
            borderRadius: "6px",
            boxShadow: "3px 3px 0px var(--shadow-neo)",
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
              background: activeTab === "MY_GROUP" ? "var(--accent-purple)" : "transparent",
              color: activeTab === "MY_GROUP" ? "#FFFFFF" : "var(--text-secondary)",
              border: activeTab === "MY_GROUP" ? "2px solid var(--border-neo-strong)" : "2px solid transparent",
              padding: "0.5rem 1.2rem",
              borderRadius: "4px",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
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
              background: activeTab === "GLOBAL" ? "var(--accent-purple)" : "transparent",
              color: activeTab === "GLOBAL" ? "#FFFFFF" : "var(--text-secondary)",
              border: activeTab === "GLOBAL" ? "2px solid var(--border-neo-strong)" : "2px solid transparent",
              padding: "0.5rem 1.2rem",
              borderRadius: "4px",
              fontWeight: 800,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
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
          <h3 className="font-pixel" style={{ fontSize: "1.8rem", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
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
          {/* Top 3 Neo-Brutalist Podium Cards */}
          {sortedList.length >= 3 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.5rem",
                marginBottom: "3rem",
              }}
            >
              {/* #1 Champion */}
              {top1 && (
                <div
                  className="editorial-card"
                  style={{
                    padding: "2.25rem 2rem",
                    border: "2px solid var(--accent-amber)",
                    background: "var(--bg-surface)",
                    boxShadow: "6px 6px 0px var(--accent-amber)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-amber)", fontWeight: 800, marginBottom: "0.5rem" }}>
                    <Crown size={16} /> [RANK N° 01 // ARENA CHAMPION]
                  </div>
                  <h3 className="font-pixel" style={{ fontSize: "2.2rem", lineHeight: 1.1, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                    {top1.username}
                  </h3>
                  <div className="font-pixel" style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--accent-amber)", marginBottom: "1rem" }}>
                    {((top1.score ?? top1.xp) || 0).toLocaleString()} PTS
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
                    padding: "2.25rem 2rem",
                    background: "var(--bg-surface)",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 800, marginBottom: "0.5rem" }}>
                    [RANK N° 02]
                  </div>
                  <h3 className="font-pixel" style={{ fontSize: "2rem", lineHeight: 1.1, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                    {top2.username}
                  </h3>
                  <div className="font-pixel" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent-purple)", marginBottom: "1rem" }}>
                    {((top2.score ?? top2.xp) || 0).toLocaleString()} PTS
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
                    padding: "2.25rem 2rem",
                    background: "var(--bg-surface)",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 800, marginBottom: "0.5rem" }}>
                    [RANK N° 03]
                  </div>
                  <h3 className="font-pixel" style={{ fontSize: "2rem", lineHeight: 1.1, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                    {top3.username}
                  </h3>
                  <div className="font-pixel" style={{ fontSize: "1.4rem", fontWeight: 700, color: "var(--accent-purple)", marginBottom: "1rem" }}>
                    {((top3.score ?? top3.xp) || 0).toLocaleString()} PTS
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
              <h3 className="font-pixel" style={{ fontSize: "1.6rem", textTransform: "uppercase", color: "var(--text-primary)", marginBottom: "0.4rem" }}>
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

          {/* Full Neo-Brutalist Ranking Table */}
          <div className="editorial-card" style={{ padding: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {sortedList.map((u, idx) => {
                const rank = idx + 1;
                const isUser = u.id === currentUser?.id;

                return (
                  <div
                    key={u.id}
                    style={{
                      background: isUser ? "var(--accent-purple-subtle)" : "transparent",
                      border: isUser ? "2px solid var(--accent-purple)" : "1px solid var(--border-editorial)",
                      borderRadius: "6px",
                      padding: "1rem 1.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Left: Rank, Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                      <span
                        style={{
                          fontFamily: "var(--font-pixel)",
                          fontSize: "1.3rem",
                          fontWeight: 700,
                          color: rank === 1 ? "var(--accent-amber)" : "var(--text-muted)",
                          width: "36px",
                        }}
                      >
                        {rank.toString().padStart(2, "0")}
                      </span>

                      <div>
                        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: isUser ? "var(--accent-purple)" : "var(--text-primary)" }}>
                          {u.username} {isUser && <span style={{ color: "var(--accent-purple)", fontSize: "0.8rem" }}>(You)</span>}
                        </div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          LVL {u.level} • {u.totalSolved} / 191 Solved
                        </div>
                      </div>
                    </div>

                    {/* Right: Streak & XP */}
                    <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
                      <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-vermillion)", fontSize: "0.85rem", fontWeight: 800 }}>
                        🔥 {u.currentStreak}D
                      </div>

                      <div style={{ fontFamily: "var(--font-pixel)", fontWeight: 700, fontSize: "1.25rem", color: "var(--text-primary)", minWidth: "120px", textAlign: "right" }}>
                        {((u.score ?? u.xp) || 0).toLocaleString()} PTS
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
