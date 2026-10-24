import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../../components/Firebase';
import { collection, getDocs } from 'firebase/firestore';
import SectionHeader from './SectionHeader';
import OptimizedCloudinaryImage from '../OptimizedCloudinaryImage';

const DEFAULT_SCENTS = [
  {
    id: 'scent_citrus',
    name: 'CITRUS & FRESH',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop',
    link: '/shop?scent=Citrus'
  },
  {
    id: 'scent_floral',
    name: 'FLORAL & SWEET',
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop',
    link: '/shop?scent=Floral'
  },
  {
    id: 'scent_woody',
    name: 'WOODY & MUSK',
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop',
    link: '/shop?scent=Woody'
  },
  {
    id: 'scent_amber',
    name: 'AMBER & OUD',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop',
    link: '/shop?scent=Amber'
  }
];

const CategorySection = () => {
  const [scents, setScents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScents = async () => {
      try {
        const snapScents = await getDocs(collection(db, 'shop_by_scents'));
        let list = snapScents.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (list.length === 0) {
          const snapCat = await getDocs(collection(db, 'shop_by_category'));
          list = snapCat.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        }

        const activeList = list
          .filter(item => item.is_active !== false)
          .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

        setScents(activeList.length > 0 ? activeList : DEFAULT_SCENTS);
      } catch (error) {
        console.warn("Using default scents fallback:", error);
        setScents(DEFAULT_SCENTS);
      } finally {
        setLoading(false);
      }
    };

    fetchScents();
  }, []);

  if (loading && scents.length === 0) return null;

  const displayScents = scents.length > 0 ? scents : DEFAULT_SCENTS;
  const itemsToRender = displayScents.slice(0, 4);

  return (
    <section className="py-10 sm:py-14 bg-[#FCF9F4] relative">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading with Decorative Gold Lines */}
        <SectionHeader title="SHOP BY" accent="SCENT" />

        {/* 4-Card Rectangular Grid matching reference screenshot */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-3">
          {itemsToRender.map((scent) => {
            const title = scent.name || scent.title;
            const link = scent.link || `/shop?scent=${encodeURIComponent(title)}`;
            return (
              <Link
                key={scent.id}
                to={link}
                className="group flex flex-col bg-white rounded-xl border border-[#E9DCCB] overflow-hidden shadow-xs hover:border-[#800020] transition-all duration-300 hover:shadow-md"
              >
                {/* Image Container with aspect ratio ~ 1.25:1 */}
                <div className="relative w-full h-[170px] sm:h-[200px] lg:h-[225px] overflow-hidden bg-stone-100">
                  <OptimizedCloudinaryImage
                    src={scent.image}
                    alt={title}
                    preset="product-card"
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                </div>

                {/* Bottom Label Box */}
                <div className="py-3 sm:py-3.5 px-3 bg-white text-center border-t border-[#E9DCCB]/60">
                  <h3 className="text-[11px] sm:text-[12px] font-semibold text-[#30231F] uppercase tracking-[0.14em] group-hover:text-[#800020] transition-colors truncate">
                    {title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default CategorySection;
