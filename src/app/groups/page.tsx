import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { GroupHubClient } from "@/components/group/GroupHubClient";

export default async function GroupsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch groups where user is a member
  const userGroups = await db.groupMember.findMany({
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
    orderBy: { joinedAt: "desc" },
  });

  return <GroupHubClient userGroups={userGroups} />;
}
