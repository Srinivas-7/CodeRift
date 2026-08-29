export interface XpBreakdown {
  baseXp: number;
  attemptXp?: number;
  firstSolveBonus?: number;
  optimalBonus?: number;
  dailyCompleteBonus?: number;
  challengeWinBonus?: number;
  totalXp: number;
  reasons: string[];
}

export function calculateProblemXp(params: {
  difficulty: "Easy" | "Medium" | "Hard" | string;
  status: "ATTEMPTED" | "SOLVED" | "OPTIMAL" | string;
  isFirstSolve?: boolean;
  isFirstTime?: boolean;
  isOptimal?: boolean;
  isDailyChallengeProblem?: boolean;
}): XpBreakdown {
  const { difficulty, status } = params;
  const isFirst = params.isFirstSolve ?? params.isFirstTime ?? true;

  let baseXp = 0;
  const reasons: string[] = [];
  let attemptXp = 0;
  let firstSolveBonus = 0;
  let optimalBonus = 0;

  if (status === "ATTEMPTED") {
    attemptXp = 25;
    reasons.push("+25 XP — Valid Learning Attempt & Code Effort");
  } else {
    // Solved or Optimal
    if (difficulty === "Easy") baseXp = 100;
    else if (difficulty === "Hard") baseXp = 300;
    else baseXp = 200; // Medium

    reasons.push(`+${baseXp} XP — ${difficulty} Problem Solved`);

    if (status === "OPTIMAL" || params.isOptimal) {
      optimalBonus = 50;
      reasons.push("+50 XP — Optimal Time & Space Complexity Solution");
    }

    if (isFirst) {
      firstSolveBonus = 50;
      reasons.push("+50 XP — First Blood on this Sheet Problem");
    }
  }

  const totalXp = baseXp + attemptXp + firstSolveBonus + optimalBonus;

  return {
    baseXp,
    attemptXp: attemptXp > 0 ? attemptXp : undefined,
    firstSolveBonus: firstSolveBonus > 0 ? firstSolveBonus : undefined,
    optimalBonus: optimalBonus > 0 ? optimalBonus : undefined,
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
