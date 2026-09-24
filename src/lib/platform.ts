/**
 * Multi-Platform Judge & Platform Utility for DSA ARENA
 * Detects whether a problem is hosted on LeetCode, GeeksforGeeks, InterviewBit, etc.
 */

export type CodingPlatform = "LEETCODE" | "GFG" | "INTERVIEWBIT" | "CODING_NINJAS" | "OTHER";

export interface PlatformInfo {
  platform: CodingPlatform;
  displayName: string;
  solveButtonText: string;
  themeColor: string;
  badgeBg: string;
  badgeBorder: string;
  btnClassName: string;
  handleField: "leetcodeUsername" | "gfgUsername" | null;
  handleDisplayName: string;
}

export function detectProblemPlatform(url?: string | null): CodingPlatform {
  if (!url || typeof url !== "string") return "LEETCODE";
  const lower = url.toLowerCase();
  if (lower.includes("geeksforgeeks.org") || lower.includes("practice.geeksforgeeks") || lower.includes("gfg")) {
    return "GFG";
  }
  if (lower.includes("interviewbit.com")) {
    return "INTERVIEWBIT";
  }
  if (lower.includes("naukri.com") || lower.includes("codingninjas.com") || lower.includes("code360")) {
    return "CODING_NINJAS";
  }
  if (lower.includes("leetcode.com")) {
    return "LEETCODE";
  }
  return "LEETCODE";
}

export function getProblemPlatformInfo(url?: string | null): PlatformInfo {
  const platform = detectProblemPlatform(url);

  switch (platform) {
    case "GFG":
      return {
        platform: "GFG",
        displayName: "GFG",
        solveButtonText: "SOLVE ON GFG ↗",
        themeColor: "#2F8D46",
        badgeBg: "rgba(47, 141, 70, 0.15)",
        badgeBorder: "rgba(47, 141, 70, 0.45)",
        btnClassName: "btn-gfg",
        handleField: "gfgUsername",
        handleDisplayName: "GFG",
      };
    case "INTERVIEWBIT":
      return {
        platform: "INTERVIEWBIT",
        displayName: "InterviewBit",
        solveButtonText: "SOLVE ON INTERVIEWBIT ↗",
        themeColor: "#007BFF",
        badgeBg: "rgba(0, 123, 255, 0.15)",
        badgeBorder: "rgba(0, 123, 255, 0.45)",
        btnClassName: "btn-interviewbit",
        handleField: "leetcodeUsername",
        handleDisplayName: "InterviewBit",
      };
    case "CODING_NINJAS":
      return {
        platform: "CODING_NINJAS",
        displayName: "Coding Ninjas",
        solveButtonText: "SOLVE ON CODING NINJAS ↗",
        themeColor: "#F25C05",
        badgeBg: "rgba(242, 92, 5, 0.15)",
        badgeBorder: "rgba(242, 92, 5, 0.45)",
        btnClassName: "btn-codingninjas",
        handleField: "leetcodeUsername",
        handleDisplayName: "Coding Ninjas",
      };
    case "LEETCODE":
    default:
      return {
        platform: "LEETCODE",
        displayName: "LeetCode",
        solveButtonText: "SOLVE ON LEETCODE ↗",
        themeColor: "#FFA116",
        badgeBg: "rgba(255, 161, 22, 0.12)",
        badgeBorder: "rgba(255, 161, 22, 0.4)",
        btnClassName: "btn-leetcode",
        handleField: "leetcodeUsername",
        handleDisplayName: "LeetCode",
      };
  }
}
