import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Trash2,
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronRight,
  Gift,
  ArrowLeft,
  ArrowRight,
  Lock,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../components/StoreProvider";
import { useAuth } from "../components/useAuth";
import { db } from "../components/Firebase";
import { doc, getDoc } from "firebase/firestore";
import SEOHead from "../components/SEOHead";
import OptimizedCloudinaryImage from "../components/OptimizedCloudinaryImage";

/* ─────────────────────────────────────────────────────────────────────────── */

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, loading } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGiftNoteOpen, setIsGiftNoteOpen] = useState(false);
  const [giftNote, setGiftNote] = useState("");
  const [productStocks, setProductStocks] = useState({});

  const total = cart.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const stocksMap = {};
        for (const item of cart) {
          const docSnap = await getDoc(doc(db, "products", item.id));
          const cartKey = item.cartId || item.id;
          if (docSnap.exists()) {
            const data = docSnap.data();
            let variantStock = data.stock !== undefined ? data.stock : 10;
            let isPreorder = Boolean(data.is_preorder) || String(data.stock_status || '').toLowerCase().includes('preorder');

            if (item.size && Array.isArray(data.size_prices) && data.size_prices.length > 0) {
              const matchedSize = data.size_prices.find(sp => sp.size?.toLowerCase().trim() === item.size.toLowerCase().trim());
              if (matchedSize) {
                if (matchedSize.stock !== undefined) variantStock = Number(matchedSize.stock);
                if (matchedSize.is_preorder !== undefined) isPreorder = Boolean(matchedSize.is_preorder);
              }
            }

            stocksMap[cartKey] = {
              stock: variantStock,
              stock_status: variantStock === 0 ? "Out of Stock" : variantStock <= 5 ? "Low Stock" : (data.stock_status || "In Stock"),
              is_preorder: isPreorder,
            };
          } else {
            stocksMap[cartKey] = {
              stock: item.stock !== undefined ? item.stock : 10,
              stock_status: "In Stock",
              is_preorder: Boolean(item.is_preorder)
            };
          }
        }
        setProductStocks(stocksMap);
      } catch (err) {
        console.error("Error fetching cart stock:", err);
      }
    };
    if (cart.length > 0) fetchStocks();
  }, [cart]);

  const isItemPreOrder = (item) => {
    const cartKey = item.cartId || item.id;
    const stockInfo = productStocks[cartKey] || {};
    return Boolean(item.is_preorder) || Boolean(stockInfo.is_preorder) ||
      String(item.stock_status || '').toLowerCase().includes('preorder') ||
      String(stockInfo.stock_status || '').toLowerCase().includes('preorder');
  };

  const isItemOutOfStock = (item) => {
    if (isItemPreOrder(item)) return false;
    const cartKey = item.cartId || item.id;
    const stockInfo = productStocks[cartKey];
    if (stockInfo) {
      return stockInfo.stock === 0 || stockInfo.stock_status === "Out of Stock" || item.quantity > stockInfo.stock;
    }
    return (item.stock !== undefined && item.stock <= 0) || item.stock_status === "Out of Stock";
  };

  const hasOutOfStockItem = cart.some(isItemOutOfStock);
  const hasPreOrderItem = cart.some(isItemPreOrder);
  const cannotCheckout = hasOutOfStockItem || hasPreOrderItem;

  const handleCheckout = () => {
    if (cannotCheckout) return;
    navigate("/checkout");
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-800 rounded-full animate-spin" />
          <p className="text-[14px] uppercase tracking-widest text-zinc-400">
            Loading your bag…
          </p>
        </div>
      </div>
    );
  }

  /* ── Empty ── */
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f5f5]">
        <SEOHead
          title="Shopping Bag | Mahirash Luxury Perfumes"
          description="View items in your Mahirash shopping bag and proceed to checkout."
          robots="noindex, follow"
          url="https://mahirash.com/cart"
        />
        {/* Simple page top padding for header */}
        <div className="mt-[145px] md:mt-[130px]" />
        <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-sm mx-auto text-center"
          >
            <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag size={28} strokeWidth={1.5} className="text-zinc-400" />
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 mb-2">
              Your bag is empty
            </h1>
            <p className="text-sm text-zinc-500 mb-8">
              Looks like you haven't added anything yet.
              Start exploring our collection.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-zinc-900 text-white text-sm font-semibold uppercase tracking-wider rounded-md hover:bg-black transition-colors"
            >
              Continue Shopping
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <SEOHead
        title="Shopping Bag | Mahirash Luxury Perfumes"
        description="View items in your Mahirash shopping bag and proceed to checkout."
        robots="noindex, follow"
        url="https://mahirash.com/cart"
      />

      {/* Header offset */}
      <div className="mt-[145px] md:mt-[130px]" />

      {/* ── Page title bar ── */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[14px] text-zinc-400 uppercase tracking-wider">
            <Link to="/" className="hover:text-zinc-700 transition-colors">Home</Link>
            <ChevronRight size={12} />
            <Link to="/shop" className="hover:text-zinc-700 transition-colors">Shop</Link>
            <ChevronRight size={12} />
            <span className="text-zinc-700">Cart</span>
          </div>
          <Link
            to="/shop"
            className="flex items-center gap-1.5 text-[14px] font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft size={13} />
            Continue Shopping
          </Link>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Page heading */}
        <h1 className="text-xl font-bold text-zinc-900 mb-1">
          My Cart ({cart.length} {cart.length === 1 ? "item" : "items"})
        </h1>
        <p className="text-sm text-zinc-500 mb-6">
          Review your items before checkout
        </p>

        <div className="flex flex-col lg:flex-row gap-5 items-start">

          {/* ── LEFT: Cart items ── */}
          <div className="w-full lg:flex-1 min-w-0 space-y-3">

            <AnimatePresence mode="popLayout">
              {cart.map((item, idx) => {
                const cartKey = item.cartId || item.id;
                const stockInfo = productStocks[cartKey] || {
                  stock: item.stock !== undefined ? item.stock : 999,
                  stock_status: "In Stock",
                };
                const isItemOut = isItemOutOfStock(item);
                const isItemPre = isItemPreOrder(item);
                const isLowStock = !isItemOut && !isItemPre && item.quantity > stockInfo.stock;

                return (
                  <motion.div
                    key={`${item.cartId || item.id}-${idx}`}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="bg-white rounded-xl border border-zinc-200 overflow-hidden"
                  >
                    {/* Out-of-stock banner */}
                    {isItemOut && (
                      <div className="bg-red-50 border-b border-red-100 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-[12px] font-bold text-red-600 uppercase tracking-wider">
                          ⚠ Out of Stock — Please remove to continue
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            alert(`You will be notified when ${item.name} is restocked! It has been removed from your bag.`);
                            removeFromCart(item.cartId || item.id);
                          }}
                          className="text-[12px] font-bold uppercase tracking-wider text-zinc-900 hover:text-[#800020] underline cursor-pointer"
                        >
                          Notify Me & Remove
                        </button>
                      </div>
                    )}
                    {/* Pre-order banner */}
                    {isItemPre && (
                      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
                        <span className="text-[12px] font-bold text-amber-800 uppercase tracking-wider">
                          ✦ Pre-Order Item — Cannot checkout in regular bag
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const num = "9584826112";
                              const msg = `Hello Mahirash! I would like to pre-order ${item.name} (${item.size || ''}).`;
                              window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
                              removeFromCart(item.cartId || item.id);
                            }}
                            className="text-[12px] font-bold uppercase tracking-wider text-[#800020] hover:text-[#66001a] underline cursor-pointer"
                          >
                            Pre-Order on WhatsApp
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.cartId || item.id)}
                            className="text-[12px] font-bold uppercase tracking-wider text-zinc-500 hover:text-red-600 underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                    {isLowStock && (
                      <div className="bg-amber-50 border-b border-amber-100 px-4 py-2">
                        <span className="text-[14px] font-semibold text-amber-700">
                          Only {stockInfo.stock} left in stock!
                        </span>
                      </div>
                    )}

                    <div className="flex gap-0">
                      {/* Product image — fixed size, always on left */}
                      <Link
                        to={`/product/${item.id}`}
                        className="shrink-0 w-[120px] sm:w-[150px] h-[140px] sm:h-[170px] bg-[#f0eeeb] overflow-hidden"
                      >
                        <OptimizedCloudinaryImage
                          src={item.image}
                          alt={item.name}
                          preset="avatar"
                          className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
                        />
                      </Link>

                      {/* Product details */}
                      <div className="flex-1 min-w-0 px-4 py-4 flex flex-col justify-between gap-2">
                        {/* Top: product info */}
                        <div>
                          <p className="text-[12px] font-bold uppercase tracking-widest text-[#800020] mb-0.5">
                            {item.brand || 'MAHIRASH'} {item.category ? `· ${item.category}` : ''}
                          </p>
                          <Link
                            to={`/product/${item.id}`}
                            className="text-sm sm:text-[15px] font-semibold text-zinc-900 hover:text-zinc-700 transition-colors line-clamp-2 leading-snug"
                          >
                            {item.name}
                          </Link>
                          {item.size && (
                            <p className="text-[14px] text-zinc-500 mt-1">
                              Volume: <span className="font-semibold text-zinc-700">{item.size}</span>
                            </p>
                          )}
                          <p className="text-base font-bold text-zinc-900 mt-2">
                            ₹{Number(item.price).toLocaleString("en-IN")}
                          </p>
                        </div>

                        {/* Bottom: quantity + delete */}
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          {/* Qty */}
                          <div className="flex items-center border border-zinc-300 rounded-md overflow-hidden">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.cartId || item.id, -1); }}
                              disabled={item.quantity <= 1}
                              aria-label="Decrease"
                              className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors font-bold text-base disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              −
                            </button>
                            <span className="min-w-[32px] px-2 h-9 flex items-center justify-center text-sm font-semibold text-zinc-900 border-x border-zinc-200 select-none">
                              {item.quantity || 1}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); if (item.quantity < stockInfo.stock) updateQuantity(item.cartId || item.id, 1); }}
                              disabled={isItemOut || isItemPre || item.quantity >= stockInfo.stock}
                              aria-label="Increase"
                              className="w-9 h-9 flex items-center justify-center text-zinc-600 hover:bg-zinc-100 transition-colors font-bold text-base disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              +
                            </button>
                          </div>

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeFromCart(item.cartId || item.id); }}
                            className="flex items-center gap-1.5 text-[14px] text-zinc-400 hover:text-red-500 transition-colors py-2 px-3 rounded-lg hover:bg-red-50 border border-zinc-200 hover:border-red-200 min-w-[40px] min-h-[40px] justify-center sm:justify-start"
                            aria-label="Remove item"
                          >
                            <Trash2 size={14} strokeWidth={1.5} />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* ── Delivery & authenticity info ── */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { icon: ShieldCheck, title: "100% Authentic\nLuxury Extraits", sub: "Direct from House" },
                  { icon: Truck, title: "Express\nDelivery", sub: "Delivered in 4-5 days" },
                  { icon: Lock, title: "Secure\nCheckout", sub: "256-bit SSL Protected" },
                ].map(({ icon: Icon, title, sub }) => (
                  <div key={title} className="flex flex-col items-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-[#f0eeeb] flex items-center justify-center">
                      <Icon size={16} strokeWidth={1.5} className="text-zinc-600" />
                    </div>
                    <p className="text-[12px] font-semibold text-zinc-800 leading-tight whitespace-pre-line">
                      {title}
                    </p>
                    <p className="text-[12px] text-zinc-500">{sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Authenticity & Express Delivery Promise ── */}
            <div className="bg-white rounded-xl border border-zinc-200 px-4 py-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#f0eeeb] flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} strokeWidth={1.5} className="text-[#800020]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-800">
                    Authentic Luxury Fragrances
                  </p>
                  <p className="text-[14px] text-zinc-500">
                    Handcrafted pure botanical extraits. Express delivery in 4-5 days across India.
                  </p>
                </div>
              </div>
              <Link
                to="/terms"
                className="text-[14px] font-semibold text-zinc-700 underline underline-offset-2 hover:text-black transition-colors whitespace-nowrap flex items-center gap-1 shrink-0"
              >
                Know More <ArrowRight size={11} />
              </Link>
            </div>
          </div>

          {/* ── RIGHT: Order Summary ── */}
          <aside className="w-full lg:w-[360px] shrink-0 lg:sticky lg:top-28">
            <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
              {/* Summary header */}
              <div className="px-5 py-4 border-b border-zinc-100">
                <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-700">
                  Price Details
                </h2>
              </div>

              <div className="px-5 py-4 space-y-3 border-b border-zinc-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-600">
                    Price ({cart.length} {cart.length === 1 ? "item" : "items"})
                  </span>
                  <span className="font-medium text-zinc-900">
                    ₹{total.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-600">Discount</span>
                  <span className="font-medium text-green-600">—</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-600">Delivery Charges</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-zinc-600">GST (Included)</span>
                  <span className="font-medium text-zinc-900">₹0</span>
                </div>
              </div>

              <div className="px-5 py-4 flex justify-between items-center border-b border-zinc-100">
                <span className="text-base font-bold text-zinc-900">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-zinc-900">
                  ₹{total.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Gift note */}
              <div className="px-5 py-3 border-b border-zinc-100">
                <button
                  onClick={() => setIsGiftNoteOpen(!isGiftNoteOpen)}
                  className="w-full flex items-center justify-between text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Gift size={14} strokeWidth={1.5} className="text-zinc-400" />
                    Add a Gift Note
                  </span>
                  <ChevronRight
                    size={14}
                    className={`text-zinc-400 transition-transform duration-200 ${isGiftNoteOpen ? "rotate-90" : ""
                      }`}
                  />
                </button>
                <AnimatePresence>
                  {isGiftNoteOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <textarea
                        value={giftNote}
                        onChange={(e) => setGiftNote(e.target.value)}
                        placeholder="Write your message…"
                        maxLength={180}
                        className="mt-3 w-full h-20 bg-zinc-50 border border-zinc-200 rounded-lg p-3 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 resize-none"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* CTA */}
              <div className="px-5 py-4">
                <button
                  onClick={() => !cannotCheckout && handleCheckout()}
                  disabled={cannotCheckout}
                  className={`w-full py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-lg transition-all duration-200 cursor-pointer shadow-md ${cannotCheckout
                    ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                    : "bg-[#800020] hover:bg-[#66001a] text-[#ffffff] active:scale-[0.98]"
                    }`}
                >
                  {hasOutOfStockItem
                    ? "Remove Out of Stock Items"
                    : hasPreOrderItem
                      ? "Remove Pre-Order Items to Checkout"
                      : "Place Order"}
                  {!cannotCheckout && <ArrowRight size={16} />}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <Lock size={11} strokeWidth={1.5} className="text-zinc-400" />
                  <span className="text-[14px] text-zinc-400">
                    Safe &amp; Secure Payments
                  </span>
                </div>
              </div>
            </div>

            {/* Savings callout */}
            {total > 0 && (
              <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-5 py-3 text-sm text-green-700 font-medium text-center">
                🎉 You're saving ₹0 on this order
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;