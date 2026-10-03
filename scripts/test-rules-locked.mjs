import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env");
  } catch (e) {}
}

console.log("--- Starting Client Firestore Security Rules Lock Verification ---");

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyChqo6ypJhp5lETgwiopZ7AXK9b00xF3UI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gamified-dsa.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gamified-dsa",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gamified-dsa.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1079760399690",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1079760399690:web:ea4a21e4449e54721f65b3",
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const clientDb = getFirestore(app);

async function runTests() {
  console.log(`Targeting Project: ${firebaseConfig.projectId}`);

  // Test 1: Direct Client Read Attempt against users collection
  console.log("\n[Test 1] Attempting unauthenticated direct client read from 'users' collection...");
  let readDenied = false;
  try {
    const snap = await getDocs(collection(clientDb, "users"));
    console.log(`⚠️ Read succeeded with ${snap.size} documents (Rules are not yet active or permit reads).`);
  } catch (err) {
    if (err.code === "permission-denied" || err.message?.includes("insufficient permissions") || err.message?.includes("PERMISSION_DENIED")) {
      readDenied = true;
      console.log(`✓ Read correctly denied with permission-denied (${err.message})`);
    } else {
      console.log(`✗ Read failed with unexpected error: ${err.code} - ${err.message}`);
    }
  }

  // Test 2: Direct Client Write Attempt against isolated throwaway probe doc
  console.log("\n[Test 2] Attempting unauthenticated direct client write to throwaway '_security_probe/test-probe-lock'...");
  let writeDenied = false;
  const probeDocRef = doc(clientDb, "_security_probe", "test-probe-lock");
  let writeSucceeded = false;

  try {
    await setDoc(probeDocRef, {
      test: "security-lock-verification",
      timestamp: new Date().toISOString(),
    });
    writeSucceeded = true;
    console.log("⚠️ Write succeeded! Client write permissions are open.");
  } catch (err) {
    if (err.code === "permission-denied" || err.message?.includes("insufficient permissions") || err.message?.includes("PERMISSION_DENIED")) {
      writeDenied = true;
      console.log(`✓ Write correctly denied with permission-denied (${err.message})`);
    } else {
      console.log(`✗ Write failed with unexpected error: ${err.code} - ${err.message}`);
    }
  } finally {
    // If the write did succeed (unlocked state), immediately clean up the throwaway document
    if (writeSucceeded) {
      try {
        await deleteDoc(probeDocRef);
        console.log("Cleaned up throwaway probe document.");
      } catch (cleanErr) {
        console.warn("Could not delete probe document:", cleanErr.message);
      }
    }
  }

  console.log("\n--- Verification Summary ---");
  console.log(`  Client Read Denied:  ${readDenied ? "YES (LOCKED)" : "NO (OPEN)"}`);
  console.log(`  Client Write Denied: ${writeDenied ? "YES (LOCKED)" : "NO (OPEN)"}`);

  if (readDenied && writeDenied) {
    console.log("\n🎉 SUCCESS: Firestore rules are fully locked! Client direct reads and writes are 100% blocked.");
    process.exit(0);
  } else {
    console.log("\nℹ️ NOTE: Firestore rules have not yet been deployed or still permit client traffic.");
    console.log("Deploy the rules with: firebase deploy --only firestore:rules");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
