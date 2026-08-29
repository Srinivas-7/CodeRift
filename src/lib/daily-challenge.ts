import { db } from "./db";

export async function getOrCreateDailyChallenge(userId: string) {
  const todayStr = new Date().toISOString().split("T")[0];

  // 1. Get all solved problem IDs for user
  const solvedStatuses = await db.userProblemStatus.findMany({
    where: {
      userId,
      status: { in: ["SOLVED", "OPTIMAL"] },
    },
    select: { problemId: true },
  });

  const solvedIds = new Set(solvedStatuses.map((s) => s.problemId));

  // 2. Fetch all 191 problems ordered strictly by orderInSheet (1 to 191)
  const allProblems = await db.problem.findMany({
    orderBy: { orderInSheet: "asc" },
  });

  // 3. Determine the current SDE Sheet 3-problem batch
  // Find the lowest orderInSheet problem that is still unsolved
  const firstUnsolved = allProblems.find((p) => !solvedIds.has(p.id)) || allProblems[0];
  const lowestUnsolvedOrder = firstUnsolved.orderInSheet; // e.g. 1, 2, or 3 -> batch starts at 1

  // Batch index (1-based: 1, 4, 7, 10, 13, ...)
  const batchStartOrder = Math.floor((lowestUnsolvedOrder - 1) / 3) * 3 + 1;

  // Pick the 3 consecutive problems for this exact SDE Sheet batch
  const batchProblems = allProblems.filter(
    (p) => p.orderInSheet >= batchStartOrder && p.orderInSheet < batchStartOrder + 3
  );

  let sequentialNext3 = batchProblems;
  if (sequentialNext3.length < 3) {
    // If at the end of the 191 problems, fill remaining slots sequentially from the beginning
    const remainingCount = 3 - sequentialNext3.length;
    sequentialNext3 = [...sequentialNext3, ...allProblems.slice(0, remainingCount)];
  }

  // 4. Find or Upsert today's daily challenge
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
      update: {},
      create: {
        userId,
        date: todayStr,
        problem1Id: sequentialNext3[0].id,
        problem2Id: sequentialNext3[1].id,
        problem3Id: sequentialNext3[2].id,
        completed: false,
      },
    });
  } else if (!daily.completed) {
    // Sync today's active challenge to the exact current SDE Sheet batch
    daily = await db.dailyChallenge.update({
      where: { id: daily.id },
      data: {
        problem1Id: sequentialNext3[0].id,
        problem2Id: sequentialNext3[1].id,
        problem3Id: sequentialNext3[2].id,
      },
    });
  }

  // 5. Resolve problem details in exact ascending SDE sequence
  const problemIds = [daily.problem1Id, daily.problem2Id, daily.problem3Id];

  const problems = await db.problem.findMany({
    where: {
      id: { in: problemIds },
    },
  });

  const userStatuses = await db.userProblemStatus.findMany({
    where: {
      userId,
      problemId: { in: problemIds },
    },
  });

  const statusMap = new Map(userStatuses.map((s) => [s.problemId, s.status]));

  const problemList = problemIds
    .map((id) => problems.find((p) => p.id === id))
    .filter(Boolean)
    .map((p) => ({
      ...p!,
      userStatus: statusMap.get(p!.id) || "UNSOLVED",
      isSolved:
        statusMap.get(p!.id) === "SOLVED" ||
        statusMap.get(p!.id) === "OPTIMAL",
    }))
    .sort((a, b) => a.orderInSheet - b.orderInSheet);

  const solvedCount = problemList.filter((p) => p.isSolved).length;
  const isAllSolved = solvedCount === 3;

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
    totalCount: 3,
    isComplete: isAllSolved || daily.completed,
    date: todayStr,
    dayNumber: Math.floor((batchStartOrder - 1) / 3) + 1,
  };
}
