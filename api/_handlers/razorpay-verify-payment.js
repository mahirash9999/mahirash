import { verifyPaymentSignature, fetchRazorpayPayment } from "../_lib/razorpayClient.js";
import { getFirestoreDb } from "../_lib/firestoreClient.js";
import { sendOrderEmails } from "../_lib/email.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    orderId
  } = req.body || {};

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      error: "Missing payment verification parameters (order_id, payment_id, signature required)."
    });
  }

  try {
    // 1. Verify cryptographic HMAC-SHA256 signature
    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValid) {
      console.warn(`[api/razorpay-verify-payment] Invalid signature for payment ${razorpay_payment_id}`);
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Payment verification failed: Invalid signature."
      });
    }

    // 2. Fetch authoritative payment details from Razorpay API
    const paymentDetails = await fetchRazorpayPayment(razorpay_payment_id);

    const verifiedAmount = paymentDetails?.amount ? paymentDetails.amount / 100 : null;
    const paymentMethod = paymentDetails?.method || "online";
    const paymentStatus = paymentDetails?.status === "captured" ? "captured" : (paymentDetails?.status || "authorized");

    // 3. If internal orderId is provided, update Firestore document directly and trigger confirmation emails
    if (orderId) {
      try {
        const db = await getFirestoreDb();
        if (db) {
          const { doc, getDoc, updateDoc, serverTimestamp } = await import("firebase/firestore");
          const orderRef = doc(db, "orders", orderId);
          await updateDoc(orderRef, {
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            razorpaySignature: razorpay_signature,
            paymentStatus: "paid",
            paymentMethod: "online",
            paymentMode: paymentMethod.toUpperCase(),
            verifiedAmount: verifiedAmount,
            updatedAt: serverTimestamp()
          });

          // Trigger luxury branded order confirmation email
          const snap = await getDoc(orderRef);
          if (snap.exists()) {
            const savedOrder = { id: snap.id, ...snap.data() };
            sendOrderEmails({
              order: savedOrder,
              items: savedOrder.items || [],
              total: savedOrder.total || verifiedAmount || 0,
              customerName: savedOrder.shipping?.name || savedOrder.customerName || "Patron",
              email: savedOrder.userEmail || savedOrder.customerEmail || savedOrder.shipping?.email,
              shippingAddress: savedOrder.shipping || savedOrder.shippingAddress
            }).catch(mErr => console.warn("[razorpay-verify-payment] Email dispatch notice:", mErr.message));
          }
        }
      } catch (dbErr) {
        console.warn("[api/razorpay-verify-payment] Notice updating Firestore order:", dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      status: paymentStatus,
      method: paymentMethod,
      amount: verifiedAmount,
      currency: paymentDetails?.currency || "INR",
      paymentDetails
    });
  } catch (err) {
    console.error("[api/razorpay-verify-payment] Internal error:", err.message);
    return res.status(500).json({
      error: "Payment verification encountered an internal error.",
      details: err.message
    });
  }
}

