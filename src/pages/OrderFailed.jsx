import React from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { XCircle, RefreshCw, ShoppingCart, HelpCircle, ShieldAlert, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "../components/SEOHead";

const OrderFailed = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const errorMessage =
    location.state?.error ||
    "The transaction was cancelled or declined by your bank/card issuer.";

  const orderNumber = location.state?.orderNumber || null;

  return (
    <div className="min-h-screen bg-[#FCF9F4] text-[#30231F] font-sans pb-24 pt-28">
      <SEOHead title="Payment Unsuccessful | Mahirash Perfumes" />

      <div className="max-w-[650px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-rose-200 p-8 sm:p-12 shadow-sm text-center space-y-6"
        >
          {/* Failure Icon */}
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-inner">
            <XCircle size={44} strokeWidth={1.5} />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full">
              PAYMENT DECLINED OR CANCELLED
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#30231F]">
              Acquisition Unsuccessful
            </h1>
            {orderNumber && (
              <p className="text-xs font-mono text-[#75665D]">
                Attempt Reference: #{orderNumber}
              </p>
            )}
          </div>

          {/* Failure Info Box */}
          <div className="p-4 bg-rose-50/80 rounded-xl border border-rose-200 max-w-md mx-auto text-left">
            <p className="text-[11px] font-bold uppercase tracking-wider text-rose-800 mb-1 flex items-center gap-1.5">
              <ShieldAlert size={14} /> Reason for Failure:
            </p>
            <p className="text-xs font-medium text-rose-900 leading-relaxed">
              {errorMessage}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-[#75665D] max-w-md mx-auto leading-relaxed">
            Your bag items have been safely saved. No charges have been debited from your card or UPI account. If an amount was deducted by your bank, it will be automatically reversed within 24–48 hours.
          </p>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/checkout")}
              className="w-full sm:w-auto px-8 py-3.5 bg-[#800020] hover:bg-[#650018] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw size={15} />
              <span>Retry Payment</span>
            </button>

            <Link
              to="/cart"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#FCF9F4] border border-[#E9DCCB] text-[#30231F] hover:border-[#800020] text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={15} />
              <span>Return to Bag</span>
            </Link>
          </div>

          {/* Concierge Help */}
          <div className="pt-6 border-t border-[#F5EFEB] text-xs text-[#75665D]">
            Need assistance completing your order?{" "}
            <a
              href="mailto:help@mahirash.com?subject=Payment%20Assistance"
              className="text-[#800020] font-bold hover:underline"
            >
              Contact Concierge
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderFailed;

