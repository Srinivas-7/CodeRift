/**
 * LeetCode Integration & Submission Verification Engine for DSA ARENA
 *
 * Verifies that a connected user (@username) has successfully solved and received
 * an "Accepted" verdict on LeetCode for a specific Striver SDE Sheet problem.
 */

import { z } from "zod";

export interface LeetCodeRecentSubmission {
  id: string;
  title: string;
  titleSlug: string;
  timestamp: string;
  statusDisplay?: string;
  lang?: string;
}

export interface LeetCodeUserProfile {
  username: string;
  realName?: string;
  aboutMe?: string;
  userAvatar?: string;
  ranking?: number;
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
}

export interface VerificationOptions {
  minTimestamp?: Date;
  maxTimestamp?: Date;
}

const leetCodeGraphQLResponseSchema = z.object({
  data: z
    .object({
      matchedUser: z
        .object({
          username: z.string().optional(),
          profile: z
            .object({
              realName: z.string().nullable().optional(),
              aboutMe: z.string().nullable().optional(),
              userAvatar: z.string().nullable().optional(),
              ranking: z.number().nullable().optional(),
            })
            .nullable()
            .optional(),
          submitStatsGlobal: z
            .object({
              acSubmissionNum: z
                .array(
                  z.object({
                    difficulty: z.string(),
                    count: z.number(),
                  })
                )
                .optional(),
            })
            .nullable()
            .optional(),
        })
        .nullable()
        .optional(),
      recentSubmissionList: z
        .array(
          z.object({
            id: z.string(),
            title: z.string(),
            titleSlug: z.string(),
            statusDisplay: z.string().optional(),
            lang: z.string().optional(),
            timestamp: z.string(),
          })
        )
        .nullable()
        .optional(),
      recentAcSubmissionList: z
        .array(
          z.object({
            id: z.string(),
            title: z.string(),
            titleSlug: z.string(),
            timestamp: z.string(),
          })
        )
        .nullable()
        .optional(),
    })
    .optional(),
  errors: z.array(z.any()).optional(),
});

/**
 * Fetches user profile data from LeetCode GraphQL API
 */
export async function fetchLeetCodeProfile(
  leetcodeUsername: string
): Promise<{
  success: boolean;
  exists: boolean;
  profile?: LeetCodeUserProfile;
  error?: string;
}> {
  if (!leetcodeUsername || !leetcodeUsername.trim()) {
    return { success: false, exists: false, error: "Please provide a username." };
  }

  const cleanUsername = leetcodeUsername.trim().replace(/^@/, "");

  try {
    const userQuery = {
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
              aboutMe
              userAvatar
              ranking
            }
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `,
      variables: { username: cleanUsername },
    };

    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `https://leetcode.com/${encodeURIComponent(cleanUsername)}/`,
      },
      body: JSON.stringify(userQuery),
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return {
        success: false,
        exists: false,
        error: `LeetCode service responded with status ${res.status}. Please try again later.`,
      };
    }

    const json = await res.json();
    const parsed = leetCodeGraphQLResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        success: false,
        exists: false,
        error: "Malformed response received from LeetCode.",
      };
    }

    const matched = parsed.data.data?.matchedUser;
    if (matched) {
      const stats = matched.submitStatsGlobal?.acSubmissionNum || [];
      const allCount = stats.find((s) => s.difficulty === "All")?.count || 0;
      const easyCount = stats.find((s) => s.difficulty === "Easy")?.count || 0;
      const medCount = stats.find((s) => s.difficulty === "Medium")?.count || 0;
      const hardCount = stats.find((s) => s.difficulty === "Hard")?.count || 0;

      return {
        success: true,
        exists: true,
        profile: {
          username: matched.username || cleanUsername,
          realName: matched.profile?.realName || undefined,
          aboutMe: matched.profile?.aboutMe || undefined,
          userAvatar: matched.profile?.userAvatar || undefined,
          ranking: matched.profile?.ranking || undefined,
          totalSolved: allCount,
          easySolved: easyCount,
          mediumSolved: medCount,
          hardSolved: hardCount,
        },
      };
    }

    return {
      success: false,
      exists: false,
      error: `No LeetCode user found matching @${cleanUsername}`,
    };
  } catch (err: any) {
    return {
      success: false,
      exists: false,
      error: err.name === "TimeoutError" || err.name === "AbortError"
        ? "LeetCode API request timed out. Please try again."
        : "Failed to connect to LeetCode API.",
    };
  }
}

/**
 * Extracts title slug from a LeetCode problem URL
 * e.g. "https://leetcode.com/problems/two-sum/" -> "two-sum"
 */
export function extractLeetCodeSlug(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/leetcode\.com\/problems\/([^/?#]+)/i);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }
  return null;
}

/**
 * Normalizes title into a matching slug format
 */
export function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Verifies if the user has an Accepted submission on LeetCode for the given problem
 */
export async function verifyLeetCodeSubmission(
  leetcodeUsername: string,
  problemTitle: string,
  problemLeetcodeUrl?: string | null,
  options?: VerificationOptions
): Promise<{
  verified: boolean;
  submissionId?: string;
  solvedAt?: Date;
  lang?: string;
  userExists?: boolean;
  message: string;
}> {
  if (!leetcodeUsername || !leetcodeUsername.trim()) {
    return {
      verified: false,
      message: "Please enter or link your LeetCode username first to verify submissions.",
    };
  }

  const cleanUsername = leetcodeUsername.trim().replace(/^@/, "");
  const targetSlug =
    extractLeetCodeSlug(problemLeetcodeUrl) || slugifyTitle(problemTitle);

  try {
    const graphqlQuery = {
      query: `
        query recentSubmissions($username: String!, $limit: Int!) {
          recentSubmissionList(username: $username, limit: $limit) {
            id
            title
            titleSlug
            statusDisplay
            lang
            timestamp
          }
          recentAcSubmissionList(username: $username, limit: $limit) {
            id
            title
            titleSlug
            timestamp
          }
        }
      `,
      variables: {
        username: cleanUsername,
        limit: 50,
      },
    };

    const res = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `https://leetcode.com/${encodeURIComponent(cleanUsername)}/`,
      },
      body: JSON.stringify(graphqlQuery),
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return {
        verified: false,
        message: `LeetCode returned status ${res.status}. Could not verify submission.`,
      };
    }

    const json = await res.json();
    const parsed = leetCodeGraphQLResponseSchema.safeParse(json);
    if (!parsed.success) {
      return {
        verified: false,
        message: "Malformed response received from LeetCode API.",
      };
    }

    const recentSubs = parsed.data.data?.recentSubmissionList || [];
    const recentAc = parsed.data.data?.recentAcSubmissionList || [];

    // Helper to validate timestamp against options
    const isWithinWindow = (solvedDate: Date): boolean => {
      // Future date sanity check (allow 60s clock skew)
      if (solvedDate.getTime() > Date.now() + 60000) {
        return false;
      }
      if (options?.minTimestamp && solvedDate < options.minTimestamp) {
        return false;
      }
      if (options?.maxTimestamp && solvedDate > options.maxTimestamp) {
        return false;
      }
      return true;
    };

    // Match in recentAcSubmissionList
    const acMatch = recentAc.find(
      (sub) =>
        sub.titleSlug?.toLowerCase() === targetSlug ||
        slugifyTitle(sub.title || "") === targetSlug ||
        sub.title?.toLowerCase().trim() === problemTitle.toLowerCase().trim()
    );

    if (acMatch) {
      const solvedDate = new Date(parseInt(acMatch.timestamp, 10) * 1000);
      if (isWithinWindow(solvedDate)) {
        return {
          verified: true,
          submissionId: acMatch.id,
          solvedAt: solvedDate,
          message: `✓ Verified accepted submission for "${acMatch.title}" from @${cleanUsername}! (Submission #${acMatch.id})`,
        };
      } else {
        return {
          verified: false,
          message: `Submission for "${acMatch.title}" was solved outside the active competition window.`,
        };
      }
    }

    // Match in recentSubmissionList with statusDisplay === 'Accepted'
    const subMatch = recentSubs.find(
      (s) =>
        (s.titleSlug?.toLowerCase() === targetSlug ||
          slugifyTitle(s.title || "") === targetSlug ||
          s.title?.toLowerCase().trim() === problemTitle.toLowerCase().trim()) &&
        (s.statusDisplay === "Accepted" || s.statusDisplay === "ACCEPTED")
    );

    if (subMatch) {
      const solvedDate = new Date(parseInt(subMatch.timestamp, 10) * 1000);
      if (isWithinWindow(solvedDate)) {
        return {
          verified: true,
          submissionId: subMatch.id,
          lang: subMatch.lang,
          solvedAt: solvedDate,
          message: `✓ Verified accepted submission for "${subMatch.title}" from @${cleanUsername}! (${subMatch.lang || "Code"}, Submission #${subMatch.id})`,
        };
      } else {
        return {
          verified: false,
          message: `Submission for "${subMatch.title}" was solved outside the active competition window.`,
        };
      }
    }

    return {
      verified: false,
      userExists: true,
      message: `No "Accepted" solution for "${problemTitle}" found in recent LeetCode submissions for @${cleanUsername}.`,
    };
  } catch (err: any) {
    return {
      verified: false,
      message: err.name === "TimeoutError" || err.name === "AbortError"
        ? "LeetCode verification request timed out. Please try again."
        : "Failed to connect to LeetCode for verification.",
    };
  }
}
