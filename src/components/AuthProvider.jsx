import React, { useEffect, useState } from "react";
import { auth, db } from "./Firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  updateProfile,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { AuthContext } from "./useAuth";

export const linkGuestOrdersForUser = async (firebaseUser) => {
  if (!firebaseUser) return 0;
  try {
    const token = await firebaseUser.getIdToken();
    const res = await fetch("/api/link-guest-orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`[Order Linking] Linked ${data.linkedCount || 0} guest order(s) for ${firebaseUser.email}`);
      return data.linkedCount || 0;
    }
  } catch (err) {
    console.warn("Guest order linking notice:", err.message);
  }
  return 0;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      // If superadmin without customer flow, ignore for storefront customer sessions
      if (u && (u.email === "mahirsh9999@gmail.com" || u.email === "admin@mahirash.com") && localStorage.getItem("pasoja_customer_logged_in") !== "true") {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(u || null);
      setLoading(false);

      if (u) {
        // Sync user doc
        const cleanEmail = u.email ? u.email.toLowerCase().trim() : "";
        const userDoc = doc(db, "users", u.uid);
        try {
          const snap = await getDoc(userDoc);
          if (!snap.exists()) {
            await setDoc(userDoc, {
              uid: u.uid,
              email: cleanEmail,
              displayName: u.displayName || "",
              createdAt: serverTimestamp(),
            });
          }
        } catch (_) { }

        // Also sync profile in customers collection for fast lookup
        if (cleanEmail) {
          const customerDocId = cleanEmail.replace(/[^a-z0-9]/g, "_");
          try {
            const customerRef = doc(db, "customers", customerDocId);
            await setDoc(customerRef, {
              uid: u.uid,
              email: cleanEmail,
              name: u.displayName || cleanEmail.split("@")[0],
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch (_) { }
        }

        // Link any matching guest orders automatically
        linkGuestOrdersForUser(u);
      }
    });

    return () => unsub();
  }, []);

  /**
   * Authenticate with server-issued custom token (OTP Flow)
   */
  const loginWithCustomToken = async (customToken) => {
    localStorage.setItem("pasoja_customer_logged_in", "true");
    const cred = await signInWithCustomToken(auth, customToken);
    await linkGuestOrdersForUser(cred.user);
    return cred;
  };

  /**
   * Email and password login via Firebase Authentication
   */
  const login = async (email, password) => {
    const formattedEmail = email.toLowerCase().trim();
    localStorage.setItem("pasoja_customer_logged_in", "true");

    const cred = await signInWithEmailAndPassword(auth, formattedEmail, password);
    await linkGuestOrdersForUser(cred.user);
    return cred;
  };

  /**
   * Account registration with email and password via Firebase Authentication
   */
  const signup = async (email, password, displayName) => {
    const formattedEmail = email.toLowerCase().trim();
    localStorage.setItem("pasoja_customer_logged_in", "true");

    const cred = await createUserWithEmailAndPassword(auth, formattedEmail, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }

    const userDoc = doc(db, "users", cred.user.uid);
    await setDoc(userDoc, {
      uid: cred.user.uid,
      email: formattedEmail,
      displayName: displayName || "",
      createdAt: serverTimestamp(),
    });

    const customerDocId = formattedEmail.replace(/[^a-z0-9]/g, "_");
    await setDoc(doc(db, "customers", customerDocId), {
      uid: cred.user.uid,
      email: formattedEmail,
      name: displayName || formattedEmail.split("@")[0],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    await linkGuestOrdersForUser(cred.user);
    return cred;
  };

  /**
   * Set or change password for current authenticated user
   */
  const setPassword = async (newPassword) => {
    if (!auth.currentUser) throw new Error("No authenticated user session found");
    await updatePassword(auth.currentUser, newPassword);
  };

  /**
   * Google OAuth Sign-in
   */
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    localStorage.setItem("pasoja_customer_logged_in", "true");
    const cred = await signInWithPopup(auth, provider);
    await linkGuestOrdersForUser(cred.user);
    return cred;
  };

  /**
   * Sign out and clear sessions
   */
  const logout = async () => {
    localStorage.removeItem("pasoja_customer_session");
    localStorage.removeItem("pasoja_customer_logged_in");
    setUser(null);
    await signOut(auth);
  };

  const value = {
    user,
    loading,
    login,
    signup,
    loginWithCustomToken,
    setPassword,
    loginWithGoogle,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
