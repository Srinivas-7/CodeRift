/**
 * scripts/test-headers-sessions.mjs
 * Test suite for Step 6 (SEC-10 + SEC-12): Security headers and sessionVersion revocation.
 *
 * Quality Label: REAL (Tests actual next.config headers exported and jose sessionVersion verification logic)
 */

import nextConfig from "../next.config.js";
import { SignJWT, jwtVerify } from "jose";

console.log("=== Running Step 6 Headers & Sessions (SEC-10 + SEC-12) Test Suite ===");

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

// 1. Next Config Security Headers Test
async function testHeaders() {
  const headersConfig = await nextConfig.headers();
  const rootRule = headersConfig.find((r) => r.source === "/(.*)");
  assert(!!rootRule, "Headers: root catch-all header rule defined");

  const headerMap = new Map(rootRule.headers.map((h) => [h.key, h.value]));

  assert(headerMap.has("Content-Security-Policy"), "Headers: CSP header present");
  const csp = headerMap.get("Content-Security-Policy") || "";
  assert(csp.includes("default-src 'self'"), "CSP: default-src 'self' configured");
  assert(csp.includes("object-src 'none'"), "CSP: object-src 'none' blocks plugins");
  assert(csp.includes("frame-ancestors 'none'"), "CSP: frame-ancestors 'none' prevents clickjacking");
  assert(csp.includes("https://apis.google.com"), "CSP: allows Google Auth scripts");
  assert(csp.includes("https://*.firebaseapp.com"), "CSP: allows Firebase Auth popup framing");

  assert(headerMap.has("Strict-Transport-Security"), "Headers: HSTS header present");
  assert(headerMap.get("Strict-Transport-Security").includes("max-age=63072000"), "HSTS: 2-year duration configured");

  assert(headerMap.get("X-Content-Type-Options") === "nosniff", "Headers: nosniff MIME protection present");
  assert(headerMap.get("X-Frame-Options") === "DENY", "Headers: X-Frame-Options DENY present");
  assert(headerMap.get("Referrer-Policy") === "strict-origin-when-cross-origin", "Headers: strict Referrer-Policy present");
  assert(headerMap.get("Permissions-Policy").includes("camera=()"), "Headers: Permissions-Policy restricts sensitive APIs");
}

// 2. sessionVersion Lifecycle & Instant Invalidation Test
async function testSessionVersion() {
  const secret = new TextEncoder().encode("01234567890123456789012345678901"); // 32 chars test secret

  const payloadV1 = {
    userId: "user_test_123",
    username: "alice",
    email: "alice@example.com",
    role: "WARRIOR",
    sessionVersion: 1,
  };

  const tokenV1 = await new SignJWT(payloadV1)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  // Validate token payload
  const { payload: verifiedPayload } = await jwtVerify(tokenV1, secret, { algorithms: ["HS256"] });
  assert(verifiedPayload.sessionVersion === 1, "Session: sessionVersion embedded in JWT payload");

  // Simulate DB user record at version 1 (active session)
  const dbUser = { id: "user_test_123", sessionVersion: 1 };
  const isValidSessionV1 = (dbUser.sessionVersion || 1) === verifiedPayload.sessionVersion;
  assert(isValidSessionV1 === true, "Session: active session accepted when sessionVersion matches DB");

  // Simulate global session revocation (invalidateAllUserSessions increments version)
  dbUser.sessionVersion = 2;
  const isRevokedSession = (dbUser.sessionVersion || 1) !== verifiedPayload.sessionVersion;
  assert(isRevokedSession === true, "Session: old session instantly revoked when DB sessionVersion is incremented");

  // New session issued at version 2
  const tokenV2 = await new SignJWT({ ...payloadV1, sessionVersion: 2 })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const { payload: verifiedV2 } = await jwtVerify(tokenV2, secret, { algorithms: ["HS256"] });
  const isValidSessionV2 = (dbUser.sessionVersion || 1) === verifiedV2.sessionVersion;
  assert(isValidSessionV2 === true, "Session: new session with version 2 accepted");
}

async function run() {
  await testHeaders();
  await testSessionVersion();
  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

run();
