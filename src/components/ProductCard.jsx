import React, { useState, useEffect, useMemo } from 'react';
import { Heart, ArrowRight, Bell, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from './StoreProvider';
import OptimizedCloudinaryImage from './OptimizedCloudinaryImage';

export const parseMlValue = (str) => {
    if (!str) return null;
    const match = String(str).toLowerCase().match(/(\d+(?:\.\d+)?)\s*(ml)?/);
    if (match) return parseFloat(match[1]);
    return null;
};

// Helper to determine if a variant is pre-order (strictly if marked from product form)
export const isVariantPreOrder = (v) => {
    if (!v) return false;
    return Boolean(v.is_preorder === true || v.is_preorder === 'true');
};

// Helper to determine if a variant is out of stock: if stock is 0 and NOT marked preorder
export const isVariantOutOfStock = (v, product = null) => {
    if (!v) return false;
    if (isVariantPreOrder(v)) return false;
    const vStock = v.stock !== undefined && v.stock !== null && v.stock !== '' ? Number(v.stock) : (product?.stock !== undefined ? Number(product.stock) : 10);
    if (vStock <= 0) return true;
    if (String(v.stock_status || '').toLowerCase() === 'out of stock') return true;
    if (product && product.stock_status === 'Out of Stock') return true;
    return false;
};

// Helper to determine if a variant is available (in stock and ready to ship)
export const isVariantAvailable = (v, product = null) => {
    if (!v) return false;
    return !isVariantPreOrder(v) && !isVariantOutOfStock(v, product);
};

// Select the appropriate variant for a product given preferredSize or filters and sortBy
export const resolveProductVariant = (product, preferredSize = null, sortBy = null) => {
    const variants = Array.isArray(product?.size_prices) ? product.size_prices : [];
    if (!variants || variants.length === 0) return null;

    // Helper matcher
    const matchSize = (v, target) => {
        if (!v || !v.size) return false;
        const vStr = String(v.size).toLowerCase().replace(/\s+/g, '');
        const tStr = String(target).toLowerCase().replace(/\s+/g, '');
        if (vStr === tStr) return true;

        const vMl = parseMlValue(v.size);
        const tMl = parseMlValue(target);
        if (vMl !== null && tMl !== null && vMl === tMl) return true;
        return false;
    };

    // Helper to find extreme (lowest or highest) priced variant
    const findExtremeVariant = (list, mode = 'low') => {
        if (!list || list.length === 0) return null;
        const validList = list.filter(v => v && v.price != null && !isNaN(Number(v.price)) && Number(v.price) > 0);
        const candidates = validList.length > 0 ? validList : list;
        return candidates.reduce((best, curr) => {
            if (!best) return curr;
            const bestP = Number(best.price) || 0;
            const currP = Number(curr.price) || 0;
            if (mode === 'low') {
                if (currP < bestP) return curr;
                if (currP === bestP) {
                    const currMl = parseMlValue(curr.size) || 9999;
                    const bestMl = parseMlValue(best.size) || 9999;
                    return currMl < bestMl ? curr : best;
                }
                return best;
            } else {
                if (currP > bestP) return curr;
                if (currP === bestP) {
                    const currMl = parseMlValue(curr.size) || 0;
                    const bestMl = parseMlValue(best.size) || 0;
                    return currMl > bestMl ? curr : best;
                }
                return best;
            }
        }, null);
    };

    // Helper to filter variants matching preferredSize (single or array)
    const getMatchingVariants = (pref) => {
        if (!pref) return [];
        if (Array.isArray(pref)) {
            return variants.filter(v => {
                return pref.some(p => {
                    if (p === "1-10ML") {
                        const ml = parseMlValue(v.size);
                        return ml !== null && ml >= 1 && ml <= 10;
                    } else if (p === "10-20ML") {
                        const ml = parseMlValue(v.size);
                        return ml !== null && ml > 10 && ml <= 20;
                    } else if (p === "20-50ML") {
                        const ml = parseMlValue(v.size);
                        return ml !== null && ml > 20 && ml <= 50;
                    } else if (p === "50-100ML") {
                        const ml = parseMlValue(v.size);
                        return ml !== null && ml > 50 && ml <= 100;
                    } else if (p === ">100ML") {
                        const ml = parseMlValue(v.size);
                        return ml !== null && ml > 100;
                    } else {
                        return matchSize(v, p);
                    }
                });
            });
        }
        if (pref === 'miniature') {
            return variants.filter(v => {
                const ml = parseMlValue(v.size);
                return ml !== null && ml <= 10;
            });
        }
        if (pref === "1-10ML") {
            return variants.filter(v => {
                const ml = parseMlValue(v.size);
                return ml !== null && ml >= 1 && ml <= 10;
            });
        }
        if (pref === "10-20ML") {
            return variants.filter(v => {
                const ml = parseMlValue(v.size);
                return ml !== null && ml > 10 && ml <= 20;
            });
        }
        if (pref === "20-50ML") {
            return variants.filter(v => {
                const ml = parseMlValue(v.size);
                return ml !== null && ml > 20 && ml <= 50;
            });
        }
        if (pref === "50-100ML") {
            return variants.filter(v => {
                const ml = parseMlValue(v.size);
                return ml !== null && ml > 50 && ml <= 100;
            });
        }
        if (pref === ">100ML") {
            return variants.filter(v => {
                const ml = parseMlValue(v.size);
                return ml !== null && ml > 100;
            });
        }
        return variants.filter(v => matchSize(v, pref));
    };

    // Helper to pick the best alternative variant among candidates
    const pickBestAlternative = (candidateList) => {
        if (!candidateList || candidateList.length === 0) return null;
        const sorted = [...candidateList].sort((a, b) => {
            const aMl = parseMlValue(a.size);
            const bMl = parseMlValue(b.size);
            if (aMl === 100 && bMl !== 100) return -1;
            if (bMl === 100 && aMl !== 100) return 1;
            const diffA = aMl !== null ? Math.abs(aMl - 50) : 999;
            const diffB = bMl !== null ? Math.abs(bMl - 50) : 999;
            return diffA - diffB;
        });
        return sorted[0];
    };

    // 1. If preferredSize is provided (e.g. from size filter)
    if (preferredSize && (!Array.isArray(preferredSize) || preferredSize.length > 0)) {
        const matches = getMatchingVariants(preferredSize);
        if (matches.length > 0) {
            const availableMatches = matches.filter(v => isVariantAvailable(v, product));
            const candidatePool = availableMatches.length > 0 ? availableMatches : matches;

            if (sortBy === 'price-low') {
                return findExtremeVariant(candidatePool, 'low');
            } else if (sortBy === 'price-high') {
                return findExtremeVariant(candidatePool, 'high');
            }
            return candidatePool[0];
        }
    }

    // 2. If NO preferredSize is active, check sortBy
    if (sortBy === 'price-low') {
        const availableVariants = variants.filter(v => isVariantAvailable(v, product));
        if (availableVariants.length > 0) {
            return findExtremeVariant(availableVariants, 'low');
        }
        const preorderVariants = variants.filter(v => isVariantPreOrder(v));
        if (preorderVariants.length > 0) {
            return findExtremeVariant(preorderVariants, 'low');
        }
        return findExtremeVariant(variants, 'low');
    } else if (sortBy === 'price-high') {
        const availableVariants = variants.filter(v => isVariantAvailable(v, product));
        if (availableVariants.length > 0) {
            return findExtremeVariant(availableVariants, 'high');
        }
        const preorderVariants = variants.filter(v => isVariantPreOrder(v));
        if (preorderVariants.length > 0) {
            return findExtremeVariant(preorderVariants, 'high');
        }
        return findExtremeVariant(variants, 'high');
    }

    // 3. Default: Look for 50ml first
    const fiftyMlVariant = variants.find(v => {
        const ml = parseMlValue(v.size);
        return ml === 50 || String(v.size).toLowerCase().includes('50ml');
    });

    // If 50ml exists and is in stock (NOT out of stock, NOT preorder), display it!
    if (fiftyMlVariant && isVariantAvailable(fiftyMlVariant, product)) {
        return fiftyMlVariant;
    }

    // If 50ml or default size / base size is out of stock or preorder:
    // Show another variant that IS available in stock
    const otherAvailableVariants = variants.filter(v => {
        if (fiftyMlVariant && v.size === fiftyMlVariant.size) return false;
        return isVariantAvailable(v, product);
    });

    if (otherAvailableVariants.length > 0) {
        return pickBestAlternative(otherAvailableVariants);
    }

    // If no variants are in stock, check if any variant is PRE-ORDER
    const otherPreorderVariants = variants.filter(v => {
        if (fiftyMlVariant && v.size === fiftyMlVariant.size) return false;
        return isVariantPreOrder(v);
    });

    if (otherPreorderVariants.length > 0) {
        if (fiftyMlVariant && isVariantPreOrder(fiftyMlVariant)) {
            return fiftyMlVariant;
        }
        return pickBestAlternative(otherPreorderVariants);
    }

    // If 50ml exists (even though out of stock), return it
    if (fiftyMlVariant) return fiftyMlVariant;

    // 4. Fallback: Base variant (first variant in list)
    return variants[0];
};

const ProductCard = ({ product, triggerToast, idx, preferredSize, sortBy }) => {
    const navigate = useNavigate();
    const { addToCart, addToWishlist, removeFromWishlist, wishlist, cart } = useStore();
    const isWishlisted = wishlist.some(item => item.id === product.id);
    const [isHovered, setIsHovered] = useState(false);

    const variants = Array.isArray(product?.size_prices) ? product.size_prices : [];

    // Compute active variant based on preferredSize and sortBy, defaulting to 50ml or base variant
    const resolvedDefaultVariant = useMemo(() => {
        return resolveProductVariant(product, preferredSize, sortBy);
    }, [product, preferredSize, sortBy]);

    // Local user selected variant (if user clicks on variant buttons directly on card)
    const [selectedVariant, setSelectedVariant] = useState(null);

    // Sync selectedVariant when resolvedDefaultVariant changes (e.g. filter or sort changes)
    useEffect(() => {
        setSelectedVariant(resolvedDefaultVariant);
    }, [resolvedDefaultVariant]);

    const activeVariant = selectedVariant || resolvedDefaultVariant;

    const displayPrice = activeVariant ? (activeVariant.price ?? product.price) : product.price;
    const originalPrice = activeVariant?.original_price || product.original_price || Math.round((displayPrice || 999) * 1.25);
    const savingsPercent = displayPrice && originalPrice > displayPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

    const cartItemId = activeVariant ? `${product.id}-${activeVariant.size}` : product.id;
    const isInCart = cart.some(item => (item.cartId || item.id) === cartItemId);
    const isPreOrder = isVariantPreOrder(activeVariant);
    const isOutOfStock = isVariantOutOfStock(activeVariant, product);

    const rawTags = Array.isArray(product.tags) && product.tags.length > 0 ? product.tags : (product.tag ? [product.tag] : []);
    const tagsToDisplay = Array.from(new Map(rawTags.map(t => [typeof t === "object" ? t.label : t, t])).values());

    const handleAction = async (e, type) => {
        e.preventDefault();
        e.stopPropagation();
        if (type === 'notify') {
            triggerToast('We will notify you when back in stock!');
            return;
        }
        if (type === 'preorder') {
            navigate(`/product/${product.id}`);
            return;
        }
        if (type === 'cart') {
            if (isOutOfStock) {
                triggerToast('This formulation is currently out of stock.');
                return;
            }
            if (isPreOrder) {
                navigate(`/product/${product.id}`);
                return;
            }
            if (isInCart) return;
            const res = await addToCart(product, activeVariant);
            if (res && res.success === false) {
                triggerToast(res.message || 'Cannot add to bag');
                return;
            }
            triggerToast('Added to bag');
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
        : (activeVariant?.image || product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800');

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
                        <span className="bg-white text-zinc-900 border border-[#E5D5B8] font-bold uppercase text-[12px] tracking-[0.2em] px-3.5 py-1.5 rounded-full shadow-sm">
                            Out of Stock
                        </span>
                    </div>
                )}

                {/* Pre-Order Badge */}
                {isPreOrder && !isOutOfStock && (
                    <div className="absolute top-3.5 left-3.5 z-10">
                        <span className="bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#B8860B] text-white font-black uppercase text-[12px] tracking-[0.2em] px-3 py-1 rounded-full shadow-md">
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
                                <span key={tIdx} style={{ backgroundColor: bg, color: color }} className="font-bold w-max uppercase text-[12px] tracking-[0.18em] px-2.5 py-1 shadow-sm rounded-sm">
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

                {/* Hover Slide-up Actions */}
                <div className="absolute bottom-0 inset-x-0 z-20 overflow-hidden h-11 pointer-events-auto">
                    {isOutOfStock ? (
                        <button
                            type="button"
                            onClick={(e) => handleAction(e, 'notify')}
                            className={`w-full h-full text-[12px] tracking-[0.25em] font-bold uppercase transition-all duration-300 flex items-center justify-center gap-1.5 bg-[#0D0D0D] text-white hover:bg-[#B8860B] shadow-lg ${isHovered ? 'translate-y-0' : 'translate-y-full'}`}
                        >
                            <Bell size={13} />
                            NOTIFY ME
                        </button>
                    ) : isPreOrder ? (
                        <button
                            type="button"
                            onClick={(e) => handleAction(e, 'preorder')}
                            className={`w-full h-full text-[12px] tracking-[0.25em] font-bold uppercase transition-all duration-300 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#B8860B] text-white hover:brightness-110 shadow-lg ${isHovered ? 'translate-y-0' : 'translate-y-full'}`}
                        >
                            <Clock size={13} />
                            PRE-ORDER NOW
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={(e) => handleAction(e, 'cart')}
                            className={`w-full h-full text-[12px] tracking-[0.25em] font-bold uppercase transition-all duration-300 flex items-center justify-center bg-[#0D0D0D] text-white hover:bg-[#B8860B] shadow-lg ${isHovered ? 'translate-y-0' : 'translate-y-full'}`}
                        >
                            {isInCart ? 'IN BAG' : 'ADD TO CART'}
                        </button>
                    )}
                </div>
            </div>

            {/* Info Area */}
            <div className="pt-3 sm:pt-4 pb-3.5 sm:pb-5 px-3 sm:px-4 flex flex-col text-left bg-white">
                <div className="flex flex-col gap-0.5 mb-1.5">
                    <span className="text-[#B8860B] text-[12px] md:text-[13px] font-bold uppercase tracking-[0.2em]">{product.brand || 'MAHIRASH'}</span>
                    <span className="text-zinc-500 text-[12px] md:text-[13px] font-semibold uppercase tracking-[0.25em]">{product.category || 'EXTRAIT DE PARFUM'}</span>
                </div>
                <h3 className="text-[13px] sm:text-[14px] md:text-[15px] font-semibold text-[#0D0D0D] uppercase tracking-wider line-clamp-1 leading-snug mb-2 group-hover:text-[#B8860B] transition-colors">
                    {product.name}
                </h3>

                {/* Available Variant Options Pills */}
                {variants.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        {variants.map((v, vIdx) => {
                            const isCurrent = activeVariant && activeVariant.size === v.size;
                            const vOut = isVariantOutOfStock(v, product);
                            const vPre = isVariantPreOrder(v);
                            return (
                                <button
                                    key={vIdx}
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setSelectedVariant(v);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[12px] md:text-[13px] font-semibold tracking-wider uppercase transition-all cursor-pointer ${isCurrent
                                        ? 'bg-black text-white border border-black shadow-xs'
                                        : vOut
                                            ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 line-through opacity-75 hover:border-zinc-400 hover:text-zinc-600'
                                            : vPre
                                                ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:border-amber-400'
                                                : 'bg-zinc-50 text-zinc-600 border border-zinc-200 hover:border-black hover:text-black'
                                        }`}
                                    title={`${v.size} - ₹${Number(v.price).toLocaleString('en-IN')}${vOut ? ' (Out of Stock)' : vPre ? ' (Pre-Order)' : ''}`}
                                >
                                    {v.size}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Prices */}
                <div className="flex items-baseline gap-2.5">
                    <span className="text-[13px] md:text-[14px] text-zinc-400 line-through font-light">
                        ₹{Number(originalPrice).toLocaleString('en-IN')}
                    </span>
                    <span className={`text-[14px] md:text-base font-bold tracking-wide ${savingsPercent > 0 ? 'text-[#e53e3e]' : 'text-[#B8860B]'}`}>
                        ₹{Number(displayPrice).toLocaleString('en-IN')}
                    </span>
                    {savingsPercent > 0 && (
                        <span className="text-[12px] font-bold text-[#e53e3e]">-{savingsPercent}%</span>
                    )}
                    {activeVariant?.size && (
                        <span className="text-[12px] font-medium text-zinc-400 ml-auto">
                            ({activeVariant.size})
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
