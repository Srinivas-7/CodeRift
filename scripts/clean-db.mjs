import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyChqo6ypJhp5lETgwiopZ7AXK9b00xF3UI",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gamified-dsa.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gamified-dsa",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gamified-dsa.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1079760399690",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1079760399690:web:ea4a21e4449e54721f65b3",
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const COLLECTIONS = [
  "users",
  "user_problem_statuses",
  "daily_challenges",
  "submissions",
  "groups",
  "group_members",
  "user_achievements",
  "seasons",
  "group_seasons",
  "streak_records",
  "xp_transactions",
  "notifications",
  "friend_challenges",
];

async function cleanDatabase() {
  console.log("=== Starting Firestore Database Cleanup ===");
  let totalDeleted = 0;

  for (const collName of COLLECTIONS) {
    try {
      const collRef = collection(firestore, collName);
      const snapshot = await getDocs(collRef);
      const count = snapshot.size;

      if (count === 0) {
        console.log(`[${collName}] 0 documents found.`);
        continue;
      }

      console.log(`[${collName}] Found ${count} documents. Deleting...`);
      for (const d of snapshot.docs) {
        await deleteDoc(doc(firestore, collName, d.id));
      }
      console.log(`[${collName}] Successfully deleted ${count} documents.`);
      totalDeleted += count;
    } catch (err) {
      console.error(`Error cleaning collection ${collName}:`, err.message);
    }
  }

  console.log(`\n=== Finished Database Cleanup! Total documents deleted: ${totalDeleted} ===`);
  process.exit(0);
}

cleanDatabase();
