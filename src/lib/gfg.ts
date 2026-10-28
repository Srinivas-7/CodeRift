/**
 * GeeksforGeeks Integration & Submission Verification Engine for DSA ARENA
 *
 * Verifies that a connected user (@gfgUsername) has solved and submitted solutions
 * for GeeksforGeeks problems in Striver's SDE Sheet.
 */

import { z } from "zod";

export interface GfgUserProfile {
  username: string;
  name?: string;
  bio?: string;
  profilePic?: string;
  codingScore?: number;
  totalSolved?: number;
  institution?: string;
  rank?: string | number;
  easySolved?: number;
  mediumSolved?: number;
  hardSolved?: number;
}

export interface VerificationOptions {
  minTimestamp?: Date;
  maxTimestamp?: Date;
}

export interface GfgSolvedProblem {
  id: string;
  slug: string;
  pname: string;
  lang?: string;
  user_subtime?: string;
  difficulty?: string;
}

/**
 * Extracts problem slug from a GeeksforGeeks problem URL
 * e.g. "https://www.geeksforgeeks.org/problems/find-missing-and-repeating2512/1" -> "find-missing-and-repeating2512"
 */
export function extractGfgSlug(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/geeksforgeeks\.org\/problems\/([^/?#]+)/i);
  if (match && match[1]) {
    return match[1].toLowerCase();
  }
  return null;
}

/**
 * Normalizes title into a matching slug format
 */
export function slugifyGfgTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Fetches user profile data from GeeksforGeeks public endpoints/profile
 */
export async function fetchGfgProfile(
  gfgUsername: string
): Promise<{
  success: boolean;
  exists: boolean;
  profile?: GfgUserProfile;
  error?: string;
}> {
  if (!gfgUsername || !gfgUsername.trim()) {
    return { success: false, exists: false, error: "Please provide a GeeksforGeeks username." };
  }

  const cleanUsername = gfgUsername.trim().replace(/^@/, "");

  let totalSolved = 0;
  let easySolved = 0;
  let mediumSolved = 0;
  let hardSolved = 0;
  let hasValidApiResponse = false;

  // 1. Fetch practice submissions data from official GFG practice API
  try {
    const apiRes = await fetch("https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/", {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ handle: cleanUsername }),
      signal: AbortSignal.timeout(8000),
    });

    if (apiRes.status === 406) {
      return {
        success: false,
        exists: false,
        error: `No GeeksforGeeks user found matching @${cleanUsername}. Please check the spelling of your GFG handle.`,
      };
    }

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && data.status === "success") {
        hasValidApiResponse = true;
        totalSolved = typeof data.count === "number" ? data.count : 0;
        if (data.result && typeof data.result === "object") {
          easySolved =
            Object.keys(data.result.Easy || {}).length +
            Object.keys(data.result.Basic || {}).length +
            Object.keys(data.result.School || {}).length;
          mediumSolved = Object.keys(data.result.Medium || {}).length;
          hardSolved = Object.keys(data.result.Hard || {}).length;
        }
      }
    }
  } catch (err: any) {
    // Continue to HTML fetch as fallback
  }

  // 2. Fetch user profile page for bio, institution, score, and rank
  try {
    const profileRes = await fetch(`https://www.geeksforgeeks.org/user/${encodeURIComponent(cleanUsername)}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (profileRes.status === 404 && !hasValidApiResponse) {
      return {
        success: false,
        exists: false,
        error: `No GeeksforGeeks user found matching @${cleanUsername}. Please check the spelling of your GFG handle.`,
      };
    }

    if (profileRes.ok || hasValidApiResponse) {
      let bio: string | undefined;
      let codingScore = 0;
      let rank: string | number | undefined;
      let institution: string | undefined;
      let name: string = cleanUsername;

      if (profileRes.ok) {
        const html = await profileRes.text();

        // Extract Next.js RSC chunks
        const rscMatches = [...html.matchAll(/self\.__next_f\.push\(\[1,"([\s\S]*?)"\]\)/g)];
        let combined = "";
        for (const m of rscMatches) {
          try {
            combined += JSON.parse(`"${m[1]}"`);
          } catch {
            combined += m[1];
          }
        }
        const fullContent = combined + " " + html;

        // Extract bio
        const bioMatch =
          fullContent.match(/"bio":"(.*?)"/) ||
          fullContent.match(/"description":"(.*?)"/) ||
          fullContent.match(/class="user_bio"[^>]*>(.*?)<\/div>/i);
        if (bioMatch && bioMatch[1]) {
          bio = bioMatch[1].replace(/\\n/g, "\n").trim();
        }

        // Extract coding score
        const scoreMatch = fullContent.match(/"score":\s*(\d+)/);
        if (scoreMatch) {
          codingScore = parseInt(scoreMatch[1], 10) || 0;
        }

        // Extract total problems solved if not already populated from API
        if (!totalSolved) {
          const solvedMatch = fullContent.match(/"total_problems_solved":\s*(\d+)/);
          if (solvedMatch) {
            totalSolved = parseInt(solvedMatch[1], 10) || 0;
          }
        }

        // Extract institute rank
        const rankMatch = fullContent.match(/"institute_rank":\s*(\d+)/);
        if (rankMatch) {
          rank = parseInt(rankMatch[1], 10);
        }

        // Extract institution name
        const instMatch = fullContent.match(/"institute_name":"(.*?)"/);
        if (instMatch && instMatch[1]) {
          institution = instMatch[1];
        }

        // Extract full name
        const nameMatch = fullContent.match(/"name":"(.*?)"/);
        if (nameMatch && nameMatch[1]) {
          name = nameMatch[1];
        }
      }

      return {
        success: true,
        exists: true,
        profile: {
          username: cleanUsername,
          name,
          bio,
          codingScore,
          totalSolved,
          institution,
          rank,
          easySolved,
          mediumSolved,
          hardSolved,
        },
      };
    }
  } catch (err: any) {
    if (hasValidApiResponse) {
      return {
        success: true,
        exists: true,
        profile: {
          username: cleanUsername,
          name: cleanUsername,
          totalSolved,
          easySolved,
          mediumSolved,
          hardSolved,
        },
      };
    }
    return {
      success: false,
      exists: false,
      error:
        err.name === "TimeoutError" || err.name === "AbortError"
          ? "GeeksforGeeks verification timed out. Please try again."
          : "Failed to connect to GeeksforGeeks.",
    };
  }

  return {
    success: false,
    exists: false,
    error: `Unable to verify GeeksforGeeks profile for @${cleanUsername}.`,
  };
}

/**
 * Verifies that a GeeksforGeeks user has solved a specific problem.
 */
export async function verifyGfgSubmission(
  gfgUsername: string,
  problemTitle: string,
  problemGfgUrl?: string | null,
  options?: VerificationOptions
): Promise<{
  verified: boolean;
  submissionId?: string;
  solvedAt?: Date;
  lang?: string;
  userExists?: boolean;
  message: string;
}> {
  if (!gfgUsername || !gfgUsername.trim()) {
    return {
      verified: false,
      message: "Please enter or link your GeeksforGeeks handle first to verify submissions.",
    };
  }

  const cleanUsername = gfgUsername.trim().replace(/^@/, "");
  const rawSlug = extractGfgSlug(problemGfgUrl) || slugifyGfgTitle(problemTitle);
  const cleanSlug = rawSlug ? rawSlug.toLowerCase().replace(/[-_0-9]+$/, "").trim() : "";
  const targetTitleSlug = slugifyGfgTitle(problemTitle);
  const cleanTitle = problemTitle.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

  try {
    // 1. Fetch practice submissions data directly from GFG practice API
    const apiRes = await fetch("https://practiceapi.geeksforgeeks.org/api/v1/user/problems/submissions/", {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ handle: cleanUsername }),
      signal: AbortSignal.timeout(10000),
    });

    if (apiRes.status === 406) {
      return {
        verified: false,
        userExists: false,
        message: `GeeksforGeeks account @${cleanUsername} does not exist. Please check your GeeksforGeeks handle.`,
      };
    }

    if (!apiRes.ok) {
      return {
        verified: false,
        message: `Could not connect to GeeksforGeeks servers to verify submission. Please try again in a moment.`,
      };
    }

    const data = await apiRes.json();
    if (data.status !== "success" || !data.result) {
      return {
        verified: false,
        userExists: true,
        message: `Could not retrieve problem submissions for @${cleanUsername} from GeeksforGeeks.`,
      };
    }

    // Flatten all solved problems across all difficulty categories
    const allSolved: GfgSolvedProblem[] = [];
    if (data.result && typeof data.result === "object") {
      for (const [diff, problems] of Object.entries(data.result)) {
        if (problems && typeof problems === "object") {
          for (const [id, item] of Object.entries(problems as any)) {
            if (item && typeof item === "object") {
              allSolved.push({
                id,
                slug: String((item as any).slug || "").toLowerCase(),
                pname: String((item as any).pname || "").trim(),
                lang: (item as any).lang,
                user_subtime: (item as any).user_subtime,
                difficulty: diff,
              });
            }
          }
        }
      }
    }

    if (allSolved.length === 0) {
      return {
        verified: false,
        userExists: true,
        message: `We checked your GeeksforGeeks profile (@${cleanUsername}), but haven't detected any solved problems yet (0 problems solved on GFG). Please solve and submit on GFG first.`,
      };
    }

    // Match problem in solved list
    const match = allSolved.find((item) => {
      const itemSlug = item.slug;
      const itemCleanSlug = itemSlug.replace(/[-_0-9]+$/, "").trim();
      const itemTitleSlug = slugifyGfgTitle(item.pname);
      const itemCleanTitle = item.pname.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

      // Exact slug match
      if (rawSlug && itemSlug === rawSlug) return true;
      if (cleanSlug && itemCleanSlug === cleanSlug) return true;
      if (cleanSlug && itemSlug.includes(cleanSlug)) return true;
      if (rawSlug && itemSlug.includes(rawSlug)) return true;
      if (cleanSlug && cleanSlug.includes(itemCleanSlug) && itemCleanSlug.length >= 4) return true;

      // Title slug match
      if (
        itemTitleSlug &&
        targetTitleSlug &&
        (itemTitleSlug === targetTitleSlug ||
          itemTitleSlug.includes(targetTitleSlug) ||
          targetTitleSlug.includes(itemTitleSlug))
      ) {
        return true;
      }

      // Normalized title match
      if (itemCleanTitle === cleanTitle) return true;
      if (
        itemCleanTitle &&
        cleanTitle &&
        (itemCleanTitle.includes(cleanTitle) || cleanTitle.includes(itemCleanTitle))
      ) {
        return true;
      }

      // Word-overlap match for multi-word titles
      const titleWords = cleanTitle
        .split(" ")
        .filter((w) => w.length > 2 && !["the", "and", "for", "with", "from", "in", "of"].includes(w));
      if (titleWords.length >= 2) {
        const matchedWords = titleWords.filter((w) => itemCleanTitle.includes(w) || itemCleanSlug.includes(w));
        if (matchedWords.length === titleWords.length) return true;
      }

      return false;
    });

    if (!match) {
      return {
        verified: false,
        userExists: true,
        message: `We checked your GeeksforGeeks profile (@${cleanUsername}, ${allSolved.length} solved problems found), but did not find an accepted solution for "${problemTitle}". Make sure you submit your code on GFG and get an "Accepted" verdict before verifying.`,
      };
    }

    // Parse solve date
    let solvedDate = new Date();
    if (match.user_subtime) {
      // GFG timestamps are formatted like "2024-11-07 00:24:56" in Indian Standard Time (+05:30)
      const parsed = new Date(match.user_subtime.replace(" ", "T") + "+05:30");
      if (!isNaN(parsed.getTime())) {
        solvedDate = parsed;
      }
    }

    // Verify competition window constraint if provided
    if (options?.minTimestamp && solvedDate < options.minTimestamp) {
      return {
        verified: false,
        message: `Submission for "${problemTitle}" was solved on ${solvedDate.toLocaleDateString()} outside the active daily competition window.`,
      };
    }

    const submissionId = match.id || `GFG-${Date.now().toString().slice(-6)}`;

    return {
      verified: true,
      submissionId,
      solvedAt: solvedDate,
      lang: match.lang || "cpp",
      message: `✓ Verified GeeksforGeeks submission for "${problemTitle}" from @${cleanUsername}! (${match.pname})`,
    };
  } catch (err: any) {
    return {
      verified: false,
      message:
        err.name === "TimeoutError" || err.name === "AbortError"
          ? "GeeksforGeeks verification timed out. Please try again."
          : "Could not reach GeeksforGeeks servers right now. Please check your connection and try again.",
    };
  }
}
