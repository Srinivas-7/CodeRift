"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/ratelimit";

const CreateGroupSchema = z.object({
  name: z.string().trim().min(3, "Squad name must be at least 3 characters").max(30, "Squad name must be at most 30 characters"),
  description: z.string().trim().max(250, "Description is too long").optional(),
  avatar: z.string().trim().max(64).optional(),
  phase1StartDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format").optional(),
});

const JoinGroupSchema = z.object({
  inviteCode: z.string().trim().min(4, "Invalid invite code").max(32, "Invalid invite code"),
});

const GroupIdSchema = z.object({
  groupId: z.string().trim().min(1, "Group ID required").max(128, "Group ID too long"),
});

const RemoveMemberSchema = z.object({
  groupId: z.string().trim().min(1).max(128),
  targetUserId: z.string().trim().min(1).max(128),
});

const UpdateGroupSchema = z.object({
  name: z.string().trim().min(3, "Squad name must be at least 3 characters").max(30, "Squad name must be at most 30 characters").optional(),
  description: z.string().trim().max(250).optional(),
  phase1StartDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format").optional(),
});

function generateInviteCode(groupName: string): string {
  const prefix = groupName
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase() || "CR";
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let random = "";
  for (let i = 0; i < 8; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${random}`;
}

export async function createGroup(formData: {
  name: string;
  description?: string;
  avatar?: string;
  phase1StartDate?: string;
}) {
  const parsed = CreateGroupSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid group parameters." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const name = parsed.data.name;
  let phase1StartDate = parsed.data.phase1StartDate || new Date().toISOString().split("T")[0];

  // Generate unique invite code
  let inviteCode = generateInviteCode(name);
  while (await db.group.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode(name);
  }

  const group = await db.group.create({
    data: {
      name,
      description: parsed.data.description || "A fierce DSA consistency squad.",
      avatar: parsed.data.avatar || "flame_shield",
      inviteCode,
      phase1StartDate,
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
  const parsed = JoinGroupSchema.safeParse({ inviteCode });
  if (!parsed.success) {
    return { success: false, error: "Invalid squad invite code." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  // 1. General join rate limit
  const rateLimitRes = await checkRateLimit(RATE_LIMIT_CONFIGS.JOIN_GROUP, currentUser.id);
  if (!rateLimitRes.success) {
    return { success: false, error: rateLimitRes.error || "Too many squad join attempts. Please try again later." };
  }

  const cleanCode = parsed.data.inviteCode.toUpperCase();
  const group = await db.group.findUnique({
    where: { inviteCode: cleanCode },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!group) {
    // 2. Brute-force lockout for failed invite code guesses
    const failedLimitRes = await checkRateLimit(RATE_LIMIT_CONFIGS.FAILED_INVITE, currentUser.id);
    if (!failedLimitRes.success) {
      return { success: false, error: "Too many failed squad code attempts. Please wait 15 minutes before trying again." };
    }
    return { success: false, error: "No squad found with that invite code. Please double-check the code." };
  }

  const alreadyMember = group.members.some((m: any) => m.userId === currentUser.id);
  if (alreadyMember) {
    return { success: false, error: "You are already an active member of this squad!" };
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
  const parsed = GroupIdSchema.safeParse({ groupId });
  if (!parsed.success) {
    return { success: false, error: "Invalid group ID." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const cleanGroupId = parsed.data.groupId;
  const membership = await db.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId: currentUser.id,
        groupId: cleanGroupId,
      },
    },
  });

  if (!membership) {
    return { success: false, error: "You are not a member of this squad." };
  }

  await db.groupMember.delete({
    where: { id: membership.id },
  });

  // Clean up user's notifications for this squad
  await db.notification.deleteMany({
    where: {
      userId: currentUser.id,
      link: { startsWith: `/groups/${cleanGroupId}` },
    },
  });

  revalidatePath("/groups");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function removeMemberFromGroup(groupId: string, targetUserId: string) {
  const parsed = RemoveMemberSchema.safeParse({ groupId, targetUserId });
  if (!parsed.success) {
    return { success: false, error: "Invalid parameters." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const { groupId: cleanGroupId, targetUserId: cleanTargetUserId } = parsed.data;
  const group = await db.group.findUnique({
    where: { id: cleanGroupId },
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

  if (cleanTargetUserId === currentUser.id) {
    return { success: false, error: "Squad Leaders cannot remove themselves. Disband or transfer leadership instead." };
  }

  await db.groupMember.delete({
    where: {
      userId_groupId: {
        userId: cleanTargetUserId,
        groupId: cleanGroupId,
      },
    },
  });

  // Clean up removed user's notifications for this squad
  await db.notification.deleteMany({
    where: {
      userId: cleanTargetUserId,
      link: { startsWith: `/groups/${cleanGroupId}` },
    },
  });

  // Notify removed member
  await db.notification.create({
    data: {
      userId: cleanTargetUserId,
      title: "Squad Roster Update",
      type: "DAILY_READY",
      message: `You were removed from squad "${group.name}".`,
      link: "/groups",
    },
  });

  revalidatePath(`/groups/${cleanGroupId}`);
  revalidatePath("/groups");

  return { success: true, message: "Member removed from squad." };
}

export async function updateGroupDetails(
  groupId: string,
  data: { name?: string; description?: string; phase1StartDate?: string }
) {
  const parsedGroup = GroupIdSchema.safeParse({ groupId });
  const parsedData = UpdateGroupSchema.safeParse(data);
  if (!parsedGroup.success || !parsedData.success) {
    return { success: false, error: "Invalid squad update parameters." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const cleanGroupId = parsedGroup.data.groupId;
  const group = await db.group.findUnique({
    where: { id: cleanGroupId },
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
  if (parsedData.data.name) {
    updateData.name = parsedData.data.name;
  }
  if (parsedData.data.description !== undefined) {
    updateData.description = parsedData.data.description;
  }
  if (parsedData.data.phase1StartDate) {
    updateData.phase1StartDate = parsedData.data.phase1StartDate;
  }

  const updated = await db.group.update({
    where: { id: cleanGroupId },
    data: updateData,
  });

  revalidatePath(`/groups/${cleanGroupId}`);
  revalidatePath("/groups");
  revalidatePath("/dashboard");
  revalidatePath("/daily");

  return { success: true, group: updated };
}

export async function regenerateGroupInviteCode(groupId: string) {
  const parsed = GroupIdSchema.safeParse({ groupId });
  if (!parsed.success) {
    return { success: false, error: "Invalid group ID." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const cleanGroupId = parsed.data.groupId;
  const group = await db.group.findUnique({
    where: { id: cleanGroupId },
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
    where: { id: cleanGroupId },
    data: { inviteCode: newCode },
  });

  revalidatePath(`/groups/${cleanGroupId}`);

  return { success: true, newInviteCode: newCode };
}

export async function deleteGroup(groupId: string) {
  const parsed = GroupIdSchema.safeParse({ groupId });
  if (!parsed.success) {
    return { success: false, error: "Invalid group ID." };
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "Authentication required." };
  }

  const cleanGroupId = parsed.data.groupId;
  const group = await db.group.findUnique({
    where: { id: cleanGroupId },
    include: { members: true },
  });

  if (!group) {
    return { success: false, error: "Group not found." };
  }

  if (group.createdById !== currentUser.id) {
    return { success: false, error: "Only the Squad Leader can disband the group." };
  }

  // Remove all members
  await db.groupMember.deleteMany({
    where: { groupId: cleanGroupId },
  });

  // Delete group
  await db.group.delete({
    where: { id: cleanGroupId },
  });

  // Clean up all notifications for this disbanded squad
  await db.notification.deleteMany({
    where: {
      link: { startsWith: `/groups/${cleanGroupId}` },
    },
  });

  revalidatePath("/groups");
  revalidatePath("/dashboard");

  return { success: true };
}

