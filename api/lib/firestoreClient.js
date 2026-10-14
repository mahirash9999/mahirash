import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const APP_NAME = "mahirash-server-api";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
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

    // Sign in as admin for server-side write permissions using environment variables
    if (!authReady) {
      const auth = getAuth(app);
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (adminEmail && adminPassword) {
        try {
          await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
          authReady = true;
          console.log("[firestoreClient] Admin auth successful for:", adminEmail);
        } catch (authErr) {
          console.warn("[firestoreClient] Admin auth failed with environment credentials:", authErr.message);
        }
      } else {
        console.warn("[firestoreClient] ADMIN_EMAIL or ADMIN_PASSWORD not configured in environment variables.");
      }
    }

    return dbInstance;
  } catch (err) {
    console.error("[firestoreClient] Firestore initialization error:", err.message);
    return null;
  }
}
