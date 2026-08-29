import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SDE_SHEET_PROBLEMS } from "@/data/sdeSheetProblems";
import { notFound } from "next/navigation";
import { ProblemDetailClient } from "@/components/problem/ProblemDetailClient";

interface ProblemPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProblemPage({ params }: ProblemPageProps) {
  const { id } = await params;
  const problemId = parseInt(id, 10);

  const problem = SDE_SHEET_PROBLEMS.find((p) => p.id === problemId);
  if (!problem) {
    notFound();
  }

  const user = await getCurrentUser();

  let userStatus = "UNSOLVED";
  let previousSubmissions: any[] = [];

  if (user) {
    const [statusRecord, subs] = await Promise.all([
      db.userProblemStatus.findUnique({
        where: {
          userId_problemId: {
            userId: user.id,
            problemId: problem.id,
          },
        },
      }),
      db.submission.findMany({
        where: {
          userId: user.id,
          problemId: problem.id,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    if (statusRecord) userStatus = statusRecord.status;
    previousSubmissions = subs;
  }

  return (
    <ProblemDetailClient
      problem={problem}
      userStatus={userStatus}
      user={user}
      previousSubmissions={previousSubmissions}
    />
  );
}
