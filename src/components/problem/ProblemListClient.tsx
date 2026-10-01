"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SdeProblem, SDE_CATEGORIES } from "@/data/sdeSheetProblems";
import { resetUserProgress } from "@/actions/auth";
import { getProblemPlatformInfo } from "@/lib/platform";
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
  ChevronDown,
  ChevronsUpDown,
  FolderOpen,
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

  // Set of expanded category names (initially empty so every dropdown starts closed)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Restore scroll position only when returning from a specific problem via hash
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (hash && hash.startsWith("#problem-")) {
      const targetProblemId = hash.replace("#problem-", "");
      const numId = parseInt(targetProblemId, 10);
      setHighlightedId(numId);

      // Find the problem and ensure its category is expanded
      const targetProb = problems.find((p) => p.id === numId);
      if (targetProb) {
        setExpandedCategories((prev) => {
          const next = new Set(prev);
          next.add(targetProb.category);
          return next;
        });
      }

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
  }, [problems]);

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

  const toggleCategoryCollapse = (catName: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) {
        next.delete(catName);
      } else {
        next.add(catName);
      }
      return next;
    });
  };

  const expandAllCategories = () => {
    const allCatNames = Array.from(categorized.keys());
    setExpandedCategories(new Set(allCatNames));
  };

  const collapseAllCategories = () => {
    setExpandedCategories(new Set());
  };

  const totalSolved = solvedSet.size;
  const progressPercent = Math.round((totalSolved / problems.length) * 100) || 0;

  return (
    <div className="app-container" style={{ padding: "3rem 1.5rem 6rem" }}>
      {/* 1. TOP MASTHEAD */}
      <div
        style={{
          paddingBottom: "2rem",
          borderBottom: "3px solid var(--border-neo-strong)",
          marginBottom: "2.5rem",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div className="pixel-kicker" style={{ marginBottom: "0.4rem" }}>
              // CURATED INTERVIEW ARCHIVE · STRIVER SDE 191
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
              191 SDE ROADMAP.
            </h1>
          </div>

          <div style={{ textAlign: "left", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.6rem" }}>
            <div>
              <div className="font-pixel" style={{ fontSize: "2.4rem", color: "var(--text-primary)", lineHeight: 1, textAlign: "left" }}>
                {totalSolved} <span style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>/ 191</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--accent-purple)", fontWeight: 800, textAlign: "left" }}>
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
                border: "2px solid rgba(255, 71, 87, 0.5)",
                color: "var(--accent-vermillion)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                fontWeight: 800,
                padding: "0.35rem 0.75rem",
                borderRadius: "6px",
                cursor: "pointer",
                textTransform: "uppercase",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(255, 71, 87, 0.12)";
                e.currentTarget.style.borderColor = "var(--accent-vermillion)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.borderColor = "rgba(255, 71, 87, 0.5)";
              }}
            >
              <RotateCcw size={13} /> Reset Progress
            </button>
          </div>
        </div>

        <div className="progress-bar-bg" style={{ marginTop: "1.5rem" }}>
          <div className="progress-bar-fill-purple" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
          marginBottom: "2.5rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "stretch" }}>
          {/* Search bar */}
          <div
            style={{
              flex: "1 1 240px",
              minWidth: "0",
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
                border: "2.5px solid var(--border-neo-strong)",
                borderRadius: "6px",
                padding: "0.85rem 1rem 0.85rem 2.8rem",
                color: "var(--text-primary)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.9rem",
                outline: "none",
                boxShadow: "3px 3px 0px var(--shadow-neo)",
              }}
            />
          </div>

          {/* Difficulty filter buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "0.35rem",
              flex: "1 1 260px",
            }}
          >
            {["ALL", "Easy", "Medium", "Hard"].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className="font-grotesk"
                style={{
                  background: selectedDifficulty === diff ? "var(--accent-purple)" : "var(--bg-surface)",
                  color: selectedDifficulty === diff ? "#FFF" : "var(--text-secondary)",
                  border: "2.5px solid var(--border-neo-strong)",
                  boxShadow: "2px 2px 0px var(--shadow-neo)",
                  padding: "0.6rem 0.4rem",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {diff.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Categories horizontal bar + Expand/Collapse All Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Topics ({SDE_CATEGORIES.length})
            </div>

            {/* Quick Accordion Utilities */}
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button
                onClick={expandAllCategories}
                className="font-mono"
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  border: "2px solid var(--border-neo-strong)",
                  boxShadow: "2px 2px 0px var(--shadow-neo)",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                EXPAND ALL
              </button>
              <button
                onClick={collapseAllCategories}
                className="font-mono"
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-primary)",
                  border: "2px solid var(--border-neo-strong)",
                  boxShadow: "2px 2px 0px var(--shadow-neo)",
                  padding: "0.35rem 0.65rem",
                  borderRadius: "4px",
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                COLLAPSE ALL
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              overflowX: "auto",
              paddingBottom: "0.4rem",
              width: "100%",
              minWidth: 0,
              scrollbarWidth: "none",
            }}
          >
            <button
              onClick={() => setSelectedCategory("ALL")}
              className="font-mono"
              style={{
                whiteSpace: "nowrap",
                flexShrink: 0,
                background: selectedCategory === "ALL" ? "var(--accent-purple)" : "var(--bg-surface)",
                color: selectedCategory === "ALL" ? "#FFF" : "var(--text-muted)",
                border: "2px solid var(--border-neo-strong)",
                boxShadow: "2px 2px 0px var(--shadow-neo)",
                padding: "0.45rem 0.85rem",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 800,
                cursor: "pointer",
                transition: "all 0.15s ease",
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
                    flexShrink: 0,
                    background: isSel ? "var(--accent-purple)" : "var(--bg-surface)",
                    color: isSel ? "#FFF" : "var(--text-muted)",
                    border: "2px solid var(--border-neo-strong)",
                    boxShadow: "2px 2px 0px var(--shadow-neo)",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {cat.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. CATEGORIES DROPDOWN ACCORDION CATALOG */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {Array.from(categorized.entries()).map(([catName, probList]) => {
          const solvedInCat = probList.filter((p) => solvedSet.has(p.id)).length;
          const isExpanded = expandedCategories.has(catName);
          const isAllDone = solvedInCat === probList.length && probList.length > 0;

          return (
            <div
              key={catName}
              style={{
                border: "3px solid var(--border-neo-strong)",
                borderRadius: "8px",
                background: "var(--bg-surface)",
                boxShadow: "5px 5px 0px var(--shadow-neo)",
                overflow: "hidden",
                transition: "all 0.15s ease",
              }}
            >
              {/* Clickable Dropdown Header */}
              <button
                type="button"
                onClick={() => toggleCategoryCollapse(catName)}
                aria-expanded={isExpanded}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: isAllDone ? "rgba(0, 245, 155, 0.12)" : "var(--bg-card)",
                  border: "none",
                  borderBottom: isExpanded ? "2.5px solid var(--border-neo-strong)" : "none",
                  padding: "1rem 1.4rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
                      transition: "transform 0.2s ease",
                      color: "var(--accent-purple)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronDown size={22} strokeWidth={3} />
                  </div>

                  <h2
                    className="font-grotesk"
                    style={{
                      fontSize: "1.25rem",
                      textTransform: "uppercase",
                      color: "var(--text-primary)",
                      fontWeight: 900,
                      margin: 0,
                    }}
                  >
                    {catName}
                  </h2>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      background: isAllDone ? "var(--accent-acid)" : "var(--accent-yellow)",
                      color: "#000000",
                      border: "2px solid #000000",
                      boxShadow: "2px 2px 0px #000000",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "4px",
                      fontWeight: 900,
                    }}
                  >
                    {solvedInCat} / {probList.length} SOLVED {isAllDone && "✓"}
                  </span>
                </div>
              </button>

              {/* Accordion Body: Problem Rows */}
              {isExpanded && (
                <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
                          border: isTarget ? "2.5px solid var(--accent-purple)" : undefined,
                          boxShadow: isTarget ? "0 0 20px var(--accent-purple-glow)" : undefined,
                          transition: "all 0.2s ease",
                        }}
                      >
                        {/* Left: Number & Title */}
                        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, minWidth: "260px" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "0.85rem",
                              fontWeight: 900,
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
                                color: isDone ? "var(--accent-acid)" : "var(--text-primary)",
                                fontWeight: 800,
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
                          {prob.leetcodeUrl && (() => {
                            const platformInfo = getProblemPlatformInfo(prob.leetcodeUrl);
                            return (
                              <a
                                href={prob.leetcodeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={platformInfo.btnClassName}
                                style={{
                                  fontSize: "0.75rem",
                                  padding: "0.45rem 0.85rem",
                                }}
                              >
                                {platformInfo.solveButtonText}
                              </a>
                            );
                          })()}

                          <Link
                            href={`/problems/${prob.id}`}
                            className="btn-editorial-outline"
                            style={{
                              fontSize: "0.75rem",
                              padding: "0.45rem 0.85rem",
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
              )}
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
              border: "3px solid var(--accent-vermillion)",
              boxShadow: "8px 8px 0px var(--shadow-neo)",
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
                  border: "2px solid var(--border-neo-strong)",
                  padding: "0.75rem 1rem",
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.9rem",
                  borderRadius: "6px",
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
