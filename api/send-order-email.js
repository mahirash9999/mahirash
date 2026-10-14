import { sendEmail, renderOrderConfirmationEmail, renderAdminNewOrderEmail, getAdminEmail } from "./lib/email.js";
import { getFirestoreDb } from "./lib/firestoreClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { orderId, order: clientOrder } = req.body || {};

  if (!orderId && !clientOrder) {
    return res.status(400).json({ error: "Order ID or order details required" });
  }

  let authoritativeOrder = clientOrder || {};

  // If orderId is provided, attempt to load authoritative order document from Firestore
  let orderDocRef = null;
  try {
    const db = await getFirestoreDb();
    if (db && (orderId || clientOrder?.id)) {
      const idToLookup = orderId || clientOrder.id;
      const { doc, getDoc } = await import("firebase/firestore");
      orderDocRef = doc(db, "orders", idToLookup);
      const snap = await getDoc(orderDocRef);
      if (snap.exists()) {
        authoritativeOrder = { id: snap.id, ...snap.data() };
      }
    }
  } catch (err) {
    console.warn("Notice loading order from Firestore:", err.message);
  }

  const customerEmail = authoritativeOrder.customerEmail || authoritativeOrder.userEmail || authoritativeOrder.shipping?.email;

  if (!customerEmail) {
    return res.status(400).json({ error: "No customer email associated with this order" });
  }

  const orderNumber = authoritativeOrder.orderNumber || authoritativeOrder.id || orderId || "MHR-ORDER";
  let customerEmailSuccess = false;
  let adminEmailSuccess = false;

  // 1. Authoritative Server-side Stock Deduction in Firestore
  try {
    const { deductOrderStock } = await import("./lib/stockManager.js");
    if (Array.isArray(authoritativeOrder.items) && authoritativeOrder.items.length > 0) {
      await deductOrderStock(authoritativeOrder.items);
    }
  } catch (stkErr) {
    console.error("Server stock deduction error:", stkErr.message);
  }

  // 2. Send Customer Order Confirmation Email
  try {
    const customerHtml = renderOrderConfirmationEmail({ order: authoritativeOrder });
    await sendEmail({
      to: customerEmail.toLowerCase().trim(),
      subject: `Your Perfume Order Is Confirmed — #${orderNumber}`,
      html: customerHtml
    });
    customerEmailSuccess = true;
  } catch (custErr) {
    console.error("Customer confirmation email error:", custErr.message);
  }

  // 2. Send Admin New Order Notification Email
  try {
    const adminEmail = getAdminEmail();
    const adminHtml = renderAdminNewOrderEmail({ order: authoritativeOrder });
    await sendEmail({
      to: adminEmail,
      subject: `New Perfume Order Received — #${orderNumber}`,
      html: adminHtml
    });
    adminEmailSuccess = true;
  } catch (admErr) {
    console.error("Admin notification email error:", admErr.message);
  }

  // 3. Update order document with delivery status if Firestore doc available
  if (orderDocRef) {
    try {
      const { updateDoc, serverTimestamp } = await import("firebase/firestore");
      await updateDoc(orderDocRef, {
        emailStatus: {
          customer: customerEmailSuccess ? "sent" : "failed",
          admin: adminEmailSuccess ? "sent" : "failed",
          updatedAt: serverTimestamp()
        }
      });
    } catch (_) { }
  }

  return res.status(200).json({
    success: true,
    message: "Order notifications processed",
    customerEmailSent: customerEmailSuccess,
    adminEmailSent: adminEmailSuccess
  });
}
