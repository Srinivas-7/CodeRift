"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateXpGain, calculateLevel, XpBreakdown } from "@/lib/xp";
import { getProblemScore, DAILY_COMPLETION_BONUS, compareLeaderboardRank, getProblemPhase } from "@/lib/scoring";
import { updateStreakOnProblemSolved, syncUserStreak } from "@/lib/streaks";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { verifyLeetCodeSubmission } from "@/lib/leetcode";
import { verifyGfgSubmission } from "@/lib/gfg";
import { detectProblemPlatform } from "@/lib/platform";
import { revalidatePath } from "next/cache";
import { getOrCreateDailyChallenge } from "@/lib/team-phase";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/ratelimit";

const verifySubmissionSchema = z.object({
  problemId: z.number().int().positive().max(100000),
  leetcodeUsername: z.string().trim().max(100).optional(),
  gfgUsername: z.string().trim().max(100).optional(),
  groupId: z.string().trim().max(100).optional(),
});

const clearSubmissionSchema = z.object({
  problemId: z.number().int().positive().max(100000),
});

export interface VerifySubmissionInput {
  problemId: number;
  leetcodeUsername?: string;
  gfgUsername?: string;
  groupId?: string;
}

export async function verifyAndCompleteLeetCodeSubmission(input: VerifySubmissionInput) {
  return verifyAndCompleteProblemSubmission(input);
}

export async function verifyAndCompleteProblemSubmission(input: VerifySubmissionInput) {
  const parsed = verifySubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid submission parameters." };
  }
  const validatedInput = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required to record progress." };
  }

  const rateLimitRes = await checkRateLimit(RATE_LIMIT_CONFIGS.VERIFY_SUBMISSION, user.id);
  if (!rateLimitRes.success) {
    return { success: false, error: "Too many verification requests. Please wait a moment before trying again." };
  }

  // 1. Validate that problem exists in the strict 191 SDE Sheet dataset
  const problem = await db.problem.findUnique({
    where: { id: input.problemId },
  });

  if (!problem) {
    return { success: false, error: "Problem does not exist in the 191 SDE Sheet." };
  }

  const platform = detectProblemPlatform(problem.leetcodeUrl);
  let verification: {
    verified: boolean;
    submissionId?: string;
    solvedAt?: Date;
    lang?: string;
    userExists?: boolean;
    message: string;
  };
  let sourcePlatform = "LEETCODE";

  if (platform === "GFG") {
    sourcePlatform = "GFG";
    const effectiveGfgUsername =
      input.gfgUsername?.trim().replace(/^@/, "") ||
      user.gfgUsername?.trim().replace(/^@/, "");

    if (!effectiveGfgUsername) {
      return {
        success: false,
        error: "Please link your GeeksforGeeks handle in your Profile before verifying submissions.",
      };
    }

    verification = await verifyGfgSubmission(
      effectiveGfgUsername,
      problem.title,
      problem.leetcodeUrl,
      { maxTimestamp: new Date(Date.now() + 60000) }
    );

    if (!verification.verified) {
      return {
        success: false,
        error: verification.message || "Could not verify submission on GeeksforGeeks.",
      };
    }
  } else {
    // LeetCode verification
    sourcePlatform = "LEETCODE";
    const effectiveUsername =
      input.leetcodeUsername?.trim().replace(/^@/, "") ||
      user.leetcodeUsername?.trim().replace(/^@/, "");

    if (!effectiveUsername) {
      return {
        success: false,
        error: "Please link your LeetCode username in your Profile before verifying submissions.",
      };
    }

    // Perform LeetCode Verification
    verification = await verifyLeetCodeSubmission(
      effectiveUsername,
      problem.title,
      problem.leetcodeUrl,
      { maxTimestamp: new Date(Date.now() + 60000) }
    );

    if (!verification.verified) {
      return {
        success: false,
        error: verification.message || "Could not verify submission on LeetCode.",
      };
    }
  }

  // 4-9. Atomic Scoring & Submission Mutation Transaction (Guarantees points awarded exactly once)
  const problemPhase = getProblemPhase(problem.orderInSheet);
  const statusDocId = `${user.id}_${problem.id}`;
  const basePoints = getProblemScore(problem.difficulty);

  const txResult = await db.runTransaction(async (transaction) => {
    const userRef = (db as any).user ? (await import("@/lib/firebase-admin")).adminDb.collection("users").doc(user.id) : null;
    const statusRef = (await import("@/lib/firebase-admin")).adminDb.collection("user_problem_statuses").doc(statusDocId);
    const subRef = (await import("@/lib/firebase-admin")).adminDb.collection("submissions").doc();

    const [userSnap, statusSnap] = await Promise.all([
      transaction.get(userRef!),
      transaction.get(statusRef),
    ]);

    const statusData = statusSnap.exists ? (statusSnap.data() as any) : null;
    const isFirstSolve = !statusData || (statusData.status !== "SOLVED" && statusData.status !== "OPTIMAL");
    const problemPoints = isFirstSolve ? basePoints : 0;
    const solveStatus = "SOLVED";

    // Write 1: Record submission
    const subRecord = {
      id: subRef.id,
      userId: user.id,
      problemId: problem.id,
      status: solveStatus,
      xpEarned: problemPoints,
      pointsEarned: problemPoints,
      source: sourcePlatform,
      leetcodeSubmissionId: verification.submissionId || `${sourcePlatform}-${Date.now()}`,
      createdAt: new Date(),
    };
    transaction.set(subRef, subRecord);

    // Write 2: Update UserProblemStatus
    if (statusSnap.exists) {
      transaction.update(statusRef, {
        status: solveStatus,
        attemptsCount: (statusData?.attemptsCount || 0) + 1,
        firstSolvedAt: isFirstSolve ? new Date() : (statusData?.firstSolvedAt || new Date()),
        lastAttemptedAt: new Date(),
        submissionReference: verification.submissionId || statusData?.submissionReference,
      });
    } else {
      transaction.set(statusRef, {
        id: statusDocId,
        userId: user.id,
        problemId: problem.id,
        status: solveStatus,
        attemptsCount: 1,
        firstSolvedAt: new Date(),
        lastAttemptedAt: new Date(),
        submissionReference: verification.submissionId,
      });
    }

    // Write 3: Record XP Transaction on first solve
    if (isFirstSolve && problemPoints > 0) {
      const xpTxRef = (await import("@/lib/firebase-admin")).adminDb.collection("xp_transactions").doc();
      transaction.set(xpTxRef, {
        id: xpTxRef.id,
        userId: user.id,
        amount: problemPoints,
        reason: "PROBLEM_SOLVE",
        createdAt: new Date(),
      });
    }

    // Write 4: Update User profile score atomically
    const userData = userSnap?.exists ? (userSnap.data() as any) : {};
    const currentScore = (userData.score ?? userData.xp ?? 0);
    const runningTotalScore = currentScore + problemPoints;
    const currentLevel = calculateLevel(runningTotalScore);

    const updatedTotalSolved = isFirstSolve
      ? (userData.totalSolved || 0) + 1
      : (userData.totalSolved || 0);

    const updatedPhase1Solved = (userData.phase1Solved || 0) + (isFirstSolve && problemPhase === 1 ? 1 : 0);
    const updatedPhase2Solved = (userData.phase2Solved || 0) + (isFirstSolve && problemPhase === 2 ? 1 : 0);
    const updatedPhase1Score = (userData.phase1Score || 0) + (isFirstSolve && problemPhase === 1 ? problemPoints : 0);
    const updatedPhase2Score = (userData.phase2Score || 0) + (isFirstSolve && problemPhase === 2 ? problemPoints : 0);

    if (userRef) {
      transaction.update(userRef, {
        score: runningTotalScore,
        xp: runningTotalScore,
        level: currentLevel,
        totalSolved: updatedTotalSolved,
        phase1Score: updatedPhase1Score,
        phase2Score: updatedPhase2Score,
        phase1Solved: updatedPhase1Solved,
        phase2Solved: updatedPhase2Solved,
        updatedAt: new Date(),
      });
    }

    return {
      isFirstSolve,
      problemPoints,
      runningTotalScore,
      currentLevel,
      updatedPhase1Score,
      updatedPhase2Score,
      submission: subRecord,
    };
  });

  const { isFirstSolve, problemPoints, submission } = txResult;
  let runningTotalScore = txResult.runningTotalScore;
  let currentLevel = txResult.currentLevel;
  let updatedPhase1Score = txResult.updatedPhase1Score;
  let updatedPhase2Score = txResult.updatedPhase2Score;

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

  // 9. Update Streak & Achievements
  const streakRes = await updateStreakOnProblemSolved(user.id);



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
    if (!gm.group || !Array.isArray(gm.group.members) || gm.group.members.length <= 1) {
      continue;
    }
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

export async function clearProblemSubmission(input: { problemId: number }) {
  const parsed = clearSubmissionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Invalid problem ID." };
  }
  const validatedInput = parsed.data;

  const user = await getCurrentUser();
  if (!user) {
    return { success: false, error: "Authentication required to clear problem status." };
  }

  const problem = await db.problem.findUnique({
    where: { id: validatedInput.problemId },
  });

  if (!problem) {
    return { success: false, error: "Problem does not exist." };
  }

  // 1. Check existing solve status
  const previousStatus = await db.userProblemStatus.findUnique({
    where: {
      userId_problemId: {
        userId: user.id,
        problemId: problem.id,
      },
    },
  });

  const wasSolved = previousStatus && (previousStatus.status === "SOLVED" || previousStatus.status === "OPTIMAL");

  // 2. Delete user problem status
  await db.userProblemStatus.delete({
    where: {
      userId_problemId: {
        userId: user.id,
        problemId: problem.id,
      },
    },
  });

  // 3. Delete any submissions recorded for this problem
  await db.submission.deleteMany({
    where: {
      userId: user.id,
      problemId: problem.id,
    },
  });

  // 4. If problem was previously solved, adjust score, counts, and level
  if (wasSolved) {
    const problemPoints = getProblemScore(problem.difficulty);
    const problemPhase = getProblemPhase(problem.orderInSheet);

    const currentScore = typeof user.score === "number" ? user.score : (user.xp || 0);
    const updatedScore = Math.max(0, currentScore - problemPoints);
    const updatedLevel = calculateLevel(updatedScore);
    const updatedTotalSolved = Math.max(0, (user.totalSolved || 0) - 1);

    let updatedPhase1Solved = user.phase1Solved || 0;
    let updatedPhase2Solved = user.phase2Solved || 0;
    let updatedPhase1Score = user.phase1Score || 0;
    let updatedPhase2Score = user.phase2Score || 0;

    if (problemPhase === 1) {
      updatedPhase1Solved = Math.max(0, updatedPhase1Solved - 1);
      updatedPhase1Score = Math.max(0, updatedPhase1Score - problemPoints);
    } else {
      updatedPhase2Solved = Math.max(0, updatedPhase2Solved - 1);
      updatedPhase2Score = Math.max(0, updatedPhase2Score - problemPoints);
    }

    await db.user.update({
      where: { id: user.id },
      data: {
        score: updatedScore,
        xp: updatedScore,
        level: updatedLevel,
        totalSolved: updatedTotalSolved,
        phase1Score: updatedPhase1Score,
        phase2Score: updatedPhase2Score,
        phase1Solved: updatedPhase1Solved,
        phase2Solved: updatedPhase2Solved,
      },
    });

    await syncUserStreak(user.id);
  }

  revalidatePath("/dashboard");
  revalidatePath("/problems");
  revalidatePath(`/problems/${input.problemId}`);
  revalidatePath("/groups");
  revalidatePath("/leaderboard");
  revalidatePath("/profile");

  return {
    success: true,
    message: `Verification cleared for "${problem.title}".`,
  };
}
