import { normalizeEmail, verifyClientIdentity } from "./_lib/firebaseAdmin.js";
import { getFirestoreDb } from "./_lib/firestoreClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Verify authenticated identity from Authorization header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Authorization header required" });
  }

  const identity = await verifyClientIdentity(authHeader);
  if (!identity || !identity.uid || !identity.email) {
    return res.status(401).json({ error: "Invalid or expired authentication credentials" });
  }

  const verifiedUid = identity.uid;
  const verifiedEmail = normalizeEmail(identity.email);

  if (!verifiedEmail) {
    return res.status(400).json({ error: "Authenticated identity does not possess a verified email" });
  }

  try {
    const db = await getFirestoreDb();
    if (!db) {
      return res.status(500).json({ error: "Database service temporarily unavailable" });
    }

    const { collection, query, where, getDocs, doc, updateDoc, writeBatch } = await import("firebase/firestore");

    // Query orders matching this email by customerEmail or userEmail
    const ordersRef = collection(db, "orders");
    const [snapCustomerEmail, snapUserEmail] = await Promise.all([
      getDocs(query(ordersRef, where("customerEmail", "==", verifiedEmail))),
      getDocs(query(ordersRef, where("userEmail", "==", verifiedEmail)))
    ]);

    // Deduplicate docs
    const candidateDocs = new Map();
    snapCustomerEmail.docs.forEach(d => candidateDocs.set(d.id, d));
    snapUserEmail.docs.forEach(d => candidateDocs.set(d.id, d));

    let linkedCount = 0;
    const nowIso = new Date().toISOString();

    for (const [orderId, orderSnap] of candidateDocs.entries()) {
      const order = orderSnap.data();

      // Check if order is eligible for linking:
      // Must be either marked as isGuest: true, OR userId is null/empty/GUEST_
      const isGuestOrder =
        order.isGuest === true ||
        !order.userId ||
        (typeof order.userId === "string" && order.userId.startsWith("GUEST_"));

      // Security Check: If order is ALREADY claimed by another genuine user, leave unchanged
      if (!isGuestOrder && order.userId && order.userId !== verifiedUid) {
        continue;
      }

      // If already linked to this exact user, skip
      if (order.userId === verifiedUid && order.isGuest === false) {
        continue;
      }

      // Atomically claim the guest order for the authenticated user
      const targetOrderRef = doc(db, "orders", orderId);
      await updateDoc(targetOrderRef, {
        userId: verifiedUid,
        isGuest: false,
        linkedAt: nowIso
      });

      linkedCount++;
    }

    return res.status(200).json({
      success: true,
      message: `Successfully linked ${linkedCount} guest order(s) to your account`,
      linkedCount
    });
  } catch (err) {
    console.error("Link guest orders endpoint error:", err.message);
    return res.status(500).json({
      error: "Failed to link eligible guest orders. Please try again."
    });
  }
}
