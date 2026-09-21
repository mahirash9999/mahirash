import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Search, Home, RefreshCw } from "lucide-react";
import SEOHead from "../components/SEOHead";

const floatVariants = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
  }
};

const NotFound = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(null);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4 pt-[145px] md:pt-[105px] pb-16 select-none overflow-hidden relative">
      <SEOHead
        title="404 – Page Not Found | Mahirash Parfumerie"
        description="The page you're looking for doesn't exist."
        robots="noindex"
        url="https://mahirash.com/404"
      />

      {/* Background decorative blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-zinc-200/50 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full bg-zinc-300/30 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-8">

        {/* Animated 404 */}
        <motion.div variants={floatVariants} animate="animate" className="relative inline-block">
          {/* Large ghost number */}
          <div className="relative">
            <span className="block text-[8rem] sm:text-[10rem] font-black text-zinc-200 leading-none select-none tracking-tight">
              404
            </span>
            {/* Floating shopping bag icon */}
            <motion.div
              initial={{ rotate: -12 }}
              animate={{ rotate: [-12, 12, -12] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-20 h-20 rounded-2xl bg-white shadow-lg border border-zinc-200 flex items-center justify-center">
                <ShoppingBag size={36} strokeWidth={1.5} className="text-zinc-400" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-3"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">
            Oops! Page Not Found
          </h1>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs mx-auto">
            The page you're looking for has moved, been removed, or doesn't exist. Let's get you back on track.
          </p>
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link
            to="/"
            className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 hover:bg-black text-white text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <Home size={15} />
            Back to Home
          </Link>
          <Link
            to="/shop"
            className="w-full sm:w-auto px-8 py-3.5 bg-white border border-zinc-300 text-zinc-800 text-sm font-bold uppercase tracking-wider rounded-xl hover:border-zinc-700 hover:text-zinc-900 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            <ShoppingBag size={15} />
            Shop Collection
          </Link>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="pt-2"
        >
          <p className="text-[14px] text-zinc-400 uppercase tracking-wider mb-3">Quick Links</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { to: "/shop", label: "New Arrivals" },
              { to: "/cart", label: "My Cart" },
              { to: "/account", label: "My Account" },
              { to: "/contact", label: "Contact Us" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3.5 py-1.5 bg-white border border-zinc-200 rounded-full text-[14px] font-medium text-zinc-600 hover:border-zinc-400 hover:text-zinc-900 transition-all"
              >
                {label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div >
    </div >
  );
};

export default NotFound;
