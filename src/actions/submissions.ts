"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateXpGain, calculateLevel } from "@/lib/xp";
import { updateStreakOnProblemSolved } from "@/lib/streaks";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { verifyLeetCodeSubmission } from "@/lib/leetcode";
import { revalidatePath } from "next/cache";
import { getGlobalDailyProblemBatch } from "@/lib/daily-challenge";

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

  let runningTotalXp = user.xp + xpBreakdown.totalXp;
  let currentLevel = calculateLevel(runningTotalXp);

  await db.user.update({
    where: { id: user.id },
    data: {
      xp: runningTotalXp,
      level: currentLevel,
      totalSolved: updatedTotalSolved,
    },
  });

  // 10. Check if this completes today's daily mission
  const todayStr = new Date().toISOString().split("T")[0];
  const globalBatch = await getGlobalDailyProblemBatch(todayStr);
  const dailyProblemIds = (globalBatch.problems || []).map((p: any) => p.id);

  let isMissionComplete = false;
  if (dailyProblemIds.length > 0 && dailyProblemIds.includes(problem.id)) {
    let dailyChallenge = await db.dailyChallenge.findUnique({
      where: {
        userId_date: {
          userId: user.id,
          date: todayStr,
        },
      },
    });

    if (!dailyChallenge) {
      dailyChallenge = await db.dailyChallenge.upsert({
        where: {
          userId_date: {
            userId: user.id,
            date: todayStr,
          },
        },
        update: {
          problem1Id: dailyProblemIds[0] ?? null,
          problem2Id: dailyProblemIds[1] ?? null,
          problem3Id: dailyProblemIds[2] ?? null,
        },
        create: {
          userId: user.id,
          date: todayStr,
          problem1Id: dailyProblemIds[0] ?? null,
          problem2Id: dailyProblemIds[1] ?? null,
          problem3Id: dailyProblemIds[2] ?? null,
          completed: false,
        },
      });
    }

    if (dailyChallenge && !dailyChallenge.completed) {
      const solvedDailyCount = await db.userProblemStatus.count({
        where: {
          userId: user.id,
          problemId: { in: dailyProblemIds },
          status: { in: ["SOLVED", "OPTIMAL"] },
        },
      });

      if (solvedDailyCount >= dailyProblemIds.length) {
        isMissionComplete = true;
        await db.dailyChallenge.update({
          where: { id: dailyChallenge.id },
          data: { completed: true, completedAt: new Date() },
        });

        // Award 3/3 (or full daily) Mission Bonus (+100 XP)
        const MISSION_BONUS = 100;
        await db.xpTransaction.create({
          data: {
            userId: user.id,
            amount: MISSION_BONUS,
            reason: "DAILY_3_OF_3",
          },
        });

        runningTotalXp += MISSION_BONUS;
        currentLevel = calculateLevel(runningTotalXp);

        await db.user.update({
          where: { id: user.id },
          data: { xp: runningTotalXp, level: currentLevel },
        });

        xpBreakdown.totalXp += MISSION_BONUS;
        xpBreakdown.reasons.push("🎉 3/3 DAILY MISSION COMPLETE BONUS (+100 XP)");
      }
    }
  }

  // 10.5 Check and resolve any Pending 1v1 Friend Challenges for this problem
  try {
    const allChallenges = await db.friendChallenge.findMany();
    const activeDuel = allChallenges.find(
      (c: any) =>
        c.status === "PENDING" &&
        c.problemId === problem.id &&
        (c.challengedId === user.id || c.challengerId === user.id)
    );

    if (activeDuel) {
      const duelXp = activeDuel.xpStake || 150;
      await db.friendChallenge.update({
        where: { id: activeDuel.id },
        data: {
          status: "COMPLETED",
          winnerId: user.id,
          completedAt: new Date(),
        },
      });

      await db.xpTransaction.create({
        data: {
          userId: user.id,
          amount: duelXp,
          reason: "CHALLENGE_WIN",
        },
      });

      runningTotalXp += duelXp;
      currentLevel = calculateLevel(runningTotalXp);

      await db.user.update({
        where: { id: user.id },
        data: { xp: runningTotalXp, level: currentLevel },
      });

      xpBreakdown.totalXp += duelXp;
      xpBreakdown.challengeWinBonus = duelXp;
      xpBreakdown.reasons.push(`⚔️ 1v1 DUEL VICTORY BONUS (+${duelXp} XP)`);

      const opponentId =
        activeDuel.challengedId === user.id
          ? activeDuel.challengerId
          : activeDuel.challengedId;

      await db.notification.create({
        data: {
          userId: opponentId,
          title: "⚔️ Duel Concluded",
          type: "CHALLENGE_COMPLETED",
          message: `⚔️ ${user.username} just conquered "${problem.title}" and won the 1v1 duel (+${duelXp} XP)!`,
          link: `/problems/${problem.id}`,
        },
      });
    }
  } catch (err) {
    console.warn("Duel resolution check note:", err);
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
        const gap = runningTotalXp - overtakenMember.user.xp;
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
