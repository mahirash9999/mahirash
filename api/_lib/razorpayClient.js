import axios from "axios";
import crypto from "crypto";

const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

/**
 * Returns configured Razorpay credentials with automatic normalization.
 */
export function getRazorpayCredentials() {
  let keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || "";
  let keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RAZORPAY_KEY_SECRET || "";

  // Normalize key if leading 'r' was accidentally omitted
  if (keyId && keyId.startsWith("zp_")) {
    keyId = "r" + keyId;
  }

  return { keyId: keyId.trim(), keySecret: keySecret.trim() };
}

/**
 * Creates Basic Auth string for Razorpay API calls.
 */
function getAuthHeader() {
  const { keyId, keySecret } = getRazorpayCredentials();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials missing. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  const token = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
  return `Basic ${token}`;
}

/**
 * Creates an official Razorpay Order.
 * @param {Object} params
 * @param {number} params.amount - Amount in Indian Rupees (₹)
 * @param {string} [params.currency="INR"]
 * @param {string} [params.receipt] - Unique receipt ID
 * @param {Object} [params.notes] - Customer/order metadata
 * @returns {Promise<Object>} Razorpay order entity
 */
export async function createRazorpayOrder({ amount, currency = "INR", receipt, notes = {} }) {
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    throw new Error("Invalid order amount for Razorpay payment.");
  }

  // Convert Rupees (₹) to Paise (integer required by Razorpay)
  const amountInPaise = Math.round(numAmount * 100);

  const cleanReceipt = String(receipt || `rcpt_${Date.now().toString(36)}`).slice(0, 40);

  const payload = {
    amount: amountInPaise,
    currency: currency.toUpperCase(),
    receipt: cleanReceipt,
    notes: {
      platform: "Mahirash Luxury Perfumes",
      ...notes
    }
  };

  const response = await axios.post(`${RAZORPAY_BASE_URL}/orders`, payload, {
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json"
    },
    timeout: 10000
  });

  return response.data;
}

/**
 * Verifies Razorpay payment signature using HMAC-SHA256 and timing-safe comparison.
 * @param {Object} params
 * @param {string} params.orderId - Razorpay order ID (e.g. order_...)
 * @param {string} params.paymentId - Razorpay payment ID (e.g. pay_...)
 * @param {string} params.signature - Razorpay signature returned by checkout modal
 * @returns {boolean} Whether signature is valid
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const { keySecret } = getRazorpayCredentials();
  if (!keySecret) {
    throw new Error("Razorpay key secret not configured on server.");
  }

  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedSignature, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch (_) {
    return false;
  }
}

/**
 * Fetches verified payment details from Razorpay to guarantee authenticity and values.
 * @param {string} paymentId
 * @returns {Promise<Object>}
 */
export async function fetchRazorpayPayment(paymentId) {
  if (!paymentId) return null;

  try {
    const response = await axios.get(`${RAZORPAY_BASE_URL}/payments/${paymentId}`, {
      headers: {
        Authorization: getAuthHeader()
      },
      timeout: 10000
    });
    return response.data;
  } catch (err) {
    console.warn(`[razorpayClient] Could not fetch payment ${paymentId}:`, err.response?.data || err.message);
    return null;
  }
}

