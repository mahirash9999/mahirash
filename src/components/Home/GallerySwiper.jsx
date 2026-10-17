import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay, Mousewheel } from 'swiper/modules';
import { db } from '../Firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles, Eye } from 'lucide-react';
import SectionHeader from './SectionHeader';
import OptimizedCloudinaryImage from '../OptimizedCloudinaryImage';

import 'swiper/css';
import 'swiper/css/effect-coverflow';

const GallerySwiper = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const snap = await getDocs(collection(db, "products"));
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetched.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA;
        });

        const activeList = fetched.filter(p => p.is_active !== false);
        const newArrivals = activeList.filter(p =>
          p.is_new_arrival === true ||
          p.is_new === true ||
          (Array.isArray(p.tags) && p.tags.some(t => (typeof t === 'string' ? t : t?.label)?.toLowerCase().includes('new arrival')))
        );

        setProducts(newArrivals.length > 0 ? newArrivals : activeList.slice(0, 8));
      } catch (err) {
        console.error("Error loading gallery products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-[#FAF8F5] border-t border-[#E5D5B8]/40">
        <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14">
          <div className="flex flex-col items-center mb-8">
            <div className="h-3 w-32 bg-stone-200 animate-pulse mb-3" />
            <div className="h-8 w-64 bg-stone-300 animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-6 overflow-hidden py-4">
            <div className="w-[220px] sm:w-[280px] h-[320px] sm:h-[400px] bg-stone-200 animate-pulse shrink-0 opacity-40 scale-90" />
            <div className="w-[260px] sm:w-[340px] h-[380px] sm:h-[480px] bg-stone-300 animate-pulse shrink-0 shadow-xl" />
            <div className="w-[220px] sm:w-[280px] h-[320px] sm:h-[400px] bg-stone-200 animate-pulse shrink-0 opacity-40 scale-90" />
          </div>
        </div>
      </section>
    );
  }

  const slides = products.length > 0
    ? products.map(p => ({
      id: p.id,
      image: p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800',
      brand: p.brand || 'MAHIRASH',
      title: p.name,
      subtitle: p.category || 'EXTRAIT DE PARFUM',
      price: p.price,
      tags: p.tags,
      tag: p.tag,
      isProduct: true
    }))
    : [];

  const currentSlide = slides[activeIndex] || {};
  const formattedIndex = (activeIndex + 1).toString().padStart(2, '0');
  const formattedTotal = slides.length.toString().padStart(2, '0');

  return (
    <section className="py-14 md:py-24 bg-[#FAF8F5] overflow-x-hidden relative border-t border-[#E5D5B8]/40">
      {/* Opulent Luxury Radial Backdrop Glow & Watermark */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[12vw] text-[#0D0D0D]/[0.02] tracking-[0.25em] uppercase select-none pointer-events-none whitespace-nowrap">
        MAHIRASH
      </div>

      <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-14 relative z-10">

        {/* Centered Section Header without eyebrow */}
        <div className="mb-8 md:mb-12 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-[0.15em] text-[#0D0D0D] uppercase text-center">
            RECENT <span className="text-[#B8860B] italic font-serif">ARRIVALS</span>
          </h2>
        </div>

        {/* Swiper Container */}
        <div className="relative w-full py-6 gallery-swiper-luxury overflow-x-hidden">
          <Swiper
            effect={'coverflow'}
            grabCursor={true}
            centeredSlides={true}
            slidesPerView={'auto'}
            loop={slides.length > 3}
            speed={1000}
            mousewheel={{
              forceToAxis: true,
              sensitivity: 1,
            }}
            autoplay={{
              delay: 3800,
              disableOnInteraction: false,
            }}
            coverflowEffect={{
              rotate: 0,
              stretch: -30,
              depth: 300,
              modifier: 1,
              slideShadows: false,
            }}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.realIndex);
            }}
            modules={[EffectCoverflow, Autoplay, Mousewheel]}
            className="w-full overflow-visible"
          >
            {slides.map((slide, idx) => {
              return (
                <SwiperSlide
                  key={idx}
                  onClick={() => slide.isProduct && navigate(`/product/${slide.id}`)}
                  className="relative overflow-hidden bg-white rounded-2xl border border-[#E5D5B8] shadow-xl cursor-pointer group transition-all duration-700"
                >
                  {/* Dynamic Labels */}
                  {(() => {
                    const rawTags = Array.isArray(slide.tags) && slide.tags.length > 0 ? slide.tags : (slide.tag ? [slide.tag] : []);
                    const tagsToDisplay = Array.from(new Map(rawTags.map(t => [typeof t === "object" ? t.label : t, t])).values());

                    if (tagsToDisplay.length > 0) {
                      return (
                        <div className="absolute left-4 top-4 z-30 flex flex-col gap-1.5">
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
                      )
                    }

                    return (
                      <div className="absolute top-4 left-4 z-20 bg-white/90 backdrop-blur-md border border-[#E5D5B8] px-3 py-1 text-[#B8860B] text-[12px] uppercase tracking-[0.25em] font-bold shadow-sm rounded-full">
                        {slide.brand}
                      </div>
                    )
                  })()}

                  {/* Image */}
                  <OptimizedCloudinaryImage
                    src={slide.image}
                    alt={slide.title}
                    preset="product-grid"
                    className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-108"
                  />

                  {/* Light Vignette Wash */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10 transition-opacity duration-500 opacity-80 group-hover:opacity-90" />

                  {/* Golden Frame Accent Line */}
                  <div className="absolute inset-2 border border-[#B8860B]/0 group-hover:border-[#B8860B]/80 rounded-xl transition-colors duration-500 z-20 pointer-events-none" />

                  {/* Corner Gold Leaf Accents */}
                  <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-[#B8860B] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-[#B8860B] z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Hover Quick Action Indicator */}
                  <div className="absolute bottom-5 inset-x-5 z-20 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
                    <span className="text-white text-[12px] font-bold uppercase tracking-[0.25em] flex items-center gap-1.5 drop-shadow">
                      <Eye size={13} className="text-[#E5D5B8]" /> View Scent
                    </span>
                    <span className="w-8 h-8 rounded-full bg-[#0D0D0D] text-white flex items-center justify-center text-[14px] font-bold shadow-md">
                      &rarr;
                    </span>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>

        {/* Dynamic centered slide content below swiper */}
        <div className="mt-8 flex flex-col items-center justify-center text-center px-4">
          <div className="flex items-center gap-1.5 text-[12px] uppercase tracking-[0.28em] font-bold text-[#B8860B] mb-2">
            <span>{currentSlide.brand || 'MAHIRASH'}</span>
            {currentSlide.subtitle && <span className="text-stone-500">• {currentSlide.subtitle}</span>}
          </div>

          <div className="flex items-center justify-center gap-6 max-w-2xl w-full">
            {/* Left Scroller Button */}
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="Previous slide"
              className="w-10 h-10 rounded-full border border-[#E5D5B8] bg-white text-[#0D0D0D] hover:text-white hover:bg-[#0D0D0D] hover:border-[#0D0D0D] transition-all duration-300 flex items-center justify-center cursor-pointer shadow-md"
            >
              <span className="text-sm select-none">&larr;</span>
            </button>

            {/* Slide Title */}
            <h4
              onClick={() => currentSlide.isProduct && navigate(`/product/${currentSlide.id}`)}
              className="text-lg sm:text-xl font-light text-[#0D0D0D] tracking-[0.15em] uppercase leading-snug line-clamp-1 flex-1 cursor-pointer hover:text-[#B8860B] transition-colors"
            >
              {currentSlide.title || 'Loading...'}
            </h4>

            {/* Right Scroller Button */}
            <button
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="Next slide"
              className="w-10 h-10 rounded-full border border-[#E5D5B8] bg-white text-[#0D0D0D] hover:text-white hover:bg-[#0D0D0D] hover:border-[#0D0D0D] transition-all duration-300 flex items-center justify-center cursor-pointer shadow-md"
            >
              <span className="text-sm select-none">&rarr;</span>
            </button>
          </div>

          {currentSlide.price !== undefined && currentSlide.price !== null && (
            <span className="text-sm font-bold text-[#B8860B] tracking-widest mt-2 block font-mono">
              INR {Number(currentSlide.price).toLocaleString("en-IN")}.00
            </span>
          )}
        </div>

      </div>

      {/* Styled overrides for coverflow 3D slider */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .gallery-swiper-luxury .swiper {
            overflow: visible !important;
          }
          .gallery-swiper-luxury .swiper-slide {
            width: 250px;
            height: 360px;
            opacity: 0.65;
            filter: brightness(0.95);
            transform: scale(0.88);
            transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
          }
          @media (min-width: 640px) {
            .gallery-swiper-luxury .swiper-slide {
              width: 330px;
              height: 460px;
            }
          }
          @media (min-width: 1024px) {
            .gallery-swiper-luxury .swiper-slide {
              width: 350px;
              height: 490px;
            }
          }
          .gallery-swiper-luxury .swiper-slide-active {
            opacity: 1;
            filter: brightness(1);
            transform: scale(1.04);
            border-color: #B8860B !important;
            box-shadow: 0 20px 45px -10px rgba(184, 134, 11, 0.25), 0 0 15px rgba(184, 134, 11, 0.15);
            z-index: 10;
          }
        `
      }} />
    </section>
  );
};

export default GallerySwiper;

