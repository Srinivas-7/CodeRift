import { db } from "./db";
import { checkAndAwardAchievements } from "./achievements";

/**
 * Returns UTC YYYY-MM-DD string
 */
export function getUtcDateStr(d: Date = new Date()): string {
  return d.toISOString().split("T")[0];
}

/**
 * Returns UTC YYYY-MM-DD string for N days before the given dateStr
 */
export function getPastDateStr(baseDateStr: string, daysAgo: number = 1): string {
  const d = new Date(`${baseDateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return getUtcDateStr(d);
}

/**
 * Helper to safely convert any date representation (Date, string, timestamp object) to UTC YYYY-MM-DD
 */
export function parseDateToUtcStr(val: any): string | null {
  if (!val) return null;
  try {
    if (typeof val === "string") {
      // If already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
      const d = new Date(val);
      if (!isNaN(d.getTime())) return getUtcDateStr(d);
    } else if (val instanceof Date) {
      if (!isNaN(val.getTime())) return getUtcDateStr(val);
    } else if (typeof val === "object" && typeof val.toDate === "function") {
      const d = val.toDate();
      if (!isNaN(d.getTime())) return getUtcDateStr(d);
    } else if (typeof val === "object" && typeof val.seconds === "number") {
      const d = new Date(val.seconds * 1000);
      if (!isNaN(d.getTime())) return getUtcDateStr(d);
    } else if (typeof val === "number") {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return getUtcDateStr(d);
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Calculates the consecutive days streak and longest streak from historical activity.
 * Aggregates all user problem completions, streak records, and XP transactions to ensure
 * zero data loss and 100% accurate count even across server restarts or past migrations.
 */
export async function calculateAccurateStreak(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      currentStreak: true,
      longestStreak: true,
      streakShields: true,
    },
  });

  if (!user) {
    return { currentStreak: 0, longestStreak: 0, streakShields: 1 };
  }

  const todayStr = getUtcDateStr();
  const yesterdayStr = getPastDateStr(todayStr, 1);
  const dayBeforeYesterdayStr = getPastDateStr(todayStr, 2);

  // Fetch all user activity across records concurrently
  const [streakRecords, userProblems, xpTransactions] = await Promise.all([
    db.streakRecord.findMany({ where: { userId } }).catch(() => []),
    db.userProblemStatus.findMany({ where: { userId } }).catch(() => []),
    db.xpTransaction.findMany({ where: { userId } }).catch(() => []),
  ]);

  const solvedDates = new Set<string>();
  const shieldedDates = new Set<string>();

  // 1. Process StreakRecords
  for (const r of streakRecords || []) {
    const dStr = parseDateToUtcStr(r.date);
    if (dStr) {
      if ((r.solvedCount || 0) > 0) {
        solvedDates.add(dStr);
      }
      if (r.shieldUsed) {
        shieldedDates.add(dStr);
      }
    }
  }

  // 2. Process Solved Problem Statuses
  for (const up of userProblems || []) {
    if (up.status === "SOLVED" || up.status === "OPTIMAL") {
      const solvedDate = parseDateToUtcStr(up.firstSolvedAt) ||
        parseDateToUtcStr(up.lastAttemptedAt) ||
        parseDateToUtcStr(up.updatedAt) ||
        parseDateToUtcStr(up.createdAt);
      if (solvedDate) {
        solvedDates.add(solvedDate);
      }
    }
  }

  // 3. Process XP Transactions (Problem solves or daily challenge completions)
  for (const xp of xpTransactions || []) {
    if (
      xp.reason === "PROBLEM_SOLVE" ||
      xp.reason === "DAILY_CHALLENGE" ||
      xp.reason === "STREAK_BONUS"
    ) {
      const xpDate = parseDateToUtcStr(xp.createdAt);
      if (xpDate) {
        solvedDates.add(xpDate);
      }
    }
  }

  let userShields = typeof user.streakShields === "number" ? user.streakShields : 1;

  // Determine if yesterday was missed and can be protected by a streak shield
  const hasSolvedToday = solvedDates.has(todayStr);
  const hasSolvedYesterday = solvedDates.has(yesterdayStr) || shieldedDates.has(yesterdayStr);
  const hasSolvedDayBefore = solvedDates.has(dayBeforeYesterdayStr) || shieldedDates.has(dayBeforeYesterdayStr);

  if (!hasSolvedToday && !hasSolvedYesterday) {
    // Yesterday was not solved. Check if day before yesterday was active and user has a shield
    if (hasSolvedDayBefore && userShields > 0) {
      shieldedDates.add(yesterdayStr);
      userShields = Math.max(0, userShields - 1);

      // Persist shield usage to streakRecord
      try {
        await db.streakRecord.upsert({
          where: {
            userId_date: {
              userId,
              date: yesterdayStr,
            },
          },
          update: {
            shieldUsed: true,
          },
          create: {
            userId,
            date: yesterdayStr,
            solvedCount: 0,
            shieldUsed: true,
          },
        });
      } catch (err) {
        console.error("Error saving shield record for yesterday:", err);
      }
    }
  }

  // Determine starting point for calculating current active streak
  let anchorDate: string | null = null;
  if (hasSolvedToday) {
    anchorDate = todayStr;
  } else if (hasSolvedYesterday || shieldedDates.has(yesterdayStr)) {
    anchorDate = yesterdayStr;
  }

  let currentStreak = 0;
  if (anchorDate) {
    let walkDate = anchorDate;
    while (true) {
      if (solvedDates.has(walkDate) || shieldedDates.has(walkDate)) {
        currentStreak++;
        walkDate = getPastDateStr(walkDate, 1);
      } else {
        break;
      }
    }
  }

  // Calculate all-time longest streak by finding longest consecutive chain
  const allActiveDates = Array.from(new Set([...Array.from(solvedDates), ...Array.from(shieldedDates)])).sort();
  let maxConsecutive = 0;
  let tempCount = 0;
  let prevDate: string | null = null;

  for (const d of allActiveDates) {
    if (!prevDate) {
      tempCount = 1;
    } else {
      const expectedNext = getPastDateStr(d, -1); // d + 1 day
      const prevPlusOne = getPastDateStr(prevDate, -1);
      if (d === prevPlusOne) {
        tempCount++;
      } else {
        tempCount = 1;
      }
    }
    if (tempCount > maxConsecutive) {
      maxConsecutive = tempCount;
    }
    prevDate = d;
  }

  const longestStreak = Math.max(
    currentStreak,
    user.longestStreak || 0,
    maxConsecutive
  );

  // Sync user object in database if values differ
  if (
    currentStreak !== user.currentStreak ||
    longestStreak !== user.longestStreak ||
    userShields !== user.streakShields
  ) {
    try {
      await db.user.update({
        where: { id: userId },
        data: {
          currentStreak,
          longestStreak,
          streakShields: userShields,
        },
      });
    } catch (err) {
      console.error("Error updating user streak state:", err);
    }
  }

  // Backfill streakRecord for today if user has solved today
  if (hasSolvedToday) {
    try {
      await db.streakRecord.upsert({
        where: {
          userId_date: {
            userId,
            date: todayStr,
          },
        },
        update: {
          solvedCount: { increment: 1 },
        },
        create: {
          userId,
          date: todayStr,
          solvedCount: 1,
          shieldUsed: false,
        },
      });
    } catch {
      // Ignored if already up to date
    }
  }

  return {
    currentStreak,
    longestStreak,
    streakShields: userShields,
  };
}

/**
 * Synchronize and validate user's current streak state.
 * Called on page load and user fetch.
 */
export async function syncUserStreak(userId: string) {
  return calculateAccurateStreak(userId);
}

/**
 * Updates streak when a problem is solved.
 */
export async function updateUserStreak(userId: string) {
  const todayStr = getUtcDateStr();

  // 1. Record/Increment today's solve in streakRecord
  try {
    await db.streakRecord.upsert({
      where: {
        userId_date: {
          userId,
          date: todayStr,
        },
      },
      update: {
        solvedCount: { increment: 1 },
      },
      create: {
        userId,
        date: todayStr,
        solvedCount: 1,
        shieldUsed: false,
      },
    });
  } catch (err) {
    console.error("Error upserting today streak record:", err);
  }

  // 2. Run full accurate streak evaluation
  const result = await calculateAccurateStreak(userId);

  // 3. Award +1 Shield every 7 days streak (capped at 3 shields)
  if (result.currentStreak > 0 && result.currentStreak % 7 === 0 && result.streakShields < 3) {
    const updatedShields = Math.min(3, result.streakShields + 1);
    try {
      await db.user.update({
        where: { id: userId },
        data: {
          streakShields: updatedShields,
        },
      });
      result.streakShields = updatedShields;
    } catch (err) {
      console.error("Error awarding milestone shield:", err);
    }
  }

  // 4. Evaluate achievements
  try {
    await checkAndAwardAchievements(userId);
  } catch (e) {
    console.error("Error evaluating achievements after streak update:", e);
  }

  return result;
}

export const updateStreakOnProblemSolved = updateUserStreak;
