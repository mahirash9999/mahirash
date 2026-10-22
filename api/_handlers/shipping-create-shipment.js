import { createShiprocketOrder } from "../_lib/shiprocketClient.js";
import { getFirestoreDb } from "../_lib/firestoreClient.js";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    orderId,
    orderDate,
    customerName,
    email,
    phone,
    address,
    city,
    state,
    pincode,
    paymentMethod,
    totalAmount,
    items,
    packageInfo
  } = req.body || {};

  if (!orderId) {
    return res.status(400).json({ error: "orderId is required" });
  }

  try {
    const nameParts = (customerName || "Customer").trim().split(" ");
    const firstName = nameParts[0] || "Customer";
    const lastName = nameParts.slice(1).join(" ") || "Client";

    const payload = {
      order_id: String(orderId),
      order_date: orderDate || new Date().toISOString().replace("T", " ").substring(0, 16),
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: address || "Mahirash Client Address",
      billing_city: city || "Indore",
      billing_pincode: pincode || "452001",
      billing_state: state || "Madhya Pradesh",
      billing_country: "India",
      billing_email: email || "concierge@mahirash.com",
      billing_phone: phone || "9876543210",
      shipping_is_billing: true,
      order_items: (items || []).map(item => ({
        name: item.name || "Artisanal Fragrance",
        sku: item.sku || "MHR-PARFUM",
        units: Number(item.units || item.quantity) || 1,
        selling_price: String(item.price || "0")
      })),
      payment_method: paymentMethod === "COD" ? "COD" : "Prepaid",
      sub_total: Number(totalAmount) || 0,
      length: Number(packageInfo?.length) || 12,
      width: Number(packageInfo?.breadth) || 12,
      height: Number(packageInfo?.height) || 8,
      weight: Number(packageInfo?.weight) || 0.5
    };

    const shiprocketResult = await createShiprocketOrder(payload);

    // Save shipment info to Firestore order document if DB is available
    try {
      const db = await getFirestoreDb();
      if (db) {
        const orderRef = doc(db, "orders", orderId);
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const currentData = orderSnap.data();
          const activityLog = Array.isArray(currentData.activityLog) ? [...currentData.activityLog] : [];
          activityLog.push({
            actor: "System / Shiprocket",
            action: "Shipment Created",
            timestamp: new Date().toISOString(),
            details: `Shipment ID: ${shiprocketResult.shipmentId}, AWB: ${shiprocketResult.awbCode || "Pending assignment"}`
          });

          await updateDoc(orderRef, {
            shipmentId: shiprocketResult.shipmentId || "",
            awbCode: shiprocketResult.awbCode || currentData.awbCode || "",
            courierName: shiprocketResult.courierName || currentData.courierName || "",
            trackingUrl: shiprocketResult.trackingUrl || currentData.trackingUrl || "",
            shipmentStatus: shiprocketResult.awbCode ? "AWB Generated" : "Shipment Created",
            fulfilmentStatus: "Ready to Ship",
            activityLog,
            updatedAt: new Date().toISOString()
          });
        }
      }
    } catch (dbErr) {
      console.warn("[api/shipping/create-shipment] Notice updating Firestore order:", dbErr.message);
    }

    return res.status(200).json({
      success: true,
      ...shiprocketResult
    });
  } catch (err) {
    console.error("[api/shipping/create-shipment] Error:", err.message);
    return res.status(500).json({
      success: false,
      error: "Failed to create shipment in Shiprocket",
      message: err.message
    });
  }
}
