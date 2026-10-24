import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../../components/Firebase';
import { collection, getDocs } from 'firebase/firestore';
import SectionHeader from './SectionHeader';
import ProductCard from '../ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

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

        // Ensure we always have at least 4 items so all 4 columns are filled without awkward blank gaps
        let combined = [...bestsellers];
        for (const item of activeList) {
          if (!combined.some(p => p.id === item.id)) {
            combined.push(item);
          }
          if (combined.length >= 8) break;
        }

        setProducts(combined.length > 0 ? combined : activeList);
      } catch (err) {
        console.error("Error loading bestseller products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading || products.length === 0) {
    return null;
  }

  return (
    <section className="py-10 sm:py-14 bg-[#FCF9F4] relative">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading with Decorative Gold Lines & Arrows */}
        <SectionHeader
          title="BEST"
          accent="SELLERS"
          onPrev={() => swiperRef.current?.slidePrev()}
          onNext={() => swiperRef.current?.slideNext()}
          showArrows={products.length > 4}
        />

        {/* Swiper Carousel: Guaranteed 4 columns on desktop, 3 on tablet, 2 on mobile */}
        <div className="mt-3">
          <Swiper
            onSwiper={(swiper) => { swiperRef.current = swiper; }}
            spaceBetween={18}
            slidesPerView={2}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 3, spaceBetween: 18 },
              1024: { slidesPerView: 4, spaceBetween: 20 }
            }}
            className="w-full !overflow-visible"
          >
            {products.map((product, idx) => (
              <SwiperSlide key={product.id}>
                <ProductCard product={product} idx={idx} triggerToast={triggerToast} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Centered Pill CTA: VIEW ALL BEST SELLERS → */}
        <div className="mt-8 sm:mt-10 flex justify-center">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#800020] hover:bg-[#650018] text-white text-[11.5px] font-semibold uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer active:scale-95 group"
          >
            <span>VIEW ALL BEST SELLERS</span>
            <span className="transform group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-[#30231F] text-white px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2.5"
          >
            <p className="text-[11.5px] font-medium tracking-wide whitespace-nowrap">{feedbackMessage}</p>
            <button onClick={() => setFeedbackMessage(null)} className="opacity-70 hover:opacity-100 ml-1 text-white">
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default BestsellerProducts;
export { BestsellerProducts as Bestsellers };
