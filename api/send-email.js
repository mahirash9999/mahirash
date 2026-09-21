import nodemailer from "nodemailer";

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
    temp_password,
    account_created
  } = req.body;

  if (!to_email) {
    return res.status(400).json({ error: "Email is required" });
  }

  const user = process.env.VITE_GMAIL_USER || process.env.GMAIL_USER;
  const pass = process.env.VITE_GMAIL_PASS || process.env.GMAIL_PASS;

  if (!user || !pass) {
    console.warn("Gmail credentials missing. Skipping email send.");
    return res.status(200).json({ message: "Mock email sent (credentials missing)" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass
    }
  });

  const logo_url = "https://res.cloudinary.com/dcjn4y284/image/upload/v1786029668/p3jd3nuet4vkqbfd5qaz.png";
  const website_url = "https://mahirash.com";
  const support_email = "help@mahirash.com";

  let subject = "";
  let html = "";
  let fromEmail = "";

  if (type === "welcome") {
    subject = `Welcome to Mahirash, ${to_name}`;
    fromEmail = `"Mahirash Luxury" <no-reply@mahirash.com>`;
    html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background-color:#ffffff;font-family:sans-serif;">
  <div style="background-color:#ffffff;padding:20px 0;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="${logo_url}" alt="Mahirash" height="42" style="height:42px;display:block;margin:0 auto;"/>
  </div>
  <div style="padding:40px 20px;text-align:center;background:#ffffff;max-width:600px;margin:0 auto;">
    <h1 style="margin:0 0 24px;font-size:24px;text-transform:uppercase;color:#000000;letter-spacing:1px;">Welcome, ${to_name}</h1>
    <p style="color:#52525b;line-height:1.6;font-size:15px;margin-bottom:30px;">Your Mahirash Parfum account has been created. You now have exclusive access to our curated collections, order history, and your personal style profile.</p>
    <a href="${website_url}/shop" style="display:inline-block;background:#000;color:#fff;padding:14px 36px;text-decoration:none;text-transform:uppercase;font-weight:bold;">Explore Collections</a>
  </div>
</body>
</html>`;
  } else if (type === "otp") {
    subject = `Your Mahirash Login Code: ${otp_code}`;
    fromEmail = `"Mahirash Luxury" <no-reply@mahirash.com>`;
    html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background-color:#ffffff;font-family:sans-serif;">
  <div style="background-color:#ffffff;padding:20px 0;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="${logo_url}" alt="Mahirash" height="42" style="height:42px;display:block;margin:0 auto;"/>
  </div>
  <div style="padding:40px 20px;text-align:center;background:#ffffff;max-width:600px;margin:0 auto;">
    <h1 style="margin:0 0 12px;font-size:20px;text-transform:uppercase;color:#000000;letter-spacing:1px;font-weight:700;">YOUR LOGIN CODE</h1>
    <div style="background:#f4f4f5;padding:24px 0;margin:24px auto;max-width:280px;font-size:36px;font-weight:bold;letter-spacing:14px;color:#000000;border:1px solid #e4e4e7;">${otp_code}</div>
    <p style="color:#71717a;font-size:13px;margin:0;">This code is valid for 10 minutes.</p>
  </div>
</body>
</html>`;
  } else if (type === "order") {
    subject = `Order Confirmed – #${order_id} | Mahirash`;
    fromEmail = `"Mahirash Luxury" <auto-confirm@mahirash.com>`;
    html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background-color:#ffffff;font-family:sans-serif;">
  <div style="background-color:#ffffff;padding:20px 0;text-align:center;border-bottom:1px solid #e5e7eb;">
    <img src="${logo_url}" alt="Mahirash" height="42" style="height:42px;display:block;margin:0 auto;"/>
  </div>
  <div style="padding:40px 20px;background:#ffffff;max-width:600px;margin:0 auto;color:#27272a;">
    <h2 style="font-size:20px;text-transform:uppercase;color:#000000;margin-top:0;">Thank you, ${to_name}</h2>
    <p style="font-size:15px;line-height:1.5;margin-bottom:24px;">Your order <strong>#${order_id}</strong> is confirmed. Total: ${order_total}</p>
    <h3 style="font-size:14px;text-transform:uppercase;color:#000000;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:16px;">Items Ordered</h3>
    <pre style="font-family:sans-serif;color:#52525b;background:#fafaf9;padding:16px;border:1px solid #e5e7eb;border-radius:4px;white-space:pre-wrap;font-size:14px;line-height:1.6;margin-bottom:24px;">${items_summary}</pre>
    ${temp_password ? `<div style="background:#fefce8;padding:16px;border:1px solid #fef08a;border-radius:4px;margin-bottom:24px;">
      <p style="margin:0;"><strong>Account Auto-Created:</strong></p>
      <p>Password: <strong>${temp_password}</strong></p>
    </div>` : ""}
    <br/><br/>
    <a href="${website_url}/track" style="display:inline-block;background:#000;color:#fff;padding:14px 36px;text-decoration:none;text-transform:uppercase;font-weight:bold;">Track Order</a>
  </div>
</body>
</html>`;
  } else {
    return res.status(400).json({ error: "Invalid email type" });
  }

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: to_email,
      replyTo: support_email,
      subject,
      html
    });
    return res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Nodemailer error:", error);
    return res.status(500).json({ error: "Failed to send email" });
  }
}
