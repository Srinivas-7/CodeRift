"use server";

import { db } from "@/lib/db";
import { setSessionCookie, removeSessionCookie, getCurrentUser } from "@/lib/auth";
import { adminAuth } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { checkRateLimit, getClientIp, RATE_LIMIT_CONFIGS } from "@/lib/ratelimit";

const ALLOWED_SIGN_IN_PROVIDERS = new Set(["google.com", "github.com", "password"]);

export interface FirebaseAuthInput {
  idToken: string;
}

/**
 * Handles Firebase Auth (Google / GitHub / Email-Password) Sign-In.
 * Accepts ONLY a cryptographically verified Firebase ID token.
 * Extracts email, uid, and name exclusively from the verified token claims.
 */
export async function loginWithFirebaseAuth(input: FirebaseAuthInput) {
  try {
    const ip = await getClientIp();
    const rateLimitRes = await checkRateLimit(RATE_LIMIT_CONFIGS.LOGIN, ip);
    if (!rateLimitRes.success) {
      return {
        success: false,
        error: "Too many sign-in attempts. Please wait a minute before trying again.",
      };
    }

    if (!input?.idToken || typeof input.idToken !== "string" || !input.idToken.trim()) {
      return { success: false, error: "Authentication token required." };
    }

    // 1. Cryptographically verify the ID token via Firebase Admin SDK
    let decoded;
    try {
      decoded = await adminAuth.verifyIdToken(input.idToken.trim(), true);
    } catch (tokenErr: any) {
      console.error("[AUTH_TOKEN_INVALID]", tokenErr.message);
      return { success: false, error: "Authentication failed. Invalid or expired session." };
    }

    // 2. Enforce verified email requirement
    if (decoded.email_verified !== true) {
      console.warn(`[AUTH_UNVERIFIED_EMAIL] Sign-in attempt rejected for unverified email: ${decoded.email || "no-email"} (UID: ${decoded.uid})`);
      return {
        success: false,
        error: "Your email address is not verified. Please verify your email before signing in.",
      };
    }

    // 3. Extract and normalize email
    const rawEmail = decoded.email;
    if (!rawEmail || typeof rawEmail !== "string" || !rawEmail.includes("@")) {
      console.warn(`[AUTH_NO_EMAIL] Sign-in attempt with missing email for UID: ${decoded.uid}`);
      return {
        success: false,
        error: "A verified email address is required to sign in to CodeRift.",
      };
    }
    const email = rawEmail.trim().toLowerCase();

    // 4. Verify sign-in provider allowlist
    const provider = decoded.firebase?.sign_in_provider;
    if (provider && !ALLOWED_SIGN_IN_PROVIDERS.has(provider)) {
      console.warn(`[AUTH_DISALLOWED_PROVIDER] Disallowed provider '${provider}' for UID: ${decoded.uid}`);
      return {
        success: false,
        error: "Authentication provider is not supported.",
      };
    }

    const uid = decoded.uid;
    const name = decoded.name || email.split("@")[0];
    const avatar = decoded.picture || "cyber_ninja";

    let isNewUser = false;
    let user = null;

    // 5. Account matching: Lookup by unique firebaseUid first
    user = await db.user.findUnique({
      where: { firebaseUid: uid },
    });

    if (!user) {
      // 5.1 If not found by firebaseUid, look up by verified email for legacy accounts
      const userByEmail = await db.user.findUnique({
        where: { email },
      });

      if (userByEmail) {
        // If account already has a DIFFERENT firebaseUid bound, reject to prevent account collision
        if (userByEmail.firebaseUid && userByEmail.firebaseUid !== uid) {
          console.error(`[AUTH_UID_MISMATCH] UID '${uid}' tried to claim email '${email}' which is already linked to UID '${userByEmail.firebaseUid}'`);
          return {
            success: false,
            error: "Authentication failed. Account configuration mismatch.",
          };
        }

        // Link legacy account on first verified login
        user = await db.user.update({
          where: { id: userByEmail.id },
          data: {
            firebaseUid: uid,
            googleId: uid,
          },
        });
      }
    }

    // 5.2 Create new clean user profile if no account exists
    if (!user) {
      isNewUser = true;

      // Generate a clean unique username from verified name/email
      let baseUsername = name.replace(/[^a-zA-Z0-9]/g, "");
      if (!baseUsername || baseUsername.length < 3) {
        baseUsername = "Warrior";
      }

      let uniqueUsername = baseUsername;
      let counter = 1;
      while (await db.user.findUnique({ where: { username: uniqueUsername } })) {
        uniqueUsername = `${baseUsername}${counter}`;
        counter++;
      }

      user = await db.user.create({
        data: {
          email,
          username: uniqueUsername,
          firebaseUid: uid,
          googleId: uid,
          avatar: "cyber_ninja",
          xp: 0,
          level: 1,
          currentStreak: 0,
          longestStreak: 0,
          totalSolved: 0,
          streakShields: 1,
          leetcodeConnected: false,
          role: "USER",
        },
      });
    }

    // 6. Issue secure JWT Session Cookie ONLY after verified authentication
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
    console.error("[AUTH_LOGIN_FATAL_ERROR]", error);
    return {
      success: false,
      error: "Authentication failed. Please try again.",
    };
  }
}

export const loginWithGoogleAuth = loginWithFirebaseAuth;


import { z } from "zod";

const ConnectHandleSchema = z.object({
  username: z.string().trim().min(1, "Username is required").max(64, "Username is too long"),
});

const UpdateProfileSchema = z.object({
  username: z.string().trim().min(3, "Warrior Tag must be at least 3 characters").max(30, "Warrior Tag must be at most 30 characters").regex(/^[a-zA-Z0-9_]+$/, "Warrior Tag can only contain letters, numbers, and underscores").optional(),
  avatar: z.string().trim().min(1).max(64).optional(),
  leetcodeUsername: z.string().trim().max(64).optional(),
  gfgUsername: z.string().trim().max(64).optional(),
});

/**
 * Retrieve or generate a unique handle ownership verification token for the authenticated user
 */
export async function getOrCreateHandleVerificationToken() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const user = await db.user.findUnique({
    where: { id: currentUser.id },
  });

  if (!user) {
    return { success: false, error: "User profile not found." };
  }

  if (user.handleVerificationCode) {
    return { success: true, token: user.handleVerificationCode };
  }

  const token = `CR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  await db.user.update({
    where: { id: currentUser.id },
    data: { handleVerificationCode: token },
  });

  return { success: true, token };
}

/**
 * Connect or update LeetCode Account
 */
export async function connectLeetCodeAccount(leetcodeUsername: string) {
  const parsed = ConnectHandleSchema.safeParse({ username: leetcodeUsername });
  if (!parsed.success) {
    return { success: false, error: "Please provide a valid LeetCode username." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const clean = parsed.data.username.replace(/^@/, "");
  if (!clean) {
    return { success: false, error: "Please provide a valid LeetCode username." };
  }

  // 1. Enforce 1 handle per account: check if another user is already linked to this handle
  const existingWithHandle = await db.user.findFirst({
    where: {
      leetcodeUsername: clean,
      NOT: { id: currentUser.id },
    },
  });

  if (existingWithHandle) {
    return {
      success: false,
      error: "This LeetCode handle is already linked to another CodeRift account.",
    };
  }

  // 2. Obtain verification token
  const tokenRes = await getOrCreateHandleVerificationToken();
  if (!tokenRes.success || !tokenRes.token) {
    return { success: false, error: "Could not generate verification token." };
  }
  const token = tokenRes.token;

  // 3. Verify handle bio contains token
  const { fetchLeetCodeProfile } = await import("@/lib/leetcode");
  const profileRes = await fetchLeetCodeProfile(clean);
  if (!profileRes.success || !profileRes.profile) {
    return {
      success: false,
      error: profileRes.error || `LeetCode account @${clean} could not be verified.`,
    };
  }

  const bio = profileRes.profile.aboutMe || "";
  if (!bio.includes(token)) {
    return {
      success: false,
      error: `Verification token "${token}" was not found in @${clean}'s LeetCode profile bio/aboutMe. Please add "${token}" to your LeetCode profile bio, save it on LeetCode, and try again.`,
    };
  }

  const updated = await db.user.update({
    where: { id: currentUser.id },
    data: {
      leetcodeUsername: clean,
      leetcodeConnected: true,
      leetcodeVerifiedAt: new Date(),
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/problems");

  return {
    success: true,
    leetcodeUsername: updated.leetcodeUsername,
    leetcodeConnected: updated.leetcodeConnected,
  };
}

/**
 * Disconnect LeetCode Account
 */
export async function disconnectLeetCodeAccount() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const updated = await db.user.update({
    where: { id: currentUser.id },
    data: {
      leetcodeUsername: null,
      leetcodeConnected: false,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return {
    success: true,
    leetcodeUsername: null,
    leetcodeConnected: false,
  };
}

/**
 * Check if a LeetCode handle exists and fetch profile statistics
 */
export async function checkLeetCodeAccount(username: string) {
  const parsed = ConnectHandleSchema.safeParse({ username });
  if (!parsed.success) {
    return { success: false, exists: false, error: "Invalid username format." };
  }

  const currentUser = await getCurrentUser();
  const identifier = currentUser?.id || (await getClientIp());
  const rateLimitRes = await checkRateLimit(RATE_LIMIT_CONFIGS.CHECK_ACCOUNT, identifier);
  if (!rateLimitRes.success) {
    return { success: false, exists: false, error: "Too many profile check requests. Please slow down." };
  }

  const { fetchLeetCodeProfile } = await import("@/lib/leetcode");
  return fetchLeetCodeProfile(parsed.data.username);
}

/**
 * Connect or update GeeksforGeeks Account
 */
export async function connectGfgAccount(gfgUsername: string) {
  const parsed = ConnectHandleSchema.safeParse({ username: gfgUsername });
  if (!parsed.success) {
    return { success: false, error: "Please provide a valid GeeksforGeeks username." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const clean = parsed.data.username.replace(/^@/, "");
  if (!clean) {
    return { success: false, error: "Please provide a valid GeeksforGeeks username." };
  }

  // 1. Enforce 1 handle per account: check if another user is already linked to this handle
  const existingWithHandle = await db.user.findFirst({
    where: {
      gfgUsername: clean,
      NOT: { id: currentUser.id },
    },
  });

  if (existingWithHandle) {
    return {
      success: false,
      error: "This GeeksforGeeks handle is already linked to another CodeRift account.",
    };
  }

  // 2. Obtain verification token
  const tokenRes = await getOrCreateHandleVerificationToken();
  if (!tokenRes.success || !tokenRes.token) {
    return { success: false, error: "Could not generate verification token." };
  }
  const token = tokenRes.token;

  // 3. Verify handle bio contains token
  const { fetchGfgProfile } = await import("@/lib/gfg");
  const profileRes = await fetchGfgProfile(clean);
  if (!profileRes.success || !profileRes.profile) {
    return {
      success: false,
      error: profileRes.error || `GeeksforGeeks account @${clean} could not be verified.`,
    };
  }

  const bio = profileRes.profile.bio || "";
  if (!bio.includes(token)) {
    return {
      success: false,
      error: `Verification token "${token}" was not found in @${clean}'s GeeksforGeeks bio. Please add "${token}" to your GFG profile bio, save it on GFG, and try again.`,
    };
  }

  const updated = await db.user.update({
    where: { id: currentUser.id },
    data: {
      gfgUsername: clean,
      gfgConnected: true,
      gfgVerifiedAt: new Date(),
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/problems");

  return {
    success: true,
    gfgUsername: updated.gfgUsername,
    gfgConnected: updated.gfgConnected,
  };
}

/**
 * Disconnect GeeksforGeeks Account
 */
export async function disconnectGfgAccount() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const updated = await db.user.update({
    where: { id: currentUser.id },
    data: {
      gfgUsername: null,
      gfgConnected: false,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/problems");

  return {
    success: true,
    gfgUsername: null,
    gfgConnected: false,
  };
}

/**
 * Check if a GeeksforGeeks handle exists and fetch profile statistics
 */
export async function checkGfgAccount(username: string) {
  const parsed = ConnectHandleSchema.safeParse({ username });
  if (!parsed.success) {
    return { success: false, exists: false, error: "Invalid username format." };
  }

  const currentUser = await getCurrentUser();
  const identifier = currentUser?.id || (await getClientIp());
  const rateLimitRes = await checkRateLimit(RATE_LIMIT_CONFIGS.CHECK_ACCOUNT, identifier);
  if (!rateLimitRes.success) {
    return { success: false, exists: false, error: "Too many profile check requests. Please slow down." };
  }

  const { fetchGfgProfile } = await import("@/lib/gfg");
  return fetchGfgProfile(parsed.data.username);
}

/**
 * Update Profile details (Username, Avatar, LeetCode, GeeksforGeeks)
 */
export async function updateProfile(data: {
  username?: string;
  avatar?: string;
  leetcodeUsername?: string;
  gfgUsername?: string;
}) {
  const parsed = UpdateProfileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid profile data provided." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const validData = parsed.data;
  const updates: any = {};

  if (validData.username) {
    const cleanUsername = validData.username.trim();
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

  if (validData.avatar) {
    updates.avatar = validData.avatar;
  }

  if (validData.leetcodeUsername !== undefined) {
    const cleanLc = validData.leetcodeUsername.trim().replace(/^@/, "");
    updates.leetcodeUsername = cleanLc || null;
    updates.leetcodeConnected = !!cleanLc;
  }

  if (validData.gfgUsername !== undefined) {
    const cleanGfg = validData.gfgUsername.trim().replace(/^@/, "");
    updates.gfgUsername = cleanGfg || null;
    updates.gfgConnected = !!cleanGfg;
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
          score: 0,
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
