import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "./useAuth";
import { useCustomerAuth } from "./CustomerAuthProvider";
import { sendOTPEmail, verifyOTPCode, findCustomerByEmail } from "./CustomerAuthProvider";
import {
  Mail, Lock, ArrowRight, AlertCircle, CheckCircle2,
  RefreshCw, ShieldCheck, Eye, EyeOff, Sparkles, KeyRound
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "./SEOHead";
import OptimizedCloudinaryImage from "./OptimizedCloudinaryImage";
import { db } from "./Firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { isValidEmail } from "../utils/validation";

// Steps Enum
const STEP = {
  OTP_REQUEST: "otp_request",
  OTP_VERIFY: "otp_verify",
  PASSWORD_LOGIN: "password_login",
  NEW_USER_SETUP: "new_user_setup",
  SUCCESS: "success"
};

const Login = () => {
  const { user, login, signup, loginWithCustomToken, setPassword, loginWithGoogle } = useAuth();
  const { customerLogin } = useCustomerAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/account";

  // Form States
  const [step, setStep] = useState(STEP.OTP_REQUEST);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPasswordInput] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Status & Timers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [verifiedTokenData, setVerifiedTokenData] = useState(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && step !== STEP.NEW_USER_SETUP && step !== STEP.SUCCESS) {
      const final = redirectPath.startsWith("/") ? redirectPath : "/" + redirectPath;
      navigate(final);
    }
  }, [user, navigate, redirectPath, step]);

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // ── Step 1: Request Email OTP ──────────────────────────────────────────────
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendOTPEmail(cleanEmail);
      setCooldown(res.cooldownSeconds || 45);
      setStep(STEP.OTP_VERIFY);
    } catch (err) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Resend OTP ─────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (cooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await sendOTPEmail(email.toLowerCase().trim());
      setCooldown(res.cooldownSeconds || 45);
    } catch (err) {
      setError(err.message || "Could not resend verification code.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Verify OTP ─────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const verifyRes = await verifyOTPCode(cleanEmail, cleanOtp);
      setVerifiedTokenData(verifyRes);

      // Authenticate Firebase user session
      if (verifyRes.customToken) {
        await loginWithCustomToken(verifyRes.customToken);
      }

      // Populate CustomerAuthContext session immediately so Account page works
      const existingProfile = await findCustomerByEmail(cleanEmail).catch(() => null);
      const sessionData = {
        id: verifyRes.user?.uid || existingProfile?.id || cleanEmail.replace(/[^a-z0-9]/g, "_"),
        uid: verifyRes.user?.uid || existingProfile?.uid || "",
        email: cleanEmail,
        name: existingProfile?.name || verifyRes.user?.displayName || cleanEmail.split("@")[0],
        phone: existingProfile?.phone || "",
      };
      customerLogin(sessionData);

      // If new user: present optional name + password setup screen
      if (verifyRes.isNewUser) {
        setStep(STEP.NEW_USER_SETUP);
      } else {
        // Existing user: direct success & redirect to account
        setStep(STEP.SUCCESS);
        setTimeout(() => {
          navigate("/account");
        }, 1200);
      }
    } catch (err) {
      setError(err.message || "Verification failed. Please check the code.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4A: New User Sets Password ───────────────────────────────────────
  const handleCreatePassword = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const finalName = displayName.trim() || cleanEmail.split("@")[0];

      // If user is already authenticated via custom token, update password directly
      if (user) {
        await setPassword(password);
      } else {
        // Create account with email/password via Firebase Auth
        await signup(cleanEmail, password, finalName);
      }

      // Ensure customer session reflects the new name
      customerLogin({
        id: user?.uid || verifiedTokenData?.user?.uid || cleanEmail.replace(/[^a-z0-9]/g, "_"),
        uid: user?.uid || verifiedTokenData?.user?.uid || "",
        email: cleanEmail,
        name: finalName,
        phone: "",
      });

      setStep(STEP.SUCCESS);
      setTimeout(() => navigate("/account"), 1200);
    } catch (err) {
      console.error("Password setup notice:", err);
      // Proceed safely even if Firebase error (e.g. account already exists)
      setStep(STEP.SUCCESS);
      setTimeout(() => navigate("/account"), 1200);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 4B: New User Skips Password ──────────────────────────────────────
  const handleSkipPassword = async () => {
    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const customerDocId = cleanEmail.replace(/[^a-z0-9]/g, "_");
      const finalName = displayName.trim() || cleanEmail.split("@")[0];

      // Save initial customer profile in Firestore
      await setDoc(doc(db, "customers", customerDocId), {
        email: cleanEmail,
        name: finalName,
        uid: user?.uid || verifiedTokenData?.user?.uid || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Populate customer session so Account page works immediately
      customerLogin({
        id: user?.uid || verifiedTokenData?.user?.uid || customerDocId,
        uid: user?.uid || verifiedTokenData?.user?.uid || "",
        email: cleanEmail,
        name: finalName,
        phone: "",
      });

      setStep(STEP.SUCCESS);
      setTimeout(() => navigate("/account"), 1000);
    } catch (_) {
      navigate("/account");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 5: Password Login Flow ───────────────────────────────────────────
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError("");
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(cleanEmail, password);
      setStep(STEP.SUCCESS);
      setTimeout(() => {
        const final = redirectPath.startsWith("/") ? redirectPath : "/" + redirectPath;
        navigate(final);
      }, 1200);
    } catch (err) {
      console.error("Password login error:", err);
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid email or password. You can also log in instantly using Email OTP.");
      } else {
        setError("Sign-in failed. Please try Email OTP login instead.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Google Login Flow ─────────────────────────────────────────────────────
  const handleGoogleAuth = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      const final = redirectPath.startsWith("/") ? redirectPath : "/" + redirectPath;
      navigate(final);
    } catch (err) {
      setError("Google sign-in was cancelled or encountered an error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center relative overflow-hidden px-4 py-12 md:py-20 font-sans">
      <SEOHead
        title="Sign In | Mahirash Haute Parfumerie"
        description="Access your exclusive Mahirash account with secure Email OTP or Password authentication."
        robots="noindex, follow"
        url="https://mahirash.com/login"
      />

      {/* Top Breadcrumb */}
      <div className="w-full max-w-[1100px] flex justify-start mb-6 z-10">
        <Link
          to="/shop"
          className="flex items-center gap-1.5 text-[12px] uppercase tracking-[0.25em] text-zinc-500 hover:text-black transition-all duration-300 font-semibold"
        >
          <span className="text-[12px] font-sans">←</span> Collections
        </Link>
      </div>

      <div className="w-full max-w-[1100px] grid lg:grid-cols-12 gap-0 border border-zinc-200/80 bg-white min-h-[620px] z-10 shadow-2xl overflow-hidden rounded-none">

        {/* Left Editorial Column */}
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
            <span className="text-[12px] md:text-[14px] uppercase tracking-[0.35em] text-[#d9a036] font-semibold">Customer Account</span>
            <h1 className="text-3xl md:text-4xl font-extralight text-white tracking-[0.18em] uppercase leading-[1.3] mt-4 mb-6">
              Sensory<br />Sanctuary
            </h1>
            <div className="w-12 h-[1px] bg-[#d9a036]/60" />
            <p className="text-[13px] md:text-[14px] text-zinc-300 leading-relaxed mt-6 max-w-xs font-light">
              Log in securely to view curated extraits, review your bespoke order history, and track real-time delivery timelines.
            </p>
          </div>

          <div className="relative z-10 pt-6">
            <span className="text-[12px] md:text-[13px] text-zinc-500 uppercase tracking-[0.3em] font-medium">MAHIRASH LUXURY PERFUMES</span>
          </div>
        </div>

        {/* Right Authentication Panel */}
        <div className="lg:col-span-7 p-8 md:p-12 lg:p-14 flex flex-col justify-between bg-white text-zinc-900 border-t border-zinc-100 lg:border-t-0">
          <div className="relative z-10 h-8 flex items-center justify-between">
            <span className="text-[12px] uppercase tracking-[0.3em] font-semibold text-[#d9a036]">
              {step === STEP.PASSWORD_LOGIN ? "Password Authentication" : "Passwordless Verification"}
            </span>
          </div>

          <div className="max-w-[420px] w-full relative z-10 my-auto py-6">

            {/* Header Text */}
            <div className="mb-6">
              <h2 className="text-2xl font-extralight text-zinc-900 tracking-[0.2em] uppercase">
                {step === STEP.NEW_USER_SETUP ? "Set Password" : step === STEP.OTP_VERIFY ? "Enter Code" : "Sign In"}
              </h2>
              <p className="text-[12px] md:text-[13px] text-zinc-400 tracking-[0.15em] font-medium uppercase mt-2">
                {step === STEP.OTP_VERIFY
                  ? `Sent to ${email}`
                  : step === STEP.NEW_USER_SETUP
                    ? "Email verified successfully! Optional faster login"
                    : "Seamless access for customers"}
              </p>
            </div>

            {/* Error Banner */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6"
                >
                  <div className="p-3.5 bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-[12px] md:text-[13px]">
                    <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-600" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── VIEW 1: REQUEST OTP ───────────────────────────────────────── */}
            {step === STEP.OTP_REQUEST && (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[12px] md:text-[13px] uppercase tracking-[0.3em] font-semibold text-zinc-500">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@mahirash.com"
                      required
                      className="w-full pl-10 pr-4 py-3.5 bg-zinc-50/50 border border-zinc-200 text-[14px] text-zinc-900 outline-none focus:border-black focus:bg-white transition-all duration-300 placeholder:text-zinc-400 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-black text-white text-[12px] uppercase tracking-[0.3em] font-bold hover:bg-zinc-800 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin" /> Dispatching Code...
                    </span>
                  ) : (
                    <>
                      <span>Continue with Email OTP</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>

                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200" /></div>
                  <span className="relative bg-white px-3 text-[12px] uppercase tracking-[0.2em] text-zinc-400 font-semibold">Or</span>
                </div>

                {/* Alternate Actions */}
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => { setError(""); setStep(STEP.PASSWORD_LOGIN); }}
                    className="w-full py-3.5 border border-zinc-200 bg-white text-zinc-800 text-[12px] uppercase tracking-[0.25em] font-semibold hover:border-black hover:text-black transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <KeyRound size={13} />
                    <span>Login with Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={loading}
                    className="w-full py-3.5 border border-zinc-200 bg-white text-zinc-800 text-[12px] uppercase tracking-[0.25em] font-semibold hover:border-black hover:text-black transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── VIEW 2: VERIFY OTP ────────────────────────────────────────── */}
            {step === STEP.OTP_VERIFY && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[12px] uppercase tracking-[0.3em] font-semibold text-zinc-500">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="••••••"
                    autoFocus
                    required
                    className="w-full text-center py-3.5 bg-zinc-50 border border-zinc-200 text-2xl font-bold tracking-[14px] text-zinc-900 outline-none focus:border-black focus:bg-white transition-all font-mono"
                  />
                  <p className="text-[12px] text-zinc-400 text-center">
                    Valid for 10 minutes. Check your spam folder if delayed.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-4 bg-black text-white text-[12px] uppercase tracking-[0.3em] font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin" /> Verifying Code...
                    </span>
                  ) : (
                    <>
                      <span>Verify & Access Account</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2 text-[12px]">
                  <button
                    type="button"
                    onClick={() => { setError(""); setStep(STEP.OTP_REQUEST); }}
                    className="text-zinc-500 hover:text-black underline cursor-pointer"
                  >
                    ← Change Email
                  </button>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={cooldown > 0 || loading}
                    className="font-semibold text-zinc-800 hover:text-black disabled:text-zinc-400 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
                  </button>
                </div>
              </form>
            )}

            {/* ── VIEW 3: PASSWORD LOGIN ───────────────────────────────────── */}
            {step === STEP.PASSWORD_LOGIN && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] md:text-[13px] uppercase tracking-[0.3em] font-semibold text-zinc-500">Email Address</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@mahirash.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-zinc-50/50 border border-zinc-200 text-[14px] text-zinc-900 outline-none focus:border-black focus:bg-white transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[12px] uppercase tracking-[0.3em] font-semibold text-zinc-500">Password</label>
                    <Link
                      to="/forgot-password"
                      className="text-[12px] text-zinc-400 hover:text-black underline font-medium"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-10 py-3 bg-zinc-50/50 border border-zinc-200 text-[13px] text-zinc-900 outline-none focus:border-black focus:bg-white transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-black text-white text-[12px] uppercase tracking-[0.3em] font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/5 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin" /> Authenticating...
                    </span>
                  ) : (
                    <>
                      <span>Login with Password</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => { setError(""); setStep(STEP.OTP_REQUEST); }}
                    className="text-[12px] text-zinc-600 hover:text-black underline font-medium cursor-pointer"
                  >
                    ← Login with Email OTP instead
                  </button>
                </div>
              </form>
            )}

            {/* ── VIEW 4: NEW USER PASSWORD PROMPT ─────────────────────────── */}
            {step === STEP.NEW_USER_SETUP && (
              <form onSubmit={handleCreatePassword} className="space-y-4">
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-none flex items-start gap-3 text-emerald-800 text-[12px] mb-2">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <strong>Email verified successfully!</strong>
                    <p className="mt-0.5 text-emerald-700 text-[12px]">
                      Create a password for faster login next time, or skip to continue right away.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] uppercase tracking-[0.3em] font-semibold text-zinc-500">Your Full Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 text-[13px] text-zinc-900 outline-none focus:border-black focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] uppercase tracking-[0.3em] font-semibold text-zinc-500">Password (Min 6 Characters)</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 text-[13px] text-zinc-900 outline-none focus:border-black focus:bg-white transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] uppercase tracking-[0.3em] font-semibold text-zinc-500">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-zinc-50/50 border border-zinc-200 text-[13px] text-zinc-900 outline-none focus:border-black focus:bg-white transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-black text-white text-[12px] uppercase tracking-[0.3em] font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-black/5 disabled:opacity-50 mt-2"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw size={13} className="animate-spin" /> Saving Password...
                    </span>
                  ) : (
                    <>
                      <span>Create Account & Save Password</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={handleSkipPassword}
                    disabled={loading}
                    className="text-[12px] text-zinc-500 hover:text-black underline font-semibold cursor-pointer"
                  >
                    Skip for Now →
                  </button>
                </div>
              </form>
            )}

            {/* ── VIEW 5: SUCCESS ──────────────────────────────────────────── */}
            {step === STEP.SUCCESS && (
              <div className="text-center py-8 space-y-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <CheckCircle2 size={30} />
                </div>
                <h3 className="text-xl font-light uppercase tracking-[0.15em] text-zinc-900">
                  Authentication Successful
                </h3>
                <p className="text-[12px] text-zinc-500">
                  Welcome to Mahirash. Establishing your private session...
                </p>
              </div>
            )}

          </div>

          <div className="relative z-10 text-center border-t border-zinc-100 pt-5">
            <span className="text-[12px] uppercase tracking-[0.2em] text-zinc-400 font-medium">
              Protected by Mahirash 256-bit Security Infrastructure
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
