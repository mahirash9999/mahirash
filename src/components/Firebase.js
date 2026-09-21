// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAoaTJWd20mb_09ADUKZ4JjkSskdtaDVy4",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mahirsh-perfumes.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mahirsh-perfumes",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mahirsh-perfumes.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1072646270197",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1072646270197:web:6d3f2179eaf9d37668e9bc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BTBJLT8N3J"
};

if (!import.meta.env.VITE_FIREBASE_API_KEY && typeof window !== "undefined") {
  console.warn("⚠️ Firebase API Key is missing. Check Vercel Environment Variables and trigger a fresh REDEPLOY.");
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
