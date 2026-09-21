import React from 'react';
import { Layers, Shirt, Smile, RotateCcw, CreditCard } from 'lucide-react';

const features = [
  {
    icon: Layers,
    title: "PREMIUM FABRIC",
    desc: "240 GSM Cotton"
  },
  {
    icon: Shirt,
    title: "PERFECT FIT",
    desc: "Oversized Fit"
  },
  {
    icon: Smile,
    title: "QUALITY PRINT",
    desc: "Long Lasting Print"
  },
  {
    icon: RotateCcw,
    title: "EASY RETURNS",
    desc: "7 Days Return"
  },
  {
    icon: CreditCard,
    title: "SECURE PAYMENT",
    desc: "100% Safe Payment"
  }
];

const FeaturesStrip = () => {
  return (
    <section className="bg-[#f5f5f5] py-6 md:py-10">
      <div className="max-w-7xl py-3 mx-auto px-5 md:px-10 lg:px-14">
        <div className="bg-white border border-zinc-200 p-2 md:p-6 lg:p-8 rounded-none flex flex-col md:grid md:grid-cols-5 gap-0 md:gap-2 items-stretch md:items-center relative shadow-sm">
          {/* Subtle gradient highlights */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/[0.01] to-transparent pointer-events-none rounded-none" />

          {features.map((feature, idx) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="flex items-center gap-5 py-4 md:py-0 px-4 md:px-0 justify-start md:justify-center border-b md:border-b-0 md:border-r border-zinc-200 last:border-none"
              >
                {/* Icon */}
                <div className="text-zinc-800 shrink-0 flex items-center justify-center">
                  <Icon size={24} strokeWidth={1.5} className="text-[#b8860b]" />
                </div>

                {/* Details */}
                <div className="flex flex-col text-left">
                  <span className="text-[11px]   text-zinc-900 tracking-widest uppercase leading-none mb-1">
                    {feature.title}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-medium leading-tight">
                    {feature.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesStrip;
