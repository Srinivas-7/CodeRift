"use client";

import { useState } from "react";
import Link from "next/link";
import { AVATAR_OPTIONS, getAvatar } from "@/data/avatars";
import { updateProfile } from "@/actions/auth";
import { getLevelInfo } from "@/lib/xp";
import { ProfileProgressSection } from "./ProfileProgressSection";
import { LeetCodeConnectModal } from "./LeetCodeConnectModal";
import { GfgConnectModal } from "./GfgConnectModal";
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
  Link2,
  Sparkles,
  User as UserIcon,
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
  const [showLeetCodeModal, setShowLeetCodeModal] = useState(false);
  const [showGfgModal, setShowGfgModal] = useState(false);
  const [currentLcHandle, setCurrentLcHandle] = useState<string | null>(user.leetcodeUsername || null);
  const [currentGfgHandle, setCurrentGfgHandle] = useState<string | null>(user.gfgUsername || null);
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar || "cyber_ninja");
  const [leetcodeUsername, setLeetcodeUsername] = useState(user.leetcodeUsername || "");
  const [gfgUsername, setGfgUsername] = useState(user.gfgUsername || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const levelInfo = getLevelInfo(user.score ?? user.xp ?? 0);
  const currentAvatar = getAvatar(avatar);
  const solvedCount = user.totalSolved || userProblemStatuses.filter((s: any) => s.status === "SOLVED" || s.status === "OPTIMAL").length;
  const progressPercent = Math.min(100, Math.round((solvedCount / 191) * 100));

  const handleSave = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const res = await updateProfile({
      username,
      avatar,
      leetcodeUsername: leetcodeUsername.trim() || undefined,
      gfgUsername: gfgUsername.trim() || undefined,
    });

    if (res.success) {
      setSuccessMsg("Warrior Profile, Avatar, LeetCode & GFG handles updated successfully!");
      setCurrentLcHandle(leetcodeUsername.trim() || null);
      setCurrentGfgHandle(gfgUsername.trim() || null);
      setIsEditing(false);
    } else {
      setErrorMsg(res.error || "Failed to update profile.");
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "1160px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* 1. TOP PROFILE HERO BANNER */}
      <div
        className="editorial-card"
        style={{
          padding: "2.25rem 2rem",
          background: "var(--bg-surface)",
          border: "2.5px solid var(--border-neo-strong)",
          borderRadius: "8px",
          boxShadow: "6px 6px 0px var(--shadow-neo)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          {/* Left Column: Avatar + Identity + Verified Profiles */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem" }}>
            {/* Avatar Badge */}
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "8px",
                border: "2.5px solid var(--border-neo-strong)",
                background: currentAvatar.bgGradient || "var(--bg-paper)",
                boxShadow: "4px 4px 0px var(--shadow-neo)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2.6rem",
                flexShrink: 0,
              }}
            >
              {currentAvatar.emoji}
            </div>

            {/* Name, Badges & Handles */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span
                  className="editorial-stamp"
                  style={{
                    fontSize: "0.7rem",
                    padding: "0.2rem 0.55rem",
                    background: "var(--accent-yellow)",
                    color: "#000000",
                  }}
                >
                  LEVEL {levelInfo.level} · WARRIOR
                </span>
                {user.role === "ADMIN" && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      color: "#FFFFFF",
                      background: "var(--accent-vermillion)",
                      border: "1.5px solid var(--border-neo-strong)",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "4px",
                    }}
                  >
                    ADMIN
                  </span>
                )}
              </div>

              <h1
                className="font-grotesk"
                style={{
                  fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
                  textTransform: "uppercase",
                  lineHeight: 1.05,
                  color: "var(--text-primary)",
                  fontWeight: 900,
                  margin: 0,
                  wordBreak: "break-word",
                }}
              >
                {user.username}
              </h1>

              {/* Connected Platforms Bar */}
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.35rem" }}>
                {/* LeetCode Handle */}
                {currentLcHandle ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <a
                      href={`https://leetcode.com/${currentLcHandle}/`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        background: "rgba(255, 161, 22, 0.12)",
                        border: "1.5px solid #FFA116",
                        color: "#FFA116",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 800,
                        textDecoration: "none",
                      }}
                      title="Open LeetCode profile"
                    >
                      <span>LC: @{currentLcHandle}</span>
                      <ExternalLink size={12} />
                    </a>
                    <button
                      onClick={() => setShowLeetCodeModal(true)}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1.5px solid var(--border-neo-strong)",
                        color: "var(--text-secondary)",
                        padding: "0.25rem 0.45rem",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontFamily: "var(--font-mono)",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                      title="Edit LeetCode handle"
                    >
                      <Edit2 size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLeetCodeModal(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      background: "rgba(255, 161, 22, 0.15)",
                      border: "1.5px solid #FFA116",
                      color: "#FFA116",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <Sparkles size={12} /> + Link LeetCode
                  </button>
                )}

                {/* GeeksforGeeks Handle */}
                {currentGfgHandle ? (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <a
                      href={`https://www.geeksforgeeks.org/user/${currentGfgHandle}/`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        background: "rgba(47, 141, 70, 0.15)",
                        border: "1.5px solid #2F8D46",
                        color: "#00F59B",
                        padding: "0.25rem 0.6rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontFamily: "var(--font-mono)",
                        fontWeight: 800,
                        textDecoration: "none",
                      }}
                      title="Open GeeksforGeeks profile"
                    >
                      <span>GFG: @{currentGfgHandle}</span>
                      <ExternalLink size={12} />
                    </a>
                    <button
                      onClick={() => setShowGfgModal(true)}
                      style={{
                        background: "var(--bg-surface)",
                        border: "1.5px solid var(--border-neo-strong)",
                        color: "var(--text-secondary)",
                        padding: "0.25rem 0.45rem",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontFamily: "var(--font-mono)",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                      title="Edit GFG handle"
                    >
                      <Edit2 size={11} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowGfgModal(true)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      background: "rgba(47, 141, 70, 0.15)",
                      border: "1.5px solid #2F8D46",
                      color: "#00F59B",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "4px",
                      fontSize: "0.75rem",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    <Sparkles size={12} /> + Link GFG
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: 4 Clean Metrics Grid */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "0.65rem",
              }}
            >
              {/* Metric 1: Arena Score */}
              <div
                style={{
                  border: "2px solid var(--border-neo-strong)",
                  background: "var(--bg-paper)",
                  padding: "0.85rem 1rem",
                  borderRadius: "6px",
                  boxShadow: "3px 3px 0px var(--shadow-neo)",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>
                  Arena Score
                </div>
                <div className="font-pixel" style={{ fontSize: "1.6rem", color: "var(--accent-purple)", lineHeight: 1.1, marginTop: "0.2rem" }}>
                  {((user.score ?? user.xp) || 0).toLocaleString()} <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>PTS</span>
                </div>
              </div>

              {/* Metric 2: Streak */}
              <div
                style={{
                  border: "2px solid var(--border-neo-strong)",
                  background: "var(--bg-paper)",
                  padding: "0.85rem 1rem",
                  borderRadius: "6px",
                  boxShadow: "3px 3px 0px var(--shadow-neo)",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>
                  Daily Streak
                </div>
                <div className="font-pixel" style={{ fontSize: "1.6rem", color: "var(--accent-vermillion)", lineHeight: 1.1, marginTop: "0.2rem" }}>
                  {user.currentStreak} <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>DAYS</span>
                </div>
              </div>

              {/* Metric 3: Solved */}
              <div
                style={{
                  border: "2px solid var(--border-neo-strong)",
                  background: "var(--bg-paper)",
                  padding: "0.85rem 1rem",
                  borderRadius: "6px",
                  boxShadow: "3px 3px 0px var(--shadow-neo)",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>
                  SDE Roadmap
                </div>
                <div className="font-pixel" style={{ fontSize: "1.6rem", color: "var(--accent-acid)", lineHeight: 1.1, marginTop: "0.2rem" }}>
                  {solvedCount} <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>/ 191</span>
                </div>
              </div>

              {/* Metric 4: Shields */}
              <div
                style={{
                  border: "2px solid var(--border-neo-strong)",
                  background: "var(--bg-paper)",
                  padding: "0.85rem 1rem",
                  borderRadius: "6px",
                  boxShadow: "3px 3px 0px var(--shadow-neo)",
                }}
              >
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>
                  Streak Shields
                </div>
                <div className="font-pixel" style={{ fontSize: "1.6rem", color: "var(--accent-cyan)", lineHeight: 1.1, marginTop: "0.2rem" }}>
                  {user.streakShields ?? 0} <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>/ 3</span>
                </div>
              </div>
            </div>

            {/* Overall SDE Progress Bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--font-mono)", fontSize: "0.72rem", marginBottom: "0.3rem", fontWeight: 800 }}>
                <span style={{ color: "var(--text-secondary)" }}>CURATED SDE ROADMAP PROGRESS</span>
                <span style={{ color: "var(--accent-purple)" }}>{progressPercent}% MASTERED</span>
              </div>
              <div className="progress-bar-bg" style={{ height: "7px" }}>
                <div className="progress-bar-fill-purple" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION NAVIGATION TABS */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          paddingBottom: "0.35rem",
          borderBottom: "2px solid var(--border-neo-strong)",
        }}
      >
        <button
          onClick={() => setActiveTab("PROGRESS")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.65rem 1.15rem",
            background: activeTab === "PROGRESS" ? "var(--accent-purple)" : "var(--bg-surface)",
            color: activeTab === "PROGRESS" ? "#FFFFFF" : "var(--text-secondary)",
            border: "2px solid var(--border-neo-strong)",
            boxShadow: activeTab === "PROGRESS" ? "3px 3px 0px var(--shadow-neo)" : "none",
            borderRadius: "6px 6px 0 0",
            fontFamily: "var(--font-grotesk)",
            fontSize: "0.85rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          <TrendingUp size={16} /> Progress & Points
        </button>

        <button
          onClick={() => setActiveTab("SQUADS")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.65rem 1.15rem",
            background: activeTab === "SQUADS" ? "var(--accent-purple)" : "var(--bg-surface)",
            color: activeTab === "SQUADS" ? "#FFFFFF" : "var(--text-secondary)",
            border: "2px solid var(--border-neo-strong)",
            boxShadow: activeTab === "SQUADS" ? "3px 3px 0px var(--shadow-neo)" : "none",
            borderRadius: "6px 6px 0 0",
            fontFamily: "var(--font-grotesk)",
            fontSize: "0.85rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
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
            gap: "0.45rem",
            padding: "0.65rem 1.15rem",
            background: activeTab === "ACHIEVEMENTS" ? "var(--accent-purple)" : "var(--bg-surface)",
            color: activeTab === "ACHIEVEMENTS" ? "#FFFFFF" : "var(--text-secondary)",
            border: "2px solid var(--border-neo-strong)",
            boxShadow: activeTab === "ACHIEVEMENTS" ? "3px 3px 0px var(--shadow-neo)" : "none",
            borderRadius: "6px 6px 0 0",
            fontFamily: "var(--font-grotesk)",
            fontSize: "0.85rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
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
            gap: "0.45rem",
            padding: "0.65rem 1.15rem",
            background: activeTab === "SETTINGS" ? "var(--accent-purple)" : "var(--bg-surface)",
            color: activeTab === "SETTINGS" ? "#FFFFFF" : "var(--text-secondary)",
            border: "2px solid var(--border-neo-strong)",
            boxShadow: activeTab === "SETTINGS" ? "3px 3px 0px var(--shadow-neo)" : "none",
            borderRadius: "6px 6px 0 0",
            fontFamily: "var(--font-grotesk)",
            fontSize: "0.85rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          <Settings size={16} /> Warrior Settings
        </button>
      </div>

      {/* 3. TAB CONTENT VIEWS */}
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

      {activeTab === "SQUADS" && (
        <div
          className="editorial-card"
          style={{
            padding: "2rem",
            background: "var(--bg-surface)",
            border: "2.5px solid var(--border-neo-strong)",
            borderRadius: "8px",
            boxShadow: "5px 5px 0px var(--shadow-neo)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <h2 className="font-grotesk" style={{ fontSize: "1.25rem", textTransform: "uppercase", color: "var(--text-primary)", fontWeight: 900 }}>
                MY SQUADS ({groupMemberships.length})
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.15rem" }}>
                Active squad leaderboards and daily challenge circles.
              </p>
            </div>
            <Link href="/groups" prefetch={true} className="btn-editorial-outline" style={{ fontSize: "0.8rem", padding: "0.45rem 0.9rem" }}>
              Squad Hub →
            </Link>
          </div>

          {groupMemberships.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🛡️</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.35rem" }}>No Squads Joined Yet</div>
              <div>Join a 5-person competitive squad to compete on daily mission standings with peers.</div>
              <div style={{ marginTop: "1.25rem" }}>
                <Link href="/groups" prefetch={true} className="btn-editorial-primary" style={{ fontSize: "0.85rem", padding: "0.6rem 1.4rem" }}>
                  Explore Squad Hub
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {groupMemberships.map((gm) => (
                <div
                  key={gm.id}
                  style={{
                    border: "2px solid var(--border-neo-strong)",
                    background: "var(--bg-paper)",
                    padding: "1rem 1.25rem",
                    borderRadius: "6px",
                    boxShadow: "3px 3px 0px var(--shadow-neo)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: "var(--text-primary)", fontSize: "1.05rem" }}>{gm.group?.name || "Squad"}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      {gm.group?.members ? gm.group.members.length : 1} Members • Role: {gm.role || "MEMBER"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 800 }}>
                        Squad Rank
                      </div>
                      <div className="font-pixel" style={{ fontSize: "1.4rem", color: "var(--accent-amber)", lineHeight: 1 }}>
                        #{gm.currentRank || 1}
                      </div>
                    </div>
                    <Link
                      href={`/groups/${gm.groupId}`}
                      prefetch={true}
                      className="btn-editorial-outline"
                      style={{ padding: "0.45rem 0.9rem", fontSize: "0.78rem" }}
                    >
                      View Squad
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "ACHIEVEMENTS" && (
        <div
          className="editorial-card"
          style={{
            padding: "2rem",
            background: "var(--bg-surface)",
            border: "2.5px solid var(--border-neo-strong)",
            borderRadius: "8px",
            boxShadow: "5px 5px 0px var(--shadow-neo)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
            <div>
              <h2 className="font-grotesk" style={{ fontSize: "1.25rem", textTransform: "uppercase", color: "var(--text-primary)", fontWeight: 900 }}>
                UNLOCKED BADGES ({userAchievements.length})
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.15rem" }}>
                Milestone awards unlocked through streaks, solves, and arena victories.
              </p>
            </div>
            <Link href="/achievements" className="btn-editorial-outline" style={{ fontSize: "0.8rem", padding: "0.45rem 0.9rem" }}>
              All Badges Room →
            </Link>
          </div>

          {userAchievements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏆</div>
              <div style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "0.35rem" }}>No Badges Unlocked Yet</div>
              <div>Solve daily missions or maintain a 3-day streak to claim your first badge!</div>
              <div style={{ marginTop: "1.25rem" }}>
                <Link href="/problems" className="btn-editorial-primary" style={{ fontSize: "0.85rem", padding: "0.6rem 1.4rem" }}>
                  Start Solving
                </Link>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 200px), 1fr))",
                gap: "1rem",
              }}
            >
              {userAchievements.map((ua) => (
                <div
                  key={ua.id}
                  style={{
                    border: "2px solid var(--border-neo-strong)",
                    background: "var(--bg-paper)",
                    padding: "1.25rem 1rem",
                    borderRadius: "6px",
                    textAlign: "center",
                    boxShadow: "3px 3px 0px var(--shadow-neo)",
                  }}
                >
                  <div style={{ fontSize: "2.4rem", marginBottom: "0.4rem" }}>{ua.achievement?.icon || "🏆"}</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-primary)" }}>
                    {ua.achievement?.name}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.3rem", lineHeight: 1.35 }}>
                    {ua.achievement?.description}
                  </div>
                  {ua.achievement?.xpReward > 0 && (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-amber)", fontWeight: 800, marginTop: "0.6rem" }}>
                      +{ua.achievement.xpReward} PTS
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "SETTINGS" && (
        <div
          className="editorial-card"
          style={{
            padding: "2rem",
            background: "var(--bg-surface)",
            border: "2.5px solid var(--border-neo-strong)",
            borderRadius: "8px",
            boxShadow: "5px 5px 0px var(--shadow-neo)",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
          }}
        >
          {/* Header */}
          <div>
            <h2 className="font-grotesk" style={{ fontSize: "1.25rem", textTransform: "uppercase", color: "var(--text-primary)", fontWeight: 900 }}>
              WARRIOR SETTINGS & PLATFORM HANDLES
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", marginTop: "0.15rem" }}>
              Configure your warrior persona, choose an avatar, and link verified coding profiles.
            </p>
          </div>

          {/* Avatar Picker Section */}
          <div>
            <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 800, textTransform: "uppercase", marginBottom: "0.75rem" }}>
              Choose Warrior Avatar:
            </label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 140px), 1fr))",
                gap: "0.75rem",
              }}
            >
              {AVATAR_OPTIONS.map((opt) => {
                const isSelected = avatar === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setAvatar(opt.id)}
                    style={{
                      background: isSelected ? "var(--bg-card)" : "var(--bg-paper)",
                      border: isSelected ? "2.5px solid var(--accent-purple)" : "2px solid var(--border-neo-strong)",
                      borderRadius: "6px",
                      padding: "0.75rem 0.5rem",
                      cursor: "pointer",
                      textAlign: "center",
                      boxShadow: isSelected ? "3px 3px 0px var(--accent-purple)" : "2px 2px 0px var(--shadow-neo)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>{opt.emoji}</div>
                    <div style={{ fontFamily: "var(--font-grotesk)", fontSize: "0.78rem", fontWeight: 800, color: "var(--text-primary)" }}>
                      {opt.name}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--text-muted)" }}>
                      {opt.title}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form Fields */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: "1.25rem",
            }}
          >
            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.35rem", textTransform: "uppercase", fontWeight: 800 }}>
                Warrior Tag (Username):
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--bg-paper)",
                  border: "2px solid var(--border-neo-strong)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxShadow: "2px 2px 0px var(--shadow-neo)",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#FFA116", marginBottom: "0.35rem", textTransform: "uppercase", fontWeight: 800 }}>
                LeetCode Handle (@username):
              </label>
              <input
                type="text"
                placeholder="e.g. srinivas_7"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--bg-paper)",
                  border: "2px solid rgba(255, 161, 22, 0.5)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxShadow: "2px 2px 0px var(--shadow-neo)",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "#00F59B", marginBottom: "0.35rem", textTransform: "uppercase", fontWeight: 800 }}>
                GeeksforGeeks Handle (@username):
              </label>
              <input
                type="text"
                placeholder="e.g. srinivas_gfg"
                value={gfgUsername}
                onChange={(e) => setGfgUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "var(--bg-paper)",
                  border: "2px solid rgba(47, 141, 70, 0.5)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.9rem",
                  outline: "none",
                  boxShadow: "2px 2px 0px var(--shadow-neo)",
                }}
              />
            </div>
          </div>

          {errorMsg && (
            <div style={{ color: "var(--accent-vermillion)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 800 }}>
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ color: "var(--accent-acid)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", fontWeight: 800 }}>
              ✓ {successMsg}
            </div>
          )}

          <div>
            <button
              onClick={handleSave}
              disabled={loading}
              className="btn-editorial-primary"
              style={{ padding: "0.8rem 2rem", fontSize: "0.9rem", fontWeight: 800 }}
            >
              {loading ? "SAVING SETTINGS..." : "SAVE WARRIOR PROFILE"}
            </button>
          </div>
        </div>
      )}

      {/* 4. MODALS */}
      <LeetCodeConnectModal
        isOpen={showLeetCodeModal}
        onClose={() => setShowLeetCodeModal(false)}
        currentHandle={currentLcHandle}
        onHandleUpdated={(newHandle) => {
          setCurrentLcHandle(newHandle);
          setLeetcodeUsername(newHandle || "");
        }}
      />

      <GfgConnectModal
        isOpen={showGfgModal}
        onClose={() => setShowGfgModal(false)}
        currentHandle={currentGfgHandle}
        onHandleUpdated={(newHandle) => {
          setCurrentGfgHandle(newHandle);
          setGfgUsername(newHandle || "");
        }}
      />
    </div>
  );
}
