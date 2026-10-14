import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const APP_NAME = "mahirash-server-api";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "AIzaSyAoaTJWd20mb_09ADUKZ4JjkSskdtaDVy4",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "mahirsh-perfumes.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "mahirsh-perfumes",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "mahirsh-perfumes.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "1072646270197",
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "1:1072646270197:web:6d3f2179eaf9d37668e9bc"
};

let dbInstance = null;
let authReady = false;

export async function getFirestoreDb() {
  if (dbInstance && authReady) return dbInstance;

  try {
    // Always look for the named app specifically to avoid conflicts with client apps
    let app;
    const existingApps = getApps();
    const namedApp = existingApps.find(a => a.name === APP_NAME);
    if (namedApp) {
      app = namedApp;
    } else {
      app = initializeApp(firebaseConfig, APP_NAME);
    }

    if (!dbInstance) {
      dbInstance = getFirestore(app);
    }

    // Sign in as admin for server-side write permissions
    if (!authReady) {
      const auth = getAuth(app);
      const candidates = [
        {
          email: process.env.ADMIN_EMAIL || "admin@mahirash.com",
          pass: process.env.ADMIN_PASSWORD || "Mahirash@1234"
        },
        {
          email: "admin@mahirash.com",
          pass: "Mahirash@1234"
        },
        {
          email: "mahirsh9999@gmail.com",
          pass: "Mahirash@1234"
        }
      ];

      for (const cand of candidates) {
        try {
          await signInWithEmailAndPassword(auth, cand.email, cand.pass);
          authReady = true;
          console.log("[firestoreClient] Admin auth successful for:", cand.email);
          break;
        } catch (_) {
          // continue to next candidate
        }
      }

      if (!authReady) {
        console.warn("[firestoreClient] Admin credentials failed to authenticate. Proceeding with unauthenticated client.");
      }
    }

    return dbInstance;
  } catch (err) {
    console.error("[firestoreClient] Firestore initialization error:", err.message);
    return null;
  }
}
