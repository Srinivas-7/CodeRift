import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { GroupDashboardClient } from "@/components/group/GroupDashboardClient";
import { getGlobalDailyProblemBatch } from "@/lib/daily-challenge";

interface GroupPageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function GroupPage({ params }: GroupPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const group = await db.group.findUnique({
    where: { id },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!group) {
    notFound();
  }

  // Fast parallel fetch for global daily challenge and member progress
  const todayStr = new Date().toISOString().split("T")[0];
  const globalBatch = await getGlobalDailyProblemBatch(todayStr);
  const globalDailyProblemIds = (globalBatch.problems || []).map((p: any) => p.id);
  const memberIds = (group.members || []).map((m: any) => m.userId);

  // Single batch query for all member solved statuses on today's global challenge
  let solvedMap = new Set<string>();
  if (globalDailyProblemIds.length > 0 && memberIds.length > 0) {
    const solvedStatuses = await db.userProblemStatus.findMany({
      where: {
        userId: { in: memberIds },
        problemId: { in: globalDailyProblemIds },
        status: { in: ["SOLVED", "OPTIMAL"] },
      },
      select: { userId: true, problemId: true },
    });
    solvedMap = new Set(solvedStatuses.map((s: any) => `${s.userId}_${s.problemId}`));
  }

  const memberDailyStatus = (group.members || []).map((m: any) => {
    let count = 0;
    globalDailyProblemIds.forEach((pid: number) => {
      if (solvedMap.has(`${m.userId}_${pid}`)) count++;
    });
    return {
      userId: m.userId,
      username: m.user?.username || "Warrior",
      solvedCount: count,
    };
  });

  const isLeader =
    group.createdById === user.id ||
    (group.members || []).some((m: any) => m.userId === user.id && m.role === "LEADER");

  return (
    <GroupDashboardClient
      group={group}
      currentUserId={user.id}
      isLeader={isLeader}
      memberDailyStatus={memberDailyStatus}
    />
  );
}
