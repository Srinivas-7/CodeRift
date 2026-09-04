import { firestore } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
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

// Helper to sanitize dates from Firestore
function formatDoc(data: any): any {
  if (!data) return null;
  const formatted: any = { ...data };
  for (const key of Object.keys(formatted)) {
    if (formatted[key] instanceof Timestamp) {
      formatted[key] = formatted[key].toDate();
    }
  }
  return formatted;
}

const userService = {
  async findUnique(args: { where: { id?: string; email?: string; googleId?: string; firebaseUid?: string; username?: string }; include?: any; select?: any }) {
    const { id, email, googleId, firebaseUid, username } = args.where;
    if (id) {
      const snap = await getDoc(doc(firestore, "users", id));
      if (!snap.exists()) return null;
      return formatDoc({ id: snap.id, ...snap.data() });
    }

    const usersRef = collection(firestore, "users");
    let q = null;
    if (email) q = query(usersRef, where("email", "==", email), firestoreLimit(1));
    else if (googleId) q = query(usersRef, where("googleId", "==", googleId), firestoreLimit(1));
    else if (firebaseUid) q = query(usersRef, where("firebaseUid", "==", firebaseUid), firestoreLimit(1));
    else if (username) q = query(usersRef, where("username", "==", username), firestoreLimit(1));

    if (!q) return null;
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const first = snap.docs[0];
    return formatDoc({ id: first.id, ...first.data() });
  },

  async findFirst(args?: { where?: any; orderBy?: any }) {
    const list = await userService.findMany(args);
    return list.length > 0 ? list[0] : null;
  },

  async findMany(args?: { where?: any; orderBy?: { xp?: "asc" | "desc"; createdAt?: "asc" | "desc" }; take?: number }) {
    const usersRef = collection(firestore, "users");
    const snap = await getDocs(usersRef);
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
    const id = args.data.id || args.data.firebaseUid || doc(collection(firestore, "users")).id;
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
    await setDoc(doc(firestore, "users", id), record);
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

    await updateDoc(doc(firestore, "users", id), updateData);
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
    const snap = await getDocs(collection(firestore, "users"));
    return snap.size;
  },

  async deleteMany(args?: { where?: any }) {
    const snap = await getDocs(collection(firestore, "users"));
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
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
    const snap = await getDoc(doc(firestore, "user_problem_statuses", docId));
    if (!snap.exists()) return null;
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async findMany(args?: { where?: { userId?: string | { in: string[] }; status?: string | { in: string[] }; problemId?: number | { in: number[] } }; select?: any }) {
    const ref = collection(firestore, "user_problem_statuses");
    let q = query(ref);

    if (args?.where?.userId && typeof args.where.userId === "string") {
      q = query(ref, where("userId", "==", args.where.userId));
    }

    const snap = await getDocs(q);
    let list: any[] = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));

    if (args?.where?.userId && typeof args.where.userId === "object" && Array.isArray((args.where.userId as any).in)) {
      list = list.filter((s) => (args?.where?.userId as any).in.includes(s.userId));
    }

    if (args?.where?.status) {
      if (typeof args.where.status === "string") {
        list = list.filter((s) => s.status === args.where?.status);
      } else if (args.where.status.in && Array.isArray(args.where.status.in)) {
        list = list.filter((s) => args.where?.status && (args.where.status as any).in.includes(s.status));
      }
    }

    if (args?.where?.problemId) {
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
    const snap = await getDoc(doc(firestore, "user_problem_statuses", docId));

    if (snap.exists()) {
      const updateData = { ...args.update, lastAttemptedAt: new Date() };
      await updateDoc(doc(firestore, "user_problem_statuses", docId), updateData);
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
    await setDoc(doc(firestore, "user_problem_statuses", docId), createData);
    return formatDoc({ id: docId, ...createData });
  },

  async count(args?: { where?: any }) {
    const list = await userProblemStatusService.findMany(args);
    return list.length;
  },

  async deleteMany(args?: { where?: { userId?: string } }) {
    const ref = collection(firestore, "user_problem_statuses");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
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
    const snap = await getDoc(doc(firestore, "daily_challenges", docId));
    if (!snap.exists()) return null;
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async findMany(args?: { where?: { userId?: string | { in: string[] }; groupId?: string; date?: string; completed?: boolean } }) {
    const ref = collection(firestore, "daily_challenges");
    const snap = await getDocs(ref);
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

    const snap = await getDoc(doc(firestore, "daily_challenges", docId));

    if (snap.exists()) {
      await updateDoc(doc(firestore, "daily_challenges", docId), args.update);
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
    await setDoc(doc(firestore, "daily_challenges", docId), createData);
    return formatDoc({ id: docId, ...createData });
  },

  async update(args: { where: { id: string }; data: any }) {
    await updateDoc(doc(firestore, "daily_challenges", args.where.id), args.data);
    const snap = await getDoc(doc(firestore, "daily_challenges", args.where.id));
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async deleteMany(args?: { where?: { userId?: string } }) {
    const ref = collection(firestore, "daily_challenges");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
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

    const dailyRef = doc(firestore, "daily_challenges", dailyDocId);
    const userRef = doc(firestore, "users", userId);
    const bonusRef = doc(firestore, "xp_transactions", deterministicBonusId);

    try {
      const result = await runTransaction(firestore, async (transaction) => {
        const dailySnap = await transaction.get(dailyRef);
        const userSnap = await transaction.get(userRef);
        const bonusSnap = await transaction.get(bonusRef);

        const dailyData = dailySnap.exists() ? (dailySnap.data() as any) : null;
        const userData = userSnap.exists() ? (userSnap.data() as any) : {};

        // 1. If daily challenge is already completed or bonus transaction already exists, exit idempotently
        if ((dailyData && dailyData.completed === true) || bonusSnap.exists()) {
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
        if (dailySnap.exists()) {
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
    const ref = doc(collection(firestore, "submissions"));
    const record = {
      id: ref.id,
      xpEarned: 0,
      bonusXp: 0,
      source: "LEETCODE",
      createdAt: new Date(),
      ...args.data,
    };
    await setDoc(ref, record);
    return record;
  },

  async findMany(args?: { where?: { userId?: string; problemId?: number }; orderBy?: any; take?: number }) {
    const ref = collection(firestore, "submissions");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    const snap = await getDocs(q);
    let list: any[] = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));

    if (args?.where?.problemId) {
      list = list.filter((s) => s.problemId === args.where?.problemId);
    }

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (args?.take) list = list.slice(0, args.take);
    return list;
  },

  async count() {
    const snap = await getDocs(collection(firestore, "submissions"));
    return snap.size;
  },

  async deleteMany(args?: { where?: { userId?: string } }) {
    const ref = collection(firestore, "submissions");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
    return { count: snap.size };
  },
};

const groupMemberService = {
  async findUnique(args: { where: { id?: string; userId_groupId?: { userId: string; groupId: string } }; include?: any }) {
    const docId = args.where.id || (args.where.userId_groupId ? `${args.where.userId_groupId.userId}_${args.where.userId_groupId.groupId}` : null);
    if (!docId) return null;
    const snap = await getDoc(doc(firestore, "group_members", docId));
    if (!snap.exists()) return null;
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
    const ref = collection(firestore, "group_members");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    if (args?.where?.groupId) q = query(ref, where("groupId", "==", args.where.groupId));

    const snap = await getDocs(q);
    let list: any[] = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));

    for (const member of list) {
      if (args?.include?.user) {
        member.user = await userService.findUnique({ where: { id: member.userId } });
      }
      if (args?.include?.group) {
        member.group = await groupService.findUnique({ where: { id: member.groupId } });
      }
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
    await setDoc(doc(firestore, "group_members", docId), record);
    return record;
  },

  async update(args: { where: { id?: string; userId_groupId?: { userId: string; groupId: string } }; data: any }) {
    const docId = args.where.id || `${args.where.userId_groupId?.userId}_${args.where.userId_groupId?.groupId}`;
    if (!docId) return null;
    await updateDoc(doc(firestore, "group_members", docId), args.data);
    const snap = await getDoc(doc(firestore, "group_members", docId));
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async delete(args: { where: { id?: string; userId_groupId?: { userId: string; groupId: string } } }) {
    const docId = args.where.id || (args.where.userId_groupId ? `${args.where.userId_groupId.userId}_${args.where.userId_groupId.groupId}` : null);
    if (!docId) return null;
    await deleteDoc(doc(firestore, "group_members", docId));
    return { id: docId };
  },

  async deleteMany(args?: { where?: { userId?: string; groupId?: string } }) {
    const ref = collection(firestore, "group_members");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    if (args?.where?.groupId) q = query(ref, where("groupId", "==", args.where.groupId));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(d.ref);
    return { count: snap.size };
  },
};

const groupService = {
  async findUnique(args: { where: { id?: string; inviteCode?: string }; include?: any }) {
    const { id, inviteCode } = args.where;
    if (id) {
      const snap = await getDoc(doc(firestore, "groups", id));
      if (!snap.exists()) return null;
      const groupData = formatDoc({ id: snap.id, ...snap.data() });
      const members = await groupMemberService.findMany({ where: { groupId: id }, include: { user: true } });
      return { ...groupData, members };
    }
    if (inviteCode) {
      const q = query(collection(firestore, "groups"), where("inviteCode", "==", inviteCode), firestoreLimit(1));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const first = snap.docs[0];
      const groupData = formatDoc({ id: first.id, ...first.data() });
      const members = await groupMemberService.findMany({ where: { groupId: first.id }, include: { user: true } });
      return { ...groupData, members };
    }
    return null;
  },

  async findMany(args?: any) {
    const snap = await getDocs(collection(firestore, "groups"));
    return snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));
  },

  async create(args: { data: any }) {
    const ref = doc(collection(firestore, "groups"));
    const record = {
      id: ref.id,
      avatar: "neon_shield",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...args.data,
    };
    await setDoc(ref, record);
    return record;
  },

  async update(args: { where: { id: string }; data: any }) {
    await updateDoc(doc(firestore, "groups", args.where.id), { ...args.data, updatedAt: new Date() });
    return await groupService.findUnique({ where: { id: args.where.id } });
  },

  async count() {
    const snap = await getDocs(collection(firestore, "groups"));
    return snap.size;
  },

  async delete(args: { where: { id: string } }) {
    await deleteDoc(doc(firestore, "groups", args.where.id));
    return { id: args.where.id };
  },

  async deleteMany() {
    const snap = await getDocs(collection(firestore, "groups"));
    for (const d of snap.docs) await deleteDoc(d.ref);
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
    const ref = collection(firestore, "user_achievements");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    const snap = await getDocs(q);
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
    await setDoc(doc(firestore, "user_achievements", docId), record);
    return record;
  },

  async deleteMany(args?: { where?: { userId?: string } }) {
    const ref = collection(firestore, "user_achievements");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(d.ref);
    return { count: snap.size };
  },
};

const seasonService = {
  async findFirst(args?: any) {
    try {
      const snap = await getDocs(collection(firestore, "seasons"));
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
      await setDoc(doc(firestore, "seasons", "season_1"), defaultSeason);
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
    await setDoc(doc(firestore, "seasons", id), updateData, { merge: true });
    const snap = await getDoc(doc(firestore, "seasons", id));
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
    const snap = await getDoc(doc(firestore, "streak_records", docId));
    if (!snap.exists()) return null;
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async upsert(args: { where: { userId_date: { userId: string; date: string } }; update: any; create: any }) {
    const docId = `${args.where.userId_date.userId}_${args.where.userId_date.date}`;
    const snap = await getDoc(doc(firestore, "streak_records", docId));

    if (snap.exists()) {
      await updateDoc(doc(firestore, "streak_records", docId), args.update);
      return formatDoc({ id: docId, ...snap.data(), ...args.update });
    }

    const createData = {
      userId: args.where.userId_date.userId,
      date: args.where.userId_date.date,
      solvedCount: 0,
      shieldUsed: false,
      createdAt: new Date(),
      ...args.create,
    };
    await setDoc(doc(firestore, "streak_records", docId), createData);
    return formatDoc({ id: docId, ...createData });
  },

  async update(args: { where: { userId_date?: { userId: string; date: string }; id?: string }; data: any }) {
    const docId = args.where.userId_date
      ? `${args.where.userId_date.userId}_${args.where.userId_date.date}`
      : args.where.id;
    if (!docId) return null;
    await updateDoc(doc(firestore, "streak_records", docId), args.data);
    const snap = await getDoc(doc(firestore, "streak_records", docId));
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async deleteMany(args?: { where?: { userId?: string } }) {
    const ref = collection(firestore, "streak_records");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(d.ref);
    return { count: snap.size };
  },
};

const xpTransactionService = {
  async create(args: { data: any }) {
    const id = args.data.id || doc(collection(firestore, "xp_transactions")).id;
    const ref = doc(firestore, "xp_transactions", id);
    const record = {
      id,
      createdAt: new Date(),
      ...args.data,
    };
    await setDoc(ref, record);
    return record;
  },

  async findMany(args?: { where?: { userId?: string; createdAt?: any }; orderBy?: any; take?: number }) {
    const ref = collection(firestore, "xp_transactions");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    const snap = await getDocs(q);
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
    const ref = collection(firestore, "xp_transactions");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(d.ref);
    return { count: snap.size };
  },
};

const notificationService = {
  async create(args: { data: any }) {
    const ref = doc(collection(firestore, "notifications"));
    const record = {
      id: ref.id,
      read: false,
      createdAt: new Date(),
      ...args.data,
    };
    await setDoc(ref, record);
    return record;
  },

  async findMany(args?: { where?: { userId?: string; read?: boolean }; orderBy?: any; take?: number }) {
    const ref = collection(firestore, "notifications");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    const snap = await getDocs(q);
    let list: any[] = snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));
    if (args?.where?.read !== undefined) {
      list = list.filter((n) => n.read === args.where?.read);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (args?.take) list = list.slice(0, args.take);
    return list;
  },

  async count(args?: { where?: { userId?: string; read?: boolean } }) {
    const list = await notificationService.findMany(args);
    return list.length;
  },

  async deleteMany(args?: { where?: { userId?: string } }) {
    const ref = collection(firestore, "notifications");
    let q = query(ref);
    if (args?.where?.userId) q = query(ref, where("userId", "==", args.where.userId));
    const snap = await getDocs(q);
    for (const d of snap.docs) await deleteDoc(d.ref);
    return { count: snap.size };
  },
};

const friendChallengeService = {
  async create(args: { data: any }) {
    const ref = doc(collection(firestore, "friend_challenges"));
    const record = {
      id: ref.id,
      xpStake: 150,
      status: "PENDING",
      winnerId: null,
      createdAt: new Date(),
      completedAt: null,
      ...args.data,
    };
    await setDoc(ref, record);
    return record;
  },

  async findMany(args?: any) {
    const snap = await getDocs(collection(firestore, "friend_challenges"));
    return snap.docs.map((d) => formatDoc({ id: d.id, ...d.data() }));
  },

  async update(args: { where: { id: string }; data: any }) {
    const ref = doc(firestore, "friend_challenges", args.where.id);
    await updateDoc(ref, { ...args.data, updatedAt: new Date() });
    const snap = await getDoc(ref);
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async findUnique(args: { where: { id: string } }) {
    const snap = await getDoc(doc(firestore, "friend_challenges", args.where.id));
    if (!snap.exists()) return null;
    return formatDoc({ id: snap.id, ...snap.data() });
  },

  async findFirst(args?: any) {
    const list = await friendChallengeService.findMany(args);
    return list[0] || null;
  },

  async deleteMany(args?: any) {
    const snap = await getDocs(collection(firestore, "friend_challenges"));
    for (const d of snap.docs) await deleteDoc(d.ref);
    return { count: snap.size };
  },
};

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

  async $transaction<T>(input: ((trx: any) => Promise<T>) | Promise<any>[]): Promise<T | any[]> {
    if (Array.isArray(input)) {
      return await Promise.all(input);
    }
    return await input(db);
  },
};
