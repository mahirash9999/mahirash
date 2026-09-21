import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Award, Compass, ShieldCheck, HeartHandshake, Zap, Flame, Sparkles, Sprout } from 'lucide-react';
import OptimizedCloudinaryImage from '../OptimizedCloudinaryImage';

const features = [
  {
    id: 1,
    title: "No Artificial Flavours",
    description: "Only real, natural ingredients",
    icon: <Leaf size={32} strokeWidth={1.5} />,
  },
  {
    id: 2,
    title: "Plant Based Protein",
    description: "Keeps you full & energized",
    icon: <Sprout size={32} strokeWidth={1.5} />,
  },
  {
    id: 3,
    title: "Easy to Digest",
    description: "Gentle on your stomach",
    icon: <Zap size={32} strokeWidth={1.5} />,
  },
  {
    id: 4,
    title: "Sustained Energy",
    description: "No crashes, just pure fuel",
    icon: <Flame size={32} strokeWidth={1.5} />,
  },
  {
    id: 5,
    title: "Traditional Superfood",
    description: "Backed by centuries of wisdom",
    icon: <Sparkles size={32} strokeWidth={1.5} />,
  },
  {
    id: 6,
    title: "Clean & Pure",
    description: "No preservatives, no chemicals",
    icon: <ShieldCheck size={32} strokeWidth={1.5} />,
  }
];

const FeatureCard = ({ feature, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
      whileHover={{ y: -6, scale: 1.03 }}
      className="bg-[#1C2B21] p-6 text-center border-asymmetrical border-[#D9D3C7] shadow-[12px_12px_0px_0px_rgba(217,211,199,0.15)] group transition-all duration-300"
    >
      {/* Redesigned Icon Container: Hand-stamped woodcut aesthetic */}
      <div className="w-16 h-16 rounded-full bg-[#112517] border border-[#5C4033] flex items-center justify-center text-[#D9A036] mx-auto mb-6 transition-all duration-300 shadow-inner group-hover:bg-[#D9A036] group-hover:text-[#112517] group-hover:filter-none filter grayscale sepia">
        {feature.icon}
      </div>

      <h3 className="text-xl font-poppins   text-white mb-2 leading-tight group-hover:text-[#D9A036] transition-colors">
        {feature.title}
      </h3>
      <p className="text-sm font-handcrafted italic leading-relaxed text-[#D9D3C7] sepia opacity-90">
        {feature.description}
      </p>

      {/* Decorative Traditional Assets: Asymmetrical corner flourishes */}
      <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#8B7355] opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#8B7355] opacity-50 group-hover:opacity-100 transition-opacity"></div>
    </motion.div>
  );
};

const WhyChooseSection = () => {
  return (
    <section className="py-24 bg-[#112517] text-[#EFECE6] relative overflow-hidden border-t-4 border-b-4 border-[#8B7355]/20">
      {/* Deep premium background texture: Organic fiber parchment with aged grain */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[radial-gradient(#fff_1.2px,transparent_1.2px)] [background-size:28px_28px]"></div>
      <div className="absolute inset-0 bg-[#0A1A10] mix-blend-multiply opacity-20 filter grayscale"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 p-4 border-[3px] border-[#5C4033] rounded-sm bg-[#112517] shadow-[12px_12px_0px_0px_rgba(139,115,85,0.1)]">

        {/* Section Header with traditional stamp aesthetic */}
        <div className="text-center mb-16 md:mb-20 flex flex-col items-center">
          <span className="text-[#D9A036] font-poppins   tracking-widest text-sm uppercase block mb-3 relative sepia filter">
            Pure Benefits
            <span className="absolute -bottom-1 left-0 w-full h-[1px] bg-[#D9A036]/50"></span>
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-poppins font-extrabold text-white tracking-tight pb-3 leading-[1.1]">
            Why Choose Sattu Sattu?
          </h2>
          {/* Stamped rustic divider */}
          <div className="w-16 h-2 bg-[#D9A036] mt-2 border border-[#5C4033] rounded-sm shadow-inner opacity-80 filter grayscale-[20%] sepia-[10%]"></div>
        </div>

        {/* Features Grid: Hand-stamped entries in a ledger */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 p-2">
          {features.map((feature, index) => (
            <FeatureCard key={feature.id} feature={feature} index={index} />
          ))}
        </div>
      </div>

      {/* Decorative Assets: Illustrated cross-hatch portraits on parchment in background space */}
      <div className="absolute left-[-15%] top-[30%] opacity-[0.06] grayscale sepia hidden xl:block pointer-events-none">
        <OptimizedCloudinaryImage src="/img/farmer-sage-sketch.jpg" alt="Traditional Farmer Sketch" width={400} className="w-[400px] h-auto rounded-full" />
      </div>
      <div className="absolute right-[-15%] bottom-[10%] opacity-[0.06] grayscale sepia hidden xl:block pointer-events-none">
        <OptimizedCloudinaryImage src="/img/tradition-wisdom-sketch.jpg" alt="Centuries of Wisdom Sketch" width={350} className="w-[350px] h-auto rounded-full" />
      </div>

      {/* Embedded CSS for custom traditional features */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .border-asymmetrical {
          border-top-left-radius: 6px;
          border-top-right-radius: 4px;
          border-bottom-right-radius: 8px;
          border-bottom-left-radius: 2px;
        }
        .filter.sepia {
          filter: sepia(10%);
        }
        .filter.grayscale {
          filter: grayscale(15%);
        }
        .group-hover:filter-none {
          filter: none;
        }
        .font-handcrafted {
          font-family: 'Aged Handcrafted', serif;
        }
      `}} />
    </section>
  );
};

export default WhyChooseSection;
