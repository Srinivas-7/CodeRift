import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LeaderboardClient } from "@/components/leaderboard/LeaderboardClient";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();

  // Fetch Global Users with safe fallback
  let globalUsers: any[] = [];
  try {
    globalUsers = await db.user.findMany({
      orderBy: { xp: "desc" },
      take: 50,
    });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
  }

  // Fetch Primary Group Members
  let myGroupMembers: any[] = [];
  let myGroupName = "DSA Warriors";

  if (user) {
    try {
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
    } catch (err) {
      console.error("Group leaderboard fetch error:", err);
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
