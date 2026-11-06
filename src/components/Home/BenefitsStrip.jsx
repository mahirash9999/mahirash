import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Plane,
  Truck,
  Globe,
  RotateCcw,
  Award,
  CheckCircle2,
  Heart,
  Zap
} from 'lucide-react';
import { db } from '../../components/Firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

const DEFAULT_ITEMS = [
  { id: '1', icon: 'ShieldCheck', label: '100% AUTHENTIC PRODUCTS' },
  { id: '2', icon: 'Sparkles', label: 'LONG LASTING FRAGRANCES' },
  { id: '3', icon: 'Lock', label: 'SECURE SHOPPING CHECKOUT' },
  { id: '4', icon: 'Plane', label: 'SHIPPING PAN INDIA' }
];

const renderIcon = (type) => {
  const iconProps = { size: 19, strokeWidth: 1.6, className: "text-[#B88D46] shrink-0" };
  const key = String(type || '').toLowerCase();

  if (key.includes('shield') || key === 'shieldcheck') return <ShieldCheck {...iconProps} />;
  if (key.includes('sparkle') || key === 'sparkles') return <Sparkles {...iconProps} />;
  if (key.includes('lock') || key === 'secure') return <Lock {...iconProps} />;
  if (key.includes('plane') || key === 'flight') return <Plane {...iconProps} />;
  if (key.includes('truck') || key === 'shipping') return <Truck {...iconProps} />;
  if (key.includes('globe') || key === 'world') return <Globe {...iconProps} />;
  if (key.includes('rotate') || key === 'return') return <RotateCcw {...iconProps} />;
  if (key.includes('award') || key === 'medal') return <Award {...iconProps} />;
  if (key.includes('check') || key === 'verify') return <CheckCircle2 {...iconProps} />;
  if (key.includes('heart') || key === 'love') return <Heart {...iconProps} />;
  if (key.includes('zap') || key === 'fast') return <Zap {...iconProps} />;
  return <ShieldCheck {...iconProps} />;
};

const BenefitsStrip = () => {
  const [items, setItems] = useState(DEFAULT_ITEMS);

  useEffect(() => {
    // Realtime listener for instant dynamic sync from Admin Panel
    let unsubscribe = () => { };
    try {
      const q = query(collection(db, 'benefits_strip'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list = snapshot.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(item => item.is_active !== false);

          if (list.length > 0) {
            list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
            setItems(list.map(item => ({
              id: item.id,
              icon: item.icon || 'ShieldCheck',
              label: item.label || item.text
            })));
          }
        }
      }, (err) => {
        console.warn("Using default trust strip fallback:", err);
      });
    } catch (err) {
      console.warn("BenefitsStrip connection error:", err);
    }

    return () => unsubscribe();
  }, []);

  return (
    <section className="bg-[#FCF9F4] border-b border-[#E9DCCB] py-3.5 sm:py-4">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(items.length, 4)} divide-y md:divide-y-0 md:divide-x divide-[#E9DCCB]`}>
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
