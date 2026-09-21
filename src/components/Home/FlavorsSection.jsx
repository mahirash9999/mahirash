import React from 'react';
import { motion } from 'framer-motion';
import OptimizedCloudinaryImage from '../OptimizedCloudinaryImage';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Mousewheel } from 'swiper/modules';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import 'swiper/css';
import 'swiper/css/pagination';

const olfactoryFamilies = [
  {
    id: 1,
    name: "Royal Oud & Woods",
    subtitle: "Smoky · Mysterious · Opulent",
    tag: "Extrait De Parfum",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=600&auto=format&fit=crop"
  },
  {
    id: 2,
    name: "Amber & Warm Spices",
    subtitle: "Sensual · Exotic · Enveloping",
    tag: "Oriental Blend",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop"
  },
  {
    id: 3,
    name: "Rare Floral Essences",
    subtitle: "Blooming · Elegant · Sublime",
    tag: "Artisanal Extract",
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop"
  },
  {
    id: 4,
    name: "Zesty Royal Citrus",
    subtitle: "Crisp · Vibrant · Radiant",
    tag: "Fresh Cologne",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop"
  },
  {
    id: 5,
    name: "Gourmand Vanilla & Musk",
    subtitle: "Velvet · Sweet · Decadent",
    tag: "Private Reserve",
    image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=600&auto=format&fit=crop"
  }
];

const OlfactoryCard = ({ family }) => {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-[#0f0f0f] p-5 flex flex-col justify-between h-full relative border border-zinc-800 shadow-xl hover:border-[#b8860b]/60 transition-all duration-300 group"
    >
      <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[#b8860b]/40"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[#b8860b]/40"></div>

      <div>
        <div className="w-full aspect-[4/3] relative overflow-hidden bg-black border border-zinc-800">
          <OptimizedCloudinaryImage
            src={family.image}
            alt={family.name}
            preset="product-card"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </div>

        <div className="flex flex-col items-center text-center mt-6">
          <h3 className="text-lg font-serif tracking-wider uppercase text-white mb-1.5">
            {family.name}
          </h3>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#b8860b] mb-4">
            {family.subtitle}
          </p>

          <div className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300 px-3 py-1 tracking-widest uppercase">
            {family.tag}
          </div>
        </div>
      </div>

      <div className="w-full pt-6 mt-4 flex justify-center">
        <Link to="/shop" className="relative px-6 py-2.5 bg-white text-black hover:bg-[#b8860b] hover:text-white transition-all duration-300 text-[10px] font-black uppercase tracking-[0.2em]">
          Explore Notes
        </Link>
      </div>
    </motion.div>
  );
};

const FlavorsSection = () => {
  return (
    <section className="py-20 md:py-24 relative overflow-hidden bg-[#050505] border-y border-zinc-800">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">

        <div className="text-center mb-14 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 mb-3"
          >
            <div className="h-[1px] w-12 bg-[#b8860b]/40" />
            <span className="text-[#b8860b] uppercase text-[10px] font-semibold tracking-[0.3em]">
              THE OLFACTORY MATRIX
            </span>
            <div className="h-[1px] w-12 bg-[#b8860b]/40" />
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extralight text-white tracking-[0.15em] uppercase max-w-3xl leading-[1.1] mb-4 font-serif">
            Artisanal <span className="text-[#b8860b] italic font-serif">Fragrance Families</span>
          </h2>
          <p className="text-zinc-400 text-[14px] md:text-sm max-w-xl font-normal tracking-wide">
            Each Mahirash creation is built around masterfully harmonized top, heart, and base accords.
          </p>
        </div>

        <div>
          <Swiper
            modules={[Autoplay, Pagination, Mousewheel]}
            spaceBetween={24}
            slidesPerView={1.2}
            pagination={{ clickable: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            mousewheel={{ forceToAxis: true }}
            breakpoints={{
              640: { slidesPerView: 2.1 },
              768: { slidesPerView: 2.5 },
              1024: { slidesPerView: 3.2 },
              1280: { slidesPerView: 4 },
            }}
            className="pb-14 premium-flavor-swiper"
          >
            {olfactoryFamilies.map((family, index) => (
              <SwiperSlide key={family.id} className="h-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.8 }}
                >
                  <OlfactoryCard family={family} />
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .premium-flavor-swiper .swiper-pagination-bullet {
          background: #ffffff !important;
          opacity: 0.2;
          width: 8px;
          height: 8px;
          transition: all 0.4s ease;
          border: 1px solid #b8860b;
        }
        .premium-flavor-swiper .swiper-pagination-bullet-active {
          opacity: 1;
          background: #b8860b !important;
          width: 24px;
          border-radius: 4px;
        }
        .premium-flavor-swiper .swiper-pagination {
          bottom: 0px !important;
        }
      `}} />

    </section>
  );
};

export default FlavorsSection;
