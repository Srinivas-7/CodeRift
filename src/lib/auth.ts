import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "./db";
import { syncUserStreak } from "./streaks";

const COOKIE_NAME = "dsa_arena_session";

export interface SessionPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
  sessionVersion?: number;
}

export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length < 32) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload) {
  const secretKey = getJwtSecretKey();
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return token;
}

export async function setSessionCookie(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new Error("User not found");

  const sessionVersion = typeof user.sessionVersion === "number" ? user.sessionVersion : 1;

  return createSession({
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    sessionVersion,
  });
}

export async function removeSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function clearSession() {
  return removeSessionCookie();
}

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    // Validate payload shape
    if (
      typeof payload.userId !== "string" ||
      !payload.userId ||
      typeof payload.exp !== "number" ||
      typeof payload.username !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }

    const sessionVersion = typeof payload.sessionVersion === "number" ? payload.sessionVersion : 1;

    return {
      userId: payload.userId,
      username: payload.username,
      email: payload.email,
      role: payload.role,
      sessionVersion,
    };
  } catch {
    return null;
  }
});

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      groupMemberships: {
        include: {
          group: true,
        },
      },
    },
  });

  if (!user) return null;

  // Enforce sessionVersion match for global token revocation
  const currentDbVersion = typeof user.sessionVersion === "number" ? user.sessionVersion : 1;
  const sessionVersion = typeof session.sessionVersion === "number" ? session.sessionVersion : 1;

  if (currentDbVersion !== sessionVersion) {
    try {
      await removeSessionCookie();
    } catch {
      // Ignore if headers are already read-only
    }
    return null;
  }

  try {
    const streakInfo = await syncUserStreak(user.id);
    user.currentStreak = streakInfo.currentStreak;
    user.longestStreak = streakInfo.longestStreak;
    user.streakShields = streakInfo.streakShields;
  } catch (err) {
    console.error("Error syncing streak in getCurrentUser:", err);
  }

  return user;
});
