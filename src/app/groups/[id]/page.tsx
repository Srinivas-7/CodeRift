import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { GroupDashboardClient } from "@/components/group/GroupDashboardClient";

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

  // Fast parallel fetch for member daily challenges and progress
  const todayStr = new Date().toISOString().split("T")[0];
  const memberIds = group.members.map((m) => m.userId);

  const todayDailies = await db.dailyChallenge.findMany({
    where: {
      userId: { in: memberIds },
      date: todayStr,
    },
  });

  // Single batch query for all member solved statuses
  const allDailyProblemIds = new Set<number>();
  todayDailies.forEach((d) => {
    allDailyProblemIds.add(d.problem1Id);
    allDailyProblemIds.add(d.problem2Id);
    allDailyProblemIds.add(d.problem3Id);
  });

  const solvedStatuses = await db.userProblemStatus.findMany({
    where: {
      userId: { in: memberIds },
      problemId: { in: Array.from(allDailyProblemIds) },
      status: { in: ["SOLVED", "OPTIMAL"] },
    },
    select: { userId: true, problemId: true },
  });

  const solvedMap = new Set(solvedStatuses.map((s) => `${s.userId}_${s.problemId}`));

  const memberDailyStatus = group.members.map((m) => {
    const daily = todayDailies.find((d) => d.userId === m.userId);
    let count = 0;
    if (daily) {
      if (solvedMap.has(`${m.userId}_${daily.problem1Id}`)) count++;
      if (solvedMap.has(`${m.userId}_${daily.problem2Id}`)) count++;
      if (solvedMap.has(`${m.userId}_${daily.problem3Id}`)) count++;
    }
    return {
      userId: m.userId,
      username: m.user.username,
      solvedCount: count,
    };
  });

  const isLeader =
    group.createdById === user.id ||
    group.members.some((m) => m.userId === user.id && m.role === "LEADER");

  return (
    <GroupDashboardClient
      group={group}
      currentUserId={user.id}
      isLeader={isLeader}
      memberDailyStatus={memberDailyStatus}
    />
  );
}
