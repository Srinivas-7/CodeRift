"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createFriendChallenge(params: {
  challengedId: string;
  problemId: number;
  xpStake?: number;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const { challengedId, problemId, xpStake = 150 } = params;

  if (currentUser.id === challengedId) {
    return { success: false, error: "You cannot challenge yourself to a duel." };
  }

  // Ensure problem exists
  const problem = await db.problem.findUnique({
    where: { id: problemId },
  });

  if (!problem) {
    return { success: false, error: "Problem not found in 191 SDE sheet." };
  }

  const challenge = await db.friendChallenge.create({
    data: {
      challengerId: currentUser.id,
      challengedId,
      problemId,
      xpStake,
      status: "PENDING",
    },
  });

  // Notify challenged friend
  await db.notification.create({
    data: {
      userId: challengedId,
      title: "⚔️ 1v1 Challenge Received",
      type: "CHALLENGE_RECEIVED",
      message: `⚔️ ${currentUser.username} challenged you to a 1v1 duel on "${problem.title}" for ${xpStake} bonus XP!`,
      link: `/problems/${problem.id}`,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/groups");

  return { success: true, challenge };
}
