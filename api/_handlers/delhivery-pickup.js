import { requestDelhiveryPickup } from "../_lib/delhiveryClient.js";
import { getFirestoreDb } from "../_lib/firestoreClient.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const {
    orderId,
    pickup_date,
    pickup_time,
    expected_package_count = 1,
    pickup_location
  } = req.body || {};

  try {
    const result = await requestDelhiveryPickup({
      pickup_date,
      pickup_time,
      expected_package_count,
      pickup_location
    });

    if (orderId && result.success) {
      try {
        const db = await getFirestoreDb();
        if (db) {
          const orderRef = doc(db, "orders", orderId);
          const snap = await getDoc(orderRef);
          if (snap.exists()) {
            const current = snap.data();
            const activityLog = Array.isArray(current.activityLog) ? [...current.activityLog] : [];
            activityLog.push({
              actor: "Admin / Delhivery One",
              action: "Pickup Scheduled",
              timestamp: new Date().toISOString(),
              details: `PUR ID: ${result.pickupId}, Date: ${result.pickupDate} ${result.pickupTime}`
            });

            await updateDoc(orderRef, {
              pickupId: result.pickupId,
              shipmentStatus: "Pickup Scheduled",
              pickupScheduledDate: result.pickupDate,
              activityLog,
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (dbErr) {
        console.warn("[delhivery-pickup] DB notice:", dbErr.message);
      }
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error("[api/delhivery-pickup] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to schedule Delhivery pickup"
    });
  }
}

