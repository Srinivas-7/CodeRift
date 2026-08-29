import { db } from "./db";

export async function updateUserStreak(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      currentStreak: true,
      longestStreak: true,
      streakShields: true,
    },
  });

  if (!user) return { currentStreak: 0, longestStreak: 0, streakShields: 1 };

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Check today's streak record
  let todayRecord = await db.streakRecord.findUnique({
    where: {
      userId_date: {
        userId,
        date: todayStr,
      },
    },
  });

  if (!todayRecord) {
    todayRecord = await db.streakRecord.upsert({
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

    // Check if user solved yesterday or used a shield
    const yesterdayRecord = await db.streakRecord.findUnique({
      where: {
        userId_date: {
          userId,
          date: yesterdayStr,
        },
      },
    });

    let newStreak = 1;
    if (yesterdayRecord && yesterdayRecord.solvedCount > 0) {
      newStreak = user.currentStreak + 1;
    } else if (user.currentStreak > 0 && user.streakShields > 0) {
      // Shield protects yesterday
      await db.streakRecord.upsert({
        where: {
          userId_date: {
            userId,
            date: yesterdayStr,
          },
        },
        update: {},
        create: {
          userId,
          date: yesterdayStr,
          solvedCount: 0,
          shieldUsed: true,
        },
      });

      // Deduct 1 shield
      await db.user.update({
        where: { id: userId },
        data: { streakShields: { decrement: 1 } },
      });

      newStreak = user.currentStreak + 1;
    }

    const newLongest = Math.max(newStreak, user.longestStreak);

    // Award +1 Shield every 7 days streak (max 3 shields)
    let shieldsToAdd = 0;
    if (newStreak > 0 && newStreak % 7 === 0 && user.streakShields < 3) {
      shieldsToAdd = 1;
    }

    await db.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongest,
        streakShields: { increment: shieldsToAdd },
      },
    });

    return {
      currentStreak: newStreak,
      longestStreak: newLongest,
      streakShields: user.streakShields + shieldsToAdd,
    };
  } else {
    // Already solved today, increment count
    await db.streakRecord.update({
      where: { id: todayRecord.id },
      data: { solvedCount: { increment: 1 } },
    });

    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      streakShields: user.streakShields,
    };
  }
}

export const updateStreakOnProblemSolved = updateUserStreak;
