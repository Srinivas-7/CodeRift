import { db } from "./db";
import { calculateLevel } from "./xp";

export async function checkAndAwardAchievements(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) return [];

  const groupMemberships = await db.groupMember.findMany({
    where: { userId },
  });

  const existingIds = new Set(
    (
      await db.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      })
    ).map((ua: any) => ua.achievementId)
  );

  const unlockedNow: { id: string; name: string; icon: string; xp: number }[] = [];

  const allAchievements = await db.achievement.findMany();

  let runningXp = user.xp || 0;

  for (const ach of allAchievements) {
    if (existingIds.has(ach.id)) continue;

    let shouldUnlock = false;

    if (ach.id === "streak_7" && user.currentStreak >= 7) {
      shouldUnlock = true;
    } else if (ach.id === "streak_30" && user.currentStreak >= 30) {
      shouldUnlock = true;
    } else if (ach.id === "first_10" && user.totalSolved >= 10) {
      shouldUnlock = true;
    } else if (ach.id === "half_century_50" && user.totalSolved >= 50) {
      shouldUnlock = true;
    } else if (ach.id === "century_100" && user.totalSolved >= 100) {
      shouldUnlock = true;
    } else if (ach.id === "sde_master_191" && user.totalSolved >= 191) {
      shouldUnlock = true;
    } else if (ach.id === "podium_top3") {
      const isPodium = (groupMemberships || []).some(
        (m: any) => m.currentRank !== null && m.currentRank <= 3
      );
      if (isPodium) shouldUnlock = true;
    }

    if (shouldUnlock) {
      await db.userAchievement.create({
        data: {
          userId,
          achievementId: ach.id,
        },
      });

      // Award achievement XP bonus
      await db.xpTransaction.create({
        data: {
          userId,
          amount: ach.xpReward,
          reason: "ACHIEVEMENT",
        },
      });

      runningXp += ach.xpReward;
      const updatedLevel = calculateLevel(runningXp);

      await db.user.update({
        where: { id: userId },
        data: {
          xp: runningXp,
          level: updatedLevel,
        },
      });

      unlockedNow.push({
        id: ach.id,
        name: ach.name,
        icon: ach.icon,
        xp: ach.xpReward,
      });
    }
  }

  return unlockedNow;
}
