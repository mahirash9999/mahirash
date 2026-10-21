import { getFirestoreDb } from "./_lib/firestoreClient.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    orderId,
    actor = "Admin",
    reason = "",
    orderStatus,
    fulfilmentStatus,
    shipmentStatus,
    paymentStatus,
    returnStatus
  } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "orderId is required" });
  }

  try {
    const db = await getFirestoreDb();
    if (!db) {
      return res.status(500).json({ error: "Database temporarily unavailable" });
    }

    const orderRef = doc(db, "orders", orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) {
      return res.status(404).json({ error: "Order not found" });
    }

    const currentData = snap.data();
    const updates = { updatedAt: new Date().toISOString() };
    const changes = [];

    if (orderStatus && orderStatus !== currentData.orderStatus) {
      updates.orderStatus = orderStatus;
      updates.status = orderStatus.toLowerCase();
      changes.push(`Order status: ${currentData.orderStatus || currentData.status} -> ${orderStatus}`);
    }

    if (fulfilmentStatus && fulfilmentStatus !== currentData.fulfilmentStatus) {
      updates.fulfilmentStatus = fulfilmentStatus;
      changes.push(`Fulfilment status: ${currentData.fulfilmentStatus || "Unfulfilled"} -> ${fulfilmentStatus}`);
    }

    if (shipmentStatus && shipmentStatus !== currentData.shipmentStatus) {
      updates.shipmentStatus = shipmentStatus;
      changes.push(`Shipment status: ${currentData.shipmentStatus || "Not Created"} -> ${shipmentStatus}`);
    }

    if (paymentStatus && paymentStatus !== currentData.paymentStatus) {
      updates.paymentStatus = paymentStatus;
      changes.push(`Payment status: ${currentData.paymentStatus || "Pending"} -> ${paymentStatus}`);
    }

    if (returnStatus && returnStatus !== currentData.returnStatus) {
      updates.returnStatus = returnStatus;
      changes.push(`Return status: ${currentData.returnStatus || "Not Requested"} -> ${returnStatus}`);
    }

    if (changes.length === 0) {
      return res.status(200).json({ success: true, message: "No status changes detected" });
    }

    // Append to audit log
    const activityLog = Array.isArray(currentData.activityLog) ? [...currentData.activityLog] : [];
    activityLog.push({
      actor,
      timestamp: new Date().toISOString(),
      reason: reason || "Operational update by administrator",
      changes
    });
    updates.activityLog = activityLog;

    await updateDoc(orderRef, updates);

    return res.status(200).json({
      success: true,
      orderId,
      changes,
      updatedAt: updates.updatedAt
    });
  } catch (err) {
    console.error("[api/admin-order-status] Error:", err.message);
    return res.status(500).json({ error: "Failed to update order status", details: err.message });
  }
}
