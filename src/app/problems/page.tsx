import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SDE_SHEET_PROBLEMS } from "@/data/sdeSheetProblems";
import { ProblemListClient } from "@/components/problem/ProblemListClient";

export default async function ProblemsPage() {
  const user = await getCurrentUser();

  // Fetch all user solved statuses
  let solvedProblemIds: number[] = [];
  if (user) {
    const statuses = await db.userProblemStatus.findMany({
      where: {
        userId: user.id,
        status: { in: ["SOLVED", "OPTIMAL"] },
      },
      select: { problemId: true },
    });
    solvedProblemIds = statuses.map((s) => s.problemId);
  }

  return (
    <ProblemListClient
      problems={SDE_SHEET_PROBLEMS}
      solvedProblemIds={solvedProblemIds}
    />
  );
}
