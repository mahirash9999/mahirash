import { assignShiprocketCourier } from "../_lib/shiprocketClient.js";
import { getFirestoreDb } from "../_lib/firestoreClient.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderId, shipmentId, courierId } = req.body;

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

    const assignResult = await assignShiprocketCourier({
      shipmentId: resolvedShipmentId || "SIM_0001",
      courierId
    });

    if (orderRef && assignResult.awbCode) {
      try {
        await updateDoc(orderRef, {
          awbCode: assignResult.awbCode,
          courierName: assignResult.courierName || "Delhivery",
          shipmentStatus: "AWB Generated",
          fulfilmentStatus: "Ready to Ship",
          trackingUrl: `https://shiprocket.co/tracking/${assignResult.awbCode}`,
          updatedAt: new Date().toISOString()
        });
      } catch (dbErr) {
        console.warn("[api/shipping/assign-courier] DB update notice:", dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      ...assignResult
    });
  } catch (err) {
    console.error("[api/shipping/assign-courier] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to assign courier and generate AWB",
      message: err.message
    });
  }
}
