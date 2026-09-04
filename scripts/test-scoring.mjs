/**
 * Verification Test Suite for CodeRift New Scoring System
 */

import { getProblemScore, DAILY_COMPLETION_BONUS, calculateScoreGain, compareLeaderboardRank } from "../src/lib/scoring.ts";
import { SDE_SHEET_PROBLEMS } from "../src/data/sdeSheetProblems.ts";

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("\n=========================================");
console.log("RUNNING CODERIFT SCORING TEST SUITE");
console.log("=========================================\n");

// 1. Test Problem Completion Points (Easy = 10, Medium = 20, Hard = 30)
assert(getProblemScore("Easy") === 10, "Easy problem awards exactly 10 points");
assert(getProblemScore("Medium") === 20, "Medium problem awards exactly 20 points");
assert(getProblemScore("Hard") === 30, "Hard problem awards exactly 30 points");
assert(getProblemScore("easy") === 10, "Case-insensitive 'easy' awards 10 points");
assert(getProblemScore("HARD") === 30, "Case-insensitive 'HARD' awards 30 points");

// 2. Test SDE Sheet Dataset Problems difficulty mapping
const easyProb = SDE_SHEET_PROBLEMS.find(p => p.difficulty === "Easy");
const medProb = SDE_SHEET_PROBLEMS.find(p => p.difficulty === "Medium");
const hardProb = SDE_SHEET_PROBLEMS.find(p => p.difficulty === "Hard");

assert(easyProb && getProblemScore(easyProb.difficulty) === 10, `SDE Easy Problem '${easyProb?.title}' gets 10 points`);
assert(medProb && getProblemScore(medProb.difficulty) === 20, `SDE Medium Problem '${medProb?.title}' gets 20 points`);
assert(hardProb && getProblemScore(hardProb.difficulty) === 30, `SDE Hard Problem '${hardProb?.title}' gets 30 points`);

// 3. Test First Solve vs Duplicate / Re-solve (Idempotency)
const firstSolveEasy = calculateScoreGain({ difficulty: "Easy", isFirstSolve: true });
assert(firstSolveEasy.problemPoints === 10 && firstSolveEasy.totalPoints === 10, "First solve of Easy problem gives +10 points");

const duplicateSolveEasy = calculateScoreGain({ difficulty: "Easy", isFirstSolve: false });
assert(duplicateSolveEasy.problemPoints === 0 && duplicateSolveEasy.totalPoints === 0, "Duplicate solve of Easy problem gives 0 points (Idempotent)");

const duplicateSolveHard = calculateScoreGain({ difficulty: "Hard", isFirstSolve: false });
assert(duplicateSolveHard.problemPoints === 0 && duplicateSolveHard.totalPoints === 0, "Duplicate solve of Hard problem gives 0 points (Idempotent)");

// 4. Test Daily Completion Bonus (+20 for all daily problems)
// Case A: 1 of 3 solved -> no bonus
const daily1of3 = calculateScoreGain({ difficulty: "Medium", isFirstSolve: true, isDailyBatchComplete: false });
assert(daily1of3.dailyBonusPoints === 0 && daily1of3.totalPoints === 20, "Daily 1/3 solved: gives normal problem points (20), 0 daily bonus");

// Case B: 2 of 3 solved -> no bonus
const daily2of3 = calculateScoreGain({ difficulty: "Medium", isFirstSolve: true, isDailyBatchComplete: false });
assert(daily2of3.dailyBonusPoints === 0 && daily2of3.totalPoints === 20, "Daily 2/3 solved: gives normal problem points (20), 0 daily bonus");

// Case C: 3 of 3 solved (Batch complete) -> awards +20 bonus
const daily3of3 = calculateScoreGain({ difficulty: "Hard", isFirstSolve: true, isDailyBatchComplete: true, isDailyBonusAlreadyAwarded: false });
assert(daily3of3.problemPoints === 30 && daily3of3.dailyBonusPoints === 20 && daily3of3.totalPoints === 50, "Daily 3/3 complete: gives 30 problem points + 20 daily bonus = 50 total");

// Case D: Re-triggering daily completion when bonus was already awarded -> no duplicate bonus
const dailyDuplicateBonus = calculateScoreGain({ difficulty: "Hard", isFirstSolve: false, isDailyBatchComplete: true, isDailyBonusAlreadyAwarded: true });
assert(dailyDuplicateBonus.dailyBonusPoints === 0 && dailyDuplicateBonus.totalPoints === 0, "Daily duplicate completion: 0 bonus and 0 points awarded");

// 5. Test Day 64 final batch (190-191: 2 problems)
const day64Problems = SDE_SHEET_PROBLEMS.filter(p => p.orderInSheet === 190 || p.orderInSheet === 191);
assert(day64Problems.length === 2, "Day 64 batch has exactly 2 problems (190 and 191) with no invented 3rd problem");

const day64BatchComplete = calculateScoreGain({ difficulty: day64Problems[1].difficulty, isFirstSolve: true, isDailyBatchComplete: true, isDailyBonusAlreadyAwarded: false });
assert(day64BatchComplete.dailyBonusPoints === 20, "Day 64 completion (2/2 available problems) awards full +20 daily bonus");

// 6. Test Leaderboard 3-tier Ranking (Score DESC > Solved DESC > Username ASC)
const users = [
  { username: "charlie", score: 100, totalSolved: 5 },
  { username: "alice", score: 200, totalSolved: 8 },
  { username: "bob", score: 200, totalSolved: 10 },
  { username: "dave", score: 200, totalSolved: 8 },
  { username: "eve", score: 50, totalSolved: 2 },
];

const sorted = [...users].sort(compareLeaderboardRank);

assert(sorted[0].username === "bob", "Rank 1: bob (Score 200, Solved 10)");
assert(sorted[1].username === "alice", "Rank 2: alice (Score 200, Solved 8, alphabetical before dave)");
assert(sorted[2].username === "dave", "Rank 3: dave (Score 200, Solved 8, alphabetical after alice)");
assert(sorted[3].username === "charlie", "Rank 4: charlie (Score 100, Solved 5)");
assert(sorted[4].username === "eve", "Rank 5: eve (Score 50, Solved 2)");

// 7. Test Backward Compatibility: Users with xp field fallback to score
const legacyUsers = [
  { username: "legacyUser", xp: 150, totalSolved: 6 },
  { username: "newScoreUser", score: 180, totalSolved: 7 },
];
const legacySorted = [...legacyUsers].sort(compareLeaderboardRank);
assert(legacySorted[0].username === "newScoreUser" && legacySorted[1].username === "legacyUser", "Legacy user with xp field compares accurately with score field");

console.log("\n=========================================");
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log("=========================================\n");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
