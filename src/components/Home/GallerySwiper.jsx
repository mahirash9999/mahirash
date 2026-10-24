import React, { useState, useEffect, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay } from 'swiper/modules';
import { db } from '../Firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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

        setProducts(newArrivals.length > 0 ? newArrivals : activeList.slice(0, 10));
      } catch (err) {
        console.error("Error loading gallery products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  if (loading || products.length === 0) {
    return null;
  }

  const slides = products.map(p => ({
    id: p.id,
    image: p.image || p.images?.[0] || '',
    brand: p.brand || 'MAHIRASH',
    title: p.name,
    category: p.category || 'EAU DE PARFUM',
    price: p.price,
    tags: p.tags,
    badge: p.badge || (p.is_bestseller ? 'BESTSELLER' : (p.is_new ? 'NEW' : null))
  }));

  const currentSlide = slides[activeIndex] || slides[0] || {};

  return (
    <section className="py-10 sm:py-14 bg-[#FCF9F4] overflow-hidden relative">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading with Decorative Gold Lines */}
        <SectionHeader title="RECENT" accent="ARRIVALS" />

        {/* Carousel Stage Container */}
        <div className="relative w-full max-w-5xl mx-auto py-2 sm:py-4">

          {/* Side Nav Button Left */}
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Previous slide"
            className="absolute -left-2 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-8 sm:w-9 h-8 sm:h-9 rounded-full border border-[#E9DCCB] bg-white/95 text-[#30231F] hover:text-[#800020] hover:border-[#800020] transition-all flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
          >
            <ChevronLeft size={17} />
          </button>

          {/* Side Nav Button Right */}
          <button
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Next slide"
            className="absolute -right-2 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-8 sm:w-9 h-8 sm:h-9 rounded-full border border-[#E9DCCB] bg-white/95 text-[#30231F] hover:text-[#800020] hover:border-[#800020] transition-all flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
          >
            <ChevronRight size={17} />
          </button>

          <div className="overflow-visible recent-arrivals-swiper">
            <Swiper
              effect={'coverflow'}
              grabCursor={true}
              centeredSlides={true}
              slidesPerView={'auto'}
              loop={slides.length > 4}
              speed={700}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              coverflowEffect={{
                rotate: 0,
                stretch: 24,
                depth: 130,
                modifier: 1.15,
                slideShadows: false,
              }}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              onSlideChange={(swiper) => {
                setActiveIndex(swiper.realIndex);
              }}
              modules={[EffectCoverflow, Autoplay]}
              className="w-full !overflow-visible"
            >
              {slides.map((slide, idx) => (
                <SwiperSlide
                  key={slide.id || idx}
                  onClick={() => navigate(`/product/${slide.id}`)}
                  className="relative overflow-hidden bg-white rounded-lg border border-[#E9E0D6] shadow-sm cursor-pointer transition-all duration-500 group"
                >
                  {/* Optional Badge */}
                  {slide.badge && (
                    <div className="absolute top-2.5 left-2.5 z-20">
                      <span className="bg-[#111111] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs">
                        {slide.badge}
                      </span>
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="w-full h-full p-2.5 flex items-center justify-center bg-[#FCF9F4]/40">
                    <OptimizedCloudinaryImage
                      src={slide.image}
                      alt={slide.title}
                      preset="product-grid"
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* Product Details under Carousel for Active Slide */}
        <div className="mt-4 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] sm:text-[10.5px] uppercase tracking-[0.2em] text-[#75665D] font-medium">
            {currentSlide.category}
          </span>
          <h3
            onClick={() => navigate(`/product/${currentSlide.id}`)}
            className="text-[13.5px] sm:text-[15px] font-semibold text-[#30231F] uppercase tracking-wide cursor-pointer hover:text-[#800020] transition-colors mt-0.5"
          >
            {currentSlide.title}
          </h3>
          {currentSlide.price !== undefined && (
            <span className="text-[13.5px] sm:text-[15px] font-bold text-[#800020] mt-0.5">
              ₹{Number(currentSlide.price).toLocaleString('en-IN')}
            </span>
          )}
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .recent-arrivals-swiper .swiper {
            overflow: visible !important;
          }
          .recent-arrivals-swiper .swiper-slide {
            width: 185px;
            height: 240px;
            opacity: 0.55;
            transform: scale(0.86);
            transition: all 0.5s ease;
          }
          @media (min-width: 640px) {
            .recent-arrivals-swiper .swiper-slide {
              width: 220px;
              height: 280px;
            }
          }
          @media (min-width: 1024px) {
            .recent-arrivals-swiper .swiper-slide {
              width: 240px;
              height: 305px;
            }
          }
          .recent-arrivals-swiper .swiper-slide-active {
            opacity: 1 !important;
            transform: scale(1.06) !important;
            border-color: #800020 !important;
            box-shadow: 0 12px 30px -6px rgba(128, 0, 32, 0.18) !important;
            z-index: 10;
          }
        `
      }} />
    </section>
  );
};

export default GallerySwiper;
