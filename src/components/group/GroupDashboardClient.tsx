"use client";

import { useState } from "react";
import { leaveGroup } from "@/actions/groups";
import { useRouter } from "next/navigation";
import { getAvatar } from "@/data/avatars";
import Link from "next/link";
import {
  Copy,
  Check,
  LogOut,
  Users,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Crown,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface GroupDashboardClientProps {
  group: any;
  currentUserId: string;
  isLeader: boolean;
  memberDailyStatus: any[];
}

export function GroupDashboardClient({
  group,
  currentUserId,
  isLeader,
  memberDailyStatus,
}: GroupDashboardClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCopyCode = () => {
    navigator.clipboard.writeText(group.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLeaveGroup = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await leaveGroup(group.id);
      if (res.success) {
        setShowLeaveModal(false);
        router.push("/groups");
      } else {
        setErrorMsg(res.error || "Failed to leave squad.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
      setLoading(false);
    }
  };

  // Sort members by XP descending
  const sortedMembers = [...group.members].sort((a, b) => b.user.xp - a.user.xp);

  return (
    <div className="app-container" style={{ padding: "3rem 1.5rem 6rem" }}>
      {/* 1. SQUAD MASTHEAD */}
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
          <Link
            href="/groups"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              textDecoration: "none",
              marginBottom: "0.5rem",
              display: "block",
            }}
          >
            ← ALL SQUADS
          </Link>
          <h1
            className="font-grotesk"
            style={{
              fontSize: "clamp(2.4rem, 6vw, 3.8rem)",
              textTransform: "uppercase",
              lineHeight: 0.95,
              letterSpacing: "-0.03em",
            }}
          >
            {group.name}
          </h1>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.3rem" }}>
            {group.members.length} {group.members.length === 1 ? "WARRIOR" : "WARRIORS"} IN ROSTER
          </div>
        </div>

        {/* Invite Code & Leave Actions */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          {/* Invite Code Box */}
          <button
            onClick={handleCopyCode}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-editorial-strong)",
              padding: "0.6rem 1rem",
              borderRadius: "2px",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              cursor: "pointer",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.85rem",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>CODE:</span>
            <strong style={{ letterSpacing: "0.08em" }}>{group.inviteCode}</strong>
            {copied ? <Check size={16} style={{ color: "var(--accent-acid)" }} /> : <Copy size={16} />}
          </button>

          {/* Leave Squad Action */}
          <button
            onClick={() => {
              setErrorMsg("");
              setShowLeaveModal(true);
            }}
            style={{
              background: "transparent",
              border: "1px solid rgba(255, 55, 20, 0.3)",
              color: "var(--accent-vermillion)",
              padding: "0.6rem 1rem",
              borderRadius: "2px",
              cursor: "pointer",
              fontFamily: "var(--font-grotesk)",
              fontWeight: 700,
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <LogOut size={16} /> LEAVE SQUAD
          </button>
        </div>
      </div>

      {/* 2. TODAY'S SQUAD 3-PROBLEM COMPLETION TRACKER */}
      <div style={{ marginBottom: "3.5rem" }}>
        <h2 className="font-grotesk" style={{ fontSize: "1.3rem", textTransform: "uppercase", color: "#FFF", marginBottom: "1rem" }}>
          TODAY'S MISSION PROGRESS (ALL MEMBERS)
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: "1rem",
          }}
        >
          {memberDailyStatus.map((ms) => {
            const isMe = ms.userId === currentUserId;
            const isFinished = ms.solvedCount >= 3;

            return (
              <div
                key={ms.userId}
                className="editorial-card"
                style={{
                  padding: "1.25rem",
                  background: isFinished
                    ? "rgba(16, 185, 129, 0.05)"
                    : isMe
                    ? "rgba(33, 72, 255, 0.08)"
                    : "var(--bg-surface)",
                  border: isFinished
                    ? "1px solid rgba(16, 185, 129, 0.4)"
                    : "1px solid var(--border-editorial)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div style={{ fontWeight: 700, color: isMe ? "#FFF" : "var(--text-secondary)" }}>
                    {ms.username} {isMe && "(You)"}
                  </div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      color: isFinished ? "var(--accent-acid)" : "var(--accent-cobalt)",
                    }}
                  >
                    {ms.solvedCount} / 3 SOLVED
                  </span>
                </div>

                <div className="progress-bar-bg" style={{ height: "4px" }}>
                  <div
                    className={isFinished ? "progress-bar-fill-vermillion" : "progress-bar-fill-cobalt"}
                    style={{ width: `${Math.round((ms.solvedCount / 3) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SQUAD LEADERBOARD TABLE */}
      <div>
        <h2 className="font-grotesk" style={{ fontSize: "1.3rem", textTransform: "uppercase", color: "#FFF", marginBottom: "1rem" }}>
          SQUAD LEADERBOARD
        </h2>

        <div className="editorial-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {sortedMembers.map((m, idx) => {
              const rank = idx + 1;
              const isMe = m.userId === currentUserId;

              return (
                <div
                  key={m.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0.85rem 1rem",
                    background: isMe ? "rgba(33, 72, 255, 0.12)" : "transparent",
                    borderBottom: "1px solid var(--border-editorial)",
                    borderRadius: "2px",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "1.1rem",
                        fontWeight: 900,
                        color: rank === 1 ? "var(--accent-amber)" : "var(--text-muted)",
                        width: "36px",
                      }}
                    >
                      0{rank}
                    </span>

                    <div>
                      <div style={{ fontWeight: 700, color: isMe ? "#FFF" : "var(--text-primary)" }}>
                        {m.user.username} {isMe && "(You)"}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        LVL {m.user.level} • {m.user.totalSolved} Solved
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
                    <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-vermillion)", fontSize: "0.85rem", fontWeight: 700 }}>
                      🔥 {m.user.currentStreak}D
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 900, fontSize: "1.2rem", color: "#FFF", minWidth: "100px", textAlign: "right" }}>
                      {m.user.xp.toLocaleString()} XP
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LEAVE SQUAD CONFIRMATION MODAL */}
      {showLeaveModal && (
        <div className="modal-overlay" onClick={() => setShowLeaveModal(false)}>
          <div
            className="editorial-card"
            style={{ maxWidth: "440px", width: "100%", padding: "2.5rem", background: "var(--bg-surface)", border: "1px solid var(--accent-vermillion)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-grotesk" style={{ fontSize: "1.4rem", textTransform: "uppercase", color: "var(--accent-vermillion)", marginBottom: "0.5rem" }}>
              LEAVE SQUAD?
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Are you sure you want to leave <strong>"{group.name}"</strong>? You can always rejoin later using the invite code.
            </p>

            {errorMsg && (
              <div style={{ color: "var(--accent-vermillion)", fontFamily: "var(--font-mono)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowLeaveModal(false)} className="btn-editorial-outline">
                Cancel
              </button>
              <button onClick={handleLeaveGroup} disabled={loading} className="btn-editorial-vermillion">
                {loading ? "LEAVING..." : "CONFIRM LEAVE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
