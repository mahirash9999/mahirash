import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "./Firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "./useAuth";

export const CustomerAuthContext = createContext(null);

export const useCustomerAuth = () => {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
  return ctx;
};

/**
 * Server-side OTP dispatch helper
 */
export const sendOTPEmail = async (email, name = "") => {
  const res = await fetch("/api/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.toLowerCase().trim(),
      name: name || ""
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Failed to send verification code");
  }
  return data;
};

/**
 * Server-side OTP verification helper
 */
export const verifyOTPCode = async (email, otp) => {
  const res = await fetch("/api/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.toLowerCase().trim(),
      otp: String(otp).trim()
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Invalid verification code");
  }
  return data;
};

/**
 * Lookup customer profile in Firestore
 */
export const findCustomerByEmail = async (email) => {
  const cleanEmail = email.toLowerCase().trim();
  const customerDocId = cleanEmail.replace(/[^a-z0-9]/g, "_");
  const customerRef = doc(db, "customers", customerDocId);

  try {
    const customerSnap = await getDoc(customerRef);
    if (customerSnap.exists()) {
      return { id: customerSnap.id, ...customerSnap.data() };
    }
  } catch (_) { }

  return null;
};

const CustomerAuthProvider = ({ children }) => {
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  // Synchronize customer session whenever Firebase Auth user changes
  useEffect(() => {
    const syncSession = async () => {
      if (user) {
        const cleanEmail = (user.email || "").toLowerCase().trim();
        const customerDocId = cleanEmail.replace(/[^a-z0-9]/g, "_");
        let profile = null;

        try {
          const snap = await getDoc(doc(db, "customers", customerDocId));
          if (snap.exists()) {
            profile = snap.data();
          }
        } catch (_) { }

        const session = {
          id: user.uid,
          uid: user.uid,
          email: cleanEmail,
          name: profile?.name || user.displayName || cleanEmail.split("@")[0],
          phone: profile?.phone || "",
          address: profile?.address || "",
          city: profile?.city || "",
          state: profile?.state || "",
          pincode: profile?.pincode || ""
        };

        localStorage.setItem("pasoja_customer_session", JSON.stringify(session));
        setCustomer(session);
      } else {
        const saved = localStorage.getItem("pasoja_customer_session");
        if (saved) {
          try {
            setCustomer(JSON.parse(saved));
          } catch (_) {
            setCustomer(null);
          }
        } else {
          setCustomer(null);
        }
      }
      setLoadingCustomer(false);
    };

    syncSession();
  }, [user]);

  const customerLogin = (customerData) => {
    const session = {
      id: customerData.id || customerData.uid,
      uid: customerData.uid || customerData.id,
      email: customerData.email,
      name: customerData.name || customerData.fullName || "",
      phone: customerData.phone || "",
      address: customerData.address || "",
      city: customerData.city || "",
      state: customerData.state || "",
      pincode: customerData.pincode || "",
    };
    localStorage.setItem("pasoja_customer_session", JSON.stringify(session));
    setCustomer(session);
  };

  const customerLogout = () => {
    localStorage.removeItem("pasoja_customer_session");
    setCustomer(null);
  };

  const value = { customer, loadingCustomer, customerLogin, customerLogout };
  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
};

export default CustomerAuthProvider;
