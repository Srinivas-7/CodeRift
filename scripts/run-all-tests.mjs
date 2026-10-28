/**
 * scripts/run-all-tests.mjs
 * Unified test runner executing all security hardening and core logic test suites.
 */

import { execSync } from "child_process";

const testSuites = [
  { name: "Step 1: Auth & Login Security (SEC-01)", script: "scripts/test-login-security.mjs" },
  { name: "Step 2: Concurrency & Scoring Idempotency (SEC-07)", script: "scripts/test-concurrency-scoring.mjs" },
  { name: "Step 3: Zod Input Validation (SEC-09)", script: "scripts/test-input-validation.mjs" },
  { name: "Step 4: Verification Integrity (SEC-05 + SEC-06)", script: "scripts/test-verification-integrity.mjs" },
  { name: "Step 5: Rate Limiting & Anti-Enumeration (SEC-08 + SEC-11)", script: "scripts/test-rate-limiting.mjs" },
  { name: "Step 6: Headers & Sessions (SEC-10 + SEC-12)", script: "scripts/test-headers-sessions.mjs" },
  { name: "Step 7: Streaks & Shields Mechanics", script: "scripts/test-streaks-shields.mjs" },
  { name: "Step 7: Squad Authorization & Permissions", script: "scripts/test-squad-authz.mjs" },
];

console.log("===============================================================");
console.log("             CODERIFT SECURITY & REGRESSION TEST RUNNER         ");
console.log("===============================================================\n");

let allPassed = true;
let totalPassedCount = 0;

for (const suite of testSuites) {
  console.log(`\n▶ Running: ${suite.name} (${suite.script})`);
  try {
    const output = execSync(`node ${suite.script}`, { encoding: "utf-8", stdio: "pipe" });
    console.log(output);
    totalPassedCount++;
  } catch (err) {
    console.error(`❌ FAILED: ${suite.name}`);
    console.error(err.stdout || err.message);
    allPassed = false;
  }
}

console.log("\n===============================================================");
if (allPassed) {
  console.log(`🎉 ALL ${totalPassedCount}/${testSuites.length} TEST SUITES PASSED SUCCESSFULLY!`);
  console.log("===============================================================\n");
  process.exit(0);
} else {
  console.error(`💥 SOME TEST SUITES FAILED!`);
  console.log("===============================================================\n");
  process.exit(1);
}
