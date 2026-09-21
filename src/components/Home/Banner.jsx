import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import OptimizedCloudinaryImage from '../OptimizedCloudinaryImage';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.7, ease: [0.215, 0.61, 0.355, 1] }
};
 
const EditorialStory = () => {
  return (
    <section className="py-10 md:py-28 bg-[#111111] overflow-hidden">
      <div className="max-w-7xl py-3 mx-auto px-5 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: Asymmetric Double Image Panel ── */}
          <div className="grid grid-cols-12 gap-3 sm:gap-4 relative">
            {/* Primary large image */}
            <motion.div
              {...fadeUp}
              className="col-span-7 aspect-[3/4] overflow-hidden relative group"
            >
              <OptimizedCloudinaryImage
                src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1000&auto=format&fit=crop"
                alt="Premium craft"
                preset="product-grid"
                className="w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </motion.div>

            {/* Secondary offset image */}
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.18 }}
              className="col-span-5 aspect-[3/4] overflow-hidden mt-12 sm:mt-20 relative group"
            >
              <OptimizedCloudinaryImage
                src="https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop"
                alt="Artisanal fashion"
                preset="product-card"
                className="w-full h-full object-cover object-center transition-transform duration-[1.5s] ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </motion.div>

            {/* Floating Year Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 lg:bottom-auto lg:top-1/2 lg:-right-6 lg:left-auto lg:translate-x-0 lg:-translate-y-1/2 z-10 bg-white text-black px-5 py-3"
            >
              <span className="text-[9px] uppercase tracking-[0.3em] font-black block text-black/40 mb-0.5">Since</span>
              <span className="text-2xl font-black">2024</span>
            </motion.div>
          </div>

          {/* ── Right: Narrative Copy ── */}
          <div className="space-y-7 lg:pl-4">
            <motion.div {...fadeUp}>
              <span className="text-[10px] uppercase tracking-[0.3em] text-white/30   block mb-4">
                Our Philosophy
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-light text-white tracking-widest uppercase mb-6">
                Conscious Craft,<br />Timeless Design.
              </h3>
            </motion.div>

            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              className="space-y-4 text-[14px] sm:text-[15px] text-white/45 leading-relaxed"
            >
              <p>
                We believe premium garments should breathe with the skin. Every piece in our core collection originates from natural, raw materials — sourced responsibly and refined through precision craftsmanship.
              </p>
              <p className="hidden sm:block text-white/30">
                No rushed trends. No compromises. Just timeless pieces designed to outlast seasons while retaining architectural movement and structural integrity.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.15 }}
              className="grid grid-cols-2 gap-6 py-7 border-y border-white/[0.07]"
            >
              <div>
                <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-2">Traceability</span>
                <span className="text-sm text-white  ">100% Verified Origins</span>
              </div>
              <div>
                <span className="block text-[9px] font-black uppercase tracking-[0.3em] text-white/25 mb-2">Production</span>
                <span className="text-sm text-white  ">Small-Batch Curated</span>
              </div>
            </motion.div>

            {/* CTA */}
            <motion.div
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.2 }}
            >
              <Link
                to="/about"
                className="inline-flex items-center gap-3 group"
              >
                <span className="text-[11px] uppercase tracking-[0.2em] font-black text-white/60 group-hover:text-white transition-colors duration-300 relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-white/60 after:origin-left">
                  Read Our Story
                </span>
                <div className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all duration-400">
                  <ArrowUpRight size={14} className="text-white/60 group-hover:text-black transition-colors duration-400" />
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default EditorialStory;