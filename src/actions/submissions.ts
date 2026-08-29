"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateXpGain, calculateLevel } from "@/lib/xp";
import { updateStreakOnProblemSolved } from "@/lib/streaks";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { verifyLeetCodeSubmission } from "@/lib/leetcode";
import { revalidatePath } from "next/cache";

interface VerifySubmissionInput {
  problemId: number;
  leetcodeUsername?: string;
}

export async function verifyAndCompleteLeetCodeSubmission(input: VerifySubmissionInput) {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required to record progress." };
  }

  // 1. Validate that problem exists in the strict 191 SDE Sheet dataset
  const problem = await db.problem.findUnique({
    where: { id: input.problemId },
  });

  if (!problem) {
    return { success: false, error: "Problem does not exist in the 191 SDE Sheet." };
  }

  const effectiveUsername =
    input.leetcodeUsername?.trim().replace(/^@/, "") ||
    user.leetcodeUsername?.trim().replace(/^@/, "");

  if (!effectiveUsername) {
    return {
      success: false,
      error: "Please link your LeetCode username in your Profile before verifying submissions.",
    };
  }

  // 2. Perform LeetCode Verification
  const verification = await verifyLeetCodeSubmission(
    effectiveUsername,
    problem.title,
    problem.leetcodeUrl
  );

  if (!verification.verified) {
    return {
      success: false,
      error: verification.message || "Could not verify submission on LeetCode.",
    };
  }

  // 3. Save connected LeetCode username if provided
  if (input.leetcodeUsername && !user.leetcodeConnected) {
    await db.user.update({
      where: { id: user.id },
      data: {
        leetcodeUsername: input.leetcodeUsername.trim().replace(/^@/, ""),
        leetcodeConnected: true,
      },
    });
  }

  // 4. Check if previously solved
  const previousStatus = await db.userProblemStatus.findUnique({
    where: {
      userId_problemId: {
        userId: user.id,
        problemId: problem.id,
      },
    },
  });

  const isFirstSolve = !previousStatus || previousStatus.status !== "SOLVED";
  const solveStatus = "SOLVED";

  // 5. Calculate Server-Verified XP
  const xpBreakdown = calculateXpGain({
    difficulty: problem.difficulty,
    status: solveStatus,
    isFirstTime: isFirstSolve,
    isDailyChallengeProblem: true,
  });

  // 6. Record Submission
  const submission = await db.submission.create({
    data: {
      userId: user.id,
      problemId: problem.id,
      status: solveStatus,
      xpEarned: xpBreakdown.totalXp,
      source: "LEETCODE",
      leetcodeSubmissionId: verification.submissionId || `LC-${Date.now()}`,
    },
  });

  // 7. Update UserProblemStatus
  await db.userProblemStatus.upsert({
    where: {
      userId_problemId: {
        userId: user.id,
        problemId: problem.id,
      },
    },
    create: {
      userId: user.id,
      problemId: problem.id,
      status: solveStatus,
      attemptsCount: 1,
      firstSolvedAt: new Date(),
      lastAttemptedAt: new Date(),
      submissionReference: verification.submissionId,
    },
    update: {
      status: solveStatus,
      attemptsCount: { increment: 1 },
      firstSolvedAt: isFirstSolve ? new Date() : previousStatus?.firstSolvedAt,
      lastAttemptedAt: new Date(),
      submissionReference: verification.submissionId,
    },
  });

  // 8. Record XP Transaction
  await db.xpTransaction.create({
    data: {
      userId: user.id,
      amount: xpBreakdown.totalXp,
      reason: isFirstSolve ? "BASE_SOLVE" : "PRACTICE_SOLVE",
    },
  });

  // 9. Update Streak & Total Solved
  const streakRes = await updateStreakOnProblemSolved(user.id);

  const updatedTotalSolved = isFirstSolve
    ? user.totalSolved + 1
    : user.totalSolved;

  const newTotalXp = user.xp + xpBreakdown.totalXp;
  const newLevel = calculateLevel(newTotalXp);

  await db.user.update({
    where: { id: user.id },
    data: {
      xp: newTotalXp,
      level: newLevel,
      totalSolved: updatedTotalSolved,
    },
  });

  // 10. Check if this completes today's 3/3 daily mission
  const todayStr = new Date().toISOString().split("T")[0];
  const dailyChallenge = await db.dailyChallenge.findUnique({
    where: {
      userId_date: {
        userId: user.id,
        date: todayStr,
      },
    },
  });

  let isMissionComplete = false;
  if (dailyChallenge && !dailyChallenge.completed) {
    const dailyProblemIds = [
      dailyChallenge.problem1Id,
      dailyChallenge.problem2Id,
      dailyChallenge.problem3Id,
    ];

    if (dailyProblemIds.includes(problem.id)) {
      const solvedDailyCount = await db.userProblemStatus.count({
        where: {
          userId: user.id,
          problemId: { in: dailyProblemIds },
          status: { in: ["SOLVED", "OPTIMAL"] },
        },
      });

      if (solvedDailyCount >= 3) {
        isMissionComplete = true;
        await db.dailyChallenge.update({
          where: { id: dailyChallenge.id },
          data: { completed: true, completedAt: new Date() },
        });

        // Award 3/3 Mission Bonus (+100 XP)
        const MISSION_BONUS = 100;
        await db.xpTransaction.create({
          data: {
            userId: user.id,
            amount: MISSION_BONUS,
            reason: "DAILY_3_OF_3",
          },
        });

        await db.user.update({
          where: { id: user.id },
          data: { xp: { increment: MISSION_BONUS } },
        });

        xpBreakdown.totalXp += MISSION_BONUS;
        xpBreakdown.reasons.push("🎉 3/3 DAILY MISSION COMPLETE BONUS (+100 XP)");
      }
    }
  }

  // 11. Check and Award Achievements
  const newAchievements = await checkAndAwardAchievements(user.id);

  // 12. Check Squad Rivalries (if user overtook another member in their squads)
  const userMemberships = await db.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          members: {
            include: { user: true },
          },
        },
      },
    },
  });

  for (const gm of userMemberships) {
    const sortedMembers = [...gm.group.members].sort(
      (a, b) => b.user.xp - a.user.xp
    );
    const newRank = sortedMembers.findIndex((m) => m.userId === user.id) + 1;

    // If overtook someone immediately below, notify them
    if (newRank > 0 && newRank < sortedMembers.length) {
      const overtakenMember = sortedMembers[newRank]; // member who dropped
      if (overtakenMember && overtakenMember.userId !== user.id) {
        const gap = newTotalXp - overtakenMember.user.xp;
        await db.notification.create({
          data: {
            userId: overtakenMember.userId,
            title: `⚔️ ${user.username} just passed you!`,
            message: `${user.username} just passed you in "${gm.group.name}". You are now #${newRank + 1}. Need ${gap + 10} XP to take back #${newRank}!`,
            type: "OVERTAKEN",
            link: `/groups/${gm.groupId}`,
          },
        });
      }
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/problems");
  revalidatePath("/groups");
  revalidatePath("/leaderboard");
  revalidatePath("/profile");

  return {
    success: true,
    message: verification.message,
    xpGained: xpBreakdown.totalXp,
    xpBreakdown,
    streak: streakRes.currentStreak,
    isMissionComplete,
    newAchievements,
  };
}
