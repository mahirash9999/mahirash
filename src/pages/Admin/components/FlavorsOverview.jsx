import React from 'react';
import { Sparkles, Flame, Droplets, ShieldCheck, Sun, Compass } from 'lucide-react';

const flavorStats = [
  { name: "Extrait de Parfum", count: 8, icon: Sparkles, color: "text-[#800020]", bg: "bg-[#800020]/10" },
  { name: "Oud Collection", count: 6, icon: Flame, color: "text-[#800020]", bg: "bg-[#800020]/10" },
  { name: "Woody & Amber", count: 5, icon: Compass, color: "text-[#B88D46]", bg: "bg-[#B88D46]/15" },
  { name: "Floral & Fresh", count: 4, icon: Droplets, color: "text-[#800020]", bg: "bg-[#800020]/10" },
  { name: "Eau de Parfum", count: 7, icon: ShieldCheck, color: "text-[#B88D46]", bg: "bg-[#B88D46]/15" },
  { name: "Discovery Sets", count: 3, icon: Sun, color: "text-[#800020]", bg: "bg-[#800020]/10" },
];

const FlavorsOverview = () => {
  return (
    <section className="bg-white rounded-2xl border border-[#E9DCCB] shadow-xs p-6">
      <h2 className="text-lg font-serif font-bold tracking-wide uppercase text-[#30231F] mb-1.5">
        Fragrance Families &amp; Product Catalog
      </h2>
      <p className="text-sm text-[#75665D] mb-6">
        Overview of live fragrance families and active extraits catalog
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {flavorStats.map((flavor) => {
          const Icon = flavor.icon;
          return (
            <div key={flavor.name} className="rounded-xl border border-[#E9DCCB] bg-[#FCF9F4] px-5 py-4 hover:border-[#800020]/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${flavor.bg} ${flavor.color} border border-[#800020]/20 flex items-center justify-center shrink-0`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#30231F]">{flavor.name}</p>
                  <p className="text-[14px] text-[#75665D] font-medium">{flavor.count} Active Formulations</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FlavorsOverview;
