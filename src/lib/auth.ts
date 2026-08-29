import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "./db";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dsa-arena-hyper-maximalist-super-secret-key-2026"
);

const COOKIE_NAME = "dsa_arena_session";

export interface SessionPayload {
  userId: string;
  username: string;
  email: string;
  role: string;
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

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

  return createSession({
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  });
}

export async function removeSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function clearSession() {
  return removeSessionCookie();
}

import { cache } from "react";

export const getSession = cache(async (): Promise<SessionPayload | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
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

  return user;
});
