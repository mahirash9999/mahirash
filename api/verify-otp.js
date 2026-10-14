import { normalizeEmail, verifyOtpRecord, createFirebaseAuthBridge } from "./_lib/firebaseAdmin.js";
import { getFirestoreDb } from "./_lib/firestoreClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, otp } = req.body || {};

  if (!email || !otp) {
    return res.status(400).json({ error: "Email and verification code are required" });
  }

  const cleanEmail = normalizeEmail(email);
  const cleanOtp = String(otp).trim();

  if (!/^\d{6}$/.test(cleanOtp)) {
    return res.status(400).json({ error: "Verification code must be exactly 6 digits" });
  }

  try {
    // 1. Verify OTP with brute-force & replay protection
    const verification = await verifyOtpRecord({ email: cleanEmail, otp: cleanOtp });
    if (!verification.valid) {
      return res.status(400).json({
        error: verification.reason || "Invalid or expired verification code"
      });
    }

    // 2. Check if user already exists in Firestore customers / users collections
    let isNewUser = true;
    let existingUser = null;
    let existingUid = null;

    try {
      const db = await getFirestoreDb();
      if (db) {
        const { doc, getDoc, collection, query, where, getDocs } = await import("firebase/firestore");

        // Check customers collection
        const customerDocId = cleanEmail.replace(/[^a-z0-9]/g, "_");
        const customerSnap = await getDoc(doc(db, "customers", customerDocId));
        if (customerSnap.exists()) {
          isNewUser = false;
          existingUser = customerSnap.data();
          existingUid = existingUser.uid || null;
        }

        // Also check users collection if uid not found
        if (!existingUid) {
          const usersSnap = await getDocs(query(collection(db, "users"), where("email", "==", cleanEmail)));
          if (!usersSnap.empty) {
            isNewUser = false;
            const uDoc = usersSnap.docs[0];
            existingUid = uDoc.id;
            if (!existingUser) existingUser = uDoc.data();
          }
        }
      }
    } catch (dbErr) {
      console.warn("User lookup notice in verify-otp:", dbErr.message);
    }

    // 3. Establish authentic Firebase session bridge
    const bridge = await createFirebaseAuthBridge(cleanEmail, existingUid);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      isNewUser,
      customToken: bridge.customToken,
      identityToken: bridge.identityToken,
      user: {
        uid: bridge.uid,
        email: cleanEmail,
        name: existingUser?.name || existingUser?.displayName || cleanEmail.split("@")[0]
      }
    });
  } catch (err) {
    console.error("Verify OTP endpoint error:", err.message);
    return res.status(500).json({
      error: "Verification failed. Please try again."
    });
  }
}
