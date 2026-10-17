import { db } from "../components/Firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";

export const DEFAULT_REELS = [
  {
    id: "reel-1",
    isDefault: true,
    title: "Artisanal Royal Oud Extrait | Notes of Pure Cambodian Agarwood",
    video: "https://assets.mixkit.co/videos/preview/mixkit-perfume-bottle-and-flowers-in-water-41272-large.mp4",
    url: "https://www.instagram.com/mahirashparfumerie/",
    tag: "Haute Parfumerie",
    duration: "0:30",
    order: 1,
  },
  {
    id: "reel-2",
    isDefault: true,
    title: "Sillage That Lingers | Handcrafted Extrait Formulations",
    video: "https://assets.mixkit.co/videos/preview/mixkit-spray-of-a-bottle-of-perfume-41273-large.mp4",
    url: "https://www.instagram.com/mahirashparfumerie/",
    tag: "Luxury Edit",
    duration: "0:25",
    order: 2,
  },
  {
    id: "reel-3",
    isDefault: true,
    title: "The Alchemy of Floral Elegance & Velvety Bourbon Vanilla",
    video: "https://assets.mixkit.co/videos/preview/mixkit-perfume-bottle-surrounded-by-fresh-flowers-41274-large.mp4",
    url: "https://www.instagram.com/mahirashparfumerie/",
    tag: "Atelier Signature",
    duration: "0:35",
    order: 3,
  },
  {
    id: "reel-4",
    isDefault: true,
    title: "Discovery Vault Unboxing | Rare Botanical Blends",
    video: "https://assets.mixkit.co/videos/preview/mixkit-woman-spraying-perfume-on-her-neck-41275-large.mp4",
    url: "https://www.instagram.com/mahirashparfumerie/",
    tag: "Discovery Set",
    duration: "0:40",
    order: 4,
  },
  {
    id: "reel-5",
    isDefault: true,
    title: "Behind The Atelier | The Crafting of Intense Long-Lasting Extraits",
    video: "https://assets.mixkit.co/videos/preview/mixkit-droplets-of-water-on-a-black-perfume-bottle-41276-large.mp4",
    url: "https://www.instagram.com/mahirashparfumerie/",
    tag: "Private Reserve",
    duration: "0:30",
    order: 5,
  },
];

/**
 * Listens to realtime updates from Firestore `news_reels` collection.
 * If collection is empty, returns DEFAULT_REELS.
 */
export const listenToNewsReels = (callback, onError) => {
  const reelsRef = collection(db, "news_reels");
  const q = query(reelsRef, orderBy("order", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(DEFAULT_REELS);
      } else {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        callback(items);
      }
    },
    (err) => {
      console.warn("Firestore news_reels listener fallback to default:", err);
      if (onError) onError(err);
      callback(DEFAULT_REELS);
    }
  );
};

export const addNewsReel = async (data) => {
  return await addDoc(collection(db, "news_reels"), {
    ...data,
    createdAt: serverTimestamp(),
  });
};

export const updateNewsReel = async (id, data) => {
  const reelRef = doc(db, "news_reels", id);
  return await updateDoc(reelRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteNewsReel = async (id) => {
  const reelRef = doc(db, "news_reels", id);
  return await deleteDoc(reelRef);
};

export const reorderNewsReels = async (reels) => {
  const promises = reels.map((reel, index) => {
    if (reel.isDefault || !reel.id) return Promise.resolve();
    const reelRef = doc(db, "news_reels", reel.id);
    return updateDoc(reelRef, { order: (index + 1) * 10 });
  });
  return await Promise.all(promises);
};
