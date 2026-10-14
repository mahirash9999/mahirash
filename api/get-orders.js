import { normalizeEmail, verifyClientIdentity } from "./lib/firebaseAdmin.js";
import { getFirestoreDb } from "./lib/firestoreClient.js";

export default async function handler(req, res) {
  // Support both GET and POST
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Extract email and userId from query params, body, or authorization header
  let email = req.query?.email || req.body?.email || "";
  let userId = req.query?.userId || req.body?.userId || "";

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader) {
    try {
      const identity = await verifyClientIdentity(authHeader);
      if (identity) {
        if (!userId && identity.uid) userId = identity.uid;
        if (!email && identity.email) email = identity.email;
      }
    } catch (_) {}
  }

  const cleanEmail = normalizeEmail(email);
  const cleanUid = String(userId || "").trim();

  if (!cleanEmail && !cleanUid) {
    return res.status(400).json({ error: "Email or User ID is required to fetch orders." });
  }

  try {
    const db = await getFirestoreDb();
    if (!db) {
      return res.status(500).json({ error: "Database service temporarily unavailable" });
    }

    const { collection, query, where, getDocs, doc, updateDoc } = await import("firebase/firestore");
    const ordersRef = collection(db, "orders");
    const ordersMap = new Map();

    const queryPromises = [];

    // Query 1: by userId
    if (cleanUid) {
      queryPromises.push(
        getDocs(query(ordersRef, where("userId", "==", cleanUid)))
          .then(snap => snap.docs.forEach(d => ordersMap.set(d.id, { id: d.id, ...d.data() })))
          .catch(e => console.warn("Orders query by userId notice:", e.message))
      );
    }

    // Query 2 & 3: by customerEmail and userEmail
    if (cleanEmail) {
      queryPromises.push(
        getDocs(query(ordersRef, where("customerEmail", "==", cleanEmail)))
          .then(snap => snap.docs.forEach(d => {
            if (!ordersMap.has(d.id)) {
              ordersMap.set(d.id, { id: d.id, ...d.data() });
            }
          }))
          .catch(e => console.warn("Orders query by customerEmail notice:", e.message))
      );

      queryPromises.push(
        getDocs(query(ordersRef, where("userEmail", "==", cleanEmail)))
          .then(snap => snap.docs.forEach(d => {
            if (!ordersMap.has(d.id)) {
              ordersMap.set(d.id, { id: d.id, ...d.data() });
            }
          }))
          .catch(e => console.warn("Orders query by userEmail notice:", e.message))
      );
    }

    await Promise.all(queryPromises);

    // Auto-link any guest orders to cleanUid if user is logged in
    if (cleanUid && cleanEmail) {
      for (const [orderId, order] of ordersMap.entries()) {
        if (order.isGuest === true || !order.userId || order.userId.startsWith?.("GUEST_")) {
          try {
            await updateDoc(doc(db, "orders", orderId), {
              userId: cleanUid,
              isGuest: false,
              linkedAt: new Date().toISOString()
            });
            order.userId = cleanUid;
            order.isGuest = false;
          } catch (linkErr) {
            console.warn("Order auto-link update notice:", linkErr.message);
          }
        }
      }
    }

    // Convert map to sorted array
    const ordersList = Array.from(ordersMap.values());
    ordersList.sort((a, b) => {
      const getMillis = (obj) => {
        if (!obj) return 0;
        if (typeof obj.toMillis === "function") return obj.toMillis();
        if (typeof obj.toDate === "function") return obj.toDate().getTime();
        if (obj instanceof Date) return obj.getTime();
        if (typeof obj === "string" || typeof obj === "number") {
          const t = new Date(obj).getTime();
          return isNaN(t) ? 0 : t;
        }
        return 0;
      };
      return getMillis(b.createdAt) - getMillis(a.createdAt);
    });

    return res.status(200).json({
      success: true,
      count: ordersList.length,
      orders: ordersList
    });
  } catch (err) {
    console.error("Get orders endpoint error:", err.message);
    return res.status(500).json({ error: "Failed to load orders", details: err.message });
  }
}
