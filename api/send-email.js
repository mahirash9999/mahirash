import { sendEmail, renderOtpEmail, renderOrderConfirmationEmail } from "./lib/email.js";

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
      Your Mahirash Haute Parfumerie account has been created. Enjoy expedited checkout and order tracking.
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
