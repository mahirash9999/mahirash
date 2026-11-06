import React, { useEffect, useState, useCallback } from "react";
import MiniLoader from "../components/MiniLoader";
import { db } from "../components/Firebase";
import {
  collection, getDocs, addDoc, serverTimestamp,
  doc, deleteDoc, getDoc, updateDoc, query, where, setDoc, limit
} from "firebase/firestore";

import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../components/useAuth";
import { useCustomerAuth } from "../components/CustomerAuthProvider";
import { useStore } from "../components/StoreProvider";
import {
  MapPin, User, Phone, Mail, CheckCircle, X,
  ShieldCheck, ChevronRight, Plus, Check, Lock, Tag,
  ArrowRight, Package, Truck, Home, Printer, Download, Edit3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SEOHead from "../components/SEOHead";
import OptimizedCloudinaryImage from "../components/OptimizedCloudinaryImage";
import { getOptimizedCloudinaryUrl } from "../utils/cloudinaryUtils";
import { cleanPhone, isValidPhone, cleanPincode, isValidPincode, isValidEmail, isValidName, sanitizeText } from "../utils/validation";

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
  const [fallbackId] = useState(() => "MHR-" + Math.floor(100000 + Math.random() * 900000));
  const finalDetails = orderDetails || {
    id: fallbackId,
    total: 0,
    shipping: { name: "", phone: "", alternatePhone: "", flat: "", street: "", landmark: "", address: "", city: "", state: "", pincode: "", type: "Home", paymentMethod: "online" },
    items: [],
    appliedCoupon: null,
    couponDiscount: 0,
    tempPassword: ""
  };

  const isCOD = false;

  const handleDownloadInvoice = (order) => {
    const invoiceWindow = window.open("", "_blank", "width=850,height=950");
    if (!invoiceWindow) {
      alert("Please allow popups to view or print the official tax invoice.");
      return;
    }

    const orderDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const itemsRows = (order.items || []).map((item, idx) => `
      <tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e5e5e5; font-size: 12px; color: #555;">${idx + 1}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e5e5e5; font-size: 12px; font-weight: 600; color: #111;">
          ${item.name}
          ${item.size ? `<span style="font-size:10px; color:#888; margin-left: 6px;">(${item.size})</span>` : ""}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e5e5e5; font-size: 12px; text-align: center; color: #333;">${item.quantity || item.units || 1}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e5e5e5; font-size: 12px; text-align: right; color: #333;">₹${(item.price || 0).toLocaleString("en-IN")}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e5e5e5; font-size: 12px; text-align: right; font-weight: 700; color: #000;">₹${((item.price || 0) * (item.quantity || item.units || 1)).toLocaleString("en-IN")}</td>
      </tr>
    `).join("");

    const displayOrderId = order.orderNumber || order.id || "MHR-ORDER";
    const shipping = order.shipping || {};
    const isOnline = order.paymentMethod === "online" || !isCOD;

    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Tax Invoice - #${displayOrderId} | MAHIRASH</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 40px; color: #111; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 25px; border-bottom: 2px solid #111; }
          .logo { font-size: 26px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #111; }
          .badge { background: #faf5eb; color: #800020; border: 1px solid #e7e5e4; font-size: 10px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 25px; }
          .table th { background: #fafafa; border-bottom: 2px solid #111; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #444; }
          .total-box { margin-top: 30px; display: flex; justify-content: flex-end; }
          .total-table { width: 300px; font-size: 12px; }
          .total-table td { padding: 6px 0; }
          .final-price { font-size: 16px; font-weight: bold; color: #000; border-top: 2px solid #111; padding-top: 8px; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #777; text-align: center; }
          .btn-print { background: #000; color: #fff; border: none; padding: 10px 20px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; cursor: pointer; border-radius: 4px; margin-bottom: 20px; }
          @media print { .btn-print { display: none; } }
        </style>
      </head>
      <body>
        <div style="text-align: right;"><button class="btn-print" onclick="window.print()">Print / Save PDF</button></div>
        <div class="header">
          <div>
            <div class="logo">MAHIRASH</div>
            <p style="font-size: 11px; color: #666; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Luxury Perfumes Store</p>
          </div>
          <div style="text-align: right;">
            <span class="badge">Official Tax Invoice</span>
            <p style="font-size: 13px; font-family: monospace; margin: 8px 0 0 0; font-weight: bold;">#${displayOrderId}</p>
            <p style="font-size: 11px; color: #666; margin: 2px 0 0 0;">Date: ${orderDate}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 12px; line-height: 1.6;">
          <div>
            <strong style="text-transform: uppercase; font-size: 10px; color: #888; letter-spacing: 0.1em;">Billed & Shipped To:</strong>
            <p style="margin: 4px 0 0 0; font-weight: bold; text-transform: uppercase;">${shipping.name || "Customer"}</p>
            <p style="margin: 2px 0 0 0; color: #555;">${shipping.address || "Standard Address"}</p>
            <p style="margin: 2px 0 0 0; color: #555;">${shipping.city || ""}, ${shipping.state || ""} – ${shipping.pincode || ""}</p>
            <p style="margin: 2px 0 0 0; color: #000; font-weight: bold;">Phone: ${shipping.phone || ""}</p>
            <p style="margin: 2px 0 0 0; color: #555;">Email: ${shipping.email || ""}</p>
          </div>
          <div style="text-align: right;">
            <strong style="text-transform: uppercase; font-size: 10px; color: #888; letter-spacing: 0.1em;">Payment Details:</strong>
            <p style="margin: 4px 0 0 0;">Method: <strong style="text-transform: uppercase;">${isOnline ? "Razorpay (Online / UPI)" : "Cash on Delivery"}</strong></p>
            <p style="margin: 2px 0 0 0;">Payment Status: <strong style="color: ${isOnline ? "#059669" : "#b45309"};">${isOnline ? "PAID" : "PENDING (COD)"}</strong></p>
            ${order.paymentId ? `<p style="margin: 2px 0 0 0; color: #555;">Payment ID: <span style="font-family: monospace; font-weight: bold;">${order.paymentId}</span></p>` : ""}
            ${order.awbCode ? `<p style="margin: 2px 0 0 0; color: #555;">Courier AWB: <span style="font-family: monospace;">${order.awbCode}</span></p>` : ""}
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="text-align: left;">#</th>
              <th style="text-align: left;">Item Description</th>
              <th>Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="total-box">
          <table class="total-table">
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right;">₹${(order.subtotal || order.total || 0).toLocaleString("en-IN")}</td>
            </tr>
            <tr>
              <td>Shipping Charges</td>
              <td style="text-align: right; color: #059669; font-weight: bold;">FREE EXPRESS DELIVERY</td>
            </tr>
            ${order.couponDiscount || order.discount ? `
            <tr>
              <td>Coupon Discount</td>
              <td style="text-align: right; color: #800020; font-weight: 600;">-₹${(order.couponDiscount || order.discount || 0).toLocaleString("en-IN")}</td>
            </tr>` : ""}
            <tr class="final-price">
              <td>Grand Total</td>
              <td style="text-align: right;">₹${(order.total || 0).toLocaleString("en-IN")}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p style="font-weight: 600; color: #333;">Thank you for shopping with Luxury Perfumes.</p>
          <p>For any queries or assistance, contact support at care@mahirash.com or WhatsApp +91 9584826112.</p>
        </div>
      </body>
      </html>
    `);
    invoiceWindow.document.close();
  };

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
            <p className="text-zinc-905 font-bold mt-1 text-sm font-sans">
              ₹{(finalDetails.total || 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div>
            <p className="text-zinc-400 font-normal">Payment</p>
            <p className="text-zinc-900 font-bold mt-1 text-[12px]">
              {isCOD ? "COD" : "Prepaid"}
            </p>
          </div>
        </div>

        {/* Guest Order Account Link Prompt */}
        {finalDetails.isGuest && (
          <div className="mb-8 p-4 bg-zinc-50 border border-zinc-200/90 rounded-xl relative overflow-hidden text-left">
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#800020]" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-[12px] font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-[#800020]" />
                  Track Your Fragrance Journey
                </h4>
                <p className="text-[12px] text-zinc-500 font-light leading-relaxed max-w-md">
                  Create an account or sign in with <strong className="text-zinc-800">{finalDetails.shipping?.email}</strong> via Email OTP to view real-time delivery timelines and manage your order history.
                </p>
              </div>
              <Link
                to={`/login?redirect=orders`}
                className="shrink-0 px-4 py-2.5 bg-black hover:bg-zinc-800 text-white text-[12px] uppercase font-bold tracking-widest rounded-lg transition-all"
              >
                Access Account →
              </Link>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-[14px] leading-relaxed">
          {/* Shipping Address Summary */}
          <div className="space-y-2 bg-zinc-50/50 p-4.5 rounded-xl border border-zinc-100/60 p-4 text-left">
            <h3 className="font-bold text-zinc-950 uppercase tracking-widest text-[12px] pb-1.5 border-b border-zinc-200 flex items-center gap-1.5">
              <MapPin size={12} className="text-zinc-500" /> Shipping Details
            </h3>
            <p className="font-bold text-zinc-900 text-sm font-serif">{finalDetails.shipping?.name}</p>
            {finalDetails.shipping?.flat && <p className="text-zinc-700 font-medium text-xs">{finalDetails.shipping?.flat}</p>}
            <p className="text-zinc-500 font-light text-xs">{finalDetails.shipping?.street || finalDetails.shipping?.address}</p>
            {finalDetails.shipping?.landmark && <p className="text-zinc-400 text-[12px]">Landmark: {finalDetails.shipping?.landmark}</p>}
            <p className="text-zinc-500 font-light text-xs">{finalDetails.shipping?.city}, {finalDetails.shipping?.state} – {finalDetails.shipping?.pincode}</p>
            <p className="text-zinc-800 font-semibold mt-1 text-xs">
              Phone: {finalDetails.shipping?.phone}
              {finalDetails.shipping?.alternatePhone && <span className="text-zinc-500 font-normal ml-2">Alt: {finalDetails.shipping?.alternatePhone}</span>}
            </p>
          </div>

          {/* Delivery & Tracking Details */}
          <div className="space-y-2 bg-zinc-50/50 p-4.5 rounded-xl border border-zinc-100/60 p-4 text-left flex flex-col justify-between">
            <div className="space-y-2">
              <h3 className="font-bold text-zinc-950 uppercase tracking-widest text-[12px] pb-1.5 border-b border-zinc-200 flex items-center gap-1.5">
                <Truck size={12} className="text-zinc-500" /> Shipping & Tracking
              </h3>
              <div>
                <p className="text-zinc-400 uppercase tracking-wider text-[12px]">Status</p>
                <p className="text-zinc-800 font-semibold text-[14px] flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Order Placed – Processing
                </p>
              </div>

              {finalDetails.awbCode && (
                <div className="pt-1.5 grid grid-cols-2 gap-2 text-[12px] bg-white border border-zinc-200 p-2 rounded-lg">
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
                className="w-full text-center py-2.5 bg-zinc-900 hover:bg-black text-[12px] text-white font-bold uppercase tracking-widest rounded-lg transition-colors border border-black inline-block mt-2"
              >
                Track Live Order
              </a>
            )}
          </div>
        </div>

        {/* Order Items Summary */}
        <div className="space-y-3 mb-8 text-left">
          <h3 className="font-bold text-zinc-950 uppercase tracking-widest text-[12px] pb-1.5 border-b border-zinc-200">
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
                    <p className="text-[12px] text-zinc-400 mt-0.5">
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
        {/* Action Buttons */}
        <div className="space-y-3 pt-6 border-t border-zinc-200">
          <button
            type="button"
            onClick={() => handleDownloadInvoice(finalDetails)}
            className="w-full py-3.5 bg-[#800020] hover:bg-[#600018] text-white text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Printer size={16} /> Download Tax Invoice / Bill
          </button>

          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/orders"
              className="w-full py-3.5 bg-zinc-900 hover:bg-black text-white text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all text-center flex items-center justify-center gap-2 border border-zinc-900 shadow-sm"
            >
              <Package size={14} /> My Orders
            </Link>
            <Link
              to="/shop"
              className="w-full py-3.5 bg-white hover:bg-zinc-50 text-zinc-800 text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all text-center border border-zinc-200"
            >
              Continue Shopping
            </Link>
          </div>
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
  const { user } = useAuth();
  const customerAuth = useCustomerAuth();
  const customer = customerAuth?.customer;
  const store = useStore();
  const storeCart = store?.cart || [];
  const storeClearCart = store?.clearCart;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [addressMode, setAddressMode] = useState("saved"); // "saved" or "new"
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    alternatePhone: "",
    flat: "",
    street: "",
    landmark: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    type: "Home",
    paymentMethod: "online",
  });

  // 1. Load locally remembered checkout profile on initial mount
  useEffect(() => {
    try {
      const localStr = localStorage.getItem("mahirash_saved_checkout_profile");
      if (localStr) {
        const local = JSON.parse(localStr);
        if (local && (local.address || local.flat || local.street || local.city)) {
          const localAddr = {
            id: "local_saved_addr",
            name: local.name || "",
            email: local.email || "",
            phone: local.phone || "",
            alternatePhone: local.alternatePhone || "",
            flat: local.flat || "",
            street: local.street || local.address || "",
            landmark: local.landmark || "",
            address: local.address || "",
            city: local.city || "",
            state: local.state || "",
            pincode: local.pincode || "",
            type: local.type || "Home",
            isDefault: true
          };
          setSavedAddresses([localAddr]);
          setSelectedAddressId(localAddr.id);
          setAddressMode("saved");
          setFormData(prev => ({
            ...prev,
            name: localAddr.name || prev.name,
            email: prev.email || localAddr.email || "",
            phone: localAddr.phone || prev.phone,
            alternatePhone: localAddr.alternatePhone || "",
            flat: localAddr.flat || "",
            street: localAddr.street || "",
            landmark: localAddr.landmark || "",
            address: localAddr.address || "",
            city: localAddr.city || prev.city,
            state: localAddr.state || prev.state,
            pincode: localAddr.pincode || prev.pincode,
            type: localAddr.type || "Home"
          }));
        }
      }
    } catch (_) { }
  }, []);

  // 2. Helper to load saved addresses for any given email address from Firestore
  const loadAddressesForEmail = useCallback(async (targetEmail) => {
    if (!targetEmail || typeof targetEmail !== "string") return;
    const cleanEmail = targetEmail.toLowerCase().trim();
    if (!cleanEmail.includes("@") || cleanEmail.length < 5) return;

    try {
      const customerDocId = cleanEmail.replace(/[^a-z0-9]/g, "_");
      const addrs = [];

      // A. Query addresses subcollection
      try {
        const addrSnap = await getDocs(collection(db, "customers", customerDocId, "addresses"));
        addrSnap.docs.forEach(d => addrs.push({ id: d.id, ...d.data() }));
      } catch (_) { }

      // B. Query customer root document
      try {
        const cSnap = await getDoc(doc(db, "customers", customerDocId));
        if (cSnap.exists()) {
          const cData = cSnap.data();
          if (cData.address || cData.flat || cData.street || cData.city) {
            const alreadyExists = addrs.some(a => (a.street || a.address) === (cData.street || cData.address) && a.pincode === cData.pincode);
            if (!alreadyExists) {
              addrs.unshift({
                id: "primary_customer_addr",
                name: cData.name || "",
                phone: cData.phone || "",
                alternatePhone: cData.alternatePhone || "",
                flat: cData.flat || "",
                street: cData.street || cData.address || "",
                landmark: cData.landmark || "",
                address: cData.address || "",
                city: cData.city || "",
                state: cData.state || "",
                pincode: cData.pincode || "",
                type: cData.type || "Home",
                isDefault: true
              });
            }
          }
        }
      } catch (_) { }

      // C. Fallback: check recent verified order for this email
      if (addrs.length === 0) {
        try {
          const qOrder = query(collection(db, "orders"), where("customerEmail", "==", cleanEmail), limit(1));
          const orderSnap = await getDocs(qOrder);
          if (!orderSnap.empty) {
            const oData = orderSnap.docs[0].data();
            const ship = oData.shipping || oData.shippingAddress;
            if (ship && (ship.address || ship.street || ship.city)) {
              addrs.push({
                id: "recent_order_addr",
                name: ship.name || oData.customerName || "",
                phone: ship.phone || oData.customerPhone || "",
                alternatePhone: ship.alternatePhone || "",
                flat: ship.flat || "",
                street: ship.street || ship.address || "",
                landmark: ship.landmark || "",
                address: ship.address || "",
                city: ship.city || "",
                state: ship.state || "",
                pincode: ship.pincode || "",
                type: ship.type || "Home",
                isDefault: true
              });
            }
          }
        } catch (_) { }
      }

      if (addrs.length > 0) {
        setSavedAddresses(addrs);
        const def = addrs.find(a => a.isDefault) || addrs[0];
        setSelectedAddressId(def.id);
        setAddressMode("saved");
        setIsEditingAddress(false);
        setFormData(prev => ({
          ...prev,
          email: cleanEmail,
          name: def.name || prev.name,
          phone: def.phone || prev.phone,
          alternatePhone: def.alternatePhone || prev.alternatePhone || "",
          flat: def.flat || "",
          street: def.street || def.address || "",
          landmark: def.landmark || "",
          address: def.address || "",
          city: def.city || prev.city,
          state: def.state || prev.state,
          pincode: def.pincode || prev.pincode,
          type: def.type || "Home"
        }));
      }
    } catch (err) {
      console.warn("Could not fetch saved addresses in checkout:", err);
    }
  }, []);

  // 3. Prefill email, name, and phone from authenticated customer or Firebase user
  useEffect(() => {
    const activeEmail = customer?.email || user?.email;
    if (activeEmail) {
      loadAddressesForEmail(activeEmail);
    }
    if (activeEmail || customer?.name || user?.displayName) {
      setFormData(prev => ({
        ...prev,
        email: prev.email || activeEmail || "",
        name: prev.name || customer?.name || user?.displayName || "",
        phone: prev.phone || customer?.phone || ""
      }));
    }
  }, [user, customer, loadAddressesForEmail]);
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
  const [invalidCartError, setInvalidCartError] = useState(null);

  const showToast = (msg, type = "info") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const total = items.reduce((sum, i) => sum + ((Number(i.price) || 0) * (i.quantity || 1)), 0);
  const finalPayable = Math.max(0, total - couponDiscount);

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

    const load = async () => {
      let activeCart = [];
      if (Array.isArray(storeCart) && storeCart.length > 0) {
        activeCart = storeCart;
      } else if (user?.uid) {
        try {
          const userSnap = await getDoc(doc(db, "users", user.uid));
          if (userSnap.exists() && Array.isArray(userSnap.data()?.cart) && userSnap.data().cart.length > 0) {
            activeCart = userSnap.data().cart;
          }
        } catch (_) { }
      }

      if (activeCart.length === 0) {
        activeCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
      }

      setItems(activeCart);

      let hasOut = false;
      let hasPre = false;

      for (const item of activeCart) {
        if (item.is_preorder || String(item.stock_status || '').toLowerCase().includes('preorder')) {
          hasPre = true;
        }
        if (item.stock !== undefined && Number(item.stock) <= 0) {
          hasOut = true;
        }
        try {
          const snap = await getDoc(doc(db, "products", item.id));
          if (snap.exists()) {
            const data = snap.data();
            let vStock = data.stock !== undefined ? Number(data.stock) : 10;
            let vPre = Boolean(data.is_preorder) || String(data.stock_status || '').toLowerCase().includes('preorder');
            if (item.size && Array.isArray(data.size_prices)) {
              const matched = data.size_prices.find(s => s.size?.toLowerCase().trim() === item.size?.toLowerCase().trim());
              if (matched) {
                if (matched.stock !== undefined) vStock = Number(matched.stock);
                if (matched.is_preorder !== undefined) vPre = Boolean(matched.is_preorder);
              }
            }
            if (vPre) hasPre = true;
            if (vStock <= 0 || data.stock_status === "Out of Stock") hasOut = true;
          }
        } catch (e) {
          console.warn("Stock verification check error:", e);
        }
      }

      if (hasOut) {
        setInvalidCartError("Your bag contains out-of-stock items. Please return to your cart and remove them before checkout.");
      } else if (hasPre) {
        setInvalidCartError("Your bag contains pre-order items. Pre-orders cannot be processed through standard cart checkout. Please return to your cart and remove them.");
      } else {
        setInvalidCartError(null);
      }

      setLoading(false);

      const storedCoupon = localStorage.getItem("applied_coupon_code");
      if (storedCoupon) {
        setTimeout(() => handleApplyCoupon(storedCoupon), 150);
      }
    };
    load();
    return () => { if (document.body.contains(script)) document.body.removeChild(script); };
  }, []);

  // Sync items when storeCart loads or updates
  useEffect(() => {
    if (Array.isArray(storeCart) && storeCart.length > 0 && items.length === 0) {
      setItems(storeCart);
    }
  }, [storeCart]);

  const clearCart = async () => {
    try {
      if (storeClearCart) {
        await storeClearCart();
      }
    } catch (err) {
      console.warn("storeClearCart error:", err);
    }
    try {
      localStorage.removeItem("guest_cart");
      localStorage.removeItem("applied_coupon_code");
    } catch (_) { }
  };

  const saveOrder = async (paymentId = "ONLINE", status = "confirmed", paymentStatus = "paid", tempPassword = "", extraPaymentData = {}) => {
    try {
      const finalEmail = (formData.email || customer?.email || user?.email || "").toLowerCase().trim();
      const activeUid = user?.uid || customer?.uid || customer?.id || (customer ? "usr_" + finalEmail.replace(/[^a-z0-9]/g, "_") : null);
      const isGuest = !(user || customer);
      const finalUid = activeUid;
      const orderNumber = "MHR-" + Math.floor(100000 + Math.random() * 900000);

      const orderRef = doc(collection(db, "orders"));

      let shiprocketData = null;

      const synthesizedAddress = [
        formData.flat,
        formData.street,
        formData.landmark ? `Near ${formData.landmark}` : null
      ].filter(Boolean).join(", ") || formData.address;

      const fullShippingData = {
        ...formData,
        address: synthesizedAddress,
        email: finalEmail
      };

      await setDoc(orderRef, {
        orderId: orderRef.id,
        orderNumber,
        userId: finalUid,
        isGuest,
        customerEmail: finalEmail,
        customerName: formData.name || "",
        customerPhone: formData.phone || "",
        userEmail: finalEmail, // keep backward compatibility
        items,
        total: Math.max(0, total - couponDiscount),
        subtotal: total,
        shipping: fullShippingData,
        shippingCost: 0,
        discount: couponDiscount,
        paymentMethod: "online",
        paymentProvider: "Razorpay",
        paymentId,
        razorpayOrderId: extraPaymentData.razorpayOrderId || "",
        razorpaySignature: extraPaymentData.razorpaySignature || "",
        paymentMode: extraPaymentData.paymentMode || "ONLINE",
        verifiedAmount: extraPaymentData.verifiedAmount || Math.max(0, total - couponDiscount),
        status,
        orderStatus: status,
        internalStatus: "Payment Confirmed",
        shipmentStatus: "Not Created",
        courierName: "Delhivery Express",
        awbCode: "",
        trackingNumber: "",
        paymentStatus: "paid",
        appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
        couponDiscount,
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          alternatePhone: formData.alternatePhone || "",
          flat: formData.flat || "",
          street: formData.street || "",
          landmark: formData.landmark || "",
          address: synthesizedAddress,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          type: formData.type || "Home"
        },
        activityLog: [
          {
            actor: "Customer / Razorpay",
            action: "Order Placed & Payment Verified",
            timestamp: new Date().toISOString(),
            details: `Razorpay Payment ID: ${paymentId}`
          }
        ],
        emailStatus: {
          customer: "pending",
          admin: "pending"
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // ── Save / Update customer profile in 'customers' collection ────────────
      try {
        const customerEmail = (finalEmail || "").toLowerCase().trim();
        if (customerEmail) {
          const customerDocId = customerEmail.replace(/[^a-z0-9]/g, "_");
          const customerRef = doc(db, "customers", customerDocId);
          await setDoc(customerRef, {
            email: customerEmail,
            name: formData.name || "",
            phone: formData.phone || "",
            alternatePhone: formData.alternatePhone || "",
            flat: formData.flat || "",
            street: formData.street || "",
            landmark: formData.landmark || "",
            address: synthesizedAddress,
            city: formData.city || "",
            state: formData.state || "",
            pincode: formData.pincode || "",
            type: formData.type || "Home",
            updatedAt: serverTimestamp(),
          }, { merge: true });  // merge: true preserves older fields like createdAt on first write

          // Remember address in localStorage for fast 1-click return visits
          try {
            localStorage.setItem("mahirash_saved_checkout_profile", JSON.stringify(fullShippingData));
          } catch (_) { }

          // Also save in customer addresses subcollection
          try {
            const addrDocId = `addr_${formData.pincode || "ind"}_${Date.now().toString(36)}`;
            await setDoc(doc(db, "customers", customerDocId, "addresses", addrDocId), {
              id: addrDocId,
              name: formData.name || "",
              phone: formData.phone || "",
              alternatePhone: formData.alternatePhone || "",
              flat: formData.flat || "",
              street: formData.street || "",
              landmark: formData.landmark || "",
              address: synthesizedAddress,
              city: formData.city || "",
              state: formData.state || "",
              pincode: formData.pincode || "",
              type: formData.type || "Home",
              isDefault: true,
              updatedAt: serverTimestamp()
            }, { merge: true });
          } catch (_) { }

          // Save order to customer's orders subcollection
          try {
            await setDoc(doc(db, "customers", customerDocId, "orders", orderRef.id), {
              orderId: orderRef.id,
              orderNumber,
              total: Math.max(0, total - couponDiscount),
              status,
              createdAt: serverTimestamp()
            }, { merge: true });
          } catch (_) { }

          // If authenticated Firebase user, also link in users subcollection
          if (user?.uid) {
            try {
              await setDoc(doc(db, "users", user.uid, "orders", orderRef.id), {
                orderId: orderRef.id,
                orderNumber,
                total: Math.max(0, total - couponDiscount),
                status,
                createdAt: serverTimestamp()
              }, { merge: true });
            } catch (_) { }
          }

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
        let clientDeductionSucceeded = false;
        // Automatically deduct per-variant stock in Firestore
        try {
          const normSize = sz => String(sz || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const productDeductions = {};
          for (const item of items) {
            if (!item || !item.id) continue;
            const pid = String(item.id).trim();
            if (!productDeductions[pid]) productDeductions[pid] = [];
            productDeductions[pid].push({
              size: item.size || "",
              quantity: Math.max(1, Number(item.quantity) || 1)
            });
          }

          let anySuccess = false;
          for (const [productId, purchases] of Object.entries(productDeductions)) {
            const itemDocRef = doc(db, "products", productId);
            const pSnap = await getDoc(itemDocRef);
            if (pSnap.exists()) {
              const pData = pSnap.data();
              let sizePrices = Array.isArray(pData.size_prices) ? [...pData.size_prices] : [];
              let totalStock = Number(pData.stock) || 0;

              if (sizePrices.length > 0) {
                for (const purchase of purchases) {
                  const targetNorm = normSize(purchase.size);
                  let matched = false;
                  sizePrices = sizePrices.map(sp => {
                    if (normSize(sp.size) === targetNorm) {
                      matched = true;
                      const currentVStock = Math.max(0, Number(sp.stock) || 0);
                      return { ...sp, stock: Math.max(0, currentVStock - purchase.quantity) };
                    }
                    return sp;
                  });
                  // If size didn't match any specific variant, deduct from first available variant
                  if (!matched) {
                    let deductedVariant = false;
                    sizePrices = sizePrices.map(sp => {
                      if (!deductedVariant && (Number(sp.stock) || 0) > 0) {
                        deductedVariant = true;
                        const cur = Number(sp.stock) || 0;
                        return { ...sp, stock: Math.max(0, cur - purchase.quantity) };
                      }
                      return sp;
                    });
                    if (!deductedVariant && sizePrices.length > 0) {
                      const cur = Number(sizePrices[0].stock) || 0;
                      sizePrices[0] = { ...sizePrices[0], stock: Math.max(0, cur - purchase.quantity) };
                    }
                  }
                }
                totalStock = sizePrices.reduce((sum, sp) => sum + (Number(sp.stock) || 0), 0);
              } else {
                const totalPurchasedQty = purchases.reduce((sum, p) => sum + p.quantity, 0);
                totalStock = Math.max(0, totalStock - totalPurchasedQty);
              }

              const newStatus = totalStock === 0 ? "Out of Stock" : totalStock <= 5 ? "Low Stock" : "In Stock";
              await updateDoc(itemDocRef, {
                stock: totalStock,
                stock_status: newStatus,
                size_prices: sizePrices,
                updatedAt: new Date().toISOString()
              });
              anySuccess = true;
            }
          }
          if (anySuccess) {
            clientDeductionSucceeded = true;
          }
        } catch (stkErr) {
          console.warn("Direct client stock deduction fallback:", stkErr);
        }

        // Guaranteed server-side stock deduction via Superadmin API
        if (!clientDeductionSucceeded) {
          try {
            const deductRes = await fetch("/api/deduct-stock", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items })
            });
            const deductData = await deductRes.json();
            console.log("Server stock deduction response:", deductData);
          } catch (apiErr) {
            console.warn("Server stock deduction API error:", apiErr);
          }
        }

        setCreatedOrderDetails({
          id: orderRef.id,
          orderNumber,
          isGuest,
          total: Math.max(0, total - couponDiscount),
          subtotal: total,
          shipping: { ...formData, email: finalEmail },
          items: items,
          appliedCoupon: appliedCoupon ? appliedCoupon.code : null,
          couponDiscount,
          tempPassword,
          paymentMethod: formData.paymentMethod,
          paymentId,
          paymentStatus,
          paymentMode: extraPaymentData.paymentMode || (formData.paymentMethod === "online" ? "Online" : "COD"),
          razorpayOrderId: extraPaymentData.razorpayOrderId || "",
          awbCode: shiprocketData?.awb_code || "",
          courierName: shiprocketData?.courier_name || "",
          trackingUrl: shiprocketData?.tracking_url || ""
        });

        await clearCart();

        // Non-blocking server-side email notifications (Customer Confirmation + Admin Alert)
        try {
          fetch("/api/send-order-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: orderRef.id,
              order: {
                id: orderRef.id,
                orderNumber,
                customerEmail: finalEmail,
                customerName: formData.name,
                customerPhone: formData.phone,
                items,
                subtotal: total,
                total: Math.max(0, total - couponDiscount),
                discount: couponDiscount,
                paymentMethod: "online",
                paymentStatus: "paid",
                paymentId,
                paymentMode: extraPaymentData.paymentMode || "ONLINE",
                shipping: formData,
                isGuest
              }
            })
          }).catch(err => console.warn("Background email notification error:", err));
        } catch (_) { }

        // ── Auto-set customer session so user doesn't need to login after checkout ──
        try {
          const customerSession = {
            id: finalUid || (finalEmail || "").replace(/[^a-z0-9]/g, "_"),
            uid: finalUid || (finalEmail || "").replace(/[^a-z0-9]/g, "_"),
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

        // ── Device Signature for Thank You Page Security ──
        try {
          sessionStorage.setItem("mahirash_purchased_sig_" + orderNumber.toUpperCase(), "active");
          sessionStorage.setItem("mahirash_purchased_sig_" + orderRef.id.toUpperCase(), "active");
        } catch (_) { }

        const completedOrderData = {
          id: orderRef.id,
          orderId: orderRef.id,
          orderNumber,
          customerEmail: finalEmail,
          customerName: formData.name || "",
          customerPhone: formData.phone || "",
          items,
          subtotal: total,
          total: Math.max(0, total - couponDiscount),
          discount: couponDiscount,
          shipping: fullShippingData,
          shippingAddress: fullShippingData,
          paymentId,
          paymentMode: extraPaymentData.paymentMode || "ONLINE",
          paymentStatus: "paid",
          orderStatus: "confirmed",
          status: "confirmed"
        };

        navigate(`/order-success?orderId=${orderRef.id}&orderNumber=${encodeURIComponent(orderNumber)}`, {
          state: {
            orderId: orderRef.id,
            orderNumber,
            order: completedOrderData
          }
        });
        return;
      } else {
        navigate("/order-failed", {
          state: {
            error: "Payment could not be verified by the banking network.",
            orderNumber
          }
        });
        return;
      }
    } catch (e) {
      console.error(e);
      showToast("Order save failed. Please contact support.", "error");
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (items.length === 0) { showToast("Your bag is empty!", "error"); return; }
    if (invalidCartError) { showToast(invalidCartError, "error"); return; }

    // 1. Validate Full Name
    const cleanName = (formData.name || "").trim();
    if (!cleanName || !isValidName(cleanName)) {
      showToast("Please enter a valid full name (letters only, 2-60 characters).", "error");
      return;
    }

    // 2. Validate Email Address
    const cleanEmail = (formData.email || "").toLowerCase().trim();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    // 3. Validate Mobile Phone (Strict 10 digits Indian mobile)
    const phoneVal = cleanPhone(formData.phone);
    if (!phoneVal || !isValidPhone(phoneVal)) {
      showToast("Please enter a valid 10-digit mobile number (starts with 6, 7, 8, or 9).", "error");
      return;
    }

    // 4. Validate Alternate Phone (if provided)
    if (formData.alternatePhone) {
      const altPhoneVal = cleanPhone(formData.alternatePhone);
      if (!isValidPhone(altPhoneVal)) {
        showToast("Alternate phone must be a valid 10-digit mobile number.", "error");
        return;
      }
    }

    // 5. Validate House / Building / Flat
    const cleanFlat = (formData.flat || "").trim();
    if (!cleanFlat || cleanFlat.length < 2) {
      showToast("Please provide your flat, house number, or building name.", "error");
      return;
    }

    // 6. Validate Street / Locality
    const cleanStreet = (formData.street || "").trim();
    if (!cleanStreet || cleanStreet.length < 3) {
      showToast("Please provide your street, area, or locality.", "error");
      return;
    }

    // 7. Validate City & State
    if (!formData.city || formData.city.trim().length < 2) {
      showToast("Please enter your delivery city.", "error");
      return;
    }
    if (!formData.state || formData.state.trim().length < 2) {
      showToast("Please enter your delivery state.", "error");
      return;
    }

    // 8. Validate PIN Code (Strict 6 digits)
    const cleanPin = cleanPincode(formData.pincode);
    if (!cleanPin || !isValidPincode(cleanPin)) {
      showToast("Please enter a valid 6-digit delivery PIN code.", "error");
      return;
    }

    try {
      const hardcodedAdmins = ["mahirsh9999@gmail.com", "admin@mahirash.com"];
      if (hardcodedAdmins.includes(cleanEmail)) {
        showToast("This email belongs to an administrator. Please use a different email address.", "error");
        return;
      }

      await getDocs(query(collection(db, "users"), where("email", "==", cleanEmail)));
      await getDocs(query(collection(db, "admins"), where("email", "==", cleanEmail)));
    } catch (err) {
      console.error("Email verification failed", err);
    }

    setIsProcessing(true);

    let tempPassword = "";

    try {
      const payableAmount = Math.max(0, total - couponDiscount);
      const generatedOrderNumber = "MHR-" + Math.floor(100000 + Math.random() * 900000);

      // Step 1: Create verified server-side Razorpay order
      let rzpOrder = null;
      try {
        const orderRes = await fetch("/api/razorpay/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: payableAmount,
            currency: "INR",
            receipt: `rcpt_${generatedOrderNumber}`,
            customer: {
              name: cleanName,
              email: cleanEmail,
              phone: phoneVal
            },
            notes: {
              order_number: generatedOrderNumber,
              customer_name: cleanName,
              customer_email: cleanEmail,
              items_count: String(items.length)
            }
          })
        });
        if (orderRes.ok) {
          rzpOrder = await orderRes.json();
        } else {
          const errData = await orderRes.json().catch(() => ({}));
          console.warn("[Razorpay] Server order notice:", errData);
        }
      } catch (err) {
        console.warn("[Razorpay] Server order creation call notice:", err);
      }

      const activeKey = rzpOrder?.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_live_TuShEm20JwRAKS";

      const options = {
        key: activeKey,
        amount: rzpOrder?.amount || Math.round(payableAmount * 100),
        currency: "INR",
        name: "Mahirash Perfumes",
        description: "Luxury Perfumes Order #" + generatedOrderNumber,
        image: `${window.location.origin}/logom.webp`,
        order_id: rzpOrder?.orderId || undefined,
        prefill: { name: cleanName, email: cleanEmail, contact: phoneVal },
        theme: { color: "#111111" },
        handler: async (response) => {
          let verifiedMethod = "Online";
          let verifiedAmount = payableAmount;

          // Step 2: Verify signature on server
          if (response.razorpay_signature && response.razorpay_order_id) {
            try {
              const verifyRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                })
              });
              if (verifyRes.ok) {
                const verifyData = await verifyRes.json();
                if (verifyData.verified) {
                  verifiedMethod = verifyData.method || "Online";
                  verifiedAmount = verifyData.amount || payableAmount;
                }
              }
            } catch (vErr) {
              console.warn("[Razorpay] Signature verification notice:", vErr);
            }
          }

          // Step 3: Save order to Firestore with all verified payment details
          await saveOrder(
            response.razorpay_payment_id,
            "confirmed",
            "paid",
            tempPassword,
            {
              razorpayOrderId: response.razorpay_order_id || "",
              razorpaySignature: response.razorpay_signature || "",
              paymentMode: verifiedMethod.toUpperCase(),
              verifiedAmount
            }
          );
          setIsProcessing(false);
        },
        modal: {
          ondismiss: () => {
            showToast("Payment window closed. Your items remain in your bag.", "info");
            setIsProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        console.error("Razorpay payment failed:", response.error);
        setIsProcessing(false);
        navigate("/order-failed", {
          state: {
            error: response.error?.description || "Payment was declined by your bank or card issuer.",
            orderNumber: response.error?.metadata?.order_id || null
          }
        });
      });
      rzp.open();
    } catch (err) {
      console.error("[Checkout] Order processing error:", err);
      showToast(err.message || "Payment service temporarily unavailable. Please retry.", "error");
      setIsProcessing(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    let finalVal = value;

    if (name === "phone" || name === "alternatePhone") {
      finalVal = cleanPhone(value);
    } else if (name === "pincode") {
      finalVal = cleanPincode(value);
    } else if (name === "email") {
      finalVal = value.toLowerCase().trim();
    } else if (name === "name") {
      finalVal = sanitizeText(value, 60);
    } else if (name === "flat" || name === "street" || name === "landmark") {
      finalVal = sanitizeText(value, 150);
    }

    setFormData(prev => ({ ...prev, [name]: finalVal }));
  };

  const inputCls = "w-full bg-white border border-zinc-300 rounded-lg px-4 py-3 text-sm text-zinc-900 outline-none focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800/10 transition-all placeholder:text-zinc-400";

  /* ── Guards ── */
  if (loading) return <MiniLoader message="Preparing Checkout" />;

  if (orderStatus === "success") return <OrderSuccess navigate={navigate} orderDetails={createdOrderDetails} />;
  if (orderStatus === "failed") return <OrderFailed onRetry={() => setOrderStatus(null)} />;

  /* ── Main checkout UI ── */
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <SEOHead
        title="Checkout | Luxury Perfumes"
        description="Complete your order securely on Mahirash."
        robots="noindex, follow"
        url="https://mahirash.com/checkout"
      />

      {/* Header offset + breadcrumb */}
      <div className="mt-[145px] md:mt-[130px]" />
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 text-[14px] text-zinc-400 uppercase tracking-wider">
          <Link to="/" className="hover:text-zinc-700 transition-colors">Home</Link>
          <ChevronRight size={12} />
          <Link to="/cart" className="hover:text-zinc-700 transition-colors">Cart</Link>
          <ChevronRight size={12} />
          <span className="text-zinc-700">Checkout</span>
        </div>
      </div>

      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <h1 className="text-xl font-bold text-zinc-900 mb-6">Secure Checkout</h1>

        {invalidCartError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between gap-3 mb-6">
            <span className="font-medium">⚠ {invalidCartError}</span>
            <Link to="/cart" className="shrink-0 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors">
              Return to Cart
            </Link>
          </div>
        )}

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
                  {/* ── Saved Delivery Address Choice Bar ── */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl">
                        <div>
                          <p className="text-xs font-bold text-[#800020] uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-[#800020]" />
                            Saved Delivery Profile Found
                          </p>
                          <p className="text-xs text-[#75665D] mt-0.5">
                            Would you like to deliver with your saved address or enter a new address?
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setAddressMode("saved");
                              setIsEditingAddress(false);
                            }}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${addressMode === "saved" && !isEditingAddress
                                ? "bg-[#800020] text-white border-[#800020] shadow-xs"
                                : "bg-white text-[#30231F] border-[#E9DCCB] hover:border-[#800020]"
                              }`}
                          >
                            Use Saved Address
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAddressMode("new");
                              setIsEditingAddress(false);
                              setFormData(p => ({
                                ...p,
                                flat: "",
                                street: "",
                                landmark: "",
                                address: "",
                                city: "",
                                state: "",
                                pincode: "",
                                alternatePhone: ""
                              }));
                            }}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${addressMode === "new"
                                ? "bg-[#800020] text-white border-[#800020] shadow-xs"
                                : "bg-white text-[#30231F] border-[#E9DCCB] hover:border-[#800020]"
                              }`}
                          >
                            + Enter New Address
                          </button>
                        </div>
                      </div>

                      {/* Primary Saved Address Cards */}
                      {addressMode === "saved" && !isEditingAddress && (
                        <div className="grid grid-cols-1 gap-3">
                          {savedAddresses.map((addr) => {
                            const sel = selectedAddressId === addr.id || (!selectedAddressId && addr.isDefault);
                            return (
                              <div
                                key={addr.id}
                                onClick={() => {
                                  setSelectedAddressId(addr.id);
                                  setFormData(p => ({
                                    ...p,
                                    name: addr.name || p.name,
                                    email: addr.email || p.email,
                                    phone: addr.phone || p.phone,
                                    alternatePhone: addr.alternatePhone || "",
                                    flat: addr.flat || "",
                                    street: addr.street || addr.address || "",
                                    landmark: addr.landmark || "",
                                    address: addr.address || "",
                                    city: addr.city || "",
                                    state: addr.state || "",
                                    pincode: addr.pincode || "",
                                    type: addr.type || "Home"
                                  }));
                                }}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer relative ${sel
                                    ? "border-[#800020] bg-[#FCF9F4] shadow-xs"
                                    : "border-zinc-200 bg-white hover:border-zinc-400"
                                  }`}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center shrink-0 ${sel ? "border-[#800020] bg-[#800020]" : "border-zinc-300"
                                      }`}>
                                      {sel && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <div className="space-y-1 text-left">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm text-[#30231F] uppercase">{addr.name || formData.name}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-wider bg-white text-[#800020] border border-[#800020]/30 px-2 py-0.5 rounded">
                                          {addr.type || "Home"}
                                        </span>
                                        {addr.isDefault && (
                                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#800020] text-white px-1.5 py-0.5 rounded">
                                            Default
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-[#75665D] leading-relaxed">
                                        {addr.flat ? `${addr.flat}, ` : ""}{addr.street || addr.address}
                                        {addr.landmark ? `, Near ${addr.landmark}` : ""}
                                      </p>
                                      <p className="text-xs text-[#75665D]">
                                        {addr.city}, {addr.state} - <span className="font-mono font-bold text-[#30231F]">{addr.pincode}</span>
                                      </p>
                                      <p className="text-xs text-[#75665D] font-mono pt-0.5">
                                        Phone: <strong className="text-[#30231F]">{addr.phone || formData.phone}</strong>
                                        {addr.alternatePhone ? ` · Alt: ${addr.alternatePhone}` : ""}
                                        <span className="text-[#75665D] font-sans ml-3">Email: {addr.email || formData.email}</span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingAddress(true);
                                      }}
                                      className="text-xs font-bold text-[#800020] hover:underline flex items-center gap-1 cursor-pointer p-1"
                                      title="Edit this address"
                                    >
                                      <Edit3 size={13} /> Edit
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Address Input Form (shown if New Address, Editing, or No Saved Address) ── */}
                  {(savedAddresses.length === 0 || addressMode === "new" || isEditingAddress) && (
                    <div className="space-y-4 pt-1 text-left">
                      {savedAddresses.length > 0 && (
                        <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                          <button
                            type="button"
                            onClick={() => {
                              setAddressMode("saved");
                              setIsEditingAddress(false);
                            }}
                            className="text-xs font-bold text-[#800020] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            ← Back to saved delivery address
                          </button>
                          {isEditingAddress && (
                            <button
                              type="button"
                              onClick={() => setIsEditingAddress(false)}
                              className="px-3 py-1 bg-zinc-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-md hover:bg-zinc-800 transition-colors"
                            >
                              Done Editing
                            </button>
                          )}
                        </div>
                      )}

                      {/* Address Type Selector */}
                      <div>
                        <label className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Address Type</label>
                        <div className="flex items-center gap-2">
                          {["Home", "Office", "Other"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setFormData(p => ({ ...p, type: t }))}
                              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${formData.type === t
                                ? "bg-[#800020] text-[#ffffff] border-[#800020] shadow-xs"
                                : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                                }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Full Name & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Full Name *</label>
                          <div className="relative">
                            <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="text"
                              name="name"
                              required
                              maxLength={60}
                              value={formData.name}
                              onChange={handleInput}
                              className={`${inputCls} pl-10`}
                              placeholder="Your full name"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Email Address *</label>
                          <div className="relative">
                            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="email"
                              name="email"
                              required
                              maxLength={100}
                              value={formData.email}
                              onChange={handleInput}
                              onBlur={(e) => {
                                const val = e.target.value.trim().toLowerCase();
                                if (val && val.includes("@")) {
                                  loadAddressesForEmail(val);
                                }
                              }}
                              className={`${inputCls} pl-10`}
                              placeholder="email@example.com"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Primary Phone & Alternate Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Phone Number (10 digits) *</label>
                          <div className="relative">
                            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="tel"
                              name="phone"
                              required
                              maxLength={10}
                              inputMode="numeric"
                              value={formData.phone}
                              onChange={handleInput}
                              className={`${inputCls} pl-10 font-mono`}
                              placeholder="10-digit mobile number"
                            />
                          </div>
                          <span className="text-[11px] text-zinc-400 mt-1 block">Indian 10-digit mobile (e.g. 9876543210)</span>
                        </div>
                        <div>
                          <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Alternate Phone (Optional)</label>
                          <div className="relative">
                            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                            <input
                              type="tel"
                              name="alternatePhone"
                              maxLength={10}
                              inputMode="numeric"
                              value={formData.alternatePhone || ""}
                              onChange={handleInput}
                              className={`${inputCls} pl-10 font-mono`}
                              placeholder="Secondary 10-digit mobile"
                            />
                          </div>
                          <span className="text-[11px] text-zinc-400 mt-1 block">Optional courier backup number</span>
                        </div>
                      </div>

                      {/* Flat / House No / Building & Area / Street / Locality */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Flat, House No., Building, Apartment *</label>
                          <input
                            type="text"
                            name="flat"
                            required
                            maxLength={150}
                            value={formData.flat || ""}
                            onChange={handleInput}
                            className={inputCls}
                            placeholder="e.g. Flat 402, Royal Residency, Tower B"
                          />
                        </div>
                        <div>
                          <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Area, Street, Sector, Locality *</label>
                          <input
                            type="text"
                            name="street"
                            required
                            maxLength={150}
                            value={formData.street || ""}
                            onChange={handleInput}
                            className={inputCls}
                            placeholder="e.g. MG Road, Scheme 54, Vijay Nagar"
                          />
                        </div>
                      </div>

                      {/* Landmark */}
                      <div>
                        <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Landmark (Optional)</label>
                        <input
                          type="text"
                          name="landmark"
                          maxLength={150}
                          value={formData.landmark || ""}
                          onChange={handleInput}
                          className={inputCls}
                          placeholder="e.g. Near Apollo Hospital / Opp. City Center Mall"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative">
                          <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">City *</label>
                          <input
                            type="text"
                            name="city"
                            required
                            maxLength={80}
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
                                  <div className="text-zinc-500 font-medium font-mono text-[12px]">{office.State} – Pin: {office.Pincode}</div>
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
                            maxLength={80}
                            value={formData.state}
                            onChange={handleInput}
                            className={inputCls}
                            placeholder="e.g. Madhya Pradesh"
                          />
                        </div>

                        <div>
                          <label className="text-[14px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1.5">Pincode (6 digits) *</label>
                          <input
                            type="text"
                            name="pincode"
                            required
                            maxLength={6}
                            inputMode="numeric"
                            value={formData.pincode}
                            onChange={handleInput}
                            className={`${inputCls} font-mono`}
                            placeholder="e.g. 452001"
                          />
                        </div>
                      </div>
                    </div>
                  )}
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
                        <p className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400 mb-3">Accepted Payments</p>
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
                            <span className="text-white text-[12px] font-black tracking-wide">NET BANKING</span>
                          </div>
                          <div className="h-8 px-2 bg-[#6B3FA0] border border-[#6B3FA0] rounded-md flex items-center justify-center">
                            <span className="text-white text-[14px] font-bold">UPI</span>
                          </div>
                        </div>
                        <p className="text-[12px] text-zinc-400 mt-3 flex items-center gap-1.5">
                          <Lock size={10} /> Powered by Razorpay · 256-bit SSL encryption
                        </p>
                      </motion.div>
                    )}
                  </button>

                  {/* Assured Prepaid Benefit Card */}
                  <div className="p-4 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl flex items-start gap-3">
                    <ShieldCheck size={20} className="text-[#800020] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#75665D] leading-relaxed">
                      <span className="font-bold text-[#30231F] block mb-0.5">100% Insured Priority Dispatch:</span>
                      All online prepaid orders are prioritized for same-day inspection and handed over to Delhivery Express with complimentary transit insurance. Cash on Delivery is discontinued to guarantee untouched luxury seal integrity.
                    </div>
                  </div>
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
                        <p className="text-[12px] font-bold uppercase tracking-wider text-[#800020] mb-0.5">{item.brand || 'MAHIRASH'}</p>
                        <p className="text-sm font-semibold text-zinc-900 line-clamp-1">{item.name}</p>
                        {item.size && (
                          <p className="text-[14px] text-zinc-500 mt-0.5 flex items-center gap-1.5">
                            <span>Size: {item.size}</span>
                            {item.is_preorder && (
                              <span className="bg-[#800020] text-white text-[12px] font-bold uppercase tracking-wider px-1.5 py-0.5 shadow-xs">
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
                    <div className="flex justify-between text-sm text-[#800020] font-bold">
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
                  <Tag size={15} className="text-[#800020]" />
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
                        className="bg-[#800020] text-[#ffffff] hover:bg-[#66001a] text-[12px] font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm shrink-0"
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
                    <div className="flex items-center justify-between bg-[#800020]/5 border border-[#800020]/20 p-2.5 rounded-lg">
                      <div className="min-w-0 text-left">
                        <span className="text-[14px] font-bold text-[#800020] font-mono tracking-wider">{appliedCoupon.code}</span>
                        <p className="text-[12px] text-zinc-500 font-medium mt-0.5">
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
                disabled={isProcessing || items.length === 0 || Boolean(invalidCartError)}
                className={`w-full py-4 text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 ${isProcessing || items.length === 0 || Boolean(invalidCartError) ? "bg-zinc-300 text-zinc-500 cursor-not-allowed" : "bg-[#800020] hover:bg-[#66001a] text-[#ffffff] active:scale-[0.98] shadow-md cursor-pointer"}`}
              >
                {isProcessing ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</>
                ) : invalidCartError ? (
                  "Cannot Checkout — Check Bag"
                ) : (
                  <>Pay ₹{finalPayable.toLocaleString()} Securely <ArrowRight size={15} /></>
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
