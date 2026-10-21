import { normalizeShipmentStatus } from "../_lib/shiprocketClient.js";
import { getFirestoreDb } from "../_lib/firestoreClient.js";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

// Rank hierarchy to prevent stale or out-of-order events from regressing status
const SHIPMENT_STATUS_RANK = {
  "Not Created": 0,
  "Shipment Created": 1,
  "AWB Generated": 2,
  "Pickup Scheduled": 3,
  "Picked Up": 4,
  "In Transit": 5,
  "Out for Delivery": 6,
  "Delivered": 7,
  "Delivery Exception": 5.5,
  "RTO Initiated": 5.8,
  "RTO Delivered": 7.5,
  "Cancelled": 10
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Verify Shiprocket webhook token if configured
  const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET || process.env.VITE_SHIPROCKET_WEBHOOK_SECRET;
  const incomingToken = req.headers["x-api-key"] || req.headers["authorization"];
  if (webhookSecret && incomingToken && incomingToken !== webhookSecret && incomingToken !== `Bearer ${webhookSecret}`) {
    console.warn("[webhooks/shipping] Unauthorized webhook attempt");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = req.body;
  if (!payload) {
    return res.status(400).json({ error: "Empty payload" });
  }

  // Shiprocket sends awb, current_status, scans, order_id, shipment_id
  const awb = payload.awb || payload.awb_code;
  const orderId = payload.order_id || payload.orderId;
  const shipmentId = payload.shipment_id || payload.shipmentId;
  const rawStatus = payload.current_status || payload.status || payload.event;
  const location = payload.location || payload.current_location || "";
  const activity = payload.activity || payload.message || payload.scan_description || "";
  const eventDate = payload.event_date || payload.date || new Date().toISOString();

  if (!awb && !orderId && !shipmentId) {
    return res.status(400).json({ error: "No matching identifiers found in payload" });
  }

  try {
    const db = await getFirestoreDb();
    if (!db) {
      console.warn("[webhooks/shipping] Firestore DB unavailable, returning 200 to acknowledge webhook");
      return res.status(200).json({ success: true, processed: false, reason: "DB unavailable" });
    }

    const ordersRef = collection(db, "orders");
    let targetDoc = null;

    // Search order by orderId
    if (orderId) {
      try {
        const q = query(ordersRef, where("orderId", "==", String(orderId)));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetDoc = snap.docs[0];
        }
      } catch (_) {}
    }

    // Fallback: search by awbCode
    if (!targetDoc && awb) {
      try {
        const q = query(ordersRef, where("awbCode", "==", String(awb)));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetDoc = snap.docs[0];
        }
      } catch (_) {}
    }

    // Fallback: search by shipmentId
    if (!targetDoc && shipmentId) {
      try {
        const q = query(ordersRef, where("shipmentId", "==", String(shipmentId)));
        const snap = await getDocs(q);
        if (!snap.empty) {
          targetDoc = snap.docs[0];
        }
      } catch (_) {}
    }

    if (!targetDoc) {
      console.warn(`[webhooks/shipping] No matching order found for AWB: ${awb}, OrderID: ${orderId}`);
      return res.status(200).json({ success: true, matched: false });
    }

    const currentOrder = targetDoc.data();
    const normalizedNewStatus = normalizeShipmentStatus(rawStatus);

    // Prevent regression
    const currentRank = SHIPMENT_STATUS_RANK[currentOrder.shipmentStatus] || 0;
    const newRank = SHIPMENT_STATUS_RANK[normalizedNewStatus] || 0;
    const shouldUpdateStatus = newRank >= currentRank;

    // Check duplicate event to ensure idempotency
    const existingScans = Array.isArray(currentOrder.trackingHistory) ? currentOrder.trackingHistory : [];
    const eventHash = `${eventDate}_${normalizedNewStatus}_${location}_${activity}`;
    const isDuplicate = existingScans.some(s => s.hash === eventHash || (s.date === eventDate && s.status === normalizedNewStatus));

    const updatedScans = [...existingScans];
    if (!isDuplicate) {
      updatedScans.unshift({
        hash: eventHash,
        date: eventDate,
        status: normalizedNewStatus,
        rawStatus,
        activity: activity || `Shipment update: ${normalizedNewStatus}`,
        location,
        receivedAt: new Date().toISOString()
      });
    }

    // Also update fulfilment status if Delivered or Picked up
    let updatedFulfilment = currentOrder.fulfilmentStatus;
    let updatedOrderStatus = currentOrder.orderStatus || currentOrder.status;

    if (normalizedNewStatus === "Delivered") {
      updatedFulfilment = "Fulfilled";
      updatedOrderStatus = "Completed";
    } else if (normalizedNewStatus === "Picked Up" || normalizedNewStatus === "In Transit") {
      if (updatedFulfilment !== "Fulfilled") {
        updatedFulfilment = "Ready to Ship";
      }
    }

    const updates = {
      trackingHistory: updatedScans,
      updatedAt: new Date().toISOString()
    };

    if (shouldUpdateStatus) {
      updates.shipmentStatus = normalizedNewStatus;
      updates.fulfilmentStatus = updatedFulfilment;
      updates.orderStatus = updatedOrderStatus;
      updates.status = normalizedNewStatus === "Delivered" ? "delivered" : currentOrder.status;
    }

    if (awb && !currentOrder.awbCode) {
      updates.awbCode = awb;
    }

    await updateDoc(doc(db, "orders", targetDoc.id), updates);
    console.log(`[webhooks/shipping] Successfully updated order ${targetDoc.id} with status ${normalizedNewStatus}`);

    return res.status(200).json({
      success: true,
      orderId: targetDoc.id,
      status: normalizedNewStatus,
      updated: shouldUpdateStatus
    });
  } catch (err) {
    console.error("[webhooks/shipping] Error:", err.message);
    // Always return 200 to webhook caller to prevent endless retry storms on malformed payloads
    return res.status(200).json({ success: false, error: err.message });
  }
}
