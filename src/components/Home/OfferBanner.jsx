import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Heart, Users, Sparkles, GlassWater, Zap, CheckCircle2, Globe2 } from 'lucide-react';

const SattuStorySection = () => {
  return (
    <div className="w-full max-w-7xl mx-auto font-poppins overflow-hidden bg-[#EFECE6] border border-[#D9D3C7] rounded-none shadow-xl shadow-stone-900/5 my-12">

      {/* MAIN RUSTIC HERITAGE GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 w-full">

        {/* Column 1: Farmer Image Background */}
        <div className="relative h-72 md:h-96 lg:h-auto group overflow-hidden border-b md:border-b-0 md:border-r border-[#D9D3C7]">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=800&auto=format&fit=crop&q=80')`
            }}
          />
          {/* Elegant warm editorial gradient scrim */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-950/40 via-amber-900/10 to-transparent mix-blend-multiply"></div>
        </div>

        {/* Column 2: Our Story Editorial Typography Block */}
        <div className="bg-[#EFECE6] p-8 lg:p-10 xl:p-12 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-[#D9D3C7] relative">
          {/* Subtle tactile premium geometric overlay */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]"></div>

          <div className="relative z-10">
            <span className="text-[#D9A036] font-poppins   text-sm uppercase tracking-widest mb-3 block">
              Our Legacy
            </span>
            <h2 className="text-[#1C2B21] font-poppins   text-3xl lg:text-4xl leading-[1.15] mb-6 tracking-tight">
              From Our Roots <br />
              <span className="italic font-normal text-[#3E4A41]">To Your Glass</span>
            </h2>
            <p className="text-[#3E4A41] text-sm lg:text-base leading-relaxed mb-4 font-medium opacity-90">
              Sattu has been a timeless cornerstone of Indian wellness for centuries—powering farmers, warriors, and families with pure, uncompromised endurance.
            </p>
            <p className="text-[#707A72] text-sm lg:text-sm leading-relaxed">
              We preserve this ancient craftsmanship while introducing five functional profiles tailored perfectly for modern fast-paced performance.
            </p>
          </div>
        </div>

        {/* Column 3: Feature Highlights (Signature Forest Green Block) */}
        <div className="bg-[#6b4f3] p-8 lg:p-10 xl:p-12 text-[#EFECE6] flex flex-col justify-center space-y-6 lg:border-r border-[#112517] relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#fff_1px,transparent_1px)] [background-size:40px] hidden lg:block"></div>

          {/* Feature 1 */}
          <div className="flex items-start space-x-4 group">
            <div className="mt-1 p-2 rounded-lg bg-white/5 border border-white/10 text-[#D9A036] transition-colors group-hover:bg-[#D9A036]/10">
              <GlassWater className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <p className="font-poppins font-medium text-base text-white tracking-wide">Just Add Liquid</p>
              <p className="text-sm text-[#A3B8A8] mt-0.5">Stir cleanly into water or milk. Ready instantly.</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start space-x-4 group">
            <div className="mt-1 p-2 rounded-lg bg-white/5 border border-white/10 text-[#D9A036] transition-colors group-hover:bg-[#D9A036]/10">
              <Zap className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <p className="font-poppins font-medium text-base text-white tracking-wide">Clean Active Fuel</p>
              <p className="text-sm text-[#A3B8A8] mt-0.5">Optimized cleanly for breakfast, work, or workouts.</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-start space-x-4 group">
            <div className="mt-1 p-2 rounded-lg bg-white/5 border border-white/10 text-[#D9A036] transition-colors group-hover:bg-[#D9A036]/10">
              <Users className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <p className="font-poppins font-medium text-base text-white tracking-wide">Family Formulation</p>
              <p className="text-sm text-[#A3B8A8] mt-0.5">Perfect digestability for developing children & adults alike.</p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="flex items-start space-x-4 group">
            <div className="mt-1 p-2 rounded-lg bg-white/5 border border-white/10 text-[#D9A036] transition-colors group-hover:bg-[#D9A036]/10">
              <Sparkles className="w-5 h-5 stroke-[1.5]" />
            </div>
            <div>
              <p className="font-poppins font-medium text-base text-white tracking-wide">Daily Ritual</p>
              <p className="text-sm text-[#A3B8A8] mt-0.5">Build a pure, high-fiber structural foundation every morning.</p>
            </div>
          </div>
        </div>

        {/* Column 4: Product Image Background */}
        <div className="relative h-72 md:h-96 lg:h-auto group overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{
              backgroundImage: `url('img/s11.png')`
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-950/20 to-amber-950/50 mix-blend-multiply"></div>
        </div>

      </div>

      {/* BOTTOM DEEP-GREEN TRUST FOOTER BANNER */}
      <div className="bg-[#112517] text-white px-8 py-8 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-8 border-t border-[#6b4f3] relative">

        {/* Left Side: Tagline & CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto justify-between lg:justify-start z-10">
          <div className="text-center sm:text-left">
            <h3 className="font-poppins text-xl lg:text-2xl   tracking-wide text-white">
              Real Ingredients. Real Nutrition.
            </h3>
            <p className="text-[#A3B8A8] text-sm mt-1 font-poppins tracking-wide uppercase">No Added Preservatives • Clean Label Certified</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, backgroundColor: '#C28E2E' }}
            whileTap={{ scale: 0.98 }}
            className="bg-[#D9A036] text-[#112517] font-poppins   uppercase tracking-widest text-sm px-8 py-4 rounded-md transition-colors shadow-lg shadow-black/10 whitespace-nowrap w-full sm:w-auto text-center"
          >
            Order Pure Sattu
          </motion.button>
        </div>

        {/* Right Side: Trust Seals */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm font-semibold uppercase tracking-widest text-[#D9E2DC] z-10 border-t border-white/5 pt-6 lg:pt-0 lg:border-t-0 w-full lg:w-auto">

          {/* Trust item 1 */}
          <div className="flex items-center space-x-2.5 group">
            <Leaf className="w-4 h-4 text-[#D9A036] transition-transform group-hover:rotate-12" strokeWidth={2} />
            <span>100% Natural</span>
          </div>

          {/* Divider Line */}
          <div className="hidden sm:block h-4 w-[1px] bg-white/10"></div>

          {/* Trust item 2 */}
          <div className="flex items-center space-x-2.5 group">
            <Globe2 className="w-4 h-4 text-[#D9A036] transition-transform group-hover:scale-11" strokeWidth={2} />
            <span>Made In India</span>
          </div>

          {/* Divider Line */}
          <div className="hidden sm:block h-4 w-[1px] bg-white/10"></div>

          {/* Trust item 3 */}
          <div className="flex items-center space-x-2.5 group">
            <CheckCircle2 className="w-4 h-4 text-[#D9A036] transition-transform group-hover:scale-11" strokeWidth={2} />
            <span>Lab Tested</span>
          </div>

        </div>

        {/* Fine-line Accent Geometry Overlays */}
        <div className="absolute right-0 top-0 w-48 h-full opacity-[0.02] pointer-events-none hidden xl:block">
          <div className="w-full h-full border-l border-dashed border-white"></div>
        </div>

      </div>
    </div>
  );
};

export default SattuStorySection;
