import { trackShiprocketAwb } from "../_lib/shiprocketClient.js";
import { getFirestoreDb } from "../_lib/firestoreClient.js";
import { doc, getDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const awb = req.query?.awb || req.body?.awb;
  const orderId = req.query?.orderId || req.body?.orderId;

  if (!awb && !orderId) {
    return res.status(400).json({ error: "awb or orderId is required" });
  }

  try {
    let targetAwb = awb;
    let orderInfo = null;

    if (orderId) {
      try {
        const db = await getFirestoreDb();
        if (db) {
          const snap = await getDoc(doc(db, "orders", orderId));
          if (snap.exists()) {
            orderInfo = { id: snap.id, ...snap.data() };
            targetAwb = targetAwb || orderInfo.awbCode;
          }
        }
      } catch (err) {
        console.warn("[api/shipping/track] Firestore read notice:", err.message);
      }
    }

    if (!targetAwb) {
      return res.status(200).json({
        success: true,
        orderId,
        currentStatus: orderInfo?.status || "Confirmed",
        shipmentStatus: orderInfo?.shipmentStatus || "Preparing for courier handover",
        estimatedDelivery: "Will be updated once dispatched",
        scans: [
          {
            date: orderInfo?.createdAt?.toDate ? orderInfo.createdAt.toDate().toISOString() : new Date().toISOString(),
            activity: "Order verified and reserved at Mahirash Atelier",
            location: "Atelier Warehouse",
            status: "Order Confirmed"
          }
        ]
      });
    }

    const trackingResult = await trackShiprocketAwb(targetAwb);
    return res.status(200).json({
      success: true,
      orderId,
      ...trackingResult
    });
  } catch (err) {
    console.error("[api/shipping/track] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Could not retrieve live tracking data",
      message: err.message
    });
  }
}
