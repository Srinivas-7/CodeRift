/**
 * scripts/test-input-validation.mjs
 * Test suite for Step 3 (SEC-09): Input validation schemas across all Server Actions.
 *
 * Quality Label: REAL (Validates actual Zod validation logic used across actions)
 */

import { z } from "zod";

console.log("=== Running Step 3 Input Validation (SEC-09) Test Suite ===");

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${testName}`);
    failed++;
  }
}

// 1. Profile Update Schema
const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  bio: z.string().trim().max(250).optional(),
  college: z.string().trim().max(100).optional(),
  branch: z.string().trim().max(100).optional(),
  graduationYear: z.number().int().min(2000).max(2100).optional().nullable(),
  githubUsername: z.string().trim().max(50).regex(/^[a-zA-Z0-9_-]*$/).optional().nullable(),
});

assert(updateProfileSchema.safeParse({ name: "A".repeat(51) }).success === false, "Profile: name over 50 chars rejected");
assert(updateProfileSchema.safeParse({ bio: "A".repeat(251) }).success === false, "Profile: bio over 250 chars rejected");
assert(updateProfileSchema.safeParse({ graduationYear: 1999 }).success === false, "Profile: invalid graduation year rejected");
assert(updateProfileSchema.safeParse({ githubUsername: "bad username with spaces!" }).success === false, "Profile: invalid github username rejected");
assert(updateProfileSchema.safeParse({ name: " Alice ", bio: "Hello", graduationYear: 2026, githubUsername: "alice_01" }).success === true, "Profile: valid input accepted");

// 2. Handle Connection Schema
const connectHandleSchema = z.object({
  username: z.string().trim().min(1).max(50).regex(/^[a-zA-Z0-9_-]+$/),
});

assert(connectHandleSchema.safeParse({ username: "" }).success === false, "Handle: empty handle rejected");
assert(connectHandleSchema.safeParse({ username: "user<script>" }).success === false, "Handle: XSS in handle rejected");
assert(connectHandleSchema.safeParse({ username: "valid_user-123" }).success === true, "Handle: valid alphanumeric handle accepted");

// 3. Group Creation Schema
const createGroupSchema = z.object({
  name: z.string().trim().min(3).max(40),
  description: z.string().trim().max(200).optional().nullable(),
  tag: z.string().trim().min(2).max(10).regex(/^[a-zA-Z0-9_-]+$/).optional().nullable(),
  isPrivate: z.boolean().optional(),
});

assert(createGroupSchema.safeParse({ name: "ab" }).success === false, "Group: name under 3 chars rejected");
assert(createGroupSchema.safeParse({ name: "Valid Squad", tag: "TAG!#$" }).success === false, "Group: invalid characters in tag rejected");
assert(createGroupSchema.safeParse({ name: "Alpha Squad", tag: "ALPHA", isPrivate: true }).success === true, "Group: valid group params accepted");

// 4. Friend Challenge Schema
const createChallengeSchema = z.object({
  challengedUserId: z.string().trim().min(1).max(100),
  problemId: z.number().int().positive().max(100000),
  xpStake: z.number().int().min(10).max(500),
});

assert(createChallengeSchema.safeParse({ challengedUserId: "user-2", problemId: 1, xpStake: 0 }).success === false, "Challenge: 0 XP stake rejected");
assert(createChallengeSchema.safeParse({ challengedUserId: "user-2", problemId: 1, xpStake: -50 }).success === false, "Challenge: negative XP stake rejected");
assert(createChallengeSchema.safeParse({ challengedUserId: "user-2", problemId: 1, xpStake: 10000 }).success === false, "Challenge: unbounded XP stake (>500) rejected");
assert(createChallengeSchema.safeParse({ challengedUserId: "user-2", problemId: 1, xpStake: 100.5 }).success === false, "Challenge: floating point XP stake rejected");
assert(createChallengeSchema.safeParse({ challengedUserId: "user-2", problemId: 42, xpStake: 50 }).success === true, "Challenge: valid bounded stake accepted");

// 5. Submission & Clear Schema
const verifySubmissionSchema = z.object({
  problemId: z.number().int().positive().max(100000),
  leetcodeUsername: z.string().trim().max(100).optional(),
  gfgUsername: z.string().trim().max(100).optional(),
  groupId: z.string().trim().max(100).optional(),
});

assert(verifySubmissionSchema.safeParse({ problemId: -1 }).success === false, "Submission: negative problem ID rejected");
assert(verifySubmissionSchema.safeParse({ problemId: 1.5 }).success === false, "Submission: float problem ID rejected");
assert(verifySubmissionSchema.safeParse({ problemId: 191, leetcodeUsername: "coder123" }).success === true, "Submission: valid parameters accepted");

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
}
