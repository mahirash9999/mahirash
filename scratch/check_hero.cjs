const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

const envPath = path.resolve('d:/Mahirash-Final/.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim().replace(/^['"](.*)['"]$/, '$1');
    env[match[1]] = value;
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function check() {
  const colls = ['hero_video', 'hero_slides', 'banners', 'site_settings'];
  for (const c of colls) {
    try {
      const snap = await getDocs(collection(db, c));
      console.log(`=== Collection: ${c} (${snap.size} docs) ===`);
      snap.forEach(d => {
        console.log(d.id, JSON.stringify(d.data()));
      });
    } catch (e) {
      console.log(`Error reading ${c}:`, e.message);
    }
  }
}

check();
