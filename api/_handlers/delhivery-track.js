import { trackDelhiveryWaybill } from "../_lib/delhiveryClient.js";
import { getFirestoreDb } from "../_lib/firestoreClient.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use GET or POST." });
  }

  const waybill = req.query?.waybill || req.body?.waybill;
  const refId = req.query?.refId || req.query?.orderNumber || req.body?.refId;
  const orderId = req.query?.orderId || req.body?.orderId;

  if (!waybill && !refId && !orderId) {
    return res.status(400).json({ error: "waybill, refId, or orderId is required." });
  }

  try {
    let targetWaybill = waybill;
    let targetRef = refId;
    let orderDocRef = null;
    let orderData = null;

    if (orderId) {
      const db = await getFirestoreDb();
      if (db) {
        orderDocRef = doc(db, "orders", orderId);
        const snap = await getDoc(orderDocRef);
        if (snap.exists()) {
          orderData = snap.data();
          targetWaybill = targetWaybill || orderData.awbCode || orderData.trackingNumber;
          targetRef = targetRef || orderData.orderNumber;
        }
      }
    }

    const trackingResult = await trackDelhiveryWaybill(targetWaybill, targetRef);

    // If Firestore doc is available and status progressed, sync shipment status
    if (orderDocRef && trackingResult.success && trackingResult.mappedStatus) {
      try {
        if (orderData && orderData.shipmentStatus !== trackingResult.mappedStatus) {
          await updateDoc(orderDocRef, {
            shipmentStatus: trackingResult.mappedStatus,
            lastTrackingSync: new Date().toISOString()
          });
        }
      } catch (syncErr) {
        console.warn("[delhivery-track] Sync notice:", syncErr.message);
      }
    }

    return res.status(200).json(trackingResult);
  } catch (err) {
    console.error("[api/delhivery-track] Tracking error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to retrieve tracking from Delhivery"
    });
  }
}

