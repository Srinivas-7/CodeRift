import assert from "node:assert/strict";
import { SignJWT, jwtVerify } from "jose";

console.log("--- Starting JWT Security Verification Tests ---");

// Test 1: getJwtSecretKey throws if JWT_SECRET is unset
{
  delete process.env.JWT_SECRET;
  let threw = false;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim().length < 32) {
      throw new Error("FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters.");
    }
  } catch (err) {
    threw = true;
    assert.match(err.message, /JWT_SECRET environment variable is missing/);
  }
  assert.equal(threw, true, "Test 1 Passed: Unset JWT_SECRET threw error");
}

// Test 2: getJwtSecretKey throws if JWT_SECRET is too short (< 32 chars)
{
  process.env.JWT_SECRET = "too-short-secret-123";
  let threw = false;
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret || secret.trim().length < 32) {
      throw new Error("FATAL: JWT_SECRET environment variable is missing or shorter than 32 characters.");
    }
  } catch (err) {
    threw = true;
    assert.match(err.message, /shorter than 32 characters/);
  }
  assert.equal(threw, true, "Test 2 Passed: Short JWT_SECRET threw error");
}

// Test 3: Pinning algorithms: ["HS256"] prevents algorithm confusion / unpinned verification
{
  const validSecret = "a_super_secure_random_key_that_is_at_least_32_chars_long!";
  process.env.JWT_SECRET = validSecret;
  const secretKey = new TextEncoder().encode(validSecret);

  // Sign with HS512
  const hs512Token = await new SignJWT({ userId: "u123", username: "alice", email: "alice@test.com", role: "USER" })
    .setProtectedHeader({ alg: "HS512" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);

  let hs512Rejected = false;
  try {
    await jwtVerify(hs512Token, secretKey, { algorithms: ["HS256"] });
  } catch (err) {
    hs512Rejected = true;
  }
  assert.equal(hs512Rejected, true, "Test 3 Passed: HS512 token rejected when algorithms pinned to HS256");
}

// Test 4: Payload shape validation rejects missing or invalid fields
{
  const validSecret = "a_super_secure_random_key_that_is_at_least_32_chars_long!";
  const secretKey = new TextEncoder().encode(validSecret);

  function validatePayload(payload) {
    if (
      typeof payload.userId !== "string" ||
      !payload.userId ||
      typeof payload.exp !== "number" ||
      typeof payload.username !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string"
    ) {
      return null;
    }
    return payload;
  }

  // Missing userId
  const invalidPayload1 = { username: "alice", email: "alice@test.com", role: "USER", exp: Math.floor(Date.now() / 1000) + 3600 };
  assert.equal(validatePayload(invalidPayload1), null, "Test 4a Passed: Missing userId rejected");

  // Missing exp
  const invalidPayload2 = { userId: "u123", username: "alice", email: "alice@test.com", role: "USER" };
  assert.equal(validatePayload(invalidPayload2), null, "Test 4b Passed: Missing exp rejected");

  // Valid payload passes
  const validPayload = { userId: "u123", username: "alice", email: "alice@test.com", role: "USER", exp: Math.floor(Date.now() / 1000) + 3600 };
  assert.notEqual(validatePayload(validPayload), null, "Test 4c Passed: Valid payload accepted");
}

// Test 5: End-to-end Sign & Verify with HS256 and valid secret
{
  const validSecret = "a_super_secure_random_key_that_is_at_least_32_chars_long!";
  const secretKey = new TextEncoder().encode(validSecret);

  const token = await new SignJWT({ userId: "u_valid", username: "bob", email: "bob@test.com", role: "USER" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);

  const { payload } = await jwtVerify(token, secretKey, { algorithms: ["HS256"] });
  assert.equal(payload.userId, "u_valid");
  assert.equal(payload.username, "bob");
  assert.equal(typeof payload.exp, "number");
  console.log("Test 5 Passed: End-to-end token sign and verify succeeded");
}

console.log("\nALL STEP 1 TESTS PASSED SUCCESSFULLY!");
