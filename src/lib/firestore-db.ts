import { adminDb, Timestamp, FieldValue } from "./firebase-admin";
import { SDE_SHEET_PROBLEMS } from "@/data/sdeSheetProblems";
import { calculateLevel } from "@/lib/xp";

// Default Achievements Definition
const SYSTEM_ACHIEVEMENTS = [
  {
    id: "streak_7",
    name: "7-Day Streak",
    description: "Solved daily missions for 7 consecutive days.",
    icon: "🔥",
    xpReward: 250,
    category: "STREAK",
    tier: "BRONZE",
  },
  {
    id: "streak_30",
    name: "30-Day Legend",
    description: "Maintained a relentless 30-day daily problem streak.",
    icon: "⚡",
    xpReward: 1000,
    category: "STREAK",
    tier: "GOLD",
  },
  {
    id: "first_10",
    name: "First 10 Cleared",
    description: "Conquered your first 10 problems from Striver's SDE Sheet.",
    icon: "💯",
    xpReward: 200,
    category: "PROBLEMS",
    tier: "BRONZE",
  },
  {
    id: "half_century_50",
    name: "Half Century (50 Problems)",
    description: "Solved 50 core interview problems.",
    icon: "🎯",
    xpReward: 500,
    category: "PROBLEMS",
    tier: "SILVER",
  },
  {
    id: "century_100",
    name: "Century (100 Problems)",
    description: "Reached 100 problems in the SDE Sheet roadmap.",
    icon: "⚔️",
    xpReward: 1000,
    category: "PROBLEMS",
    tier: "GOLD",
  },
  {
    id: "sde_master_191",
    name: "191 SDE Sheet Master",
    description: "Completed every single problem in Striver's 191 SDE Sheet.",
    icon: "💎",
    xpReward: 5000,
    category: "PROBLEMS",
    tier: "DIAMOND",
  },
  {
    id: "podium_top3",
    name: "Podium Finisher",
    description: "Reached Top 3 on your squad's leaderboard.",
    icon: "🏆",
    xpReward: 300,
    category: "LEADERBOARD",
    tier: "SILVER",
  },
  {
    id: "season_champion",
    name: "Season Champion",
    description: "Finished #1 in a 30-day squad season.",
    icon: "👑",
    xpReward: 2000,
    category: "SEASONS",
    tier: "DIAMOND",
  },
];

// Helper to recursively sanitize dates/Timestamps from Firestore
function formatDoc(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data === "object" && typeof data.toDate === "function") {
    return data.toDate();
  }
  if (Array.isArray(data)) {
    return data.map((item) => formatDoc(item));
  }
  if (typeof data === "object" && (data.constructor === Object || !data.constructor)) {
    const formatted: any = {};
    for (const key of Object.keys(data)) {
      formatted[key] = formatDoc(data[key]);
    }
    return formatted;
  }
  return data;
}


const userService = {
  async findUnique(args: { where: { id?: string; email?: string; googleId?: string; firebaseUid?: string; username?: string }; include?: any; select?: any }) {
    const { id, email, googleId, firebaseUid, username } = args.where;
    if (id) {
      const snap = await adminDb.collection("users").doc(id).get();
      if (!snap.exists) return null;
      return formatDoc({ id: snap.id, ...snap.data() });
    }

    const usersRef = adminDb.collection("users");
    let queryRef: FirebaseFirestore.Query = usersRef;
    if (email) queryRef = usersRef.where("email", "==", email).limit(1);
    else if (googleId) queryRef = usersRef.where("googleId", "==", googleId).limit(1);
    else if (firebaseUid) queryRef = usersRef.where("firebaseUid", "==", firebaseUid).limit(1);
    else if (username) queryRef = usersRef.where("username", "==", username).limit(1);
    else return null;

    const snap = await queryRef.get();
    if (snap.empty) return null;
    const first = snap.docs[0];
    return formatDoc({ id: first.id, ...first.data() });
  },

  async findFirst(args?: { where?: any; orderBy?: any }) {
    const list = await userService.findMany(args);
    return list.length > 0 ? list[0] : null;
  },

  async findMany(args?: { where?: any; orderBy?: { xp?: "asc" | "desc"; createdAt?: "asc" | "desc" }; take?: number }) {
    const usersRef = adminDb.collection("users");
    const snap = await usersRef.get();
    let list: any[] = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));

    if (args?.where) {
      if (args.where.id && Array.isArray(args.where.id.in)) {
        list = list.filter((u) => args.where.id.in.includes(u.id));
      }
    }

    if (args?.orderBy?.xp) {
      const order = args.orderBy.xp;
      list.sort((a, b) => (order === "desc" ? (b.xp || 0) - (a.xp || 0) : (a.xp || 0) - (b.xp || 0)));
    }

    if (args?.take) {
      list = list.slice(0, args.take);
    }

    return list;
  },

  async create(args: { data: any }) {
    const id = args.data.id || args.data.firebaseUid || adminDb.collection("users").doc().id;
    const record = {
      avatar: "cyber_ninja",
      score: 0,
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      totalSolved: 0,
      streakShields: 1,
      leetcodeConnected: false,
      role: "USER",
      ...args.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await adminDb.collection("users").doc(id).set(record);
    return { id, ...record };
  },

  async update(args: { where: { id: string }; data: any }) {
    const id = args.where.id;
    const updateData: any = { ...args.data, updatedAt: new Date() };

    // Handle increment/decrement helpers
    for (const k of Object.keys(updateData)) {
      if (updateData[k] && typeof updateData[k] === "object" && "increment" in updateData[k]) {
        const current = await userService.findUnique({ where: { id } });
        const currentVal = (current && current[k]) || 0;
        updateData[k] = currentVal + updateData[k].increment;
      } else if (updateData[k] && typeof updateData[k] === "object" && "decrement" in updateData[k]) {
        const current = await userService.findUnique({ where: { id } });
        const currentVal = (current && current[k]) || 0;
        updateData[k] = Math.max(0, currentVal - updateData[k].decrement);
      }
    }

    await adminDb.collection("users").doc(id).update(updateData);
    return await userService.findUnique({ where: { id } });
  },

  async upsert(args: { where: { id?: string; email?: string }; update: any; create: any }) {
    const existing = await userService.findUnique({ where: args.where });
    if (existing) {
      return await userService.update({ where: { id: existing.id }, data: args.update });
    }
    return await userService.create({ data: args.create });
  },

  async count() {
    const snap = await adminDb.collection("users").get();
    return snap.size;
  },

  async deleteMany(args?: { where?: any }) {
    const snap = await adminDb.collection("users").get();
    const batch = adminDb.batch();
    for (const d of snap.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();
    return { count: snap.size };
  },
};

const problemService = {
  async findUnique(args: { where: { id?: number; orderInSheet?: number } }) {
    const { id, orderInSheet } = args.where;
    if (id !== undefined) {
      return SDE_SHEET_PROBLEMS.find((p) => p.id === id) || null;
    }
    if (orderInSheet !== undefined) {
      return SDE_SHEET_PROBLEMS.find((p) => p.orderInSheet === orderInSheet) || null;
    }
    return null;
  },

  async findFirst(args?: { where?: any; orderBy?: any }) {
    const list = await problemService.findMany(args);
    return list.length > 0 ? list[0] : null;
  },

  async findMany(args?: { where?: any; orderBy?: { orderInSheet?: "asc" | "desc" } }) {
    let list = [...SDE_SHEET_PROBLEMS];
    if (args?.where) {
      if (args.where.id && Array.isArray(args.where.id.in)) {
        list = list.filter((p) => args.where.id.in.includes(p.id));
      }
      if (args.where.orderInSheet) {
        if (args.where.orderInSheet.gte !== undefined) list = list.filter((p) => p.orderInSheet >= args.where.orderInSheet.gte);
        if (args.where.orderInSheet.lte !== undefined) list = list.filter((p) => p.orderInSheet <= args.where.orderInSheet.lte);
      }
    }
    if (args?.orderBy?.orderInSheet) {
      const order = args.orderBy.orderInSheet;
      list.sort((a, b) => (order === "desc" ? b.orderInSheet - a.orderInSheet : a.orderInSheet - b.orderInSheet));
    }
    return list;
  },

  async count() {
    return SDE_SHEET_PROBLEMS.length;
  },
};

const userProblemStatusService = {
  async findUnique(args: { where: { userId_problemId?: { userId: string; problemId: number }; id?: string } }) {
    const docId = args.where.userId_problemId
      ? `${args.where.userId_problemId.userId}_${args.where.userId_problemId.problemId}`
      : args.where.id;
    if (!docId) return null;
    const snap = await adminDb.collection("user_problem_statuses").doc(docId).get();
    if (!snap.exists) return null;
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async findMany(args?: { where?: { userId?: string | { in: string[] }; status?: string | { in: string[] }; problemId?: number | { in: number[] } }; select?: any }) {
    const ref = adminDb.collection("user_problem_statuses");

    const userIds = args?.where?.userId
      ? typeof args.where.userId === "string"
        ? [args.where.userId]
        : Array.isArray((args.where.userId as any).in)
        ? ((args.where.userId as any).in as string[])
        : null
      : null;

    const problemIds = args?.where?.problemId
      ? typeof args.where.problemId === "number"
        ? [args.where.problemId]
        : Array.isArray((args.where.problemId as any).in)
        ? ((args.where.problemId as any).in as number[])
        : null
      : null;

    let list: any[] = [];

    if (userIds && problemIds && userIds.length > 0 && problemIds.length > 0) {
      const docIds: string[] = [];
      for (const uId of userIds) {
        for (const pId of problemIds) {
          docIds.push(`${uId}_${pId}`);
        }
      }
      const snaps = await Promise.all(
        docIds.map((docId) => adminDb.collection("user_problem_statuses").doc(docId).get())
      );
      list = snaps
        .filter((s) => s.exists)
        .map((s) => formatDoc({ id: s.id, ...s.data() }));
    } else if (userIds && userIds.length > 0) {
      const snaps = await Promise.all(
        userIds.map((uId) => ref.where("userId", "==", uId).get())
      );
      for (const snap of snaps) {
        list.push(...snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() })));
      }
    } else {
      const snap = await ref.get();
      list = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));
    }

    if (args?.where?.status) {
      if (typeof args.where.status === "string") {
        list = list.filter((s) => s.status === args.where?.status);
      } else if (args.where.status.in && Array.isArray(args.where.status.in)) {
        list = list.filter((s) => args.where?.status && (args.where.status as any).in.includes(s.status));
      }
    }

    if (args?.where?.problemId && !problemIds) {
      if (typeof args.where.problemId === "number") {
        list = list.filter((s) => s.problemId === args.where?.problemId);
      } else if (args.where.problemId.in && Array.isArray(args.where.problemId.in)) {
        list = list.filter((s) => args.where?.problemId && (args.where.problemId as any).in.includes(s.problemId));
      }
    }

    return list;
  },

  async upsert(args: { where: { userId_problemId: { userId: string; problemId: number } }; update: any; create: any }) {
    const docId = `${args.where.userId_problemId.userId}_${args.where.userId_problemId.problemId}`;
    const snap = await adminDb.collection("user_problem_statuses").doc(docId).get();

    if (snap.exists) {
      const updateData = { ...args.update, lastAttemptedAt: new Date() };
      await adminDb.collection("user_problem_statuses").doc(docId).update(updateData);
      return formatDoc({ id: docId, ...snap.data(), ...updateData });
    }

    const createData = {
      userId: args.where.userId_problemId.userId,
      problemId: args.where.userId_problemId.problemId,
      status: "UNSOLVED",
      attemptsCount: 1,
      firstSolvedAt: null,
      lastAttemptedAt: new Date(),
      ...args.create,
    };
    await adminDb.collection("user_problem_statuses").doc(docId).set(createData);
    return formatDoc({ id: docId, ...createData });
  },

  async count(args?: { where?: any }) {
    const list = await userProblemStatusService.findMany(args);
    return list.length;
  },

  async delete(args: { where: { userId_problemId?: { userId: string; problemId: number }; id?: string } }) {
    const docId = args.where.userId_problemId
      ? `${args.where.userId_problemId.userId}_${args.where.userId_problemId.problemId}`
      : args.where.id;
    if (!docId) return null;
    await adminDb.collection("user_problem_statuses").doc(docId).delete();
    return { success: true };
  },

  async deleteMany(args?: { where?: { userId?: string } }) {
    const ref = adminDb.collection("user_problem_statuses");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    const batch = adminDb.batch();
    for (const d of snap.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();
    return { count: snap.size };
  },
};

const dailyChallengeService = {
  async findUnique(args: { where: { userId_groupId_date?: { userId: string; groupId?: string | null; date: string }; userId_date?: { userId: string; date: string }; id?: string } }) {
    let docId = args.where.id;
    if (args.where.userId_groupId_date) {
      const { userId, groupId, date } = args.where.userId_groupId_date;
      docId = groupId ? `${userId}_${groupId}_${date}` : `${userId}_${date}`;
    } else if (args.where.userId_date) {
      docId = `${args.where.userId_date.userId}_${args.where.userId_date.date}`;
    }
    if (!docId) return null;
    const snap = await adminDb.collection("daily_challenges").doc(docId).get();
    if (!snap.exists) return null;
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async findMany(args?: { where?: { userId?: string | { in: string[] }; groupId?: string; date?: string; completed?: boolean } }) {
    const ref = adminDb.collection("daily_challenges");
    const snap = await ref.get();
    let list: any[] = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));

    if (args?.where?.userId) {
      if (typeof args.where.userId === "string") {
        list = list.filter((c) => c.userId === args.where?.userId);
      } else if (Array.isArray(args.where.userId.in)) {
        list = list.filter((c) => (args.where?.userId as any).in.includes(c.userId));
      }
    }

    if (args?.where?.groupId) {
      list = list.filter((c) => c.groupId === args.where?.groupId);
    }

    if (args?.where?.date) {
      list = list.filter((c) => c.date === args.where?.date);
    }

    if (args?.where?.completed !== undefined) {
      list = list.filter((c) => c.completed === args.where?.completed);
    }

    return list;
  },

  async upsert(args: { where: { userId_groupId_date?: { userId: string; groupId?: string | null; date: string }; userId_date?: { userId: string; date: string } }; update: any; create: any }) {
    let docId = "";
    let userId = "";
    let date = "";
    let groupId: string | null = null;

    if (args.where.userId_groupId_date) {
      userId = args.where.userId_groupId_date.userId;
      groupId = args.where.userId_groupId_date.groupId || null;
      date = args.where.userId_groupId_date.date;
      docId = groupId ? `${userId}_${groupId}_${date}` : `${userId}_${date}`;
    } else if (args.where.userId_date) {
      userId = args.where.userId_date.userId;
      date = args.where.userId_date.date;
      docId = `${userId}_${date}`;
    }

    const snap = await adminDb.collection("daily_challenges").doc(docId).get();

    if (snap.exists) {
      await adminDb.collection("daily_challenges").doc(docId).update(args.update);
      return formatDoc({ id: docId, ...snap.data(), ...args.update });
    }

    const createData = {
      userId,
      groupId,
      date,
      completed: false,
      completedAt: null,
      createdAt: new Date(),
      ...args.create,
    };
    await adminDb.collection("daily_challenges").doc(docId).set(createData);
    return formatDoc({ id: docId, ...createData });
  },

  async update(args: { where: { id: string }; data: any }) {
    await adminDb.collection("daily_challenges").doc(args.where.id).update(args.data);
    const snap = await adminDb.collection("daily_challenges").doc(args.where.id).get();
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async deleteMany(args?: { where?: { userId?: string } }) {
    const ref = adminDb.collection("daily_challenges");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    const batch = adminDb.batch();
    for (const d of snap.docs) {
      batch.delete(d.ref);
    }
    await batch.commit();
    return { count: snap.size };
  },

  async awardDailyBonusAtomic(args: {
    userId: string;
    groupId?: string | null;
    date: string;
    problemPhase: number;
    bonusAmount?: number;
    bonusReason?: string;
  }): Promise<{
    awarded: boolean;
    alreadyCompleted: boolean;
    newScore: number;
    newLevel: number;
    newPhase1Score: number;
    newPhase2Score: number;
  }> {
    const { userId, groupId, date, problemPhase } = args;
    const bonusAmount = args.bonusAmount ?? 20;
    const bonusReason = args.bonusReason ?? (groupId ? `DAILY_COMPLETION_BONUS_${groupId}` : "DAILY_COMPLETION_BONUS");

    const dailyDocId = groupId ? `${userId}_${groupId}_${date}` : `${userId}_${date}`;
    const deterministicBonusId = groupId ? `bonus_${userId}_${groupId}_${date}` : `bonus_${userId}_${date}`;

    const dailyRef = adminDb.collection("daily_challenges").doc(dailyDocId);
    const userRef = adminDb.collection("users").doc(userId);
    const bonusRef = adminDb.collection("xp_transactions").doc(deterministicBonusId);

    try {
      const result = await adminDb.runTransaction(async (transaction) => {
        const dailySnap = await transaction.get(dailyRef);
        const userSnap = await transaction.get(userRef);
        const bonusSnap = await transaction.get(bonusRef);

        const dailyData = dailySnap.exists ? (dailySnap.data() as any) : null;
        const userData = userSnap.exists ? (userSnap.data() as any) : {};

        // 1. If daily challenge is already completed or bonus transaction already exists, exit idempotently
        if ((dailyData && dailyData.completed === true) || bonusSnap.exists) {
          return {
            awarded: false,
            alreadyCompleted: true,
            newScore: (userData?.score ?? userData?.xp ?? 0),
            newLevel: userData?.level ?? 1,
            newPhase1Score: userData?.phase1Score ?? 0,
            newPhase2Score: userData?.phase2Score ?? 0,
          };
        }

        // 2. Mark daily challenge as completed
        if (dailySnap.exists) {
          transaction.update(dailyRef, {
            completed: true,
            completedAt: new Date(),
            updatedAt: new Date(),
          });
        } else {
          transaction.set(dailyRef, {
            id: dailyDocId,
            userId,
            groupId: groupId || null,
            date,
            completed: true,
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        // 3. Create deterministic bonus transaction record
        transaction.set(bonusRef, {
          id: deterministicBonusId,
          userId,
          amount: bonusAmount,
          reason: bonusReason,
          createdAt: new Date(),
        });

        // 4. Update user score inside the transaction concurrency-safely
        const currentScore = (userData?.score ?? userData?.xp ?? 0);
        const newScore = currentScore + bonusAmount;
        const newLevel = calculateLevel(newScore);
        const newPhase1Score = (userData?.phase1Score ?? 0) + (problemPhase === 1 ? bonusAmount : 0);
        const newPhase2Score = (userData?.phase2Score ?? 0) + (problemPhase === 2 ? bonusAmount : 0);

        transaction.update(userRef, {
          score: newScore,
          xp: newScore,
          level: newLevel,
          phase1Score: newPhase1Score,
          phase2Score: newPhase2Score,
          updatedAt: new Date(),
        });

        return {
          awarded: true,
          alreadyCompleted: false,
          newScore,
          newLevel,
          newPhase1Score,
          newPhase2Score,
        };
      });

      return result;
    } catch (err) {
      console.error("Error in awardDailyBonusAtomic:", err);
      const user = await userService.findUnique({ where: { id: userId } });
      return {
        awarded: false,
        alreadyCompleted: false,
        newScore: user?.score ?? user?.xp ?? 0,
        newLevel: user?.level ?? 1,
        newPhase1Score: user?.phase1Score ?? 0,
        newPhase2Score: user?.phase2Score ?? 0,
      };
    }
  },
};

const submissionService = {
  async create(args: { data: any }) {
    const ref = adminDb.collection("submissions").doc();
    const record = {
      id: ref.id,
      xpEarned: 0,
      bonusXp: 0,
      source: "LEETCODE",
      createdAt: new Date(),
      ...args.data,
    };
    await ref.set(record);
    return record;
  },

  async findMany(args?: { where?: { userId?: string; problemId?: number }; orderBy?: any; take?: number }) {
    const ref = adminDb.collection("submissions");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    let list: any[] = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));

    if (args?.where?.problemId) {
      list = list.filter((s) => s.problemId === args.where?.problemId);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (args?.take) list = list.slice(0, args.take);
    return list;
  },

  async count() {
    const snap = await adminDb.collection("submissions").get();
    return snap.size;
  },

  async deleteMany(args?: { where?: { userId?: string; problemId?: number } }) {
    const ref = adminDb.collection("submissions");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    const batch = adminDb.batch();
    let count = 0;
    for (const d of snap.docs) {
      const data = d.data();
      if (!args?.where?.problemId || data.problemId === args.where.problemId) {
        batch.delete(d.ref);
        count++;
      }
    }
    await batch.commit();
    return { count };
  },
};

const groupMemberService = {
  async findUnique(args: { where: { id?: string; userId_groupId?: { userId: string; groupId: string } }; include?: any }) {
    const docId = args.where.id || (args.where.userId_groupId ? `${args.where.userId_groupId.userId}_${args.where.userId_groupId.groupId}` : null);
    if (!docId) return null;
    const snap = await adminDb.collection("group_members").doc(docId).get();
    if (!snap.exists) return null;
    const data = formatDoc({ id: snap.id, ...snap.data() });
    if (args?.include?.user) {
      data.user = await userService.findUnique({ where: { id: data.userId } });
    }
    if (args?.include?.group) {
      data.group = await groupService.findUnique({ where: { id: data.groupId } });
    }
    return data;
  },

  async findFirst(args: { where: { userId?: string; groupId?: string }; include?: any }) {
    const list = await groupMemberService.findMany(args);
    return list.length > 0 ? list[0] : null;
  },

  async findMany(args?: { where?: { userId?: string; groupId?: string }; include?: { group?: any; user?: any }; orderBy?: any }) {
    const ref = adminDb.collection("group_members");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = queryRef.where("userId", "==", args.where.userId);
    if (args?.where?.groupId) queryRef = queryRef.where("groupId", "==", args.where.groupId);

    const snap = await queryRef.get();
    let list: any[] = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));

    if (args?.include?.user || args?.include?.group) {
      await Promise.all(
        list.map(async (member) => {
          if (args?.include?.user) {
            const uSnap = await adminDb.collection("users").doc(member.userId).get();
            member.user = uSnap.exists ? formatDoc({ id: uSnap.id, ...uSnap.data() }) : null;
          }
          if (args?.include?.group) {
            const gSnap = await adminDb.collection("groups").doc(member.groupId).get();
            if (gSnap.exists) {
              const grpData = formatDoc({ id: gSnap.id, ...gSnap.data() });
              const gmSnaps = await adminDb.collection("group_members").where("groupId", "==", member.groupId).get();
              const gMembers = gmSnaps.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));
              if (args?.include?.group?.include?.members?.include?.user) {
                await Promise.all(
                  gMembers.map(async (gm) => {
                    const uSnap = await adminDb.collection("users").doc(gm.userId).get();
                    gm.user = uSnap.exists ? formatDoc({ id: uSnap.id, ...uSnap.data() }) : null;
                  })
                );
              }
              grpData.members = gMembers;
              member.group = grpData;
            } else {
              member.group = null;
            }
          }
        })
      );
    }

    return list;
  },

  async create(args: { data: any }) {
    const docId = `${args.data.userId}_${args.data.groupId}`;
    const record = {
      id: docId,
      role: "MEMBER",
      joinedAt: new Date(),
      previousRank: null,
      currentRank: null,
      ...args.data,
    };
    await adminDb.collection("group_members").doc(docId).set(record);
    return record;
  },

  async update(args: { where: { id?: string; userId_groupId?: { userId: string; groupId: string } }; data: any }) {
    const docId = args.where.id || `${args.where.userId_groupId?.userId}_${args.where.userId_groupId?.groupId}`;
    if (!docId) return null;
    await adminDb.collection("group_members").doc(docId).update(args.data);
    const snap = await adminDb.collection("group_members").doc(docId).get();
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async delete(args: { where: { id?: string; userId_groupId?: { userId: string; groupId: string } } }) {
    const docId = args.where.id || (args.where.userId_groupId ? `${args.where.userId_groupId.userId}_${args.where.userId_groupId.groupId}` : null);
    if (!docId) return null;
    await adminDb.collection("group_members").doc(docId).delete();
    return { id: docId };
  },

  async deleteMany(args?: { where?: { userId?: string; groupId?: string } }) {
    const ref = adminDb.collection("group_members");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = queryRef.where("userId", "==", args.where.userId);
    if (args?.where?.groupId) queryRef = queryRef.where("groupId", "==", args.where.groupId);
    const snap = await queryRef.get();
    const batch = adminDb.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
    return { count: snap.size };
  },
};

const groupService = {
  async findUnique(args: { where: { id?: string; inviteCode?: string }; include?: any }) {
    const { id, inviteCode } = args.where;
    if (id) {
      const snap = await adminDb.collection("groups").doc(id).get();
      if (!snap.exists) return null;
      const groupData = formatDoc({ id: snap.id, ...snap.data() });
      const members = await groupMemberService.findMany({ where: { groupId: id }, include: { user: true } });
      return { ...groupData, members };
    }
    if (inviteCode) {
      const snap = await adminDb.collection("groups").where("inviteCode", "==", inviteCode).limit(1).get();
      if (snap.empty) return null;
      const first = snap.docs[0];
      const groupData = formatDoc({ id: first.id, ...first.data() });
      const members = await groupMemberService.findMany({ where: { groupId: first.id }, include: { user: true } });
      return { ...groupData, members };
    }
    return null;
  },

  async findMany(args?: any) {
    const snap = await adminDb.collection("groups").get();
    return snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));
  },

  async create(args: { data: any }) {
    const ref = adminDb.collection("groups").doc();
    const record = {
      id: ref.id,
      avatar: "neon_shield",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...args.data,
    };
    await ref.set(record);
    return record;
  },

  async update(args: { where: { id: string }; data: any }) {
    await adminDb.collection("groups").doc(args.where.id).update({ ...args.data, updatedAt: new Date() });
    return await groupService.findUnique({ where: { id: args.where.id } });
  },

  async count() {
    const snap = await adminDb.collection("groups").get();
    return snap.size;
  },

  async delete(args: { where: { id: string } }) {
    await adminDb.collection("groups").doc(args.where.id).delete();
    return { id: args.where.id };
  },

  async deleteMany() {
    const snap = await adminDb.collection("groups").get();
    const batch = adminDb.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
    return { count: snap.size };
  },
};

const achievementService = {
  async findMany(args?: any) {
    return SYSTEM_ACHIEVEMENTS;
  },
  async findUnique(args: { where: { id: string } }) {
    return SYSTEM_ACHIEVEMENTS.find((a) => a.id === args.where.id) || null;
  },
  async deleteMany() {
    return { count: 0 };
  },
};

const userAchievementService = {
  async findMany(args?: { where?: { userId?: string }; include?: any; orderBy?: any; select?: any }) {
    const ref = adminDb.collection("user_achievements");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    const list: any[] = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));

    for (const ua of list) {
      ua.achievement = SYSTEM_ACHIEVEMENTS.find((a) => a.id === ua.achievementId) || null;
    }

    if (args?.orderBy?.unlockedAt) {
      list.sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime());
    }

    return list;
  },

  async create(args: { data: any }) {
    const docId = `${args.data.userId}_${args.data.achievementId}`;
    const record = {
      id: docId,
      unlockedAt: new Date(),
      ...args.data,
    };
    await adminDb.collection("user_achievements").doc(docId).set(record);
    return record;
  },

  async deleteMany(args?: { where?: { userId?: string } }) {
    const ref = adminDb.collection("user_achievements");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    const batch = adminDb.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
    return { count: snap.size };
  },
};

const seasonService = {
  async findFirst(args?: any) {
    try {
      const snap = await adminDb.collection("seasons").get();
      if (!snap.empty) {
        const d = snap.docs[0];
        return formatDoc({ id: d.id, ...d.data() });
      }
    } catch (e) {
      console.warn("Error fetching season from firestore:", e);
    }

    const defaultSeason = {
      id: "season_1",
      name: "Season 01 Arena",
      seasonNumber: 1,
      startDate: new Date("2026-09-01T00:00:00.000Z"),
      endDate: new Date("2026-10-01T00:00:00.000Z"),
      isActive: true,
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
      updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    };
    try {
      await adminDb.collection("seasons").doc("season_1").set(defaultSeason);
    } catch (e) {}
    return defaultSeason;
  },

  async update(args: { where: { id?: string }; data: any }) {
    const id = args.where.id || "season_1";
    const updateData: any = { ...args.data, updatedAt: new Date() };
    if (updateData.startDate && typeof updateData.startDate === "string") {
      updateData.startDate = new Date(updateData.startDate);
    }
    if (updateData.endDate && typeof updateData.endDate === "string") {
      updateData.endDate = new Date(updateData.endDate);
    }
    await adminDb.collection("seasons").doc(id).set(updateData, { merge: true });
    const snap = await adminDb.collection("seasons").doc(id).get();
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async findMany(args?: any) {
    const current = await seasonService.findFirst(args);
    return [current];
  },

  async deleteMany() {
    return { count: 0 };
  },
};

const groupSeasonService = {
  async findMany(args?: any) {
    return [];
  },
  async deleteMany() {
    return { count: 0 };
  },
};

const streakRecordService = {
  async findUnique(args: { where: { userId_date?: { userId: string; date: string }; id?: string } }) {
    const docId = args.where.userId_date
      ? `${args.where.userId_date.userId}_${args.where.userId_date.date}`
      : args.where.id;
    if (!docId) return null;
    const snap = await adminDb.collection("streak_records").doc(docId).get();
    if (!snap.exists) return null;
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async upsert(args: { where: { userId_date: { userId: string; date: string } }; update: any; create: any }) {
    const docId = `${args.where.userId_date.userId}_${args.where.userId_date.date}`;
    const snap = await adminDb.collection("streak_records").doc(docId).get();

    if (snap.exists) {
      const existingData = snap.data() || {};
      const updateData = { ...args.update, updatedAt: new Date() };
      for (const k of Object.keys(updateData)) {
        if (updateData[k] && typeof updateData[k] === "object" && "increment" in updateData[k]) {
          const currentVal = existingData[k] || 0;
          updateData[k] = currentVal + updateData[k].increment;
        } else if (updateData[k] && typeof updateData[k] === "object" && "decrement" in updateData[k]) {
          const currentVal = existingData[k] || 0;
          updateData[k] = Math.max(0, currentVal - updateData[k].decrement);
        }
      }
      await adminDb.collection("streak_records").doc(docId).update(updateData);
      return formatDoc({ id: docId, ...existingData, ...updateData });
    }

    const createData = {
      userId: args.where.userId_date.userId,
      date: args.where.userId_date.date,
      solvedCount: 0,
      shieldUsed: false,
      createdAt: new Date(),
      ...args.create,
    };
    await adminDb.collection("streak_records").doc(docId).set(createData);
    return formatDoc({ id: docId, ...createData });
  },

  async update(args: { where: { userId_date?: { userId: string; date: string }; id?: string }; data: any }) {
    const docId = args.where.userId_date
      ? `${args.where.userId_date.userId}_${args.where.userId_date.date}`
      : args.where.id;
    if (!docId) return null;
    const snap = await adminDb.collection("streak_records").doc(docId).get();
    if (!snap.exists) return null;
    const existingData = snap.data() || {};
    const updateData = { ...args.data, updatedAt: new Date() };
    for (const k of Object.keys(updateData)) {
      if (updateData[k] && typeof updateData[k] === "object" && "increment" in updateData[k]) {
        const currentVal = existingData[k] || 0;
        updateData[k] = currentVal + updateData[k].increment;
      } else if (updateData[k] && typeof updateData[k] === "object" && "decrement" in updateData[k]) {
        const currentVal = existingData[k] || 0;
        updateData[k] = Math.max(0, currentVal - updateData[k].decrement);
      }
    }
    await adminDb.collection("streak_records").doc(docId).update(updateData);
    return formatDoc({ id: snap.id, ...existingData, ...updateData });
  },

  async findMany(args?: { where?: { userId?: string; date?: any } }) {
    const ref = adminDb.collection("streak_records");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    return snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));
  },

  async deleteMany(args?: { where?: { userId?: string } }) {
    const ref = adminDb.collection("streak_records");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    const batch = adminDb.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
    return { count: snap.size };
  },
};

const xpTransactionService = {
  async create(args: { data: any }) {
    const id = args.data.id || adminDb.collection("xp_transactions").doc().id;
    const ref = adminDb.collection("xp_transactions").doc(id);
    const record = {
      id,
      createdAt: new Date(),
      ...args.data,
    };
    await ref.set(record);
    return record;
  },

  async findMany(args?: { where?: { userId?: string; createdAt?: any }; orderBy?: any; take?: number }) {
    const ref = adminDb.collection("xp_transactions");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    let list: any[] = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));

    if (args?.where?.createdAt) {
      if (args.where.createdAt.gte) {
        const minTime = new Date(args.where.createdAt.gte).getTime();
        list = list.filter((t) => new Date(t.createdAt).getTime() >= minTime);
      }
      if (args.where.createdAt.lt) {
        const maxTime = new Date(args.where.createdAt.lt).getTime();
        list = list.filter((t) => new Date(t.createdAt).getTime() < maxTime);
      }
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (args?.take) list = list.slice(0, args.take);
    return list;
  },

  async deleteMany(args?: { where?: { userId?: string } }) {
    const ref = adminDb.collection("xp_transactions");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    const batch = adminDb.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
    return { count: snap.size };
  },
};

const notificationService = {
  async create(args: { data: any }) {
    const ref = adminDb.collection("notifications").doc();
    const record = {
      id: ref.id,
      read: false,
      createdAt: new Date(),
      ...args.data,
    };
    await ref.set(record);
    return record;
  },

  async findMany(args?: { where?: { userId?: string; read?: boolean; type?: string }; orderBy?: any; take?: number }) {
    const ref = adminDb.collection("notifications");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    let list: any[] = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));
    if (args?.where?.read !== undefined) {
      list = list.filter((n) => n.read === args.where?.read);
    }
    if (args?.where?.type !== undefined) {
      list = list.filter((n) => n.type === args.where?.type);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (args?.take) list = list.slice(0, args.take);
    return list;
  },

  async count(args?: { where?: { userId?: string; read?: boolean; type?: string } }) {
    const list = await notificationService.findMany(args);
    return list.length;
  },

  async delete(args: { where: { id: string } }) {
    if (!args?.where?.id) return { id: null };
    await adminDb.collection("notifications").doc(args.where.id).delete();
    return { id: args.where.id };
  },

  async deleteMany(args?: { where?: { userId?: string; link?: string | { startsWith?: string }; type?: string } }) {
    const ref = adminDb.collection("notifications");
    let queryRef: FirebaseFirestore.Query = ref;
    if (args?.where?.userId) queryRef = ref.where("userId", "==", args.where.userId);
    const snap = await queryRef.get();
    const batch = adminDb.batch();
    let count = 0;
    for (const d of snap.docs) {
      const data = d.data();
      let shouldDelete = true;
      if (args?.where?.type && data.type !== args.where.type) {
        shouldDelete = false;
      }
      if (args?.where?.link) {
        if (typeof args.where.link === "string" && data.link !== args.where.link) {
          shouldDelete = false;
        } else if (typeof args.where.link === "object" && args.where.link.startsWith) {
          if (typeof data.link !== "string" || !data.link.startsWith(args.where.link.startsWith)) {
            shouldDelete = false;
          }
        }
      }
      if (shouldDelete) {
        batch.delete(d.ref);
        count++;
      }
    }
    await batch.commit();
    return { count };
  },
};

const friendChallengeService = {
  async create(args: { data: any }) {
    const ref = adminDb.collection("friend_challenges").doc();
    const record = {
      id: ref.id,
      xpStake: 150,
      status: "PENDING",
      winnerId: null,
      createdAt: new Date(),
      completedAt: null,
      ...args.data,
    };
    await ref.set(record);
    return record;
  },

  async findMany(args?: any) {
    const snap = await adminDb.collection("friend_challenges").get();
    return snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));
  },

  async update(args: { where: { id: string }; data: any }) {
    const ref = adminDb.collection("friend_challenges").doc(args.where.id);
    await ref.update({ ...args.data, updatedAt: new Date() });
    const snap = await ref.get();
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async findUnique(args: { where: { id: string } }) {
    const snap = await adminDb.collection("friend_challenges").doc(args.where.id).get();
    if (!snap.exists) return null;
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async findFirst(args?: any) {
    const list = await friendChallengeService.findMany(args);
    return list[0] || null;
  },

  async deleteMany(args?: any) {
    const snap = await adminDb.collection("friend_challenges").get();
    const batch = adminDb.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
    return { count: snap.size };
  },
};

export { adminDb, FieldValue, Timestamp };

export const db = {
  user: userService,
  problem: problemService,
  userProblemStatus: userProblemStatusService,
  dailyChallenge: dailyChallengeService,
  submission: submissionService,
  group: groupService,
  groupMember: groupMemberService,
  achievement: achievementService,
  userAchievement: userAchievementService,
  season: seasonService,
  groupSeason: groupSeasonService,
  streakRecord: streakRecordService,
  xpTransaction: xpTransactionService,
  notification: notificationService,
  friendChallenge: friendChallengeService,

  runTransaction: <T>(updateFunction: (transaction: FirebaseFirestore.Transaction) => Promise<T>): Promise<T> => {
    return adminDb.runTransaction(updateFunction);
  },

  async $transaction<T>(input: ((trx: any) => Promise<T>) | Promise<any>[]): Promise<T | any[]> {
    if (Array.isArray(input)) {
      return await Promise.all(input);
    }
    return await input(db);
  },
};
