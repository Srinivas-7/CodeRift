import { db } from "./db";

export interface GlobalDailyBatch {
  dayNumber: number;
  batchStartOrder: number;
  problems: any[];
  totalCount: number;
  isSeasonComplete: boolean;
  todayStr: string;
}

/**
 * Calculates today's global CodeRift Daily 3 problems strictly from
 * the 191 SDE Sheet dataset based on the current season calendar day.
 * 
 * Rules:
 * - Deterministic: Same date -> Same problems for ALL users.
 * - Reset at 12:00 AM UTC (5:30 AM IST).
 * - Day 1: Problems 1, 2, 3
 * - Day 2: Problems 4, 5, 6
 * - ...
 * - Day 63: Problems 187, 188, 189
 * - Day 64: Problems 190, 191 (exact 2 problems, no invented 3rd problem)
 * - Day > 64: Season 01 complete (no wrap-around)
 */
export async function getGlobalDailyProblemBatch(customDateStr?: string): Promise<GlobalDailyBatch> {
  const todayStr = customDateStr || new Date().toISOString().split("T")[0];

  // 1. Fetch active season
  let season: any = null;
  try {
    season = await db.season.findFirst({
      where: { isActive: true },
    });
  } catch (err) {
    console.warn("Could not fetch season for daily challenge:", err);
  }

  // Season anchor date in UTC (Default: 2026-09-01)
  let seasonStartDateStr = "2026-09-01";
  if (season?.startDate) {
    const raw = season.startDate;
    const startIso = raw instanceof Date ? raw.toISOString() : new Date(raw).toISOString();
    seasonStartDateStr = startIso.split("T")[0];
  }

  const todayDate = new Date(todayStr + "T00:00:00.000Z");
  const seasonStartDate = new Date(seasonStartDateStr + "T00:00:00.000Z");

  const diffTime = todayDate.getTime() - seasonStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const dayNumber = Math.max(1, diffDays + 1);

  // 2. Fetch all 191 problems ordered strictly by orderInSheet (1 to 191)
  const allProblems = await db.problem.findMany({
    orderBy: { orderInSheet: "asc" },
  });

  const totalProblems = allProblems.length; // 191
  const batchStartOrder = (dayNumber - 1) * 3 + 1;

  if (batchStartOrder > totalProblems) {
    return {
      dayNumber,
      batchStartOrder,
      problems: [],
      totalCount: 0,
      isSeasonComplete: true,
      todayStr,
    };
  }

  // Pick up to 3 consecutive problems for this exact SDE Sheet batch
  const batchProblems = allProblems.filter(
    (p: any) => p.orderInSheet >= batchStartOrder && p.orderInSheet < batchStartOrder + 3
  );

  return {
    dayNumber,
    batchStartOrder,
    problems: batchProblems,
    totalCount: batchProblems.length,
    isSeasonComplete: false,
    todayStr,
  };
}

export async function getOrCreateDailyChallenge(userId: string) {
  const batchInfo = await getGlobalDailyProblemBatch();
  const { dayNumber, problems: batchProblems, totalCount, isSeasonComplete, todayStr } = batchInfo;

  if (isSeasonComplete || totalCount === 0) {
    return {
      daily: null,
      problems: [],
      solvedCount: 0,
      totalCount: 0,
      dayNumber,
      isComplete: true,
      isSeasonComplete: true,
    };
  }

  const p1Id = batchProblems[0]?.id ?? null;
  const p2Id = batchProblems[1]?.id ?? null;
  const p3Id = batchProblems[2]?.id ?? null;

  // 1. Find or Upsert today's global daily challenge record for this user
  let daily = await db.dailyChallenge.findUnique({
    where: {
      userId_date: {
        userId,
        date: todayStr,
      },
    },
  });

  if (!daily) {
    daily = await db.dailyChallenge.upsert({
      where: {
        userId_date: {
          userId,
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
        date: todayStr,
        problem1Id: p1Id,
        problem2Id: p2Id,
        problem3Id: p3Id,
        completed: false,
      },
    });
  } else {
    // Ensure problem IDs are strictly synchronized with today's global challenge
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
    dayNumber,
    isComplete: isAllSolved || daily.completed,
    isSeasonComplete: false,
  };
}
