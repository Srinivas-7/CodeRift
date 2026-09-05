"use client";

import { useState } from "react";
import Link from "next/link";
import { AVATAR_OPTIONS, getAvatar } from "@/data/avatars";
import { updateProfile } from "@/actions/auth";
import { getLevelInfo } from "@/lib/xp";
import { ProfileProgressSection } from "./ProfileProgressSection";
import {
  Flame,
  Shield,
  Trophy,
  Award,
  BookOpen,
  Zap,
  Edit2,
  Check,
  Users,
  ExternalLink,
  TrendingUp,
  Layers,
  Settings,
} from "lucide-react";

interface ProfileClientProps {
  user: any;
  userAchievements: any[];
  groupMemberships: any[];
  xpTransactions: any[];
  userProblemStatuses?: any[];
  allProblems?: any[];
  completedDailies?: any[];
  wonDuels?: any[];
}

export function ProfileClient({
  user,
  userAchievements = [],
  groupMemberships = [],
  xpTransactions = [],
  userProblemStatuses = [],
  allProblems = [],
  completedDailies = [],
  wonDuels = [],
}: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<"PROGRESS" | "SQUADS" | "ACHIEVEMENTS" | "SETTINGS">("PROGRESS");
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [leetcodeUsername, setLeetcodeUsername] = useState(user.leetcodeUsername || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const levelInfo = getLevelInfo(user.score ?? user.xp ?? 0);

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await updateProfile({
      username,
      avatar,
      leetcodeUsername: leetcodeUsername.trim() || undefined,
    });

    if (res.success) {
      setSuccessMsg("Warrior Profile & LeetCode account saved!");
      setIsEditing(false);
    } else {
      setErrorMsg(res.error || "Failed to update profile.");
    }
    setLoading(false);
  };

  return (
    <div className="app-container" style={{ padding: "3rem 1.5rem 6rem", maxWidth: "1100px" }}>
      {/* 1. TOP EDITORIAL PROFILE CARD */}
      <div
        className="editorial-card"
        style={{
          padding: "3.5rem 3rem",
          background: "var(--bg-surface)",
          border: "2px solid var(--text-primary)",
          borderRadius: "4px",
          boxShadow: "16px 16px 0px rgba(33, 72, 255, 0.25)",
          marginBottom: "2.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "2rem",
          }}
        >
          {/* Identity */}
          <div>
            <span className="editorial-stamp" style={{ borderColor: "var(--accent-cobalt)", color: "var(--accent-cobalt)", marginBottom: "0.5rem" }}>
              WARRIOR SPECIFICATION // LEVEL {levelInfo.level}
            </span>
            <h1
              className="font-grotesk"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.2rem)",
                textTransform: "uppercase",
                lineHeight: 0.95,
                color: "#FFFFFF",
                marginBottom: "0.75rem",
              }}
            >
              {user.username}
            </h1>

            {/* LeetCode Pill */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              {user.leetcodeUsername ? (
                <a
                  href={`https://leetcode.com/${user.leetcodeUsername}/`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "rgba(255, 161, 22, 0.12)",
                    border: "1px solid rgba(255, 161, 22, 0.4)",
                    color: "#FFA116",
                    padding: "0.3rem 0.75rem",
                    borderRadius: "2px",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-mono)",
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  <span>@{user.leetcodeUsername}</span>
                  <ExternalLink size={13} />
                </a>
              ) : (
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                  LeetCode Account: Not Connected
                </span>
              )}
            </div>

            {/* Score & Progression */}
            <div style={{ width: "280px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.75rem",
                  marginBottom: "0.35rem",
                }}
              >
                <span style={{ color: "var(--accent-cobalt)", fontWeight: 800 }}>ARENA SCORE</span>
                <span style={{ color: "#FFF", fontWeight: 800 }}>{((user.score ?? user.xp) || 0).toLocaleString()} PTS</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill-cobalt"
                  style={{ width: `${Math.min(100, Math.round(((user.totalSolved || 0) / 191) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Oversized Stat Blocks */}
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div
              style={{
                border: "1px solid var(--border-editorial)",
                background: "var(--bg-primary)",
                padding: "1.25rem 1.5rem",
                borderRadius: "2px",
                textAlign: "center",
                minWidth: "120px",
              }}
            >
              <div className="font-serif" style={{ fontSize: "2.4rem", color: "var(--accent-cobalt)", lineHeight: 1 }}>
                {((user.score ?? user.xp) || 0).toLocaleString()}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "0.2rem" }}>
                Score
              </div>
            </div>

            <div
              style={{
                border: "1px solid var(--border-editorial)",
                background: "var(--bg-primary)",
                padding: "1.25rem 1.5rem",
                borderRadius: "2px",
                textAlign: "center",
                minWidth: "120px",
              }}
            >
              <div className="font-serif" style={{ fontSize: "2.4rem", color: "var(--accent-vermillion)", lineHeight: 1 }}>
                {user.currentStreak}D
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "0.2rem" }}>
                Streak
              </div>
            </div>

            <div
              style={{
                border: "1px solid var(--border-editorial)",
                background: "var(--bg-primary)",
                padding: "1.25rem 1.5rem",
                borderRadius: "2px",
                textAlign: "center",
                minWidth: "120px",
              }}
            >
              <div className="font-serif" style={{ fontSize: "2.4rem", color: "var(--accent-acid)", lineHeight: 1 }}>
                {user.totalSolved}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "0.2rem" }}>
                / 191 Solved
              </div>
            </div>

            <div
              style={{
                border: "1px solid var(--border-editorial)",
                background: "var(--bg-primary)",
                padding: "1.25rem 1.5rem",
                borderRadius: "2px",
                textAlign: "center",
                minWidth: "120px",
              }}
            >
              <div className="font-serif" style={{ fontSize: "2.4rem", color: "var(--text-primary)", lineHeight: 1 }}>
                {user.streakShields} / 3
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", marginTop: "0.2rem" }}>
                Shields
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PROFILE SECTION NAVIGATION TABS */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          marginBottom: "2rem",
          overflowX: "auto",
          paddingBottom: "0.5rem",
          borderBottom: "1px solid var(--border-editorial)",
        }}
      >
        <button
          onClick={() => setActiveTab("PROGRESS")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: activeTab === "PROGRESS" ? "var(--accent-cobalt)" : "var(--bg-surface)",
            color: activeTab === "PROGRESS" ? "#FFFFFF" : "var(--text-secondary)",
            border: activeTab === "PROGRESS" ? "1px solid var(--accent-cobalt)" : "1px solid var(--border-editorial)",
            borderRadius: "4px",
            fontFamily: "var(--font-grotesk)",
            fontSize: "0.85rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          <TrendingUp size={16} /> Progress & Achieved Points
        </button>

        <button
          onClick={() => setActiveTab("SQUADS")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: activeTab === "SQUADS" ? "var(--accent-cobalt)" : "var(--bg-surface)",
            color: activeTab === "SQUADS" ? "#FFFFFF" : "var(--text-secondary)",
            border: activeTab === "SQUADS" ? "1px solid var(--accent-cobalt)" : "1px solid var(--border-editorial)",
            borderRadius: "4px",
            fontFamily: "var(--font-grotesk)",
            fontSize: "0.85rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          <Users size={16} /> Squads ({groupMemberships.length})
        </button>

        <button
          onClick={() => setActiveTab("ACHIEVEMENTS")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: activeTab === "ACHIEVEMENTS" ? "var(--accent-cobalt)" : "var(--bg-surface)",
            color: activeTab === "ACHIEVEMENTS" ? "#FFFFFF" : "var(--text-secondary)",
            border: activeTab === "ACHIEVEMENTS" ? "1px solid var(--accent-cobalt)" : "1px solid var(--border-editorial)",
            borderRadius: "4px",
            fontFamily: "var(--font-grotesk)",
            fontSize: "0.85rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          <Trophy size={16} /> Badges ({userAchievements.length})
        </button>

        <button
          onClick={() => setActiveTab("SETTINGS")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.25rem",
            background: activeTab === "SETTINGS" ? "var(--accent-cobalt)" : "var(--bg-surface)",
            color: activeTab === "SETTINGS" ? "#FFFFFF" : "var(--text-secondary)",
            border: activeTab === "SETTINGS" ? "1px solid var(--accent-cobalt)" : "1px solid var(--border-editorial)",
            borderRadius: "4px",
            fontFamily: "var(--font-grotesk)",
            fontSize: "0.85rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          <Settings size={16} /> Warrior Settings
        </button>
      </div>

      {/* 3. TAB CONTENT */}
      {activeTab === "PROGRESS" && (
        <ProfileProgressSection
          user={user}
          userAchievements={userAchievements}
          groupMemberships={groupMemberships}
          xpTransactions={xpTransactions}
          userProblemStatuses={userProblemStatuses}
          allProblems={allProblems}
          completedDailies={completedDailies}
          wonDuels={wonDuels}
        />
      )}

      {activeTab === "SETTINGS" && (
        <div className="editorial-card" style={{ padding: "2.5rem 2rem", marginBottom: "3rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isEditing ? "1.5rem" : 0 }}>
            <div>
              <h2 className="font-grotesk" style={{ fontSize: "1.3rem", textTransform: "uppercase", color: "#FFF" }}>
                WARRIOR SETTINGS & LEETCODE CONNECTION
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                Update your arena warrior tag or connect your verified LeetCode profile handle.
              </p>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn-editorial-outline"
              style={{ fontSize: "0.8rem" }}
            >
              <Edit2 size={14} /> {isEditing ? "Close Editor" : "Edit Profile"}
            </button>
          </div>

          {isEditing && (
            <div style={{ marginTop: "1.5rem", borderTop: "1px solid var(--border-editorial)", paddingTop: "1.5rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "1.25rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem", textTransform: "uppercase" }}>
                    Warrior Tag:
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    maxLength={20}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "var(--bg-primary)",
                      border: "1px solid var(--border-editorial)",
                      borderRadius: "2px",
                      color: "#FFF",
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#FFA116", marginBottom: "0.3rem", textTransform: "uppercase" }}>
                    LeetCode Handle (@username):
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. neetcode"
                    value={leetcodeUsername}
                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "var(--bg-primary)",
                      border: "1px solid rgba(255, 161, 22, 0.4)",
                      borderRadius: "2px",
                      color: "#FFF",
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                </div>
              </div>

              {errorMsg && <div style={{ color: "var(--accent-vermillion)", fontSize: "0.85rem", marginBottom: "1rem" }}>⚠️ {errorMsg}</div>}
              {successMsg && <div style={{ color: "var(--accent-acid)", fontSize: "0.85rem", marginBottom: "1rem" }}>✓ {successMsg}</div>}

              <button onClick={handleSave} disabled={loading} className="btn-editorial-primary" style={{ padding: "0.75rem 1.8rem" }}>
                {loading ? "SAVING..." : "SAVE SETTINGS"}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "SQUADS" && (
        <div className="editorial-card" style={{ padding: "2.5rem 2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h2 className="font-grotesk" style={{ fontSize: "1.3rem", textTransform: "uppercase", color: "#FFF" }}>
              MY SQUADS ({groupMemberships.length})
            </h2>
            <Link href="/groups" prefetch={true} className="btn-editorial-outline" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
              Squad Hub →
            </Link>
          </div>

          {groupMemberships.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🛡️</div>
              No squads joined yet. Create or join a 5-person competitive squad to compete on daily mission leaderboards.
              <div style={{ marginTop: "1rem" }}>
                <Link href="/groups" prefetch={true} className="btn-editorial-primary" style={{ fontSize: "0.8rem", padding: "0.6rem 1.2rem" }}>
                  Join a Squad
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {groupMemberships.map((gm) => (
                <div
                  key={gm.id}
                  style={{
                    border: "1px solid var(--border-editorial)",
                    background: "var(--bg-primary)",
                    padding: "1rem 1.25rem",
                    borderRadius: "4px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "#FFF", fontSize: "1rem" }}>{gm.group.name}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      {gm.group.members.length} Members • Role: {gm.role || "MEMBER"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Squad Rank
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.3rem", fontWeight: 800, color: "var(--accent-amber)" }}>
                        #{gm.currentRank || 1}
                      </div>
                    </div>
                    <Link
                      href={`/groups/${gm.groupId}`}
                      prefetch={true}
                      className="btn-editorial-outline"
                      style={{ padding: "0.4rem 0.8rem", fontSize: "0.75rem" }}
                    >
                      View Arena
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "ACHIEVEMENTS" && (
        <div className="editorial-card" style={{ padding: "2.5rem 2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h2 className="font-grotesk" style={{ fontSize: "1.3rem", textTransform: "uppercase", color: "#FFF" }}>
                ACHIEVEMENT BADGES ({userAchievements.length})
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                Conquer streaks, roadmap milestones, and squad podiums to unlock badges and bonus points.
              </p>
            </div>
            <a href="/achievements" className="btn-editorial-outline" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
              All Achievements →
            </a>
          </div>

          {userAchievements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏆</div>
              No badges unlocked yet. Solve daily missions on LeetCode to claim your first badge!
              <div style={{ marginTop: "1rem" }}>
                <a href="/problems" className="btn-editorial-primary" style={{ fontSize: "0.8rem", padding: "0.6rem 1.2rem" }}>
                  Start Solving
                </a>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "1rem",
              }}
            >
              {userAchievements.map((ua) => (
                <div
                  key={ua.id}
                  style={{
                    border: "1px solid var(--border-editorial)",
                    background: "var(--bg-primary)",
                    padding: "1.25rem 1rem",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "2.4rem", marginBottom: "0.4rem" }}>{ua.achievement?.icon || "🏆"}</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#FFF" }}>
                    {ua.achievement?.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem", lineHeight: 1.3 }}>
                    {ua.achievement?.description}
                  </div>
                  {ua.achievement?.xpReward > 0 && (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-amber)", fontWeight: 700, marginTop: "0.5rem" }}>
                      +{ua.achievement.xpReward} PTS
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

