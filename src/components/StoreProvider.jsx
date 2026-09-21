import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "../components/Firebase";
import { collection, onSnapshot, doc } from "firebase/firestore";

const StoreContext = createContext();

export const useStore = () => useContext(StoreContext);

export const StoreProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedItem, setAddedItem] = useState(null); // global add-to-cart dialog trigger
  const [siteSettings, setSiteSettings] = useState({
    whatsapp_number: "9584826112",
    phone: "+91 9584826112",
    email: "care@mahirash.com",
    preorder_message: "Hello Mahirash! I would like to pre-order: "
  });

  // --- FETCH GLOBAL SETTINGS ---
  useEffect(() => {
    let unsub = () => { };
    try {
      const settingsRef = doc(db, "settings", "global");
      unsub = onSnapshot(settingsRef, (snapshot) => {
        if (snapshot.exists()) {
          setSiteSettings(prev => ({ ...prev, ...snapshot.data() }));
        }
      });
    } catch (err) {
      console.error("Failed to load global settings", err);
    }
    return () => unsub();
  }, []);

  // --- FETCH LOCAL CART/WISHLIST ON MOUNT ---
  useEffect(() => {
    const localCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
    const localWishlist = JSON.parse(localStorage.getItem("guest_wishlist") || "[]");
    setCart(localCart);
    setWishlist(localWishlist);
    setLoading(false);
  }, []);

  const addToCart = async (product, selectedSize = null) => {
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
      is_preorder: Boolean(selectedSize?.is_preorder),
      stock: selectedSize?.stock !== undefined ? Number(selectedSize.stock) : Number(product.stock ?? 10),
      addedAt: new Date().toISOString(),
      quantity: 1,
      shipping: product.shipping || { weight: 0.4, length: 30, breadth: 20, height: 5 }
    };

    const currentCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
    const existing = currentCart.find(i => i.cartId === cartId);
    if (!existing) {
      const updated = [...currentCart, newItem];
      localStorage.setItem("guest_cart", JSON.stringify(updated));
      setCart(updated);
    }
    setAddedItem(newItem); // trigger the dialog
  };

  const removeFromCart = async (cartId) => {
    const currentCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
    const updated = currentCart.filter(i => i.cartId !== cartId);
    localStorage.setItem("guest_cart", JSON.stringify(updated));
    setCart(updated);
  };

  const addToWishlist = async (product) => {
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

    const currentWish = JSON.parse(localStorage.getItem("guest_wishlist") || "[]");
    const existing = currentWish.find(i => i.id === product.id);
    if (!existing) {
      const updated = [...currentWish, newItem];
      localStorage.setItem("guest_wishlist", JSON.stringify(updated));
      setWishlist(updated);
    }
  };

  const removeFromWishlist = async (id) => {
    const currentWish = JSON.parse(localStorage.getItem("guest_wishlist") || "[]");
    const updated = currentWish.filter(i => i.id !== id);
    localStorage.setItem("guest_wishlist", JSON.stringify(updated));
    setWishlist(updated);
  };

  const updateQuantity = async (cartId, delta) => {
    const currentCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
    const updated = currentCart.map(item => {
      if (item.cartId === cartId) {
        return { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) };
      }
      return item;
    });
    localStorage.setItem("guest_cart", JSON.stringify(updated));
    setCart(updated);
  };

  return (
    <StoreContext.Provider value={{ cart, wishlist, loading, addToCart, removeFromCart, updateQuantity, addToWishlist, removeFromWishlist, addedItem, dismissAddedItem: () => setAddedItem(null), siteSettings }}>
      {children}
    </StoreContext.Provider>
  );
};
