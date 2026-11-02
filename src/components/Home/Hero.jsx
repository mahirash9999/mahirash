import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../../components/Firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';

const FALLBACK_LUXURY_VIDEO = 'https://res.cloudinary.com/djmfxpemz/video/upload/v1789045664/xr1u182rnbyoxu0dtbtp.mp4';

const FALLBACK_SLIDES = [
  {
    id: 'default-1',
    mediaType: 'video',
    mediaUrl: FALLBACK_LUXURY_VIDEO,
    mobileMediaUrl: '',
    posterUrl: '',
    eyebrow: 'PREMIUM FRAGRANCES',
    title: 'Fragrances That Define You',
    description: 'A perfect blend of luxury, elegance and long lasting impressions. Discover our exclusive collection of premium perfumes.',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'default-2',
    mediaType: 'video',
    mediaUrl: FALLBACK_LUXURY_VIDEO,
    mobileMediaUrl: '',
    posterUrl: '',
    eyebrow: 'ARTISAN EXTRAITS',
    title: 'Pure Essence of Royalty',
    description: 'Handcrafted with rare botanical oils and aged Cambodian oud for an unforgettable presence.',
    ctaText: 'Explore Collection',
    ctaLink: '/shop?category=Oud',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'default-3',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1920&q=80',
    mobileMediaUrl: '',
    posterUrl: '',
    eyebrow: 'LUXURY PERFUMES',
    title: 'Elegance in Every Drop',
    description: 'Formulated to captivate and linger with unmatched projection and sophisticated warmth.',
    ctaText: 'Discover Scent',
    ctaLink: '/shop',
    sort_order: 3,
    is_active: true
  }
];

const Hero = () => {
  const [slides, setSlides] = useState([]);
  const [displayMode, setDisplayMode] = useState('all'); // 'all' | 'video_only' | 'image_only'
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef(null);

  // 1. Fetch live slides from Firestore & cache in localStorage
  useEffect(() => {
    // Check local cache for immediate render
    try {
      const cached = localStorage.getItem('mahirash_hero_slides_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed);
          setLoading(false);
        }
      }
    } catch (e) {
      // ignore
    }

    // Fetch displayMode setting
    const fetchMode = async () => {
      try {
        const docRef = doc(db, 'hero_video', 'settings');
        const snap = await getDoc(docRef);
        if (snap.exists() && snap.data().displayMode) {
          setDisplayMode(snap.data().displayMode);
        }
      } catch (err) {
        console.warn('Error reading hero displayMode:', err);
      }
    };
    fetchMode();

    // Real-time subscription to hero_slides
    const unsubscribe = onSnapshot(collection(db, 'hero_slides'), (snapshot) => {
      if (!snapshot.empty) {
        const list = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(s => s.is_active !== false)
          .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

        if (list.length > 0) {
          setSlides(list);
          try {
            localStorage.setItem('mahirash_hero_slides_cache', JSON.stringify(list));
          } catch (e) {
            // ignore
          }
        } else {
          setSlides(FALLBACK_SLIDES);
        }
      } else {
        setSlides(FALLBACK_SLIDES);
      }
      setLoading(false);
    }, (error) => {
      console.warn('Using fallback slides on error:', error);
      setSlides(FALLBACK_SLIDES);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter slides according to displayMode
  const activeSlides = (slides.length > 0 ? slides : FALLBACK_SLIDES).filter(s => {
    const isVid = s.mediaType === 'video' || s.mediaUrl?.includes('.mp4') || s.mediaUrl?.includes('/video/');
    if (displayMode === 'video_only') return isVid;
    if (displayMode === 'image_only') return !isVid;
    return true;
  });

  const validSlides = activeSlides.length > 0 ? activeSlides : FALLBACK_SLIDES;

  // Keep index within bounds
  useEffect(() => {
    if (currentSlide >= validSlides.length) {
      setCurrentSlide(0);
    }
  }, [validSlides.length, currentSlide]);

  // Autoplay slider (6 seconds interval, pauses when hovering)
  useEffect(() => {
    if (validSlides.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % validSlides.length);
    }, 6500);

    return () => clearInterval(interval);
  }, [validSlides.length, isHovered]);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % validSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + validSlides.length) % validSlides.length);
  };

  const slide = validSlides[currentSlide] || validSlides[0];

  const isCurrentSlideVideo =
    slide.mediaType === 'video' ||
    slide.mediaUrl?.includes('.mp4') ||
    slide.mediaUrl?.includes('/video/') ||
    slide.mediaUrl?.endsWith('.webm') ||
    slide.mediaUrl?.endsWith('.mov');

  const currentMediaUrl = (typeof window !== 'undefined' && window.innerWidth <= 640 && slide.mobileMediaUrl)
    ? slide.mobileMediaUrl
    : (slide.mediaUrl || FALLBACK_LUXURY_VIDEO);

  return (
    <section
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative w-full overflow-hidden bg-[#0a0d14] mt-[74px] sm:mt-[84px] md:mt-[90px]"
    >
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
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide.id || currentSlide}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {isCurrentSlideVideo ? (
                    <video
                      ref={videoRef}
                      src={currentMediaUrl}
                      autoPlay
                      loop
                      muted={isMuted}
                      playsInline
                      preload="auto"
                      poster={slide.posterUrl || undefined}
                      className="w-full h-full object-cover object-right md:object-center opacity-85 scale-105"
                    />
                  ) : (
                    <img
                      src={currentMediaUrl}
                      alt={slide.title || 'Mahirash Perfumes'}
                      className="w-full h-full object-cover object-right md:object-center opacity-85 scale-105"
                    />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Atmospheric Dark & Smoky Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14] via-[#0a0d14]/85 to-transparent sm:w-[68%] z-[1]" />
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
                key={slide.id || currentSlide}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-4 sm:space-y-5"
              >
                {/* 1. Eyebrow */}
                {/* <div className="flex items-center gap-2">
                  <span className="text-[#B88D46] text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em]">
                    {slide.eyebrow || 'PREMIUM FRAGRANCES'}
                  </span>
                </div> */}

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
                    to={slide.ctaLink || '/shop'}
                    className="inline-flex items-center gap-2.5 px-6 sm:px-7 py-3 rounded-full bg-[#800020] hover:bg-[#650018] text-white text-[12px] sm:text-[13px] font-semibold tracking-wider transition-all duration-300 shadow-md hover:shadow-xl active:scale-95 group"
                  >
                    <span>{slide.ctaText || 'Shop Now'}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Slide Pagination Indicators */}
            {validSlides.length > 1 && (
              <div className="flex items-center gap-2 pt-6 sm:pt-8">
                {validSlides.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                      currentSlide === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Side Navigation Arrow: Left */}
        {validSlides.length > 1 && (
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-xs cursor-pointer active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Side Navigation Arrow: Right */}
        {validSlides.length > 1 && (
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-black/30 hover:bg-black/60 border border-white/20 text-white flex items-center justify-center transition-all duration-200 backdrop-blur-xs cursor-pointer active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight size={16} />
          </button>
        )}

        {/* Floating Sound Toggle (only visible when active slide is a video) */}
        {isCurrentSlideVideo && (
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute audio" : "Mute audio"}
            className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20 p-2 sm:p-2.5 rounded-full bg-black/40 hover:bg-black/70 border border-white/20 text-white transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {isMuted ? (
              <VolumeX size={15} />
            ) : (
              <Volume2 size={15} />
            )}
          </button>
        )}
      </div>
    </section>
  );
};

export default Hero;
