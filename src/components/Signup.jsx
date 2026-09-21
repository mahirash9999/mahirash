import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import SEOHead from "./SEOHead";
import OptimizedCloudinaryImage from "./OptimizedCloudinaryImage";

const Signup = () => {
  const { user, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const redirectPath = searchParams.get("redirect") || "/";

  useEffect(() => {
    if (user) {
      const finalPath = redirectPath.startsWith("/") ? redirectPath : "/" + redirectPath;
      navigate(finalPath);
    }
  }, [user, navigate, redirectPath]);

  const sendWelcomeEmail = async (emailAddress, fullName) => {
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "welcome",
          to_email: emailAddress.toLowerCase().trim(),
          to_name: fullName
        })
      });
      if (response.ok) {
        console.log("Welcome email sent successfully.");
      } else {
        console.error("Welcome email delivery failed.");
      }
    } catch (err) {
      console.error("Welcome email delivery failed:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      await signup(email, password, displayName);
      await sendWelcomeEmail(email, displayName);
      const finalPath = redirectPath.startsWith("/") ? redirectPath : "/" + redirectPath;
      navigate(finalPath);
    } catch (err) {
      setError("Failed to create account. Email may already be associated with an account.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      const finalPath = redirectPath.startsWith("/") ? redirectPath : "/" + redirectPath;
      navigate(finalPath);
    } catch (err) {
      setError("Google sign-up failed or was cancelled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex flex-col justify-center items-center relative overflow-hidden px-4 py-12 md:py-20 font-['Inter',sans-serif]">
      <SEOHead
        title="Create Account | Mahirash Parfumerie"
        description="Join Mahirash Parfumerie to enjoy faster checkout, exclusive drop access, and track your orders."
        robots="noindex, follow"
        url="https://mahirash.com/signup"
      />
      {/* Collection Navigation Button */}
      <div className="w-full max-w-[1100px] flex justify-start mb-6 z-10">
        <Link
          to="/shop"
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-zinc-500 hover:text-black transition-all duration-300 font-semibold"
        >
          <span className="text-[12px] font-sans">←</span> Collections
        </Link>
      </div>

      <div className="w-full max-w-[1100px] grid lg:grid-cols-12 gap-0 border border-zinc-200/80 bg-white min-h-[600px] z-10 shadow-2xl overflow-hidden rounded-none">
        {/* Left Side: Modern Luxury editorial layout */}
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
            <span className="text-[9px] uppercase tracking-[0.35em] text-[#d9a036] font-semibold">Atelier Membership</span>
            <h1 className="text-3xl md:text-4xl font-extralight text-white tracking-[0.18em] uppercase leading-[1.3] mt-4 mb-6">
              Style<br />Journey
            </h1>
            <div className="w-12 h-[1px] bg-[#d9a036]/60" />
            <p className="text-[13px] text-zinc-300 leading-relaxed mt-6 max-w-xs font-light">
              Create an exclusive account to track shipments, compile wishlist edits, and expedite checkout.
            </p>
          </div>

          <div className="relative z-10 pt-6">
            <span className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-medium">MAHIRASH LUXURY ATELIER</span>
          </div>
        </div>

        {/* Right Side: Luxury signup credentials input */}
        <div className="lg:col-span-7 p-8 md:p-12 lg:p-14 flex flex-col justify-between bg-white text-zinc-900 border-t border-zinc-100 lg:border-t-0">
          <div className="relative z-10 h-8 flex items-center">
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#d9a036]">Register Inquiry</span>
          </div>

          {/* Form wrapper */}
          <div className="max-w-[420px] w-full relative z-10 my-auto py-8">
            <div className="mb-8">
              <h2 className="text-2xl font-extralight text-zinc-900 tracking-[0.2em] uppercase">Create Account</h2>
              <p className="text-[10px] text-zinc-400 tracking-[0.15em] font-medium uppercase mt-2">Join our signature collective</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-6"
                >
                  <div className="p-4 bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-[12px] rounded-none">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-[0.3em] font-semibold text-zinc-500">Full Name</label>
                <div className="relative">
                  <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Wade Warren"
                    required
                    className="w-full pl-10 pr-4 py-3.5 bg-zinc-50/50 border border-zinc-200 text-[13px] text-zinc-900 outline-none focus:border-black focus:bg-white transition-all duration-300 placeholder:text-zinc-400 rounded-none font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-[0.3em] font-semibold text-zinc-500">Email Address</label>
                <div className="relative">
                  <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    placeholder="name@email.com"
                    required
                    className="w-full pl-10 pr-4 py-3.5 bg-zinc-50/50 border border-zinc-200 text-[13px] text-zinc-900 outline-none focus:border-black focus:bg-white transition-all duration-300 placeholder:text-zinc-400 lowercase tracking-wider rounded-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-[0.3em] font-semibold text-zinc-500">Password</label>
                <div className="relative">
                  <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-3.5 bg-zinc-50/50 border border-zinc-200 text-[13px] text-zinc-900 outline-none focus:border-black focus:bg-white transition-all duration-300 placeholder:text-zinc-450 rounded-none"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-black hover:bg-zinc-800 text-white font-semibold text-[10px] uppercase tracking-[0.25em] transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer shadow-sm disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Register credentials</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </form>

            {/* Premium Divider */}
            <div className="relative my-7 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200/80"></div>
              </div>
              <span className="relative bg-white px-3 text-[9px] uppercase tracking-[0.3em] text-zinc-400 font-medium">Or register with</span>
            </div>

            {/* Google Social Signup */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full py-3.5 border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 text-[11px] font-semibold uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" width="100%" height="100%">
                <path
                  fill="#EA4335"
                  d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.52 0-6.37-2.85-6.37-6.37s2.85-6.37 6.37-6.37c1.558 0 2.979.56 4.093 1.486l3.12-3.12C19.14 2.164 15.918 1 12.24 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.452 0 11.385-4.52 11.385-11.385 0-.52-.047-1.018-.124-1.486H12.24z"
                />
              </svg>
              <span>Sign up with Google</span>
            </button>
          </div>

          {/* Sign In redirect */}
          <div className="relative z-10 pt-6">
            <span className="text-[13px] text-zinc-500 tracking-wider">
              Already registered?{" "}
              <Link
                to={`/login?redirect=${encodeURIComponent(redirectPath)}`}
                className="text-black hover:text-[#d9a036] transition-colors uppercase text-[10px] tracking-[0.2em] font-semibold ml-1.5"
              >
                Sign In
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
