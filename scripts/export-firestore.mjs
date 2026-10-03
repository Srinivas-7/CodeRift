import fs from "node:fs/promises";
import path from "node:path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(".env");
  } catch (e) {}
}



const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gamified-dsa";
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : undefined;

let app;
if (getApps().length > 0) {
  app = getApps()[0];
} else if (clientEmail && privateKey) {
  app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
} else {
  console.log("No FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY provided in env; attempting default app initialization.");
  app = initializeApp({ projectId });
}

const adminDb = getFirestore(app);

const COLLECTIONS = [
  "users",
  "groups",
  "group_members",
  "user_problem_statuses",
  "submissions",
  "daily_challenges",
  "streak_records",
  "xp_transactions",
  "user_achievements",
  "seasons",
  "friend_challenges",
  "notifications",
];

async function exportCollections() {
  const outputDir = path.resolve(process.cwd(), "firestore-backup");
  await fs.mkdir(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  console.log(`Starting Firestore backup to ${outputDir} (Timestamp: ${timestamp})...\n`);

  const manifest = {
    timestamp: new Date().toISOString(),
    projectId,
    collections: {},
  };

  for (const colName of COLLECTIONS) {
    try {
      const snap = await adminDb.collection(colName).get();
      const docs = snap.docs.map((d) => ({
        _id: d.id,
        ...d.data(),
      }));

      const filePath = path.join(outputDir, `${colName}.json`);
      await fs.writeFile(filePath, JSON.stringify(docs, null, 2), "utf-8");
      manifest.collections[colName] = docs.length;
      console.log(`✓ Exported ${colName.padEnd(24)} -> ${docs.length} documents`);
    } catch (err) {
      console.error(`✗ Failed to export ${colName}:`, err.message);
      manifest.collections[colName] = { error: err.message };
    }
  }

  const manifestPath = path.join(outputDir, `manifest-${timestamp}.json`);
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`\nBackup completed! Manifest written to ${manifestPath}`);
}

exportCollections().catch((err) => {
  console.error("Export failed:", err);
  process.exit(1);
});
