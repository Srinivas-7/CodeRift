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

  const alreadyMember = group.members.some((m: any) => m.userId === currentUser.id);
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

export async function removeMemberFromGroup(groupId: string, targetUserId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) {
    return { success: false, error: "Group not found." };
  }

  const isLeader =
    group.createdById === currentUser.id ||
    group.members.some((m: any) => m.userId === currentUser.id && m.role === "LEADER");

  if (!isLeader) {
    return { success: false, error: "Only the Squad Leader can remove members." };
  }

  if (targetUserId === currentUser.id) {
    return { success: false, error: "Squad Leaders cannot remove themselves. Disband or transfer leadership instead." };
  }

  await db.groupMember.delete({
    where: {
      userId_groupId: {
        userId: targetUserId,
        groupId,
      },
    },
  });

  // Notify removed member
  await db.notification.create({
    data: {
      userId: targetUserId,
      title: "Squad Roster Update",
      type: "DAILY_READY",
      message: `You were removed from squad "${group.name}".`,
      link: "/groups",
    },
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");

  return { success: true, message: "Member removed from squad." };
}

export async function updateGroupDetails(groupId: string, data: { name?: string; description?: string }) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) {
    return { success: false, error: "Group not found." };
  }

  const isLeader =
    group.createdById === currentUser.id ||
    group.members.some((m: any) => m.userId === currentUser.id && m.role === "LEADER");

  if (!isLeader) {
    return { success: false, error: "Only the Squad Leader can edit squad details." };
  }

  const updateData: any = {};
  if (data.name && data.name.trim()) {
    const cleanName = data.name.trim();
    if (cleanName.length < 3 || cleanName.length > 30) {
      return { success: false, error: "Squad name must be between 3 and 30 characters." };
    }
    updateData.name = cleanName;
  }

  if (data.description !== undefined) {
    updateData.description = data.description.trim();
  }

  const updated = await db.group.update({
    where: { id: groupId },
    data: updateData,
  });

  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/groups");

  return { success: true, group: updated };
}

export async function regenerateGroupInviteCode(groupId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) {
    return { success: false, error: "Group not found." };
  }

  const isLeader =
    group.createdById === currentUser.id ||
    group.members.some((m: any) => m.userId === currentUser.id && m.role === "LEADER");

  if (!isLeader) {
    return { success: false, error: "Only the Squad Leader can regenerate the invite code." };
  }

  let newCode = generateInviteCode(group.name);
  while (await db.group.findUnique({ where: { inviteCode: newCode } })) {
    newCode = generateInviteCode(group.name);
  }

  const updated = await db.group.update({
    where: { id: groupId },
    data: { inviteCode: newCode },
  });

  revalidatePath(`/groups/${groupId}`);

  return { success: true, newInviteCode: newCode };
}

export async function deleteGroup(groupId: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const group = await db.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });

  if (!group) {
    return { success: false, error: "Group not found." };
  }

  if (group.createdById !== currentUser.id) {
    return { success: false, error: "Only the Squad Creator can disband the group." };
  }

  // Remove all members
  await db.groupMember.deleteMany({
    where: { groupId },
  });

  // Delete group
  await db.group.delete({
    where: { id: groupId },
  });

  revalidatePath("/groups");
  revalidatePath("/dashboard");

  return { success: true };
}
