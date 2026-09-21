import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, RotateCcw, ShieldCheck, Zap } from 'lucide-react';
import { db } from '../../components/Firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const IconMap = {
  Truck: Truck,
  Zap: Zap,
  RotateCcw: RotateCcw,
  ShieldCheck: ShieldCheck
};

const DEFAULT_BENEFITS = [
  { id: 'b_1', icon: 'Truck', text: 'Complimentary Express Shipping Over ₹1999', sort_order: 1, is_active: true },
  { id: 'b_2', icon: 'ShieldCheck', text: '100% Authentic Extraits de Parfum', sort_order: 2, is_active: true },
  { id: 'b_3', icon: 'Zap', text: 'Long-Lasting Sillage Guaranteed', sort_order: 3, is_active: true },
  { id: 'b_4', icon: 'ShieldCheck', text: 'Secure Encryption Checkout', sort_order: 4, is_active: true },
  { id: 'b_5', icon: 'Truck', text: 'Rare Artisanal Formulations', sort_order: 5, is_active: true },
  { id: 'b_6', icon: 'Zap', text: 'Handcrafted Packaging & Sealing', sort_order: 6, is_active: true }
];

const BenefitsStrip = () => {
  const [benefits, setBenefits] = useState(DEFAULT_BENEFITS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const q = query(collection(db, 'benefits_strip'));
        const snap = await getDocs(q);
        if (snap.empty) {
          setBenefits(DEFAULT_BENEFITS);
        } else {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => item.is_active !== false);
          list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
          setBenefits(list.length > 0 ? list : DEFAULT_BENEFITS);
        }
      } catch (err) {
        console.warn("Using default benefits fallback:", err);
        setBenefits(DEFAULT_BENEFITS);
      } finally {
        setLoading(false);
      }
    };
    fetchBenefits();
  }, []);

  if (loading || benefits.length === 0) return null;

  return (
    <section className="relative bg-[#F3EFE6] border-y border-[#C5A059]/30 py-4 overflow-hidden shadow-sm">
      {/* Subtle gold glowing top & bottom border accent lines */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#B8860B]/40 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#B8860B]/40 to-transparent pointer-events-none" />

      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
        className="flex gap-0 whitespace-nowrap"
      >
        {[...benefits, ...benefits].map((item, i) => {
          const Icon = IconMap[item.icon] || Zap;
          return (
            <span
              key={i}
              className="inline-flex items-center gap-3.5 px-10 text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A1A1A]"
            >
              <Icon size={15} strokeWidth={2} className="text-[#B8860B] flex-shrink-0 drop-shadow-sm" />
              {item.text}
              <span className="text-[#B8860B] text-[10px] ml-3.5 flex-shrink-0 opacity-80">✦</span>
            </span>
          );
        })}
      </motion.div>
    </section>
  );
};

export default BenefitsStrip;
