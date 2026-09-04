/**
 * CodeRift Team Phase Architecture
 * 
 * Rules:
 * - Every team has its own competition timeline starting on creator-selected "Phase 1 Start Date".
 * - Phase 1: 32 days, Problems 1–96 (Day 1..32: 3 problems/day = 96 problems).
 * - Phase 2: 32 days, Problems 97–191 (Day 1..31: 3 problems/day = 93 problems, Day 32: Problems 190–191 = 2 problems).
 * - Total: 64 days, 191 problems.
 * - Reset boundary: 5:30 AM IST (12:00 AM UTC).
 * - Deterministic: Same team + same day -> identical Daily 3 for all team members.
 */

import { db } from "./db";
import { SDE_SHEET_PROBLEMS, SdeProblem } from "@/data/sdeSheetProblems";

export type PhaseStatus = "NOT_STARTED" | "PHASE_1_ACTIVE" | "PHASE_1_COMPLETE" | "PHASE_2_ACTIVE" | "COMPLETED";

export interface TeamPhaseInfo {
  phase1StartDate: string;
  phase1EndDate: string;
  phase2StartDate: string;
  phase2EndDate: string;
  currentPhase: 1 | 2;
  phaseDay: number; // 1 to 32
  overallDay: number; // 1 to 64
  status: PhaseStatus;
  isPhase1Complete: boolean;
  isPhase2Complete: boolean;
  isCompetitionComplete: boolean;
  daysUntilStart: number;
  todayStr: string;
  nextResetIso: string;
}

export interface TeamDailyBatch {
  phase: 1 | 2;
  phaseDay: number;
  overallDay: number;
  batchStartOrder: number;
  problems: SdeProblem[];
  totalCount: number;
  isCompetitionComplete: boolean;
  status: PhaseStatus;
  todayStr: string;
  nextResetIso: string;
  phase1StartDate: string;
  phase1EndDate: string;
  phase2StartDate: string;
  phase2EndDate: string;
  groupId?: string | null;
  groupName?: string | null;
}

/**
 * Format a Date object to YYYY-MM-DD UTC string
 */
export function formatDateToUtcStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

/**
 * Add days to a YYYY-MM-DD string in UTC
 */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDateToUtcStr(d);
}

/**
 * Calculate team phase metadata based on its Phase 1 start date
 */
export function calculateTeamPhaseInfo(
  phase1StartDateInput?: string | Date | null,
  customDateStr?: string
): TeamPhaseInfo {
  const now = new Date();
  const todayStr = customDateStr || formatDateToUtcStr(now);

  // Normalize Phase 1 start date
  let phase1StartDateStr = "2026-09-01";
  if (phase1StartDateInput) {
    if (phase1StartDateInput instanceof Date) {
      phase1StartDateStr = formatDateToUtcStr(phase1StartDateInput);
    } else if (typeof phase1StartDateInput === "string") {
      phase1StartDateStr = phase1StartDateInput.split("T")[0];
    }
  }

  // Phase Boundaries (Inclusive):
  // Phase 1: Day 1 (start) to Day 32 (start + 31 days)
  // Phase 2: Day 1 (start + 32 days) to Day 32 (start + 63 days)
  const phase1EndDateStr = addDaysToDateStr(phase1StartDateStr, 31);
  const phase2StartDateStr = addDaysToDateStr(phase1StartDateStr, 32);
  const phase2EndDateStr = addDaysToDateStr(phase1StartDateStr, 63);

  const todayDate = new Date(`${todayStr}T00:00:00.000Z`);
  const startDate = new Date(`${phase1StartDateStr}T00:00:00.000Z`);

  const diffTime = todayDate.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); // 0-indexed day offset

  // Next reset time at 00:00:00 UTC of next day (5:30 AM IST)
  const nextReset = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  const nextResetIso = nextReset.toISOString();

  let status: PhaseStatus = "NOT_STARTED";
  let currentPhase: 1 | 2 = 1;
  let phaseDay = 1;
  let overallDay = 1;
  let isPhase1Complete = false;
  let isPhase2Complete = false;
  let isCompetitionComplete = false;
  let daysUntilStart = 0;

  if (diffDays < 0) {
    // Before Phase 1 start
    status = "NOT_STARTED";
    currentPhase = 1;
    phaseDay = 1;
    overallDay = 1;
    daysUntilStart = Math.abs(diffDays);
  } else if (diffDays < 32) {
    // Phase 1 Active (Day 1 to 32)
    status = "PHASE_1_ACTIVE";
    currentPhase = 1;
    phaseDay = diffDays + 1; // 1..32
    overallDay = diffDays + 1; // 1..32
    isPhase1Complete = false;
  } else if (diffDays < 64) {
    // Phase 2 Active (Day 33 to 64, which is Phase 2 Day 1 to 32)
    status = "PHASE_2_ACTIVE";
    currentPhase = 2;
    phaseDay = diffDays - 32 + 1; // 1..32
    overallDay = diffDays + 1; // 33..64
    isPhase1Complete = true;
    isPhase2Complete = false;
  } else {
    // Competition Complete (Day > 64)
    status = "COMPLETED";
    currentPhase = 2;
    phaseDay = 32;
    overallDay = 64;
    isPhase1Complete = true;
    isPhase2Complete = true;
    isCompetitionComplete = true;
  }

  return {
    phase1StartDate: phase1StartDateStr,
    phase1EndDate: phase1EndDateStr,
    phase2StartDate: phase2StartDateStr,
    phase2EndDate: phase2EndDateStr,
    currentPhase,
    phaseDay,
    overallDay,
    status,
    isPhase1Complete,
    isPhase2Complete,
    isCompetitionComplete,
    daysUntilStart,
    todayStr,
    nextResetIso,
  };
}

/**
 * Resolves the exact problems for a team's current phase day
 */
export async function getTeamDailyProblemBatch(
  teamOrStartDate?: any,
  customDateStr?: string
): Promise<TeamDailyBatch> {
  let startDateInput: string | Date | null = null;
  let groupId: string | null = null;
  let groupName: string | null = null;

  if (teamOrStartDate) {
    if (typeof teamOrStartDate === "string" || teamOrStartDate instanceof Date) {
      startDateInput = teamOrStartDate;
    } else if (typeof teamOrStartDate === "object") {
      startDateInput = teamOrStartDate.phase1StartDate || teamOrStartDate.createdAt;
      groupId = teamOrStartDate.id || null;
      groupName = teamOrStartDate.name || null;
    }
  }

  const phaseInfo = calculateTeamPhaseInfo(startDateInput, customDateStr);
  const { currentPhase, phaseDay, overallDay, status, isCompetitionComplete, todayStr, nextResetIso, phase1StartDate, phase1EndDate, phase2StartDate, phase2EndDate } = phaseInfo;

  // Problem Sequence Calculation:
  // Phase 1 (Problems 1–96):
  // - Day 1: 1, 2, 3
  // - Day 2: 4, 5, 6
  // - ...
  // - Day 32: 94, 95, 96 -> batchStartOrder = (phaseDay - 1) * 3 + 1
  //
  // Phase 2 (Problems 97–191):
  // - Day 1: 97, 98, 99
  // - Day 2: 100, 101, 102
  // - ...
  // - Day 31: 187, 188, 189
  // - Day 32: 190, 191 (exact 2 problems) -> batchStartOrder = 96 + (phaseDay - 1) * 3 + 1

  let batchStartOrder = 1;
  let expectedCount = 3;

  if (currentPhase === 1) {
    batchStartOrder = (phaseDay - 1) * 3 + 1;
    expectedCount = 3;
  } else {
    batchStartOrder = 96 + (phaseDay - 1) * 3 + 1;
    if (phaseDay === 32) {
      expectedCount = 2; // Problems 190 and 191
    } else {
      expectedCount = 3;
    }
  }

  if (isCompetitionComplete) {
    return {
      phase: 2,
      phaseDay: 32,
      overallDay: 64,
      batchStartOrder: 190,
      problems: [],
      totalCount: 0,
      isCompetitionComplete: true,
      status: "COMPLETED",
      todayStr,
      nextResetIso,
      phase1StartDate,
      phase1EndDate,
      phase2StartDate,
      phase2EndDate,
      groupId,
      groupName,
    };
  }

  // Retrieve matching problems strictly ordered by orderInSheet
  const batchProblems = SDE_SHEET_PROBLEMS.filter(
    (p) => p.orderInSheet >= batchStartOrder && p.orderInSheet < batchStartOrder + expectedCount
  );

  return {
    phase: currentPhase,
    phaseDay,
    overallDay,
    batchStartOrder,
    problems: batchProblems,
    totalCount: batchProblems.length,
    isCompetitionComplete: false,
    status,
    todayStr,
    nextResetIso,
    phase1StartDate,
    phase1EndDate,
    phase2StartDate,
    phase2EndDate,
    groupId,
    groupName,
  };
}

/**
 * Gets or creates the user's daily challenge tied to their team's clock
 */
export async function getOrCreateDailyChallenge(userId: string, groupIdInput?: string | null) {
  let group: any = null;

  if (groupIdInput) {
    group = await db.group.findUnique({
      where: { id: groupIdInput },
    });
  }

  if (!group && groupIdInput === undefined) {
    // Find user's primary group membership only if groupId was not explicitly provided
    const membership = await db.groupMember.findFirst({
      where: { userId },
      include: { group: true },
    });
    if (membership?.group) {
      group = membership.group;
    }
  }

  // If user has no squad, fallback to user's creation date as anchor
  let teamAnchor: any = group;
  if (!teamAnchor) {
    const user = await db.user.findUnique({ where: { id: userId } });
    teamAnchor = {
      phase1StartDate: user?.createdAt ? formatDateToUtcStr(new Date(user.createdAt)) : "2026-09-01",
    };
  }

  const batchInfo = await getTeamDailyProblemBatch(teamAnchor);
  const { phase, phaseDay, overallDay, problems: batchProblems, totalCount, isCompetitionComplete, todayStr, nextResetIso, phase1StartDate, phase1EndDate, phase2StartDate, phase2EndDate } = batchInfo;

  if (isCompetitionComplete || totalCount === 0) {
    return {
      daily: null,
      problems: [],
      solvedCount: 0,
      totalCount: 0,
      dayNumber: overallDay,
      phase,
      phaseDay,
      overallDay,
      isComplete: true,
      isCompetitionComplete: true,
      todayStr,
      nextResetIso,
      phase1StartDate,
      phase1EndDate,
      phase2StartDate,
      phase2EndDate,
      group,
    };
  }

  const p1Id = batchProblems[0]?.id ?? null;
  const p2Id = batchProblems[1]?.id ?? null;
  const p3Id = batchProblems[2]?.id ?? null;

  // 1. Find or Upsert today's daily challenge record for this user and squad
  const targetGroupId = group?.id || null;
  let daily = await db.dailyChallenge.findUnique({
    where: {
      userId_groupId_date: {
        userId,
        groupId: targetGroupId,
        date: todayStr,
      },
    },
  });

  if (!daily) {
    daily = await db.dailyChallenge.upsert({
      where: {
        userId_groupId_date: {
          userId,
          groupId: targetGroupId,
          date: todayStr,
        },
      },
      update: {
        problem1Id: p1Id,
        problem2Id: p2Id,
        problem3Id: p3Id,
      },
      create: {
        userId,
        groupId: targetGroupId,
        date: todayStr,
        problem1Id: p1Id,
        problem2Id: p2Id,
        problem3Id: p3Id,
        completed: false,
      },
    });
  } else {
    // Ensure problem IDs match team's current batch
    if (
      daily.problem1Id !== p1Id ||
      daily.problem2Id !== p2Id ||
      daily.problem3Id !== p3Id
    ) {
      daily = await db.dailyChallenge.update({
        where: { id: daily.id },
        data: {
          problem1Id: p1Id,
          problem2Id: p2Id,
          problem3Id: p3Id,
        },
      });
    }
  }

  // 2. Fetch User problem statuses for today's batch
  const problemIds = [p1Id, p2Id, p3Id].filter(
    (id): id is number => id !== null && id !== undefined && id > 0
  );

  const userStatuses = await db.userProblemStatus.findMany({
    where: {
      userId,
      problemId: { in: problemIds },
    },
  });

  const statusMap = new Map((userStatuses || []).map((s: any) => [s.problemId, s.status]));

  const problemList = batchProblems.map((p: any) => {
    const status = statusMap.get(p.id) || "UNSOLVED";
    return {
      ...p,
      userStatus: status,
      isSolved: status === "SOLVED" || status === "OPTIMAL",
    };
  });

  const solvedCount = problemList.filter((p: any) => p.isSolved).length;
  const isAllSolved = totalCount > 0 && solvedCount === totalCount;

  if (isAllSolved && !daily.completed) {
    daily = await db.dailyChallenge.update({
      where: { id: daily.id },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });
  }

  return {
    daily,
    problems: problemList,
    solvedCount,
    totalCount,
    dayNumber: overallDay,
    phase,
    phaseDay,
    overallDay,
    isComplete: isAllSolved || daily.completed,
    isCompetitionComplete: false,
    todayStr,
    nextResetIso,
    phase1StartDate,
    phase1EndDate,
    phase2StartDate,
    phase2EndDate,
    group,
  };
}

/**
 * Deterministically calculates Phase 1, Phase 2, and Overall Winners for a squad
 */
export function calculatePhaseWinners(members: any[]) {
  if (!members || members.length === 0) {
    return {
      phase1Winner: null,
      phase2Winner: null,
      overallWinner: null,
    };
  }

  const getUser = (item: any) => item?.user || item;

  // Phase 1: Rank by phase1Score DESC, phase1Solved DESC, username ASC
  const phase1Sorted = [...members].sort((a, b) => {
    const uA = getUser(a);
    const uB = getUser(b);
    const sA = uA?.phase1Score || 0;
    const sB = uB?.phase1Score || 0;
    if (sB !== sA) return sB - sA;
    const solA = uA?.phase1Solved || 0;
    const solB = uB?.phase1Solved || 0;
    if (solB !== solA) return solB - solA;
    return (uA?.username || "").localeCompare(uB?.username || "");
  });

  // Phase 2: Rank by phase2Score DESC, phase2Solved DESC, username ASC
  const phase2Sorted = [...members].sort((a, b) => {
    const uA = getUser(a);
    const uB = getUser(b);
    const sA = uA?.phase2Score || 0;
    const sB = uB?.phase2Score || 0;
    if (sB !== sA) return sB - sA;
    const solA = uA?.phase2Solved || 0;
    const solB = uB?.phase2Solved || 0;
    if (solB !== solA) return solB - solA;
    return (uA?.username || "").localeCompare(uB?.username || "");
  });

  // Overall: Rank by totalScore DESC, totalSolved DESC, username ASC
  const overallSorted = [...members].sort((a, b) => {
    const uA = getUser(a);
    const uB = getUser(b);
    const sA = uA?.score ?? uA?.xp ?? 0;
    const sB = uB?.score ?? uB?.xp ?? 0;
    if (sB !== sA) return sB - sA;
    const solA = uA?.totalSolved || 0;
    const solB = uB?.totalSolved || 0;
    if (solB !== solA) return solB - solA;
    return (uA?.username || "").localeCompare(uB?.username || "");
  });

  return {
    phase1Winner: phase1Sorted[0] ? getUser(phase1Sorted[0]) : null,
    phase2Winner: phase2Sorted[0] ? getUser(phase2Sorted[0]) : null,
    overallWinner: overallSorted[0] ? getUser(overallSorted[0]) : null,
  };
}
