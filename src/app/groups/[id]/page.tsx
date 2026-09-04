import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { GroupDashboardClient } from "@/components/group/GroupDashboardClient";
import { getTeamDailyProblemBatch, calculateTeamPhaseInfo, calculatePhaseWinners } from "@/lib/team-phase";

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

  const todayStr = new Date().toISOString().split("T")[0];
  const teamBatch = await getTeamDailyProblemBatch(group, todayStr);
  const phaseInfo = calculateTeamPhaseInfo(group.phase1StartDate, todayStr);
  const winners = calculatePhaseWinners(group.members || []);

  const teamDailyProblemIds = (teamBatch.problems || []).map((p: any) => p.id);
  const memberIds = (group.members || []).map((m: any) => m.userId);

  // Single batch query for all member solved statuses on today's team challenge
  let solvedMap = new Set<string>();
  if (teamDailyProblemIds.length > 0 && memberIds.length > 0) {
    const solvedStatuses = await db.userProblemStatus.findMany({
      where: {
        userId: { in: memberIds },
        problemId: { in: teamDailyProblemIds },
        status: { in: ["SOLVED", "OPTIMAL"] },
      },
      select: { userId: true, problemId: true },
    });
    solvedMap = new Set(solvedStatuses.map((s: any) => `${s.userId}_${s.problemId}`));
  }

  const memberDailyStatus = (group.members || []).map((m: any) => {
    let count = 0;
    teamDailyProblemIds.forEach((pid: number) => {
      if (solvedMap.has(`${m.userId}_${pid}`)) count++;
    });
    return {
      userId: m.userId,
      username: m.user?.username || "Warrior",
      solvedCount: count,
      totalBatchCount: teamDailyProblemIds.length,
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
      phaseInfo={phaseInfo}
      teamBatch={teamBatch}
      winners={winners}
    />
  );
}
