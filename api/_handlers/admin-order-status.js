import { getFirestoreDb } from "../_lib/firestoreClient.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { sendShipmentDispatchedEmail, sendOrderDeliveredEmail, sendOrderCancelledEmail } from "../_lib/email.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    orderId,
    actor = "Admin",
    reason = "",
    orderStatus,
    internalStatus,
    fulfilmentStatus,
    shipmentStatus,
    paymentStatus,
    returnStatus
  } = req.body || {};

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

    if (internalStatus && internalStatus !== currentData.internalStatus) {
      updates.internalStatus = internalStatus;
      changes.push(`Internal status: ${currentData.internalStatus || "Payment Confirmed"} -> ${internalStatus}`);
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

    // Trigger transactional emails asynchronously based on new status
    const mergedOrder = { id: orderId, ...currentData, ...updates };
    try {
      if (
        (shipmentStatus === "Delivered" || orderStatus === "Completed" || orderStatus === "Delivered") &&
        currentData.shipmentStatus !== "Delivered" &&
        currentData.orderStatus !== "Completed"
      ) {
        sendOrderDeliveredEmail({ order: mergedOrder }).catch(e => console.warn("[admin-order-status] Delivered email err:", e.message));
      } else if (
        (orderStatus === "Cancelled" || shipmentStatus === "Shipment Cancelled") &&
        currentData.orderStatus !== "Cancelled" &&
        currentData.shipmentStatus !== "Shipment Cancelled"
      ) {
        sendOrderCancelledEmail({ order: mergedOrder, reason }).catch(e => console.warn("[admin-order-status] Cancelled email err:", e.message));
      } else if (
        (orderStatus === "Dispatched" || shipmentStatus === "In Transit" || shipmentStatus === "Picked Up") &&
        currentData.orderStatus !== "Dispatched" &&
        mergedOrder.awbCode
      ) {
        sendShipmentDispatchedEmail({ order: mergedOrder }).catch(e => console.warn("[admin-order-status] Dispatched email err:", e.message));
      }
    } catch (mailErr) {
      console.warn("[admin-order-status] Email notification error:", mailErr.message);
    }

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
