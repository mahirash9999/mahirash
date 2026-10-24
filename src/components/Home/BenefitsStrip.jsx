import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, Lock, Plane, Globe, RotateCcw, Truck } from 'lucide-react';
import { db } from '../../components/Firebase';
import { collection, getDocs, query } from 'firebase/firestore';

const DEFAULT_ITEMS = [
  { id: '1', icon: 'shield', label: '100% AUTHENTIC PRODUCTS' },
  { id: '2', icon: 'sparkles', label: 'LONG LASTING FRAGRANCES' },
  { id: '3', icon: 'lock', label: 'SECURE SHOPPING CHECKOUT' },
  { id: '4', icon: 'plane', label: 'WIDE INTERNATIONAL AVAILABILITY' }
];

const renderIcon = (type) => {
  const iconProps = { size: 19, strokeWidth: 1.6, className: "text-[#B88D46] shrink-0" };
  switch (type?.toLowerCase()) {
    case 'shield':
    case 'shieldcheck':
      return <ShieldCheck {...iconProps} />;
    case 'sparkles':
    case 'zap':
      return <Sparkles {...iconProps} />;
    case 'lock':
    case 'secure':
      return <Lock {...iconProps} />;
    case 'plane':
    case 'globe':
    case 'truck':
      return <Plane {...iconProps} />;
    default:
      return <ShieldCheck {...iconProps} />;
  }
};

const BenefitsStrip = () => {
  const [items, setItems] = useState(DEFAULT_ITEMS);

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const q = query(collection(db, 'benefits_strip'));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => item.is_active !== false);
          if (list.length >= 4) {
            setItems(list.slice(0, 4).map(item => ({
              id: item.id,
              icon: item.icon || 'shield',
              label: item.text || item.label
            })));
          }
        }
      } catch (err) {
        console.warn("Using default trust strip fallback:", err);
      }
    };
    fetchBenefits();
  }, []);

  return (
    <section className="bg-[#FCF9F4] border-b border-[#E9DCCB] py-3.5 sm:py-4">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E9DCCB]">
          {items.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`flex items-center justify-center gap-2.5 px-3 py-2 sm:py-1 ${idx % 2 === 0 ? 'pr-2' : 'pl-2'
                } md:px-4`}
            >
              {renderIcon(item.icon)}
              <span className="text-[#30231F] text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-center">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsStrip;
