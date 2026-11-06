import { sendEmail, renderOrderConfirmationEmail } from "../_lib/email.js";

function renderOtpEmail({ otp, name }) {
  const recipientName = name || "Valued Patron";
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Your Mahirash Login Code</title></head>
<body style="margin: 0; padding: 0; background-color: #FCF9F4; font-family: 'Times New Roman', Times, serif; color: #30231F;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF9F4; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width: 560px; background-color: #ffffff; border: 1px solid #E9DCCB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
          <tr>
            <td style="background-color: #800020; padding: 24px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; letter-spacing: 4px; text-transform: uppercase;">MAHIRASH</h1>
              <p style="margin: 4px 0 0; color: #FCF9F4; font-size: 10px; letter-spacing: 2px; text-transform: uppercase;">Luxury Perfumes</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              <h2 style="margin: 0 0 12px; color: #30231F; font-size: 17px; letter-spacing: 1px;">Security Verification Code</h2>
              <p style="margin: 0 0 16px; color: #75665D; font-size: 14px; line-height: 1.6;">Hello ${recipientName},</p>
              <p style="margin: 0 0 20px; color: #75665D; font-size: 14px; line-height: 1.6;">Use the one-time passcode below to authenticate your Mahirash account access:</p>
              <div style="background-color: #FCF9F4; border: 1px dashed #800020; border-radius: 8px; padding: 18px; text-align: center; margin: 0 0 20px;">
                <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #800020;">${otp}</span>
              </div>
              <p style="margin: 0; color: #9E8E84; font-size: 12px; line-height: 1.5;">This passcode is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #FCF9F4; padding: 16px; text-align: center; border-top: 1px solid #E9DCCB; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
              <p style="margin: 0; color: #75665D; font-size: 11px;">&copy; ${new Date().getFullYear()} MAHIRASH PERFUMES</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    type,          // "welcome", "otp", or "order"
    to_email,
    to_name,
    otp_code,
    order_id,
    order_total,
    items_summary,
    temp_password
  } = req.body || {};

  if (!to_email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const cleanEmail = to_email.toLowerCase().trim();

  try {
    if (type === "otp") {
      const html = renderOtpEmail({
        otp: otp_code || "000000",
        toEmail: cleanEmail,
        name: to_name
      });
      await sendEmail({
        to: cleanEmail,
        subject: `Your Mahirash Login Code: ${otp_code}`,
        html
      });
      return res.status(200).json({ message: "OTP email sent successfully" });
    }

    if (type === "order") {
      const html = renderOrderConfirmationEmail({
        order: {
          id: order_id,
          orderNumber: order_id,
          customerName: to_name,
          total: order_total,
          items: (items_summary || "").split("\n").map(line => ({ name: line, quantity: 1, price: "" }))
        }
      });
      await sendEmail({
        to: cleanEmail,
        subject: `Order Confirmed – #${order_id} | Mahirash`,
        html
      });
      return res.status(200).json({ message: "Order email sent successfully" });
    }

    // Default welcome email
    const welcomeHtml = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background-color:#ffffff;font-family:sans-serif;">
  <div style="background-color:#000000;padding:28px 16px;text-align:center;">
    <h1 style="margin:0;font-size:24px;font-weight:400;letter-spacing:0.35em;color:#ffffff;text-transform:uppercase;font-family:'Times New Roman',Times,Georgia,serif;">MAHIRASH</h1>
  </div>
  <div style="padding:40px 20px;text-align:center;max-width:600px;margin:0 auto;">
    <h1 style="margin:0 0 16px;font-size:22px;text-transform:uppercase;letter-spacing:2px;">Welcome, ${to_name || "Valued Guest"}</h1>
    <p style="color:#52525b;line-height:1.6;font-size:14px;margin-bottom:28px;">
      Your Mahirash Luxury Perfumes account has been created. Enjoy fast checkout and order tracking.
    </p>
    <a href="https://mahirash.com/shop" style="display:inline-block;background:#000;color:#fff;padding:14px 32px;text-decoration:none;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">
      Explore Fragrances
    </a>
  </div>
</body>
</html>`;

    await sendEmail({
      to: cleanEmail,
      subject: `Welcome to Mahirash, ${to_name || "Connoisseur"}`,
      html: welcomeHtml
    });

    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("send-email legacy route error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
