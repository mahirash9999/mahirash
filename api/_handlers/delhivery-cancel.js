import { cancelDelhiveryShipment } from "../_lib/delhiveryClient.js";
import { getFirestoreDb } from "../_lib/firestoreClient.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const { orderId, waybill, reason = "Cancelled by Administrator" } = req.body || {};

  if (!waybill && !orderId) {
    return res.status(400).json({ error: "waybill or orderId is required." });
  }

  try {
    let targetWaybill = waybill;
    let orderRef = null;
    let orderData = null;

    const db = await getFirestoreDb();
    if (db && orderId) {
      orderRef = doc(db, "orders", orderId);
      const snap = await getDoc(orderRef);
      if (snap.exists()) {
        orderData = snap.data();
        targetWaybill = targetWaybill || orderData.awbCode || orderData.trackingNumber;
      }
    }

    if (!targetWaybill) {
      return res.status(400).json({ error: "No active AWB found for this order." });
    }

    const cancelResult = await cancelDelhiveryShipment(targetWaybill);

    if (orderRef) {
      const activityLog = Array.isArray(orderData?.activityLog) ? [...orderData.activityLog] : [];
      activityLog.push({
        actor: "Admin",
        action: "Shipment Cancelled",
        timestamp: new Date().toISOString(),
        details: `Delhivery AWB ${targetWaybill} cancelled. Reason: ${reason}`
      });

      await updateDoc(orderRef, {
        shipmentStatus: "Shipment Cancelled",
        internalStatus: "Cancelled",
        cancellationReason: reason,
        activityLog,
        updatedAt: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      waybill: targetWaybill,
      ...cancelResult
    });
  } catch (err) {
    console.error("[api/delhivery-cancel] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to cancel shipment with Delhivery"
    });
  }
}

