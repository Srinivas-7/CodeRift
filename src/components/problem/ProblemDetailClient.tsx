"use client";

import { useState } from "react";
import { SdeProblem } from "@/data/sdeSheetProblems";
import { verifyAndCompleteLeetCodeSubmission } from "@/actions/submissions";
import Link from "next/link";
import {
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Zap,
  ArrowRight,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface ProblemDetailClientProps {
  problem: SdeProblem;
  user: any;
  isSolvedInitially?: boolean;
  userStatus?: string;
  previousSubmissions?: any[];
}

export function ProblemDetailClient({
  problem,
  user,
  isSolvedInitially = false,
  userStatus,
  previousSubmissions = [],
}: ProblemDetailClientProps) {
  const [isSolved, setIsSolved] = useState(isSolvedInitially || userStatus === "SOLVED" || userStatus === "OPTIMAL");
  const [showHint, setShowHint] = useState(false);
  const [showOptimal, setShowOptimal] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const leetcodeLink =
    problem.leetcodeUrl ||
    `https://leetcode.com/problemset/all/?search=${encodeURIComponent(problem.title)}`;

  const handleVerifySubmission = async () => {
    setVerifying(true);
    setVerifyResult(null);

    try {
      const res = await verifyAndCompleteLeetCodeSubmission({
        problemId: problem.id,
        leetcodeUsername: user?.leetcodeUsername || undefined,
      });

      setVerifying(false);
      setVerifyResult(res);

      if (res.success) {
        setIsSolved(true);
        setShowCelebration(true);
      }
    } catch (err: any) {
      setVerifying(false);
      setVerifyResult({
        success: false,
        error: err.message || "Failed to reach server. Please check your connection.",
      });
    }
  };

  return (
    <div className="app-container" style={{ padding: "3rem 1.5rem 6rem", maxWidth: "1100px" }}>
      {/* 1. TOP EDITORIAL BREADCRUMB & METADATA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          paddingBottom: "1.25rem",
          borderBottom: "1px solid var(--border-editorial)",
          marginBottom: "2.5rem",
        }}
      >
        <Link
          href="/dashboard"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            textDecoration: "none",
          }}
        >
          ← BACK TO DAILY MISSION
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="editorial-stamp" style={{ borderColor: "var(--border-editorial)", color: "var(--text-muted)" }}>
            SDE SHEET #{problem.orderInSheet}
          </span>
          <span
            className={
              problem.difficulty === "Easy"
                ? "badge-diff-easy"
                : problem.difficulty === "Hard"
                ? "badge-diff-hard"
                : "badge-diff-medium"
            }
          >
            {problem.difficulty}
          </span>
          {isSolved && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                color: "var(--accent-acid)",
                fontWeight: 700,
                border: "1px solid rgba(16, 185, 129, 0.4)",
                padding: "0.2rem 0.5rem",
                borderRadius: "2px",
              }}
            >
              ✓ COMPLETED
            </span>
          )}
        </div>
      </div>

      {/* 2. PROBLEM TITLE & EDITORIAL HEADER */}
      <div style={{ marginBottom: "3rem" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--accent-cobalt)", fontWeight: 800, marginBottom: "0.5rem" }}>
          [TOPIC: {problem.category.toUpperCase()}]
        </div>

        <h1
          className="font-serif"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 4.2rem)",
            fontWeight: 400,
            lineHeight: 1.05,
            color: "#FFFFFF",
            marginBottom: "1rem",
          }}
        >
          {problem.title}
        </h1>

        <div style={{ display: "flex", gap: "2rem", fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          <div>
            EXPECTED TIME: <strong style={{ color: "var(--text-primary)" }}>{problem.timeComplexity || "O(N)"}</strong>
          </div>
          <div>
            SPACE: <strong style={{ color: "var(--text-primary)" }}>{problem.spaceComplexity || "O(1)"}</strong>
          </div>
        </div>
      </div>

      {/* 3. PRIMARY ACTION: SOLVE ON LEETCODE BUTTON */}
      <div
        className="editorial-card"
        style={{
          padding: "2.5rem 2rem",
          background: "var(--bg-surface)",
          border: "2px solid var(--text-primary)",
          borderRadius: "4px",
          boxShadow: "12px 12px 0px rgba(33, 72, 255, 0.25)",
          marginBottom: "3rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem",
          }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "0.3rem" }}>
              EXTERNAL JUDGE & CODING PLATFORM
            </div>
            <h2 className="font-grotesk" style={{ fontSize: "1.4rem", textTransform: "uppercase", color: "#FFF" }}>
              OFFICIAL PROBLEM ENVIRONMENT
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", marginTop: "0.25rem" }}>
              Solve the problem directly on LeetCode. Once submitted and accepted, verify below to earn your XP.
            </p>
          </div>

          <a
            href={leetcodeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-leetcode"
            style={{
              padding: "1rem 2rem",
              fontSize: "1rem",
            }}
          >
            SOLVE ON LEETCODE ↗
          </a>
        </div>
      </div>

      {/* 4. LEETCODE SUBMISSION VERIFICATION HUD */}
      <div
        className="editorial-card"
        style={{
          padding: "2rem",
          background: "var(--bg-surface)",
          border: isSolved ? "1px solid var(--accent-acid)" : "1px solid var(--border-editorial-strong)",
          borderRadius: "4px",
          marginBottom: "3rem",
        }}
      >
        <div style={{ marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
            <Zap size={18} style={{ color: "var(--accent-cobalt)" }} />
            <h3 className="font-grotesk" style={{ fontSize: "1.2rem", textTransform: "uppercase", color: "#FFF" }}>
              VERIFY SUBMISSION & CLAIM XP
            </h3>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Connected LeetCode account:{" "}
            {user?.leetcodeUsername ? (
              <strong style={{ color: "#FFA116", fontFamily: "var(--font-mono)" }}>@{user.leetcodeUsername}</strong>
            ) : (
              <span style={{ color: "var(--accent-vermillion)" }}>No handle linked (Will verify via Arena telemetry)</span>
            )}
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={handleVerifySubmission}
            disabled={verifying}
            className="btn-editorial-primary"
            style={{
              padding: "0.9rem 1.8rem",
              cursor: verifying ? "wait" : "pointer",
            }}
          >
            {verifying ? "CHECKING SUBMISSION..." : "VERIFY LEETCODE SUBMISSION & CLAIM XP"}
          </button>

          {isSolved && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--accent-acid)", fontWeight: 700 }}>
              ✓ Problem cleared in database
            </span>
          )}
        </div>

        {verifyResult && !verifyResult.success && (
          <div style={{ color: "var(--accent-vermillion)", fontFamily: "var(--font-mono)", fontSize: "0.85rem", marginTop: "1rem" }}>
            ⚠️ {verifyResult.error}
          </div>
        )}
      </div>

      {/* 5. EDITORIAL ALGORITHMIC HINT & OPTIMAL COMPLEXITY MODULES */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Hint Accordion */}
        <div className="editorial-card" style={{ padding: "1.5rem" }}>
          <button
            onClick={() => setShowHint(!showHint)}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "none",
              border: "none",
              color: "var(--text-primary)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <HelpCircle size={18} style={{ color: "var(--accent-cobalt)" }} />
              <span className="font-grotesk" style={{ fontSize: "1.05rem", fontWeight: 700, textTransform: "uppercase" }}>
                ALGORITHMIC STRATEGY HINT
              </span>
            </div>
            {showHint ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showHint && (
            <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border-editorial)", paddingTop: "1rem" }}>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", lineHeight: 1.7 }}>
                {problem.description}
              </p>
              {problem.articleUrl && (
                <div style={{ marginTop: "1rem" }}>
                  <a
                    href={problem.articleUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      color: "var(--accent-cobalt)",
                      textDecoration: "none",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    Read Detailed Striver Article <BookOpen size={14} />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Optimal Complexity Accordion */}
        <div className="editorial-card" style={{ padding: "1.5rem" }}>
          <button
            onClick={() => setShowOptimal(!showOptimal)}
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "none",
              border: "none",
              color: "var(--text-primary)",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <Sparkles size={18} style={{ color: "var(--accent-amber)" }} />
              <span className="font-grotesk" style={{ fontSize: "1.05rem", fontWeight: 700, textTransform: "uppercase" }}>
                OPTIMAL COMPLEXITY CRITERIA
              </span>
            </div>
            {showOptimal ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showOptimal && (
            <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border-editorial)", paddingTop: "1rem" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
                <div>• Target Time Complexity: <strong style={{ color: "#FFF" }}>{problem.timeComplexity || "O(N) or optimal"}</strong></div>
                <div>• Auxiliary Space Complexity: <strong style={{ color: "#FFF" }}>{problem.spaceComplexity || "O(1) or optimal"}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. CELEBRATION MODAL OVERLAY */}
      {showCelebration && verifyResult && (
        <div className="modal-overlay" onClick={() => setShowCelebration(false)}>
          <div
            className="editorial-card"
            style={{
              maxWidth: "520px",
              width: "100%",
              padding: "3.5rem 2.5rem",
              textAlign: "center",
              background: "var(--bg-surface)",
              border: "2px solid var(--accent-acid)",
              borderRadius: "4px",
              boxShadow: "20px 20px 0px rgba(16, 185, 129, 0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: "1.5rem" }}>
              <span className="editorial-stamp" style={{ borderColor: "var(--accent-acid)", color: "var(--accent-acid)" }}>
                VERIFIED BY ARENA ENGINE
              </span>
            </div>

            <div className="font-serif" style={{ fontSize: "3.8rem", lineHeight: 0.95, color: "#FFFFFF", marginBottom: "0.5rem" }}>
              +{verifyResult.xpBreakdown?.totalXp || verifyResult.xpGained || (verifyResult.xpBreakdown?.baseXp ? (verifyResult.xpBreakdown.baseXp + (verifyResult.xpBreakdown.firstSolveBonus || 0)) : 150)} XP
            </div>

            <h2 className="font-grotesk" style={{ fontSize: "1.4rem", textTransform: "uppercase", color: "var(--accent-acid)", marginBottom: "1.5rem" }}>
              PROBLEM CLEARED // {problem.title}
            </h2>

            <div
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-editorial)",
                padding: "1.25rem",
                borderRadius: "2px",
                marginBottom: "2rem",
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                textAlign: "left",
              }}
            >
              <div style={{ color: "var(--text-muted)", marginBottom: "0.5rem", fontWeight: 700 }}>REWARD BREAKDOWN:</div>
              <div style={{ color: "#FFF", marginBottom: "0.25rem" }}>• Base Problem XP: +{verifyResult.xpBreakdown?.baseXp ?? 100} XP</div>
              {verifyResult.xpBreakdown?.firstSolveBonus ? (
                <div style={{ color: "var(--accent-amber)", marginBottom: "0.25rem" }}>• First Solve Bonus: +{verifyResult.xpBreakdown.firstSolveBonus} XP</div>
              ) : null}
              {verifyResult.xpBreakdown?.streakBonus ? (
                <div style={{ color: "var(--accent-acid)", marginBottom: "0.25rem" }}>• Streak Milestone Bonus: +{verifyResult.xpBreakdown.streakBonus} XP 🔥</div>
              ) : null}
              {verifyResult.isMissionComplete || verifyResult.dailyMissionComplete ? (
                <div style={{ color: "var(--accent-acid)", fontWeight: 700, marginTop: "0.4rem" }}>• DAILY MISSION COMPLETE BONUS: +100 XP 🎉</div>
              ) : null}
            </div>

            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <Link href="/dashboard" className="btn-editorial-primary">
                BACK TO DASHBOARD →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
