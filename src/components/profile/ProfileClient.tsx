"use client";

import { useState } from "react";
import { AVATAR_OPTIONS, getAvatar } from "@/data/avatars";
import { updateProfile } from "@/actions/auth";
import { getLevelInfo } from "@/lib/xp";
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
} from "lucide-react";

interface ProfileClientProps {
  user: any;
  userAchievements: any[];
  groupMemberships: any[];
  xpTransactions: any[];
}

export function ProfileClient({
  user,
  userAchievements,
  groupMemberships,
  xpTransactions,
}: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [leetcodeUsername, setLeetcodeUsername] = useState(user.leetcodeUsername || "");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const levelInfo = getLevelInfo(user.xp);

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
          marginBottom: "3rem",
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

      {/* 2. PROFILE & LEETCODE SETTINGS */}
      <div className="editorial-card" style={{ padding: "2rem", marginBottom: "3rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isEditing ? "1.5rem" : 0 }}>
          <div>
            <h2 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "#FFF" }}>
              WARRIOR SETTINGS & LEETCODE CONNECTION
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Update your arena username or connect your LeetCode handle.
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

      {/* 3. SQUADS & ACHIEVEMENTS ROSTER */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
          gap: "2rem",
        }}
      >
        {/* Squad Memberships */}
        <div className="editorial-card" style={{ padding: "2rem" }}>
          <h2 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "#FFF", marginBottom: "1.25rem" }}>
            SQUADS ({groupMemberships.length})
          </h2>

          {groupMemberships.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No squads joined yet. Create or join one on the Squads page.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {groupMemberships.map((gm) => (
                <div
                  key={gm.id}
                  style={{
                    border: "1px solid var(--border-editorial)",
                    padding: "0.85rem 1rem",
                    borderRadius: "2px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "#FFF" }}>{gm.group.name}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {gm.group.members.length} Members
                    </div>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.1rem", fontWeight: 800, color: "var(--accent-amber)" }}>
                    #{gm.currentRank || 1}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements Gallery */}
        <div className="editorial-card" style={{ padding: "2rem" }}>
          <h2 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "#FFF", marginBottom: "1.25rem" }}>
            ACHIEVEMENTS ({userAchievements.length})
          </h2>

          {userAchievements.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No badges unlocked yet. Solve daily missions on LeetCode to claim your first badge!
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {userAchievements.map((ua) => (
                <div
                  key={ua.id}
                  style={{
                    border: "1px solid var(--border-editorial)",
                    padding: "0.75rem 0.4rem",
                    borderRadius: "2px",
                    textAlign: "center",
                  }}
                  title={`${ua.achievement.name}: ${ua.achievement.description}`}
                >
                  <div style={{ fontSize: "1.8rem" }}>{ua.achievement.icon}</div>
                  <div style={{ fontSize: "0.65rem", fontWeight: 700, color: "#FFF", marginTop: "0.2rem" }}>
                    {ua.achievement.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
