import React, { useState, useEffect, useMemo } from 'react';
import { Heart, ArrowRight, Bell, Clock, ShoppingBag, Star } from 'lucide-react';
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
            className="group relative cursor-pointer flex flex-col bg-white rounded-lg border border-[#E9E0D6] transition-all duration-300 hover:border-[#800020] hover:shadow-md w-full overflow-hidden"
        >
            {/* Product Image Area */}
            <div className="relative w-full aspect-square overflow-hidden bg-[#FAFAFA] flex items-center justify-center p-3">
                <OptimizedCloudinaryImage
                    src={displayedImage}
                    alt={product.name}
                    preset="product-card"
                    priority={idx < 4}
                    className="w-full h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                />

                {/* Badges on Top Left */}
                <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
                    {/* Primary Badge */}
                    {isPreOrder && !isOutOfStock ? (
                        <span className="bg-[#800020] text-white font-bold uppercase text-[9px] tracking-wider px-2 py-0.5 rounded-xs shadow-xs">
                            PRE-ORDER
                        </span>
                    ) : tagsToDisplay.length > 0 ? (
                        tagsToDisplay.slice(0, 1).map((tagItem, tIdx) => {
                            const isObj = typeof tagItem === "object" && tagItem !== null;
                            const text = isObj ? tagItem.label : tagItem;
                            return (
                                <span key={tIdx} className="bg-[#111111] text-white font-bold uppercase text-[9px] tracking-wider px-2 py-0.5 rounded-xs shadow-xs">
                                    {text}
                                </span>
                            );
                        })
                    ) : product.is_bestseller ? (
                        <span className="bg-[#800020] text-white font-bold uppercase text-[9px] tracking-wider px-2 py-0.5 rounded-xs shadow-xs">
                            BESTSELLER
                        </span>
                    ) : null}

                    {/* Discount badge */}
                    {savingsPercent > 0 && (
                        <span className="bg-[#800020] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xs">
                            -{savingsPercent}%
                        </span>
                    )}
                </div>

                {/* Wishlist Heart Icon Top Right */}
                <button
                    onClick={(e) => handleAction(e, 'wishlist')}
                    aria-label="Save to wishlist"
                    className="absolute top-2.5 right-2.5 z-20 w-7 h-7 rounded-full bg-white/95 border border-[#E9E0D6] text-zinc-500 hover:text-[#800020] hover:border-[#800020] flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-90"
                >
                    <Heart
                        size={13}
                        strokeWidth={2}
                        fill={isWishlisted ? "#800020" : "none"}
                        stroke={isWishlisted ? "#800020" : "currentColor"}
                    />
                </button>

                {/* Out of Stock Overlay */}
                {isOutOfStock && (
                    <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                        <span className="bg-[#30231F] text-white font-bold uppercase text-[10px] tracking-wider px-3 py-1 rounded-xs">
                            Out of Stock
                        </span>
                    </div>
                )}
            </div>

            {/* Info Area */}
            <div className="p-3 flex flex-col flex-grow bg-white border-t border-[#E9E0D6]/60">
                {/* Category */}
                <span className="text-[#75665D] text-[9.5px] uppercase tracking-wider font-medium truncate mb-0.5">
                    {product.category || 'EXTRAIT DE PARFUM'}
                </span>

                {/* Title (Clean 2-line title so cards stay perfectly aligned) */}
                <h3 className="text-[12px] sm:text-[12.5px] font-semibold text-[#30231F] uppercase tracking-wide line-clamp-2 min-h-[2.4em] leading-snug group-hover:text-[#800020] transition-colors mb-2">
                    {product.name}
                </h3>

                {/* Bottom Row: Price & Rating on Left, Cart Button on Right */}
                <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                    <div className="flex flex-col">
                        {/* Price */}
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[13px] sm:text-[14px] font-bold text-[#800020]">
                                ₹{Number(displayPrice).toLocaleString('en-IN')}
                            </span>
                            {savingsPercent > 0 && (
                                <span className="text-[10.5px] text-[#75665D] line-through font-light">
                                    ₹{Number(originalPrice).toLocaleString('en-IN')}
                                </span>
                            )}
                        </div>

                        {/* Star Rating */}
                        <div className="flex items-center gap-1 mt-1">
                            <div className="flex items-center text-[#B88D46]">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={10} fill="#B88D46" stroke="#B88D46" />
                                ))}
                            </div>
                            <span className="text-[10px] text-[#75665D] font-medium ml-0.5">
                                {product.rating || '4.8'}
                            </span>
                        </div>
                    </div>

                    {/* Square Maroon Add-to-Bag Button */}
                    <button
                        type="button"
                        onClick={(e) => handleAction(e, isOutOfStock ? 'notify' : (isPreOrder ? 'preorder' : 'cart'))}
                        aria-label={isInCart ? "Item in bag" : "Add to bag"}
                        className={`w-7 sm:w-8 h-7 sm:h-8 rounded flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
                            isInCart
                                ? 'bg-[#650018] text-white'
                                : 'bg-[#800020] hover:bg-[#650018] text-white'
                        }`}
                        title={isInCart ? "In Bag" : "Add to Bag"}
                    >
                        <ShoppingBag size={14} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
