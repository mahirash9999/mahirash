import React, { useState } from "react";
import { X, ShoppingBag, Heart, Truck, Sparkles, Bell, Clock } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import OptimizedCloudinaryImage from './OptimizedCloudinaryImage';
import { useStore } from './StoreProvider';

import { resolveProductVariant } from './ProductCard';

const QuickView = ({ product, onClose }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, addToWishlist, wishlist } = useStore();
  const navigate = useNavigate();

  const sizeOptions = product?.size_prices && product.size_prices.length > 0
    ? product.size_prices
    : [{ size: '50ml', price: product?.price, stock: product?.stock ?? 10 }];

  const initialVariant = resolveProductVariant(product) || sizeOptions[0] || null;
  const [selectedSize, setSelectedSize] = useState(initialVariant);

  const selectedStock = selectedSize
    ? (selectedSize.stock !== undefined ? Number(selectedSize.stock) : Number(product?.stock ?? 10))
    : Number(product?.stock ?? 10);

  const isPreOrder = Boolean(selectedSize?.is_preorder);
  const isOutOfStock = !isPreOrder && (selectedStock <= 0 || product?.stock_status === 'Out of Stock');
  const isWishlisted = wishlist.some(i => i.id === product?.id);

  const currentImage = selectedSize?.images?.[0] || selectedSize?.image || product?.image || product?.images?.[0] || "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800";

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => onClose?.(), 300);
  };

  const handleAction = async () => {
    if (!product) return;
    if (isOutOfStock) {
      alert("Thank you! We will notify you when this formulation is back in stock.");
      handleClose();
      return;
    }
    if (isPreOrder) {
      handleClose();
      navigate(`/product/${product.id}`);
      return;
    }
    for (let i = 0; i < quantity; i++) {
      await addToCart(product, selectedSize);
    }
    handleClose();
  };

  if (!isOpen || !product) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[999] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none mt-4 md:mt-10`}>
        <div
          className={`bg-white rounded-none shadow-2xl max-w-4xl w-full overflow-hidden pointer-events-auto transform transition-all duration-300 font-['Inter',sans-serif] ${isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
            }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 bg-zinc-50">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <Sparkles size={14} className="text-[#c9a962]" />
              Quick Fragrance Preview
            </h2>
            <button
              type="button"
              onClick={handleClose}
              className="p-1 hover:bg-zinc-200 transition-colors text-zinc-600 rounded-md"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-2 gap-8 p-6 md:p-8 max-h-[82vh] overflow-y-auto">
            {/* Image Section */}
            <div className="flex items-center justify-center">
              <div className="bg-zinc-100 rounded-none flex items-center justify-center w-full aspect-[3/4] relative overflow-hidden group border border-zinc-200">
                <OptimizedCloudinaryImage
                  src={currentImage}
                  alt={product.name}
                  preset="product-grid"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {isPreOrder ? (
                  <div className="absolute top-3 right-3 bg-[#b8860b] text-white px-3 py-1 text-[12px] font-extrabold uppercase tracking-wider shadow-sm">
                    PRE-ORDER
                  </div>
                ) : product.original_price && product.original_price > product.price ? (
                  <div className="absolute top-3 right-3 bg-[#c9a962] text-black px-3 py-1 text-[12px] font-bold uppercase tracking-wider">
                    SALE
                  </div>
                ) : null}
              </div>
            </div>

            {/* Details Section */}
            <div className="flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.25em] text-[#c9a962] font-semibold">
                  <span className="text-zinc-600 font-extrabold">{product.brand || 'MAHIRASH'}</span>
                  {product.category && <span>• {product.category}</span>}
                </div>

                {/* Title */}
                <h3 className="text-2xl font-light text-zinc-900 uppercase tracking-wide leading-tight">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-zinc-900">
                    ₹{(selectedSize?.price || product.price)?.toLocaleString('en-IN')}
                  </span>
                  {(selectedSize?.original_price || product.original_price) && (
                    <span className="text-sm text-zinc-400 line-through">
                      ₹{(selectedSize?.original_price || product.original_price)?.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-[14px] text-zinc-600 leading-relaxed line-clamp-3">
                    {product.description?.replace(/<[^>]*>?/gm, '')}
                  </p>
                )}

                {/* Size / Volume Option Selector */}
                {sizeOptions.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-zinc-100">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-zinc-800 font-bold block">
                      Select Volume
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((sp, idx) => {
                        const vStock = sp.stock !== undefined ? Number(sp.stock) : Number(product?.stock ?? 10);
                        const isVPreOrder = Boolean(sp.is_preorder);
                        const isVOut = !isVPreOrder && (vStock <= 0);
                        const isSelected = selectedSize?.size === sp.size;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSize(sp)}
                            className={`px-3 py-2 text-[14px] font-bold uppercase tracking-wider border transition-all cursor-pointer flex flex-col items-center ${isSelected
                              ? 'bg-black text-white border-black'
                              : isVPreOrder
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : isVOut
                                  ? 'bg-red-50 text-zinc-400 border-red-200'
                                  : 'bg-white text-zinc-800 border-zinc-300 hover:border-black'
                              }`}
                          >
                            <span className={isVOut && !isSelected ? 'line-through' : ''}>{sp.size}</span>
                            {isVPreOrder ? (
                              <span className="text-[12px] text-amber-700 font-bold mt-0.5">Pre-Order</span>
                            ) : isVOut ? (
                              <span className="text-[12px] text-red-500 font-semibold mt-0.5">Out of Stock</span>
                            ) : vStock <= 5 ? (
                              <span className="text-[12px] text-amber-600 font-semibold mt-0.5">Only {vStock} left</span>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-4 pt-2 border-t border-zinc-100">
                {/* Quantity Selector */}
                <div className="flex items-center gap-4">
                  <span className="text-[14px] font-bold text-zinc-700 uppercase tracking-wider">Quantity</span>
                  <div className="flex items-center border border-zinc-300 rounded-none overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={isOutOfStock}
                      className="px-3.5 py-1.5 text-zinc-800 hover:bg-zinc-100 transition-colors font-bold disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="px-5 py-1.5 font-mono text-sm font-semibold text-zinc-900 border-l border-r border-zinc-300">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(selectedStock, quantity + 1))}
                      disabled={isOutOfStock || quantity >= selectedStock}
                      className="px-3.5 py-1.5 text-zinc-800 hover:bg-zinc-100 transition-colors font-bold disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAction}
                    className={`flex-1 py-3.5 px-4 text-white text-[11px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 cursor-pointer ${isOutOfStock
                      ? 'bg-[#0D0D0D] hover:bg-[#b8860b]'
                      : isPreOrder
                        ? 'bg-[#b8860b] hover:bg-black'
                        : 'bg-black hover:bg-zinc-800'
                      }`}
                  >
                    {isOutOfStock ? (
                      <>
                        <Bell size={16} />
                        <span>NOTIFY ME</span>
                      </>
                    ) : isPreOrder ? (
                      <>
                        <Clock size={16} />
                        <span>PRE-ORDER NOW</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={16} />
                        <span>ADD TO BAG</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => navigate(`/product/${product.id}`)}
                    className="py-3.5 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default QuickView;
