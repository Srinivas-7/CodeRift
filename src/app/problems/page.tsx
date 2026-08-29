import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SDE_SHEET_PROBLEMS } from "@/data/sdeSheetProblems";
import { ProblemListClient } from "@/components/problem/ProblemListClient";

export const dynamic = "force-dynamic";

export default async function ProblemsPage() {
  const user = await getCurrentUser();

  // Fetch all user solved statuses with safe fallback
  let solvedProblemIds: number[] = [];
  if (user) {
    try {
      const statuses = await db.userProblemStatus.findMany({
        where: {
          userId: user.id,
          status: { in: ["SOLVED", "OPTIMAL"] },
        },
        select: { problemId: true },
      });
      solvedProblemIds = (statuses || []).map((s: any) => s.problemId);
    } catch (err) {
      console.error("User problem status fetch error:", err);
    }
  }

  return (
    <ProblemListClient
      problems={SDE_SHEET_PROBLEMS}
      solvedProblemIds={solvedProblemIds}
    />
  );
}
