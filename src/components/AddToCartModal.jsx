import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "./StoreProvider";
import OptimizedCloudinaryImage from "./OptimizedCloudinaryImage";

/**
 * Global Add-to-Cart confirmation dialog.
 * Shown automatically whenever addToCart() is called (from StoreProvider context).
 * Provides: Continue Shopping | Go to Cart
 */
const AddToCartModal = () => {
    const { addedItem, dismissAddedItem, cart } = useStore();

    // Auto-dismiss after 8 seconds
    useEffect(() => {
        if (!addedItem) return;
        const timer = setTimeout(dismissAddedItem, 8000);
        return () => clearTimeout(timer);
    }, [addedItem]);

    return (
        <AnimatePresence>
            {addedItem && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/40 z-[999] backdrop-blur-[2px]"
                        onClick={dismissAddedItem}
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.94, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.94, y: 8 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center px-4 pb-6 sm:pb-0 pointer-events-none"
                    >
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto overflow-hidden">

                            {/* Header */}
                            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-zinc-100">
                                <div className="flex items-center gap-2 text-emerald-600">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-bold text-zinc-900">Added to Bag!</span>
                                </div>
                                <button
                                    onClick={dismissAddedItem}
                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors"
                                    aria-label="Close"
                                >
                                    <X size={15} />
                                </button>
                            </div>

                            {/* Product preview */}
                            <div className="flex items-center gap-3 px-5 py-4">
                                <div className="w-16 h-16 rounded-lg bg-[#f0eeeb] shrink-0 overflow-hidden border border-zinc-100">
                                    {addedItem.image ? (
                                        <OptimizedCloudinaryImage
                                            src={addedItem.image}
                                            alt={addedItem.name}
                                            preset="avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <ShoppingBag size={20} className="text-zinc-300" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    {addedItem.category && (
                                        <p className="text-[12px] uppercase tracking-widest text-zinc-400 font-semibold mb-0.5">
                                            {addedItem.category}
                                        </p>
                                    )}
                                    <p className="text-sm font-semibold text-zinc-900 line-clamp-2 leading-snug">
                                        {addedItem.name}
                                    </p>
                                    {addedItem.size && (
                                        <p className="text-[14px] text-zinc-500 mt-0.5">
                                            Size: <span className="font-medium text-zinc-700">{addedItem.size}</span>
                                        </p>
                                    )}
                                    <p className="text-sm font-bold text-zinc-900 mt-1">
                                        ₹{Number(addedItem.price).toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>

                            {/* Cart count */}
                            <div className="mx-5 mb-3 text-[14px] text-zinc-500 text-center">
                                {cart.length} {cart.length === 1 ? "item" : "items"} in your bag
                            </div>

                            {/* Action buttons */}
                            <div className="px-5 pb-5 flex flex-col gap-2.5">
                                <Link
                                    to="/cart"
                                    onClick={dismissAddedItem}
                                    className="w-full py-3.5 bg-[#800020] hover:bg-[#66001a] text-[#ffffff] text-sm font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98] shadow-md"
                                >
                                    <ShoppingBag size={15} />
                                    Go to Cart
                                    <ArrowRight size={14} />
                                </Link>
                                <button
                                    onClick={dismissAddedItem}
                                    className="w-full py-3 border border-zinc-200 text-zinc-700 text-sm font-semibold rounded-xl hover:bg-zinc-50 transition-colors"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AddToCartModal;
