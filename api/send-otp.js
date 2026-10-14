import crypto from "crypto";
import { normalizeEmail, saveOtpRecord, getCooldownRemaining } from "./lib/firebaseAdmin.js";
import { sendEmail, renderOtpEmail } from "./lib/email.js";

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
  const remainingCooldown = getCooldownRemaining(cleanEmail);
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

    // Send email using Nodemailer
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

    return res.status(200).json({
      success: true,
      message: "Verification code sent to your email",
      cooldownSeconds
    });
  } catch (err) {
    console.error("Send OTP endpoint error:", err.message);
    const isBadCredentials = err.message && (err.message.includes("535") || err.message.includes("BadCredentials") || err.message.includes("Username and Password not accepted"));
    return res.status(500).json({
      error: isBadCredentials
        ? "SMTP Authentication Failed (535): Gmail App Password was rejected. Please generate a new 16-character App Password at Google Account > Security > 2-Step Verification > App passwords."
        : "Failed to dispatch verification code. Please check your network and try again."
    });
  }
}
