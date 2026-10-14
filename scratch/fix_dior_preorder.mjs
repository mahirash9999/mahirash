import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAoaTJWd20mb_09ADUKZ4JjkSskdtaDVy4",
  authDomain: "mahirsh-perfumes.firebaseapp.com",
  projectId: "mahirsh-perfumes",
  storageBucket: "mahirsh-perfumes.firebasestorage.app",
  messagingSenderId: "1072646270197",
  appId: "1:1072646270197:web:6d3f2179eaf9d37668e9bc"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function main() {
  try {
    await signInWithEmailAndPassword(auth, "mahirsh9999@gmail.com", "Super@321.Admin");
    console.log("✓ Authenticated successfully!");
  } catch (err) {
    console.warn("Auth note:", err.message);
  }

  const ref = doc(db, "products", "dior-sauvage-elixir");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    console.log("Document not found!");
    process.exit(1);
  }
  const data = snap.data();
  const updatedSizes = (data.size_prices || []).map(sp => {
    if (sp.size?.toLowerCase().includes("100ml")) {
      return { ...sp, is_preorder: false, stock: 0 };
    }
    return sp;
  });

  await updateDoc(ref, { size_prices: updatedSizes });
  console.log("✓✓✓ SUCCESS! Updated dior-sauvage-elixir in Firestore: 100ml is now is_preorder: false, stock: 0!");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
