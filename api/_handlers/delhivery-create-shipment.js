import { createDelhiveryShipment } from "../_lib/delhiveryClient.js";
import { getFirestoreDb } from "../_lib/firestoreClient.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { sendShipmentDispatchedEmail } from "../_lib/email.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const {
    orderId,
    warehouse,
    packageInfo = { weight: 0.5, length: 15, breadth: 12, height: 10 }
  } = req.body || {};

  if (!orderId) {
    return res.status(400).json({ error: "orderId is required" });
  }

  try {
    const db = await getFirestoreDb();
    if (!db) {
      throw new Error("Database connection unavailable.");
    }

    const orderRef = doc(db, "orders", orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return res.status(404).json({ error: `Order #${orderId} does not exist.` });
    }

    const orderData = orderSnap.data();

    // ── Idempotency Check: Prevent duplicate shipment creation ──
    if (orderData.awbCode && orderData.shipmentStatus !== "Shipment Cancelled") {
      return res.status(200).json({
        success: true,
        alreadyCreated: true,
        waybill: orderData.awbCode,
        awbCode: orderData.awbCode,
        courierName: orderData.courierName || "Delhivery Express",
        trackingUrl: orderData.trackingUrl || `https://www.delhivery.com/track/package/${orderData.awbCode}`,
        message: `Shipment already manifested with AWB: ${orderData.awbCode}`
      });
    }

    // Call Delhivery API to create shipment
    const shipmentResult = await createDelhiveryShipment({
      order: { id: orderSnap.id, ...orderData },
      packageInfo,
      warehouse
    });

    const waybill = shipmentResult.waybill || shipmentResult.awbCode;

    // Update Firestore order document
    const activityLog = Array.isArray(orderData.activityLog) ? [...orderData.activityLog] : [];
    activityLog.push({
      actor: "Admin / Delhivery One",
      action: "Shipment Created (Delhivery Express)",
      timestamp: new Date().toISOString(),
      details: `AWB: ${waybill}, Pickup Facility: ${shipmentResult.pickupLocation || "Indore"}`
    });

    const updatePayload = {
      awbCode: waybill,
      trackingNumber: waybill,
      shipmentId: waybill,
      courierName: "Delhivery Express",
      shippingCarrier: "Delhivery Express",
      trackingUrl: shipmentResult.trackingUrl || `https://www.delhivery.com/track/package/${waybill}`,
      shipmentStatus: "Shipment Created",
      internalStatus: orderData.internalStatus === "Ready to Dispatch" ? "Dispatched" : (orderData.internalStatus || "Dispatched"),
      fulfilmentStatus: "Manifested",
      activityLog,
      dispatchedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await updateDoc(orderRef, updatePayload);

    // Send transactional shipment email to customer asynchronously
    try {
      await sendShipmentDispatchedEmail({
        order: {
          ...orderData,
          ...updatePayload,
          id: orderSnap.id,
          orderNumber: orderData.orderNumber || orderId
        }
      });
    } catch (mailErr) {
      console.warn("[delhivery-create-shipment] Notice sending dispatched email:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      ...shipmentResult
    });
  } catch (err) {
    console.error("[api/delhivery-create-shipment] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message || "Failed to create shipment in Delhivery"
    });
  }
}

