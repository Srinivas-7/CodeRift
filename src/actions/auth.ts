"use server";

import { db } from "@/lib/db";
import { setSessionCookie, removeSessionCookie, getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export interface FirebaseAuthInput {
  email: string;
  name: string;
  firebaseUid?: string;
  avatar?: string;
  leetcodeUsername?: string;
  provider?: string;
}

export type GoogleLoginInput = FirebaseAuthInput;

/**
 * Handles Firebase Auth (Google / GitHub / Email-Password) Sign-In.
 * Automatically creates clean new profile on first login (0 XP, 0 streaks, 0 groups)
 * or loads existing returning user.
 */
export async function loginWithFirebaseAuth(input: FirebaseAuthInput) {
  return loginWithGoogleAuth(input);
}

export async function loginWithGoogleAuth(input: FirebaseAuthInput) {
  try {
    const email = input.email.trim().toLowerCase();
    let user = await db.user.findUnique({
      where: { email },
    });

    let isNewUser = false;

    if (!user) {
      isNewUser = true;

      // Generate a clean unique username from name
      let baseUsername = input.name
        ? input.name.replace(/[^a-zA-Z0-9]/g, "")
        : email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");

      if (!baseUsername || baseUsername.length < 3) {
        baseUsername = "Warrior";
      }

      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await db.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      // Create new clean user profile
      user = await db.user.create({
        data: {
          email,
          username: uniqueUsername,
          firebaseUid: input.firebaseUid || null,
          googleId: input.firebaseUid || null,
          avatar: input.avatar || "cyber_ninja",
          xp: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          totalSolved: 0,
          streakShields: 1,
          leetcodeUsername: input.leetcodeUsername
            ? input.leetcodeUsername.trim().replace(/^@/, "")
            : null,
          leetcodeConnected: !!input.leetcodeUsername,
          role: "USER",
        },
      });
    } else {
      // If returning user has updated firebaseUid or leetcode info
      if (input.firebaseUid && !user.firebaseUid) {
        user = await db.user.update({
          where: { id: user.id },
          data: { firebaseUid: input.firebaseUid },
        });
      }
    }

    // Set JWT Session Cookie
    await setSessionCookie(user.id);

    return {
      success: true,
      isNewUser,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        leetcodeUsername: user.leetcodeUsername,
        leetcodeConnected: user.leetcodeConnected,
        xp: user.xp,
        level: user.level,
        currentStreak: user.currentStreak,
        streakShields: user.streakShields,
      },
    };
  } catch (error: any) {
    console.error("Google login error:", error);
    return {
      success: false,
      error: error.message || "Failed to authenticate with Google.",
    };
  }
}

/**
 * Connect or update LeetCode Account
 */
export async function connectLeetCodeAccount(leetcodeUsername: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const clean = leetcodeUsername.trim().replace(/^@/, "");
  if (!clean) {
    return { success: false, error: "Please provide a valid LeetCode username." };
  }

  const updated = await db.user.update({
    where: { id: currentUser.id },
    data: {
      leetcodeUsername: clean,
      leetcodeConnected: true,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return {
    success: true,
    leetcodeUsername: updated.leetcodeUsername,
    leetcodeConnected: updated.leetcodeConnected,
  };
}

/**
 * Update Profile details (Username, Avatar, LeetCode)
 */
export async function updateProfile(data: {
  username?: string;
  avatar?: string;
  leetcodeUsername?: string;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const updates: any = {};

  if (data.username && data.username.trim()) {
    const cleanUsername = data.username.trim();
    if (cleanUsername !== currentUser.username) {
      const existing = await db.user.findUnique({
        where: { username: cleanUsername },
      });
      if (existing) {
        return { success: false, error: "Warrior Tag already taken. Choose another." };
      }
      updates.username = cleanUsername;
    }
  }

  if (data.avatar) {
    updates.avatar = data.avatar;
  }

  if (data.leetcodeUsername !== undefined) {
    const cleanLc = data.leetcodeUsername.trim().replace(/^@/, "");
    updates.leetcodeUsername = cleanLc || null;
    updates.leetcodeConnected = !!cleanLc;
  }

  const updated = await db.user.update({
    where: { id: currentUser.id },
    data: updates,
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return {
    success: true,
    user: updated,
  };
}

/**
 * Reset all user progress (Problems solved, XP, streaks, daily challenges)
 */
export async function resetUserProgress() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  try {
    await db.$transaction([
      db.userProblemStatus.deleteMany({ where: { userId: currentUser.id } }),
      db.submission.deleteMany({ where: { userId: currentUser.id } }),
      db.dailyChallenge.deleteMany({ where: { userId: currentUser.id } }),
      db.xpTransaction.deleteMany({ where: { userId: currentUser.id } }),
      db.streakRecord.deleteMany({ where: { userId: currentUser.id } }),
      db.userAchievement.deleteMany({ where: { userId: currentUser.id } }),
      db.user.update({
        where: { id: currentUser.id },
        data: {
          xp: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          streakShields: 3,
          totalSolved: 0,
        },
      }),
    ]);

    revalidatePath("/problems");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidatePath("/leaderboard");
    revalidatePath("/groups");

    return { success: true };
  } catch (error: any) {
    console.error("Reset progress error:", error);
    return { success: false, error: error.message || "Failed to reset progress." };
  }
}

/**
 * Logout
 */
export async function logoutUser() {
  await removeSessionCookie();
  revalidatePath("/");
  return { success: true };
}

export const handleLogout = logoutUser;
