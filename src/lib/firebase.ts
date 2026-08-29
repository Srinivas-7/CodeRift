import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
} from "firebase/auth";

// Public Firebase Client configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyDSAARENA_DEMO_KEY_PUBLIC",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dsa-arena.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dsa-arena",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dsa-arena.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1092837465",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1092837465:web:dsaarena789",
};

// Initialize Firebase singleton safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// Auth Providers
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const githubProvider = new GithubAuthProvider();
githubProvider.addScope("read:user");
githubProvider.addScope("user:email");

export interface FirebaseUserInfo {
  email: string;
  name: string;
  uid: string;
  photoURL?: string;
  provider: "google" | "github" | "password";
}

/**
 * Sign in with Google using Firebase Authentication popup
 */
export async function signInWithGooglePopup(): Promise<FirebaseUserInfo> {
  try {
    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    return {
      email: user.email || `${user.uid}@google.dsaarena.gg`,
      name: user.displayName || user.email?.split("@")[0] || "Google Warrior",
      uid: user.uid,
      photoURL: user.photoURL || undefined,
      provider: "google",
    };
  } catch (error: any) {
    console.warn("Firebase Google popup note:", error.message);
    throw error;
  }
}

/**
 * Sign in with GitHub using Firebase Authentication popup
 */
export async function signInWithGithubPopup(): Promise<FirebaseUserInfo> {
  try {
    const result: UserCredential = await signInWithPopup(auth, githubProvider);
    const user = result.user;
    return {
      email: user.email || `${user.uid}@github.dsaarena.gg`,
      name: user.displayName || user.email?.split("@")[0] || "GitHub Warrior",
      uid: user.uid,
      photoURL: user.photoURL || undefined,
      provider: "github",
    };
  } catch (error: any) {
    console.warn("Firebase GitHub popup note:", error.message);
    throw error;
  }
}

/**
 * Sign in with Email and Password using Firebase Auth
 */
export async function signInWithEmailPasswordAuth(
  email: string,
  pass: string
): Promise<FirebaseUserInfo> {
  const result: UserCredential = await signInWithEmailAndPassword(auth, email, pass);
  const user = result.user;
  return {
    email: user.email || email,
    name: user.displayName || email.split("@")[0],
    uid: user.uid,
    photoURL: user.photoURL || undefined,
    provider: "password",
  };
}

/**
 * Sign up with Email and Password using Firebase Auth
 */
export async function signUpWithEmailPassword(
  email: string,
  pass: string,
  displayName?: string
): Promise<FirebaseUserInfo> {
  const result: UserCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = result.user;
  return {
    email: user.email || email,
    name: displayName || user.displayName || email.split("@")[0],
    uid: user.uid,
    photoURL: user.photoURL || undefined,
    provider: "password",
  };
}

/**
 * Get current user's Firebase ID token for secure API calls
 */
export async function getFirebaseIdToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  return await auth.currentUser.getIdToken(true);
}

/**
 * Sign out of Firebase Auth
 */
export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to Firebase Auth state changes
 */
export function onFirebaseAuthStateChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export { app, auth, googleProvider, githubProvider };
