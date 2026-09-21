import React, { useEffect, useState } from "react";
import { auth, db } from "./Firebase";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, collection, getDocs, query, where } from "firebase/firestore";
import { AuthContext } from "./useAuth";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial check: check if custom user session is in localStorage
    const savedCustomUser = localStorage.getItem("pasoja_custom_user");
    if (savedCustomUser) {
      try {
        setUser(JSON.parse(savedCustomUser));
        setLoading(false);
      } catch (err) {
        console.error("Error parsing custom user session:", err);
      }
    }

    const unsub = onAuthStateChanged(auth, async (u) => {
      const customUserSession = localStorage.getItem("pasoja_custom_user");
      // If we have an active custom session, don't overwrite it with Firebase's null user state
      if (customUserSession) {
        return;
      }

      // If the email is the superadmin, and customer flow did not explicitly authenticate them, ignore it for customer pages!
      if (u && u.email === "mahirsh9999@gmail.com" && localStorage.getItem("pasoja_customer_logged_in") !== "true") {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(u || null);
      setLoading(false);

      if (u) {
        const userDoc = doc(db, "users", u.uid);
        const snap = await getDoc(userDoc);
        if (!snap.exists()) {
          await setDoc(userDoc, {
            email: u.email || "",
            displayName: u.displayName || "",
            createdAt: serverTimestamp(),
          });
        }
      }
    });
    return () => unsub();
  }, []);

  const login = async (email, password) => {
    const formattedEmail = email.toLowerCase().trim();
    localStorage.setItem("pasoja_customer_logged_in", "true");

    // 1. Check if user document exists in Firestore and has custom password stored
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", formattedEmail));
    const querySnap = await getDocs(q);

    if (!querySnap.empty) {
      const userDoc = querySnap.docs[0];
      const userData = userDoc.data();

      if (userData.password) {
        if (userData.password === password) {
          // If password matches Firestore, sign into Firebase Auth using bypass key
          const bypassPassword = "PasojaSecureBypassKey2026_" + formattedEmail;
          try {
            const cred = await signInWithEmailAndPassword(auth, formattedEmail, bypassPassword);
            return cred;
          } catch (bypassErr) {
            // Custom auth fallback for users whose Firebase Auth password isn't updated yet
            const customUser = {
              uid: userDoc.id,
              email: formattedEmail,
              displayName: userData.displayName || "",
              isCustomAuth: true
            };
            localStorage.setItem("pasoja_custom_user", JSON.stringify(customUser));
            setUser(customUser);
            return { user: customUser };
          }
        } else {
          throw new Error("auth/wrong-password");
        }
      }
    }

    // 2. Fallback: try standard login (for older accounts not yet migrated)
    try {
      const cred = await signInWithEmailAndPassword(auth, formattedEmail, password);
      // Migrate user to bypass key
      const userDocRef = doc(db, "users", cred.user.uid);
      await setDoc(userDocRef, {
        email: formattedEmail,
        password: password,
      }, { merge: true });

      try {
        await updatePassword(cred.user, "PasojaSecureBypassKey2026_" + formattedEmail);
      } catch (err) {
        console.error("Migration password update failed:", err);
      }

      return cred;
    } catch (err) {
      throw err;
    }
  };

  const signup = async (email, password, displayName) => {
    const formattedEmail = email.toLowerCase().trim();
    localStorage.setItem("pasoja_customer_logged_in", "true");
    const bypassPassword = "PasojaSecureBypassKey2026_" + formattedEmail;

    const cred = await createUserWithEmailAndPassword(auth, formattedEmail, bypassPassword);
    await updateProfile(cred.user, { displayName });

    const userDoc = doc(db, "users", cred.user.uid);
    await setDoc(userDoc, {
      email: formattedEmail,
      displayName: displayName || "",
      password: password,
      createdAt: serverTimestamp(),
    });
    return cred;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    localStorage.setItem("pasoja_customer_logged_in", "true");
    try {
      const cred = await signInWithPopup(auth, provider);
      const userDoc = doc(db, "users", cred.user.uid);
      const snap = await getDoc(userDoc);
      if (!snap.exists()) {
        await setDoc(userDoc, {
          email: cred.user.email?.toLowerCase().trim() || "",
          displayName: cred.user.displayName || "",
          createdAt: serverTimestamp(),
        });
      }
      return cred;
    } catch (err) {
      console.error("Google authentication failed:", err);
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem("pasoja_custom_user");
    localStorage.removeItem("pasoja_customer_logged_in");
    setUser(null);
    await signOut(auth);
  };

  const resetPassword = async (email, newPassword) => {
    const formattedEmail = email.toLowerCase().trim();
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", formattedEmail));
    const querySnap = await getDocs(q);

    if (querySnap.empty) {
      throw new Error("auth/user-not-found");
    }

    const userDoc = querySnap.docs[0];
    const userDocRef = doc(db, "users", userDoc.id);
    await setDoc(userDocRef, { password: newPassword }, { merge: true });
  };

  const value = { user, loading, login, signup, loginWithGoogle, logout, resetPassword };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
