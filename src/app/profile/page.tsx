import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { ProfileClient } from "@/components/profile/ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch Achievements
  const userAchievements = await db.userAchievement.findMany({
    where: { userId: user.id },
    include: { achievement: true },
    orderBy: { unlockedAt: "desc" },
  });

  // Fetch Squad Memberships
  const groupMemberships = await db.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          members: true,
        },
      },
    },
  });

  // Fetch XP history
  const xpTransactions = await db.xpTransaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="app-container" style={{ padding: "2.5rem 1.25rem 4rem" }}>
      <ProfileClient
        user={user}
        userAchievements={userAchievements}
        groupMemberships={groupMemberships}
        xpTransactions={xpTransactions}
      />
    </div>
  );
}
