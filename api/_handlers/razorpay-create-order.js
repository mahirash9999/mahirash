import { createRazorpayOrder, getRazorpayCredentials } from "../_lib/razorpayClient.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  const {
    amount,
    currency = "INR",
    receipt,
    customer = {},
    notes = {}
  } = req.body || {};

  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0) {
    return res.status(400).json({
      error: "Invalid amount. Amount must be a positive number."
    });
  }

  try {
    const { keyId } = getRazorpayCredentials();
    if (!keyId) {
      return res.status(500).json({
        error: "Razorpay credentials are not configured on server."
      });
    }

    const orderNotes = {
      customer_name: customer.name || "",
      customer_email: customer.email || "",
      customer_phone: customer.phone || "",
      ...notes
    };

    const order = await createRazorpayOrder({
      amount: numAmount,
      currency,
      receipt: receipt || `rcpt_${Date.now().toString(36)}`,
      notes: orderNotes
    });

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      keyId
    });
  } catch (err) {
    console.error("[api/razorpay-create-order] Error creating order:", err.response?.data || err.message);
    const rzpError = err.response?.data?.error?.description || err.message;
    return res.status(500).json({
      error: "Failed to create Razorpay payment order.",
      details: rzpError
    });
  }
}

