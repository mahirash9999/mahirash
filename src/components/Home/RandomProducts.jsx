import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, Shuffle, ArrowRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../Firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useStore } from '../StoreProvider';
import OptimizedCloudinaryImage from '../OptimizedCloudinaryImage';

const parseMl = (str) => {
  if (!str) return null;
  const match = String(str).toLowerCase().match(/(\d+(?:\.\d+)?)\s*(ml)/);
  if (match) return parseFloat(match[1]);
  return null;
};

// Check if product is a miniature (<= 10 ml)
const isMiniatureProduct = (product) => {
  if (!product) return false;

  // Check product name for explicit discovery/miniature/tester mentions
  const nameLower = (product.name || '').toLowerCase();
  if (nameLower.includes('sample') || nameLower.includes('miniature') || nameLower.includes('discovery') || nameLower.includes('travel set') || nameLower.includes('tester')) {
    return true;
  }

  // Check sizes string (e.g. "5ml, 10ml" or "10ml")
  if (product.sizes) {
    const parts = String(product.sizes).split(',');
    for (const part of parts) {
      const ml = parseMl(part);
      if (ml !== null && ml <= 10) return true;
    }
  }

  // Check size_prices array
  if (Array.isArray(product.size_prices) && product.size_prices.length > 0) {
    const hasMiniatureVariant = product.size_prices.some(sp => {
      const ml = parseMl(sp?.size);
      return ml !== null && ml <= 10;
    });
    if (hasMiniatureVariant) return true;
  }

  // Check single size / volume attribute
  if (product.volume || product.size) {
    const ml = parseMl(product.volume || product.size);
    if (ml !== null && ml <= 10) return true;
  }

  return false;
};

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

import ProductCard from '../ProductCard';

const RandomProducts = () => {
  const [allRawProducts, setAllRawProducts] = useState([]);
  const [randomizedProducts, setRandomizedProducts] = useState([]);
  const [shuffleKey, setShuffleKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isShuffling, setIsShuffling] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [bannerData, setBannerData] = useState(null);

  const triggerToast = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleShuffle = useCallback(() => {
    setIsShuffling(true);
    setTimeout(() => {
      setRandomizedProducts(prev => shuffleArray(prev));
      setShuffleKey(k => k + 1);
      setIsShuffling(false);
    }, 200);
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        if (!snap.empty) {
          const list = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(item => item.is_active !== false);

          // Filter for miniature products (<= 10ml)
          const miniatureProducts = list.filter(isMiniatureProduct);
          // Fallback to list if no <= 10ml products found so section doesn't stay empty
          const displayList = miniatureProducts.length > 0 ? miniatureProducts : list;

          setAllRawProducts(displayList);
          setRandomizedProducts(shuffleArray(displayList));
        } else {
          setAllRawProducts([]);
          setRandomizedProducts([]);
        }
      } catch (err) {
        console.warn('Error fetching miniature products:', err);
        setAllRawProducts([]);
        setRandomizedProducts([]);
      } finally {
        setLoading(false);
      }
    };
    const fetchBanner = async () => {
      try {
        const snap = await getDocs(collection(db, 'explore_banner'));
        if (!snap.empty) {
          setBannerData(snap.docs[0].data());
        }
      } catch (err) { }
    };
    fetchProducts();
    fetchBanner();
  }, []);

  if (loading) {
    return (
      <section className="py-12 bg-[#FAF8F5] border-t border-[#E5D5B8]/60">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-3 w-32 bg-zinc-200 animate-pulse mb-3 rounded" />
              <div className="h-8 w-64 bg-zinc-200 animate-pulse rounded" />
            </div>
            <div className="w-28 h-9 bg-zinc-200 animate-pulse rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-[#E5D5B8] p-3 space-y-3 rounded-2xl">
                <div className="aspect-[2/3] bg-zinc-100 animate-pulse rounded-xl" />
                <div className="h-3 bg-zinc-200 animate-pulse w-2/3 rounded" />
                <div className="h-4 bg-zinc-200 animate-pulse w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 md:py-20 bg-[#FAF8F5] relative border-t border-[#E5D5B8]/60 overflow-hidden">

      {/* ── Dynamic Explore Banner ── */}
      {bannerData && (bannerData.desktop_image || bannerData.mobile_image) && bannerData.is_active !== false && (
        <div className="w-full mb-12 px-4 sm:px-6 lg:px-8 max-w-[1800px] mx-auto">
          <Link to={bannerData.link || "/shop"} className="block relative w-full overflow-hidden rounded-2xl border border-[#E5D5B8] hover:border-[#B8860B] transition-all duration-500 shadow-lg group">
            <picture>
              {bannerData.desktop_image && <source media="(min-width: 1024px)" srcSet={bannerData.desktop_image} />}
              {bannerData.tablet_image && <source media="(min-width: 768px)" srcSet={bannerData.tablet_image} />}
              <img
                src={bannerData.mobile_image || bannerData.desktop_image || bannerData.image_url}
                alt="Explore Features"
                className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] m-0 p-0 block leading-[0]"
              />
            </picture>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300" />
          </Link>
        </div>
      )}

      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Section Header */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
          <div className="flex-1 flex flex-col md:flex-row md:items-end gap-6 md:gap-12">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <p className="text-[10px] sm:text-[14px] tracking-[0.3em] text-[#B8860B] uppercase font-bold flex items-center gap-2">
                  <span>POCKET LUXURY</span>
                  <span>•</span>
                  <span>DISCOVERY ESSENTIALS</span>
                </p>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extralight tracking-[0.15em] text-[#0D0D0D] uppercase whitespace-nowrap">
                EXPLORE OUR MINIATURES
              </h2>
            </div>
            <div className="hidden md:block flex-1 h-[1px] bg-gradient-to-r from-[#B8860B]/40 via-zinc-300 to-transparent mb-3" />
          </div>

          <div className="flex items-center gap-4 self-start md:self-auto">
            <button
              type="button"
              onClick={handleShuffle}
              disabled={isShuffling}
              className="flex items-center gap-2.5 px-5 py-2.5 border border-[#B8860B] bg-white text-[#B8860B] hover:text-white hover:bg-[#B8860B] transition-all duration-300 text-[11px] font-bold uppercase tracking-[0.2em] shadow-sm rounded-full cursor-pointer group shrink-0"
            >
              <Shuffle
                size={14}
                className={`transition-transform duration-500 ${isShuffling ? 'rotate-180 text-white' : 'group-hover:rotate-45'}`}
              />
              <span>Shuffle Order</span>
            </button>
          </div>
        </div>

        {/* Randomized Grid Layout */}
        <AnimatePresence mode="wait">
          <motion.div
            key={shuffleKey}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6"
          >
            {randomizedProducts.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                idx={idx}
                preferredSize="miniature"
                triggerToast={triggerToast}
              />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* View All CTA */}
        <div className="mt-14 md:mt-18 flex justify-center">
          <Link
            to="/shop?size=1-10ML"
            className="group inline-flex items-center gap-3 px-10 py-4 border border-[#0D0D0D] bg-[#0D0D0D] text-white text-[11px] font-extrabold uppercase tracking-[0.28em] transition-all duration-300 hover:bg-[#B8860B] hover:border-[#B8860B] rounded-full shadow-lg"
          >
            <span>Explore All Miniatures</span>
            <ArrowRight size={15} className="transform group-hover:translate-x-1.5 transition-transform duration-300" />
          </Link>
        </div>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-[#0D0D0D] border border-[#B8860B] text-white px-7 py-3.5 rounded-full shadow-2xl flex items-center gap-3 gold-glow-sm"
          >
            <p className="text-[12px] font-extrabold uppercase tracking-[0.2em] whitespace-nowrap text-[#D4AF37]">{feedbackMessage}</p>
            <button onClick={() => setFeedbackMessage(null)} className="opacity-60 hover:opacity-100 ml-1 text-white">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default RandomProducts;
