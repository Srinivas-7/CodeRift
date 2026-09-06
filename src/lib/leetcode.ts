/**
 * LeetCode Integration & Submission Verification Engine for DSA ARENA
 *
 * Verifies that a connected user (@username) has successfully solved and received
 * an "Accepted" verdict on LeetCode for a specific Striver SDE Sheet problem.
 */

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
  userAvatar?: string;
  ranking?: number;
  totalSolved?: number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
}

/**
 * Fetches user profile data from LeetCode GraphQL API with fallback
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

  // 1. Check official LeetCode GraphQL
  try {
    const userQuery = {
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            profile {
              realName
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
        Referer: `https://leetcode.com/${cleanUsername}/`,
      },
      body: JSON.stringify(userQuery),
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const data = await res.json();
      const matched = data?.data?.matchedUser;
      if (matched) {
        const stats = matched.submitStatsGlobal?.acSubmissionNum || [];
        const allCount = stats.find((s: any) => s.difficulty === "All")?.count || 0;
        const easyCount = stats.find((s: any) => s.difficulty === "Easy")?.count || 0;
        const medCount = stats.find((s: any) => s.difficulty === "Medium")?.count || 0;
        const hardCount = stats.find((s: any) => s.difficulty === "Hard")?.count || 0;

        return {
          success: true,
          exists: true,
          profile: {
            username: matched.username || cleanUsername,
            realName: matched.profile?.realName || undefined,
            userAvatar: matched.profile?.userAvatar || undefined,
            ranking: matched.profile?.ranking || undefined,
            totalSolved: allCount,
            easySolved: easyCount,
            mediumSolved: medCount,
            hardSolved: hardCount,
          },
        };
      } else if (data?.errors?.length) {
        return {
          success: false,
          exists: false,
          error: `No LeetCode user found matching @${cleanUsername}`,
        };
      }
    }
  } catch (err: any) {
    console.warn("LeetCode GraphQL fetch profile failed:", err?.message || err);
  }

  // 2. Fallback check on Alfa LeetCode API
  try {
    const alfaRes = await fetch(
      `https://alfa-leetcode-api.onrender.com/userProfile/${cleanUsername}`,
      { next: { revalidate: 0 } }
    );
    if (alfaRes.ok) {
      const alfaData = await alfaRes.json();
      if (alfaData && (alfaData.username || alfaData.totalSolved !== undefined)) {
        return {
          success: true,
          exists: true,
          profile: {
            username: alfaData.username || cleanUsername,
            realName: alfaData.name || alfaData.realName,
            userAvatar: alfaData.avatar || alfaData.userAvatar,
            ranking: alfaData.ranking,
            totalSolved: alfaData.totalSolved || 0,
            easySolved: alfaData.easySolved || 0,
            mediumSolved: alfaData.mediumSolved || 0,
            hardSolved: alfaData.hardSolved || 0,
          },
        };
      }
    }
  } catch (err: any) {
    console.warn("Alfa LeetCode profile fallback check failed:", err?.message || err);
  }

  // 3. Permissive fallback if external networks were slow: Assume format is valid
  return {
    success: true,
    exists: true,
    profile: {
      username: cleanUsername,
    },
  };
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
  providedSubmissionIdOrUrl?: string | null
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

  // 1. Verify User Profile & Existence on LeetCode GraphQL
  try {
    const userQuery = {
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
          }
        }
      `,
      variables: { username: cleanUsername },
    };

    const userRes = await fetch("https://leetcode.com/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `https://leetcode.com/${cleanUsername}/`,
      },
      body: JSON.stringify(userQuery),
      next: { revalidate: 0 },
    });

    if (userRes.ok) {
      const userData = await userRes.json();
      if (!userData?.data?.matchedUser && userData?.errors?.length) {
        return {
          verified: false,
          userExists: false,
          message: `LeetCode account @${cleanUsername} does not exist on LeetCode. Please check the spelling of your LeetCode username.`,
        };
      }
    }
  } catch (err) {
    console.warn("LeetCode user existence check failed", err);
  }

  let totalSubmissionsChecked = 0;

  // 2. Query official LeetCode GraphQL API for recent submissions & accepted submissions
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
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `https://leetcode.com/${cleanUsername}/`,
      },
      body: JSON.stringify(graphqlQuery),
      next: { revalidate: 0 },
    });

    if (res.ok) {
      const data = await res.json();
      const recentSubs: LeetCodeRecentSubmission[] =
        data?.data?.recentSubmissionList || [];
      const recentAc: LeetCodeRecentSubmission[] =
        data?.data?.recentAcSubmissionList || [];

      totalSubmissionsChecked = Math.max(recentSubs.length, recentAc.length);

      // Match in recentAcSubmissionList
      const acMatch = recentAc.find(
        (sub) =>
          sub.titleSlug?.toLowerCase() === targetSlug ||
          slugifyTitle(sub.title || "") === targetSlug ||
          sub.title?.toLowerCase().trim() === problemTitle.toLowerCase().trim()
      );

      if (acMatch) {
        const solvedDate = acMatch.timestamp
          ? new Date(parseInt(acMatch.timestamp, 10) * 1000)
          : new Date();
        return {
          verified: true,
          submissionId: acMatch.id,
          solvedAt: solvedDate,
          message: `✓ Verified accepted submission for "${acMatch.title}" from @${cleanUsername}! (Submission #${acMatch.id})`,
        };
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
        const solvedDate = subMatch.timestamp
          ? new Date(parseInt(subMatch.timestamp, 10) * 1000)
          : new Date();
        return {
          verified: true,
          submissionId: subMatch.id,
          lang: subMatch.lang,
          solvedAt: solvedDate,
          message: `✓ Verified accepted submission for "${subMatch.title}" from @${cleanUsername}! (${subMatch.lang || "Code"}, Submission #${subMatch.id})`,
        };
      }
    }
  } catch (err) {
    console.warn("LeetCode GraphQL check failed, trying secondary endpoints", err);
  }

  // 3. Fallback: Alfa LeetCode API check endpoint
  try {
    const alfaRes = await fetch(
      `https://alfa-leetcode-api.onrender.com/${cleanUsername}/acSubmission?limit=50`,
      { next: { revalidate: 0 } }
    );
    if (alfaRes.ok) {
      const alfaData = await alfaRes.json();
      const subs = alfaData?.submission || alfaData?.recentSubmissions || [];
      totalSubmissionsChecked = Math.max(totalSubmissionsChecked, subs.length);
      const matched = subs.find(
        (s: any) =>
          s.titleSlug?.toLowerCase() === targetSlug ||
          slugifyTitle(s.title || "") === targetSlug ||
          s.title?.toLowerCase().trim() === problemTitle.toLowerCase().trim()
      );

      if (matched) {
        return {
          verified: true,
          submissionId: matched.id || `LC-${Date.now()}`,
          lang: matched.lang,
          solvedAt: matched.timestamp
            ? new Date(parseInt(matched.timestamp, 10) * 1000)
            : new Date(),
          message: `✓ Verified accepted submission for "${problemTitle}" from @${cleanUsername}!`,
        };
      }
    }
  } catch (err) {
    console.warn("Alfa LeetCode API check failed", err);
  }

  // 4. Strict result: If no accepted submission was found on LeetCode
  return {
    verified: false,
    userExists: true,
    message: `We checked your recent LeetCode submissions under @${cleanUsername}, but haven't detected an "Accepted" solution for "${problemTitle}" yet.`,
  };
}
