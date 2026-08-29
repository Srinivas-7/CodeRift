"use client";

import { useState } from "react";
import { SdeProblem } from "@/data/sdeSheetProblems";
import { ShieldAlert, AlertTriangle, Users, BookOpen, Database, Search, Edit3, Check } from "lucide-react";

interface AdminClientProps {
  problems: SdeProblem[];
  totalUsers: number;
  totalGroups: number;
  totalSubmissions: number;
}

export function AdminClient({
  problems,
  totalUsers,
  totalGroups,
  totalSubmissions,
}: AdminClientProps) {
  const [search, setSearch] = useState("");
  const [selectedProblem, setSelectedProblem] = useState<SdeProblem | null>(null);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const filtered = problems.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.orderInSheet.toString().includes(search)
  );

  return (
    <div>
      {/* 1. Admin Metric Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}
      >
        <div className="arena-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--neon-cyan)", marginBottom: "0.5rem" }}>
            <BookOpen size={18} /> Approved Sheet Dataset
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 900, color: "#FFF" }}>
            191 PROBLEMS
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--neon-green)" }}>
            ✓ Exact Striver SDE Sheet Synchronized
          </div>
        </div>

        <div className="arena-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--neon-magenta)", marginBottom: "0.5rem" }}>
            <Users size={18} /> Registered Warriors
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 900, color: "#FFF" }}>
            {totalUsers}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Active across all squads
          </div>
        </div>

        <div className="arena-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--neon-amber)", marginBottom: "0.5rem" }}>
            <ShieldAlert size={18} /> Private Squads
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 900, color: "#FFF" }}>
            {totalGroups}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Independent leaderboards
          </div>
        </div>

        <div className="arena-card">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--neon-green)", marginBottom: "0.5rem" }}>
            <Database size={18} /> Total Submissions
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "1.8rem", fontWeight: 900, color: "#FFF" }}>
            {totalSubmissions}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Server-verified XP awarded
          </div>
        </div>
      </div>

      {/* 2. Critical Safeguard Warning Banner */}
      <div
        style={{
          background: "rgba(255, 184, 0, 0.1)",
          border: "1px solid var(--neon-amber)",
          borderRadius: "14px",
          padding: "1.25rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "2.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <AlertTriangle size={24} style={{ color: "var(--neon-amber)" }} />
          <div>
            <div style={{ fontWeight: 800, color: "#FFF" }}>
              STRICT 191-PROBLEM DATASET ENFORCEMENT ACTIVE
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Arbitrary or random AI questions outside the approved 191 Striver SDE Sheet are strictly blocked by schema validation.
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowWarningModal(true)}
          className="btn-outline"
          style={{ fontSize: "0.8rem", color: "var(--neon-amber)", borderColor: "var(--neon-amber)" }}
        >
          Add Outside Question (Restricted)
        </button>
      </div>

      {/* 3. Problem Dataset Management Table */}
      <div className="arena-card" style={{ padding: "1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "1.3rem", color: "#FFF" }}>
            191 SDE SHEET DATASET ({problems.length} Problems)
          </h2>

          <div style={{ position: "relative", width: "300px" }}>
            <Search
              size={16}
              style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem 0.5rem 2rem",
                background: "var(--bg-primary)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                color: "#FFF",
                fontSize: "0.85rem",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "600px", overflowY: "auto" }}>
          {filtered.map((p) => (
            <div
              key={p.id}
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--neon-cyan)", width: "32px" }}>
                  #{p.orderInSheet}
                </span>
                <div>
                  <div style={{ fontWeight: 700, color: "#FFF", fontSize: "0.95rem" }}>{p.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {p.category} • {p.difficulty}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <button
                  onClick={() => setSelectedProblem(p)}
                  className="btn-outline"
                  style={{ fontSize: "0.75rem", padding: "0.3rem 0.6rem" }}
                >
                  <Edit3 size={13} /> View Metadata
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View/Edit Problem Metadata Modal */}
      {selectedProblem && (
        <div className="modal-overlay" onClick={() => setSelectedProblem(null)}>
          <div
            className="arena-card"
            style={{ maxWidth: "600px", width: "100%", padding: "2rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: "1.4rem", color: "#FFF", marginBottom: "0.5rem" }}>
              #{selectedProblem.orderInSheet} — {selectedProblem.title}
            </h2>
            <div style={{ fontSize: "0.8rem", color: "var(--neon-cyan)", fontFamily: "var(--font-mono)", marginBottom: "1.25rem" }}>
              Category: {selectedProblem.category} | Difficulty: {selectedProblem.difficulty}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.5rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                  Problem Description:
                </label>
                <div style={{ background: "var(--bg-primary)", padding: "0.75rem", borderRadius: "6px", fontSize: "0.85rem", color: "#FFF" }}>
                  {selectedProblem.description}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                  Algorithmic Hint:
                </label>
                <div style={{ background: "var(--bg-primary)", padding: "0.75rem", borderRadius: "6px", fontSize: "0.85rem", color: "var(--neon-amber)" }}>
                  {selectedProblem.hint || "No hint provided."}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.2rem" }}>
                  Constraints:
                </label>
                <div style={{ background: "var(--bg-primary)", padding: "0.75rem", borderRadius: "6px", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  {selectedProblem.constraints || "Standard interview constraints."}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setSelectedProblem(null)} className="btn-neon-cyan" style={{ fontSize: "0.85rem", padding: "0.5rem 1.25rem" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safeguard Warning Modal */}
      {showWarningModal && (
        <div className="modal-overlay" onClick={() => setShowWarningModal(false)}>
          <div
            className="arena-card"
            style={{ maxWidth: "500px", width: "100%", padding: "2.5rem", textAlign: "center", border: "2px solid #FF5252" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>⚠️</div>
            <h2 style={{ fontSize: "1.5rem", color: "#FF5252", marginBottom: "0.5rem" }}>
              ACTION RESTRICTED BY SPECIFICATION
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
              Per Product Rule #2: <em>"The application must use ONLY the 191 problems from Striver's SDE Sheet. No randomly generated DSA questions, no AI replacement questions."</em>
            </p>
            <button onClick={() => setShowWarningModal(false)} className="btn-outline" style={{ width: "100%" }}>
              Acknowledge & Return
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
