import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { db } from '../../components/Firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import OptimizedCloudinaryImage from '../OptimizedCloudinaryImage';

const DEFAULT_GENDER_BANNERS = [
  {
    id: 'banner_men',
    title: 'FOR HIM',
    tag: 'MASCULINE SIGNATURES',
    subtitle: 'Bold, intense, and magnetic extraits formulated for commanding presence.',
    cta: "DISCOVER MEN'S",
    image: 'https://res.cloudinary.com/djmfxpemz/image/upload/v1792132433/wgbpfdnhmnbe4bpqi1w0.jpg',
    link: '/shop?gender=Men',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'banner_women',
    title: 'FOR HER',
    tag: 'FEMININE ESSENCES',
    subtitle: 'Sensual, elegant, and floral extraits crafted to leave a lasting, hypnotic sillage.',
    cta: "DISCOVER WOMEN'S",
    image: 'https://res.cloudinary.com/djmfxpemz/image/upload/v1792132433/m4fvjsmxzeqgkwcx9qem.jpg',
    link: '/shop?gender=Women',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'banner_unisex',
    title: 'UNISEX',
    tag: 'TIMELESS HARMONY',
    subtitle: 'Boundary-defying artisanal extraits designed to transcend convention.',
    cta: "DISCOVER UNISEX",
    image: 'https://res.cloudinary.com/djmfxpemz/image/upload/v1792132434/yx5mbymas6q8k0wpkqz0.jpg',
    link: '/shop?gender=Unisex',
    sort_order: 3,
    is_active: true
  }
];

const ShopTheLook = () => {
  const [banners, setBanners] = useState(DEFAULT_GENDER_BANNERS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // 1. Try gender_banners collection
        const qGender = query(collection(db, 'gender_banners'));
        const snapGender = await getDocs(qGender);

        if (!snapGender.empty) {
          const list = snapGender.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.is_active !== false);
          list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
          setBanners(list.length > 0 ? list : DEFAULT_GENDER_BANNERS);
        } else {
          // 2. Fallback check shop_the_look collection
          const qLook = query(collection(db, 'shop_the_look'));
          const snapLook = await getDocs(qLook);
          if (!snapLook.empty) {
            const list = snapLook.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(item => item.is_active !== false);
            setBanners(list.length > 0 ? list : DEFAULT_GENDER_BANNERS);
          }
        }
      } catch (error) {
        console.warn("Using default gender banners fallback:", error);
        setBanners(DEFAULT_GENDER_BANNERS);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  if (loading && banners.length === 0) return null;

  const displayBanners = banners.length > 0 ? banners : DEFAULT_GENDER_BANNERS;

  return (
    <section className="py-14 md:py-20 bg-[#FAF8F5] overflow-hidden relative border-t border-[#E5D5B8]/40">
      {/* Ambient Warm Golden Lighting Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />

      {/* Header Container */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 mb-10 md:mb-12 relative z-10">
        <p className="text-[10px] sm:text-[14px] tracking-[0.3em] text-[#B8860B] uppercase mb-2 font-bold flex items-center gap-2">
          <span>THE ESSENCE OF YOU</span>
          <span>•</span>
          <span>SIGNATURE ATELIER</span>
        </p>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-8">
          <div className="flex items-center flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extralight tracking-[0.15em] text-[#0D0D0D] uppercase whitespace-nowrap">
              FOR HIM, FOR HER & UNISEX
            </h2>
            <div className="hidden md:block flex-1 h-[1px] bg-gradient-to-r from-[#B8860B]/40 via-[#E5D5B8] to-transparent ml-8 mr-4 self-center mt-1" />
          </div>
        </div>
      </div>

      {/* 3 Banners Grid: For Him, For Her, and Unisex */}
      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {displayBanners.slice(0, 3).map((banner, index) => {
            const defaultLink = index === 0 ? '/shop?gender=Men' : index === 1 ? '/shop?gender=Women' : '/shop?gender=Unisex';
            return (
              <motion.div
                key={banner.id || index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.7, delay: index * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative w-full"
              >
                <Link
                  to={banner.link || defaultLink}
                  className="relative group block overflow-hidden bg-stone-100 aspect-[4/5] sm:aspect-[16/10] md:aspect-[4/5] lg:aspect-[3/4] w-full rounded-2xl shadow-xl border border-[#E5D5B8] hover:border-[#B8860B] hover:shadow-[0_20px_45px_rgba(184,134,11,0.2)] transition-all duration-500"
                >
                  {/* Editorial Background Image */}
                  <OptimizedCloudinaryImage
                    src={banner.image}
                    alt={banner.title || 'Collection banner'}
                    preset="banner"
                    quality="auto:best"
                    priority={true}
                    className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
                  />

                  {/* Light & Dark Gradient Vignette for Text Contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(184,134,11,0.18)_0%,transparent_70%)] pointer-events-none" />

                  {/* Banner Content Container */}
                  <div className="absolute inset-0 p-6 sm:p-7 lg:p-8 z-20 flex flex-col justify-end items-start pointer-events-none">
                    {banner.tag && (
                      <span className="text-[10px] sm:text-[12px] tracking-[0.25em] uppercase text-[#E5D5B8] font-bold mb-2 drop-shadow flex items-center gap-1.5">
                        <span className="text-[#B8860B]">✦</span> {banner.tag}
                      </span>
                    )}

                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white uppercase tracking-[0.15em] leading-tight mb-2 drop-shadow-md">
                      {banner.title}
                    </h3>

                    {banner.subtitle && (
                      <p className="text-[12px] sm:text-[13px] text-stone-200 font-light leading-relaxed max-w-sm mb-5 drop-shadow-sm line-clamp-2">
                        {banner.subtitle}
                      </p>
                    )}

                    <div className="inline-flex items-center justify-center gap-2.5 bg-[#0D0D0D] text-white px-6 py-3 text-[10px] sm:text-[11px] font-extrabold tracking-[0.2em] uppercase transition-all duration-300 shrink-0 shadow-lg pointer-events-auto rounded-full group-hover:bg-[#B8860B] group-hover:text-black">
                      <span>{banner.cta || 'EXPLORE COLLECTION'}</span>
                      <ArrowRight size={13} className="group-hover:translate-x-1.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ShopTheLook;
