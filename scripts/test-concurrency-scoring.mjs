import assert from "node:assert/strict";

console.log("--- Starting SEC-07 Concurrency Scoring & Idempotency Tests ---");

// Test harness simulating concurrent transactions against a state store
class MockAtomicStore {
  constructor() {
    this.users = new Map();
    this.problemStatuses = new Map();
    this.xpTransactions = new Map();
    this.dailyChallenges = new Map();
    this.submissions = [];
    this._lock = Promise.resolve();
  }

  async runTransaction(txFn) {
    // Serialize transactions to simulate Firestore transactional isolation and optimistic concurrency
    let release;
    const lockPromise = new Promise((res) => (release = res));
    const prevLock = this._lock;
    this._lock = prevLock.then(() => lockPromise);

    await prevLock;
    try {
      const transaction = {
        get: async (key) => {
          if (key.type === "user") return this.users.get(key.id) ? { exists: true, data: () => ({ ...this.users.get(key.id) }) } : { exists: false, data: () => null };
          if (key.type === "status") return this.problemStatuses.get(key.id) ? { exists: true, data: () => ({ ...this.problemStatuses.get(key.id) }) } : { exists: false, data: () => null };
          if (key.type === "daily") return this.dailyChallenges.get(key.id) ? { exists: true, data: () => ({ ...this.dailyChallenges.get(key.id) }) } : { exists: false, data: () => null };
          if (key.type === "bonus") return this.xpTransactions.get(key.id) ? { exists: true, data: () => ({ ...this.xpTransactions.get(key.id) }) } : { exists: false, data: () => null };
          return { exists: false, data: () => null };
        },
        set: (key, val) => {
          if (key.type === "submission") this.submissions.push({ ...val });
          if (key.type === "status") this.problemStatuses.set(key.id, { ...val });
          if (key.type === "daily") this.dailyChallenges.set(key.id, { ...val });
          if (key.type === "bonus" || key.type === "xp") this.xpTransactions.set(key.id, { ...val });
          if (key.type === "user") this.users.set(key.id, { ...val });
        },
        update: (key, val) => {
          if (key.type === "status") this.problemStatuses.set(key.id, { ...this.problemStatuses.get(key.id), ...val });
          if (key.type === "daily") this.dailyChallenges.set(key.id, { ...this.dailyChallenges.get(key.id), ...val });
          if (key.type === "user") this.users.set(key.id, { ...this.users.get(key.id), ...val });
        }
      };

      return await txFn(transaction);
    } finally {
      release();
    }
  }

  async solveProblemAtomic(userId, problemId, difficulty = "MEDIUM") {
    const pointsMap = { EASY: 10, MEDIUM: 20, HARD: 30 };
    const basePoints = pointsMap[difficulty] || 20;
    const statusDocId = `${userId}_${problemId}`;

    return this.runTransaction(async (transaction) => {
      // 1. Reads
      const userSnap = await transaction.get({ type: "user", id: userId });
      const statusSnap = await transaction.get({ type: "status", id: statusDocId });

      const statusData = statusSnap.exists ? statusSnap.data() : null;
      const isFirstSolve = !statusData || (statusData.status !== "SOLVED" && statusData.status !== "OPTIMAL");
      const problemPoints = isFirstSolve ? basePoints : 0;

      // 2. Writes
      transaction.set({ type: "submission" }, { userId, problemId, pointsEarned: problemPoints });

      if (statusSnap.exists) {
        transaction.update({ type: "status", id: statusDocId }, {
          status: "SOLVED",
          attemptsCount: (statusData.attemptsCount || 0) + 1,
        });
      } else {
        transaction.set({ type: "status", id: statusDocId }, {
          id: statusDocId,
          userId,
          problemId,
          status: "SOLVED",
          attemptsCount: 1,
        });
      }

      if (isFirstSolve && problemPoints > 0) {
        const txId = `xp_${userId}_${problemId}_${Date.now()}_${Math.random()}`;
        transaction.set({ type: "xp", id: txId }, { userId, amount: problemPoints, reason: "PROBLEM_SOLVE" });

        const userData = userSnap.exists ? userSnap.data() : { score: 0, totalSolved: 0 };
        const newScore = (userData.score || 0) + problemPoints;
        const newTotalSolved = (userData.totalSolved || 0) + 1;

        transaction.update({ type: "user", id: userId }, {
          score: newScore,
          xp: newScore,
          totalSolved: newTotalSolved,
        });
      }

      return { isFirstSolve, problemPoints };
    });
  }

  async awardDailyBonusAtomic(userId, dateStr) {
    const dailyDocId = `${userId}_${dateStr}`;
    const deterministicBonusId = `bonus_${userId}_${dateStr}`;
    const bonusAmount = 20;

    return this.runTransaction(async (transaction) => {
      const dailySnap = await transaction.get({ type: "daily", id: dailyDocId });
      const userSnap = await transaction.get({ type: "user", id: userId });
      const bonusSnap = await transaction.get({ type: "bonus", id: deterministicBonusId });

      const dailyData = dailySnap.exists ? dailySnap.data() : null;
      const userData = userSnap.exists ? userSnap.data() : { score: 0 };

      // Idempotency check: if daily challenge already marked completed or bonus record exists
      if ((dailyData && dailyData.completed === true) || bonusSnap.exists) {
        return { awarded: false, alreadyCompleted: true, newScore: userData.score || 0 };
      }

      transaction.set({ type: "daily", id: dailyDocId }, {
        id: dailyDocId,
        userId,
        date: dateStr,
        completed: true,
      });

      transaction.set({ type: "bonus", id: deterministicBonusId }, {
        id: deterministicBonusId,
        userId,
        amount: bonusAmount,
        reason: "DAILY_COMPLETION_BONUS",
      });

      const newScore = (userData.score || 0) + bonusAmount;
      transaction.update({ type: "user", id: userId }, {
        score: newScore,
        xp: newScore,
      });

      return { awarded: true, alreadyCompleted: false, newScore };
    });
  }
}

// Test 1: 10 Parallel Solves of the SAME problem (Double-solve race condition prevention)
{
  const store = new MockAtomicStore();
  const userId = "user_concurrent_1";
  store.users.set(userId, { id: userId, score: 0, xp: 0, totalSolved: 0 });

  // Fire 10 parallel solve requests for Problem #1 (Medium, 20 points)
  const parallelPromises = Array.from({ length: 10 }).map(() =>
    store.solveProblemAtomic(userId, 1, "MEDIUM")
  );

  const results = await Promise.all(parallelPromises);
  const firstSolves = results.filter((r) => r.isFirstSolve);
  const duplicateSolves = results.filter((r) => !r.isFirstSolve);

  assert.equal(firstSolves.length, 1, "Exactly 1 solve must be classified as firstSolve");
  assert.equal(duplicateSolves.length, 9, "9 concurrent requests must be classified as duplicate");

  const user = store.users.get(userId);
  assert.equal(user.score, 20, "User score must be exactly 20 points (no duplicate points added)");
  assert.equal(user.totalSolved, 1, "totalSolved counter must be exactly 1");
  console.log("Test 1 Passed: 10 parallel solves of the same problem resulted in exactly 1 point award (no duplicates)");
}

// Test 2: 10 Parallel Solves of 10 DIFFERENT problems (Zero lost-update race condition)
{
  const store = new MockAtomicStore();
  const userId = "user_concurrent_2";
  store.users.set(userId, { id: userId, score: 0, xp: 0, totalSolved: 0 });

  // Fire 10 parallel solves for 10 distinct problems (each Easy = 10 pts)
  const parallelDifferentSolves = Array.from({ length: 10 }).map((_, idx) =>
    store.solveProblemAtomic(userId, idx + 100, "EASY")
  );

  const results = await Promise.all(parallelDifferentSolves);
  assert.equal(results.every((r) => r.isFirstSolve), true);

  const user = store.users.get(userId);
  assert.equal(user.score, 100, "User score must be exactly 100 (10 problems * 10 pts, zero lost points)");
  assert.equal(user.totalSolved, 10, "User totalSolved must be exactly 10");
  console.log("Test 2 Passed: 10 parallel solves of distinct problems produced zero lost points");
}

// Test 3: 10 Parallel Daily 3 Bonus Awards (Strict Idempotency)
{
  const store = new MockAtomicStore();
  const userId = "user_concurrent_3";
  store.users.set(userId, { id: userId, score: 100, xp: 100 });

  const todayStr = "2026-10-03";
  const parallelBonusPromises = Array.from({ length: 10 }).map(() =>
    store.awardDailyBonusAtomic(userId, todayStr)
  );

  const bonusResults = await Promise.all(parallelBonusPromises);
  const awarded = bonusResults.filter((r) => r.awarded);
  const idempotentRejections = bonusResults.filter((r) => r.alreadyCompleted);

  assert.equal(awarded.length, 1, "Daily bonus must be awarded exactly once");
  assert.equal(idempotentRejections.length, 9, "9 parallel triggers must be rejected as already completed");

  const user = store.users.get(userId);
  assert.equal(user.score, 120, "User score must increase by exactly 20 points (100 -> 120)");
  console.log("Test 3 Passed: 10 parallel daily bonus requests awarded +20 pts exactly once");
}

console.log("\nALL STEP 2 CONCURRENCY & IDEMPOTENCY TESTS PASSED SUCCESSFULLY!");
