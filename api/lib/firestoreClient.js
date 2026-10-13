import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || "AIzaSyAoaTJWd20mb_09ADUKZ4JjkSskdtaDVy4",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || "mahirsh-perfumes.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || "mahirsh-perfumes",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || "mahirsh-perfumes.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || "1072646270197",
  appId: process.env.VITE_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || "1:1072646270197:web:6d3f2179eaf9d37668e9bc"
};

let dbInstance = null;

export async function getFirestoreDb() {
  if (dbInstance) return dbInstance;
  try {
    const apps = getApps();
    const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig, "server-api");
    dbInstance = getFirestore(app);
    return dbInstance;
  } catch (err) {
    console.warn("Server Firestore initialization notice:", err.message);
    return null;
  }
}
