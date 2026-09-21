import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Mail, Lock, ArrowRight, AlertCircle, Eye, EyeOff, KeyRound, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { db } from "./Firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "./useAuth";
import SEOHead from "./SEOHead";
import OptimizedCloudinaryImage from "./OptimizedCloudinaryImage";

const ForgotPassword = () => {
    const { resetPassword, login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectPath = searchParams.get("redirect") || "/";

    // Flow State: 1 = Email Input, 2 = OTP Input, 3 = New Password Input
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState("");
    const [generatedOtp, setGeneratedOtp] = useState("");
    const [enteredOtp, setEnteredOtp] = useState(["", "", "", "", "", ""]);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // UI state
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // OTP inputs references
    const otpRefs = useRef([]);

    // Countdown timer for OTP resend
    useEffect(() => {
        let interval;
        if (resendTimer > 0) {
            interval = setInterval(() => {
                setResendTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendTimer]);

    // Handle Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        const formattedEmail = email.toLowerCase().trim();

        try {
            // 1. Verify if user email exists in Firestore
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("email", "==", formattedEmail));
            const querySnap = await getDocs(q);

            if (querySnap.empty) {
                throw new Error("This email is not registered with us.");
            }

            // 2. Generate 6-digit OTP passcode
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(otpCode);

            // 3. Send OTP email via new API
            try {
                const response = await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "otp",
                        to_email: formattedEmail,
                        otp_code: otpCode
                    })
                });

                if (response.ok) {
                    setSuccess("OTP sent successfully to your email address!");
                } else {
                    console.log(`[Dev Mode] Verification Code for ${formattedEmail} is: ${otpCode}`);
                    setSuccess(`[Dev Mode] OTP is ${otpCode}`);
                }
            } catch (err) {
                console.error(err);
                setSuccess(`[Dev Mode] OTP is ${otpCode}`);
            }

            setResendTimer(30);
            setStep(2);
        } catch (err) {
            setError(err.message || "Failed to send reset code. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setError("");
        setSuccess("");
        setLoading(true);

        const formattedEmail = email.toLowerCase().trim();

        try {
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
            setGeneratedOtp(otpCode);

            try {
                const response = await fetch("/api/send-email", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        type: "otp",
                        to_email: formattedEmail,
                        otp_code: otpCode
                    })
                });

                if (response.ok) {
                    setSuccess("A new verification code has been sent!");
                } else {
                    console.log(`[Dev Mode] Resent Verification Code for ${formattedEmail} is: ${otpCode}`);
                    setSuccess(`[Dev Mode] New OTP is ${otpCode}`);
                }
            } catch (err) {
                console.error(err);
                setSuccess(`[Dev Mode] New OTP is ${otpCode}`);
            }

            setResendTimer(30);
        } catch (err) {
            setError(err.message || "Resend failed. Try again.");
        } finally {
            setLoading(false);
        }
    };

    // Keyboard navigation & inputs for OTP
    const handleOtpChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...enteredOtp];
        newOtp[index] = value.substring(value.length - 1);
        setEnteredOtp(newOtp);

        // Auto-focus next input box
        if (value && index < 5 && otpRefs.current[index + 1]) {
            otpRefs.current[index + 1].focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === "Backspace" && !enteredOtp[index] && index > 0 && otpRefs.current[index - 1]) {
            otpRefs.current[index - 1].focus();
        }
    };

    // Handle verification of OTP code
    const handleVerifyOtp = (e) => {
        e.preventDefault();
        setError("");
        const combinedOtp = enteredOtp.join("");

        if (combinedOtp.length < 6) {
            setError("Please key in the complete 6-digit code.");
            return;
        }

        if (combinedOtp === generatedOtp) {
            setSuccess("Verification successful! Set your new password.");
            setStep(3);
        } else {
            setError("Incorrect verification code. Please check and try again.");
        }
    };

    // Handle password reset submit
    const handlePasswordResetSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            setLoading(false);
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.");
            setLoading(false);
            return;
        }

        const formattedEmail = email.toLowerCase().trim();

        try {
            // 1. Update password in database
            await resetPassword(formattedEmail, newPassword);

            // 2. Perform auto-login to create user session immediately
            await login(formattedEmail, newPassword);

            setSuccess("Password reset successfully! Logging you in...");
            setTimeout(() => {
                const finalPath = redirectPath.startsWith("/") ? redirectPath : "/" + redirectPath;
                navigate(finalPath);
            }, 1500);
        } catch (err) {
            setError("Failed to update password. Please try again.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f5f5] flex flex-col justify-center items-center relative overflow-hidden px-5 py-12">
            <SEOHead
                title="Recover Password | Mahirash Parfumerie"
                description="Verify your email with security passcode and reset your password online."
                robots="noindex, follow"
                url="https://mahirash.com/forgot-password"
            />

            {/* Collection Navigation Button */}
            <div className="w-full max-w-[1100px] flex justify-start mb-6 z-10 px-2 lg:px-0">
                <Link
                    to="/shop"
                    className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-zinc-500 hover:text-black transition-all duration-300"
                >
                    <span className="text-[14px]">←</span> Collection
                </Link>
            </div>

            <div className="w-full max-w-[1100px] grid lg:grid-cols-12 gap-12 lg:gap-0 border border-zinc-200 bg-white min-h-[580px] z-10 shadow-xl">
                {/* Left Side: Atelier Styling */}
                <div className="lg:col-span-5 bg-[#f5f5f5] p-8 md:p-12 lg:p-14 flex flex-col justify-between border-r border-zinc-200 relative overflow-hidden text-zinc-900">
                    <div className="relative z-10">
                        <Link to="/" className="inline-block mb-10">
                            <img src="/logom.webp" alt="MAHIRASH" className="h-8 md:h-10 w-auto object-contain brightness-0" />
                        </Link>
                    </div>

                    <div className="relative z-10 my-auto">
                        <span className="text-[10px] uppercase tracking-[0.25em] text-[#b8860b]">Security Portal</span>
                        <h1 className="text-3xl md:text-4xl font-light text-zinc-900 tracking-[0.16em] uppercase leading-[1.25] mt-3 mb-5">
                            Reset<br />Password
                        </h1>
                        <div className="w-8 h-[1px] bg-[#b8860b]/50" />
                        <p className="text-[14px] text-zinc-600 leading-relaxed mt-5 max-w-xs">
                            Verify your security credentials, generate OTP verification codes, and rebuild your password.
                        </p>
                    </div>

                    <div className="relative z-10 pt-6">
                        <span className="text-[9px] text-zinc-400 uppercase tracking-widest font-medium">© MAHIRASH PARFUMERIE</span>
                    </div>
                </div>

                {/* Right Side: Step-by-Step Forms */}
                <div className="lg:col-span-7 p-8 md:p-12 lg:p-14 flex flex-col justify-between bg-white text-zinc-900">
                    {/* Header metadata */}
                    <div className="relative z-10 h-9 flex items-center">
                        <span className="text-[10px] uppercase tracking-[0.25em] font-medium text-zinc-400">ATELIER MEMBERSHIP</span>
                    </div>

                    <div className="max-w-[420px] w-full relative z-10 my-auto py-8">
                        <div className="mb-6">
                            <h2 className="text-xl font-light text-zinc-900 tracking-[0.2em] uppercase">
                                {step === 1 ? "Password Recovery" : step === 2 ? "Verification Code" : "Set New Password"}
                            </h2>
                            <p className="text-[11px] text-[#b8860b] tracking-wider font-medium mt-1 uppercase">
                                {step === 1 ? "ENTER EMAIL TO CONTINUE" : step === 2 ? `OTP HAS BEEN SENT TO ${email.toUpperCase()}` : "CREATE A STRONG PASSCODE"}
                            </p>
                        </div>

                        {/* Notifications */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                                    <div className="p-3.5 bg-red-50 border border-red-200 flex items-start gap-3 text-red-600 text-[11px]">
                                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                </motion.div>
                            )}

                            {success && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
                                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-800 text-[11px]">
                                        <CheckCircle size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                                        <span>{success}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* STEP 1: Email Form */}
                        {step === 1 && (
                            <form onSubmit={handleSendOtp} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] uppercase tracking-[0.25em] text-zinc-500">Email Address</label>
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value.toLowerCase())}
                                            placeholder="name@email.com"
                                            required
                                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-300 text-[14px] text-zinc-900 outline-none focus:border-zinc-500 transition-all duration-300 placeholder:text-zinc-400 lowercase tracking-wider"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-black hover:bg-zinc-800 text-white font-semibold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Send OTP Code</span>
                                            <ArrowRight size={13} />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* STEP 2: OTP Entry Form */}
                        {step === 2 && (
                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 block">Verification Code</label>
                                    <div className="flex justify-between gap-2.5">
                                        {enteredOtp.map((digit, idx) => (
                                            <input
                                                key={idx}
                                                ref={(el) => (otpRefs.current[idx] = el)}
                                                type="text"
                                                maxLength={1}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                                required
                                                className="w-12 h-12 text-center text-lg font-bold border border-zinc-300 bg-zinc-50 outline-none focus:border-zinc-800 transition-colors"
                                            />
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-4 bg-black hover:bg-zinc-800 text-white font-semibold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <span>Verify OTP</span>
                                    <CheckCircle size={13} />
                                </button>

                                <div className="text-center pt-2">
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={resendTimer > 0 || loading}
                                        className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-black font-semibold disabled:opacity-40 transition-colors"
                                    >
                                        {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP Code"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* STEP 3: Reset Password Form */}
                        {step === 3 && (
                            <form onSubmit={handlePasswordResetSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-[0.25em] text-zinc-500">New Password</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="New password"
                                                required
                                                className="w-full pl-10 pr-10 py-3 bg-zinc-50 border border-zinc-300 text-[14px] text-zinc-900 outline-none focus:border-zinc-500 transition-all duration-300 placeholder:text-zinc-400"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[9px] uppercase tracking-[0.25em] text-zinc-500">Confirm Password</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                placeholder="Re-enter password"
                                                required
                                                className="w-full pl-10 pr-10 py-3 bg-zinc-50 border border-zinc-300 text-[14px] text-zinc-900 outline-none focus:border-zinc-500 transition-all duration-300 placeholder:text-zinc-400"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-black hover:bg-zinc-800 text-white font-semibold text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Set Password & Sign In</span>
                                            <ArrowRight size={13} />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="relative z-10 pt-6">
                        <span className="text-[14px] text-zinc-500 tracking-wider">
                            Remember your password?{" "}
                            <Link to={`/login?redirect=${encodeURIComponent(redirectPath)}`} className="text-zinc-900 hover:text-black transition-colors uppercase text-[11px] tracking-wider ml-1">Sign In</Link>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
