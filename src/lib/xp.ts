import { getProblemScore, DAILY_COMPLETION_BONUS } from "./scoring";

export interface XpBreakdown {
  baseXp: number;
  attemptXp?: number;
  firstSolveBonus?: number;
  dailyCompleteBonus?: number;
  challengeWinBonus?: number;
  totalXp: number;
  reasons: string[];
}

export function calculateProblemXp(params: {
  difficulty: "Easy" | "Medium" | "Hard" | string;
  status: "ATTEMPTED" | "SOLVED" | string;
  isFirstSolve?: boolean;
  isFirstTime?: boolean;
  isDailyChallengeProblem?: boolean;
}): XpBreakdown {
  const { difficulty, status } = params;
  const isFirst = params.isFirstSolve ?? params.isFirstTime ?? true;

  let baseXp = 0;
  const reasons: string[] = [];

  if (status === "SOLVED" && isFirst) {
    baseXp = getProblemScore(difficulty);
    reasons.push(`+${baseXp} PTS — ${difficulty} Problem Solved`);
  } else if (status === "SOLVED" && !isFirst) {
    reasons.push("0 PTS — Previously Solved (No Duplicate Points)");
  }

  const totalXp = baseXp;

  return {
    baseXp,
    totalXp,
    reasons,
  };
}

export const calculateXpGain = calculateProblemXp;

export function getLevelInfo(xp: number) {
  // Simple progressive leveling curve: Level = floor(sqrt(xp / 100)) + 1
  const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
  const currentLevelMinXp = Math.pow(level - 1, 2) * 100;
  const nextLevelMinXp = Math.pow(level, 2) * 100;
  const xpInCurrentLevel = xp - currentLevelMinXp;
  const xpNeededForLevel = nextLevelMinXp - currentLevelMinXp;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100))
  );

  return {
    level,
    currentLevelMinXp,
    nextLevelMinXp,
    xpInCurrentLevel,
    xpToNext: nextLevelMinXp - xp,
    progressPercent,
  };
}

export function calculateLevel(xp: number): number {
  return getLevelInfo(xp).level;
}
