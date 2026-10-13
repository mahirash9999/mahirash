import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../components/Firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2, ShieldCheck, Eye, EyeOff, Sparkles } from "lucide-react";

const AdminSignup = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.toLowerCase().trim();

    if (!name.trim()) {
      setError("Please enter your admin full name.");
      return;
    }

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
      // 1. Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // 2. Update display name
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }

      // 3. Register user in Firestore 'admins' collection
      await setDoc(doc(db, "admins", user.uid), {
        uid: user.uid,
        email: cleanEmail,
        displayName: name.trim(),
        role: "admin",
        createdAt: serverTimestamp(),
      });

      // 4. Also register in 'users' collection with admin role
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: cleanEmail,
        displayName: name.trim(),
        role: "admin",
        createdAt: serverTimestamp(),
      });

      // 5. Save admin session tokens so Admin Dashboard opens immediately
      sessionStorage.setItem("adminToken", "PASOJA_SUPER_ADMIN");
      localStorage.setItem("adminToken", "PASOJA_SUPER_ADMIN");

      setSuccess(true);
    } catch (err) {
      console.error("Admin registration error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered in Firebase. You can log in directly at /admin.");
      } else if (err.code === "auth/weak-password") {
        setError("The password is too weak. Please choose a stronger password.");
      } else if (err.code === "auth/invalid-email") {
        setError("Please enter a valid email address.");
      } else {
        setError(err.message || "Failed to create admin account.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f5f5f5] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-['Inter',sans-serif]">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-[#c9a962]/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-black/[0.03] blur-2xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-zinc-200/90 p-6 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-3xl relative z-10 space-y-6 transition-all duration-500">
        
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 rounded-2xl bg-black text-[#c9a962] flex items-center justify-center shadow-xl shadow-black/10 ring-4 ring-black/5 mx-auto mb-2">
            <Sparkles size={22} strokeWidth={2} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[10px] font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck size={12} />
            Temporary Setup Route
          </div>
          <h1 className="text-lg font-poppins font-extrabold tracking-[0.2em] text-zinc-900 uppercase">
            REGISTER ADMIN
          </h1>
          <p className="text-[9.5px] text-[#b8860b] uppercase tracking-[0.25em] font-extrabold">
            HAUTE PARFUMERIE CONTROL CENTRE
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-700 text-[12px] font-medium flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success view */}
        {success ? (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-zinc-900">Admin Account Created!</h2>
              <p className="text-xs text-zinc-500">
                Admin credentials for <strong className="text-zinc-800">{email}</strong> have been saved to Firebase Authentication & Firestore.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-xl text-left space-y-1">
              <p className="text-[11px] font-semibold text-amber-900">Notice:</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                You can now delete this file (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">src/pages/AdminSignup.jsx</code>) and remove the route from <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">App.jsx</code> whenever you are ready.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="w-full py-3.5 bg-black text-white font-extrabold text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-zinc-800 active:scale-[0.98] flex items-center justify-center gap-2.5 rounded-xl shadow-lg shadow-black/10 cursor-pointer"
            >
              <span>Go to Admin Dashboard</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          /* Signup Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 block pl-0.5 font-bold">
                Admin Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Admin Name"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50/80 border border-zinc-300 rounded-xl text-[13px] font-medium text-zinc-900 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all duration-300 placeholder:text-zinc-400 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 block pl-0.5 font-bold">
                Admin Email ID
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@mahirash.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50/80 border border-zinc-300 rounded-xl text-[13px] font-medium text-zinc-900 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all duration-300 placeholder:text-zinc-400 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 block pl-0.5 font-bold">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-11 py-3 bg-zinc-50/80 border border-zinc-300 rounded-xl text-[13px] font-medium text-zinc-900 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all duration-300 placeholder:text-zinc-400 shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 block pl-0.5 font-bold">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50/80 border border-zinc-300 rounded-xl text-[13px] font-medium text-zinc-900 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all duration-300 placeholder:text-zinc-400 shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-black text-white font-extrabold text-[11px] uppercase tracking-[0.2em] transition-all duration-300 hover:bg-zinc-800 active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-black/10 rounded-xl mt-3 disabled:opacity-60"
            >
              <span>{loading ? "Registering Admin..." : "Register Admin Account"}</span>
              <ArrowRight size={14} />
            </button>

            <div className="text-center pt-2">
              <Link
                to="/admin"
                className="text-[11px] text-zinc-500 hover:text-black transition-colors underline font-medium"
              >
                Already have an admin account? Go to Admin Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminSignup;
