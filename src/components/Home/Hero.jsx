import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../../components/Firebase';
import { collection, getDocs, query } from 'firebase/firestore';

const FALLBACK_LUXURY_VIDEO = 'https://res.cloudinary.com/djmfxpemz/video/upload/v1789045664/xr1u182rnbyoxu0dtbtp.mp4';

const HERO_SLIDES = [
  {
    eyebrow: 'PREMIUM FRAGRANCES',
    title: 'Fragrances That Define You',
    description: 'A perfect blend of luxury, elegance and long lasting impressions. Discover our exclusive collection of premium perfumes.',
    ctaText: 'Shop Now',
    ctaLink: '/shop'
  },
  {
    eyebrow: 'ARTISAN EXTRAITS',
    title: 'Pure Essence of Royalty',
    description: 'Handcrafted with rare botanical oils and aged Cambodian oud for an unforgettable presence.',
    ctaText: 'Explore Collection',
    ctaLink: '/shop?category=Oud'
  },
  {
    eyebrow: 'HAUTE PARFUMERIE',
    title: 'Elegance in Every Drop',
    description: 'Formulated to captivate and linger with unmatched projection and sophisticated warmth.',
    ctaText: 'Discover Scent',
    ctaLink: '/shop'
  }
];

const Hero = () => {
  const [videoConfig, setVideoConfig] = useState({
    videoUrl: FALLBACK_LUXURY_VIDEO,
    mobileVideoUrl: '',
    posterUrl: '',
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchHeroVideo = async () => {
      try {
        const localStr = localStorage.getItem('mahirash_hero_video_config');
        if (localStr) {
          try {
            const parsed = JSON.parse(localStr);
            if (parsed && parsed.videoUrl) {
              setVideoConfig(parsed);
            }
          } catch (e) {
            // ignore
          }
        }

        const qVideo = query(collection(db, 'hero_video'));
        const snapVideo = await getDocs(qVideo);

        if (!snapVideo.empty) {
          const data = snapVideo.docs[0].data();
          if (data.is_active !== false) {
            const conf = {
              videoUrl: data.videoUrl || data.url || FALLBACK_LUXURY_VIDEO,
              mobileVideoUrl: data.mobileVideoUrl || '',
              posterUrl: data.posterUrl || '',
              is_active: true
            };
            setVideoConfig(conf);
            localStorage.setItem('mahirash_hero_video_config', JSON.stringify(conf));
          }
        } else {
          const qSlides = query(collection(db, 'hero_slides'));
          const snapSlides = await getDocs(qSlides);
          if (!snapSlides.empty) {
            const first = snapSlides.docs[0].data();
            if (first.is_active !== false) {
              const videoCandidate = first.image && (
                first.image.endsWith('.mp4') ||
                first.image.includes('/video/upload/') ||
                first.image.endsWith('.webm') ||
                first.image.endsWith('.mov')
              ) ? first.image : FALLBACK_LUXURY_VIDEO;

              const conf = {
                videoUrl: videoCandidate,
                mobileVideoUrl: first.mobileImage || '',
                posterUrl: first.posterUrl || '',
                is_active: true
              };
              setVideoConfig(conf);
              localStorage.setItem('mahirash_hero_video_config', JSON.stringify(conf));
            }
          }
        }
      } catch (err) {
        console.warn("Using default hero fallback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroVideo();
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const currentVideoUrl = (typeof window !== 'undefined' && window.innerWidth <= 640 && videoConfig.mobileVideoUrl)
    ? videoConfig.mobileVideoUrl
    : (videoConfig.videoUrl || FALLBACK_LUXURY_VIDEO);

  if (!videoConfig.is_active) {
    return null;
  }

  const slide = HERO_SLIDES[currentSlide];

  return (
    <section className="relative w-full overflow-hidden bg-[#0a0d14] mt-[74px] sm:mt-[84px] md:mt-[90px]">
      {/* Container with fixed proportions matching reference (approx 450-510px desktop) */}
      <div className="relative min-h-[440px] sm:min-h-[470px] lg:h-[500px] w-full flex items-center">

        {/* Right / Background Media Focal Area */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {loading ? (
            <div className="w-full h-full bg-[#0a0d14] flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#800020]/40 border-t-[#800020] animate-spin" />
            </div>
          ) : (
            <div className="relative w-full h-full">
              <video
                key={currentVideoUrl}
                ref={videoRef}
                src={currentVideoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                preload="auto"
                poster={videoConfig.posterUrl || undefined}
                className="w-full h-full object-cover object-right md:object-center opacity-85 scale-105"
              />
              {/* Atmospheric Dark & Smoky Gradient Overlays to match the reference look */}
              {/* Left-to-right gradient ensuring text on left is super readable on pure cinematic dark background */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14] via-[#0a0d14]/85 to-transparent sm:w-[68%] z-[1]" />
              {/* Subtle top and bottom dark edge vignettes */}
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0a0d14]/70 to-transparent z-[1]" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/70 to-transparent z-[1]" />
            </div>
          )}
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-[1360px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex items-center">
          <div className="max-w-[480px] lg:max-w-[520px] text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4 sm:space-y-5"
              >
                {/* 1. Eyebrow */}
                <div className="flex items-center gap-2">
                  <span className="text-[#B88D46] text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em]">
                    {slide.eyebrow}
                  </span>
                </div>

                {/* 2. Headline */}
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-[48px] text-white font-normal leading-[1.08] tracking-tight">
                  {slide.title}
                </h1>

                {/* 3. Description */}
                <p className="text-zinc-300 text-[12.5px] sm:text-[13.5px] leading-relaxed font-light max-w-[430px]">
                  {slide.description}
                </p>

                {/* 4. CTA Button */}
                <div className="pt-2">
                  <Link
                    to={slide.ctaLink}
                    className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 rounded-full bg-[#800020] hover:bg-[#650018] text-white text-[12px] sm:text-[13px] font-semibold tracking-wider transition-all duration-300 shadow-md hover:shadow-xl active:scale-95 group"
                  >
                    <span>{slide.ctaText}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slide Pagination Indicators */}
            <div className="flex items-center gap-2 pt-6 sm:pt-8">
              {HERO_SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 transition-all duration-300 rounded-full ${currentSlide === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Side Navigation Arrow: Left */}
        <button
          onClick={prevSlide}
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-xs cursor-pointer active:scale-95"
          aria-label="Previous slide"
        >
          <ChevronLeft size={16} />
        </button>

        {/* Side Navigation Arrow: Right */}
        <button
          onClick={nextSlide}
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-xs cursor-pointer active:scale-95"
          aria-label="Next slide"
        >
          <ChevronRight size={16} />
        </button>

        {/* Floating Sound Toggle */}
        <button
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute audio" : "Mute audio"}
          className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white transition-all shadow-md active:scale-95"
        >
          {isMuted ? (
            <VolumeX size={15} />
          ) : (
            <Volume2 size={15} />
          )}
        </button>
      </div>
    </section>
  );
};

export default Hero;
