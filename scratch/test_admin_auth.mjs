import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAoaTJWd20mb_09ADUKZ4JjkSskdtaDVy4",
  authDomain: "mahirsh-perfumes.firebaseapp.com",
  projectId: "mahirsh-perfumes",
  storageBucket: "mahirsh-perfumes.firebasestorage.app",
  messagingSenderId: "1072646270197",
  appId: "1:1072646270197:web:6d3f2179eaf9d37668e9bc",
  measurementId: "G-BTBJLT8N3J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testAuth() {
  try {
    const cred = await signInWithEmailAndPassword(auth, "admin@mahirash.com", "Mahirash@1234");
    console.log("✓ SUCCESS: Logged in as", cred.user.email, "uid:", cred.user.uid);
    const snap = await getDocs(collection(db, "products"));
    console.log("Current products count:", snap.size);
    snap.forEach(d => console.log(" -", d.id, ":", d.data().name));
    process.exit(0);
  } catch (err) {
    console.error("Auth error:", err.message);
    process.exit(1);
  }
}

testAuth();
