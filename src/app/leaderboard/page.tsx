import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();

  // Fetch Global Users
  const globalUsers = await db.user.findMany({
    orderBy: { xp: "desc" },
    take: 50,
  });

  // Fetch Primary Group Members
  let myGroupMembers: any[] = [];
  let myGroupName = "DSA Warriors";

  if (user) {
    const primaryMembership = await db.groupMember.findFirst({
      where: { userId: user.id },
      include: {
        group: {
          include: {
            members: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (primaryMembership) {
      myGroupMembers = primaryMembership.group.members;
      myGroupName = primaryMembership.group.name;
    }
  }

  return (
    <LeaderboardClient
      myGroupMembers={myGroupMembers}
      myGroupName={myGroupName}
      globalUsers={globalUsers}
      currentUser={user}
    />
  );
}
