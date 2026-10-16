import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

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

import fs from "fs";
import path from "path";

// Load from .env if present
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = (match[2] || "").trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
  console.warn("⚠️ Warning: CLOUDINARY_CLOUD_NAME or CLOUDINARY_UPLOAD_PRESET not defined in .env");
}

async function uploadToCloudinaryFromUrl(imageUrl) {
  const formData = new FormData();
  formData.append("file", imageUrl);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();
  if (data.secure_url) {
    return data.secure_url;
  } else {
    throw new Error(data.error?.message || "Cloudinary upload failed");
  }
}

async function run() {
  console.log(`🌟 Uploading images to Cloudinary with cloud [${CLOUDINARY_CLOUD_NAME}]...`);

  // High quality luxury perfume editorial photos
  const menSource = "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=1200&auto=format&fit=crop";
  const womenSource = "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1200&auto=format&fit=crop";
  const unisexSource = "https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=1200&auto=format&fit=crop";

  let menUrl, womenUrl, unisexUrl;

  try {
    console.log("Uploading Men image to Cloudinary...");
    menUrl = await uploadToCloudinaryFromUrl(menSource);
    console.log("✓ Men Cloudinary URL:", menUrl);
  } catch (err) {
    console.warn("Cloudinary upload for Men failed:", err.message);
    menUrl = menSource;
  }

  try {
    console.log("Uploading Women image to Cloudinary...");
    womenUrl = await uploadToCloudinaryFromUrl(womenSource);
    console.log("✓ Women Cloudinary URL:", womenUrl);
  } catch (err) {
    console.warn("Cloudinary upload for Women failed:", err.message);
    womenUrl = womenSource;
  }

  try {
    console.log("Uploading Unisex image to Cloudinary...");
    unisexUrl = await uploadToCloudinaryFromUrl(unisexSource);
    console.log("✓ Unisex Cloudinary URL:", unisexUrl);
  } catch (err) {
    console.warn("Cloudinary upload for Unisex failed:", err.message);
    unisexUrl = unisexSource;
  }

  const banners = [
    {
      id: "banner_men",
      title: "FOR HIM",
      tag: "MASCULINE SIGNATURES",
      subtitle: "Bold, intense, and magnetic extraits formulated for commanding presence.",
      cta: "DISCOVER MEN'S",
      image: menUrl,
      link: "/shop?gender=Men",
      sort_order: 1,
      is_active: true
    },
    {
      id: "banner_women",
      title: "FOR HER",
      tag: "FEMININE ESSENCES",
      subtitle: "Sensual, elegant, and floral extraits crafted to leave a lasting, hypnotic sillage.",
      cta: "DISCOVER WOMEN'S",
      image: womenUrl,
      link: "/shop?gender=Women",
      sort_order: 2,
      is_active: true
    },
    {
      id: "banner_unisex",
      title: "UNISEX",
      tag: "TIMELESS HARMONY",
      subtitle: "Transcendent, boundary-defying niche creations crafted for discerning connoisseurs.",
      cta: "DISCOVER UNISEX",
      image: unisexUrl,
      link: "/shop?gender=Unisex",
      sort_order: 3,
      is_active: true
    }
  ];

  console.log("🔥 Writing 3 gender_banners to Firestore...");
  for (const b of banners) {
    await setDoc(doc(db, "gender_banners", b.id), b);
    console.log(`✓ Seeded banner [${b.id}] -> ${b.title} (image: ${b.image})`);
  }

  console.log("🎉 Successfully uploaded images to Cloudinary and updated Firebase Firestore!");
}

run().catch(console.error);
