import { requestShiprocketPickup } from "../_lib/shiprocketClient.js";
import { getFirestoreDb } from "../_lib/firestoreClient.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderId, shipmentId, pickupDate } = req.body;

  if (!shipmentId && !orderId) {
    return res.status(400).json({ error: "shipmentId or orderId is required" });
  }

  try {
    let resolvedShipmentId = shipmentId;
    let orderRef = null;

    if (orderId) {
      try {
        const db = await getFirestoreDb();
        if (db) {
          orderRef = doc(db, "orders", orderId);
          const snap = await getDoc(orderRef);
          if (snap.exists()) {
            const data = snap.data();
            resolvedShipmentId = resolvedShipmentId || data.shipmentId;
          }
        }
      } catch (_) {}
    }

    const pickupResult = await requestShiprocketPickup({
      shipmentId: resolvedShipmentId || "SIM_0001",
      pickupDate
    });

    if (orderRef) {
      try {
        await updateDoc(orderRef, {
          shipmentStatus: "Pickup Scheduled",
          fulfilmentStatus: "Ready to Ship",
          pickupScheduledAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn("[api/shipping/request-pickup] DB update notice:", dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      ...pickupResult
    });
  } catch (err) {
    console.error("[api/shipping/request-pickup] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to request courier pickup",
      message: err.message
    });
  }
}
