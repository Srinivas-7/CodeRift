"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { calculateLevel } from "@/lib/xp";
import { revalidatePath } from "next/cache";

const CreateChallengeSchema = z.object({
  challengedId: z.string().trim().min(1, "Challenged user ID required").max(128),
  problemId: z.number().int().positive().max(10000),
  xpStake: z.number().int().min(10, "Minimum stake is 10 XP").max(500, "Maximum stake is 500 XP").default(50),
});

const ChallengeIdSchema = z.object({
  challengeId: z.string().trim().min(1).max(128),
});

export async function createFriendChallenge(params: {
  challengedId: string;
  problemId: number;
  xpStake?: number;
}) {
  const parsed = CreateChallengeSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid challenge parameters." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const { challengedId, problemId, xpStake } = parsed.data;

  if (currentUser.id === challengedId) {
    return { success: false, error: "You cannot challenge yourself to a duel." };
  }

  // Check challenger actually has the required XP/score
  const userScore = (currentUser.score ?? currentUser.xp ?? 0);
  if (userScore < xpStake) {
    return {
      success: false,
      error: `Insufficient XP balance. You have ${userScore} XP, but this duel requires a stake of ${xpStake} XP.`,
    };
  }

  // Ensure problem exists
  const problem = await db.problem.findUnique({
    where: { id: problemId },
  });

  if (!problem) {
    return { success: false, error: "Problem not found in 191 SDE sheet." };
  }

  // Deduct stake and create challenge atomically
  const challenge = await db.runTransaction(async (transaction) => {
    const userRef = (await import("@/lib/firebase-admin")).adminDb.collection("users").doc(currentUser.id);
    const uSnap = await transaction.get(userRef);
    const uData = uSnap.exists ? (uSnap.data() as any) : {};
    const curScore = (uData.score ?? uData.xp ?? 0);

    if (curScore < xpStake) {
      throw new Error("INSUFFICIENT_XP");
    }

    const challengeRef = (await import("@/lib/firebase-admin")).adminDb.collection("friend_challenges").doc();
    const challengeRecord = {
      id: challengeRef.id,
      challengerId: currentUser.id,
      challengedId,
      problemId,
      xpStake,
      status: "PENDING",
      createdAt: new Date(),
      completedAt: null,
      winnerId: null,
    };
    transaction.set(challengeRef, challengeRecord);

    // Record stake escrow deduction
    const stakeTxRef = (await import("@/lib/firebase-admin")).adminDb.collection("xp_transactions").doc();
    transaction.set(stakeTxRef, {
      id: stakeTxRef.id,
      userId: currentUser.id,
      amount: -xpStake,
      reason: `CHALLENGE_STAKE_ESCROW_${challengeRef.id}`,
      createdAt: new Date(),
    });

    const newScore = Math.max(0, curScore - xpStake);
    transaction.update(userRef, {
      score: newScore,
      xp: newScore,
      level: calculateLevel(newScore),
      updatedAt: new Date(),
    });

    return challengeRecord;
  });

  // Notify challenged friend
  await db.notification.create({
    data: {
      userId: challengedId,
      title: "⚔️ 1v1 Challenge Received",
      type: "CHALLENGE_RECEIVED",
      message: `⚔️ ${currentUser.username} challenged you to a 1v1 duel on "${problem.title}" for ${xpStake} staked XP!`,
      link: `/problems/${problem.id}`,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/groups");
  revalidatePath("/profile");

  return { success: true, challenge };
}

export async function cancelFriendChallenge(params: { challengeId: string }) {
  const parsed = ChallengeIdSchema.safeParse(params);
  if (!parsed.success) {
    return { success: false, error: "Invalid challenge ID." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const { challengeId } = parsed.data;

  try {
    await db.runTransaction(async (transaction) => {
      const challengeRef = (await import("@/lib/firebase-admin")).adminDb.collection("friend_challenges").doc(challengeId);
      const cSnap = await transaction.get(challengeRef);
      if (!cSnap.exists) {
        throw new Error("CHALLENGE_NOT_FOUND");
      }
      const cData = cSnap.data() as any;

      if (cData.challengerId !== currentUser.id) {
        throw new Error("UNAUTHORIZED");
      }
      if (cData.status !== "PENDING") {
        throw new Error("ALREADY_RESOLVED");
      }

      // Mark challenge cancelled
      transaction.update(challengeRef, {
        status: "CANCELLED",
        completedAt: new Date(),
        updatedAt: new Date(),
      });

      // Refund staked XP to challenger
      const refundStake = cData.xpStake || 0;
      if (refundStake > 0) {
        const userRef = (await import("@/lib/firebase-admin")).adminDb.collection("users").doc(currentUser.id);
        const uSnap = await transaction.get(userRef);
        const uData = uSnap.exists ? (uSnap.data() as any) : {};
        const curScore = (uData.score ?? uData.xp ?? 0);
        const newScore = curScore + refundStake;

        const refundTxRef = (await import("@/lib/firebase-admin")).adminDb.collection("xp_transactions").doc();
        transaction.set(refundTxRef, {
          id: refundTxRef.id,
          userId: currentUser.id,
          amount: refundStake,
          reason: `CHALLENGE_REFUND_${challengeId}`,
          createdAt: new Date(),
        });

        transaction.update(userRef, {
          score: newScore,
          xp: newScore,
          level: calculateLevel(newScore),
          updatedAt: new Date(),
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/profile");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to cancel challenge." };
  }
}

