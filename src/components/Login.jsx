import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

import { useCustomerAuth, findCustomerByEmail, sendOTPEmail } from "./CustomerAuthProvider";
import {
  Mail, ArrowRight, AlertCircle, CheckCircle2,
  RefreshCw, ShieldCheck, KeyRound
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "./SEOHead";
import OptimizedCloudinaryImage from "./OptimizedCloudinaryImage";
import { db } from "./Firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

// Generate 6-digit numeric OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── STEP ENUM ────────────────────────────────────────────────────────────────
const STEP = { EMAIL: "email", OTP: "otp", SUCCESS: "success" };

const Login = () => {
  const { customer, customerLogin } = useCustomerAuth(); // customer session
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/account";

  // ── State ──────────────────────────────────────────────────────────────────
  const [step, setStep] = useState(STEP.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [sentOtp, setSentOtp] = useState("");   // stored in state (not Firestore – client-side for demo; for production use a serverless function)
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [otpCooldown, setOtpCooldown] = useState(0);   // seconds countdown for resend
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [foundCustomer, setFoundCustomer] = useState(null);


  // ── If customer session already active, redirect ─────────────────────────
  useEffect(() => {
    if (customer) {
      const final = redirectPath.startsWith("/") ? redirectPath : "/" + redirectPath;
      navigate(final);
    }
  }, [customer, navigate, redirectPath]);

  // ── OTP cooldown timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  // ── STEP 1: Check email against customers collection ──────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();

      // Check if email is a hardcoded admin or in users/admins collection
      const hardcodedAdmins = ["mahirsh9999@gmail.com", "admin@mahirash.com"];
      if (hardcodedAdmins.includes(cleanEmail)) {
        setError("This is an administrator account. Please proceed to the Admin Panel.");
        setLoading(false);
        return;
      }
      const usersSnap = await getDocs(query(collection(db, "users"), where("email", "==", cleanEmail)));
      const adminsSnap = await getDocs(query(collection(db, "admins"), where("email", "==", cleanEmail)));

      if (!usersSnap.empty || !adminsSnap.empty) {
        setError("This is an administrator account. Please proceed to the Admin Panel.");
        setLoading(false);
        return;
      }

      const found = await findCustomerByEmail(cleanEmail);

      if (!found) {
        setError("no_account"); // render a special UI state
        setLoading(false);
        return;
      }

      // Found — generate & send OTP
      setFoundCustomer(found);
      const newOtp = generateOTP();
      const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      await sendOTPEmail(cleanEmail, newOtp, found.name || cleanEmail);

      setSentOtp(newOtp);
      setOtpExpiry(expiry);
      setStep(STEP.OTP);
      setOtpCooldown(60); // 60 second resend cooldown
    } catch (err) {
      console.error("Email check error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP ────────────────────────────────────────────────────
  const handleOtpSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (Date.now() > otpExpiry) {
      setError("OTP has expired. Please request a new one.");
      return;
    }

    if (otp.trim() !== sentOtp) {
      setError("Incorrect OTP. Please check your email and try again.");
      return;
    }

    // OTP matched — log customer in
    customerLogin(foundCustomer);
    setStep(STEP.SUCCESS);

    setTimeout(() => {
      const final = redirectPath.startsWith("/") ? redirectPath : "/" + redirectPath;
      navigate(final);
    }, 1200);
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (otpCooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const newOtp = generateOTP();
      await sendOTPEmail(email.toLowerCase().trim(), newOtp, foundCustomer?.name || "");
      setSentOtp(newOtp);
      setOtpExpiry(Date.now() + 10 * 60 * 1000);
      setOtpCooldown(60);
    } catch (_) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center relative overflow-hidden px-4 py-12 md:py-20 font-['Inter',sans-serif]">
      <SEOHead
        title="Sign In | Mahirash Parfumerie"
        description="Sign in to your Mahirash account to view saved orders, wishlist, and profile settings."
        robots="noindex, follow"
        url="https://mahirash.com/login"
      />

      {/* Back to collection */}
      <div className="w-full max-w-[1100px] flex justify-start mb-6 z-10">
        <Link
          to="/shop"
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-zinc-500 hover:text-black transition-all duration-300 font-semibold"
        >
          <span className="text-[12px] font-sans">←</span> Collections
        </Link>
      </div>

      <div className="w-full max-w-[1100px] grid lg:grid-cols-12 gap-0 border border-zinc-200/80 bg-white min-h-[600px] z-10 shadow-2xl overflow-hidden">

        {/* ── LEFT PANEL ── */}
        <div className="lg:col-span-5 bg-black p-8 md:p-12 lg:p-14 flex flex-col justify-between relative overflow-hidden text-white border-r border-zinc-200">
          <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay">
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-400 via-zinc-800 to-black" />
          </div>

          <div className="relative z-10">
            <Link to="/" className="inline-block mb-10">
              <img
                src="/logom.webp"
                alt="MAHIRASH"
                className="h-8 md:h-10 w-auto object-contain brightness-0 invert"
              />
            </Link>
          </div>

          <div className="relative z-10 my-auto">
            <span className="text-[9px] uppercase tracking-[0.35em] text-[#d9a036] font-semibold">Atelier Member Access</span>
            <h1 className="text-3xl md:text-4xl font-extralight text-white tracking-[0.18em] uppercase leading-[1.3] mt-4 mb-6">
              Welcome<br />Back
            </h1>
            <div className="w-12 h-[1px] bg-[#d9a036]/60" />
            <p className="text-[13px] text-zinc-300 leading-relaxed mt-6 max-w-xs font-light">
              Enter your email address to receive a secure one-time login code. No passwords — just seamless, secure access.
            </p>
          </div>

          <div className="relative z-10 pt-6">
            <span className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-medium">MAHIRASH LUXURY ATELIER</span>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="lg:col-span-7 p-8 md:p-12 lg:p-14 flex flex-col justify-between bg-white text-zinc-900">
          <div className="relative z-10 h-8 flex items-center">
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#d9a036]">Verified Client Portal</span>
          </div>

          <div className="max-w-[420px] w-full relative z-10 my-auto py-8">

            <AnimatePresence mode="wait">

              {/* ── STEP 1: Email Input ── */}
              {step === STEP.EMAIL && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="mb-8">
                    <h2 className="text-2xl font-extralight text-zinc-900 tracking-[0.2em] uppercase">Sign In</h2>
                    <p className="text-[10px] text-zinc-400 tracking-[0.15em] font-medium uppercase mt-2">Enter your email to receive a one-time code</p>
                  </div>

                  {/* Error: no account found */}
                  <AnimatePresence>
                    {error === "no_account" && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-sm"
                      >
                        <p className="text-[12px] text-amber-800 font-medium">
                          No account found for <strong>{email}</strong>.
                        </p>
                        <p className="text-[11px] text-amber-700 mt-1">
                          Place an order first — your account will be created automatically at checkout.
                        </p>
                        <div className="flex gap-3 mt-3">
                          <Link
                            to="/shop"
                            className="text-[10px] uppercase tracking-widest font-bold text-black bg-white border border-black px-3 py-2 hover:bg-black hover:text-white transition"
                          >
                            Shop Now
                          </Link>
                          <Link
                            to="/signup"
                            className="text-[10px] uppercase tracking-widest font-semibold text-zinc-600 border border-zinc-300 px-3 py-2 hover:border-black hover:text-black transition"
                          >
                            Sign Up Instead
                          </Link>
                        </div>
                      </motion.div>
                    )}
                    {error && error !== "no_account" && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-[12px]"
                      >
                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleEmailSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.3em] font-semibold text-zinc-500">Email Address</label>
                      <div className="relative">
                        <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value.toLowerCase()); setError(""); }}
                          placeholder="name@email.com"
                          required
                          autoFocus
                          className="w-full pl-10 pr-4 py-3.5 bg-zinc-50/50 border border-zinc-200 text-[14px] text-zinc-900 outline-none focus:border-black focus:bg-white transition-all duration-300 placeholder:text-zinc-400 lowercase tracking-wider"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-4 bg-black hover:bg-zinc-800 text-white font-semibold text-[10px] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Send Login Code</span>
                          <ArrowRight size={13} />
                        </>
                      )}
                    </button>
                  </form>

                  <div className="mt-8 pt-6 border-t border-zinc-100">
                    <p className="text-[12px] text-zinc-500">
                      New here?{" "}
                      <Link to="/shop" className="text-black font-semibold hover:text-[#b8860b] transition-colors underline underline-offset-2">
                        Shop & get started
                      </Link>{" "}
                      — your account is auto-created at checkout.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: OTP Entry ── */}
              {step === STEP.OTP && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="mb-8">
                    <div className="w-12 h-12 border border-zinc-200 bg-zinc-50 flex items-center justify-center mb-4 rounded-sm">
                      <KeyRound size={20} className="text-[#b8860b]" />
                    </div>
                    <h2 className="text-2xl font-extralight text-zinc-900 tracking-[0.2em] uppercase">Verify Code</h2>
                    <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
                      A 6-digit code was sent to{" "}
                      <span className="text-zinc-800 font-semibold tracking-wider">{email}</span>
                    </p>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-6 p-4 bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-[12px]"
                      >
                        <AlertCircle size={15} className="shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleOtpSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.3em] font-semibold text-zinc-500">One-Time Code</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                        placeholder="123456"
                        required
                        autoFocus
                        className="w-full px-4 py-4 bg-zinc-50 border border-zinc-200 text-center text-2xl font-mono font-bold text-zinc-900 outline-none focus:border-black focus:bg-white transition-all duration-300 tracking-[0.5em]"
                      />
                      <p className="text-[10px] text-zinc-400">Code expires in 10 minutes.</p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.length < 6}
                      className="w-full py-4 bg-black hover:bg-zinc-800 text-white font-semibold text-[10px] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      <ShieldCheck size={13} />
                      <span>Verify & Sign In</span>
                    </button>
                  </form>

                  {/* Resend & Back */}
                  <div className="mt-6 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={() => { setStep(STEP.EMAIL); setOtp(""); setError(""); }}
                      className="text-zinc-500 hover:text-black transition-colors"
                    >
                      ← Change email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpCooldown > 0 || loading}
                      className="flex items-center gap-1.5 text-[#b8860b] hover:text-black font-semibold disabled:opacity-40 transition-colors"
                    >
                      <RefreshCw size={11} className={loading ? "animate-spin" : ""} />
                      {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend Code"}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: Success ── */}
              {step === STEP.SUCCESS && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8 space-y-4"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full mb-2">
                    <CheckCircle2 size={30} className="text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-extralight uppercase tracking-widest text-zinc-900">Signed In</h2>
                  <p className="text-[12px] text-zinc-500">
                    Welcome back, <strong className="text-zinc-800">{foundCustomer?.name || email}</strong>. Redirecting…
                  </p>
                  <div className="w-6 h-6 border-2 border-zinc-200 border-t-black rounded-full animate-spin mx-auto mt-4" />
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          <div className="relative z-10 pt-6">
            <span className="text-[13px] text-zinc-500 tracking-wider">
              Admin?{" "}
              <a
                href="/admin"
                className="text-black hover:text-[#d9a036] transition-colors uppercase text-[10px] tracking-[0.2em] font-semibold ml-1.5"
              >
                Admin Panel →
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
