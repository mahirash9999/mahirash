import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../../components/Firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export const BANNER_DEFAULTS = {
  scent_to_bestseller: {
    slot_key: 'scent_to_bestseller',
    slot_title: 'Between Shop by Scent & Best Sellers',
    mediaType: 'video',
    desktopMediaUrl: 'https://res.cloudinary.com/djmfxpemz/video/upload/v1789045664/xr1u182rnbyoxu0dtbtp.mp4',
    tabletMediaUrl: '',
    mobileMediaUrl: '',
    posterUrl: '',
    eyebrow: 'ROYAL BOTANICAL EXTRAITS',
    title: 'Fragrance Formulations Crafted for Royalty',
    description: 'Rare Cambodian oud, ambergris, and delicate floral distillations formulated to leave an unforgettable presence.',
    ctaText: 'Discover Best Sellers',
    ctaLink: '/shop',
    textAlignment: 'center',
    is_active: true
  },
  miniatures_to_signature: {
    slot_key: 'miniatures_to_signature',
    slot_title: 'Between Shop Miniatures & Signature Collection',
    mediaType: 'image',
    desktopMediaUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1920&q=80',
    tabletMediaUrl: '',
    mobileMediaUrl: '',
    posterUrl: '',
    eyebrow: 'DISCOVERY SETS & TRAVEL SPRAYS',
    title: 'Pure Luxury Wherever Your Journey Leads',
    description: 'Signature artisanal extraits de parfum poured into sleek, travel-ready atomizers for every mood.',
    ctaText: 'Explore Miniatures',
    ctaLink: '/shop',
    textAlignment: 'center',
    is_active: true
  },
  before_faq: {
    slot_key: 'before_faq',
    slot_title: 'Before Frequently Asked Questions (FAQ)',
    mediaType: 'image',
    desktopMediaUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=1920&q=80',
    tabletMediaUrl: '',
    mobileMediaUrl: '',
    posterUrl: '',
    eyebrow: 'THE MAHIRASH ATELIER EXPERIENCE',
    title: '100% Authentic Handcrafted Perfection',
    description: 'Complimentary luxury samples with every order, temperature-controlled dispatch, and express doorstep delivery across India.',
    ctaText: 'Shop All Fragrances',
    ctaLink: '/shop',
    textAlignment: 'center',
    is_active: true
  }
};

const HomePromoBanner = ({ slotKey, defaultData }) => {
  const fallback = defaultData || BANNER_DEFAULTS[slotKey] || BANNER_DEFAULTS.scent_to_bestseller;
  const [bannerData, setBannerData] = useState(fallback);
  const [isMuted, setIsMuted] = useState(true);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const videoRef = useRef(null);

  // 1. Window resize listener to select Desktop / Tablet / Mobile media
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. Real-time Firestore sync
  useEffect(() => {
    if (!slotKey) return;
    const unsub = onSnapshot(doc(db, 'homepage_banners', slotKey), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setBannerData({
          ...fallback,
          ...data,
          is_active: data.is_active !== undefined ? data.is_active : true
        });
      }
    }, (err) => {
      console.warn(`Error loading banner slot [${slotKey}]:`, err);
    });

    return () => unsub();
  }, [slotKey]);

  if (bannerData.is_active === false) {
    return null;
  }

  // Determine media URL based on responsive screen width
  // Mobile: <640px, Tablet: 640px - 1024px, Desktop: >1024px
  let activeMediaUrl = bannerData.desktopMediaUrl;
  if (windowWidth < 640 && bannerData.mobileMediaUrl) {
    activeMediaUrl = bannerData.mobileMediaUrl;
  } else if (windowWidth < 1024 && bannerData.tabletMediaUrl) {
    activeMediaUrl = bannerData.tabletMediaUrl;
  }

  const isVideo =
    bannerData.mediaType === 'video' ||
    activeMediaUrl?.includes('.mp4') ||
    activeMediaUrl?.includes('/video/') ||
    activeMediaUrl?.endsWith('.webm');

  const alignmentClass =
    bannerData.textAlignment === 'left'
      ? 'items-start text-left'
      : bannerData.textAlignment === 'right'
      ? 'items-end text-right'
      : 'items-center text-center';

  return (
    <section className="relative w-full overflow-hidden bg-[#0a0d14] my-10 sm:my-14 md:my-16 font-sans">
      <div className="relative min-h-[340px] sm:min-h-[400px] md:min-h-[460px] lg:h-[500px] w-full flex items-center justify-center">

        {/* ── Background Media ── */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {isVideo ? (
            <video
              ref={videoRef}
              key={activeMediaUrl}
              src={activeMediaUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="auto"
              poster={bannerData.posterUrl || undefined}
              className="w-full h-full object-cover opacity-85 scale-105 transition-transform duration-700"
            />
          ) : (
            <img
              key={activeMediaUrl}
              src={activeMediaUrl}
              alt={bannerData.title || 'Mahirash Luxury Perfumes'}
              className="w-full h-full object-cover opacity-85 scale-105 transition-transform duration-700"
            />
          )}

          {/* Cinematic Dark Gradient Vignettes */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/60 to-[#0a0d14]/70 z-[1]" />
          <div className="absolute inset-0 bg-black/35 z-[1]" />
        </div>

        {/* ── Content Box ── */}
        <div className="relative z-10 max-w-[1100px] mx-auto w-full px-5 sm:px-8 lg:px-12 py-12 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className={`max-w-2xl w-full flex flex-col ${alignmentClass} space-y-3 sm:space-y-4`}
          >
            {/* 1. Eyebrow */}
            {bannerData.eyebrow && (
              <span className="text-[#B88D46] text-[10px] sm:text-[11px] md:text-[12px] font-bold uppercase tracking-[0.3em]">
                {bannerData.eyebrow}
              </span>
            )}

            {/* 2. Headline */}
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-[44px] text-white font-normal leading-[1.12] tracking-tight">
              {bannerData.title}
            </h2>

            {/* 3. Description */}
            {bannerData.description && (
              <p className="text-zinc-200 text-xs sm:text-sm md:text-[15px] leading-relaxed font-light max-w-xl">
                {bannerData.description}
              </p>
            )}

            {/* 4. CTA Button */}
            {bannerData.ctaText && (
              <div className="pt-2 sm:pt-3">
                <Link
                  to={bannerData.ctaLink || '/shop'}
                  className="inline-flex items-center gap-2.5 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-[#800020] hover:bg-[#650018] text-white text-[11px] sm:text-[12px] font-bold uppercase tracking-[0.15em] transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-95 group"
                >
                  <span>{bannerData.ctaText}</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
          </motion.div>
        </div>

        {/* Floating Sound Toggle for Video Banners */}
        {isVideo && (
          <button
            type="button"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.muted = !isMuted;
                setIsMuted(!isMuted);
              }
            }}
            aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
            className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-black/80 border border-white/20 text-white transition-all shadow-md active:scale-95 cursor-pointer backdrop-blur-xs"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        )}
      </div>
    </section>
  );
};

export default HomePromoBanner;

