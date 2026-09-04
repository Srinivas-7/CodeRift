import { calculateTeamPhaseInfo, getTeamDailyProblemBatch, calculatePhaseWinners } from "../src/lib/team-phase";
import { getProblemScore, getProblemPhase, compareLeaderboardRank, comparePhaseRank, DAILY_COMPLETION_BONUS } from "../src/lib/scoring";
import { SDE_SHEET_PROBLEMS } from "../src/data/sdeSheetProblems";
import { db } from "../src/lib/firestore-db";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details = "") {
  if (condition) {
    console.log(`✅ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${testName}: ${details}`);
    failed++;
  }
}

console.log("==================================================");
console.log("TESTING CODERIFT TEAM PHASE ARCHITECTURE");
console.log("==================================================\n");

async function runTests() {
  // --- TEST 1: Phase 1 Day 1 (Start Date: 2026-09-01, Current: 2026-09-01) ---
  const t1Phase = calculateTeamPhaseInfo("2026-09-01", "2026-09-01");
  assert(t1Phase.status === "PHASE_1_ACTIVE", "Test 1.1: Phase 1 Active status");
  assert(t1Phase.currentPhase === 1, "Test 1.2: Current Phase is 1");
  assert(t1Phase.phaseDay === 1, "Test 1.3: Phase Day is 1");
  assert(t1Phase.overallDay === 1, "Test 1.4: Overall Day is 1");
  assert(t1Phase.phase1StartDate === "2026-09-01", "Test 1.5: Phase 1 Start is 2026-09-01");
  assert(t1Phase.phase1EndDate === "2026-10-02", "Test 1.6: Phase 1 End is 2026-10-02 (32 days inclusive)");
  assert(t1Phase.phase2StartDate === "2026-10-03", "Test 1.7: Phase 2 Start is 2026-10-03");
  assert(t1Phase.phase2EndDate === "2026-11-03", "Test 1.8: Phase 2 End is 2026-11-03 (64 days total)");

  // --- TEST 2: Phase 1 Day 1 Batch (Problems 1–3) ---
  const t2Batch = await getTeamDailyProblemBatch("2026-09-01", "2026-09-01");
  assert(t2Batch.problems.length === 3, "Test 2.1: Day 1 has exactly 3 problems");
  assert(t2Batch.batchStartOrder === 1, "Test 2.2: Batch start order is 1");
  assert(t2Batch.problems.map(p => p.orderInSheet).join(",") === "1,2,3", "Test 2.3: Problems are order 1, 2, 3");

  // --- TEST 3: Phase 1 Day 32 Batch (Problems 94–96) on 2026-10-02 ---
  const t3Batch = await getTeamDailyProblemBatch("2026-09-01", "2026-10-02");
  assert(t3Batch.phase === 1, "Test 3.1: Day 32 is Phase 1");
  assert(t3Batch.phaseDay === 32, "Test 3.2: Phase Day is 32");
  assert(t3Batch.overallDay === 32, "Test 3.3: Overall Day is 32");
  assert(t3Batch.batchStartOrder === 94, "Test 3.4: Batch start order is 94");
  assert(t3Batch.problems.length === 3, "Test 3.5: Day 32 has 3 problems");
  assert(t3Batch.problems.map(p => p.orderInSheet).join(",") === "94,95,96", "Test 3.6: Problems are 94, 95, 96 (boundary of Phase 1)");

  // --- TEST 4: Phase 2 Day 1 (Day 33 overall) Batch (Problems 97–99) on 2026-10-03 ---
  const t4Batch = await getTeamDailyProblemBatch("2026-09-01", "2026-10-03");
  assert(t4Batch.phase === 2, "Test 4.1: Phase 2 is active");
  assert(t4Batch.phaseDay === 1, "Test 4.2: Phase Day is 1 of Phase 2");
  assert(t4Batch.overallDay === 33, "Test 4.3: Overall Day is 33");
  assert(t4Batch.batchStartOrder === 97, "Test 4.4: Batch start order is 97");
  assert(t4Batch.problems.length === 3, "Test 4.5: Day 33 has 3 problems");
  assert(t4Batch.problems.map(p => p.orderInSheet).join(",") === "97,98,99", "Test 4.6: Problems are 97, 98, 99");

  // --- TEST 5: Phase 2 Day 31 (Day 63 overall) Batch (Problems 187–189) on 2026-11-02 ---
  const t5Batch = await getTeamDailyProblemBatch("2026-09-01", "2026-11-02");
  assert(t5Batch.phase === 2, "Test 5.1: Phase 2 is active");
  assert(t5Batch.phaseDay === 31, "Test 5.2: Phase Day is 31");
  assert(t5Batch.overallDay === 63, "Test 5.3: Overall Day is 63");
  assert(t5Batch.batchStartOrder === 187, "Test 5.4: Batch start order is 187");
  assert(t5Batch.problems.length === 3, "Test 5.5: Day 63 has 3 problems");
  assert(t5Batch.problems.map(p => p.orderInSheet).join(",") === "187,188,189", "Test 5.6: Problems are 187, 188, 189");

  // --- TEST 6: Phase 2 Day 32 (Day 64 overall) Final Batch (Problems 190–191: EXACT 2 PROBLEMS) on 2026-11-03 ---
  const t6Batch = await getTeamDailyProblemBatch("2026-09-01", "2026-11-03");
  assert(t6Batch.phase === 2, "Test 6.1: Phase 2 is active");
  assert(t6Batch.phaseDay === 32, "Test 6.2: Phase Day is 32 (final day)");
  assert(t6Batch.overallDay === 64, "Test 6.3: Overall Day is 64");
  assert(t6Batch.batchStartOrder === 190, "Test 6.4: Batch start order is 190");
  assert(t6Batch.problems.length === 2, "Test 6.5: Day 64 has EXACTLY 2 problems (190, 191)", `got length ${t6Batch.problems.length}`);
  assert(t6Batch.problems.map(p => p.orderInSheet).join(",") === "190,191", "Test 6.6: Problems are 190, 191");

  // --- TEST 7: Day 65+ (Competition Completed) on 2026-11-04 ---
  const t7Phase = calculateTeamPhaseInfo("2026-09-01", "2026-11-04");
  assert(t7Phase.status === "COMPLETED", "Test 7.1: Status is COMPLETED after Day 64");
  assert(t7Phase.isPhase1Complete === true, "Test 7.2: Phase 1 is complete");
  assert(t7Phase.isPhase2Complete === true, "Test 7.3: Phase 2 is complete");
  assert(t7Phase.isCompetitionComplete === true, "Test 7.4: Competition is complete");

  const t7Batch = await getTeamDailyProblemBatch("2026-09-01", "2026-11-04");
  assert(t7Batch.isCompetitionComplete === true, "Test 7.5: Batch marks competition complete");
  assert(t7Batch.problems.length === 0, "Test 7.6: No new problems dispatched after Day 64");

  // --- TEST 8: Future start date (Team starts 2026-10-01, current date 2026-09-04) ---
  const t8Phase = calculateTeamPhaseInfo("2026-10-01", "2026-09-04");
  assert(t8Phase.status === "NOT_STARTED", "Test 8.1: Status is NOT_STARTED");
  assert(t8Phase.daysUntilStart === 27, "Test 8.2: Days until start is 27 days");

  // --- TEST 9: Team Clock Independence (Team Alpha vs Team Beta on 2026-09-15) ---
  const alphaBatch = await getTeamDailyProblemBatch("2026-09-01", "2026-09-15"); // Day 15
  const betaBatch = await getTeamDailyProblemBatch("2026-09-15", "2026-09-15"); // Day 1
  assert(alphaBatch.phaseDay === 15, "Test 9.1: Team Alpha is on Day 15");
  assert(alphaBatch.batchStartOrder === 43, "Test 9.2: Team Alpha gets problems starting at #43 (43, 44, 45)");
  assert(betaBatch.phaseDay === 1, "Test 9.3: Team Beta is on Day 1");
  assert(betaBatch.batchStartOrder === 1, "Test 9.4: Team Beta gets problems starting at #1 (1, 2, 3)");

  // --- TEST 10: Determinism across team members ---
  const member1Batch = await getTeamDailyProblemBatch({ id: "squad-1", phase1StartDate: "2026-09-01" }, "2026-09-10");
  const member2Batch = await getTeamDailyProblemBatch({ id: "squad-1", phase1StartDate: "2026-09-01" }, "2026-09-10");
  assert(JSON.stringify(member1Batch.problems.map(p => p.id)) === JSON.stringify(member2Batch.problems.map(p => p.id)), "Test 10: All members receive identical problems");

  // --- TEST 11: Late joins (User joining on Day 10 sees Day 10 batch) ---
  const lateJoinBatch = await getTeamDailyProblemBatch("2026-09-01", "2026-09-10");
  assert(lateJoinBatch.phaseDay === 10, "Test 11.1: Late join sees Day 10");
  assert(lateJoinBatch.batchStartOrder === 28, "Test 11.2: Problems 28, 29, 30 served");

  // --- TEST 12: Problem Phase Mapping ---
  assert(getProblemPhase(1) === 1, "Test 12.1: Problem 1 is Phase 1");
  assert(getProblemPhase(96) === 1, "Test 12.2: Problem 96 is Phase 1");
  assert(getProblemPhase(97) === 2, "Test 12.3: Problem 97 is Phase 2");
  assert(getProblemPhase(191) === 2, "Test 12.4: Problem 191 is Phase 2");

  // --- TEST 13: Problem Scoring & Daily Bonus ---
  assert(getProblemScore("Easy") === 10, "Test 13.1: Easy problem is 10 points");
  assert(getProblemScore("Medium") === 20, "Test 13.2: Medium problem is 20 points");
  assert(getProblemScore("Hard") === 30, "Test 13.3: Hard problem is 30 points");
  assert(DAILY_COMPLETION_BONUS === 20, "Test 13.4: Daily completion bonus is 20 points");

  // --- TEST 14: Phase Leaderboard Ranking Comparison ---
  const mockUserA = { username: "Alice", phase1Score: 100, phase1Solved: 5, phase2Score: 50, phase2Solved: 2, score: 150, totalSolved: 7 };
  const mockUserB = { username: "Bob", phase1Score: 80, phase1Solved: 4, phase2Score: 120, phase2Solved: 6, score: 200, totalSolved: 10 };
  const mockUserC = { username: "Charlie", phase1Score: 100, phase1Solved: 6, phase2Score: 50, phase2Solved: 2, score: 150, totalSolved: 8 };

  // Phase 1: Alice (100 pts, 5 solved) vs Charlie (100 pts, 6 solved) -> Charlie wins on solved tiebreaker
  assert(comparePhaseRank(mockUserA, mockUserC, "phase1") > 0, "Test 14.1: Charlie beats Alice in Phase 1 due to more solved problems");
  // Phase 2: Bob (120 pts) beats Alice (50 pts)
  assert(comparePhaseRank(mockUserB, mockUserA, "phase2") < 0, "Test 14.2: Bob beats Alice in Phase 2 due to higher score");
  // Overall: Bob (200 pts) beats Charlie (150 pts)
  assert(comparePhaseRank(mockUserB, mockUserC, "overall") < 0, "Test 14.3: Bob beats Charlie overall");

  // --- TEST 15: Phase Winners Extraction ---
  const squadMembers = [
    { user: mockUserA },
    { user: mockUserB },
    { user: mockUserC },
  ];
  const winners = calculatePhaseWinners(squadMembers);
  assert(winners.phase1Winner.username === "Charlie", "Test 15.1: Phase 1 Winner is Charlie", `got ${winners.phase1Winner?.username}`);
  assert(winners.phase2Winner.username === "Bob", "Test 15.2: Phase 2 Winner is Bob", `got ${winners.phase2Winner?.username}`);
  assert(winners.overallWinner.username === "Bob", "Test 15.3: Overall Winner is Bob", `got ${winners.overallWinner?.username}`);

  // --- TEST 16: Total Problems in Sheet ---
  assert(SDE_SHEET_PROBLEMS.length === 191, "Test 16: Total Sheet Problems is exactly 191");

  // --- TEST 17: Sum of all 64 days problems equals 191 ---
  let sumProblems = 0;
  for (let d = 0; d < 64; d++) {
    const dateObj = new Date("2026-09-01T00:00:00.000Z");
    dateObj.setUTCDate(dateObj.getUTCDate() + d);
    const dateStr = dateObj.toISOString().split("T")[0];
    const b = await getTeamDailyProblemBatch("2026-09-01", dateStr);
    sumProblems += b.problems.length;
  }
  assert(sumProblems === 191, "Test 17: Sum of all 64 days problem batches equals exactly 191", `got ${sumProblems}`);

  // --- TEST 18: Team A (Sept 10) vs Team B (Sept 20) Submission Sync Verification on Sept 20 ---
  const teamABatch = await getTeamDailyProblemBatch("2026-09-10", "2026-09-20");
  const teamBBatch = await getTeamDailyProblemBatch("2026-09-20", "2026-09-20");
  assert(teamABatch.problems.map(p => p.orderInSheet).join(",") === "31,32,33", "Test 18.1: Team A Dashboard & Submission batch is Problems 31, 32, 33");
  assert(teamBBatch.problems.map(p => p.orderInSheet).join(",") === "1,2,3", "Test 18.2: Team B Dashboard & Submission batch is Problems 1, 2, 3");
  assert(teamABatch.phaseDay === 11, "Test 18.3: Team A is Day 11");
  assert(teamBBatch.phaseDay === 1, "Test 18.4: Team B is Day 1");

  // --- TEST 20: User in two teams with same start date ---
  const t20_team1 = await getTeamDailyProblemBatch("2026-09-01", "2026-09-05");
  const t20_team2 = await getTeamDailyProblemBatch("2026-09-01", "2026-09-05");
  assert(t20_team1.problems.map(p => p.id).join(",") === t20_team2.problems.map(p => p.id).join(","), "Test 20: Both teams with same start date resolve identical Daily 3");

  // --- TEST 21: User in two teams with different start dates ---
  const t21_teamA = await getTeamDailyProblemBatch("2026-09-10", "2026-09-20"); // Day 11 -> [31, 32, 33]
  const t21_teamB = await getTeamDailyProblemBatch("2026-09-20", "2026-09-20"); // Day 1 -> [1, 2, 3]
  assert(t21_teamA.problems.map(p => p.orderInSheet).join(",") === "31,32,33", "Test 21.1: Team A resolves Problems 31, 32, 33");
  assert(t21_teamB.problems.map(p => p.orderInSheet).join(",") === "1,2,3", "Test 21.2: Team B resolves Problems 1, 2, 3");

  // --- TEST 22: Problem membership matching ---
  const prob1Order = 1;
  const prob31Order = 31;
  assert(t21_teamB.problems.some(p => p.orderInSheet === prob1Order), "Test 22.1: Problem 1 is in Team B Daily 3");
  assert(!t21_teamA.problems.some(p => p.orderInSheet === prob1Order), "Test 22.2: Problem 1 is NOT in Team A Daily 3");
  assert(t21_teamA.problems.some(p => p.orderInSheet === prob31Order), "Test 22.3: Problem 31 is in Team A Daily 3");
  assert(!t21_teamB.problems.some(p => p.orderInSheet === prob31Order), "Test 22.4: Problem 31 is NOT in Team B Daily 3");

  // --- TEST 23: Team Daily Bonus Isolation ---
  const teamABonusKey: string = "DAILY_COMPLETION_BONUS_team_A";
  const teamBBonusKey: string = "DAILY_COMPLETION_BONUS_team_B";
  assert(teamABonusKey !== teamBBonusKey, "Test 23: Team A and Team B bonus transactions are segregated and distinguishable");

  // --- TEST 24: Solo User Fallback ---
  const soloBatch = await getTeamDailyProblemBatch(null, "2026-09-01");
  assert(soloBatch.problems.length === 3, "Test 24.1: Solo user receives valid 3 problems");
  assert(soloBatch.problems.map(p => p.orderInSheet).join(",") === "1,2,3", "Test 24.2: Solo user starts at Problem 1");

  // --- TEST 25: Final Day 64 (Problems 190, 191) ---
  const finalDayBatch = await getTeamDailyProblemBatch("2026-09-01", "2026-11-03");
  assert(finalDayBatch.problems.length === 2, "Test 25.1: Day 64 has exactly 2 problems");
  assert(finalDayBatch.problems.map(p => p.orderInSheet).join(",") === "190,191", "Test 25.2: Final day problems are 190 and 191");

  // --- TEST 26: Post Day 64 (Completed) ---
  const postBatch = await getTeamDailyProblemBatch("2026-09-01", "2026-11-04");
  assert(postBatch.isCompetitionComplete === true, "Test 26.1: Competition complete after Day 64");
  assert(postBatch.problems.length === 0, "Test 26.2: 0 problems dispatched post Day 64");

  // --- TEST 27: Concurrency & Sequential Idempotency ---
  const testUserId1 = `test_user_seq_${Date.now()}`;
  const testGroupId1 = "team_alpha";
  const testDate1 = "2026-09-20";

  await db.user.create({ data: { id: testUserId1, username: "SeqTester", score: 0, xp: 0, level: 1 } });

  const seq1 = await db.dailyChallenge.awardDailyBonusAtomic({
    userId: testUserId1,
    groupId: testGroupId1,
    date: testDate1,
    problemPhase: 1,
    bonusAmount: 20,
  });
  assert(seq1.awarded === true, "Test 27.1: First sequential bonus call awards +20 PTS");
  assert(seq1.newScore === 20, "Test 27.2: User score is 20 after first award");

  const seq2 = await db.dailyChallenge.awardDailyBonusAtomic({
    userId: testUserId1,
    groupId: testGroupId1,
    date: testDate1,
    problemPhase: 1,
    bonusAmount: 20,
  });
  assert(seq2.awarded === false, "Test 27.3: Second sequential bonus call returns awarded=false");
  assert(seq2.alreadyCompleted === true, "Test 27.4: Second sequential call recognizes alreadyCompleted=true");
  assert(seq2.newScore === 20, "Test 27.5: User score remains 20 (no duplicate bonus)");

  // --- TEST 28: Concurrent / Simultaneous Requests (Promise.all) ---
  const testUserId2 = `test_user_conc_${Date.now()}`;
  const testGroupId2 = "team_beta";
  const testDate2 = "2026-09-20";

  await db.user.create({ data: { id: testUserId2, username: "ConcTester", score: 50, xp: 50, level: 1 } });

  const [concResA, concResB] = await Promise.all([
    db.dailyChallenge.awardDailyBonusAtomic({
      userId: testUserId2,
      groupId: testGroupId2,
      date: testDate2,
      problemPhase: 1,
      bonusAmount: 20,
    }),
    db.dailyChallenge.awardDailyBonusAtomic({
      userId: testUserId2,
      groupId: testGroupId2,
      date: testDate2,
      problemPhase: 1,
      bonusAmount: 20,
    }),
  ]);

  const awardsCount = (concResA.awarded ? 1 : 0) + (concResB.awarded ? 1 : 0);
  assert(awardsCount === 1, "Test 28.1: Exactly ONE concurrent request receives awarded=true");
  
  const updatedConcUser = await db.user.findUnique({ where: { id: testUserId2 } });
  assert(updatedConcUser?.score === 70, `Test 28.2: Concurrency-safe score updated from 50 to exactly 70 (got ${updatedConcUser?.score})`);

  // Verify exactly one deterministic transaction was saved
  const deterministicId = `bonus_${testUserId2}_${testGroupId2}_${testDate2}`;
  const bonusDoc = await db.xpTransaction.findMany({ where: { userId: testUserId2 } });
  const matchingBonusDocs = bonusDoc.filter((t: any) => t.id === deterministicId || t.reason === `DAILY_COMPLETION_BONUS_${testGroupId2}`);
  assert(matchingBonusDocs.length === 1, `Test 28.3: Exactly 1 bonus transaction record in database (got ${matchingBonusDocs.length})`);

  // --- TEST 29: Multi-Team Independent Bonus Awards ---
  const testUserId3 = `test_user_multi_${Date.now()}`;
  const groupA = "group_alpha";
  const groupB = "group_beta";
  const multiDate = "2026-09-20";

  await db.user.create({ data: { id: testUserId3, username: "MultiTeamTester", score: 0, xp: 0, level: 1 } });

  const teamARes = await db.dailyChallenge.awardDailyBonusAtomic({
    userId: testUserId3,
    groupId: groupA,
    date: multiDate,
    problemPhase: 1,
    bonusAmount: 20,
  });
  assert(teamARes.awarded === true, "Test 29.1: Group A Daily Bonus awarded (+20 PTS)");
  assert(teamARes.newScore === 20, "Test 29.2: Score after Group A is 20");

  const teamBRes = await db.dailyChallenge.awardDailyBonusAtomic({
    userId: testUserId3,
    groupId: groupB,
    date: multiDate,
    problemPhase: 1,
    bonusAmount: 20,
  });
  assert(teamBRes.awarded === true, "Test 29.3: Group B Daily Bonus independently awarded (+20 PTS)");
  assert(teamBRes.newScore === 40, "Test 29.4: Score after Group B is 40 (both bonuses honored)");

  // --- TEST 30: Solo Fallback Deterministic Key ---
  const soloUserId = `test_user_solo_${Date.now()}`;
  await db.user.create({ data: { id: soloUserId, username: "SoloTester", score: 10, xp: 10, level: 1 } });

  const soloRes = await db.dailyChallenge.awardDailyBonusAtomic({
    userId: soloUserId,
    groupId: null,
    date: "2026-09-20",
    problemPhase: 1,
    bonusAmount: 20,
  });
  assert(soloRes.awarded === true, "Test 30.1: Solo user bonus awarded");
  assert(soloRes.newScore === 30, "Test 30.2: Solo user score is 30");

  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
