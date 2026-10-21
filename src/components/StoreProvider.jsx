import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { db } from "../components/Firebase";
import { collection, onSnapshot, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "./useAuth";
import { useCustomerAuth } from "./CustomerAuthProvider";

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const customerAuth = useCustomerAuth();
  const customer = customerAuth?.customer;
  const activeUid = user?.uid || customer?.uid;

  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedItem, setAddedItem] = useState(null); // global add-to-cart dialog trigger
  const [siteSettings, setSiteSettings] = useState({
    whatsapp_number: "9584826112",
    phone: "+91 9584826112",
    email: "care@mahirash.com",
    preorder_message: "Hello Mahirash! I would like to pre-order: ",
    logo_url: "",
    site_icon_url: "",
    gemini_api_key: "",
    instagram_url: "https://www.instagram.com/mahirashparfumerie/",
    facebook_url: "https://www.facebook.com/mahirashparfumerie/",
    twitter_url: "https://x.com/MahirashParfum",
    youtube_url: "https://www.youtube.com/@mahirashparfumerie"
  });

  const mergedUidsRef = useRef(new Set());

  // --- FETCH GLOBAL SETTINGS ---
  useEffect(() => {
    let unsub = () => { };
    try {
      const settingsRef = doc(db, "settings", "global");
      unsub = onSnapshot(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSiteSettings(prev => ({ ...prev, ...data }));

          // Dynamically update siteicon / favicon if configured
          if (data.site_icon_url) {
            let iconLink = document.querySelector("link[rel*='icon']");
            if (!iconLink) {
              iconLink = document.createElement("link");
              iconLink.rel = "shortcut icon";
              document.getElementsByTagName("head")[0].appendChild(iconLink);
            }
            iconLink.href = data.site_icon_url;
          }
        }
      });
    } catch (err) {
      console.error("Failed to load global settings", err);
    }
    return () => unsub();
  }, []);

  // --- PERSISTENCE: LOGGED IN ACCOUNT (FIREBASE) VS GUEST (LOCAL STORAGE) ---
  useEffect(() => {
    if (authLoading) return;

    let unsubUser = () => { };

    if (activeUid) {
      // 1. Immediately load from user local cache for zero delay
      try {
        const cachedCart = localStorage.getItem("user_cart_" + activeUid);
        const cachedWish = localStorage.getItem("user_wishlist_" + activeUid);
        if (cachedCart) setCart(JSON.parse(cachedCart));
        if (cachedWish) setWishlist(JSON.parse(cachedWish));
      } catch (_) {}

      const syncUserStore = async () => {
        try {
          const userDocRef = doc(db, "users", activeUid);
          const snap = await getDoc(userDocRef);
          const existingData = snap.exists() ? snap.data() : {};
          let cloudCart = Array.isArray(existingData.cart) ? [...existingData.cart] : [];
          let cloudWish = Array.isArray(existingData.wishlist) ? [...existingData.wishlist] : [];

          // Merge any items from guest local storage on first login
          if (!mergedUidsRef.current.has(activeUid)) {
            mergedUidsRef.current.add(activeUid);

            const localCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
            const localWish = JSON.parse(localStorage.getItem("guest_wishlist") || "[]");
            let hasChanges = false;

            if (localCart.length > 0) {
              for (const gItem of localCart) {
                const gKey = gItem.cartId || gItem.id;
                const idx = cloudCart.findIndex(c => (c.cartId || c.id) === gKey);
                if (idx === -1) {
                  cloudCart.push(gItem);
                } else {
                  cloudCart[idx] = {
                    ...cloudCart[idx],
                    quantity: Math.max(1, (cloudCart[idx].quantity || 1) + (gItem.quantity || 1))
                  };
                }
              }
              localStorage.removeItem("guest_cart");
              hasChanges = true;
            }

            if (localWish.length > 0) {
              for (const gItem of localWish) {
                if (!cloudWish.some(w => w.id === gItem.id)) {
                  cloudWish.push(gItem);
                }
              }
              localStorage.removeItem("guest_wishlist");
              hasChanges = true;
            }

            if (hasChanges) {
              await setDoc(userDocRef, {
                cart: cloudCart,
                wishlist: cloudWish,
                updatedAt: serverTimestamp()
              }, { merge: true });
            }
          }

          setCart(cloudCart);
          setWishlist(cloudWish);
          localStorage.setItem("user_cart_" + activeUid, JSON.stringify(cloudCart));
          localStorage.setItem("user_wishlist_" + activeUid, JSON.stringify(cloudWish));
          setLoading(false);
        } catch (err) {
          console.error("Error loading user cart/wishlist from Firebase:", err);
          setLoading(false);
        }
      };

      syncUserStore();

      // Realtime listener for cross-tab / cross-device live sync of user cart & wishlist
      unsubUser = onSnapshot(doc(db, "users", activeUid), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (Array.isArray(data.cart)) {
            setCart(data.cart);
            localStorage.setItem("user_cart_" + activeUid, JSON.stringify(data.cart));
          }
          if (Array.isArray(data.wishlist)) {
            setWishlist(data.wishlist);
            localStorage.setItem("user_wishlist_" + activeUid, JSON.stringify(data.wishlist));
          }
        }
        setLoading(false);
      }, (err) => {
        console.warn("User store realtime listener notice:", err.message);
        setLoading(false);
      });

    } else {
      // Guest: load from local storage
      const localCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
      const localWishlist = JSON.parse(localStorage.getItem("guest_wishlist") || "[]");
      setCart(localCart);
      setWishlist(localWishlist);
      setLoading(false);
    }

    return () => unsubUser();
  }, [activeUid, authLoading]);

  // Helper to persist cart state to Firestore (if logged in) or localStorage (if guest)
  const persistCart = async (newCart) => {
    setCart(newCart);
    if (activeUid) {
      try {
        localStorage.setItem("user_cart_" + activeUid, JSON.stringify(newCart));
        await setDoc(doc(db, "users", activeUid), {
          cart: newCart,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to save cart to Firebase account:", err);
      }
    } else {
      localStorage.setItem("guest_cart", JSON.stringify(newCart));
    }
  };

  // Helper to persist wishlist state to Firestore (if logged in) or localStorage (if guest)
  const persistWishlist = async (newWishlist) => {
    setWishlist(newWishlist);
    if (activeUid) {
      try {
        localStorage.setItem("user_wishlist_" + activeUid, JSON.stringify(newWishlist));
        await setDoc(doc(db, "users", activeUid), {
          wishlist: newWishlist,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.error("Failed to save wishlist to Firebase account:", err);
      }
    } else {
      localStorage.setItem("guest_wishlist", JSON.stringify(newWishlist));
    }
  };

  const addToCart = async (product, selectedSize = null) => {
    if (!product) return { success: false, reason: "invalid_product" };

    const variantStock = selectedSize?.stock !== undefined
      ? Number(selectedSize.stock)
      : (product.stock !== undefined ? Number(product.stock) : 10);

    // Pre-order: ONLY if marked preorder from product form
    const isPreOrder = Boolean(selectedSize?.is_preorder || product.is_preorder);

    // Out of stock: if stock is 0 and NOT marked preorder from product form
    const isOutOfStock = !isPreOrder && (
      variantStock <= 0 ||
      String(selectedSize?.stock_status || '').toLowerCase() === 'out of stock' ||
      String(product.stock_status || '').toLowerCase() === 'out of stock'
    );

    if (isOutOfStock) {
      console.warn("Out-of-stock items cannot be added to cart.");
      return { success: false, reason: "out_of_stock", message: "This item is currently out of stock." };
    }

    if (isPreOrder) {
      console.warn("Pre-order items cannot be added to cart. Use support pre-order booking.");
      return { success: false, reason: "preorder", message: "Pre-order items cannot be added to cart." };
    }

    const cartId = selectedSize ? `${product.id}-${selectedSize.size}` : product.id;
    const price = selectedSize?.price || product.price;

    const newItem = {
      cartId: cartId,
      id: product.id,
      name: product.name,
      brand: product.brand || "MAHIRASH",
      price: price,
      image: selectedSize?.image || product.image || product.images?.[0] || "",
      category: product.category || "",
      collections: product.collections || (product.collection ? [product.collection] : []),
      size: selectedSize?.size || "",
      is_preorder: false,
      stock: variantStock,
      addedAt: new Date().toISOString(),
      quantity: 1,
      shipping: product.shipping || { weight: 0.4, length: 30, breadth: 20, height: 5 }
    };

    const existingIndex = cart.findIndex(i => (i.cartId || i.id) === cartId);
    let updatedCart;
    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...updatedCart[existingIndex],
        quantity: (updatedCart[existingIndex].quantity || 1) + 1
      };
    } else {
      updatedCart = [...cart, newItem];
    }

    await persistCart(updatedCart);
    setAddedItem(newItem);
    return { success: true, item: newItem };
  };

  const removeFromCart = async (cartId) => {
    const updated = cart.filter(i => (i.cartId || i.id) !== cartId);
    await persistCart(updated);
  };

  const updateQuantity = async (cartId, delta) => {
    const updated = cart.map(item => {
      if ((item.cartId || item.id) === cartId) {
        return { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) };
      }
      return item;
    });
    await persistCart(updated);
  };

  const clearCart = async () => {
    await persistCart([]);
  };

  const addToWishlist = async (product) => {
    if (!product) return;
    const newItem = {
      id: product.id,
      name: product.name,
      brand: product.brand || "MAHIRASH",
      price: product.price,
      image: product.image || product.images?.[0] || "",
      category: product.category || "",
      collections: product.collections || (product.collection ? [product.collection] : []),
      addedAt: new Date().toISOString()
    };

    const existing = wishlist.find(i => i.id === product.id);
    if (!existing) {
      const updated = [...wishlist, newItem];
      await persistWishlist(updated);
    }
  };

  const removeFromWishlist = async (id) => {
    const updated = wishlist.filter(i => i.id !== id);
    await persistWishlist(updated);
  };

  const clearWishlist = async () => {
    await persistWishlist([]);
  };

  return (
    <StoreContext.Provider value={{
      cart,
      wishlist,
      loading,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      addToWishlist,
      removeFromWishlist,
      clearWishlist,
      addedItem,
      dismissAddedItem: () => setAddedItem(null),
      siteSettings
    }}>
      {children}
    </StoreContext.Provider>
  );
};
