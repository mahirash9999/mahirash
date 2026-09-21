import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, ShieldCheck, Dumbbell, Feather, Sparkles,
  ArrowUpRight, Compass, LineChart, Droplet, Flame
} from 'lucide-react';

const Benefits = () => {
  const [activeMetric, setActiveMetric] = useState(0);
  const premiumEase = [0.25, 1, 0.5, 1];

  const biologicalMetrics = [
    {
      title: "Sustained Glycemic Index",
      value: "Low-GI",
      metric: "Baseline Equilibrium",
      desc: "Unlike processed isolate proteins or synthetic energy compounds that cause acute insulin spikes, the complex structural starches in stone-ground roasted chana digest at an intentionally decelerated pace. This ensures a clean, predictable curve of glucose delivery to muscle and brain tissue.",
      icon: <Activity size={20} strokeWidth={1.5} />,
      stats: [
        { label: "Energy Crash Probability", value: "0.0%" },
        { label: "Digestive Influx Period", value: "4-6 Hrs" }
      ]
    },
    {
      title: "Bio-Available Macro Protein",
      value: "20g+",
      metric: "Per Curated Serving",
      desc: "An uncompromised, plant-derived nitrogen structure packed with essential amino acids. Because our processing preserves the natural fibrous shell of the grain during low-heat sand roasting, the protein matrix retains its structural integrity for maximum cellular absorption.",
      icon: <Dumbbell size={20} strokeWidth={1.5} />,
      stats: [
        { label: "Absorption Efficiency", value: "94.2%" },
        { label: "Synthetic Modifiers", value: "Zero" }
      ]
    },
    {
      title: "Gastrointestinal Alkaline Harmony",
      value: "Ph+",
      metric: "Cooling Thermal Matrix",
      desc: "Revered in traditional Ayurvedic science as an instigator of 'Agni' equilibrium, Sattu possesses innate internal cooling properties. It works actively as a natural antacid, soothing inflammation within the intestinal tract and promoting optimal microbiome biodiversity.",
      icon: <Droplet size={20} strokeWidth={1.5} />,
      stats: [
        { label: "Thermal Metric Index", value: "Cooling" },
        { label: "Gut Flora Ingestion", value: "Active" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] pt-[145px] md:pt-[120px] lg:pt-[160px] pb-32 text-[#1C2B21] relative selection:bg-[#6b4f3] selection:text-white">
      {/* Light Luxury Geometric Dot Mesh Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:32px_32px]"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16 relative z-10">

        {/* ================= HERO ARCHITECTURE ================= */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-40">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: premiumEase }}
            className="lg:col-span-8 space-y-8"
          >
            <div className="flex items-center gap-2.5 text-[#D9A036]">
              <Sparkles size={12} strokeWidth={1.5} />
              <span className="text-[14px]   uppercase tracking-[0.35em]">The Physiological Ledger</span>
            </div>

            <h1 className="text-[11vw] sm:text-[8vw] lg:text-[6vw] font-poppins font-light text-[#1C2B21] leading-[0.95] tracking-tighter">
              Human Mechanics. <br />
              <span className="font-poppins italic text-[#6b4f3] font-normal">Uncompromised</span> <br />
              Efficiency.
            </h1>

            <div className="h-[1px] w-20 bg-[#D9A036]" />

            <p className="text-base sm:text-lg text-[#5C665E] font-light leading-relaxed max-w-2xl">
              We reject the empty promises of laboratory-isolated chemicals. Sattu delivers macro-nourishment that aligns perfectly with human biology, providing functional performance rooted in clean agricultural truth.
            </p>
          </motion.div>

          {/* Minimalist Sidebar Floating Counter */}
          <div className="lg:col-span-4 lg:text-right pt-6 hidden lg:block">
            <span className="text-[120px] font-poppins font-light text-[#6b4f3]/10 leading-none select-none pointer-events-none">
              01
            </span>
            <p className="text-[14px]   uppercase tracking-widest text-[#9A8F80] mt-2">
              Clinical Integrity Verified
            </p>
          </div>
        </div>

        {/* ================= INTERACTIVE METRICS EXPLORER ================= */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-stretch mb-40">

          {/* Navigation Track */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <p className="text-[14px]   uppercase tracking-[0.25em] text-[#9A8F80]">Biological Vectors</p>
              <h2 className="text-2xl font-poppins font-light tracking-tight text-[#1C2B21]">The Three Structural Pillars</h2>
            </div>

            <div className="space-y-4 flex-1 justify-center flex flex-col">
              {biologicalMetrics.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMetric(idx)}
                  className={`w-full text-left p-6 rounded-xl border transition-all duration-500 flex items-center justify-between group ${activeMetric === idx
                    ? 'bg-white border-[#6b4f3]/30 shadow-[0_20px_50px_rgba(28,43,33,0.04)]'
                    : 'bg-transparent border-[#EAE6DF] hover:border-[#9A8F80]/50'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-500 ${activeMetric === idx ? 'bg-[#6b4f3] text-white' : 'bg-[#EFECE6] text-[#5C665E]'
                      }`}>
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-poppins   text-[#1C2B21] tracking-tight">{item.title}</h3>
                      <p className="text-[14px] text-[#9A8F80] tracking-wide mt-0.5">{item.metric}</p>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className={`text-[#9A8F80] transition-transform duration-500 ${activeMetric === idx ? 'rotate-45 text-[#D9A036]' : 'group-hover:translate-x-0.5'
                    }`} />
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Screen Display Panel */}
          <div className="lg:col-span-7 bg-white border border-[#EAE6DF] rounded-2xl p-8 sm:p-12 shadow-[0_30px_70px_rgba(28,43,33,0.02)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-sm font-mono font-light text-[#9A8F80]/40 tracking-wider">
              SYS_REF//00{activeMetric + 1}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeMetric}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: premiumEase }}
                className="space-y-8 h-full flex flex-col justify-between"
              >
                <div className="space-y-6">
                  <div className="inline-flex items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-poppins font-light text-[#6b4f3] tracking-tight">
                      {biologicalMetrics[activeMetric].value}
                    </span>
                    <span className="text-sm uppercase tracking-widest   text-[#D9A036]">
                      {biologicalMetrics[activeMetric].metric}
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-[#5C665E] font-light leading-relaxed">
                    {biologicalMetrics[activeMetric].desc}
                  </p>
                </div>

                {/* Micro Technical Data Matrix */}
                <div className="pt-8 border-t border-[#F9F8F6] grid grid-cols-2 gap-6">
                  {biologicalMetrics[activeMetric].stats.map((stat, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <span className="text-[14px]   uppercase tracking-widest text-[#9A8F80] block">
                        {stat.label}
                      </span>
                      <span className="text-lg font-poppins font-light text-[#1C2B21]">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* ================= SECONDARY BENEFIT LAYERS GRID ================= */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-40">
          {[
            {
              icon: <Feather size={20} strokeWidth={1.5} />,
              title: "Weight Optimization Strategy",
              desc: "High complex fiber architecture triggers safe leptin receptor signaling, extending sensations of satiety and naturally shutting down neurological cravings without stimulant intervention."
            },
            {
              icon: <Flame size={20} strokeWidth={1.5} />,
              title: "Metabolic Thermogenesis",
              desc: "The stone-milling process ensures organic cellular walls remain intact, forcing the system to utilize higher metabolic energy during assimilation to burn calories cleanly."
            },
            {
              icon: <ShieldCheck size={20} strokeWidth={1.5} />,
              title: "Cellular Detoxification Pathway",
              desc: "The heavy density of raw, non-solubilized fiber sweeps toxic heavy-metal waste and bile assets smoothly out of the vascular system, refreshing arterial cell integrity."
            }
          ].map((benefit, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: premiumEase }}
              className="p-10 rounded-xl bg-white border border-[#EAE6DF] hover:shadow-[0_24px_60px_rgba(28,43,33,0.03)] transition-all duration-500 space-y-6"
            >
              <div className="w-10 h-10 rounded-lg bg-[#F9F8F6] border border-[#EAE6DF] flex items-center justify-center text-[#6b4f3]">
                {benefit.icon}
              </div>
              <h3 className="text-base font-poppins   text-[#1C2B21] tracking-tight">{benefit.title}</h3>
              <p className="text-sm text-[#5C665E] font-light leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* ================= CLINICAL OUTRO MANIFESTO ================= */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: premiumEase }}
          className="bg-[#6b4f3] rounded-2xl p-10 md:p-20 text-[#EFECE6] relative overflow-hidden shadow-xl"
        >
          {/* Asymmetric Artistic Overlay Gradients */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D9A036]/10 rounded-full blur-[160px] opacity-30 -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          <div className="relative z-10 max-w-4xl space-y-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-[1px] bg-[#D9A036]" />
              <span className="text-[14px]   uppercase tracking-[0.35em] text-[#D9A036]">Biological Charter</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-poppins font-light leading-[1.25] tracking-tight text-white">
              “We hold an uncompromising belief: human peak performance does not require chemical modification. Our products are engineered by nature, verified by tradition, and refined for biological synergy.”
            </h2>

            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-8 text-[14px] uppercase tracking-widest font-medium text-[#A69F91]">
                <span className="flex items-center gap-1.5"><Compass size={11} /> Earth Born Real</span>
                <span className="flex items-center gap-1.5"><LineChart size={11} /> Glycemic Balance Verified</span>
              </div>
              <span className="text-[14px]   uppercase tracking-widest text-[#D9A036]">
                Maison de la Santé // Established Heritage
              </span>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Benefits;
