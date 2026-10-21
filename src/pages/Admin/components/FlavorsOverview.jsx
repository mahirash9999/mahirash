import React from 'react';
import { Sparkles, Flame, Droplets, ShieldCheck, Sun, Compass } from 'lucide-react';

const flavorStats = [
  { name: "Extrait de Parfum", count: 8, icon: Sparkles, color: "text-[#b8860b]", bg: "bg-[#b8860b]/10" },
  { name: "Oud Collection", count: 6, icon: Flame, color: "text-amber-800", bg: "bg-amber-100" },
  { name: "Woody & Amber", count: 5, icon: Compass, color: "text-zinc-800", bg: "bg-zinc-100" },
  { name: "Floral & Fresh", count: 4, icon: Droplets, color: "text-rose-700", bg: "bg-rose-100" },
  { name: "Eau de Parfum", count: 7, icon: ShieldCheck, color: "text-yellow-700", bg: "bg-yellow-100" },
  { name: "Discovery Sets", count: 3, icon: Sun, color: "text-amber-600", bg: "bg-amber-50" },
];

const FlavorsOverview = () => {
  return (
    <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
      <h2 className="text-lg font-serif tracking-wider uppercase text-zinc-900 mb-1.5">
        Fragrance Families &amp; Product Catalog
      </h2>
      <p className="text-sm text-zinc-500 mb-6">
        Overview of live fragrance families and active extraits catalog
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {flavorStats.map((flavor) => {
          const Icon = flavor.icon;
          return (
            <div key={flavor.name} className="rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${flavor.bg} ${flavor.color} flex items-center justify-center shrink-0`}>
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{flavor.name}</p>
                  <p className="text-[14px] text-zinc-500 font-medium">{flavor.count} Active Formulations</p>
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
