import React, { useEffect, useState } from "react";
import MiniLoader from "../components/MiniLoader";
import { db } from "../components/Firebase";
import {
  collection, getDocs, addDoc, serverTimestamp,
  doc, deleteDoc, getDoc, updateDoc, query, where, setDoc
} from "firebase/firestore";

import { Link, useNavigate } from "react-router-dom";
import {
  MapPin, User, Phone, Mail, CheckCircle, X,
  ShieldCheck, ChevronRight, Plus, Check, Lock, Tag,
  ArrowRight, Package, Truck, Home
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "../components/SEOHead";
import OptimizedCloudinaryImage from "../components/OptimizedCloudinaryImage";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinaryUtils";

/* ─── Payment method icons (inline SVG logos) ───────────────────────────── */
const UPIIcon = () => (
  <svg viewBox="0 0 64 40" width="40" height="25" fill="none">
    <rect width="64" height="40" rx="4" fill="#fff" />
    <text x="32" y="26" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#6B3FA0" fontFamily="sans-serif">UPI</text>
  </svg>
);
const GPayIcon = () => (
  <svg viewBox="0 0 80 32" width="48" height="22" fill="none">
    <text x="0" y="22" fontSize="14" fontWeight="800" fontFamily="sans-serif">
      <tspan fill="#4285F4">G</tspan><tspan fill="#EA4335">o</tspan><tspan fill="#FBBC05">o</tspan><tspan fill="#4285F4">g</tspan><tspan fill="#34A853">l</tspan><tspan fill="#EA4335">e</tspan>
      <tspan fill="#5F6368" fontSize="12"> Pay</tspan>
    </text>
  </svg>
);
const PhonePeIcon = () => (
  <svg viewBox="0 0 80 32" width="52" height="22" fill="none">
    <rect width="80" height="32" rx="4" fill="#5F259F" />
    <text x="40" y="22" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#fff" fontFamily="sans-serif">PhonePe</text>
  </svg>
);
const PaytmIcon = () => (
  <svg viewBox="0 0 80 32" width="48" height="22" fill="none">
    <rect width="80" height="32" rx="4" fill="#00BAF2" />
    <text x="40" y="22" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#fff" fontFamily="sans-serif">Paytm</text>
  </svg>
);
const VisaIcon = () => (
  <svg viewBox="0 0 60 20" width="40" height="16" fill="none">
    <text x="0" y="16" fontSize="17" fontWeight="900" fill="#1A1F71" fontFamily="sans-serif" letterSpacing="-1">VISA</text>
  </svg>
);
const MasterIcon = () => (
  <svg viewBox="0 0 38 24" width="32" height="22">
    <circle cx="14" cy="12" r="11" fill="#EB001B" opacity="0.9" />
    <circle cx="24" cy="12" r="11" fill="#F79E1B" opacity="0.9" />
    <path d="M19 4.5a11 11 0 0 1 0 15 11 11 0 0 1 0-15z" fill="#FF5F00" />
  </svg>
);

/* ─── Order Status pages ─────────────────────────────────────────────────── */
const OrderSuccess = ({ navigate, orderDetails }) => {
  const finalDetails = orderDetails || {
    id: "MHR-" + Math.floor(100000 + Math.random() * 900000),
    total: 0,
    shipping: { name: "", phone: "", address: "", city: "", state: "", pincode: "", paymentMethod: "COD" },
    items: [],
    appliedCoupon: null,
    couponDiscount: 0,
    tempPassword: ""
  };

  const isCOD = finalDetails.shipping?.paymentMethod !== "online";

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center px-4 pt-[155px] md:pt-[125px] pb-24">
      <SEOHead title="Order Confirmed | Mahirash" robots="noindex" url="https://mahirash.com/checkout" />
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white border border-zinc-200/80 rounded-2xl max-w-2xl w-full shadow-2xl p-6 md:p-10 text-zinc-905"
        style={{ color: "#18181b" }}
      >
        {/* Subtle Luxury Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-black/5 bg-emerald-50 mb-4 animate-pulse">
            <CheckCircle size={28} className="text-emerald-600" />
          </div>
          <h1 className="text-3xl font-light uppercase tracking-[0.15em] font-serif text-zinc-950">
            Order Confirmed
          </h1>
          <p className="text-zinc-500 font-light text-sm mt-1.5 font-sans">
            Thank you. Your order has been placed and is currently being processed.
          </p>
        </div>

        {/* Essential Info Columns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-zinc-205 py-6 mb-8 text-center text-[14px] tracking-wider uppercase font-medium">
          <div>
            <p className="text-zinc-400 font-normal">Order ID</p>
            <p className="text-zinc-900 font-bold mt-1 select-all font-mono normal-case">{finalDetails.id}</p>
          </div>
          <div>
            <p className="text-zinc-400 font-normal">Date</p>
            <p className="text-zinc-900 font-bold mt-1 font-mono normal-case">
              {new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div>
            <p className="text-zinc-400 font-normal">Total Amount</p>
            <p className="text-zinc-905 font-extrabold mt-1 text-sm font-sans">
              ₹{(finalDetails.total || 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="text-zinc-400 font-normal">Payment</p>
            <p className="text-zinc-900 font-bold mt-1 text-[11px]">
              {isCOD ? "COD" : "Prepaid"}
            </p>
          </div>
        </div>

        {/* Auto Generated Account Box */}
        {finalDetails.tempPassword && (
          <div className="mb-8 p-4 bg-zinc-50 border border-zinc-200 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-zinc-905" />
            <div className="flex gap-3">
              <User size={18} className="text-zinc-700 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-[14px] font-bold uppercase tracking-wider text-zinc-900">
                  Account Created Successfully
                </h4>
                <p className="text-[11px] text-zinc-500 font-light mt-1 leading-relaxed">
                  We've automatically generated an account for you using your email to help you track shipments and view receipts.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-4 text-[14px] font-mono bg-white border border-zinc-200/80 p-2.5 rounded-lg">
                  <div>
                    <span className="text-zinc-400">Email:</span>{" "}
                    <span className="text-zinc-800 font-semibold">{finalDetails.shipping?.email}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Password:</span>{" "}
                    <span className="text-zinc-850 font-semibold select-all font-mono">{finalDetails.tempPassword}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-[14px] leading-relaxed">
          {/* Shipping Address Summary */}
          <div className="space-y-2 bg-zinc-50/50 p-4.5 rounded-xl border border-zinc-100/60 p-4 text-left">
            <h3 className="font-extrabold text-zinc-950 uppercase tracking-widest text-[10px] pb-1.5 border-b border-zinc-200 flex items-center gap-1.5">
              <MapPin size={12} className="text-zinc-500" /> Shipping Details
            </h3>
            <p className="font-bold text-zinc-900 text-sm font-serif">{finalDetails.shipping?.name}</p>
            <p className="text-zinc-500 font-light">{finalDetails.shipping?.address}</p>
            <p className="text-zinc-500 font-light">{finalDetails.shipping?.city}, {finalDetails.shipping?.state} – {finalDetails.shipping?.pincode}</p>
            <p className="text-zinc-800 font-semibold mt-1">Phone: {finalDetails.shipping?.phone}</p>
          </div>

          {/* Delivery & Tracking Details */}
          <div className="space-y-2 bg-zinc-50/50 p-4.5 rounded-xl border border-zinc-100/60 p-4 text-left flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="font-extrabold text-zinc-950 uppercase tracking-widest text-[10px] pb-1.5 border-b border-zinc-200 flex items-center gap-1.5">
                <Truck size={12} className="text-zinc-500" /> Shipping & Tracking
              </h3>
              <div>
                <p className="text-zinc-400 uppercase tracking-wider text-[9px]">Status</p>
                <p className="text-zinc-800 font-semibold text-[14px] flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Order Placed – Processing
                </p>
              </div>

              {finalDetails.awbCode && (
                <div className="pt-1.5 grid grid-cols-2 gap-2 text-[10px] bg-white border border-zinc-200 p-2 rounded-lg">
                  <div>
                    <span className="text-zinc-400 block uppercase font-medium">AWB Track Code</span>
                    <span className="text-zinc-900 font-bold font-mono text-[14px] select-all">{finalDetails.awbCode}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block uppercase font-medium">Carrier Partner</span>
                    <span className="text-zinc-900 font-bold uppercase">{finalDetails.courierName || "Delhivery"}</span>
                  </div>
                </div>
              )}
            </div>

            {finalDetails.awbCode && (
              <a
                href={finalDetails.trackingUrl || `https://shiprocket.co/tracking/${finalDetails.awbCode}`}
                target="_blank"
                rel="noreferrer"
                className="w-full text-center py-2.5 bg-zinc-900 hover:bg-black text-[10px] text-white font-extrabold uppercase tracking-widest rounded-lg transition-colors border border-black inline-block mt-2"
              >
                Track Live Order
              </a>
            )}
          </div>
        </div>

        {/* Order Items Summary */}
        <div className="space-y-3 mb-8 text-left">
          <h3 className="font-extrabold text-zinc-950 uppercase tracking-widest text-[10px] pb-1.5 border-b border-zinc-200">
            Order Items
          </h3>
          <div className="divide-y divide-zinc-100 max-h-48 overflow-y-auto pr-1">
            {(finalDetails.items || []).map((item, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-[14px]">
                <div className="flex items-center gap-3 min-w-0">
                  <OptimizedCloudinaryImage
                    src={item.image}
                    preset="avatar"
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg border border-zinc-150 bg-zinc-55 shrink-0"
                  />
                  <div className="truncate">
                    <p className="font-bold text-zinc-900 text-sm truncate font-serif">{item.name}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {item.size ? `Size: ${item.size}` : ""}
                      {item.color ? ` • Color: ${item.color}` : ""}
                      {` • Qty: ${item.quantity || 1}`}
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-zinc-800 shrink-0 font-sans">
                  ₹{((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-zinc-200">
          <Link
            to="/orders"
            className="w-full py-3.5 bg-zinc-900 hover:bg-black text-white text-[14px] font-bold uppercase tracking-widest rounded-xl transition-all text-center flex items-center justify-center gap-2 border border-zinc-900 shadow-sm"
          >
            <Package size={14} /> My Orders
          </Link>
          <Link
            to="/shop"
            className="w-full py-3.5 bg-white hover:bg-zinc-50 text-zinc-805 text-[14px] font-extrabold uppercase tracking-widest rounded-xl transition-all text-center border border-zinc-200"
          >
            Continue Shopping
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const OrderFailed = ({ onRetry }) => (
  <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-4 pt-[145px] md:pt-[105px] pb-16">
    <SEOHead title="Payment Failed | Mahirash" robots="noindex" url="https://mahirash.com/checkout" />
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-2xl shadow-sm border border-zinc-200 max-w-md w-full overflow-hidden"
    >
      <div className="bg-red-500 px-8 py-10 text-center">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
          <X size={36} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Payment Failed</h1>
        <p className="text-red-100 text-sm">The transaction could not be completed</p>
      </div>
      <div className="px-8 py-6 space-y-3">
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-sm text-red-700">
          Your payment was not processed. No amount has been deducted from your account.
        </div>
        <button onClick={onRetry} className="w-full py-3.5 bg-zinc-900 hover:bg-black text-white text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors">
          Try Again <ArrowRight size={14} />
        </button>
        <Link to="/cart" className="w-full py-3 border border-zinc-200 text-zinc-700 text-sm font-semibold rounded-xl hover:bg-zinc-50 transition-colors text-center block">
          Back to Cart
        </Link>
      </div>
    </motion.div>
  </div>
);

/* ─── Main Checkout Component ────────────────────────────────────────────── */
const Checkout = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", address: "", city: "", state: "", pincode: "",
    paymentMethod: "online",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [toast, setToast] = useState(null);

  // Suggested states for postal lookup API
  const [citySearchSuggestions, setCitySearchSuggestions] = useState([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Suggested states for Coupon System
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [createdOrderDetails, setCreatedOrderDetails] = useState(null);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const total = items.reduce((sum, i) => sum + ((Number(i.price) || 0) * (i.quantity || 1)), 0);

  const handleCityChange = async (val) => {
    setFormData(prev => ({ ...prev, city: val }));
    if (val.trim().length <= 2) {
      setCitySearchSuggestions([]);
      setShowCitySuggestions(false);
      return;
    }
    try {
      setSearchLoading(true);
      const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(val.trim())}`);
      const data = await res.json();
      if (data && data[0] && data[0].PostOffice) {
        setCitySearchSuggestions(data[0].PostOffice);
        setShowCitySuggestions(true);
      } else {
        setCitySearchSuggestions([]);
      }
    } catch (e) {
      console.error("Error fetching city postal info:", e);
    } finally {
      setSearchLoading(false);
    }
  };

  const selectCitySuggestion = (office) => {
    setFormData(prev => ({
      ...prev,
      city: office.District || office.Block || office.Name || prev.city,
      state: office.State || prev.state,
      pincode: office.Pincode || prev.pincode
    }));
    setCitySearchSuggestions([]);
    setShowCitySuggestions(false);
  };

  const handleApplyCoupon = async (codeToApply = couponCode) => {
    const cleanCode = codeToApply.toUpperCase().trim();
    if (!cleanCode) return;
    setCouponError("");
    setCouponSuccess("");
    try {
      const snap = await getDoc(doc(db, "coupons", cleanCode));
      if (!snap.exists()) {
        setCouponError("Coupon code not found or expired.");
        showToast("Coupon code not found or expired.", "error");
        return;
      }
      const data = snap.data();
      if (!data.is_active) {
        setCouponError("Coupon code not found or expired.");
        showToast("Coupon not found or expired.", "error");
        return;
      }

      // Check min order threshold
      const subtotal = items.reduce((sum, i) => sum + ((Number(i.price) || 0) * (i.quantity || 1)), 0);
      if (subtotal < (Number(data.min_order) || 0)) {
        setCouponError(`Minimum order of ₹${data.min_order} required for this coupon.`);
        showToast(`Minimum order of ₹${data.min_order} required.`, "error");
        return;
      }

      // Check applicable products
      if (data.applicableProducts && data.applicableProducts.length > 0) {
        const matchingItems = items.filter(item => {
          const productId = item.id || item.cartId?.split("-")[0];
          return data.applicableProducts.includes(productId);
        });

        if (matchingItems.length === 0) {
          setCouponError("This coupon is not applicable to any items in your bag.");
          showToast("This coupon is not applicable to any items in your bag.", "error");
          return;
        }
      }

      setAppliedCoupon(data);
      localStorage.setItem("applied_coupon_code", cleanCode);
      setCouponSuccess("Coupon code applied successfully!");
      showToast("Coupon applied successfully!");
    } catch (e) {
      console.error(e);
      setCouponError("Error checking coupon. Permissions restricted.");
      showToast("Error checking coupon.", "error");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    setCouponError("");
    setCouponSuccess("");
    localStorage.removeItem("applied_coupon_code");
    showToast("Coupon removed.");
  };

  // Recalculate coupon discount if items or coupon changes
  useEffect(() => {
    if (appliedCoupon && items.length > 0) {
      const subtotal = items.reduce((sum, i) => sum + ((Number(i.price) || 0) * (i.quantity || 1)), 0);
      let eligibleSubtotal = subtotal;

      if (appliedCoupon.applicableProducts && appliedCoupon.applicableProducts.length > 0) {
        const matchingItems = items.filter(item => {
          const productId = item.id || item.cartId?.split("-")[0];
          return appliedCoupon.applicableProducts.includes(productId);
        });

        eligibleSubtotal = matchingItems.reduce((sum, i) => sum + ((Number(i.price) || 0) * (i.quantity || 1)), 0);
      }

      let discountAmount = 0;
      if (appliedCoupon.discount_type === "Percentage") {
        discountAmount = eligibleSubtotal * (Number(appliedCoupon.discount_val) / 100);
      } else {
        discountAmount = Math.min(eligibleSubtotal, Number(appliedCoupon.discount_val));
      }
      setCouponDiscount(Math.round(discountAmount));
    } else {
      setCouponDiscount(0);
    }
  }, [items, appliedCoupon]);

  // Global listener to close suggestions on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('[name="city"]')) {
        setShowCitySuggestions(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const sendOrderConfirmationEmail = async (emailAddress, fullName, orderId, orderTotal, tempPassword = "") => {
    try {
      const itemsSummary = items
        .map((item) => `${item.name} (${item.size ? "Size: " + item.size + ", " : ""}Qty: ${item.quantity || 1}) - ₹${item.price}`)
        .join("\n");

      let messageText = `Thank you for your order, ${fullName}!\n\nOrder ID: ${orderId}\nTotal Amount: ₹${orderTotal.toLocaleString("en-IN")}\n\nItems ordered:\n${itemsSummary}\n\nWe will process and ship your order within 3-5 business days.`;

      if (tempPassword) {
        messageText += `\n\nAn account has been automatically created for you!\nYour login details are:\nEmail: ${emailAddress}\nTemporary Password: ${tempPassword}\n\nPlease log in and change your password in your profile settings.`;
      }

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order",
          to_email: emailAddress.toLowerCase().trim(),
          to_name: fullName,
          order_id: orderId,
          order_total: `₹${orderTotal.toLocaleString("en-IN")}`,
          items_summary: itemsSummary,
          temp_password: tempPassword,
          account_created: tempPassword ? "Yes" : "No"
        })
      });

      if (response.ok) {
        console.log("Order confirmation email sent successfully.");
      } else {
        console.error("Order confirmation email delivery failed.");
      }
    } catch (err) {
      console.error("Order confirmation email delivery failed:", err);
    }
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    const load = () => {
      const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
      setItems(guestCart);
      setLoading(false);

      const storedCoupon = localStorage.getItem("applied_coupon_code");
      if (storedCoupon) {
        setTimeout(() => handleApplyCoupon(storedCoupon), 150);
      }
    };
    load();
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  const clearCart = async () => {
    localStorage.removeItem("guest_cart");
    localStorage.removeItem("guest_cart");
  };

  const saveOrder = async (paymentId = "COD", status = "confirmed", paymentStatus = "captured", tempPassword = "") => {
    try {
      const finalEmail = formData.email.toLowerCase().trim();
      const finalUid = "GUEST_" + Math.random().toString(36).substr(2, 9);

      const orderRef = doc(collection(db, "orders"));

      // Call Shiprocket Before saving order to Firestore (Bypass update requirement)
      let shiprocketData = null;
      if (status === "confirmed") {
        try {
          // Dynamic Package Weight & Dimensions Calculation
          let totalWeight = 0;
          for (const item of items) {
            const itemWeight = item.shipping?.weight || 0.4;
            totalWeight += Number(itemWeight) * (Number(item.quantity) || 1);
          }

          let packageLength = 30;
          let packageBreadth = 20;
          let packageHeight = 5;

          if (totalWeight <= 0.5) {
            packageLength = 25; packageBreadth = 20; packageHeight = 5;
          } else if (totalWeight <= 1.0) {
            packageLength = 35; packageBreadth = 25; packageHeight = 8;
          } else {
            packageLength = 40; packageBreadth = 30; packageHeight = 12;
          }

          const res = await fetch("/api/shiprocket", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: orderRef.id,
              orderDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
              customerName: formData.name,
              email: finalEmail,
              phone: formData.phone,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
              paymentMethod: formData.paymentMethod === "online" ? "Prepaid" : "COD",
              totalAmount: Math.max(0, total - couponDiscount),
              items: items.map(item => ({
                name: item.name,
                sku: item.sku || item.id || "SKU-PRODUCT",
                units: item.quantity || 1,
                price: item.price
              })),
              packageInfo: {
                weight: totalWeight,
                length: packageLength,
                breadth: packageBreadth,
                height: packageHeight
              }
            })
          });
          if (res.ok) {
            shiprocketData = await res.json();
            console.log("Shiprocket sync data:", shiprocketData);
          }
        } catch (shipErr) {
          console.error("Error creating Shiprocket order:", shipErr);
        }
      }

      await setDoc(orderRef, {
        userId: finalUid,
        userEmail: finalEmail,
        items,
        total: Math.max(0, total - couponDiscount),
        shipping: formData,
        paymentMethod: formData.paymentMethod,
        paymentId,
        status,
        paymentStatus,
        appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
        couponDiscount,
        createdAt: serverTimestamp(),
        // Insert shiprocket properties securely from the start
        shipmentId: shiprocketData?.shipment_id || "",
        awbCode: shiprocketData?.awb_code || "",
        courierName: shiprocketData?.courier_name || "",
        trackingUrl: shiprocketData?.tracking_url || (shiprocketData?.awb_code ? `https://shiprocket.co/tracking/${shiprocketData.awb_code}` : "")
      });

      // ── Save / Update customer profile in 'customers' collection ────────────
      // This is the source of truth for OTP-based customer login.
      // We use email as the document ID so lookups are O(1) and prevent duplicates.
      try {
        const customerEmail = (finalEmail || "").toLowerCase().trim();
        if (customerEmail) {
          const customerDocId = customerEmail.replace(/[^a-z0-9]/g, "_");
          const customerRef = doc(db, "customers", customerDocId);
          await setDoc(customerRef, {
            email: customerEmail,
            name: formData.name || "",
            phone: formData.phone || "",
            address: formData.address || "",
            city: formData.city || "",
            state: formData.state || "",
            pincode: formData.pincode || "",
            updatedAt: serverTimestamp(),
          }, { merge: true });  // merge: true preserves older fields like createdAt on first write

          // Set createdAt only on first write
          const snapCheck = await getDoc(customerRef);
          if (snapCheck.exists() && !snapCheck.data().createdAt) {
            await setDoc(customerRef, { createdAt: serverTimestamp() }, { merge: true });
          }
        }
      } catch (custErr) {
        console.error("Customer profile upsert failed:", custErr);
        // Non-blocking — order is already saved
      }

      if (status === "confirmed") {
        // Automatically deduct per-variant stock in Firestore
        try {
          for (const item of items) {
            const itemDocRef = doc(db, "products", item.id);
            const pSnap = await getDoc(itemDocRef);
            if (pSnap.exists()) {
              const pData = pSnap.data();
              let updatedStock = Math.max(0, (Number(pData.stock) || 0) - (Number(item.quantity) || 1));
              let updatedSizes = pData.size_prices;

              if (item.size && Array.isArray(pData.size_prices) && pData.size_prices.length > 0) {
                updatedSizes = pData.size_prices.map(sp => {
                  if (sp.size?.toLowerCase().trim() === item.size.toLowerCase().trim()) {
                    const currentVStock = Number(sp.stock) || 0;
                    return { ...sp, stock: Math.max(0, currentVStock - (Number(item.quantity) || 1)) };
                  }
                  return sp;
                });
                updatedStock = updatedSizes.reduce((sum, sp) => sum + (Number(sp.stock) || 0), 0);
              }

              const newStatus = updatedStock === 0 ? "Out of Stock" : updatedStock <= 5 ? "Low Stock" : "In Stock";
              await updateDoc(itemDocRef, {
                stock: updatedStock,
                stock_status: newStatus,
                size_prices: updatedSizes || []
              });
            }
          }
        } catch (stkErr) {
          console.warn("Per-variant stock deduction warning:", stkErr);
        }

        setCreatedOrderDetails({
          id: orderRef.id,
          total: Math.max(0, total - couponDiscount),
          shipping: { ...formData, email: finalEmail },
          items: items,
          appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
          couponDiscount,
          tempPassword,
          awbCode: shiprocketData?.awb_code || "",
          courierName: shiprocketData?.courier_name || "",
          trackingUrl: shiprocketData?.tracking_url || ""
        });

        await clearCart();
        await sendOrderConfirmationEmail(finalEmail, formData.name, orderRef.id, Math.max(0, total - couponDiscount), "");

        // ── Auto-set customer session so user doesn't need to login after checkout ──
        try {
          const customerSession = {
            id: (finalEmail || "").replace(/[^a-z0-9]/g, "_"),
            email: finalEmail,
            name: formData.name || "",
            phone: formData.phone || "",
            address: formData.address || "",
            city: formData.city || "",
            state: formData.state || "",
            pincode: formData.pincode || "",
          };
          localStorage.setItem("pasoja_customer_session", JSON.stringify(customerSession));
        } catch (_) { }

        setOrderStatus("success");
      } else {
        setOrderStatus("failed");
      }
    } catch (e) {
      console.error(e);
      showToast("Order save failed. Please contact support.", "error");
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) { showToast("Your bag is empty!", "error"); return; }

    const cleanEmail = (formData.email || "").toLowerCase().trim();
    try {
      const hardcodedAdmins = ["mahirsh9999@gmail.com", "admin@mahirash.com"];
      if (hardcodedAdmins.includes(cleanEmail)) {
        showToast("This email belongs to an administrator. Please use a different email address.", "error");
        return;
      }

      const usersSnap = await getDocs(query(collection(db, "users"), where("email", "==", cleanEmail)));
      const adminsSnap = await getDocs(query(collection(db, "admins"), where("email", "==", cleanEmail)));
    } catch (err) {
      console.error("Email verification failed", err);
    }

    setIsProcessing(true);

    let tempPassword = "";

    if (formData.paymentMethod === "online") {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.max(0, total - couponDiscount) * 100,
        currency: "INR",
        name: "Mahirash",
        description: "Luxury Perfume Order",
        image: getOptimizedCloudinaryUrl("https://res.cloudinary.com/dcjn4y284/image/upload/v1786029668/p3jd3nuet4vkqbfd5qaz.png", { width: 150 }),
        handler: async (response) => {
          await saveOrder(response.razorpay_payment_id, "confirmed", "captured", tempPassword);
          setIsProcessing(false);
        },
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        theme: { color: "#111111" },
        modal: {
          ondismiss: async () => {
            await saveOrder("CANCELLED_BY_USER", "failed", "cancelled", tempPassword);
            setIsProcessing(false);
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async (response) => {
        await saveOrder(buyerUser, response.error.metadata?.payment_id || "FAILED", "failed", "failed", tempPassword);
        setIsProcessing(false);
      });
      rzp.open();
    } else {
      await saveOrder("COD", "confirmed", "pending", tempPassword);
      setIsProcessing(false);
    }
  };

  const handleInput = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const inputCls = "w-full bg-white border border-zinc-300 rounded-lg px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800/10 transition-all placeholder:text-zinc-400";

  /* ── Guards ── */
  if (loading) return <MiniLoader message="Preparing Checkout" />;

  if (orderStatus === "success") return <OrderSuccess navigate={navigate} orderDetails={createdOrderDetails} />;
  if (orderStatus === "failed") return <OrderFailed onRetry={() => setOrderStatus(null)} />;

  /* ── Main checkout UI ── */
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <SEOHead
        title="Checkout | Mahirash Luxury Perfumes"
        description="Complete your order securely on Mahirash."
        robots="noindex, follow"
        url="https://mahirash.com/checkout"
      />

      {/* Header offset + breadcrumb */}
      <div className="mt-[145px] md:mt-[130px]" />
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-[14px] text-zinc-400 uppercase tracking-wider">
          <Link to="/" className="hover:text-zinc-700 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/cart" className="hover:text-zinc-700 transition-colors">Cart</Link>
          <ChevronRight size={12} />
          <span className="text-zinc-700">Checkout</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <h1 className="text-xl font-bold text-zinc-900 mb-6">Secure Checkout</h1>

        <form onSubmit={handlePlaceOrder}>
          <div className="flex flex-col lg:flex-row gap-6 items-start">

            {/* ── LEFT COLUMN ── */}
            <div className="w-full lg:flex-1 min-w-0 space-y-4">

              {/* Shipping address section */}
              <div className="bg-white rounded-xl border border-zinc-200">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[14px] font-bold shrink-0">1</div>
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Shipping Address</h2>
                </div>

                <div className="px-5 py-5 space-y-4">
                  {/* Saved addresses */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[14px] font-semibold uppercase tracking-wider text-zinc-500">Saved Addresses</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {savedAddresses.map((addr) => {
                          const sel = selectedAddressId === addr.id;
                          return (
                            <div
                              key={addr.id}
                              onClick={() => {
                                setSelectedAddressId(addr.id);
                                setFormData(p => ({ ...p, name: addr.name || p.name, phone: addr.phone || p.phone, address: addr.address || "", city: addr.city || "", state: addr.state || "", pincode: addr.pincode || "" }));
                              }}
                              className={`p-3.5 border-2 rounded-xl cursor-pointer transition-all relative ${sel ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white hover:border-zinc-400"}`}
                            >
                              {addr.isDefault && <span className="absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider bg-zinc-900 text-white px-1.5 py-0.5 rounded">Default</span>}
                              <div className="flex items-start gap-2">
                                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${sel ? "border-zinc-900 bg-zinc-900" : "border-zinc-300"}`}>
                                  {sel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                </div>
                                <div className="text-[14px] space-y-0.5 pr-8">
                                  <p className="font-semibold text-zinc-900">{addr.name}</p>
                                  <p className="text-zinc-500 leading-relaxed">{addr.address}, {addr.city}, {addr.state} – {addr.pincode}</p>
                                  <p className="text-zinc-700 font-medium">{addr.phone}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div
                          onClick={() => { setSelectedAddressId("custom"); setFormData(p => ({ ...p, address: "", city: "", state: "", pincode: "" })); }}
                          className={`p-3.5 border-2 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all ${selectedAddressId === "custom" ? "border-zinc-900 bg-zinc-50" : "border-dashed border-zinc-300 hover:border-zinc-500"}`}
                        >
                          <Plus size={14} className="text-zinc-500" />
                          <span className="text-[14px] font-semibold text-zinc-600">Enter New Address</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Full Name *</label>
                      <div className="relative">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input type="text" name="name" required value={formData.name} onChange={handleInput} className={`${inputCls} pl-10`} placeholder="Your full name" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Email *</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        <input type="email" name="email" required value={formData.email} onChange={handleInput} className={`${inputCls} pl-10`} placeholder="email@example.com" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Phone Number *</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input type="tel" name="phone" required value={formData.phone} onChange={handleInput} className={`${inputCls} pl-10`} placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Street Address *</label>
                    <textarea name="address" required rows={2} value={formData.address} onChange={handleInput} className={`${inputCls} resize-none`} placeholder="House no., street, area, landmark" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative">
                      <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">City *</label>
                      <input
                        type="text"
                        name="city"
                        required
                        value={formData.city}
                        onChange={(e) => handleCityChange(e.target.value)}
                        onFocus={() => { if (citySearchSuggestions.length > 0) setShowCitySuggestions(true); }}
                        className={inputCls}
                        placeholder="e.g. Indore"
                        autoComplete="off"
                      />
                      {searchLoading && (
                        <div className="absolute right-3 top-[41px] flex items-center justify-center">
                          <div className="w-3.5 h-3.5 border-2 border-zinc-200 border-t-black rounded-full animate-spin" />
                        </div>
                      )}

                      {/* Suggestion Dropdown */}
                      {showCitySuggestions && citySearchSuggestions.length > 0 && (
                        <div className="absolute left-0 md:-left-4 right-0 md:w-[360px] top-full mt-1.5 bg-white border border-zinc-200 shadow-2xl rounded-xl max-h-56 overflow-y-auto divide-y divide-zinc-100" style={{ zIndex: 999999 }}>
                          {citySearchSuggestions.slice(0, 15).map((office, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => selectCitySuggestion(office)}
                              className="w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors text-[14px] space-y-0.5 block cursor-pointer"
                            >
                              <div className="font-bold text-zinc-950 truncate">{office.Name || office.District}, {office.District}</div>
                              <div className="text-zinc-500 font-medium font-mono text-[9px]">{office.State} – Pin: {office.Pincode}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">State *</label>
                      <input
                        type="text"
                        name="state"
                        required
                        value={formData.state}
                        onChange={handleInput}
                        className={inputCls}
                        placeholder="e.g. Madhya Pradesh"
                      />
                    </div>

                    <div>
                      <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Pincode *</label>
                      <input
                        type="text"
                        name="pincode"
                        required
                        value={formData.pincode}
                        onChange={handleInput}
                        className={inputCls}
                        placeholder="e.g. 452001"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment section */}
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-100 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-zinc-900 flex items-center justify-center text-white text-[14px] font-bold shrink-0">2</div>
                  <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Payment Method</h2>
                </div>

                <div className="px-5 py-5 space-y-3">
                  {/* Online payment option */}
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, paymentMethod: "online" }))}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${formData.paymentMethod === "online" ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white hover:border-zinc-400"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.paymentMethod === "online" ? "border-zinc-900 bg-zinc-900" : "border-zinc-300"}`}>
                        {formData.paymentMethod === "online" && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-zinc-900">Online Payment</p>
                        <p className="text-[14px] text-zinc-500 mt-0.5">UPI, Cards, Net Banking, Wallets</p>
                      </div>
                    </div>
                    {/* Payment logos */}
                    {formData.paymentMethod === "online" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t border-zinc-100"
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Accepted Payments</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="h-8 px-2 bg-white border border-zinc-200 rounded-md flex items-center justify-center">
                            <GPayIcon />
                          </div>
                          <div className="h-8 px-2 bg-[#5F259F] border border-[#5F259F] rounded-md flex items-center justify-center">
                            <span className="text-white text-[14px] font-bold tracking-wide">PhonePe</span>
                          </div>
                          <div className="h-8 px-2 bg-[#00BAF2] border border-[#00BAF2] rounded-md flex items-center justify-center">
                            <span className="text-white text-[14px] font-bold">Paytm</span>
                          </div>
                          <div className="h-8 px-3 bg-white border border-zinc-200 rounded-md flex items-center justify-center">
                            <span className="text-[#1A1F71] text-sm font-black tracking-tight">VISA</span>
                          </div>
                          <div className="h-8 px-2 bg-white border border-zinc-200 rounded-md flex items-center justify-center">
                            <MasterIcon />
                          </div>
                          <div className="h-8 px-3 bg-white border border-zinc-200 rounded-md flex items-center justify-center">
                            <span className="text-[#F26821] text-[14px] font-black tracking-tight">RuPay</span>
                          </div>
                          <div className="h-8 px-3 bg-[#0B5ED7] border border-[#0B5ED7] rounded-md flex items-center justify-center">
                            <span className="text-white text-[10px] font-black tracking-wide">NET BANKING</span>
                          </div>
                          <div className="h-8 px-2 bg-[#6B3FA0] border border-[#6B3FA0] rounded-md flex items-center justify-center">
                            <span className="text-white text-[14px] font-bold">UPI</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-3 flex items-center gap-1.5">
                          <Lock size={10} /> Powered by Razorpay · 256-bit SSL encryption
                        </p>
                      </motion.div>
                    )}
                  </button>

                  {/* COD option */}
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, paymentMethod: "cod" }))}
                    className={`w-full p-4 border-2 rounded-xl text-left transition-all ${formData.paymentMethod === "cod" ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white hover:border-zinc-400"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.paymentMethod === "cod" ? "border-zinc-900 bg-zinc-900" : "border-zinc-300"}`}>
                        {formData.paymentMethod === "cod" && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">Cash on Delivery</p>
                        <p className="text-[14px] text-zinc-500 mt-0.5">Pay when your order arrives</p>
                      </div>
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-700 px-2 py-1 rounded-full">COD</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Order Summary ── */}
            <aside className="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-28 space-y-4">

              {/* Order items */}
              <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden font-['Inter',sans-serif]">
                <div className="px-5 py-4 border-b border-zinc-100">
                  <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                    Order Summary ({items.length} {items.length === 1 ? "item" : "items"})
                  </h3>
                </div>
                <div className="px-5 py-4 max-h-[280px] overflow-auto space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 rounded-lg bg-[#f0eeeb] shrink-0 overflow-hidden border border-zinc-100">
                        <OptimizedCloudinaryImage src={item.image} alt={item.name} preset="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#b8860b] mb-0.5">{item.brand || 'MAHIRASH'}</p>
                        <p className="text-sm font-semibold text-zinc-900 line-clamp-1">{item.name}</p>
                        {item.size && (
                          <p className="text-[14px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                            <span>Size: {item.size}</span>
                            {item.is_preorder && (
                              <span className="bg-[#b8860b] text-white text-[8px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 shadow-xs">
                                Pre-Order
                              </span>
                            )}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm font-bold text-zinc-900">₹{Number(item.price).toLocaleString("en-IN")}</span>
                          <span className="text-[14px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">×{item.quantity || 1}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="px-5 py-4 border-t border-zinc-100 space-y-2.5">
                  <div className="flex justify-between text-sm"><span className="text-zinc-600">Subtotal</span><span className="font-medium">₹{total.toLocaleString("en-IN")}</span></div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm text-[#b8860b] font-bold">
                      <span>Coupon Discount ({appliedCoupon?.code})</span>
                      <span>-₹{couponDiscount.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm"><span className="text-zinc-600">Delivery</span><span className="font-bold text-emerald-600">FREE</span></div>
                  <div className="flex justify-between text-sm"><span className="text-zinc-600">GST (Included)</span><span className="font-medium">₹0</span></div>
                  <div className="flex justify-between items-center pt-2 border-t border-zinc-100">
                    <span className="text-base font-bold text-zinc-900">Total</span>
                    <span className="text-xl font-bold text-zinc-900">₹{Math.max(0, total - couponDiscount).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              {/* Promo Coupon Card */}
              <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-3 font-['Inter',sans-serif]">
                <div className="flex items-center gap-2">
                  <Tag size={15} className="text-[#b8860b]" />
                  <span className="text-[14px] font-bold text-zinc-900 uppercase tracking-wider">Apply Promo Code</span>
                </div>
                {!appliedCoupon ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="ENTER COUPON"
                        className="flex-1 bg-zinc-50 border border-zinc-300 rounded-lg px-3.5 py-2 text-[14px] font-mono text-zinc-900 outline-none focus:border-zinc-800 focus:bg-white transition-all uppercase placeholder:text-zinc-400 placeholder:font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        className="bg-black text-white hover:bg-zinc-800 text-[10px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[11.5px] text-red-650 font-semibold">{couponError}</p>
                    )}
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-[#b8860b]/5 border border-[#b8860b]/20 p-2.5 rounded-lg">
                      <div className="min-w-0 text-left">
                        <span className="text-[14px] font-bold text-[#b8860b] font-mono tracking-wider">{appliedCoupon.code}</span>
                        <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                          {appliedCoupon.discount_type === "Percentage" ? `${appliedCoupon.discount_val}% Extra Discount` : `Flat ₹${appliedCoupon.discount_val} Discount`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-zinc-400 hover:text-zinc-650 transition-colors p-1 rounded-full hover:bg-zinc-150 shrink-0 cursor-pointer"
                        title="Remove Coupon"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {couponSuccess && (
                      <p className="text-[11.5px] text-emerald-600 font-semibold">{couponSuccess}</p>
                    )}
                  </div>
                )}
              </div>

              {/* CTA */}
              <button
                type="submit"
                disabled={isProcessing || items.length === 0}
                className={`w-full py-4 text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 ${isProcessing || items.length === 0 ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" : "bg-zinc-900 hover:bg-black text-white active:scale-[0.98]"}`}
              >
                {isProcessing ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                ) : (
                  <>{formData.paymentMethod === "cod" ? "Place Order" : "Pay Now"} <ArrowRight size={15} /></>
                )}
              </button>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 text-[14px] text-zinc-400">
                <Lock size={12} />
                <span>100% Secure & Encrypted Payments</span>
              </div>
            </aside>
          </div>
        </form>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 ${toast.type === "error" ? "bg-red-600 text-white" : "bg-zinc-900 text-white"}`}
          >
            <p className="text-sm font-semibold whitespace-nowrap">{toast.msg}</p>
            <button onClick={() => setToast(null)} className="opacity-60 hover:opacity-100 ml-1">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Checkout;
