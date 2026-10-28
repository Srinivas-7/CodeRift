import fs from "node:fs/promises";
import path from "node:path";

async function readJsonFile(filePath, fallback = []) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

async function analyze() {
  const backupDir = path.resolve(process.cwd(), "firestore-backup");

  console.log("================================================================================");
  console.log("             CODERIFT FIRESTORE INTEGRITY & TAMPER AUDIT REPORT                 ");
  console.log("================================================================================");
  console.log(`Analyzing backup directory: ${backupDir}\n`);

  try {
    await fs.access(backupDir);
  } catch {
    console.error(`ERROR: Directory '${backupDir}' does not exist.`);
    console.log("Please run 'node scripts/export-firestore.mjs' first to generate the backup data.\n");
    process.exit(1);
  }

  const users = await readJsonFile(path.join(backupDir, "users.json"));
  const xpTransactions = await readJsonFile(path.join(backupDir, "xp_transactions.json"));
  const userProblemStatuses = await readJsonFile(path.join(backupDir, "user_problem_statuses.json"));
  const submissions = await readJsonFile(path.join(backupDir, "submissions.json"));
  const dailyChallenges = await readJsonFile(path.join(backupDir, "daily_challenges.json"));

  console.log(`Loaded Records:`);
  console.log(`  - Users:                  ${users.length}`);
  console.log(`  - XP Transactions:        ${xpTransactions.length}`);
  console.log(`  - User Problem Statuses:  ${userProblemStatuses.length}`);
  console.log(`  - Submissions:            ${submissions.length}`);
  console.log(`  - Daily Challenges:       ${dailyChallenges.length}`);
  console.log("--------------------------------------------------------------------------------\n");

  const findings = {
    scoreMismatches: [],
    solvedCountMismatches: [],
    invalidShieldsOrScores: [],
    adminUsers: [],
    duplicateDailyBonuses: [],
    unbackedSolvedStatuses: [],
    handleCollisions: [],
  };

  // 1. Group XP transactions by userId
  const xpByUser = new Map();
  for (const tx of xpTransactions) {
    const uId = tx.userId;
    if (!uId) continue;
    const current = xpByUser.get(uId) || 0;
    xpByUser.set(uId, current + (Number(tx.amount) || 0));
  }

  // 2. Group solved problem statuses by userId
  const solvedCountByUser = new Map();
  const solvedStatusesByUserAndProblem = new Set();
  for (const st of userProblemStatuses) {
    if (st.status === "SOLVED" || st.status === "OPTIMAL") {
      const uId = st.userId;
      if (uId) {
        solvedCountByUser.set(uId, (solvedCountByUser.get(uId) || 0) + 1);
        solvedStatusesByUserAndProblem.add(`${uId}_${st.problemId}`);
      }
    }
  }

  // 3. Track submission keys (userId + problemId)
  const submissionsByUserAndProblem = new Set();
  for (const sub of submissions) {
    if (sub.userId && sub.problemId) {
      submissionsByUserAndProblem.add(`${sub.userId}_${sub.problemId}`);
    }
  }

  // 4. Track handles for collision detection
  const leetcodeHandles = new Map();
  const gfgHandles = new Map();

  for (const u of users) {
    const uid = u._id || u.id;
    const username = u.username || "unknown";
    const score = Number(u.score ?? u.xp ?? 0);
    const level = Number(u.level ?? 1);
    const shields = Number(u.streakShields ?? 0);
    const totalSolved = Number(u.totalSolved ?? 0);
    const role = u.role || "USER";

    // 4.1 Admin Users
    if (role === "ADMIN") {
      findings.adminUsers.push({ id: uid, username, email: u.email, role });
    }

    // 4.2 Score vs XP Transactions
    const sumXp = xpByUser.get(uid) || 0;
    if (score !== sumXp) {
      findings.scoreMismatches.push({
        id: uid,
        username,
        userScore: score,
        sumXpTransactions: sumXp,
        diff: score - sumXp,
      });
    }

    // 4.3 Total Solved vs SOLVED problem status count
    const actualSolved = solvedCountByUser.get(uid) || 0;
    if (totalSolved !== actualSolved) {
      findings.solvedCountMismatches.push({
        id: uid,
        username,
        totalSolvedOnProfile: totalSolved,
        actualSolvedStatuses: actualSolved,
        diff: totalSolved - actualSolved,
      });
    }

    // 4.4 Shields & Sanity Bounds
    if (shields < 0 || shields > 3 || score < 0 || level < 1 || level > 100) {
      findings.invalidShieldsOrScores.push({
        id: uid,
        username,
        streakShields: shields,
        score,
        level,
      });
    }

    // 4.5 Handle Collisions
    if (u.leetcodeUsername) {
      const cleanLc = u.leetcodeUsername.trim().toLowerCase();
      const existing = leetcodeHandles.get(cleanLc) || [];
      existing.push({ id: uid, username });
      leetcodeHandles.set(cleanLc, existing);
    }

    if (u.gfgUsername) {
      const cleanGfg = u.gfgUsername.trim().toLowerCase();
      const existing = gfgHandles.get(cleanGfg) || [];
      existing.push({ id: uid, username });
      gfgHandles.set(cleanGfg, existing);
    }
  }

  // Check handle collisions
  for (const [handle, userList] of leetcodeHandles.entries()) {
    if (userList.length > 1) {
      findings.handleCollisions.push({
        platform: "LeetCode",
        handle,
        users: userList,
      });
    }
  }
  for (const [handle, userList] of gfgHandles.entries()) {
    if (userList.length > 1) {
      findings.handleCollisions.push({
        platform: "GeeksforGeeks",
        handle,
        users: userList,
      });
    }
  }

  // 5. Duplicate Daily 3 bonus transactions for same user & day
  const dailyBonusMap = new Map();
  for (const tx of xpTransactions) {
    if (tx.reason && (tx.reason.startsWith("DAILY_COMPLETION_BONUS") || tx.id?.startsWith("bonus_"))) {
      const dateStr = tx.createdAt ? new Date(tx.createdAt).toISOString().split("T")[0] : "unknown";
      const key = `${tx.userId}_${dateStr}`;
      const count = (dailyBonusMap.get(key) || 0) + 1;
      dailyBonusMap.set(key, count);
    }
  }

  for (const [key, count] of dailyBonusMap.entries()) {
    if (count > 1) {
      const [uId, date] = key.split("_");
      findings.duplicateDailyBonuses.push({ userId: uId, date, bonusCount: count });
    }
  }

  // 6. Solved statuses with no matching submission record
  for (const key of solvedStatusesByUserAndProblem) {
    if (!submissionsByUserAndProblem.has(key)) {
      const [uId, pId] = key.split("_");
      findings.unbackedSolvedStatuses.push({ userId: uId, problemId: pId });
    }
  }

  // --- PRINT REPORT ---
  console.log("=== 1. ADMIN ROLE USERS ===");
  if (findings.adminUsers.length === 0) {
    console.log("  (None found)");
  } else {
    findings.adminUsers.forEach((a) => {
      console.log(`  - [ADMIN] ID: ${a.id.padEnd(28)} | Username: ${a.username.padEnd(16)} | Email: ${a.email}`);
    });
  }

  console.log("\n=== 2. USERS WITH SCORE != SUM(XP_TRANSACTIONS) ===");
  if (findings.scoreMismatches.length === 0) {
    console.log("  ✓ All user scores match sum of XP transactions exactly.");
  } else {
    findings.scoreMismatches.forEach((m) => {
      console.log(`  - User: ${m.username.padEnd(16)} (ID: ${m.id}) | Score: ${m.userScore} | Sum XP: ${m.sumXpTransactions} | Discrepancy: ${m.diff > 0 ? "+" : ""}${m.diff}`);
    });
  }

  console.log("\n=== 3. USERS WITH TOTALSOLVED != COUNT(SOLVED_STATUSES) ===");
  if (findings.solvedCountMismatches.length === 0) {
    console.log("  ✓ All user totalSolved counters match solved problem statuses.");
  } else {
    findings.solvedCountMismatches.forEach((m) => {
      console.log(`  - User: ${m.username.padEnd(16)} (ID: ${m.id}) | Profile Solved: ${m.totalSolvedOnProfile} | Actual Solved: ${m.actualSolvedStatuses} | Discrepancy: ${m.diff > 0 ? "+" : ""}${m.diff}`);
    });
  }

  console.log("\n=== 4. ANOMALOUS SHIELDS / SCORES / LEVELS ===");
  if (findings.invalidShieldsOrScores.length === 0) {
    console.log("  ✓ All users have valid shield counts (0-3) and non-negative scores.");
  } else {
    findings.invalidShieldsOrScores.forEach((i) => {
      console.log(`  - User: ${i.username.padEnd(16)} (ID: ${i.id}) | Shields: ${i.streakShields} | Score: ${i.score} | Level: ${i.level}`);
    });
  }

  console.log("\n=== 5. DUPLICATE DAILY BONUS TRANSACTIONS (SAME USER & DATE) ===");
  if (findings.duplicateDailyBonuses.length === 0) {
    console.log("  ✓ No duplicate daily bonus transactions detected.");
  } else {
    findings.duplicateDailyBonuses.forEach((d) => {
      console.log(`  - User: ${d.userId} on Date: ${d.date} received ${d.bonusCount} bonuses`);
    });
  }

  console.log("\n=== 6. SOLVED STATUSES WITHOUT SUBMISSION RECORDS ===");
  if (findings.unbackedSolvedStatuses.length === 0) {
    console.log("  ✓ All solved statuses are backed by verifiable submission records.");
  } else {
    console.log(`  ⚠️ Found ${findings.unbackedSolvedStatuses.length} solved statuses without matching submission records:`);
    findings.unbackedSolvedStatuses.slice(0, 10).forEach((s) => {
      console.log(`  - User ID: ${s.userId} -> Problem ID: ${s.problemId}`);
    });
    if (findings.unbackedSolvedStatuses.length > 10) {
      console.log(`    ... and ${findings.unbackedSolvedStatuses.length - 10} more`);
    }
  }

  console.log("\n=== 7. DUPLICATE LINKED HANDLES (ACCOUNT COLLISION) ===");
  if (findings.handleCollisions.length === 0) {
    console.log("  ✓ No duplicate LeetCode/GFG handles shared across multiple accounts.");
  } else {
    findings.handleCollisions.forEach((c) => {
      console.log(`  - Platform: ${c.platform} | Handle: '${c.handle}' is claimed by ${c.users.length} users:`);
      c.users.forEach((u) => console.log(`      * ${u.username} (${u.id})`));
    });
  }

  console.log("\n================================================================================");
  console.log("                             AUDIT COMPLETED                                    ");
  console.log("================================================================================\n");
}

analyze().catch((err) => {
  console.error("Audit analysis failed:", err);
  process.exit(1);
});
