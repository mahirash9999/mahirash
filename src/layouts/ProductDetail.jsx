import React, { useEffect, useState, useRef } from 'react';
import MiniLoader from '../components/MiniLoader';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../components/Firebase';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { useAuth } from '../components/useAuth';
import { Heart, ShoppingBag, Minus, Plus, ChevronRight, ChevronLeft, Star, Truck, Ruler, Sparkles, Share2, Tag, Copy, X, ThumbsUp, Check, ShieldCheck, RefreshCw, ZoomIn, Clock, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from "../components/StoreProvider";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Mousewheel, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import SEOHead from '../components/SEOHead';
import OptimizedCloudinaryImage from '../components/OptimizedCloudinaryImage';
import { resolveProductVariant } from '../components/ProductCard';
import { cleanPincode, isValidPincode } from '../utils/validation';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [isColorChanging, setIsColorChanging] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState('description');
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [reviewTab, setReviewTab] = useState('style');
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState(null);
  const swiperRef = useRef(null);

  const { addToCart, addToWishlist, removeFromWishlist, wishlist, cart, siteSettings } = useStore();
  const isWishlisted = wishlist.some(item => item.id === id);
  const currentCartId = selectedSize ? `${id}-${selectedSize.size}` : id;
  const isInCart = cart.some(item => (item.cartId || item.id) === currentCartId);
  const isOutOfStock = product?.stock === 0 || product?.stock_status === 'Out of Stock';



  useEffect(() => {
    if (product) {
      if (product.stock === 0 || product.stock_status === 'Out of Stock') {
        setQuantity(0);
      } else {
        setQuantity(1);
      }
    }
  }, [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docSnap = await getDoc(doc(db, "products", id));
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          if (data.is_active === false) {
            setProduct(null);
          } else {
            setProduct(data);
            if (data.size_prices && data.size_prices.length > 0) {
              const defaultVariant = resolveProductVariant(data) || data.size_prices[0];
              setSelectedSize(defaultVariant);
              if (defaultVariant?.image) {
                // If main image list has variant image, switch to it
                const imgIdx = (data.images || []).findIndex(img => img === defaultVariant.image);
                if (imgIdx !== -1) setSelectedImage(imgIdx);
              }
            }
            if (data.colors) {
              const cols = typeof data.colors === 'string' ? data.colors.split(',').map(c => c.trim()) : data.colors;
              if (cols.length > 0) setSelectedColor(cols[0]);
            }
            const q = query(collection(db, "products"), limit(5));
            const snap = await getDocs(q);
            setRelatedProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.id !== id && p.is_active !== false).slice(0, 4));
          }
        }
      } catch (error) { console.error("Error fetching product:", error); }
      finally { setLoading(false); }
    };
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  useEffect(() => {
    setSelectedImage(0);
    if (swiperRef.current) swiperRef.current.slideTo(0);
  }, [selectedSize]);

  const triggerToast = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const addToCollection = async (type) => {
    if (!product) return;
    if (type === 'notify') {
      triggerToast("We will notify you when this formulation is back in stock!");
      return;
    }
    if (type === 'cart') {
      const isPreOrder = Boolean(selectedSize?.is_preorder === true || selectedSize?.is_preorder === 'true');
      if (isPreOrder) {
        const productUrl = `${window.location.origin}/product/${product.id}`;
        const priceVal = selectedSize?.price || product.price || 0;
        const msg = `Hello Mahirash! I would like to pre-order:\n\n*Product:* ${product.name || ""}\n*Brand:* ${product.brand || "MAHIRASH"}\n*Category:* ${product.category || ""}\n*Size / Volume:* ${selectedSize?.size || ""}\n*Price:* ₹${Number(priceVal).toLocaleString('en-IN')}\n*Product Link:* ${productUrl}\n\nPlease confirm availability and share payment & delivery details. Thank you!`;
        const num = siteSettings?.whatsapp_number?.replace(/\D/g, '') || "9584826112";
        window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank");
        return;
      }

      const currentVariantStock = selectedSize
        ? (selectedSize.stock !== undefined ? Number(selectedSize.stock) : Number(product?.stock ?? 10))
        : Number(product?.stock ?? 10);
      const isCurrentVariantOut = !isPreOrder && (currentVariantStock <= 0 || product?.stock_status === 'Out of Stock');
      if (isCurrentVariantOut) {
        triggerToast("This formulation is out of stock. Click 'Notify Me' to get alerted!");
        return;
      }

      const cartItemId = selectedSize ? `${product.id}-${selectedSize.size}` : product.id;
      if (cart.some(item => item.cartId === cartItemId)) { navigate('/cart'); return; }
      for (let i = 0; i < quantity; i++) {
        const res = await addToCart(product, selectedSize);
        if (res && res.success === false) {
          triggerToast(res.message || "Cannot add item to bag");
          return;
        }
      }
      triggerToast(`${quantity} ${quantity > 1 ? 'items' : 'item'} added to your bag!`);
    } else {
      if (isWishlisted) { await removeFromWishlist(product.id); triggerToast("Removed from wishlist!"); }
      else { await addToWishlist(product); triggerToast("Saved to wishlist!"); }
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        url: window.location.href,
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(window.location.href);
      triggerToast("Link copied to clipboard!");
    }
  };

  const [pincodeLoading, setPincodeLoading] = useState(false);

  const handlePincodeCheck = async (e) => {
    if (e) e.preventDefault();
    const cleanPin = cleanPincode(pincode);
    if (!isValidPincode(cleanPin)) {
      setPincodeStatus({ success: false, msg: 'Please enter a valid 6-digit Indian PIN code.' });
      return;
    }
    setPincodeLoading(true);
    setPincodeStatus({ loading: true, msg: 'Checking delivery with Delhivery Express...' });
    try {
      const res = await fetch(`/api/delhivery/serviceability?pincode=${cleanPin}`);
      const data = await res.json();
      if (data.serviceable) {
        setPincodeStatus({
          success: true,
          courier: "Delhivery Express",
          deliveryDate: data.estimatedDeliveryDate,
          tat: data.tat,
          cod: data.cod,
          prepaid: data.prepaid,
          city: data.city,
          msg: `Express Delivery by ${data.estimatedDeliveryDate} via Delhivery Express. ${data.cod ? 'Cash on Delivery (COD) Available.' : 'Prepaid Only.'}`
        });
      } else {
        setPincodeStatus({
          success: false,
          msg: data.message || `Delivery is currently unavailable to PIN code ${cleanPin}.`
        });
      }
    } catch (_) {
      setPincodeStatus({
        success: true,
        courier: "Delhivery Express",
        deliveryDate: "In 2–4 Business Days",
        cod: true,
        msg: `Delivery available to ${cleanPin}. Estimated in 2–4 business days via Delhivery Express.`
      });
    } finally {
      setPincodeLoading(false);
    }
  };

  const variantImages = (selectedSize?.images && selectedSize.images.length > 0)
    ? selectedSize.images
    : (selectedSize?.image ? [selectedSize.image] : null);

  const rawImages = variantImages || (product?.images && product.images.length > 0
    ? [...product.images]
    : [product?.image || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800&auto=format&fit=crop']);

  // Guarantee at least 3 slides for 3rd image Style Spotlight showcase
  while (rawImages.length < 3) {
    rawImages.push(rawImages[0]);
  }
  const images = rawImages;

  // Key product attributes for 3rd slide "Fragrance Spotlight"
  const spotlightDetails = [
    { label: 'Volume', value: selectedSize?.size || product?.sizes || '100ml Eau de Parfum' },
    { label: 'Concentration', value: product?.material || 'Extrait de Parfum (30% Pure Oils)' },
    { label: 'Top Notes', value: product?.top_notes || 'Cambodian Oud, Saffron, Bergamot' },
    { label: 'Heart Notes', value: product?.heart_notes || 'Bulgarian Rose, Smoked Cedar, Jasmine' },
    { label: 'Base Notes', value: product?.base_notes || 'Royal Oud, Golden Amber, White Musk' },
    { label: 'Longevity', value: product?.longevity || '12-14 Hours Long-Lasting' },
    { label: 'Projection', value: product?.sillage || 'Intense Projection' },
  ];

  if (loading) {
    return <MiniLoader message="Loading Product Details" />;
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center text-center p-6">
        <h3 className="text-sm font-light tracking-widest uppercase text-zinc-900 mb-4">Product Not Found</h3>
        <Link to="/shop" className="px-8 py-3 bg-black text-white font-semibold text-[12px] uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-sm">
          Return To Collection
        </Link>
      </div>
    );
  }

  const discountPercent = selectedSize?.original_price
    ? Math.round(((selectedSize.original_price - selectedSize.price) / selectedSize.original_price) * 100)
    : product.original_price
      ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-zinc-900 pt-[155px] sm:pt-[140px] pb-36 sm:pb-32 selection:bg-black selection:text-white">
      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            className="fixed bottom-24 md:bottom-10 left-1/2 z-50 bg-black text-white px-6 py-3.5 shadow-2xl flex items-center gap-3 min-w-[280px]"
          >
            <ShoppingBag size={14} className="shrink-0 text-[#c9a962]" />
            <p className="text-[12px] uppercase tracking-wider flex-1">{feedbackMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fragrance Volume Guide Modal */}
      <AnimatePresence>
        {isSizeChartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsSizeChartOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white max-w-lg w-full p-6 shadow-2xl relative border border-zinc-200"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 pb-4 mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900">FRAGRANCE & VOLUME GUIDE</h3>
                <button
                  type="button"
                  onClick={() => setIsSizeChartOpen(false)}
                  className="p-1 text-zinc-500 hover:text-black transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="w-full text-[13px] text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-100 border-b border-zinc-200 text-zinc-900 font-bold uppercase tracking-wider text-[12px]">
                      <th className="p-2.5">BOTTLE VOLUME</th>
                      <th className="p-2.5">RECOMMENDED USE</th>
                      <th className="p-2.5">APPROX SPRAYS</th>
                      <th className="p-2.5">DURATION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-zinc-700">
                    <tr><td className="p-2.5 font-bold">50ml</td><td className="p-2.5">Everyday Signature</td><td className="p-2.5">~600 Sprays</td><td className="p-2.5">2-3 Months</td></tr>
                    <tr><td className="p-2.5 font-bold">100ml</td><td className="p-2.5">Main Collector Bottling</td><td className="p-2.5">~1,200 Sprays</td><td className="p-2.5">5-6 Months</td></tr>
                    <tr><td className="p-2.5 font-bold">200ml</td><td className="p-2.5">Grand Royal Vault</td><td className="p-2.5">~2,400 Sprays</td><td className="p-2.5">10-12 Months</td></tr>
                    <tr><td className="p-2.5 font-bold">Sample Set</td><td className="p-2.5">Discovery Experience</td><td className="p-2.5">~150 Sprays</td><td className="p-2.5">2-3 Weeks</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="bg-[#faf5ed] p-3 border border-[#e8ded0] text-[12px] text-zinc-700 font-medium">
                <p>💡 <strong>Application Tip:</strong> Apply Extrait de Parfum directly to pulse points (wrists, base of neck, inner elbows) for 14+ hours of lasting projection.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {product && (
        <SEOHead
          title={`${product.name} | ${product.brand || 'Mahirash'} Extrait de Parfum`}
          description={product.description?.replace(/<[^>]*>?/gm, '').slice(0, 160) || `Experience ${product.name} handcrafted by ${product.brand || 'Mahirash'}. Rare luxury extrait de parfum with intense projection and longevity.`}
          image={images[0] || product.image}
          imageAlt={`${product.name} - Luxury Extrait de Parfum by ${product.brand || 'Mahirash'}`}
          url={`https://mahirash.com/product/${id}`}
          canonical={`https://mahirash.com/product/${id}`}
          author={product.brand || "Mahirash Parfumerie"}
          type="product"
          product={product}
        />
      )}

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* ── LEFT GALLERY SECTION ── */}
          <div className="lg:col-span-7 lg:sticky lg:top-28 self-start flex gap-4 w-full">

            {/* Desktop Vertical Thumbnails Column */}
            <div className="hidden md:flex flex-col gap-2.5 w-16 shrink-0">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedImage(idx);
                    swiperRef.current?.slideTo(idx);
                  }}
                  className={`aspect-[3/4] w-full overflow-hidden transition-all duration-300 bg-zinc-100 border cursor-pointer ${selectedImage === idx ? 'border-black ring-1 ring-black opacity-100' : 'border-zinc-200 opacity-60 hover:opacity-100'
                    }`}
                >
                  <OptimizedCloudinaryImage src={img} alt={`Thumbnail ${idx + 1}`} preset="avatar" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            {/* Main Swiper Hero Image View */}
            <div className="relative flex-1 w-full aspect-[3/4] sm:aspect-[3/4] min-h-[62vh] sm:min-h-[72vh] bg-zinc-100 overflow-hidden border border-zinc-200 shadow-sm group">

              {/* Color Switch Shimmer & Loader Overlay */}
              <AnimatePresence>
                {isColorChanging && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 z-40 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center pointer-events-none"
                  >
                    <div className="flex flex-col items-center gap-2.5 bg-black/95 text-white px-5 py-3 shadow-2xl">
                      <div className="w-5 h-5 border-2 border-[#c9a962] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[12px] uppercase font-bold tracking-[0.2em] text-white">
                        SELECTING {selectedColor}...
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Discount Tag */}
              {discountPercent > 0 && (
                <div className="absolute top-4 left-4 z-30">
                  <span className="bg-[#d92323] text-white px-3 py-1.5 text-[12px] sm:text-[12px] font-black uppercase tracking-wider shadow-md">
                    SAVE {discountPercent}%
                  </span>
                </div>
              )}

              {/* Top-Right Wishlist & Share Action Icons */}
              <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                <button
                  onClick={() => addToCollection('wishlist')}
                  className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-zinc-800 hover:text-black hover:scale-110 shadow-sm transition-all duration-300 cursor-pointer"
                  aria-label="Wishlist"
                >
                  <Heart
                    size={17}
                    strokeWidth={1.8}
                    fill={isWishlisted ? '#d92323' : 'none'}
                    stroke={isWishlisted ? '#d92323' : 'currentColor'}
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2.5 bg-white/90 backdrop-blur-sm rounded-full text-zinc-800 hover:text-black hover:scale-110 shadow-sm transition-all duration-300 cursor-pointer"
                  aria-label="Share"
                >
                  <Share2 size={16} strokeWidth={1.8} />
                </button>
              </div>

              {/* Touchpad / Touch Swiper Slider */}
              <Swiper
                onSwiper={(swiper) => { swiperRef.current = swiper; }}
                onSlideChange={(swiper) => setSelectedImage(swiper.activeIndex)}
                slidesPerView={1}
                pagination={{ clickable: true }}
                mousewheel={{ forceToAxis: true }}
                modules={[Pagination, Mousewheel, Navigation]}
                className="w-full h-full"
              >
                {images.map((img, idx) => (
                  <SwiperSlide key={idx} className="w-full h-full relative cursor-zoom-in" onClick={() => setIsZoomOpen(true)}>
                    <OptimizedCloudinaryImage
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      preset="product-details"
                      priority={idx === 0}
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute bottom-4 right-4 z-20 bg-black/60 text-white p-2 rounded-full backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn size={18} />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>

              {/* 3rd Image (Index 2) Style Spotlight Overlay */}
              <AnimatePresence>
                {selectedImage === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/50 to-transparent p-5 sm:p-7 pt-14 text-white pointer-events-none"
                  >
                    <motion.h3
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: 0.1 }}
                      className="text-base sm:text-lg text-white mb-2 tracking-wide font-medium"
                    >
                      Style Spotlight
                    </motion.h3>

                    <div className="space-y-1 sm:space-y-1.5 text-[14px] sm:text-sm font-medium tracking-wide">
                      {spotlightDetails.map((detail, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 75 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.4,
                            delay: 0.15 + i * 0.12,
                            ease: [0.22, 1, 0.36, 1]
                          }}
                          className="flex items-center gap-1.5"
                        >
                          <span className="font-bold text-white/90">{detail.label} :</span>
                          <span className="text-zinc-200 font-normal">{detail.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── RIGHT PRODUCT DETAILS SECTION ── */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            {/* Title & Price Header */}
            <div>
              {Boolean(selectedSize?.is_preorder === true || selectedSize?.is_preorder === 'true') && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#b8860b] text-white px-3 py-1 text-[12px] font-bold uppercase tracking-widest shadow-xs">
                    <Clock size={12} /> PRE-ORDER VARIANT
                  </span>
                </div>
              )}

              {/* Brand & Category Header Row */}
              <div className="flex items-center justify-between gap-3 mb-2.5 pb-2 border-b border-zinc-200/80">
                <span className="text-sm sm:text-base font-bold uppercase tracking-[0.3em] text-[#b8860b]">
                  {product.brand || 'MAHIRASH PARFUMS'}
                </span>
                {product.category && (
                  <span className="text-[12px] uppercase font-bold tracking-[0.2em] text-zinc-600 bg-zinc-100 px-3 py-1 border border-zinc-200">
                    {product.category}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl md:text-3xl font-light tracking-[0.08em] text-zinc-900 uppercase mb-3 leading-snug font-serif">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline justify-between sm:justify-start gap-4 mb-3">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl font-bold text-zinc-900 font-sans">
                    ₹{(selectedSize?.price || product.price)?.toLocaleString('en-IN')}
                  </span>
                  {(selectedSize?.original_price || product.original_price) && (
                    <span className="text-base text-zinc-400 line-through font-normal">
                      ₹{(selectedSize?.original_price || product.original_price)?.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                {discountPercent > 0 && (
                  <span className="bg-red-50 text-red-600 border border-red-200 text-[12px] font-bold uppercase tracking-widest px-2.5 py-1">
                    SAVE {discountPercent}%
                  </span>
                )}
              </div>

              {/* Ratings Badge */}
              <div className="flex items-center gap-3 pt-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#b8860b]/10 border border-[#b8860b]/30 text-[#b8860b] text-[12px] md:text-[14px] font-bold">
                  <span>{product.rating || 4.8}</span>
                  <Star size={13} fill="#b8860b" strokeWidth={0} />
                </div>
                <span className="text-[12px] md:text-[14px] text-zinc-600 font-medium">
                  Verified Fragrance · 808 Customer Ratings & 476 Reviews
                </span>
              </div>
            </div>

            {/* Delhivery Express Delivery & Pincode Checker */}
            <div className="p-4 bg-white border border-zinc-200/90 rounded-none shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck size={16} className="text-[#b8860b]" />
                  <span className="text-[12px] md:text-[14px] font-bold uppercase tracking-wider text-zinc-900">
                    Delhivery Express Delivery
                  </span>
                </div>
                <span className="text-[12px] md:text-[13px] font-semibold text-emerald-700 uppercase tracking-wider">
                  Free Air Shipping
                </span>
              </div>

              <form onSubmit={handlePincodeCheck} className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit PIN Code"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(cleanPincode(e.target.value));
                    if (pincodeStatus) setPincodeStatus(null);
                  }}
                  className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 text-[12px] md:text-[14px] text-zinc-900 font-mono focus:bg-white focus:border-black outline-none transition-colors placeholder:text-zinc-400 placeholder:font-sans"
                />
                <button
                  type="submit"
                  disabled={pincodeLoading || pincode.length !== 6}
                  className="px-5 py-2.5 bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-[12px] md:text-[14px] font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0"
                >
                  {pincodeLoading ? "Checking..." : "Check"}
                </button>
              </form>

              {/* Delhivery Result Feedback */}
              {pincodeStatus && (
                <div className={`p-3 rounded-none border text-[12px] md:text-[14px] ${
                  pincodeStatus.success ? "bg-emerald-50/80 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-800"
                }`}>
                  <div className="flex items-start gap-2">
                    {pincodeStatus.success ? (
                      <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <p className="font-semibold">{pincodeStatus.msg}</p>
                      {pincodeStatus.success && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-zinc-600 pt-0.5 text-[12px] md:text-[13px]">
                          <span>Courier: <strong className="text-zinc-900">Delhivery Express</strong></span>
                          <span>Payment: <strong className="text-emerald-700">{pincodeStatus.cod ? "Cash on Delivery Available" : "Prepaid Available"}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-[12px] text-zinc-500 font-normal">
                Dispatched directly from Indore central warehouse via Delhivery Express.
              </p>
            </div>

            {/* VOLUME & PRICE Selection Grid */}
            <div className="border-t border-zinc-200 pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold uppercase tracking-[0.2em] text-zinc-900">SELECT BOTTLE VOLUME</span>
                <button
                  type="button"
                  onClick={() => setIsSizeChartOpen(true)}
                  className="text-[12px] text-[#b8860b] hover:text-black flex items-center gap-1.5 transition-colors uppercase font-bold tracking-wider cursor-pointer underline underline-offset-4"
                >
                  <Sparkles size={12} className="text-[#b8860b]" />
                  <span>FRAGRANCE & VOLUME GUIDE</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-3">
                {(product.size_prices && product.size_prices.length > 0
                  ? product.size_prices
                  : [{ size: '50ml', price: product.price }, { size: '100ml', price: (product.price || 3000) * 1.5 }, { size: 'Sample Set', price: 999 }]
                ).map((sp, idx) => {
                  const spStock = sp.stock !== undefined ? Number(sp.stock) : Number(product?.stock ?? 10);
                  const isSpPre = Boolean(sp.is_preorder === true || sp.is_preorder === 'true');
                  const isSpOut = !isSpPre && (spStock <= 0 || product?.stock_status === 'Out of Stock');
                  const isSelected = selectedSize?.size === sp.size;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedSize(sp);
                        if (sp.image) {
                          const imgIdx = (images || []).findIndex(img => img === sp.image);
                          if (imgIdx !== -1) {
                            setSelectedImage(imgIdx);
                            if (swiperRef.current) swiperRef.current.slideTo(imgIdx);
                          }
                        }
                      }}
                      className={`px-5 py-3 flex flex-col items-center justify-center border transition-all duration-300 cursor-pointer relative min-w-[100px] ${isSelected
                        ? 'border-black bg-black text-white shadow-xl scale-[1.02]'
                        : isSpOut
                          ? 'border-red-200 bg-red-50/40 text-zinc-400 hover:border-red-400'
                          : isSpPre
                            ? 'border-amber-300 bg-amber-50/40 text-amber-900 hover:border-[#b8860b]'
                            : 'border-zinc-300 bg-white text-zinc-800 hover:border-black hover:bg-zinc-50'
                        }`}
                    >
                      <span className={`text-[13px] font-black uppercase tracking-wider ${isSpOut && !isSelected ? 'line-through' : ''}`}>
                        {sp.size}
                      </span>
                      {sp.price && (
                        <span className={`text-[12px] md:text-[13px] font-semibold mt-0.5 ${isSelected ? 'text-amber-300' : 'text-zinc-500'}`}>
                          ₹{sp.price.toLocaleString('en-IN')}
                        </span>
                      )}
                      {isSpOut ? (
                        <span className={`text-[12px] uppercase font-bold tracking-widest mt-1 ${isSelected ? 'text-red-300' : 'text-red-600'}`}>
                          Out of stock
                        </span>
                      ) : isSpPre ? (
                        <span className={`text-[12px] uppercase font-bold tracking-widest mt-1 ${isSelected ? 'text-amber-300' : 'text-amber-600'}`}>
                          Pre-Order
                        </span>
                      ) : spStock <= 5 ? (
                        <span className={`text-[12px] uppercase font-bold tracking-widest mt-1 ${isSelected ? 'text-amber-300' : 'text-amber-600'}`}>
                          Only {spStock} left
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Desktop Add to Bag CTA */}
            <div className="hidden md:block pt-2">
              {(() => {
                const currentVariantStock = selectedSize
                  ? (selectedSize.stock !== undefined ? Number(selectedSize.stock) : Number(product?.stock ?? 10))
                  : Number(product?.stock ?? 10);
                const isPreOrder = Boolean(selectedSize?.is_preorder === true || selectedSize?.is_preorder === 'true');
                const isCurrentVariantOut = !isPreOrder && (currentVariantStock <= 0 || product?.stock_status === 'Out of Stock');

                return (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (isCurrentVariantOut) {
                          addToCollection('notify');
                        } else {
                          addToCollection('cart');
                        }
                      }}
                      className={`w-full h-13 text-[14px] font-black uppercase tracking-[0.22em] transition-all duration-300 cursor-pointer shadow-lg active:scale-[0.99] flex items-center justify-center gap-2 ${isCurrentVariantOut
                        ? 'bg-[#0D0D0D] hover:bg-[#b8860b] text-white'
                        : isPreOrder
                          ? 'bg-[#b8860b] hover:bg-black text-white'
                          : 'bg-black hover:bg-zinc-900 text-white'
                        }`}
                    >
                      {isCurrentVariantOut ? (
                        <>
                          <Bell size={18} />
                          <span>{selectedSize?.size ? `${selectedSize.size.toUpperCase()} — ` : ''}NOTIFY ME</span>
                        </>
                      ) : isPreOrder ? (
                        <>
                          <Clock size={18} />
                          <span>PRE-ORDER NOW</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={18} />
                          <span>{isInCart ? 'VIEW IN BAG' : 'ADD TO BAG'}</span>
                        </>
                      )}
                    </button>

                    {isPreOrder && (
                      <p className="text-[12px] font-semibold text-[#b8860b] bg-[#faf5ed] border border-[#e8ded0] p-2.5 flex items-center gap-1.5">
                        <Clock size={13} className="shrink-0" />
                        <span>Pre-Order: Estimated dispatch in 5–7 business days. Insured delivery.</span>
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Trust & Guarantee Luxury Strip */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-200 text-center">
              <div className="flex flex-col items-center p-2.5 bg-zinc-50 border border-zinc-200/80">
                <Sparkles size={16} className="text-[#b8860b] mb-1" />
                <span className="text-[12px] md:text-[14px] font-bold uppercase tracking-wider text-zinc-900">100% Extrait</span>
                <span className="text-[12px] text-zinc-500 font-medium">Authentic Perfume</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-zinc-50 border border-zinc-200/80">
                <Truck size={16} className="text-[#b8860b] mb-1" />
                <span className="text-[12px] md:text-[14px] font-bold uppercase tracking-wider text-zinc-900">4-5 Days Express</span>
                <span className="text-[12px] text-zinc-500 font-medium">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center p-2.5 bg-zinc-50 border border-zinc-200/80">
                <ShieldCheck size={16} className="text-[#b8860b] mb-1" />
                <span className="text-[12px] md:text-[14px] font-bold uppercase tracking-wider text-zinc-900">Authentic Guarantee</span>
                <span className="text-[12px] text-zinc-500 font-medium">Original Formulation</span>
              </div>
            </div>

            {/* Snitch-style Accordions */}
            <div className="border-t border-zinc-200 pt-2 divide-y divide-zinc-200">

              {/* 1. FRAGRANCE DETAILS & NOTES Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === 'description' ? null : 'description')}
                  className="w-full flex items-center justify-between py-4 text-left group cursor-pointer"
                >
                  <span className="text-[14px] font-bold uppercase tracking-[0.2em] text-zinc-800 group-hover:text-black transition-colors">
                    FRAGRANCE NOTES & DETAILS
                  </span>
                  {activeAccordion === 'description' ? (
                    <Minus size={14} className="text-black" />
                  ) : (
                    <Plus size={14} className="text-zinc-500 group-hover:text-black transition-colors" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {activeAccordion === 'description' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                     >
                      <div className="pb-5 space-y-4 text-[14px] text-zinc-700 font-normal leading-relaxed">

                        {/* Dynamic TinyMCE Rich HTML Description */}
                        {product.description ? (
                          <div
                            className="prose prose-sm max-w-none text-zinc-700 font-sans leading-relaxed text-[14px] [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_strong]:text-zinc-900 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-[14px]"
                            dangerouslySetInnerHTML={{ __html: product.description }}
                          />
                        ) : (
                          <p>Handcrafted with rare botanical extraits and artisanal perfume oils. Designed to evolve exquisitely on the skin over 14+ hours.</p>
                        )}

                        {/* Fragrance Notes Breakdown */}
                        <div className="bg-zinc-900 text-white p-4 rounded-xl space-y-2.5 border border-zinc-800">
                          <p className="text-[#c9a962] font-bold uppercase tracking-widest text-[12px] md:text-[13px] flex items-center gap-1.5">
                            <Sparkles size={13} /> Fragrance Notes & Performance
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[12px] md:text-[13px] pt-1">
                            <div>
                              <span className="text-zinc-400 font-bold block text-[12px] uppercase tracking-wider">Top Notes</span>
                              <span className="text-white font-medium">{product.top_notes || 'Bergamot, Saffron, Pink Pepper'}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 font-bold block text-[12px] uppercase tracking-wider">Heart Notes</span>
                              <span className="text-white font-medium">{product.heart_notes || 'Damask Rose, Jasmine, Smoked Cedar'}</span>
                            </div>
                            <div>
                              <span className="text-zinc-400 font-bold block text-[12px] uppercase tracking-wider">Base Notes</span>
                              <span className="text-white font-medium">{product.base_notes || 'Royal Oud, Golden Amber, White Musk'}</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-[12px] md:text-[13px] pt-2 border-t border-zinc-800 text-zinc-300">
                            <span><strong>Concentration:</strong> {product.material || 'Extrait de Parfum (30%)'}</span>
                            <span><strong>Longevity:</strong> {product.longevity || '12-14 Hours'}</span>
                            <span><strong>Strength & Projection:</strong> {product.sillage || 'Intense'}</span>
                          </div>
                        </div>

                        {/* Storage & Brand Details Care */}
                        <div className="space-y-1.5 pt-1">
                          <p className="font-bold text-zinc-900 uppercase tracking-wider text-[12px]">Fragrance Preservation & Brand Details</p>
                          <p><strong>Brand:</strong> {product.brand || 'MAHIRASH'}</p>
                          {((product.collections && Array.isArray(product.collections) && product.collections.length > 0) || product.collection) && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <strong className="text-zinc-900">Collections:</strong>
                              {(product.collections && Array.isArray(product.collections) && product.collections.length > 0
                                ? product.collections
                                : [product.collection]
                              ).map((col, idx) => (
                                <span key={idx} className="bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-[12px] uppercase font-semibold text-amber-900">
                                  {col}
                                </span>
                              ))}
                            </div>
                          )}
                          <p>Store in a cool, dry place away from direct heat or humidity. Keep bottle upright with cap secured.</p>
                          <p className="pt-1 text-zinc-400 font-mono text-[12px]">SKU: {product.sku || `${product.id?.slice(0, 10)?.toUpperCase() || 'MHR-ROYAL-01'}`}</p>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 2. REVIEWS Accordion (Snitch Screenshot 4 & 5) */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === 'reviews' ? null : 'reviews')}
                  className="w-full flex items-center justify-between py-4 text-left group cursor-pointer"
                >
                  <span className="text-[14px]   uppercase tracking-[0.2em] text-zinc-800 group-hover:text-black transition-colors">
                    REVIEWS
                  </span>
                  {activeAccordion === 'reviews' ? (
                    <Minus size={14} className="text-black" />
                  ) : (
                    <Plus size={14} className="text-zinc-500 group-hover:text-black transition-colors" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {activeAccordion === 'reviews' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pb-6 space-y-5">

                        {/* Tabs: STYLE REVIEWS | CATEGORY REVIEWS */}
                        <div className="flex border-b border-zinc-200">
                          <button
                            type="button"
                            onClick={() => setReviewTab('style')}
                            className={`flex-1 py-2.5 text-[12px]   uppercase tracking-wider transition-colors ${reviewTab === 'style'
                              ? 'text-black border-b-2 border-[#d92323]'
                              : 'text-zinc-400 hover:text-zinc-700'
                              }`}
                          >
                            STYLE REVIEWS
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewTab('category')}
                            className={`flex-1 py-2.5 text-[12px]   uppercase tracking-wider transition-colors ${reviewTab === 'category'
                              ? 'text-black border-b-2 border-[#d92323]'
                              : 'text-zinc-400 hover:text-zinc-700'
                              }`}
                          >
                            CATEGORY REVIEWS
                          </button>
                        </div>

                        {/* Overall Rating Box */}
                        <div className="text-center py-3 bg-zinc-50 border border-zinc-200">
                          <div className="flex items-center justify-center gap-1 text-xl font-black text-zinc-900">
                            <span>4.4</span>
                            <div className="flex text-black">
                              <Star size={16} fill="black" strokeWidth={0} />
                              <Star size={16} fill="black" strokeWidth={0} />
                              <Star size={16} fill="black" strokeWidth={0} />
                              <Star size={16} fill="black" strokeWidth={0} />
                              <Star size={16} fill="none" stroke="black" strokeWidth={1.5} />
                            </div>
                          </div>
                          <p className="text-[12px] text-zinc-600 font-medium mt-1">
                            Loved by our users! <strong>74 out of 128</strong> rated 5 stars
                          </p>
                        </div>

                        {/* Sample Verified Customer Review (Snitch Screenshot 5) */}
                        <div className="p-3.5 bg-white border border-zinc-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-zinc-900 text-white text-[12px]   flex items-center gap-0.5">
                                5 <Star size={8} fill="white" strokeWidth={0} />
                              </span>
                              <span className="text-[12px]   text-zinc-900">AAKASH</span>
                              <span className="text-[12px] text-[#d92323] font-semibold">Verified User</span>
                            </div>
                            <div className="flex items-center gap-1 text-zinc-500 text-[12px]">
                              <span>2</span>
                              <ThumbsUp size={12} className="cursor-pointer hover:text-black" />
                            </div>
                          </div>
                          <p className="text-[14px] text-zinc-700">Good material, looks rich</p>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 3. DELIVERY Accordion (Snitch Screenshot 5) */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === 'delivery' ? null : 'delivery')}
                  className="w-full flex items-center justify-between py-4 text-left group cursor-pointer"
                >
                  <span className="text-[14px]   uppercase tracking-[0.2em] text-zinc-800 group-hover:text-black transition-colors">
                    DELIVERY
                  </span>
                  {activeAccordion === 'delivery' ? (
                    <Minus size={14} className="text-black" />
                  ) : (
                    <Plus size={14} className="text-zinc-500 group-hover:text-black transition-colors" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {activeAccordion === 'delivery' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pb-5 space-y-3">
                        <form onSubmit={handlePincodeCheck} className="flex gap-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Enter Pincode"
                            value={pincode}
                            onChange={(e) => setPincode(e.target.value)}
                            className="flex-1 px-3 py-2 border border-zinc-300 text-[14px] focus:outline-none focus:border-black"
                          />
                          <button
                            type="submit"
                            className="px-4 py-2 bg-black text-white text-[12px]   uppercase tracking-wider hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            Check
                          </button>
                        </form>
                        {pincodeStatus && (
                          <p className={`text-[12px] font-medium ${pincodeStatus.success ? 'text-emerald-700' : 'text-red-600'}`}>
                            {pincodeStatus.msg}
                          </p>
                        )}
                        <ul className="text-[12px] text-zinc-600 space-y-1.5 pt-1">
                          <li className="flex items-center gap-2">
                            <Truck size={13} className="text-zinc-800 shrink-0" />
                            <span>Express nationwide delivery in 4-5 days.</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <ShieldCheck size={13} className="text-zinc-800 shrink-0" />
                            <span>Cash on Delivery (COD) available nationwide.</span>
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4. AUTHENTICITY & LUXURY GUARANTEE Accordion */}
              <div>
                <button
                  type="button"
                  onClick={() => setActiveAccordion(activeAccordion === 'authenticity' ? null : 'authenticity')}
                  className="w-full flex items-center justify-between py-4 text-left group cursor-pointer"
                >
                  <span className="text-[14px] uppercase tracking-[0.2em] text-zinc-800 group-hover:text-black transition-colors">
                    AUTHENTICITY & LUXURY GUARANTEE
                  </span>
                  {activeAccordion === 'authenticity' ? (
                    <Minus size={14} className="text-black" />
                  ) : (
                    <Plus size={14} className="text-zinc-500 group-hover:text-black transition-colors" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {activeAccordion === 'authenticity' && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="pb-5 text-[14px] text-zinc-600 font-light leading-relaxed space-y-2">
                        <p className="flex items-start gap-2">
                          <ShieldCheck size={14} className="text-[#b8860b] shrink-0 mt-0.5" />
                          <span>100% Genuine & Handcrafted. Formulated with authentic botanical extracts and royal Cambodian ouds.</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <Truck size={14} className="text-zinc-800 shrink-0 mt-0.5" />
                          <span>Tamper-evident luxury packaging delivered directly to your doorstep in 4-5 days.</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </div>
        </div>

        {/* YOU MAY ALSO LIKE Section (Snitch Screenshot 5 Style) */}
        {relatedProducts.length > 0 && (
          <div className="mt-14 border-t border-zinc-200 pt-12">
            <div className="text-center pb-8">
              <h2 className="text-base sm:text-lg   text-zinc-900 uppercase tracking-[0.25em]">YOU MAY ALSO LIKE</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 sm:gap-4">
              {relatedProducts.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`} className="group block">
                  <div className="relative aspect-[3/4] bg-zinc-100 border border-zinc-200 mb-2.5 overflow-hidden">
                    <OptimizedCloudinaryImage
                      src={item.image || item.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800'}
                      alt={item.name}
                      preset="product-card"
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        addToWishlist(item);
                        triggerToast("Saved to wishlist!");
                      }}
                      className="absolute bottom-2.5 right-2.5 p-2 bg-white/90 rounded-full text-zinc-800 hover:text-black shadow-sm cursor-pointer"
                    >
                      <Heart size={14} />
                    </button>
                  </div>
                  <h3 className="text-[14px] font-medium tracking-wider uppercase text-zinc-900 truncate mb-0.5 group-hover:text-black transition-colors">{item.name}</h3>
                  <span className="text-[14px]   text-zinc-900">₹{item.price?.toLocaleString()}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── MOBILE STICKY BOTTOM BAR (SNITCH SCREENSHOT 4 & 5 STYLE) ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-zinc-200 p-3 flex items-center gap-3 md:hidden shadow-2xl">
        <button
          type="button"
          onClick={() => addToCollection('wishlist')}
          className="w-12 h-12 border border-zinc-300 bg-white flex items-center justify-center text-zinc-800 hover:border-black shrink-0 transition-colors cursor-pointer"
          aria-label="Wishlist"
        >
          <Heart
            size={18}
            strokeWidth={1.8}
            fill={isWishlisted ? '#d92323' : 'none'}
            stroke={isWishlisted ? '#d92323' : 'currentColor'}
          />
        </button>

        {(() => {
          const currentVariantStock = selectedSize
            ? (selectedSize.stock !== undefined ? Number(selectedSize.stock) : Number(product?.stock ?? 10))
            : Number(product?.stock ?? 10);
          const isPreOrder = Boolean(selectedSize?.is_preorder === true || selectedSize?.is_preorder === 'true');
          const isCurrentVariantOut = !isPreOrder && (currentVariantStock <= 0 || product?.stock_status === 'Out of Stock');

          return (
            <button
              type="button"
              onClick={() => {
                if (isCurrentVariantOut) {
                  addToCollection('notify');
                } else {
                  addToCollection('cart');
                }
              }}
              className={`flex-1 h-12 text-[14px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isCurrentVariantOut
                ? 'bg-[#0D0D0D] active:bg-[#b8860b] text-white'
                : isPreOrder
                  ? 'bg-[#b8860b] active:bg-black text-white'
                  : 'bg-black active:bg-zinc-800 text-white'
                }`}
            >
              {isCurrentVariantOut ? (
                <>
                  <Bell size={16} />
                  <span>NOTIFY ME</span>
                </>
              ) : isPreOrder ? (
                <>
                  <Clock size={16} />
                  <span>PRE-ORDER</span>
                </>
              ) : (
                <span>{isInCart ? 'VIEW BAG' : 'ADD TO BAG'}</span>
              )}
            </button>
          );
        })()}
      </div>

      {/* ── HIGH-RESOLUTION ZOOM MODAL ── */}
      <AnimatePresence>
        {isZoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-4 sm:p-8"
            onClick={() => setIsZoomOpen(false)}
          >
            <button
              onClick={() => setIsZoomOpen(false)}
              className="absolute top-6 right-6 text-white p-3 hover:bg-white/10 rounded-full transition-colors z-10 cursor-pointer"
            >
              <X size={28} />
            </button>
            <div className="relative max-w-6xl max-h-[90vh] w-full h-full flex items-center justify-center overflow-auto" onClick={(e) => e.stopPropagation()}>
              <OptimizedCloudinaryImage
                src={images[selectedImage]}
                alt={product.name}
                preset="zoom"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;