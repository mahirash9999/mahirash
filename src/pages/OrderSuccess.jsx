import React, { useEffect, useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { db } from "../components/Firebase";
import { doc, getDoc } from "firebase/firestore";
import { useAuth } from "../components/useAuth";
import { useCustomerAuth } from "../components/CustomerAuthProvider";
import {
  CheckCircle,
  Package,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Mail,
  MapPin,
  Truck,
  ShoppingBag,
  Clock,
  Printer,
  Download,
  CreditCard,
  User,
  Compass,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "../components/SEOHead";

const OrderSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const customerAuth = useCustomerAuth();
  const customer = customerAuth?.customer;

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [accessRestricted, setAccessRestricted] = useState(null);

  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get("orderId") || location.state?.orderId;
  const orderNumber = queryParams.get("orderNumber") || order?.orderNumber;

  useEffect(() => {
    const targetKey = (orderNumber || orderId || "").toUpperCase();

    // Security Guard: Prevent public sharing of Thank You page
    if (!user && !customer && targetKey) {
      const isPurchasedDevice = (
        typeof window !== "undefined" &&
        (sessionStorage.getItem("mahirash_purchased_sig_" + targetKey) === "active" ||
          (orderId && sessionStorage.getItem("mahirash_purchased_sig_" + orderId) === "active") ||
          location.state?.order)
      );

      const hasViewed = (
        typeof window !== "undefined" &&
        sessionStorage.getItem("mahirash_order_viewed_" + targetKey) === "true"
      );

      if (isPurchasedDevice && !hasViewed) {
        try {
          sessionStorage.setItem("mahirash_order_viewed_" + targetKey, "true");
        } catch (_) {}
      } else if (!isPurchasedDevice && !location.state?.order) {
        // Not the purchasing device and no in-memory state
        setAccessRestricted("unauthorized");
        setLoading(false);
        return;
      }
    }

    if (order) {
      setLoading(false);
      return;
    }

    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const snap = await getDoc(doc(db, "orders", orderId));
        if (snap.exists()) {
          setOrder({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error("[OrderSuccess] Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, order, user, customer]);

  // Invoice Print Handler
  const handlePrintInvoice = () => {
    const invoiceWindow = window.open("", "_blank", "width=850,height=950");
    if (!invoiceWindow) {
      alert("Please allow popups to view or print your tax invoice.");
      return;
    }

    const itemsHtml = (order?.items || []).map((it, idx) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          <strong>${it.name}</strong>${it.size ? `<br><small style="color:#666;">Size: ${it.size}</small>` : ""}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${it.quantity || 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${Number(it.price || 0).toLocaleString("en-IN")}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${(Number(it.price || 0) * Number(it.quantity || 1)).toLocaleString("en-IN")}</td>
      </tr>
    `).join("");

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order?.orderNumber || "MHR"}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #30231F; }
          .header { border-bottom: 2px solid #800020; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; }
          .logo { font-size: 26px; font-weight: bold; letter-spacing: 0.3em; color: #800020; font-family: Georgia, serif; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0; }
          th { background: #FCF9F4; padding: 10px; text-align: left; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #E9DCCB; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">MAHIRASH</div>
            <small style="letter-spacing: 0.2em; color: #75665D;">LUXURY PERFUMES</small>
            <p style="font-size: 11px; color: #75665D; margin: 6px 0 0;">Central Dispatch Facility, Indore, MP 452001<br>GSTIN: 23ABCDE1234F1Z5</p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 18px; color: #800020;">TAX INVOICE</h2>
            <p style="font-size: 12px; margin: 4px 0;"><strong>Invoice #:</strong> ${order?.orderNumber || "MHR-101"}</p>
            <p style="font-size: 12px; margin: 2px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
            <p style="font-size: 12px; margin: 2px 0;"><strong>Payment:</strong> PAID (Razorpay: ${order?.paymentId || "Verified"})</p>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h4 style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; color: #800020;">Billed & Shipped To:</h4>
          <p style="margin: 0; font-size: 13px; line-height: 1.5;">
            <strong>${order?.customerName || order?.shipping?.name || "Client"}</strong><br>
            ${order?.shipping?.address || order?.shippingAddress?.address || "Address"}<br>
            ${order?.shipping?.city || ""}, ${order?.shipping?.state || ""} - ${order?.shipping?.pincode || ""}<br>
            Phone: ${order?.customerPhone || order?.shipping?.phone || ""}
          </p>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th><th>Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate</th><th style="text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 16px;">
          <p style="margin: 4px 0; font-size: 13px;">Subtotal: ₹${Number(order?.subtotal || order?.total || 0).toLocaleString("en-IN")}</p>
          ${order?.discount ? `<p style="margin: 4px 0; font-size: 13px; color: green;">Discount: -₹${Number(order.discount).toLocaleString("en-IN")}</p>` : ""}
          <p style="margin: 4px 0; font-size: 13px;">Shipping: COMPLIMENTARY</p>
          <h3 style="margin: 8px 0; font-size: 18px; color: #800020;">Total Paid: ₹${Number(order?.total || 0).toLocaleString("en-IN")}</h3>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 12px; font-size: 11px; color: #888; text-align: center;">
          This is a computer generated invoice and requires no physical signature. Handcrafted with rare botanical extraits.
        </div>
      </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();
    setTimeout(() => {
      invoiceWindow.focus();
      invoiceWindow.print();
    }, 400);
  };

  if (accessRestricted) {
    return (
      <div className="min-h-screen bg-[#FCF9F4] text-[#30231F] font-sans flex items-center justify-center px-4 py-20">
        <SEOHead title="Access Protected | Mahirash Perfumes" />
        <div className="max-w-[540px] w-full bg-white rounded-2xl border border-[#E9DCCB] p-8 sm:p-10 text-center shadow-lg space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#800020]/10 text-[#800020] flex items-center justify-center mx-auto">
            <ShieldAlert size={32} />
          </div>
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#800020]">
              PROTECTED ORDER RECEIPT
            </span>
            <h2 className="text-2xl font-serif text-[#30231F]">Access Restricted</h2>
            <p className="text-xs sm:text-sm text-[#75665D] leading-relaxed">
              For client security, this live confirmation view is private to the purchasing device. To review your complete order history, track shipments, and download tax invoices, please sign in to your Mahirash account.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/orders"
              className="px-6 py-3 bg-[#800020] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md hover:bg-[#650018] transition-all"
            >
              Go to My Orders
            </Link>
            <Link
              to="/shop"
              className="px-6 py-3 bg-[#FCF9F4] border border-[#E9DCCB] text-[#30231F] text-xs font-bold uppercase tracking-wider rounded-xl hover:border-[#800020] transition-all"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCF9F4] flex flex-col items-center justify-center gap-4">
        <SEOHead title="Verifying Acquisition | Mahirash Perfumes" />
        <div className="w-10 h-10 border-2 border-[#800020] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs uppercase tracking-[0.3em] text-[#800020] font-bold">
          Verifying Order Details...
        </p>
      </div>
    );
  }

  const finalOrderNumber = order?.orderNumber || orderNumber || "MHR-ORDER";
  const items = order?.items || [];
  const shipping = order?.shippingAddress || order?.shipping || {};
  const total = Number(order?.total || 0);
  const subtotal = Number(order?.subtotal || total);
  const discount = Number(order?.discount || order?.couponDiscount || 0);

  const formattedAddress = [
    shipping.flat || shipping.houseNumber || "",
    shipping.street || shipping.address || "",
    shipping.landmark ? `Near ${shipping.landmark}` : "",
    shipping.city || "",
    shipping.state || "",
    shipping.pincode ? `PIN: ${shipping.pincode}` : ""
  ].filter(Boolean).join(", ");

  const orderDateFormatted = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="min-h-screen bg-[#FCF9F4] text-[#30231F] font-sans pb-24 pt-28">
      <SEOHead title={`Order #${finalOrderNumber} Confirmed | Mahirash Perfumes`} />

      <div className="max-w-[1050px] mx-auto px-4 sm:px-6">

        {/* ── CELEBRATION HERO BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-[#E9DCCB] p-8 md:p-12 text-center space-y-6 shadow-sm mb-10 relative overflow-hidden"
        >
          <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle size={44} strokeWidth={1.5} />
          </div>

          <div className="space-y-2 max-w-xl mx-auto">
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#800020]">
              CONGRATULATIONS &amp; THANK YOU
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#30231F]">
              Your Artisanal Acquisition is <span className="italic font-light text-[#800020]">Confirmed</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#75665D] leading-relaxed">
              We have received your order. Our perfumers are now preparing, inspecting, and packaging your fragrance flacons for express delivery via Delhivery Express.
            </p>
          </div>

          {/* Reference Badge */}
          <div className="inline-flex flex-wrap items-center justify-center gap-4 bg-[#FCF9F4] border border-[#E9DCCB] px-6 py-3 rounded-full">
            <span className="text-[11px] uppercase tracking-wider text-[#75665D] font-semibold">Order Number</span>
            <span className="font-mono text-base font-bold text-[#800020]">#{finalOrderNumber}</span>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={12} /> PAID ONLINE
            </span>
          </div>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-6 text-xs text-[#75665D] border-t border-[#F5EFEB] max-w-lg mx-auto">
            <div className="flex items-center gap-1.5">
              <Mail size={14} className="text-[#800020]" />
              <span>Confirmation sent to: <strong>{order?.customerEmail || order?.shipping?.email || "your email"}</strong></span>
            </div>
            {order?.paymentId && (
              <div className="flex items-center gap-1.5">
                <CreditCard size={14} className="text-[#800020]" />
                <span>Razorpay Ref: <strong className="font-mono text-[11px]">{order.paymentId}</strong></span>
              </div>
            )}
          </div>

          {/* 3 PRIMARY BUTTONS REQUIRED BY SPEC */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/orders?id=${order?.id || finalOrderNumber}`)}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#800020] hover:bg-[#650018] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <User size={15} />
              <span>View My Order</span>
            </button>

            <button
              onClick={() => navigate(`/track?orderNumber=${encodeURIComponent(finalOrderNumber)}`)}
              className="w-full sm:w-auto px-7 py-3.5 bg-white border border-[#800020] text-[#800020] hover:bg-[#800020]/5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Truck size={15} />
              <span>Track Order</span>
            </button>

            <Link
              to="/shop"
              className="w-full sm:w-auto px-6 py-3.5 bg-[#FCF9F4] border border-[#E9DCCB] text-[#30231F] hover:border-[#800020] text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag size={15} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </motion.div>

        {/* ── DETAILS GRID: ITEMS & SUMMARY ── */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Purchased Items */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E9DCCB] p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-[#F5EFEB] pb-4">
                <h3 className="font-serif text-lg text-[#30231F]">
                  Purchased Fragrances ({items.length})
                </h3>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Payment Verified
                </span>
              </div>

              <div className="divide-y divide-[#F5EFEB]">
                {items.map((item, idx) => (
                  <div key={idx} className="py-4 flex items-center gap-4">
                    <img
                      src={item.image || item.productImage || "/logom.webp"}
                      alt={item.name}
                      className="w-16 h-20 rounded-xl object-cover bg-[#FCF9F4] border border-[#E9DCCB] shrink-0"
                      onError={(e) => { e.target.src = "/logom.webp"; }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#30231F] truncate">
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-[#75665D] mt-1">
                        {item.size && (
                          <span className="font-semibold text-[#800020] bg-[#800020]/10 px-2 py-0.5 rounded text-[11px]">
                            {item.size}
                          </span>
                        )}
                        <span>Qty: <strong>{item.quantity || 1}</strong></span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-[#30231F]">
                        ₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="pt-4 border-t border-[#F5EFEB] space-y-2 text-xs text-[#75665D]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[#30231F]">₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Privilege Discount</span>
                    <span>-₹{discount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Shipping (Delhivery Express)</span>
                  <span className="font-semibold text-emerald-700">COMPLIMENTARY</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#30231F] pt-3 border-t border-[#E9DCCB]">
                  <span>Total Paid</span>
                  <span className="text-[#800020]">₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Invoice Download Action */}
              <div className="pt-2 border-t border-[#F5EFEB] flex items-center justify-between">
                <span className="text-xs text-[#75665D]">Need an official tax receipt?</span>
                <button
                  type="button"
                  onClick={handlePrintInvoice}
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#800020] hover:underline cursor-pointer"
                >
                  <Printer size={13} />
                  <span>Download / Print Invoice</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Dispatch & Logistics Info */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Delivery Address Card */}
            <div className="bg-white rounded-2xl border border-[#E9DCCB] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#800020]">
                <MapPin size={15} />
                <span>Dispatch &amp; Delivery Destination</span>
              </div>
              <div className="text-xs text-[#30231F] space-y-1 leading-relaxed">
                <p className="font-bold text-sm">{shipping.name || order?.customerName || "Patron"}</p>
                <p className="text-[#75665D]">{formattedAddress || "Delivery Address"}</p>
                <p className="text-[#75665D] pt-1">
                  Contact Phone: <strong className="text-[#30231F]">{shipping.phone || order?.customerPhone || "N/A"}</strong>
                </p>
              </div>
            </div>

            {/* Logistics Status & Next Steps */}
            <div className="bg-white rounded-2xl border border-[#E9DCCB] p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#800020]">
                <Clock size={15} />
                <span>Order Progression</span>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle size={13} />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-[#30231F]">Payment Confirmed</p>
                    <p className="text-[#75665D]">Verified via 256-bit SSL encrypted gateway.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#800020] text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                    2
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-[#30231F]">Flacon Inspection &amp; Packing</p>
                    <p className="text-[#75665D]">Carefully packed with foam-cushioned protective casing.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-[#75665D]">Delhivery Express Dispatch</p>
                    <p className="text-[#75665D]">Consignment handed over to courier. AWB tracking active.</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#FCF9F4] rounded-xl border border-[#E9DCCB] text-[11px] text-[#75665D] leading-relaxed">
                💡 <strong>Tracking Availability:</strong> Delhivery live scans will update automatically as soon as the courier scans the package at the central Indore facility.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderSuccess;

