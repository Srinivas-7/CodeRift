"use client";

import { useState } from "react";
import {
  leaveGroup,
  removeMemberFromGroup,
  updateGroupDetails,
  regenerateGroupInviteCode,
  deleteGroup,
} from "@/actions/groups";
import { comparePhaseRank } from "@/lib/scoring";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Copy,
  Check,
  LogOut,
  Users,
  Flame,
  Crown,
  AlertTriangle,
  Settings,
  UserMinus,
  RefreshCw,
  Trash2,
  X,
  Shield,
  Trophy,
} from "lucide-react";

interface GroupDashboardClientProps {
  group: any;
  currentUserId: string;
  isLeader: boolean;
  memberDailyStatus: any[];
  phaseInfo?: any;
  teamBatch?: any;
  winners?: any;
}

export function GroupDashboardClient({
  group,
  currentUserId,
  isLeader,
  memberDailyStatus,
  phaseInfo,
  teamBatch,
  winners,
}: GroupDashboardClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [showDisbandModal, setShowDisbandModal] = useState(false);
  const [phaseTab, setPhaseTab] = useState<"overall" | "phase1" | "phase2">("overall");

  // Settings form state
  const [squadName, setSquadName] = useState(group.name);
  const [squadDesc, setSquadDesc] = useState(group.description || "");
  const [inviteCode, setInviteCode] = useState(group.inviteCode);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
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

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await removeMemberFromGroup(group.id, memberToRemove.userId);
      if (res.success) {
        setMemberToRemove(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || "Failed to remove member.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await updateGroupDetails(group.id, {
        name: squadName,
        description: squadDesc,
      });

      if (res.success) {
        setSuccessMsg("Squad details updated!");
        setTimeout(() => {
          setShowSettingsModal(false);
          setSuccessMsg("");
          router.refresh();
        }, 1200);
      } else {
        setErrorMsg(res.error || "Failed to update squad.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await regenerateGroupInviteCode(group.id);
      if (res.success && res.newInviteCode) {
        setInviteCode(res.newInviteCode);
        setSuccessMsg("New invite code generated!");
        setTimeout(() => setSuccessMsg(""), 2000);
      } else {
        setErrorMsg(res.error || "Failed to regenerate code.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisbandGroup = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await deleteGroup(group.id);
      if (res.success) {
        setShowDisbandModal(false);
        router.push("/groups");
      } else {
        setErrorMsg(res.error || "Failed to disband group.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error.");
      setLoading(false);
    }
  };

  // Sort members based on the active tab's criteria
  const sortedMembers = [...group.members].sort((a, b) =>
    comparePhaseRank(a.user, b.user, phaseTab)
  );

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
          marginBottom: "2.5rem",
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
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
            {isLeader && (
              <span className="editorial-stamp" style={{ borderColor: "var(--accent-amber)", color: "var(--accent-amber)" }}>
                👑 SQUAD ADMIN
              </span>
            )}
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
            {group.members.length} {group.members.length === 1 ? "WARRIOR" : "WARRIORS"} IN ROSTER • {group.description || "A fierce DSA consistency squad."}
          </div>

          {/* Phase Timeline Badge */}
          {phaseInfo && (
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginTop: "0.85rem", flexWrap: "wrap" }}>
              <span
                className="editorial-stamp"
                style={{
                  borderColor:
                    phaseInfo.status === "COMPLETED"
                      ? "var(--accent-acid)"
                      : phaseInfo.status === "PHASE_2_ACTIVE"
                      ? "var(--accent-amber)"
                      : "var(--accent-cobalt)",
                  color:
                    phaseInfo.status === "COMPLETED"
                      ? "var(--accent-acid)"
                      : phaseInfo.status === "PHASE_2_ACTIVE"
                      ? "var(--accent-amber)"
                      : "var(--accent-cobalt)",
                  background: "rgba(33, 72, 255, 0.08)",
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.6rem",
                }}
              >
                {phaseInfo.status === "NOT_STARTED" && `STARTS IN ${phaseInfo.daysUntilStart} DAYS (PHASE 1)`}
                {phaseInfo.status === "PHASE_1_ACTIVE" && `PHASE 1 // DAY ${phaseInfo.phaseDay} OF 32 (DAY ${phaseInfo.overallDay} / 64)`}
                {phaseInfo.status === "PHASE_2_ACTIVE" && `PHASE 2 // DAY ${phaseInfo.phaseDay} OF 32 (DAY ${phaseInfo.overallDay} / 64)`}
                {phaseInfo.status === "COMPLETED" && `COMPETITION COMPLETED (64/64 DAYS)`}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                {phaseInfo.status === "PHASE_1_ACTIVE" && `Problems 1–96 Active • Phase 1 ends ${phaseInfo.phase1EndDate}`}
                {phaseInfo.status === "PHASE_2_ACTIVE" && `Problems 97–191 Active • Phase 2 ends ${phaseInfo.phase2EndDate}`}
                {phaseInfo.status === "NOT_STARTED" && `Starts on ${phaseInfo.phase1StartDate}`}
                {phaseInfo.status === "COMPLETED" && `All 191 Problems Covered`}
              </span>
            </div>
          )}
        </div>

        {/* Invite Code & Action Controls */}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
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
            <strong style={{ letterSpacing: "0.08em" }}>{inviteCode}</strong>
            {copied ? <Check size={16} style={{ color: "var(--accent-acid)" }} /> : <Copy size={16} />}
          </button>

          {/* Admin Squad Settings Button */}
          {isLeader && (
            <button
              onClick={() => {
                setErrorMsg("");
                setSuccessMsg("");
                setShowSettingsModal(true);
              }}
              className="btn-editorial-primary"
              style={{
                fontSize: "0.85rem",
                padding: "0.6rem 1.1rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              <Settings size={15} /> MANAGE SQUAD
            </button>
          )}

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

      {/* 1.5 PHASE CHAMPIONS BANNERS (IF APPLICABLE) */}
      {winners && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
            marginBottom: "2.5rem",
          }}
        >
          {phaseInfo?.isPhase1Complete && winners.phase1Winner && (
            <div
              className="editorial-card"
              style={{
                padding: "1.25rem",
                border: "1px solid rgba(245, 158, 11, 0.5)",
                background: "rgba(245, 158, 11, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-amber)", marginBottom: "0.4rem" }}>
                <Trophy size={16} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>
                  PHASE 1 WINNER (PROBLEMS 1–96)
                </span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#FFF" }}>
                @{winners.phase1Winner.username || "Warrior"}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                {winners.phase1Winner.phase1Score || 0} PTS • {winners.phase1Winner.phase1Solved || 0} Solved
              </div>
            </div>
          )}

          {phaseInfo?.isPhase2Complete && winners.phase2Winner && (
            <div
              className="editorial-card"
              style={{
                padding: "1.25rem",
                border: "1px solid rgba(33, 72, 255, 0.5)",
                background: "rgba(33, 72, 255, 0.05)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-cobalt)", marginBottom: "0.4rem" }}>
                <Trophy size={16} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>
                  PHASE 2 WINNER (PROBLEMS 97–191)
                </span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#FFF" }}>
                @{winners.phase2Winner.username || "Warrior"}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                {winners.phase2Winner.phase2Score || 0} PTS • {winners.phase2Winner.phase2Solved || 0} Solved
              </div>
            </div>
          )}

          {phaseInfo?.isCompetitionComplete && winners.overallWinner && (
            <div
              className="editorial-card"
              style={{
                padding: "1.25rem",
                border: "1px solid var(--accent-acid)",
                background: "rgba(16, 185, 129, 0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-acid)", marginBottom: "0.4rem" }}>
                <Crown size={16} />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>
                  OVERALL SQUAD CHAMPION
                </span>
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#FFF" }}>
                @{winners.overallWinner.username || "Warrior"}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                {((winners.overallWinner.score ?? winners.overallWinner.xp) || 0).toLocaleString()} TOTAL PTS • {winners.overallWinner.totalSolved || 0} Solved
              </div>
            </div>
          )}
        </div>
      )}

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
            const targetCount = ms.totalBatchCount || 3;
            const isFinished = ms.solvedCount >= targetCount;

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
                    {ms.solvedCount} / {targetCount} SOLVED
                  </span>
                </div>

                <div className="progress-bar-bg" style={{ height: "4px" }}>
                  <div
                    className={isFinished ? "progress-bar-fill-vermillion" : "progress-bar-fill-cobalt"}
                    style={{ width: `${Math.round((ms.solvedCount / (targetCount || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SQUAD LEADERBOARD TABLE & PHASE TABS */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h2 className="font-grotesk" style={{ fontSize: "1.3rem", textTransform: "uppercase", color: "#FFF" }}>
              SQUAD ROSTER & LEADERBOARD
            </h2>
            {isLeader && (
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Admin Mode: You can manage or remove squad members
              </span>
            )}
          </div>

          {/* Phase Filter Tabs */}
          <div style={{ display: "flex", gap: "0.4rem", background: "var(--bg-surface)", padding: "0.25rem", borderRadius: "2px", border: "1px solid var(--border-editorial)" }}>
            <button
              onClick={() => setPhaseTab("overall")}
              style={{
                background: phaseTab === "overall" ? "var(--accent-cobalt)" : "transparent",
                color: phaseTab === "overall" ? "#FFF" : "var(--text-muted)",
                border: "none",
                padding: "0.45rem 0.9rem",
                borderRadius: "2px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              OVERALL
            </button>
            <button
              onClick={() => setPhaseTab("phase1")}
              style={{
                background: phaseTab === "phase1" ? "var(--accent-cobalt)" : "transparent",
                color: phaseTab === "phase1" ? "#FFF" : "var(--text-muted)",
                border: "none",
                padding: "0.45rem 0.9rem",
                borderRadius: "2px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              PHASE 1 (1–96)
            </button>
            <button
              onClick={() => setPhaseTab("phase2")}
              style={{
                background: phaseTab === "phase2" ? "var(--accent-cobalt)" : "transparent",
                color: phaseTab === "phase2" ? "#FFF" : "var(--text-muted)",
                border: "none",
                padding: "0.45rem 0.9rem",
                borderRadius: "2px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              PHASE 2 (97–191)
            </button>
          </div>
        </div>

        <div className="editorial-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {sortedMembers.map((m, idx) => {
              const rank = idx + 1;
              const isMe = m.userId === currentUserId;
              const isMemberLeader = m.role === "LEADER" || m.userId === group.createdById;

              // Display phase-specific score and solved counts
              let displayScore = (m.user?.score ?? m.user?.xp) || 0;
              let displaySolved = m.user?.totalSolved || 0;

              if (phaseTab === "phase1") {
                displayScore = m.user?.phase1Score || 0;
                displaySolved = m.user?.phase1Solved || 0;
              } else if (phaseTab === "phase2") {
                displayScore = m.user?.phase2Score || 0;
                displaySolved = m.user?.phase2Solved || 0;
              }

              return (
                <div
                  key={m.id || m.userId}
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
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontWeight: 700, color: isMe ? "#FFF" : "var(--text-primary)" }}>
                          {m.user?.username || "Warrior"} {isMe && "(You)"}
                        </span>
                        {isMemberLeader && (
                          <span
                            style={{
                              fontSize: "0.65rem",
                              background: "rgba(245, 158, 11, 0.15)",
                              border: "1px solid var(--accent-amber)",
                              color: "var(--accent-amber)",
                              padding: "0.1rem 0.4rem",
                              borderRadius: "2px",
                              fontFamily: "var(--font-mono)",
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.2rem",
                            }}
                          >
                            <Crown size={10} /> LEADER
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        LVL {m.user?.level || 1} • {displaySolved} Solved {phaseTab !== "overall" ? `in ${phaseTab === "phase1" ? "Phase 1" : "Phase 2"}` : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div style={{ fontFamily: "var(--font-mono)", color: "var(--accent-vermillion)", fontSize: "0.85rem", fontWeight: 700 }}>
                      🔥 {m.user?.currentStreak || 0}D
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontWeight: 900, fontSize: "1.2rem", color: "#FFF", minWidth: "90px", textAlign: "right" }}>
                      {displayScore.toLocaleString()} PTS
                    </div>

                    {/* Admin Kick Member Button */}
                    {isLeader && !isMe && (
                      <button
                        onClick={() => {
                          setErrorMsg("");
                          setMemberToRemove(m);
                        }}
                        title={`Remove ${m.user?.username} from squad`}
                        style={{
                          background: "none",
                          border: "1px solid rgba(255, 55, 20, 0.25)",
                          color: "var(--accent-vermillion)",
                          padding: "0.35rem 0.6rem",
                          borderRadius: "2px",
                          cursor: "pointer",
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                        }}
                      >
                        <UserMinus size={13} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* MANAGE SQUAD / SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowSettingsModal(false)}>
          <div
            className="editorial-card"
            style={{ maxWidth: "480px", width: "100%", padding: "2.5rem", background: "var(--bg-surface)", border: "2px solid var(--accent-cobalt)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Crown size={18} style={{ color: "var(--accent-amber)" }} />
                <h3 className="font-grotesk" style={{ fontSize: "1.25rem", textTransform: "uppercase", color: "#FFF", fontWeight: 800 }}>
                  MANAGE SQUAD (ADMIN)
                </h3>
              </div>
              <button onClick={() => setShowSettingsModal(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                  Squad Name
                </label>
                <input
                  type="text"
                  value={squadName}
                  onChange={(e) => setSquadName(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-editorial)",
                    padding: "0.65rem 0.85rem",
                    color: "#FFF",
                    fontFamily: "var(--font-grotesk)",
                    fontSize: "0.95rem",
                    borderRadius: "2px",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                  Squad Motto / Description
                </label>
                <textarea
                  value={squadDesc}
                  onChange={(e) => setSquadDesc(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-editorial)",
                    padding: "0.65rem 0.85rem",
                    color: "#FFF",
                    fontFamily: "var(--font-grotesk)",
                    fontSize: "0.9rem",
                    borderRadius: "2px",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              {/* Regenerate Code Section */}
              <div style={{ borderTop: "1px solid var(--border-editorial)", paddingTop: "1rem" }}>
                <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                  Squad Invite Code: <strong style={{ color: "#FFF" }}>{inviteCode}</strong>
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateCode}
                  disabled={loading}
                  className="btn-editorial-outline"
                  style={{ fontSize: "0.75rem", padding: "0.4rem 0.75rem", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                >
                  <RefreshCw size={12} /> Regenerate Invite Code
                </button>
              </div>

              {errorMsg && (
                <div style={{ color: "var(--accent-vermillion)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              {successMsg && (
                <div style={{ color: "var(--accent-acid)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                  ✓ {successMsg}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowSettingsModal(false)} className="btn-editorial-outline">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-editorial-primary">
                  {loading ? "SAVING..." : "SAVE CHANGES"}
                </button>
              </div>
            </form>

            {/* Disband Squad Area */}
            <div style={{ borderTop: "1px solid rgba(255, 55, 20, 0.2)", marginTop: "1.5rem", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Danger Zone:</span>
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowDisbandModal(true);
                }}
                style={{
                  background: "transparent",
                  border: "1px solid var(--accent-vermillion)",
                  color: "var(--accent-vermillion)",
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.75rem",
                  borderRadius: "2px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontFamily: "var(--font-mono)",
                }}
              >
                <Trash2 size={13} /> Disband Squad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REMOVE MEMBER CONFIRMATION MODAL */}
      {memberToRemove && (
        <div className="modal-overlay" onClick={() => !loading && setMemberToRemove(null)}>
          <div
            className="editorial-card"
            style={{ maxWidth: "440px", width: "100%", padding: "2.5rem", background: "var(--bg-surface)", border: "1px solid var(--accent-vermillion)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-vermillion)", marginBottom: "1rem" }}>
              <AlertTriangle size={20} />
              <h3 className="font-grotesk" style={{ fontSize: "1.25rem", textTransform: "uppercase", fontWeight: 800 }}>
                REMOVE SQUAD MEMBER?
              </h3>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              Are you sure you want to remove <strong>@{memberToRemove.user?.username || "Warrior"}</strong> from the squad? They will lose access to the squad leaderboard and chat feed.
            </p>

            {errorMsg && (
              <div style={{ color: "var(--accent-vermillion)", fontFamily: "var(--font-mono)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setMemberToRemove(null)} className="btn-editorial-outline">
                Cancel
              </button>
              <button onClick={handleRemoveMember} disabled={loading} className="btn-editorial-vermillion">
                {loading ? "REMOVING..." : "CONFIRM REMOVAL"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISBAND SQUAD MODAL */}
      {showDisbandModal && (
        <div className="modal-overlay" onClick={() => !loading && setShowDisbandModal(false)}>
          <div
            className="editorial-card"
            style={{ maxWidth: "440px", width: "100%", padding: "2.5rem", background: "var(--bg-surface)", border: "2px solid var(--accent-vermillion)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent-vermillion)", marginBottom: "1rem" }}>
              <AlertTriangle size={22} />
              <h3 className="font-grotesk" style={{ fontSize: "1.3rem", textTransform: "uppercase", fontWeight: 800 }}>
                PERMANENTLY DISBAND SQUAD?
              </h3>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              This will permanently delete <strong>"{group.name}"</strong> and remove all warriors from the roster. This action cannot be undone.
            </p>

            {errorMsg && (
              <div style={{ color: "var(--accent-vermillion)", fontFamily: "var(--font-mono)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowDisbandModal(false)} className="btn-editorial-outline">
                Cancel
              </button>
              <button onClick={handleDisbandGroup} disabled={loading} className="btn-editorial-vermillion">
                {loading ? "DISBANDING..." : "CONFIRM DISBAND"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEAVE SQUAD MODAL */}
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
