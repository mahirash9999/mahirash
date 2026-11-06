import crypto from "crypto";
import { normalizeEmail, saveOtpRecord, getCooldownRemaining } from "../_lib/firebaseAdmin.js";
import { sendEmail } from "../_lib/email.js";

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

  const { email, name } = req.body || {};

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "A valid email address is required" });
  }

  const cleanEmail = normalizeEmail(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: "Please provide a valid email format" });
  }

  // Prevent customer OTP flow from interfering with administrative accounts
  const restrictedAdmins = [
    process.env.ADMIN_EMAIL ? normalizeEmail(process.env.ADMIN_EMAIL) : null,
    process.env.SMTP_USER ? normalizeEmail(process.env.SMTP_USER) : null
  ].filter(Boolean);
  if (restrictedAdmins.includes(cleanEmail)) {
    return res.status(403).json({
      error: "This address is reserved for administrative access. Please log in at /admin."
    });
  }

  // Check rate-limiting / resend cooldown
  const remainingCooldown = await getCooldownRemaining(cleanEmail);
  if (remainingCooldown > 0) {
    return res.status(429).json({
      error: `Please wait ${remainingCooldown}s before requesting another verification code.`,
      cooldownSeconds: remainingCooldown
    });
  }

  try {
    // Generate 6-digit cryptographically secure OTP
    const otp = crypto.randomInt(100000, 1000000).toString();

    // Save hashed OTP with 10-minute expiry and 45-second cooldown
    const { cooldownSeconds } = await saveOtpRecord({
      email: cleanEmail,
      otp,
      durationMinutes: 10,
      cooldownSeconds: 45
    });

    console.log(`\n========================================`);
    console.log(`🔑 [MAHIRASH OTP] Verification code for ${cleanEmail}: ${otp}`);
    console.log(`========================================\n`);

    // Attempt email delivery with graceful fallback
    let emailSent = false;
    let mailErrorMessage = "";
    try {
      const emailHtml = renderOtpEmail({
        otp,
        toEmail: cleanEmail,
        name: name || cleanEmail.split("@")[0]
      });

      await sendEmail({
        to: cleanEmail,
        subject: `Your Mahirash Login Code: ${otp}`,
        html: emailHtml
      });
      emailSent = true;
    } catch (mailErr) {
      mailErrorMessage = mailErr.message || "SMTP error";
      console.warn("⚠️ SMTP transmission error (OTP saved and logged to console):", mailErrorMessage);
    }

    return res.status(200).json({
      success: true,
      emailSent,
      mailError: !emailSent ? mailErrorMessage : undefined,
      message: "Verification code sent to your email",
      cooldownSeconds
    });
  } catch (err) {
    console.error("Send OTP endpoint error:", err.message);
    return res.status(500).json({
      error: "Failed to dispatch verification code. Please check your network and try again."
    });
  }
}
