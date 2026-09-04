/**
 * CodeRift Scoring System
 * 
 * Rules:
 * 1. Problem Completion Points:
 *    - Easy   → 10 points
 *    - Medium → 20 points
 *    - Hard   → 30 points
 *    Awarded exactly once per problem per user.
 * 
 * 2. Daily Completion Bonus:
 *    - Completing all available problems in today's daily batch → +20 bonus points.
 *    Awarded exactly once per daily challenge.
 * 
 * 3. Leaderboard Ranking:
 *    - Total Score (descending)
 *    - If tied, Problems Solved (descending)
 *    - If still tied, Username (alphabetical ascending)
 */

export const PROBLEM_POINTS: Record<"Easy" | "Medium" | "Hard", number> = {
  Easy: 10,
  Medium: 20,
  Hard: 30,
};

export const DAILY_COMPLETION_BONUS = 20;

export function getProblemScore(difficulty?: string | null): number {
  if (!difficulty) return PROBLEM_POINTS.Medium;
  const normalized = difficulty.trim().toLowerCase();
  if (normalized === "easy") return PROBLEM_POINTS.Easy;
  if (normalized === "hard") return PROBLEM_POINTS.Hard;
  return PROBLEM_POINTS.Medium;
}

export interface ScoreBreakdown {
  problemPoints: number;
  dailyBonusPoints: number;
  totalPoints: number;
  isFirstSolve: boolean;
  reasons: string[];
}

export function calculateScoreGain(params: {
  difficulty: string;
  isFirstSolve: boolean;
  isDailyBatchComplete?: boolean;
  isDailyBonusAlreadyAwarded?: boolean;
}): ScoreBreakdown {
  const {
    difficulty,
    isFirstSolve,
    isDailyBatchComplete = false,
    isDailyBonusAlreadyAwarded = false,
  } = params;

  let problemPoints = 0;
  let dailyBonusPoints = 0;
  const reasons: string[] = [];

  // 1. Problem Points (Awarded ONLY on first solve)
  if (isFirstSolve) {
    problemPoints = getProblemScore(difficulty);
    reasons.push(`+${problemPoints} PTS — ${difficulty} Problem Solved`);
  } else {
    reasons.push("0 PTS — Previously Solved Problem (No Duplicate Points)");
  }

  // 2. Daily Challenge Bonus (Awarded ONLY once when all daily problems are solved)
  if (isDailyBatchComplete && !isDailyBonusAlreadyAwarded) {
    dailyBonusPoints = DAILY_COMPLETION_BONUS;
    reasons.push(`+${dailyBonusPoints} PTS — Daily 3 Mission Complete Bonus 🎉`);
  }

  const totalPoints = problemPoints + dailyBonusPoints;

  return {
    problemPoints,
    dailyBonusPoints,
    totalPoints,
    isFirstSolve,
    reasons,
  };
}

/**
 * Determine problem phase based on SDE Sheet order:
 * Problems 1–96  → Phase 1
 * Problems 97–191 → Phase 2
 */
export function getProblemPhase(orderInSheet: number): 1 | 2 {
  return orderInSheet <= 96 ? 1 : 2;
}

/**
 * Deterministic 3-Tier Leaderboard Comparison:
 * 1. Total Score (descending)
 * 2. Problems Solved (descending)
 * 3. Username (ascending)
 */
export function compareLeaderboardRank(userA: any, userB: any): number {
  const scoreA = userA?.score ?? userA?.xp ?? 0;
  const scoreB = userB?.score ?? userB?.xp ?? 0;
  if (scoreB !== scoreA) {
    return scoreB - scoreA;
  }

  const solvedA = userA?.totalSolved || 0;
  const solvedB = userB?.totalSolved || 0;
  if (solvedB !== solvedA) {
    return solvedB - solvedA;
  }

  const nameA = (userA?.username || "").toLowerCase();
  const nameB = (userB?.username || "").toLowerCase();
  return nameA.localeCompare(nameB);
}

/**
 * Deterministic Phase-Specific Leaderboard Comparison:
 * - "phase1": phase1Score DESC > phase1Solved DESC > username ASC
 * - "phase2": phase2Score DESC > phase2Solved DESC > username ASC
 * - "overall": score DESC > totalSolved DESC > username ASC
 */
export function comparePhaseRank(userA: any, userB: any, phase: "overall" | "phase1" | "phase2" = "overall"): number {
  if (phase === "phase1") {
    const sA = userA?.phase1Score || 0;
    const sB = userB?.phase1Score || 0;
    if (sB !== sA) return sB - sA;
    const solA = userA?.phase1Solved || 0;
    const solB = userB?.phase1Solved || 0;
    if (solB !== solA) return solB - solA;
    return (userA?.username || "").toLowerCase().localeCompare((userB?.username || "").toLowerCase());
  }

  if (phase === "phase2") {
    const sA = userA?.phase2Score || 0;
    const sB = userB?.phase2Score || 0;
    if (sB !== sA) return sB - sA;
    const solA = userA?.phase2Solved || 0;
    const solB = userB?.phase2Solved || 0;
    if (solB !== solA) return solB - solA;
    return (userA?.username || "").toLowerCase().localeCompare((userB?.username || "").toLowerCase());
  }

  return compareLeaderboardRank(userA, userB);
}
