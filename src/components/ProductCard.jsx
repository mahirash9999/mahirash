import React, { useState } from 'react';
import { Heart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from './StoreProvider';
import OptimizedCloudinaryImage from './OptimizedCloudinaryImage';

const ProductCard = ({ product, triggerToast, idx }) => {
    const navigate = useNavigate();
    const { addToCart, addToWishlist, removeFromWishlist, wishlist, cart } = useStore();
    const isWishlisted = wishlist.some(item => item.id === product.id);
    const [isHovered, setIsHovered] = useState(false);

    // Default to 50ml variant if available, otherwise base variant
    const defaultSize = product.size_prices && product.size_prices.length > 0
        ? (product.size_prices.find(s => s.size?.toLowerCase()?.trim() === '50ml') || product.size_prices[0])
        : null;

    const displayPrice = defaultSize ? defaultSize.price : product.price;
    const originalPrice = defaultSize?.original_price || product.original_price || Math.round((displayPrice || 999) * 1.25);
    const savingsPercent = displayPrice && originalPrice > displayPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

    const cartItemId = defaultSize ? `${product.id}-${defaultSize.size}` : product.id;
    const isInCart = cart.some(item => (item.cartId || item.id) === cartItemId);
    const isPreOrder = Boolean(defaultSize?.is_preorder);
    const isOutOfStock = !isPreOrder && ((defaultSize ? defaultSize.stock === 0 : product.stock === 0) || product.stock_status === 'Out of Stock');

    const rawTags = Array.isArray(product.tags) && product.tags.length > 0 ? product.tags : (product.tag ? [product.tag] : []);
    const tagsToDisplay = Array.from(new Map(rawTags.map(t => [typeof t === "object" ? t.label : t, t])).values());

    const handleAction = async (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'cart') {
            if (isInCart) return;
            await addToCart(product, defaultSize);
            triggerToast(isPreOrder ? 'Pre-order added to bag' : 'Added to bag');
        } else {
            if (isWishlisted) {
                await removeFromWishlist(product.id);
                triggerToast('Removed from wishlist');
            } else {
                await addToWishlist(product);
                triggerToast('Saved to wishlist');
            }
        }
    };

    const displayedImage = isHovered && product.images && product.images.length > 1
        ? product.images[1]
        : (defaultSize?.image || product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800');

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => navigate(`/product/${product.id}`)}
            className="group relative cursor-pointer flex flex-col bg-white rounded-2xl border border-[#E5D5B8] transition-all duration-500 hover:border-[#B8860B] shadow-[0_8px_25px_-5px_rgba(184,134,11,0.08)] hover:shadow-[0_15px_35px_-5px_rgba(184,134,11,0.18)] hover:-translate-y-1.5 w-full overflow-hidden"
        >
            {/* Product Image Area */}
            <div className="relative w-full aspect-[3/4] overflow-hidden bg-[#FAF8F5] flex items-center justify-center">
                <OptimizedCloudinaryImage
                    src={displayedImage}
                    alt={product.name}
                    preset="product-card"
                    priority={idx < 4}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                />

                {/* Subtle Gold Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-white text-zinc-900 border border-[#E5D5B8] font-extrabold uppercase text-[9px] tracking-[0.2em] px-3.5 py-1.5 rounded-full shadow-sm">
                            Out of Stock
                        </span>
                    </div>
                )}

                {/* Pre-Order Badge */}
                {isPreOrder && !isOutOfStock && (
                    <div className="absolute top-3.5 left-3.5 z-10">
                        <span className="bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#B8860B] text-white font-black uppercase text-[9px] tracking-[0.2em] px-3 py-1 rounded-full shadow-md">
                            PRE-ORDER
                        </span>
                    </div>
                )}

                {/* Optional Add-on Tags from Tags & Labels */}
                {!isPreOrder && !isOutOfStock && tagsToDisplay.length > 0 && (
                    <div className="absolute left-3.5 top-3.5 z-10 flex flex-col gap-1.5">
                        {tagsToDisplay.map((tagItem, tIdx) => {
                            const isObj = typeof tagItem === "object" && tagItem !== null;
                            const text = isObj ? tagItem.label : tagItem;
                            const bg = isObj ? tagItem.bg || "#000" : "#000";
                            const color = isObj ? tagItem.text || "#fff" : "#fff";
                            return (
                                <span key={tIdx} style={{ backgroundColor: bg, color: color }} className="font-extrabold w-max uppercase text-[8px] tracking-[0.18em] px-2.5 py-1 shadow-sm rounded-sm">
                                    {text}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Wishlist Heart Icon */}
                <button
                    onClick={(e) => handleAction(e, 'wishlist')}
                    aria-label="Save to wishlist"
                    className="absolute top-3.5 right-3.5 z-30 p-2.5 rounded-full bg-white/90 backdrop-blur-md border border-[#E5D5B8] text-zinc-700 hover:text-black hover:border-[#B8860B] hover:scale-110 transition-all duration-300 pointer-events-auto cursor-pointer shadow-md"
                >
                    <Heart
                        size={15}
                        strokeWidth={2}
                        fill={isWishlisted ? "#ef4444" : "none"}
                        stroke={isWishlisted ? "#ef4444" : "currentColor"}
                    />
                </button>

                {/* Hover Slide-up ADD TO CART overlay */}
                {!isOutOfStock && (
                    <div className="absolute bottom-0 inset-x-0 z-20 overflow-hidden h-11 pointer-events-auto">
                        <button
                            onClick={(e) => handleAction(e, 'cart')}
                            className={`w-full h-full text-[10px] tracking-[0.25em] font-extrabold uppercase transition-all duration-300 flex items-center justify-center ${isPreOrder
                                ? 'bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#B8860B] text-white hover:brightness-110'
                                : 'bg-[#0D0D0D] text-white hover:bg-[#B8860B] shadow-lg'
                                } ${isHovered ? 'translate-y-0' : 'translate-y-full'}`}
                        >
                            {isInCart ? 'IN BAG' : isPreOrder ? 'PRE-ORDER NOW' : 'ADD TO CART'}
                        </button>
                    </div>
                )}
            </div>

            {/* Info Area */}
            <div className="pt-4 pb-5 px-4 flex flex-col text-left bg-white">
                <div className="flex flex-col gap-0.5 mb-1.5">
                    <span className="text-[#B8860B] text-[9px] font-extrabold uppercase tracking-[0.2em]">{product.brand || 'MAHIRASH'}</span>
                    <span className="text-zinc-500 text-[8px] font-semibold uppercase tracking-[0.25em]">{product.category || 'EXTRAIT DE PARFUM'}</span>
                </div>
                <h3 className="text-[14px] md:text-sm font-semibold text-[#0D0D0D] uppercase tracking-wider line-clamp-1 leading-snug mb-2 group-hover:text-[#B8860B] transition-colors">
                    {product.name}
                </h3>

                {/* Prices */}
                <div className="flex items-baseline gap-2.5">
                    <span className="text-[13px] text-zinc-400 line-through font-light">
                        ₹{Number(originalPrice).toLocaleString('en-IN')}
                    </span>
                    <span className={`text-sm font-bold tracking-wide ${savingsPercent > 0 ? 'text-[#e53e3e]' : 'text-[#B8860B]'}`}>
                        ₹{Number(displayPrice).toLocaleString('en-IN')}
                    </span>
                    {savingsPercent > 0 && (
                        <span className="text-[11px] font-bold text-[#e53e3e]">-{savingsPercent}%</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
