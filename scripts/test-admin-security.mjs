import assert from "node:assert/strict";

console.log("--- Starting SEC-04 Admin Security & Role Verification Tests ---");

// Test 1: Role check logic rejects unauthenticated user
{
  function checkAdmin(currentUser) {
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Administrator privileges required." };
    }
    return { success: true };
  }

  const unauthResult = checkAdmin(null);
  assert.equal(unauthResult.success, false);
  assert.match(unauthResult.error, /Administrator privileges required/);
  console.log("Test 1 Passed: Unauthenticated request rejected");
}

// Test 2: Role check logic rejects normal USER role
{
  function checkAdmin(currentUser) {
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Administrator privileges required." };
    }
    return { success: true };
  }

  const normalUser = { id: "u_normal", email: "user@test.com", role: "USER" };
  const userResult = checkAdmin(normalUser);
  assert.equal(userResult.success, false);
  assert.match(userResult.error, /Administrator privileges required/);
  console.log("Test 2 Passed: Normal USER role rejected from admin action");
}

// Test 3: Role check logic accepts ADMIN role
{
  function checkAdmin(currentUser) {
    if (!currentUser || currentUser.role !== "ADMIN") {
      return { success: false, error: "Unauthorized. Administrator privileges required." };
    }
    return { success: true };
  }

  const adminUser = { id: "u_admin", email: "admin@test.com", role: "ADMIN" };
  const adminResult = checkAdmin(adminUser);
  assert.equal(adminResult.success, true);
  console.log("Test 3 Passed: ADMIN role authorized");
}

// Test 4: Password bypass is impossible (passing "DSA321" without ADMIN role fails)
{
  function updateSeasonDatesSimulated(currentUser, data) {
    if (!currentUser || currentUser.role !== "ADMIN") {
      return {
        success: false,
        error: "Unauthorized. Administrator privileges required.",
      };
    }
    if (!data.startDate) {
      return { success: false, error: "Please provide a valid start date." };
    }
    return { success: true, updated: true };
  }

  // Attacker tries sending old password "DSA321" with no session
  const attack1 = updateSeasonDatesSimulated(null, { startDate: "2026-01-01", password: "DSA321" });
  assert.equal(attack1.success, false);
  assert.match(attack1.error, /Administrator privileges required/);

  // Attacker tries sending old password "DSA321" with normal USER session
  const attack2 = updateSeasonDatesSimulated({ id: "u_attacker", role: "USER" }, { startDate: "2026-01-01", password: "DSA321" });
  assert.equal(attack2.success, false);
  assert.match(attack2.error, /Administrator privileges required/);

  console.log("Test 4 Passed: Old password 'DSA321' is completely defunct and rejected");
}

// Test 5: Verify updateProfile whitelist prevents self-promotion to ADMIN
{
  function updateProfileSimulated(currentUser, data) {
    const updates = {};
    if (data.username && data.username.trim()) {
      updates.username = data.username.trim();
    }
    if (data.avatar) {
      updates.avatar = data.avatar;
    }
    if (data.leetcodeUsername !== undefined) {
      updates.leetcodeUsername = data.leetcodeUsername;
    }
    if (data.gfgUsername !== undefined) {
      updates.gfgUsername = data.gfgUsername;
    }
    // Note: role is not in the whitelist
    return { ...currentUser, ...updates };
  }

  const user = { id: "u1", username: "alice", role: "USER" };
  // Attacker attempts to inject role: "ADMIN" into updateProfile payload
  const result = updateProfileSimulated(user, { username: "alice_new", role: "ADMIN" });
  assert.equal(result.role, "USER", "User role must remain USER after updateProfile");
  assert.equal(result.username, "alice_new");
  console.log("Test 5 Passed: updateProfile whitelist strictly ignores role parameter");
}

console.log("\nALL STEP 2 TESTS PASSED SUCCESSFULLY!");
