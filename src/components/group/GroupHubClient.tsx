"use client";

import { useState } from "react";
import { createGroup, joinGroup } from "@/actions/groups";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  Plus,
  KeyRound,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface GroupHubClientProps {
  userGroups: any[];
}

export function GroupHubClient({ userGroups }: GroupHubClientProps) {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [phase1StartDate, setPhase1StartDate] = useState(new Date().toISOString().split("T")[0]);
  const [inviteCodeInput, setInviteCodeInput] = useState("");

  const [enteringSquadId, setEnteringSquadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setErrorMsg("Group name is required.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await createGroup({
        name: groupName,
        description: groupDesc,
        phase1StartDate,
      });

      if (res.success) {
        setShowCreateModal(false);
        router.push(`/groups/${res.group!.id}`);
      } else {
        setErrorMsg(res.error || "Failed to create squad.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCodeInput.trim()) {
      setErrorMsg("Please enter an invite code.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await joinGroup(inviteCodeInput);
      if (res.success) {
        setShowJoinModal(false);
        router.push(`/groups/${res.group!.id}`);
      } else {
        setErrorMsg(res.error || "Failed to join squad.");
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error. Please try again.");
      setLoading(false);
    }
  };

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
            SOCIAL ARENAS // SQUAD DIRECTORY
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
            SQUADS & ARENAS.
          </h1>
        </div>

        {/* Top Actions */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            onClick={() => {
              setErrorMsg("");
              setShowJoinModal(true);
            }}
            className="btn-editorial-outline"
          >
            <KeyRound size={16} /> ENTER INVITE CODE
          </button>

          <button
            onClick={() => {
              setErrorMsg("");
              setShowCreateModal(true);
            }}
            className="btn-editorial-primary"
          >
            <Plus size={18} /> CREATE SQUAD
          </button>
        </div>
      </div>

      {/* User's Squads List */}
      <div>
        <h2 className="font-grotesk" style={{ fontSize: "1.4rem", textTransform: "uppercase", color: "#FFF", marginBottom: "1.5rem" }}>
          YOUR SQUADS ({userGroups.length})
        </h2>

        {userGroups.length === 0 ? (
          <div
            className="editorial-card"
            style={{
              textAlign: "center",
              padding: "4.5rem 2rem",
              maxWidth: "680px",
              margin: "0 auto",
            }}
          >
            <h3 className="font-grotesk" style={{ fontSize: "1.8rem", textTransform: "uppercase", color: "#FFF", marginBottom: "0.5rem" }}>
              YOU'RE SOLO.
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "1rem", lineHeight: 1.6, marginBottom: "2rem" }}>
              Create your private arena with friends or join an existing squad using an invite code to start competing.
            </p>
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
              <button onClick={() => setShowCreateModal(true)} className="btn-editorial-primary">
                CREATE A SQUAD →
              </button>
              <button onClick={() => setShowJoinModal(true)} className="btn-editorial-outline">
                ENTER INVITE CODE
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
              gap: "1.5rem",
            }}
          >
            {userGroups.map((gm) => {
              const group = gm?.group;
              if (!group) return null;
              const membersCount = group.members ? group.members.length : 1;

              return (
                <div
                  key={group.id}
                  className="editorial-card"
                  style={{
                    padding: "2rem",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                      <h3 className="font-grotesk" style={{ fontSize: "1.4rem", textTransform: "uppercase", color: "#FFFFFF" }}>
                        {group.name}
                      </h3>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.75rem",
                          color: "var(--accent-cobalt)",
                          border: "1px solid var(--border-editorial)",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "2px",
                        }}
                      >
                        {gm.role}
                      </span>
                    </div>

                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                      {membersCount} {membersCount === 1 ? "MEMBER" : "MEMBERS"} IN ARENA
                    </div>

                    {group.description && (
                      <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
                        {group.description}
                      </p>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid var(--border-editorial)", paddingTop: "1.25rem" }}>
                    <Link
                      href={`/groups/${group.id}`}
                      prefetch={true}
                      onClick={() => setEnteringSquadId(group.id)}
                      className="btn-editorial-primary"
                      style={{
                        width: "100%",
                        textAlign: "center",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.5rem",
                      }}
                    >
                      {enteringSquadId === group.id ? (
                        <>
                          <span
                            style={{
                              width: "14px",
                              height: "14px",
                              border: "2px solid #FFF",
                              borderTopColor: "transparent",
                              borderRadius: "50%",
                              display: "inline-block",
                              animation: "spin 0.6s linear infinite",
                            }}
                          />
                          ENTERING SQUAD...
                        </>
                      ) : (
                        "ENTER SQUAD →"
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE SQUAD MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="editorial-card"
            style={{ maxWidth: "480px", width: "100%", padding: "2.5rem", background: "var(--bg-surface)", border: "1px solid var(--text-primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-grotesk" style={{ fontSize: "1.5rem", textTransform: "uppercase", color: "#FFF", marginBottom: "0.5rem" }}>
              CREATE SQUAD ARENA
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Establish a new arena with your friends. You'll receive a unique invite code to share.
            </p>

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Squad Name:
              </label>
              <input
                type="text"
                placeholder="e.g. Cambridge DSA Warriors"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={40}
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

            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Phase 1 Start Date (32-Day Cycle Begins):
              </label>
              <input
                type="date"
                value={phase1StartDate}
                onChange={(e) => setPhase1StartDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-editorial)",
                  borderRadius: "2px",
                  color: "#FFF",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.9rem",
                }}
              />
              <span style={{ display: "block", fontSize: "0.7rem", color: "var(--accent-cobalt)", marginTop: "0.3rem", fontFamily: "var(--font-mono)" }}>
                Phase 1: Problems 1–96 (32 Days) → Phase 2: Problems 97–191 (32 Days)
              </span>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Description (Optional):
              </label>
              <textarea
                placeholder="Our daily 3-problem accountability group..."
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-editorial)",
                  borderRadius: "2px",
                  color: "#FFF",
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>

            {errorMsg && (
              <div style={{ color: "var(--accent-vermillion)", fontFamily: "var(--font-mono)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowCreateModal(false)} className="btn-editorial-outline">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={loading} className="btn-editorial-primary">
                {loading ? "CREATING..." : "CREATE SQUAD"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* JOIN SQUAD MODAL */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div
            className="editorial-card"
            style={{ maxWidth: "440px", width: "100%", padding: "2.5rem", background: "var(--bg-surface)", border: "1px solid var(--text-primary)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-grotesk" style={{ fontSize: "1.5rem", textTransform: "uppercase", color: "#FFF", marginBottom: "0.5rem" }}>
              JOIN WITH INVITE CODE
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Enter the unique invite code provided by your squad leader (e.g. <code>DS-A4DK3</code>).
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                Invite Code:
              </label>
              <input
                type="text"
                placeholder="e.g. DS-A4DK3"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                style={{
                  width: "100%",
                  padding: "0.85rem",
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border-editorial)",
                  borderRadius: "2px",
                  color: "#FFF",
                  fontFamily: "var(--font-mono)",
                  fontSize: "1.1rem",
                  letterSpacing: "0.1em",
                  textAlign: "center",
                }}
              />
            </div>

            {errorMsg && (
              <div style={{ color: "var(--accent-vermillion)", fontFamily: "var(--font-mono)", fontSize: "0.8rem", marginBottom: "1rem" }}>
                ⚠️ {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button onClick={() => setShowJoinModal(false)} className="btn-editorial-outline">
                Cancel
              </button>
              <button onClick={handleJoin} disabled={loading} className="btn-editorial-primary">
                {loading ? "JOINING..." : "JOIN SQUAD"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
