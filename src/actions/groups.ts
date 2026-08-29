"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

function generateInviteCode(groupName: string): string {
  const prefix = groupName
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 2)
    .toUpperCase() || "DA";
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let random = "";
  for (let i = 0; i < 5; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${random}`;
}

export async function createGroup(formData: {
  name: string;
  description?: string;
  avatar?: string;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const name = formData.name.trim();
  if (name.length < 3 || name.length > 30) {
    return { success: false, error: "Group name must be between 3 and 30 characters." };
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode(name);
  while (await db.group.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode(name);
  }

  const group = await db.group.create({
    data: {
      name,
      description: formData.description?.trim() || "A fierce DSA consistency squad.",
      avatar: formData.avatar || "flame_shield",
      inviteCode,
      createdById: currentUser.id,
    },
  });

  // Add creator as LEADER
  await db.groupMember.create({
    data: {
      userId: currentUser.id,
      groupId: group.id,
      role: "LEADER",
      previousRank: 1,
      currentRank: 1,
    },
  });

  revalidatePath("/groups");
  revalidatePath("/dashboard");

  return { success: true, group };
}

export async function joinGroup(inviteCode: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const cleanCode = inviteCode.trim().toUpperCase();
  const group = await db.group.findUnique({
    where: { inviteCode: cleanCode },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!group) {
    return { success: false, error: "No group found with that invite code. Please double-check the code." };
  }

  const alreadyMember = group.members.some((m) => m.userId === currentUser.id);
  if (alreadyMember) {
    return { success: false, error: "You are already an active member of this group!" };
  }

  const newRank = group.members.length + 1;

  await db.groupMember.create({
    data: {
      userId: currentUser.id,
      groupId: group.id,
      role: "MEMBER",
      previousRank: newRank,
      currentRank: newRank,
    },
  });

  // Send notification to group creator
  await db.notification.create({
    data: {
      userId: group.createdById,
      title: "⚡ New Squad Member Joined",
      type: "DAILY_READY",
      message: `⚡ ${currentUser.username} just joined your group "${group.name}"!`,
      link: `/groups/${group.id}`,
    },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${group.id}`);
  revalidatePath("/dashboard");

  return { success: true, group };
}

export async function leaveGroup(groupId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const membership = await db.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: currentUser.id,
        groupId,
      },
    },
  });

  if (!membership) {
    return { success: false, error: "You are not a member of this group." };
  }

  await db.groupMember.delete({
    where: { id: membership.id },
  });

  revalidatePath("/groups");
  revalidatePath("/dashboard");

  return { success: true };
}
