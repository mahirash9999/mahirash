import nodemailer from "nodemailer";

// Brand Assets & URLs
const WEBSITE_URL = process.env.PUBLIC_APP_URL || process.env.VITE_APP_URL || process.env.WEBSITE_URL || "https://mahirash.com";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "help@mahirash.com";

function cleanVal(v) {
  if (!v || typeof v !== "string") return "";
  return v.trim().replace(/^["']|["']$/g, "").trim();
}

/**
 * Creates and returns a Nodemailer transporter based on available environment variables.
 * Prioritizes custom SMTP (SMTP_HOST, SMTP_PORT, etc.), then falls back to Gmail.
 */
export function getTransporter() {
  const host = cleanVal(process.env.SMTP_HOST);
  const user = cleanVal(process.env.SMTP_USER || process.env.GMAIL_USER || process.env.VITE_GMAIL_USER);
  let pass = cleanVal(process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.VITE_GMAIL_PASS);

  if (!user || !pass) {
    return null;
  }

  // Google App Passwords are 16 characters (often copied with spaces: "xxxx xxxx xxxx xxxx")
  if (!host && pass.includes(" ")) {
    pass = pass.replace(/\s+/g, "");
  }

  if (host) {
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE === "true" || port === 465;
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass }
    });
  }

  // Fallback to Gmail service
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });
}

export function getFromEmail() {
  if (process.env.SMTP_FROM) {
    return cleanVal(process.env.SMTP_FROM);
  }
  const user = cleanVal(process.env.SMTP_USER || process.env.GMAIL_USER || process.env.VITE_GMAIL_USER) || "care@mahirash.com";
  return `"Luxury Perfumes" <${user}>`;
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || process.env.SMTP_USER || process.env.GMAIL_USER || "mahirash9999@gmail.com";
}

/**
 * Sends an email with graceful fallback if SMTP credentials are not yet configured.
 */
export async function sendEmail({ to, subject, html, replyTo }) {
  const transporter = getTransporter();
  const from = getFromEmail();

  if (!transporter) {
    console.warn("⚠️ SMTP credentials missing in environment. Email simulated:", { to, subject });
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to,
      replyTo: replyTo || SUPPORT_EMAIL,
      subject,
      html
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("Nodemailer delivery error:", err.message);
    throw err;
  }
}

/**
 * Common Luxury Email Layout Wrapper
 */
function wrapInLuxuryTemplate({ title, subtitle, previewText, contentHtml, orderNumber = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; border-radius: 0 !important; }
      .mobile-padding { padding: 24px 18px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #FCF9F4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #30231F; -webkit-font-smoothing: antialiased;">
  <!-- Preview snippet -->
  <div style="display: none; max-height: 0px; overflow: hidden;">${previewText || title}</div>

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF9F4; padding: 32px 12px;">
    <tr>
      <td align="center">
        <table class="container" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border: 1px solid #E9DCCB; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(48,35,31,0.06); max-width: 600px; width: 100%;">
          
          <!-- Brand Header -->
          <tr>
            <td align="center" style="background-color: #650018; padding: 28px 24px; border-bottom: 2px solid #800020;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 300; letter-spacing: 0.35em; color: #FCF9F4; text-transform: uppercase; font-family: 'Times New Roman', Georgia, serif;">MAHIRASH</h1>
              <p style="margin: 4px 0 0 0; font-size: 8.5px; letter-spacing: 0.38em; color: #E9DCCB; text-transform: uppercase; font-weight: 600;">LUXURY PERFUMES</p>
            </td>
          </tr>

          <!-- Banner Title -->
          <tr>
            <td class="mobile-padding" style="padding: 32px 36px 20px; text-align: center; border-bottom: 1px solid #F5EFEB;">
              <span style="display: inline-block; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; color: #800020; margin-bottom: 8px;">
                ${subtitle || "MAHIRASH PRIVILEGE"}
              </span>
              <h2 style="margin: 0; font-size: 24px; font-weight: 300; color: #30231F; font-family: 'Times New Roman', Georgia, serif; line-height: 1.3;">
                ${title}
              </h2>
              ${orderNumber ? `<p style="margin: 8px 0 0; font-family: Courier, monospace; font-size: 13px; font-weight: 700; color: #800020;">Order Reference: #${orderNumber}</p>` : ""}
            </td>
          </tr>

          <!-- Dynamic Body Content -->
          <tr>
            <td class="mobile-padding" style="padding: 24px 36px;">
              ${contentHtml}
            </td>
          </tr>

          <!-- Brand Footer -->
          <tr>
            <td style="background-color: #FCF9F4; padding: 24px 36px; border-top: 1px solid #E9DCCB; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #75665D; font-style: italic; font-family: 'Times New Roman', Georgia, serif;">
                "Crafted with rare botanical essences and fine artisanal extraits."
              </p>
              <p style="margin: 8px 0 0; font-size: 11px; color: #A89B91;">
                Questions? Our concierge is available at <a href="mailto:${SUPPORT_EMAIL}" style="color: #800020; text-decoration: none; font-weight: 600;">${SUPPORT_EMAIL}</a>
              </p>
              <p style="margin: 4px 0 0; font-size: 10px; color: #A89B91; text-transform: uppercase; letter-spacing: 0.1em;">
                &copy; ${new Date().getFullYear()} MAHIRASH PERFUMES. ALL RIGHTS RESERVED.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 0. Customer OTP / Verification Email Template
 */
export function renderOtpEmail({ otp, toEmail, name }) {
  const recipientName = name || "Valued Patron";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Mahirash Verification Passcode</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FCF9F4; font-family: 'Times New Roman', Times, serif; color: #30231F;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF9F4; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #E9DCCB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          <tr>
            <td style="background-color: #800020; padding: 28px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 4px; text-transform: uppercase;">MAHIRASH</h1>
              <p style="margin: 6px 0 0 0; color: #FCF9F4; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Luxury Artisanal Perfumes</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <h2 style="margin: 0 0 12px 0; color: #30231F; font-size: 18px; font-family: 'Times New Roman', Times, serif; letter-spacing: 1px;">Security Verification Code</h2>
              <p style="margin: 0 0 20px 0; color: #75665D; font-size: 14px; line-height: 1.6;">Hello ${recipientName},</p>
              <p style="margin: 0 0 24px 0; color: #75665D; font-size: 14px; line-height: 1.6;">Use the one-time passcode (OTP) below to authenticate your Mahirash account access. This code remains valid for 10 minutes.</p>
              
              <div style="background-color: #FCF9F4; border: 1px dashed #800020; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #800020;">${otp}</span>
              </div>

              <p style="margin: 0; color: #9E8E84; font-size: 12px; line-height: 1.5;">If you did not request this code, please disregard this email. Never share this code with anyone.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FCF9F4; padding: 20px 32px; text-align: center; border-top: 1px solid #E9DCCB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <p style="margin: 0; color: #75665D; font-size: 11px;">&copy; ${new Date().getFullYear()} MAHIRASH PERFUMES. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * 1. Customer Order Confirmation Email Template
 */
export function renderOrderConfirmationEmail({ order }) {
  const orderNumber = order.orderNumber || order.id || "MHR-ORDER";
  const customerName = order.customerName || order.shipping?.name || "Valued Patron";
  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(order.total) || 0;
  const subtotal = Number(order.subtotal) || total;
  const discount = Number(order.discount || order.couponDiscount) || 0;
  const shippingFee = Number(order.shippingCost || order.shippingFee) || 0;
  const shipping = order.shippingAddress || order.shipping || {};
  const paymentMode = order.paymentMode || "Online (Razorpay)";
  const paymentId = order.paymentId || order.razorpayPaymentId || "Prepaid";

  const trackUrl = `${WEBSITE_URL}/track?orderNumber=${encodeURIComponent(orderNumber)}`;
  const accountUrl = `${WEBSITE_URL}/orders?id=${order.id || order.orderId}`;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #F5EFEB; vertical-align: middle;">
        <div style="font-size: 13.5px; font-weight: 600; color: #30231F;">${item.name || "Artisanal Fragrance"}</div>
        ${item.size ? `<div style="font-size: 11px; color: #75665D;">Volume: ${item.size}</div>` : ""}
      </td>
      <td align="center" style="padding: 12px 8px; border-bottom: 1px solid #F5EFEB; font-size: 13px; color: #75665D; vertical-align: middle;">
        x${item.quantity || 1}
      </td>
      <td align="right" style="padding: 12px 8px; border-bottom: 1px solid #F5EFEB; font-size: 13.5px; font-weight: 700; color: #30231F; vertical-align: middle;">
        ₹${(Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1)).toLocaleString("en-IN")}
      </td>
    </tr>
  `).join("");

  const addressFormatted = [
    shipping.flat || shipping.houseNumber || "",
    shipping.street || shipping.address || "",
    shipping.city || "",
    shipping.state || "",
    shipping.pincode ? `PIN: ${shipping.pincode}` : ""
  ].filter(Boolean).join(", ");

  const contentHtml = `
    <p style="margin: 0 0 16px; font-size: 14.5px; line-height: 1.6; color: #30231F;">
      Dear <strong>${customerName}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #75665D;">
      Thank you for acquiring from Mahirash. Your payment has been verified successfully. Our perfume masters are now preparing and inspecting your fragrance flacons for dispatch via Delhivery Express.
    </p>

    <!-- Payment & Shipping Meta Box -->
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF9F4; border: 1px solid #E9DCCB; border-radius: 12px; margin-bottom: 24px; padding: 14px 18px;">
      <tr>
        <td width="50%" style="font-size: 12px; color: #75665D; padding: 4px 0;">
          Payment Status: <strong style="color: #15803D;">PAID</strong>
        </td>
        <td width="50%" align="right" style="font-size: 12px; color: #75665D; padding: 4px 0;">
          Payment Mode: <strong style="color: #30231F;">${paymentMode}</strong>
        </td>
      </tr>
      <tr>
        <td width="50%" style="font-size: 12px; color: #75665D; padding: 4px 0;">
          Transaction ID: <span style="font-family: Courier, monospace; color: #30231F;">${paymentId}</span>
        </td>
        <td width="50%" align="right" style="font-size: 12px; color: #75665D; padding: 4px 0;">
          Shipping Partner: <strong style="color: #800020;">Delhivery Express</strong>
        </td>
      </tr>
    </table>

    <!-- Purchased Items Table -->
    <h3 style="margin: 0 0 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #800020; border-bottom: 1px solid #E9DCCB; padding-bottom: 6px;">
      Your Artisanal Selection
    </h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 16px;">
      <thead>
        <tr style="font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em; color: #75665D;">
          <th align="left" style="padding-bottom: 8px;">Fragrance</th>
          <th align="center" style="padding-bottom: 8px;">Qty</th>
          <th align="right" style="padding-bottom: 8px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals Summary -->
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 1px solid #E9DCCB; padding-top: 12px; margin-bottom: 24px;">
      <tr>
        <td style="font-size: 12px; color: #75665D; padding: 3px 0;">Subtotal</td>
        <td align="right" style="font-size: 12px; color: #30231F; padding: 3px 0;">₹${subtotal.toLocaleString("en-IN")}</td>
      </tr>
      ${discount > 0 ? `
      <tr>
        <td style="font-size: 12px; color: #15803D; padding: 3px 0;">Privilege Discount</td>
        <td align="right" style="font-size: 12px; color: #15803D; padding: 3px 0;">-₹${discount.toLocaleString("en-IN")}</td>
      </tr>` : ""}
      <tr>
        <td style="font-size: 12px; color: #75665D; padding: 3px 0;">Express Shipping (Delhivery)</td>
        <td align="right" style="font-size: 12px; color: #15803D; font-weight: 600; padding: 3px 0;">COMPLIMENTARY</td>
      </tr>
      <tr>
        <td style="font-size: 14px; font-weight: 700; color: #30231F; padding-top: 8px; border-top: 1px dashed #E9DCCB;">Total Paid</td>
        <td align="right" style="font-size: 16px; font-weight: 800; color: #800020; padding-top: 8px; border-top: 1px dashed #E9DCCB;">₹${total.toLocaleString("en-IN")}</td>
      </tr>
    </table>

    <!-- Shipping Address Summary -->
    <div style="background-color: #FCF9F4; border: 1px solid #E9DCCB; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; color: #800020;">Dispatch Address</p>
      <p style="margin: 0; font-size: 13px; color: #30231F; line-height: 1.5;">${addressFormatted}</p>
    </div>

    <!-- CTA Buttons -->
    <div style="text-align: center; padding: 8px 0 16px;">
      <a href="${trackUrl}" style="display: inline-block; background-color: #800020; color: #ffffff; padding: 13px 32px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; text-decoration: none; border-radius: 8px; margin: 4px;">
        Track Order Status
      </a>
      <a href="${accountUrl}" style="display: inline-block; background-color: #ffffff; color: #30231F; border: 1px solid #E9DCCB; padding: 13px 26px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; text-decoration: none; border-radius: 8px; margin: 4px;">
        View In My Account
      </a>
    </div>
  `;

  return wrapInLuxuryTemplate({
    title: "Order Acquired & Payment Confirmed",
    subtitle: "CONGRATULATIONS & THANK YOU",
    previewText: `Your Mahirash perfume order #${orderNumber} is confirmed and in preparation.`,
    orderNumber,
    contentHtml
  });
}

/**
 * 2. Customer Shipment Dispatched Email Template (with Delhivery AWB & Tracking)
 */
export function renderShipmentDispatchedEmail({ order }) {
  const orderNumber = order.orderNumber || order.id || "MHR-ORDER";
  const customerName = order.customerName || order.shipping?.name || "Valued Patron";
  const awbCode = order.awbCode || order.trackingNumber || "Pending";
  const courierName = order.courierName || order.shippingCarrier || "Delhivery Express";
  const trackingUrl = order.trackingUrl || `https://www.delhivery.com/track/package/${awbCode}`;
  const storeTrackUrl = `${WEBSITE_URL}/track?orderNumber=${encodeURIComponent(orderNumber)}`;

  const contentHtml = `
    <p style="margin: 0 0 16px; font-size: 14.5px; line-height: 1.6; color: #30231F;">
      Dear <strong>${customerName}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #75665D;">
      We are delighted to inform you that your artisanal fragrance package has been carefully packaged and handed over to our premier logistics partner, <strong>${courierName}</strong>.
    </p>

    <!-- AWB Callout Card -->
    <div style="background-color: #FCF9F4; border: 2px solid #800020; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <span style="font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.25em; color: #800020; display: block; margin-bottom: 6px;">
        COURIER WAYBILL (AWB) NUMBER
      </span>
      <span style="font-family: Courier, monospace; font-size: 20px; font-weight: 800; color: #30231F; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">
        ${awbCode}
      </span>
      <span style="font-size: 12px; color: #75665D;">
        Delivery Partner: <strong>${courierName}</strong> · Insured Priority Transit
      </span>
    </div>

    <p style="margin: 0 0 24px; font-size: 13.5px; color: #75665D; line-height: 1.6; text-align: center;">
      You can track the live real-time journey of your consignment as it clears hub checkpoints on its way to your doorstep.
    </p>

    <!-- Action Buttons -->
    <div style="text-align: center; padding-bottom: 16px;">
      <a href="${trackingUrl}" target="_blank" style="display: inline-block; background-color: #800020; color: #ffffff; padding: 13px 32px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; text-decoration: none; border-radius: 8px; margin: 4px;">
        Track on Delhivery Live
      </a>
      <a href="${storeTrackUrl}" style="display: inline-block; background-color: #ffffff; color: #30231F; border: 1px solid #E9DCCB; padding: 13px 26px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; text-decoration: none; border-radius: 8px; margin: 4px;">
        View on Mahirash
      </a>
    </div>
  `;

  return wrapInLuxuryTemplate({
    title: "Your Perfume Order Has Shipped",
    subtitle: "CONSIGNMENT DISPATCHED",
    previewText: `Order #${orderNumber} is on its way via ${courierName}. AWB: ${awbCode}`,
    orderNumber,
    contentHtml
  });
}

/**
 * 3. Customer Order Delivered Email Template
 */
export function renderOrderDeliveredEmail({ order }) {
  const orderNumber = order.orderNumber || order.id || "MHR-ORDER";
  const customerName = order.customerName || order.shipping?.name || "Valued Patron";

  const contentHtml = `
    <p style="margin: 0 0 16px; font-size: 14.5px; line-height: 1.6; color: #30231F;">
      Dear <strong>${customerName}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #75665D;">
      Delhivery Express has confirmed that your Mahirash luxury fragrance package has been safely delivered to your address.
    </p>
    <div style="background-color: #FCF9F4; border: 1px solid #E9DCCB; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
      <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.2em; color: #15803D; font-weight: 700;">
        DELIVERY COMPLETED
      </p>
      <p style="margin: 0; font-size: 13px; color: #75665D;">
        We hope your new scent brings sophistication, warmth, and enduring memories to your days.
      </p>
    </div>
    <div style="text-align: center; padding-bottom: 16px;">
      <a href="${WEBSITE_URL}/shop" style="display: inline-block; background-color: #800020; color: #ffffff; padding: 13px 32px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; text-decoration: none; border-radius: 8px;">
        Explore Signature Collection
      </a>
    </div>
  `;

  return wrapInLuxuryTemplate({
    title: "Your Fragrance Has Arrived",
    subtitle: "SHIPMENT DELIVERED",
    previewText: `Order #${orderNumber} has been delivered. Enjoy your fragrance.`,
    orderNumber,
    contentHtml
  });
}

/**
 * 4. Customer Order Cancelled Email Template
 */
export function renderOrderCancelledEmail({ order, reason = "Requested by customer" }) {
  const orderNumber = order.orderNumber || order.id || "MHR-ORDER";
  const customerName = order.customerName || order.shipping?.name || "Valued Patron";
  const total = Number(order.total || 0).toLocaleString("en-IN");

  const contentHtml = `
    <p style="margin: 0 0 16px; font-size: 14.5px; line-height: 1.6; color: #30231F;">
      Dear <strong>${customerName}</strong>,
    </p>
    <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #75665D;">
      Your order #${orderNumber} has been cancelled.
    </p>
    <div style="background-color: #FCF9F4; border: 1px solid #E9DCCB; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
      <p style="margin: 0 0 6px; font-size: 12px; color: #75665D;">
        Reason: <strong style="color: #30231F;">${reason}</strong>
      </p>
      <p style="margin: 0; font-size: 12px; color: #75665D;">
        Refund Status: <strong style="color: #15803D;">Auto-refund initiated for ₹${total} back to your original source account via Razorpay (3–5 business days).</strong>
      </p>
    </div>
  `;

  return wrapInLuxuryTemplate({
    title: "Order Cancellation & Refund Notice",
    subtitle: "CANCELLATION CONFIRMED",
    previewText: `Order #${orderNumber} cancellation confirmed.`,
    orderNumber,
    contentHtml
  });
}

/**
 * 5. Admin New Order Alert Email
 */
export function renderAdminNewOrderEmail({ order }) {
  const orderNumber = order.orderNumber || order.id || "MHR-ORDER";
  const customerName = order.customerName || order.shipping?.name || "Customer";
  const customerEmail = order.customerEmail || order.userEmail || order.shipping?.email || "N/A";
  const customerPhone = order.customerPhone || order.shipping?.phone || "N/A";
  const total = Number(order.total || 0).toLocaleString("en-IN");
  const items = Array.isArray(order.items) ? order.items : [];
  const paymentId = order.paymentId || order.razorpayPaymentId || "Prepaid Online";

  const adminUrl = `${WEBSITE_URL}/admin`;

  const itemsList = items.map(it => `• ${it.name} (x${it.quantity || 1}) - ₹${(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString("en-IN")}`).join("<br />");

  const contentHtml = `
    <div style="background-color: #FCF9F4; border: 1px solid #E9DCCB; border-radius: 12px; padding: 18px; margin-bottom: 20px;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #30231F;"><strong>New Verified Online Order Received!</strong></p>
      <p style="margin: 0 0 4px; font-size: 12.5px; color: #75665D;">Order: <strong style="color: #800020;">#${orderNumber}</strong></p>
      <p style="margin: 0 0 4px; font-size: 12.5px; color: #75665D;">Customer: <strong>${customerName}</strong> (${customerPhone}, ${customerEmail})</p>
      <p style="margin: 0 0 4px; font-size: 12.5px; color: #75665D;">Total Amount: <strong style="color: #15803D;">₹${total}</strong> (Razorpay ID: ${paymentId})</p>
    </div>

    <h4 style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.15em; color: #800020;">Ordered Items:</h4>
    <div style="font-size: 13px; color: #30231F; line-height: 1.6; margin-bottom: 24px;">
      ${itemsList}
    </div>

    <div style="text-align: center;">
      <a href="${adminUrl}" style="display: inline-block; background-color: #800020; color: #ffffff; padding: 12px 28px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; text-decoration: none; border-radius: 8px;">
        Open Admin Order Manager
      </a>
    </div>
  `;

  return wrapInLuxuryTemplate({
    title: "New Paid Order Alert",
    subtitle: "STORE NOTIFICATION",
    previewText: `New verified order #${orderNumber} received for ₹${total}`,
    orderNumber,
    contentHtml
  });
}

/**
 * High-Level Order Email Dispatchers
 */
export async function sendOrderEmails({ order }) {
  const customerEmail = String(order.customerEmail || order.userEmail || order.shipping?.email || "").trim();
  const orderNumber = order.orderNumber || order.id || "MHR-ORDER";

  const results = { customer: false, admin: false };

  // 1. Send confirmation to customer
  if (customerEmail && customerEmail.includes("@")) {
    try {
      const html = renderOrderConfirmationEmail({ order });
      await sendEmail({
        to: customerEmail,
        subject: `Order Confirmed: #${orderNumber} - Luxury Perfumes`,
        html
      });
      results.customer = true;
    } catch (e) {
      console.error("[email] Error sending customer order confirmation:", e.message);
    }
  }

  // 2. Send notification to admin
  const adminEmail = getAdminEmail();
  if (adminEmail && adminEmail.includes("@")) {
    try {
      const html = renderAdminNewOrderEmail({ order });
      await sendEmail({
        to: adminEmail,
        subject: `[New Order] #${orderNumber} received - ₹${Number(order.total || 0).toLocaleString("en-IN")}`,
        html
      });
      results.admin = true;
    } catch (e) {
      console.error("[email] Error sending admin alert:", e.message);
    }
  }

  return results;
}

export async function sendShipmentDispatchedEmail({ order }) {
  const customerEmail = String(order.customerEmail || order.userEmail || order.shipping?.email || "").trim();
  const orderNumber = order.orderNumber || order.id || "MHR-ORDER";

  if (!customerEmail || !customerEmail.includes("@")) return false;

  try {
    const html = renderShipmentDispatchedEmail({ order });
    await sendEmail({
      to: customerEmail,
      subject: `Your Mahirash Order #${orderNumber} Has Shipped via Delhivery Express`,
      html
    });
    return true;
  } catch (e) {
    console.error("[email] Error sending dispatch email:", e.message);
    return false;
  }
}

export async function sendOrderDeliveredEmail({ order }) {
  const customerEmail = String(order.customerEmail || order.userEmail || order.shipping?.email || "").trim();
  const orderNumber = order.orderNumber || order.id || "MHR-ORDER";

  if (!customerEmail || !customerEmail.includes("@")) return false;

  try {
    const html = renderOrderDeliveredEmail({ order });
    await sendEmail({
      to: customerEmail,
      subject: `Delivered: Your Mahirash Fragrance Order #${orderNumber}`,
      html
    });
    return true;
  } catch (e) {
    console.error("[email] Error sending delivery email:", e.message);
    return false;
  }
}

export async function sendOrderCancelledEmail({ order, reason }) {
  const customerEmail = String(order.customerEmail || order.userEmail || order.shipping?.email || "").trim();
  const orderNumber = order.orderNumber || order.id || "MHR-ORDER";

  if (!customerEmail || !customerEmail.includes("@")) return false;

  try {
    const html = renderOrderCancelledEmail({ order, reason });
    await sendEmail({
      to: customerEmail,
      subject: `Order Cancelled: #${orderNumber} - Luxury Perfumes`,
      html
    });
    return true;
  } catch (e) {
    console.error("[email] Error sending cancellation email:", e.message);
    return false;
  }
}
