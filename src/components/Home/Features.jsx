import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import OptimizedCloudinaryImage from '../OptimizedCloudinaryImage';

const CollectionHighlights = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const pillars = [
    {
      id: '01',
      tag: 'Pure Flax',
      title: 'The Raw Linen Edit',
      desc: 'Harvested ethically, unbleached, woven loosely to preserve structural airflow. Designed for natural, dynamic drapes.',
      image: 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1000&auto=format&fit=crop',
      link: '/shop?fabric=linen'
    },
    {
      id: '02',
      tag: 'Monochrome',
      title: 'Architectural Neutrals',
      desc: 'An exploration of geometric silhouettes draped in raw canvas, charcoal sand, and deep obsidian hues.',
      image: 'https://images.unsplash.com/photo-1509319117193-57bab727e09d?q=80&w=1000&auto=format&fit=crop',
      link: '/shop?collection=neutrals'
    },
    {
      id: '03',
      tag: 'Handmade',
      title: 'The Artisanal Atelier',
      desc: 'Small-batch pieces featuring hand-finished selvedge edges and mother-of-pearl buttons, crafted by master artisans.',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop',
      link: '/shop?collection=atelier'
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-[#0d0d0d] overflow-hidden">
      <div className="max-w-7xl py-3 mx-auto px-5 md:px-10 lg:px-14">

        {/* Header */}
        <div className="pb-10 border-b border-white/[0.06] mb-12">
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/25   block mb-3">The Blueprint</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase">
            Curated Collections
          </h2>
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Image Block */}
          <div className="order-first lg:order-last">
            <div className="relative w-full aspect-[4/5] sm:aspect-square bg-[#1a1a1a] overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.215, 0.61, 0.355, 1] }}
                  className="w-full h-full"
                >
                  <OptimizedCloudinaryImage
                    src={pillars[activeIndex].image}
                    alt={pillars[activeIndex].title}
                    preset="product-grid"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/30 via-transparent to-transparent" />
                </motion.div>
              </AnimatePresence>

              {/* Tag chip */}
              <div className="absolute top-4 left-4 bg-white px-3 py-1.5">
                <span className="text-[9px] uppercase tracking-[0.25em] font-black text-black">
                  {pillars[activeIndex].tag}
                </span>
              </div>
            </div>
          </div>

          {/* Accordion List */}
          <div className="divide-y divide-white/[0.06] w-full">
            {pillars.map((pillar, idx) => (
              <div
                key={pillar.id}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => setActiveIndex(idx)}
                className={`py-7 first:pt-0 last:pb-0 cursor-pointer group transition-all duration-400 ${activeIndex === idx ? 'opacity-100' : 'opacity-30 hover:opacity-60'
                  }`}
              >
                <div className="flex items-start justify-between gap-6">
                  <div className="space-y-2.5 max-w-md flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black tracking-widest text-white/30 font-mono">{pillar.id}</span>
                      <span className="text-[9px] tracking-[0.2em] font-black uppercase text-white/30 border border-white/10 px-2 py-0.5">
                        {pillar.tag}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                      {pillar.title}
                    </h3>

                    {/* Expand */}
                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${activeIndex === idx ? 'max-h-[200px] opacity-100 pt-1' : 'max-h-0 opacity-0'}`}>
                      <p className="text-[13px] text-white/40 leading-relaxed mb-4">{pillar.desc}</p>
                      <Link
                        to={pillar.link}
                        className="inline-flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] uppercase text-white hover:text-white/60 transition-colors"
                      >
                        View Collection
                        <ArrowUpRight size={12} />
                      </Link>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all duration-400 shrink-0 mt-1 ${activeIndex === idx
                    ? 'bg-white border-white text-black rotate-[-45deg]'
                    : 'border-white/10 text-white/10'
                    }`}>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollectionHighlights;