import nodemailer from "nodemailer";

// Brand Assets
const BRAND_LOGO_URL = "https://res.cloudinary.com/dcjn4y284/image/upload/v1786029668/p3jd3nuet4vkqbfd5qaz.png";
const WEBSITE_URL = process.env.WEBSITE_URL || "https://mahirash.com";
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "help@mahirash.com";

/**
 * Creates and returns a Nodemailer transporter based on available environment variables.
 * Prioritizes custom SMTP (SMTP_HOST, SMTP_PORT, etc.), then falls back to Gmail.
 */
export function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.VITE_GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.VITE_GMAIL_PASS;

  if (!user || !pass) {
    return null;
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
    return process.env.SMTP_FROM;
  }
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || "no-reply@mahirash.com";
  return `"Mahirash Haute Parfumerie" <${user}>`;
}

export function getAdminEmail() {
  return process.env.ADMIN_EMAIL || process.env.SMTP_USER || "mahirash.help@gmail.com";
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
 * Luxury HTML Template for Email OTP Verification
 */
export function renderOtpEmail({ otp, toEmail, name }) {
  const recipientName = name || toEmail.split("@")[0];
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Mahirash Login Code</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f8f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f8f6;padding:40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:540px;background-color:#ffffff;border:1px solid #e7e5e4;box-shadow:0 10px 30px rgba(0,0,0,0.04);">
          <!-- Header / Brand -->
          <tr>
            <td align="center" style="padding:36px 30px 24px;border-bottom:1px solid #f4f4f5;background-color:#000000;">
              <img src="${BRAND_LOGO_URL}" alt="MAHIRASH" height="38" style="height:38px;display:block;border:0;filter:brightness(0) invert(1);" />
              <p style="margin:8px 0 0;font-size:9px;text-transform:uppercase;letter-spacing:0.35em;color:#c9a962;font-weight:600;">Haute Parfumerie Atelier</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 36px 30px;color:#1c1917;text-align:center;">
              <p style="margin:0 0 10px;font-size:11px;text-transform:uppercase;letter-spacing:0.25em;color:#78716c;font-weight:600;">One-Time Security Verification</p>
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:300;text-transform:uppercase;letter-spacing:0.18em;color:#000000;">Authentication Code</h1>
              
              <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:#57534e;">
                Hello <strong style="color:#1c1917;">${recipientName}</strong>,<br>
                Please use the single-use verification code below to access your Mahirash account.
              </p>

              <!-- OTP Code Display -->
              <div style="background-color:#fbfaf8;border:1px solid #e7e5e4;padding:22px 10px;margin:0 auto 28px;max-width:320px;border-radius:4px;">
                <div style="font-size:36px;font-weight:700;letter-spacing:14px;color:#000000;font-family:Courier,'Courier New',monospace;padding-left:14px;">
                  ${otp}
                </div>
              </div>

              <p style="margin:0 0 8px;font-size:12px;color:#78716c;">
                ⏱️ This code is valid for <strong>10 minutes</strong> and can only be used once.
              </p>
              <p style="margin:0;font-size:11px;color:#a8a29e;line-height:1.5;">
                If you did not request this verification code, please disregard this email. Your account remains protected.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 30px;background-color:#fafaf9;border-top:1px solid #f4f4f5;text-align:center;">
              <p style="margin:0 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#78716c;">Mahirash Luxury Perfumes</p>
              <p style="margin:0;font-size:10px;color:#a8a29e;">
                Need assistance? Contact our concierge at <a href="mailto:${SUPPORT_EMAIL}" style="color:#000000;text-decoration:none;">${SUPPORT_EMAIL}</a>
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
 * Luxury HTML Template for Customer Order Confirmation
 */
export function renderOrderConfirmationEmail({ order }) {
  const orderNumber = order.orderNumber || order.id || "MHR-ORDER";
  const customerName = order.customerName || order.shipping?.name || "Valued Connoisseur";
  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(order.total) || 0;
  const subtotal = Number(order.subtotal) || total;
  const discount = Number(order.discount || order.couponDiscount) || 0;
  const shippingFee = Number(order.shippingCost || order.shippingFee) || 0;
  const isCOD = (order.paymentMethod || "").toLowerCase().includes("cod") || order.paymentMethod !== "online";
  const paymentStatus = order.paymentStatus === "captured" || order.paymentStatus === "paid" ? "Paid" : (isCOD ? "Pending (Cash on Delivery)" : "Pending");
  const shipping = order.shipping || order.shippingAddress || {};
  const orderDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const trackUrl = `${WEBSITE_URL}/track?orderId=${order.id || order.orderId}`;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding:14px 12px;border-bottom:1px solid #f4f4f5;vertical-align:middle;">
        <div style="font-size:13px;font-weight:600;color:#1c1917;text-transform:uppercase;letter-spacing:0.05em;">
          ${item.name || "Artisanal Fragrance"}
        </div>
        ${item.size ? `<div style="font-size:11px;color:#78716c;margin-top:2px;">Volume / Size: ${item.size}</div>` : ""}
      </td>
      <td align="center" style="padding:14px 12px;border-bottom:1px solid #f4f4f5;font-size:13px;color:#57534e;vertical-align:middle;">
        ${item.quantity || 1}
      </td>
      <td align="right" style="padding:14px 12px;border-bottom:1px solid #f4f4f5;font-size:13px;font-weight:600;color:#1c1917;vertical-align:middle;">
        ₹${(Number(item.price) || 0).toLocaleString("en-IN")}
      </td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Perfume Order Is Confirmed</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f8f6;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9f8f6;padding:40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e7e5e4;box-shadow:0 10px 30px rgba(0,0,0,0.04);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding:36px 30px 24px;background-color:#000000;">
              <img src="${BRAND_LOGO_URL}" alt="MAHIRASH" height="40" style="height:40px;display:block;border:0;filter:brightness(0) invert(1);" />
              <p style="margin:8px 0 0;font-size:9px;text-transform:uppercase;letter-spacing:0.35em;color:#c9a962;font-weight:600;">Haute Parfumerie Atelier</p>
            </td>
          </tr>

          <!-- Confirmation Banner -->
          <tr>
            <td style="padding:36px 36px 24px;border-bottom:1px solid #f4f4f5;text-align:center;">
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.25em;color:#c9a962;font-weight:700;">Order Confirmed</p>
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:300;text-transform:uppercase;letter-spacing:0.18em;color:#000000;">Thank You for Choosing Mahirash</h1>
              <p style="margin:0;font-size:14px;color:#57534e;line-height:1.6;">
                Dear ${customerName}, your fragrance formulation has been successfully placed and is now being handcrafted and packaged for dispatch.
              </p>
            </td>
          </tr>

          <!-- Meta Grid -->
          <tr>
            <td style="padding:20px 36px;background-color:#fafaf9;border-bottom:1px solid #f4f4f5;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="font-size:12px;color:#78716c;padding:4px 0;">
                    Order Number: <strong style="color:#000000;font-family:Courier,monospace;">#${orderNumber}</strong>
                  </td>
                  <td width="50%" align="right" style="font-size:12px;color:#78716c;padding:4px 0;">
                    Date: <strong style="color:#000000;">${orderDate}</strong>
                  </td>
                </tr>
                <tr>
                  <td width="50%" style="font-size:12px;color:#78716c;padding:4px 0;">
                    Payment: <strong style="color:#000000;">${isCOD ? "Cash on Delivery" : "Prepaid Online"}</strong>
                  </td>
                  <td width="50%" align="right" style="font-size:12px;color:#78716c;padding:4px 0;">
                    Status: <strong style="color:${paymentStatus.includes("Paid") ? "#15803d" : "#b45309"};">${paymentStatus}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding:28px 36px;">
              <h3 style="margin:0 0 16px;font-size:12px;text-transform:uppercase;letter-spacing:0.2em;color:#000000;border-bottom:1px solid #000000;padding-bottom:8px;">
                Your Perfume Selection
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#78716c;">
                    <th align="left" style="padding-bottom:8px;">Item</th>
                    <th align="center" style="padding-bottom:8px;">Qty</th>
                    <th align="right" style="padding-bottom:8px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <!-- Totals -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#78716c;">Subtotal</td>
                  <td align="right" style="padding:4px 0;font-size:12px;color:#1c1917;">₹${subtotal.toLocaleString("en-IN")}</td>
                </tr>
                ${discount > 0 ? `
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#15803d;">Privilege Discount</td>
                  <td align="right" style="padding:4px 0;font-size:12px;color:#15803d;">-₹${discount.toLocaleString("en-IN")}</td>
                </tr>` : ""}
                <tr>
                  <td style="padding:4px 0;font-size:12px;color:#78716c;">Insured Shipping</td>
                  <td align="right" style="padding:4px 0;font-size:12px;color:#1c1917;">${shippingFee === 0 ? "Complimentary" : "₹" + shippingFee.toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;font-size:14px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.1em;border-top:1px solid #e7e5e4;">Total Amount</td>
                  <td align="right" style="padding:12px 0 0;font-size:16px;font-weight:700;color:#000000;border-top:1px solid #e7e5e4;">₹${total.toLocaleString("en-IN")}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Delivery Address -->
          <tr>
            <td style="padding:0 36px 28px;">
              <div style="background-color:#fafaf9;border:1px solid #f4f4f5;padding:18px;border-radius:4px;">
                <h4 style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;color:#000000;">Destination Address</h4>
                <p style="margin:0;font-size:13px;color:#57534e;line-height:1.5;">
                  <strong>${shipping.name || customerName}</strong><br>
                  ${shipping.address || ""}<br>
                  ${shipping.city || ""}${shipping.state ? ", " + shipping.state : ""} – ${shipping.pincode || ""}<br>
                  Phone: ${shipping.phone || "Not specified"}
                </p>
              </div>
            </td>
          </tr>

          <!-- Action Button -->
          <tr>
            <td align="center" style="padding:0 36px 36px;">
              <a href="${trackUrl}" style="display:inline-block;background-color:#000000;color:#ffffff;text-decoration:none;padding:15px 36px;font-size:11px;text-transform:uppercase;letter-spacing:0.25em;font-weight:700;">
                Track Order Status →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 30px;background-color:#000000;color:#ffffff;text-align:center;">
              <p style="margin:0 0 6px;font-size:10px;text-transform:uppercase;letter-spacing:0.25em;color:#c9a962;">Mahirash Haute Parfumerie</p>
              <p style="margin:0;font-size:10px;color:#a8a29e;">
                Questions regarding your order? Reach our atelier concierge at <a href="mailto:${SUPPORT_EMAIL}" style="color:#ffffff;text-decoration:none;">${SUPPORT_EMAIL}</a>
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
 * Luxury HTML Template for Admin New Order Notification
 */
export function renderAdminNewOrderEmail({ order }) {
  const orderNumber = order.orderNumber || order.id || "MHR-ORDER";
  const customerName = order.customerName || order.shipping?.name || "Customer";
  const customerEmail = order.customerEmail || order.userEmail || "Not provided";
  const customerPhone = order.customerPhone || order.shipping?.phone || "Not provided";
  const isGuest = order.isGuest !== false;
  const items = Array.isArray(order.items) ? order.items : [];
  const total = Number(order.total) || 0;
  const subtotal = Number(order.subtotal) || total;
  const discount = Number(order.discount || order.couponDiscount) || 0;
  const isCOD = (order.paymentMethod || "").toLowerCase().includes("cod") || order.paymentMethod !== "online";
  const paymentStatus = order.paymentStatus || (isCOD ? "Pending (COD)" : "Captured");
  const shipping = order.shipping || order.shippingAddress || {};
  const orderDate = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const itemsListText = items.map(i =>
    `• ${i.name || "Fragrance"} (${i.size ? "Size: " + i.size + ", " : ""}Qty: ${i.quantity || 1}) - ₹${(Number(i.price) || 0).toLocaleString("en-IN")}`
  ).join("<br>");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New Perfume Order Received</title>
</head>
<body style="margin:0;padding:24px;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;padding:32px;border-radius:6px;">
    <div style="border-bottom:2px solid #000;padding-bottom:16px;margin-bottom:24px;">
      <span style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#c9a962;font-weight:700;">Admin Order Alert</span>
      <h2 style="margin:6px 0 0;font-size:22px;text-transform:uppercase;letter-spacing:0.1em;color:#000;">
        New Perfume Order #${orderNumber}
      </h2>
      <p style="margin:4px 0 0;font-size:12px;color:#71717a;">Received at ${orderDate} IST</p>
    </div>

    <table width="100%" cellpadding="6" cellspacing="0" style="font-size:13px;border-collapse:collapse;margin-bottom:24px;">
      <tr style="background:#f4f4f5;">
        <td style="font-weight:bold;width:35%;">Customer Name:</td>
        <td>${customerName} (${isGuest ? "Guest Checkout" : "Registered Member"})</td>
      </tr>
      <tr>
        <td style="font-weight:bold;">Customer Email:</td>
        <td><a href="mailto:${customerEmail}">${customerEmail}</a></td>
      </tr>
      <tr style="background:#f4f4f5;">
        <td style="font-weight:bold;">Customer Phone:</td>
        <td>${customerPhone}</td>
      </tr>
      <tr>
        <td style="font-weight:bold;">Total Amount:</td>
        <td><strong style="font-size:15px;color:#15803d;">₹${total.toLocaleString("en-IN")}</strong> (Subtotal: ₹${subtotal}, Disc: ₹${discount})</td>
      </tr>
      <tr style="background:#f4f4f5;">
        <td style="font-weight:bold;">Payment Method:</td>
        <td>${isCOD ? "Cash on Delivery" : "Prepaid Online"} (${paymentStatus})</td>
      </tr>
      <tr>
        <td style="font-weight:bold;">Shipping Destination:</td>
        <td>${shipping.address || ""}, ${shipping.city || ""}, ${shipping.state || ""} – ${shipping.pincode || ""}</td>
      </tr>
    </table>

    <div style="background:#fafafa;border:1px solid #e4e4e7;padding:16px;border-radius:4px;margin-bottom:24px;">
      <h4 style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#000;">Ordered Fragrances:</h4>
      <div style="font-size:13px;line-height:1.7;color:#27272a;">${itemsListText}</div>
    </div>

    <div style="text-align:center;padding-top:10px;">
      <a href="${WEBSITE_URL}/admin" style="display:inline-block;background:#000;color:#fff;text-decoration:none;padding:12px 28px;font-size:11px;text-transform:uppercase;letter-spacing:0.2em;font-weight:bold;">
        Open Admin Dashboard →
      </a>
    </div>
  </div>
</body>
</html>`;
}
