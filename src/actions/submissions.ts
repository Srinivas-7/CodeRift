"use server";

import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateXpGain, calculateLevel, XpBreakdown } from "@/lib/xp";
import { getProblemScore, DAILY_COMPLETION_BONUS, compareLeaderboardRank, getProblemPhase } from "@/lib/scoring";
import { updateStreakOnProblemSolved } from "@/lib/streaks";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { verifyLeetCodeSubmission } from "@/lib/leetcode";
import { revalidatePath } from "next/cache";
import { getOrCreateDailyChallenge } from "@/lib/team-phase";

interface VerifySubmissionInput {
  problemId: number;
  leetcodeUsername?: string;
  groupId?: string;
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

  const isFirstSolve = !previousStatus || (previousStatus.status !== "SOLVED" && previousStatus.status !== "OPTIMAL");
  const solveStatus = "SOLVED";

  // 5. Calculate Server-Verified Points (10 Easy, 20 Medium, 30 Hard; exactly once on first solve)
  const problemPoints = isFirstSolve ? getProblemScore(problem.difficulty) : 0;
  const xpBreakdown: XpBreakdown = {
    baseXp: problemPoints,
    totalXp: problemPoints,
    firstSolveBonus: 0,
    dailyCompleteBonus: 0,
    challengeWinBonus: 0,
    reasons: isFirstSolve
      ? [`+${problemPoints} PTS — ${problem.difficulty} Problem Solved`]
      : ["0 PTS — Previously Solved (No Duplicate Points)"],
  };

  // 6. Record Submission
  const submission = await db.submission.create({
    data: {
      userId: user.id,
      problemId: problem.id,
      status: solveStatus,
      xpEarned: problemPoints,
      pointsEarned: problemPoints,
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

  // 8. Record Points Transaction (Only if points were earned on first solve)
  if (isFirstSolve && problemPoints > 0) {
    await db.xpTransaction.create({
      data: {
        userId: user.id,
        amount: problemPoints,
        reason: "PROBLEM_SOLVE",
      },
    });
  }

  // 9. Update Streak & Total Solved & Phase Scores
  const streakRes = await updateStreakOnProblemSolved(user.id);
  const problemPhase = getProblemPhase(problem.orderInSheet);

  let updatedPhase1Solved = user.phase1Solved || 0;
  let updatedPhase2Solved = user.phase2Solved || 0;
  let updatedPhase1Score = user.phase1Score || 0;
  let updatedPhase2Score = user.phase2Score || 0;

  if (isFirstSolve) {
    if (problemPhase === 1) {
      updatedPhase1Solved += 1;
      updatedPhase1Score += problemPoints;
    } else {
      updatedPhase2Solved += 1;
      updatedPhase2Score += problemPoints;
    }
  }

  const updatedTotalSolved = isFirstSolve
    ? (user.totalSolved || 0) + 1
    : (user.totalSolved || 0);

  const currentScore = typeof user.score === "number" ? user.score : (user.xp || 0);
  let runningTotalScore = currentScore + problemPoints;
  let currentLevel = calculateLevel(runningTotalScore);

  await db.user.update({
    where: { id: user.id },
    data: {
      score: runningTotalScore,
      xp: runningTotalScore,
      level: currentLevel,
      totalSolved: updatedTotalSolved,
      phase1Score: updatedPhase1Score,
      phase2Score: updatedPhase2Score,
      phase1Solved: updatedPhase1Solved,
      phase2Solved: updatedPhase2Solved,
    },
  });

  // 10. Check and evaluate daily mission completion across all squads the user belongs to
  let userMemberships = await db.groupMember.findMany({
    where: { userId: user.id },
    include: { group: true },
  });

  // If specific groupId was provided, evaluate that specific squad; otherwise evaluate all user squads (or solo fallback)
  let targetGroups: any[] = [];
  if (input.groupId) {
    const specificGroup = await db.group.findUnique({ where: { id: input.groupId } });
    if (specificGroup) {
      targetGroups = [specificGroup];
    }
  }

  if (targetGroups.length === 0) {
    targetGroups = userMemberships.length > 0
      ? userMemberships.map((m: any) => m.group).filter(Boolean)
      : [null]; // solo user fallback
  }

  let isMissionComplete = false;
  let totalDailyBonusAwarded = 0;

  for (const grp of targetGroups) {
    const dailyData = await getOrCreateDailyChallenge(user.id, grp?.id || null);
    const dailyProblemIds = (dailyData.problems || []).map((p: any) => p.id);

    // Only process this squad if the solved problem is part of this squad's daily 3
    if (dailyData.daily && dailyProblemIds.length > 0 && dailyProblemIds.includes(problem.id)) {
      const isAllDailySolved = dailyData.solvedCount >= dailyData.totalCount && dailyData.totalCount > 0;

      // Check if this squad's daily challenge for today has not yet been marked completed
      if (isAllDailySolved && !dailyData.daily.completed) {
        const bonusRes = await db.dailyChallenge.awardDailyBonusAtomic({
          userId: user.id,
          groupId: grp?.id || null,
          date: dailyData.daily.date,
          problemPhase,
          bonusAmount: DAILY_COMPLETION_BONUS,
          bonusReason: grp ? `DAILY_COMPLETION_BONUS_${grp.id}` : "DAILY_COMPLETION_BONUS",
        });

        if (bonusRes.awarded) {
          isMissionComplete = true;
          totalDailyBonusAwarded += DAILY_COMPLETION_BONUS;
          runningTotalScore = bonusRes.newScore;
          currentLevel = bonusRes.newLevel;
          updatedPhase1Score = bonusRes.newPhase1Score;
          updatedPhase2Score = bonusRes.newPhase2Score;

          xpBreakdown.totalXp += DAILY_COMPLETION_BONUS;
          xpBreakdown.dailyCompleteBonus = (xpBreakdown.dailyCompleteBonus ?? 0) + DAILY_COMPLETION_BONUS;
          const squadLabel = grp?.name ? `"${grp.name}"` : "DAILY";
          xpBreakdown.reasons.push(`🎉 ${squadLabel} MISSION COMPLETE BONUS (+20 PTS)`);
        } else if (bonusRes.alreadyCompleted || dailyData.daily.completed) {
          isMissionComplete = true;
        }
      } else if (dailyData.daily.completed) {
        isMissionComplete = true;
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

      runningTotalScore += duelXp;
      currentLevel = calculateLevel(runningTotalScore);

      await db.user.update({
        where: { id: user.id },
        data: {
          score: runningTotalScore,
          xp: runningTotalScore,
          level: currentLevel,
        },
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
  const rivalMemberships = await db.groupMember.findMany({
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

  for (const gm of rivalMemberships) {
    const sortedMembers = [...gm.group.members].sort((a, b) => compareLeaderboardRank(a.user, b.user));
    const newRank = sortedMembers.findIndex((m) => m.userId === user.id) + 1;

    // If overtook someone immediately below, notify them
    if (newRank > 0 && newRank < sortedMembers.length) {
      const overtakenMember = sortedMembers[newRank]; // member who dropped
      if (overtakenMember && overtakenMember.userId !== user.id) {
        const overtakenScore = overtakenMember.user?.score ?? overtakenMember.user?.xp ?? 0;
        const gap = runningTotalScore - overtakenScore;
        await db.notification.create({
          data: {
            userId: overtakenMember.userId,
            title: `⚔️ ${user.username} just passed you!`,
            message: `${user.username} just passed you in "${gm.group.name}". You are now #${newRank + 1}. Need ${gap + 10} PTS to take back #${newRank}!`,
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
