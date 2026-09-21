import React, { createContext, useContext, useState, useEffect } from "react";
import { db } from "./Firebase";
import { collection, query, where, getDocs, setDoc, getDoc, doc, serverTimestamp } from "firebase/firestore";

// ─── Context ─────────────────────────────────────────────────────────────────
export const CustomerAuthContext = createContext(null);

export const useCustomerAuth = () => {
    const ctx = useContext(CustomerAuthContext);
    if (!ctx) throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
    return ctx;
};

// ─── OTP Send Helper ──────────────────────────────────────────────────────────
export const sendOTPEmail = async (email, otp, name = "") => {
    try {
        const response = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                type: "otp",
                to_email: email,
                to_name: name || email,
                otp_code: otp
            })
        });

        if (response.ok) {
            console.log("OTP email sent successfully.");
        } else {
            console.error("OTP email delivery failed.");
        }
    } catch (err) {
        console.error("OTP email delivery failed:", err);
    }
};

// ─── Lookup customer by email ─────────────────────────────────────────────────
// Priority: customers collection → orders collection (auto-migration fallback)
export const findCustomerByEmail = async (email) => {
    const cleanEmail = email.toLowerCase().trim();
    const customerDocId = cleanEmail.replace(/[^a-z0-9]/g, "_");
    const customerRef = doc(db, "customers", customerDocId);

    // 1. Check customers collection first
    try {
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
            return { id: customerSnap.id, ...customerSnap.data() };
        }
    } catch (_) { /* try fallback */ }

    // 2. Fallback: scan orders for any order with this email
    //    (auto-migrates customers who ordered before the customers collection existed)
    try {
        const ordersSnap = await getDocs(
            query(collection(db, "orders"), where("userEmail", "==", cleanEmail))
        );

        if (!ordersSnap.empty) {
            const sorted = [...ordersSnap.docs].sort((a, b) => {
                const tA = a.data().createdAt?.toMillis?.() ?? 0;
                const tB = b.data().createdAt?.toMillis?.() ?? 0;
                return tB - tA;
            });
            const shipping = sorted[0].data().shipping || {};

            const customerData = {
                email: cleanEmail,
                name: shipping.name || cleanEmail.split("@")[0],
                phone: shipping.phone || "",
                address: shipping.address || "",
                city: shipping.city || "",
                state: shipping.state || "",
                pincode: shipping.pincode || "",
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            // Auto-create profile for fast future logins
            try { await setDoc(customerRef, customerData); } catch (_) { }

            return { id: customerDocId, ...customerData };
        }
    } catch (_) { }

    return null; // Email not found
};

// ─── Provider ─────────────────────────────────────────────────────────────────
const CustomerAuthProvider = ({ children }) => {
    const [customer, setCustomer] = useState(null);
    const [loadingCustomer, setLoadingCustomer] = useState(true);

    useEffect(() => {
        try {
            const saved = localStorage.getItem("pasoja_customer_session");
            if (saved) setCustomer(JSON.parse(saved));
        } catch (_) { }
        setLoadingCustomer(false);
    }, []);

    const customerLogin = (customerData) => {
        const session = {
            id: customerData.id,
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
