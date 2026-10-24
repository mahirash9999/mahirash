import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { db } from '../../components/Firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import SectionHeader from './SectionHeader';
import OptimizedCloudinaryImage from '../OptimizedCloudinaryImage';

const DEFAULT_BANNERS = [
  {
    id: 'b_him',
    tag: 'MASCULINE SIGNATURES',
    title: 'FOR HIM',
    subtitle: 'BOLD, INTENSE, AND MAGNETIC EXTRAITS',
    cta: 'DISCOVER MEN\'S',
    link: '/shop?gender=Men',
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=900'
  },
  {
    id: 'b_her',
    tag: 'FEMININE ESSENCES',
    title: 'FOR HER',
    subtitle: 'SENSUAL, ELEGANT, AND FLORAL EXTRAITS',
    cta: 'DISCOVER WOMEN\'S',
    link: '/shop?gender=Women',
    image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=900'
  },
  {
    id: 'b_unisex',
    tag: 'TIMELESS HARMONY',
    title: 'UNISEX',
    subtitle: 'ARTISANAL EXTRAITS CRAFTED FOR ALL',
    cta: 'DISCOVER UNISEX',
    link: '/shop?gender=Unisex',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=900'
  },
  {
    id: 'b_gifts',
    tag: 'EXCLUSIVE GIFT SETS',
    title: 'GIFT SETS',
    subtitle: 'PERFECT FOR EVERY OCCASION & LUXURY PRESENTATION',
    cta: 'EXPLORE GIFT SETS',
    link: '/shop?category=Gift%20Sets',
    image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1400'
  }
];

const BannerCard = ({ banner, isWide = false }) => {
  const destinationLink = banner.link || banner.path || '/shop';
  // Ensure a valid fallback image so cards never render as blank grey gradient
  const fallbackImg = isWide
    ? 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1400'
    : 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=900';
  const imgSrc = banner.image && banner.image.trim().length > 0 ? banner.image : fallbackImg;

  return (
    <Link
      to={destinationLink}
      className={`group relative block overflow-hidden rounded-xl border border-[#E9E0D6] shadow-sm hover:border-[#800020] hover:shadow-lg transition-all duration-500 w-full ${
        isWide
          ? 'h-[200px] sm:h-[220px] lg:h-[235px]'
          : 'min-h-[200px] sm:min-h-[220px] lg:h-[235px]'
      }`}
    >
      {/* Background Image */}
      <OptimizedCloudinaryImage
        src={imgSrc}
        fallbackSrc={fallbackImg}
        alt={banner.title || 'Collection'}
        preset="banner"
        quality="auto:best"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Luxury Dark Vignette Gradient Overlays for high contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/35 group-hover:via-black/55 transition-colors duration-500 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />

      {/* Text block with generous padding and vertical spacing */}
      <div className={`absolute inset-0 p-5 sm:p-6 lg:p-7 flex flex-col justify-center items-start z-10 ${isWide ? 'max-w-xl' : 'max-w-md'}`}>
        {banner.tag && (
          <span className="text-[10px] sm:text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#B88D46] mb-1.5 drop-shadow-xs">
            {banner.tag}
          </span>
        )}
        <h3 className="text-xl sm:text-2xl lg:text-[25px] font-serif text-white uppercase tracking-wider font-normal leading-tight mb-1.5 drop-shadow-sm">
          {banner.title}
        </h3>
        {banner.subtitle && (
          <p className="text-[10.5px] sm:text-[11.5px] text-zinc-200 tracking-wider uppercase font-light mb-4 line-clamp-2 leading-relaxed">
            {banner.subtitle}
          </p>
        )}
        <span className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-[#800020] group-hover:bg-[#650018] text-white text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 shadow-md group-hover:translate-x-1">
          <span>{banner.cta || banner.buttonText || 'EXPLORE RANGE'}</span>
          <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
};

const ShopTheLook = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const qGender = query(collection(db, 'gender_banners'));
        const snapGender = await getDocs(qGender);

        if (!snapGender.empty) {
          const list = snapGender.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.is_active !== false);
          list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
          setBanners(list.length > 0 ? list : DEFAULT_BANNERS);
        } else {
          const qLook = query(collection(db, 'shop_the_look'));
          const snapLook = await getDocs(qLook);
          if (!snapLook.empty) {
            const list = snapLook.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(item => item.is_active !== false);
            list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
            setBanners(list.length > 0 ? list : DEFAULT_BANNERS);
          } else {
            setBanners(DEFAULT_BANNERS);
          }
        }
      } catch (error) {
        console.error("Error loading collection banners:", error);
        setBanners(DEFAULT_BANNERS);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const items = banners.length > 0 ? banners : DEFAULT_BANNERS;
  const topThree = items.slice(0, 3);
  const fourthItem = items[3] || null;
  const extraItems = items.slice(4);

  return (
    <section className="py-10 sm:py-14 bg-[#FCF9F4] relative">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading with Decorative Gold Lines */}
        <SectionHeader title="SIGNATURE" accent="COLLECTION" />

        {/* Row 1: Top 3 balanced equal-width cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mt-3">
          {topThree.map((banner) => (
            <BannerCard key={banner.id} banner={banner} />
          ))}
        </div>

        {/* Row 2: 4th card (e.g. Gift Sets) as a full-width showcase banner matching the reference composition */}
        {fourthItem && (
          <div className="mt-4 lg:mt-6 w-full">
            <BannerCard banner={fourthItem} isWide={true} />
          </div>
        )}

        {/* Any extra items if configured in admin */}
        {extraItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mt-4 lg:mt-6">
            {extraItems.map((banner) => (
              <BannerCard key={banner.id} banner={banner} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default ShopTheLook;
