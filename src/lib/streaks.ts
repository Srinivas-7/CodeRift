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
 * Synchronize and validate user's current streak state.
 * Automatically handles streak expiration or streak shield consumption for missed days.
 */
export async function syncUserStreak(userId: string) {
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

  // Check today's record
  const todayRecord = await db.streakRecord.findUnique({
    where: {
      userId_date: {
        userId,
        date: todayStr,
      },
    },
  });

  // If user already solved today, streak is valid and active
  if (todayRecord && todayRecord.solvedCount > 0) {
    const currentStreak = Math.max(1, user.currentStreak || 1);
    const longestStreak = Math.max(currentStreak, user.longestStreak || 0);
    if (currentStreak !== user.currentStreak || longestStreak !== user.longestStreak) {
      await db.user.update({
        where: { id: userId },
        data: { currentStreak, longestStreak },
      });
    }
    return {
      currentStreak,
      longestStreak,
      streakShields: user.streakShields ?? 1,
    };
  }

  // If user hasn't solved today yet, check yesterday
  const yesterdayRecord = await db.streakRecord.findUnique({
    where: {
      userId_date: {
        userId,
        date: yesterdayStr,
      },
    },
  });

  // If yesterday was active (solved or shielded), streak is valid and pending today's solve
  if (yesterdayRecord && (yesterdayRecord.solvedCount > 0 || yesterdayRecord.shieldUsed)) {
    return {
      currentStreak: user.currentStreak ?? 0,
      longestStreak: user.longestStreak ?? 0,
      streakShields: user.streakShields ?? 1,
    };
  }

  // If yesterday was NOT active, check if user had a streak and can use a shield
  if ((user.currentStreak || 0) > 0) {
    const dayBeforeRecord = await db.streakRecord.findUnique({
      where: {
        userId_date: {
          userId,
          date: dayBeforeYesterdayStr,
        },
      },
    });

    const isDayBeforeActive = dayBeforeRecord && (dayBeforeRecord.solvedCount > 0 || dayBeforeRecord.shieldUsed);

    // If day before was active and user has a shield, protect yesterday with a shield!
    if (isDayBeforeActive && (user.streakShields || 0) > 0) {
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

      const updatedShields = Math.max(0, (user.streakShields || 0) - 1);
      await db.user.update({
        where: { id: userId },
        data: {
          streakShields: updatedShields,
        },
      });

      return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        streakShields: updatedShields,
      };
    }

    // Otherwise, streak expired
    await db.user.update({
      where: { id: userId },
      data: { currentStreak: 0 },
    });

    return {
      currentStreak: 0,
      longestStreak: user.longestStreak ?? 0,
      streakShields: user.streakShields ?? 1,
    };
  }

  return {
    currentStreak: 0,
    longestStreak: user.longestStreak ?? 0,
    streakShields: user.streakShields ?? 1,
  };
}

/**
 * Updates streak when a problem is solved.
 */
export async function updateUserStreak(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      currentStreak: true,
      longestStreak: true,
      streakShields: true,
    },
  });

  if (!user) return { currentStreak: 0, longestStreak: 0, streakShields: 1 };

  const todayStr = getUtcDateStr();
  const yesterdayStr = getPastDateStr(todayStr, 1);
  const dayBeforeYesterdayStr = getPastDateStr(todayStr, 2);

  // Check today's streak record
  let todayRecord = await db.streakRecord.findUnique({
    where: {
      userId_date: {
        userId,
        date: todayStr,
      },
    },
  });

  if (!todayRecord || todayRecord.solvedCount === 0) {
    // First solve of today!
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

    // Check yesterday's activity
    const yesterdayRecord = await db.streakRecord.findUnique({
      where: {
        userId_date: {
          userId,
          date: yesterdayStr,
        },
      },
    });

    let currentShields = user.streakShields ?? 1;
    let newStreak = 1;

    if (yesterdayRecord && (yesterdayRecord.solvedCount > 0 || yesterdayRecord.shieldUsed)) {
      newStreak = (user.currentStreak || 0) + 1;
    } else if ((user.currentStreak || 0) > 0 && currentShields > 0) {
      // Check if day before yesterday was active
      const dayBeforeRecord = await db.streakRecord.findUnique({
        where: {
          userId_date: {
            userId,
            date: dayBeforeYesterdayStr,
          },
        },
      });

      if (dayBeforeRecord && (dayBeforeRecord.solvedCount > 0 || dayBeforeRecord.shieldUsed)) {
        // Shield protects yesterday
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

        currentShields = Math.max(0, currentShields - 1);
        newStreak = (user.currentStreak || 0) + 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const newLongest = Math.max(newStreak, user.longestStreak || 0);

    // Award +1 Shield every 7 days streak (capped at 3 shields)
    let shieldsToAdd = 0;
    if (newStreak > 0 && newStreak % 7 === 0 && currentShields < 3) {
      shieldsToAdd = 1;
    }

    const finalShields = Math.min(3, currentShields + shieldsToAdd);

    await db.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        streakShields: finalShields,
      },
    });

    // Evaluate achievements
    try {
      await checkAndAwardAchievements(userId);
    } catch (e) {
      console.error("Error evaluating achievements after streak update:", e);
    }

    return {
      currentStreak: newStreak,
      longestStreak: newLongest,
      streakShields: finalShields,
    };
  } else {
    // Already solved today, increment solved count for today's record
    await db.streakRecord.update({
      where: {
        userId_date: {
          userId,
          date: todayStr,
        },
      },
      data: { solvedCount: { increment: 1 } },
    });

    return {
      currentStreak: user.currentStreak || 1,
      longestStreak: Math.max(user.currentStreak || 1, user.longestStreak || 0),
      streakShields: user.streakShields ?? 1,
    };
  }
}

export const updateStreakOnProblemSolved = updateUserStreak;
