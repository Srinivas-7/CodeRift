import "server-only";
import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

let _adminApp: App | null = null;
let _adminDb: Firestore | null = null;
let _adminAuth: Auth | null = null;

export function getAdminApp(): App {
  if (_adminApp) return _adminApp;
  if (getApps().length > 0) {
    _adminApp = getApp();
    return _adminApp;
  }

  const isProduction = process.env.NODE_ENV === "production";
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, "\n") : undefined;

  // Strict check in production: Service account credentials MUST be present
  if (isProduction) {
    if (!process.env.FIREBASE_PROJECT_ID || !clientEmail || !privateKey) {
      throw new Error(
        "FATAL: Missing required Firebase Admin service account credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) in production environment."
      );
    }
  }

  // If service account credentials exist (Production or Dev), initialize with cert
  if (projectId && clientEmail && privateKey) {
    _adminApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
    return _adminApp;
  }

  // Development/Build fallback: Initialize with project ID if available
  if (projectId) {
    _adminApp = initializeApp({ projectId });
    return _adminApp;
  }

  throw new Error(
    "Firebase Admin SDK initialization failed: No FIREBASE_PROJECT_ID or service account credentials provided."
  );
}

export function getAdminDb(): Firestore {
  if (!_adminDb) {
    _adminDb = getFirestore(getAdminApp());
  }
  return _adminDb;
}

export function getAdminAuth(): Auth {
  if (!_adminAuth) {
    _adminAuth = getAuth(getAdminApp());
  }
  return _adminAuth;
}

// Proxied exports for lazy initialization on first access (prevents build-time crashes)
export const adminDb: Firestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getAdminDb();
    const value = (db as any)[prop];
    return typeof value === "function" ? value.bind(db) : value;
  },
});

export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    const auth = getAdminAuth();
    const value = (auth as any)[prop];
    return typeof value === "function" ? value.bind(auth) : value;
  },
});

export { FieldValue, Timestamp };
