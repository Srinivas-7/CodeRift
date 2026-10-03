import assert from "node:assert/strict";

console.log("--- Starting SEC-01 Login Security & Account Takeover Prevention Tests ---");

// Test harness simulating token verification and secure account resolution
function createMockAuthService() {
  const users = new Map();
  const validTokens = new Map();

  function issueMockToken(claims) {
    const tokenId = `tok_${claims.uid}_${Date.now()}_${Math.random()}`;
    validTokens.set(tokenId, {
      ...claims,
      exp: claims.exp || Math.floor(Date.now() / 1000) + 3600,
    });
    return tokenId;
  }

  async function verifyIdToken(idToken) {
    if (!validTokens.has(idToken)) {
      throw new Error("Decoding Firebase ID token failed. Invalid token.");
    }
    const decoded = validTokens.get(idToken);
    if (decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Firebase ID token has expired.");
    }
    return decoded;
  }

  async function loginWithFirebaseAuth(input) {
    if (!input?.idToken || typeof input.idToken !== "string" || !input.idToken.trim()) {
      return { success: false, error: "Authentication token required." };
    }

    let decoded;
    try {
      decoded = await verifyIdToken(input.idToken.trim());
    } catch (err) {
      return { success: false, error: "Authentication failed. Invalid or expired session." };
    }

    if (decoded.email_verified !== true) {
      return {
        success: false,
        error: "Your email address is not verified. Please verify your email before signing in.",
      };
    }

    if (!decoded.email || typeof decoded.email !== "string" || !decoded.email.includes("@")) {
      return {
        success: false,
        error: "A verified email address is required to sign in to CodeRift.",
      };
    }
    const email = decoded.email.trim().toLowerCase();

    const ALLOWED = new Set(["google.com", "github.com", "password"]);
    if (decoded.firebase?.sign_in_provider && !ALLOWED.has(decoded.firebase.sign_in_provider)) {
      return { success: false, error: "Authentication provider is not supported." };
    }

    const uid = decoded.uid;
    let user = null;

    // Lookup by firebaseUid
    for (const u of users.values()) {
      if (u.firebaseUid === uid) {
        user = u;
        break;
      }
    }

    if (!user) {
      for (const u of users.values()) {
        if (u.email === email) {
          if (u.firebaseUid && u.firebaseUid !== uid) {
            return {
              success: false,
              error: "Authentication failed. Account configuration mismatch.",
            };
          }
          u.firebaseUid = uid;
          user = u;
          break;
        }
      }
    }

    if (!user) {
      const id = `u_${uid}`;
      user = {
        id,
        email,
        username: decoded.name || email.split("@")[0],
        firebaseUid: uid,
        role: "USER",
      };
      users.set(id, user);
    }

    return {
      success: true,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  return { users, issueMockToken, loginWithFirebaseAuth };
}

// Test 1: Forged / Invalid Token Rejected
{
  const auth = createMockAuthService();
  const res = await auth.loginWithFirebaseAuth({ idToken: "forged_malicious_token_123" });
  assert.equal(res.success, false);
  assert.match(res.error, /Invalid or expired/);
  console.log("Test 1 Passed: Forged/unknown ID token strictly rejected");
}

// Test 2: Expired Token Rejected
{
  const auth = createMockAuthService();
  const expiredToken = auth.issueMockToken({
    uid: "u_expired",
    email: "user@test.com",
    email_verified: true,
    exp: Math.floor(Date.now() / 1000) - 100, // expired 100s ago
  });
  const res = await auth.loginWithFirebaseAuth({ idToken: expiredToken });
  assert.equal(res.success, false);
  assert.match(res.error, /Invalid or expired/);
  console.log("Test 2 Passed: Expired token rejected");
}

// Test 3: Unverified Email Rejected
{
  const auth = createMockAuthService();
  const unverifiedToken = auth.issueMockToken({
    uid: "u_unverified",
    email: "attacker@fake.com",
    email_verified: false,
  });
  const res = await auth.loginWithFirebaseAuth({ idToken: unverifiedToken });
  assert.equal(res.success, false);
  assert.match(res.error, /email address is not verified/i);
  console.log("Test 3 Passed: Unverified email rejected");
}

// Test 4: Missing Email (e.g. GitHub private/unshared) Rejected
{
  const auth = createMockAuthService();
  const noEmailToken = auth.issueMockToken({
    uid: "gh_no_email",
    email: null,
    email_verified: true,
  });
  const res = await auth.loginWithFirebaseAuth({ idToken: noEmailToken });
  assert.equal(res.success, false);
  assert.match(res.error, /verified email address is required/i);
  console.log("Test 4 Passed: Missing email claim rejected with actionable error");
}

// Test 5: Valid Token Logs in Correct User
{
  const auth = createMockAuthService();
  const validTokenA = auth.issueMockToken({
    uid: "uid_alice",
    email: "alice@coderift.gg",
    name: "Alice",
    email_verified: true,
    firebase: { sign_in_provider: "google.com" },
  });
  const resA = await auth.loginWithFirebaseAuth({ idToken: validTokenA });
  assert.equal(resA.success, true);
  assert.equal(resA.user.email, "alice@coderift.gg");
  assert.equal(resA.user.username, "Alice");
  console.log("Test 5 Passed: Valid token logs in the correct user");
}

// Test 6: Token for User A Never Yields Session for User B
{
  const auth = createMockAuthService();
  const tokenA = auth.issueMockToken({
    uid: "uid_alice",
    email: "alice@coderift.gg",
    name: "Alice",
    email_verified: true,
  });
  const tokenB = auth.issueMockToken({
    uid: "uid_bob",
    email: "bob@coderift.gg",
    name: "Bob",
    email_verified: true,
  });

  const resA = await auth.loginWithFirebaseAuth({ idToken: tokenA });
  const resB = await auth.loginWithFirebaseAuth({ idToken: tokenB });

  assert.notEqual(resA.user.id, resB.user.id);
  assert.equal(resA.user.email, "alice@coderift.gg");
  assert.equal(resB.user.email, "bob@coderift.gg");
  console.log("Test 6 Passed: Token isolation verified — User A token never yields User B session");
}

// Test 7: Prevent Account Takeover Collision (UID mismatch on existing email)
{
  const auth = createMockAuthService();
  // Existing user registered with uid_legit
  auth.users.set("u_victim", {
    id: "u_victim",
    email: "victim@coderift.gg",
    username: "VictimWarrior",
    firebaseUid: "uid_legit",
    role: "USER",
  });

  // Attacker presents a token for victim@coderift.gg with a different UID (uid_attacker)
  const attackerToken = auth.issueMockToken({
    uid: "uid_attacker",
    email: "victim@coderift.gg",
    name: "Attacker",
    email_verified: true,
  });

  const res = await auth.loginWithFirebaseAuth({ idToken: attackerToken });
  assert.equal(res.success, false);
  assert.match(res.error, /Account configuration mismatch/i);
  console.log("Test 7 Passed: Account takeover prevented — UID mismatch on existing email strictly blocked");
}

console.log("\nALL STEP 1 TESTS PASSED SUCCESSFULLY!");
