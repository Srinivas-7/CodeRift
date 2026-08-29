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
              LEETCODE SUBMISSION VERIFIER & XP CLAIM
            </h3>
          </div>
          <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.4rem" }}>
            <span>Target Handle:</span>
            {user?.leetcodeUsername ? (
              <a
                href={`https://leetcode.com/${user.leetcodeUsername}/`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  color: "#FFA116",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 700,
                  textDecoration: "underline",
                }}
              >
                @{user.leetcodeUsername} <ExternalLink size={12} />
              </a>
            ) : (
              <span style={{ color: "var(--accent-vermillion)" }}>
                No handle linked. Link your handle in{" "}
                <Link href="/profile" style={{ color: "var(--accent-cobalt)", textDecoration: "underline" }}>
                  Profile Settings
                </Link>{" "}
                to verify.
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            onClick={handleVerifySubmission}
            disabled={verifying}
            className="btn-editorial-primary"
            style={{
              padding: "0.9rem 1.8rem",
              cursor: verifying ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {verifying ? (
              <>
                <span className="spinner" style={{ display: "inline-block", width: "14px", height: "14px", border: "2px solid #FFF", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                QUERYING LEETCODE SUBMISSIONS...
              </>
            ) : (
              "VERIFY LEETCODE SUBMISSION & CLAIM XP"
            )}
          </button>

          {isSolved && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--accent-acid)", fontWeight: 700 }}>
              ✓ Problem cleared in database
            </span>
          )}
        </div>

        {verifying && (
          <div style={{ marginTop: "1rem", color: "var(--accent-cobalt)", fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
            ⚡ Connecting to LeetCode Public GraphQL API and checking recent submissions for @{user?.leetcodeUsername || "user"}...
          </div>
        )}

        {verifyResult && !verifyResult.success && (
          <div
            style={{
              background: "rgba(245, 158, 11, 0.06)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              padding: "1.35rem 1.6rem",
              borderRadius: "4px",
              marginTop: "1.5rem",
              lineHeight: 1.6,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "1.1rem" }}>⏳</span>
                <span className="font-grotesk" style={{ fontSize: "0.95rem", fontWeight: 800, textTransform: "uppercase", color: "var(--accent-amber)" }}>
                  NO ACCEPTED SUBMISSION FOUND YET
                </span>
              </div>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(255, 255, 255, 0.05)", padding: "0.2rem 0.6rem", borderRadius: "2px" }}>
                0 XP CLAIMED
              </span>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: "0.4rem 0 0.85rem 0" }}>
              {verifyResult.error}
            </p>

            <div
              style={{
                background: "var(--bg-primary)",
                border: "1px solid var(--border-editorial)",
                padding: "0.85rem 1rem",
                borderRadius: "2px",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: "1rem",
              }}
            >
              <div style={{ color: "#FFF", fontWeight: 700, marginBottom: "0.3rem" }}>HOW TO EARN YOUR XP:</div>
              <div>1. Click <strong style={{ color: "#FFA116" }}>"Solve on LeetCode"</strong> and submit your solution.</div>
              <div>2. Ensure LeetCode gives you a green <strong style={{ color: "var(--accent-acid)" }}>"Accepted"</strong> verdict.</div>
              <div>3. Return here and click <strong style={{ color: "var(--accent-cobalt)" }}>"Verify LeetCode Submission"</strong> to claim your XP!</div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <a
                href={leetcodeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-leetcode"
                style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
              >
                SOLVE ON LEETCODE ↗
              </a>
              <Link
                href="/profile"
                className="btn-editorial-outline"
                style={{ fontSize: "0.8rem", padding: "0.5rem 1rem", color: "var(--text-secondary)" }}
              >
                Change LeetCode Handle
              </Link>
            </div>
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
