import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, X, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../../components/Firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useStore } from '../../components/StoreProvider';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Mousewheel } from 'swiper/modules';
import OptimizedCloudinaryImage from '../OptimizedCloudinaryImage';

import 'swiper/css';
import ProductCard from '../ProductCard';

const BestsellerProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const swiperRef = useRef(null);

  const triggerToast = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA;
        });
        const activeList = list.filter(item => item.is_active !== false);
        const bestsellers = activeList.filter(p =>
          p.is_bestseller === true ||
          (Array.isArray(p.tags) && p.tags.some(t => (typeof t === 'string' ? t : t?.label)?.toLowerCase().includes('bestseller')))
        );
        setProducts(bestsellers.length > 0 ? bestsellers : activeList);
      } catch (err) {
        console.error("Error loading bestseller products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-12 md:py-16 bg-[#FAF8F5] border-t border-[#E5D5B8]/60">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="h-3 w-28 bg-zinc-200 animate-pulse mb-3 rounded-md" />
              <div className="h-8 w-60 bg-zinc-200 animate-pulse rounded-md" />
            </div>
            <div className="hidden sm:flex gap-2">
              <div className="w-10 h-10 rounded-full bg-zinc-200 animate-pulse" />
              <div className="w-10 h-10 rounded-full bg-zinc-200 animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-[#E5D5B8] p-3 space-y-3 rounded-2xl">
                <div className="w-full aspect-[3/4] bg-zinc-100 animate-pulse rounded-xl" />
                <div className="h-4 bg-zinc-200 animate-pulse w-3/4 rounded" />
                <div className="h-4 bg-zinc-200 animate-pulse w-1/2 rounded" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-14 md:py-20 bg-[#FAF8F5] overflow-hidden border-t border-[#E5D5B8]/60 relative">
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Premium Header Layout */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1 flex flex-col md:flex-row md:items-end gap-6 md:gap-12">
            <div>
              <p className="text-[10px] sm:text-[14px] tracking-[0.3em] text-[#B8860B] uppercase mb-2 font-bold flex items-center gap-2">
                <span>HAUTE SELECTION</span>
                <span>•</span>
                <span>CURATED EXTRAITS</span>
              </p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extralight tracking-[0.15em] text-[#0D0D0D] uppercase whitespace-nowrap">
                Bestseller
              </h2>
            </div>
            <div className="hidden md:block flex-1 h-[1px] bg-gradient-to-r from-[#B8860B]/40 via-zinc-300 to-transparent mb-3" />
          </div>

          <div className="flex items-center gap-6 self-start md:self-auto">
            <div className="flex gap-2.5">
              <button
                onClick={() => swiperRef.current?.slidePrev()}
                aria-label="Previous slide"
                className="w-10 h-10 rounded-full border border-[#E5D5B8] bg-white flex items-center justify-center text-zinc-700 hover:text-white hover:bg-[#B8860B] hover:border-[#B8860B] transition-all duration-300 cursor-pointer shadow-md"
              >
                &larr;
              </button>
              <button
                onClick={() => swiperRef.current?.slideNext()}
                aria-label="Next slide"
                className="w-10 h-10 rounded-full border border-[#E5D5B8] bg-white flex items-center justify-center text-zinc-700 hover:text-white hover:bg-[#B8860B] hover:border-[#B8860B] transition-all duration-300 cursor-pointer shadow-md"
              >
                &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Swiper Carousel */}
        <div className="w-full">
          <Swiper
            onSwiper={(swiper) => { swiperRef.current = swiper; }}
            spaceBetween={18}
            slidesPerView={1.15}
            mousewheel={{
              forceToAxis: true,
              sensitivity: 1,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2.2,
                spaceBetween: 18,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 20,
              },
              1200: {
                slidesPerView: 4,
                spaceBetween: 22,
              },
            }}
            modules={[Mousewheel]}
            className="w-full overflow-visible"
          >
            {products.map((product, idx) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} idx={idx} triggerToast={triggerToast} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Centered Outlined CTA */}
        <div className="md:mt-16 mt-10 flex justify-center">
          <Link
            to="/shop"
            className="group flex items-center justify-center gap-3 px-10 py-4 border border-[#0D0D0D] bg-[#0D0D0D] text-white text-[11px] font-extrabold uppercase tracking-[0.28em] transition-all duration-300 hover:bg-[#B8860B] hover:border-[#B8860B] rounded-full shadow-lg"
          >
            <span>View All New Arrivals</span>
            <span className="transform group-hover:translate-x-1.5 transition-transform duration-300">&rarr;</span>
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

export default BestsellerProducts;
export { BestsellerProducts as Bestsellers };
