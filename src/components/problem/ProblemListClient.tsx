"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SdeProblem, SDE_CATEGORIES } from "@/data/sdeSheetProblems";
import { resetUserProgress } from "@/actions/auth";
import Link from "next/link";
import {
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  ArrowRight,
  Flame,
  Layers,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";

interface ProblemListClientProps {
  problems: SdeProblem[];
  solvedProblemIds: number[];
}

export function ProblemListClient({
  problems,
  solvedProblemIds,
}: ProblemListClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // Restore scroll position only when returning from a specific problem via hash
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (hash && hash.startsWith("#problem-")) {
      const targetProblemId = hash.replace("#problem-", "");
      const numId = parseInt(targetProblemId, 10);
      setHighlightedId(numId);

      const timer = setTimeout(() => {
        const el = document.getElementById(`problem-${targetProblemId}`);
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "instant" });
        }
        // Clean up hash from URL so switching tabs later starts at the top
        window.history.replaceState(null, "", window.location.pathname);
      }, 50);

      const highlightTimer = setTimeout(() => {
        setHighlightedId(null);
      }, 2500);

      return () => {
        clearTimeout(timer);
        clearTimeout(highlightTimer);
      };
    } else {
      // Direct tab navigation -> Always start at top
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, []);

  // Reset Progress Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetError, setResetError] = useState("");
  const [localSolvedIds, setLocalSolvedIds] = useState<number[]>(solvedProblemIds);

  const solvedSet = useMemo(() => new Set<number>(localSolvedIds), [localSolvedIds]);

  const handleResetProgress = async () => {
    if (resetConfirmInput.trim().toUpperCase() !== "RESET") {
      setResetError("Please type RESET to confirm.");
      return;
    }
    setIsResetting(true);
    setResetError("");

    try {
      const res = await resetUserProgress();
      if (res.success) {
        setLocalSolvedIds([]);
        setShowResetModal(false);
        setResetConfirmInput("");
        router.refresh();
      } else {
        setResetError(res.error || "Failed to reset progress.");
      }
    } catch (err: any) {
      setResetError(err.message || "Failed to communicate with server.");
    } finally {
      setIsResetting(false);
    }
  };

  // Filter problems
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.orderInSheet.toString() === searchQuery.trim();

      const matchesDiff =
        selectedDifficulty === "ALL" || p.difficulty === selectedDifficulty;

      const matchesCat =
        selectedCategory === "ALL" || p.category === selectedCategory;

      return matchesSearch && matchesDiff && matchesCat;
    });
  }, [problems, searchQuery, selectedDifficulty, selectedCategory]);

  // Group by category
  const categorized = useMemo(() => {
    const map = new Map<string, SdeProblem[]>();
    for (const prob of filteredProblems) {
      if (!map.has(prob.category)) {
        map.set(prob.category, []);
      }
      map.get(prob.category)!.push(prob);
    }
    return map;
  }, [filteredProblems]);

  const totalSolved = solvedSet.size;
  const progressPercent = Math.round((totalSolved / problems.length) * 100) || 0;

  return (
    <div className="app-container" style={{ padding: "3rem 1.5rem 6rem" }}>
      {/* 1. TOP EDITORIAL MASTHEAD */}
      <div
        style={{
          paddingBottom: "2rem",
          borderBottom: "1px solid var(--border-editorial)",
          marginBottom: "3rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <span className="editorial-stamp" style={{ borderColor: "var(--accent-cobalt)", color: "#FFF", marginBottom: "0.5rem" }}>
              CURATED INTERVIEW ARCHIVE
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
              191 SDE ROADMAP.
            </h1>
          </div>

          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.6rem" }}>
            <div>
              <div className="font-serif" style={{ fontSize: "2.4rem", color: "#FFF", lineHeight: 1 }}>
                {totalSolved} <span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>/ 191</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--accent-cobalt)", fontWeight: 700 }}>
                {progressPercent}% MASTERED
              </div>
            </div>

            <button
              onClick={() => {
                setResetConfirmInput("");
                setResetError("");
                setShowResetModal(true);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "transparent",
                border: "1px solid rgba(255, 55, 20, 0.4)",
                color: "var(--accent-vermillion)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 700,
                padding: "0.35rem 0.75rem",
                borderRadius: "2px",
                cursor: "pointer",
                textTransform: "uppercase",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255, 55, 20, 0.1)";
                e.currentTarget.style.borderColor = "var(--accent-vermillion)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(255, 55, 20, 0.4)";
              }}
            >
              <RotateCcw size={13} /> Reset Progress
            </button>
          </div>
        </div>

        <div className="progress-bar-bg" style={{ marginTop: "1.5rem" }}>
          <div className="progress-bar-fill-cobalt" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          marginBottom: "3.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {/* Search bar */}
          <div
            style={{
              flex: 1,
              minWidth: "280px",
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <Search
              size={18}
              style={{
                position: "absolute",
                left: "1rem",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Search problems, topics, or #number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-editorial)",
                borderRadius: "2px",
                padding: "0.85rem 1rem 0.85rem 2.8rem",
                color: "#FFFFFF",
                fontFamily: "var(--font-mono)",
                fontSize: "0.9rem",
                outline: "none",
              }}
            />
          </div>

          {/* Difficulty filter buttons */}
          <div style={{ display: "flex", gap: "0.4rem" }}>
            {["ALL", "Easy", "Medium", "Hard"].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className="font-grotesk"
                style={{
                  background: selectedDifficulty === diff ? "var(--accent-cobalt)" : "var(--bg-surface)",
                  color: selectedDifficulty === diff ? "#FFF" : "var(--text-secondary)",
                  border: "1px solid var(--border-editorial)",
                  padding: "0.6rem 1rem",
                  borderRadius: "2px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {diff.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Categories horizontal bar */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            overflowX: "auto",
            paddingBottom: "0.5rem",
          }}
        >
          <button
            onClick={() => setSelectedCategory("ALL")}
            className="font-mono"
            style={{
              whiteSpace: "nowrap",
              background: selectedCategory === "ALL" ? "var(--text-primary)" : "var(--bg-surface)",
              color: selectedCategory === "ALL" ? "var(--text-dark)" : "var(--text-muted)",
              border: "1px solid var(--border-editorial)",
              padding: "0.4rem 0.8rem",
              borderRadius: "2px",
              fontSize: "0.75rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            ALL TOPICS ({problems.length})
          </button>
          {SDE_CATEGORIES.map((cat) => {
            const isSel = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className="font-mono"
                style={{
                  whiteSpace: "nowrap",
                  background: isSel ? "var(--text-primary)" : "var(--bg-surface)",
                  color: isSel ? "var(--text-dark)" : "var(--text-muted)",
                  border: "1px solid var(--border-editorial)",
                  padding: "0.4rem 0.8rem",
                  borderRadius: "2px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {cat.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SCROLLYTELLING CATEGORIES CATALOG */}
      <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem" }}>
        {Array.from(categorized.entries()).map(([catName, probList]) => {
          const solvedInCat = probList.filter((p) => solvedSet.has(p.id)).length;

          return (
            <div key={catName}>
              {/* Category Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  paddingBottom: "0.75rem",
                  borderBottom: "1px solid var(--border-editorial-strong)",
                  marginBottom: "1rem",
                }}
              >
                <h2 className="font-grotesk" style={{ fontSize: "1.4rem", textTransform: "uppercase", color: "#FFF" }}>
                  {catName}
                </h2>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-cobalt)", fontWeight: 700 }}>
                  {solvedInCat} / {probList.length} COMPLETED
                </span>
              </div>

              {/* Problem Rows */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {probList.map((prob) => {
                  const isDone = solvedSet.has(prob.id);
                  const isTarget = highlightedId === prob.id;

                  return (
                    <div
                      key={prob.id}
                      id={`problem-${prob.id}`}
                      className={`problem-row-item ${isDone ? "is-solved" : ""}`}
                      style={{
                        scrollMarginTop: "120px",
                        border: isTarget ? "1px solid var(--accent-cobalt)" : undefined,
                        boxShadow: isTarget ? "0 0 20px rgba(33, 72, 255, 0.45)" : undefined,
                        transition: "all 0.3s ease",
                      }}
                    >
                      {/* Left: Number & Title */}
                      <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: "260px" }}>
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "0.85rem",
                            fontWeight: 800,
                            color: isDone ? "var(--accent-acid)" : "var(--text-muted)",
                            width: "48px",
                          }}
                        >
                          #{prob.orderInSheet.toString().padStart(3, "0")}
                        </span>

                        <div>
                          <Link
                            href={`/problems/${prob.id}`}
                            style={{
                              color: isDone ? "var(--accent-acid)" : "#FFF",
                              fontWeight: 600,
                              fontSize: "1.05rem",
                              textDecoration: "none",
                            }}
                          >
                            {prob.title}
                          </Link>
                        </div>

                        <span
                          className={
                            prob.difficulty === "Easy"
                              ? "badge-diff-easy"
                              : prob.difficulty === "Hard"
                              ? "badge-diff-hard"
                              : "badge-diff-medium"
                          }
                        >
                          {prob.difficulty}
                        </span>
                      </div>

                      {/* Right: Actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        {prob.leetcodeUrl && (
                          <a
                            href={prob.leetcodeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-leetcode"
                            style={{
                              fontSize: "0.75rem",
                              padding: "0.4rem 0.8rem",
                            }}
                          >
                            SOLVE ON LEETCODE ↗
                          </a>
                        )}

                        <Link
                          href={`/problems/${prob.id}`}
                          className="btn-editorial-outline"
                          style={{
                            fontSize: "0.75rem",
                            padding: "0.4rem 0.8rem",
                            color: isDone ? "var(--accent-acid)" : "var(--text-primary)",
                          }}
                        >
                          {isDone ? "✓ Cleared" : "Verify →"}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* RESET PROGRESS CONFIRMATION MODAL */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div
            className="editorial-card"
            style={{
              maxWidth: "500px",
              width: "100%",
              padding: "2.5rem 2rem",
              background: "var(--bg-surface)",
              border: "2px solid var(--accent-vermillion)",
              boxShadow: "16px 16px 0px rgba(255, 55, 20, 0.25)",
              textAlign: "left",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "var(--accent-vermillion)", marginBottom: "1rem" }}>
              <AlertTriangle size={24} />
              <span className="font-grotesk" style={{ fontSize: "1.2rem", fontWeight: 800, textTransform: "uppercase" }}>
                RESET ENTIRE PROGRESS?
              </span>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1.25rem" }}>
              This will permanently wipe all your <strong>solved problems</strong>, <strong>streaks</strong>, <strong>XP</strong>, and <strong>daily missions</strong> back to Day 1 (0 / 191). This action cannot be reversed.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                Type <strong style={{ color: "var(--accent-vermillion)" }}>RESET</strong> to confirm:
              </label>
              <input
                type="text"
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                placeholder="Type RESET here..."
                autoFocus
                style={{
                  width: "100%",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-editorial-strong)",
                  padding: "0.75rem 1rem",
                  color: "#FFF",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.9rem",
                  borderRadius: "2px",
                  outline: "none",
                }}
              />
            </div>

            {resetError && (
              <div style={{ color: "var(--accent-vermillion)", fontSize: "0.85rem", marginBottom: "1rem", fontFamily: "var(--font-mono)" }}>
                {resetError}
              </div>
            )}

            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowResetModal(false)}
                className="btn-editorial-outline"
                style={{ fontSize: "0.8rem", padding: "0.6rem 1.2rem" }}
                disabled={isResetting}
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                disabled={resetConfirmInput.trim().toUpperCase() !== "RESET" || isResetting}
                className="btn-editorial-vermillion"
                style={{
                  fontSize: "0.8rem",
                  padding: "0.6rem 1.2rem",
                  opacity: resetConfirmInput.trim().toUpperCase() !== "RESET" || isResetting ? 0.4 : 1,
                  cursor: resetConfirmInput.trim().toUpperCase() !== "RESET" || isResetting ? "not-allowed" : "pointer",
                }}
              >
                {isResetting ? "Wiping..." : "CONFIRM RESET"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
