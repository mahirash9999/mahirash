import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../Firebase';
import { collection, getDocs } from 'firebase/firestore';
import SectionHeader from './SectionHeader';
import ProductCard from '../ProductCard';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const parseMl = (str) => {
  if (!str) return null;
  const match = String(str).toLowerCase().match(/(\d+(?:\.\d+)?)\s*(ml)/);
  if (match) return parseFloat(match[1]);
  return null;
};

const isMiniatureProduct = (product) => {
  if (!product) return false;
  if (product.is_miniature === true || product.isMiniature === true) return true;
  const nameLower = (product.name || '').toLowerCase();
  if (nameLower.includes('sample') || nameLower.includes('miniature') || nameLower.includes('discovery') || nameLower.includes('travel set') || nameLower.includes('tester')) {
    return true;
  }
  if (product.sizes) {
    const parts = String(product.sizes).split(',');
    for (const part of parts) {
      const ml = parseMl(part);
      if (ml !== null && ml <= 10) return true;
    }
  }
  if (Array.isArray(product.size_prices) && product.size_prices.length > 0) {
    const hasMiniatureVariant = product.size_prices.some(sp => {
      const ml = parseMl(sp?.size);
      return ml !== null && ml <= 10;
    });
    if (hasMiniatureVariant) return true;
  }
  if (product.volume || product.size) {
    const ml = parseMl(product.volume || product.size);
    if (ml !== null && ml <= 10) return true;
  }
  return false;
};

const RandomProducts = () => {
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
        if (!snap.empty) {
          const list = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(item => item.is_active !== false);

          const miniatureProducts = list.filter(isMiniatureProduct);
          const displayList = miniatureProducts.length > 0 ? miniatureProducts : list.slice(0, 4);
          setProducts(displayList);
        }
      } catch (err) {
        console.error("Error loading miniature products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading || products.length === 0) {
    return null;
  }

  const isFew = products.length <= 3;

  return (
    <section className="py-10 sm:py-14 bg-[#FCF9F4] relative">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading with Decorative Gold Lines & Arrows */}
        <SectionHeader
          title="SHOP"
          accent="MINIATURES"
          onPrev={() => swiperRef.current?.slidePrev()}
          onNext={() => swiperRef.current?.slideNext()}
          showArrows={products.length > 3}
        />

        {/* Product Cards Layout: Centered 2-card or 3-card layout with generous proportions */}
        {isFew ? (
          <div className="flex justify-center mt-3">
            <div
              className={`grid gap-4 sm:gap-6 w-full ${
                products.length === 2
                  ? 'max-w-[700px] grid-cols-2'
                  : 'max-w-[1020px] grid-cols-2 md:grid-cols-3'
              }`}
            >
              {products.map((product, idx) => (
                <div key={product.id} className="w-full">
                  <ProductCard
                    product={product}
                    idx={idx}
                    preferredSize="miniature"
                    triggerToast={triggerToast}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
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
                  <ProductCard
                    product={product}
                    idx={idx}
                    preferredSize="miniature"
                    triggerToast={triggerToast}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* Centered Pill CTA: VIEW ALL MINIATURES → */}
        <div className="mt-8 sm:mt-10 flex justify-center">
          <Link
            to="/shop?size=1-10ML"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-[#800020] hover:bg-[#650018] text-white text-[11.5px] font-semibold uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer active:scale-95 group"
          >
            <span>VIEW ALL MINIATURES</span>
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

export default RandomProducts;
