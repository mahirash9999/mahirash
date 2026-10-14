import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';

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
const db = getFirestore(app);

async function check() {
  const querySnapshot = await getDocs(collection(db, "products"));
  querySnapshot.forEach((d) => {
    const data = d.data();
    if (data.name && data.name.toLowerCase().includes("sauvage")) {
      console.log("Found product:", d.id, JSON.stringify({
        name: data.name,
        stock: data.stock,
        stock_status: data.stock_status,
        is_preorder: data.is_preorder,
        size_prices: data.size_prices
      }, null, 2));
    }
  });
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
