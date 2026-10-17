import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { db } from '../../components/Firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Star, Award, MessageSquare, RefreshCw, Quote, CheckCircle2 } from 'lucide-react';
import { Autoplay, Mousewheel, Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

const IconMap = {
  Star: Star,
  Award: Award,
  MessageSquare: MessageSquare,
  RefreshCw: RefreshCw
};

const DEFAULT_COMMUNITY_SETTINGS = {
  eyebrow: 'WORDS FROM CONNOISSEURS',
  heading: 'THE MAHIRASH EXPERIENCE',
  description_line_1: 'Real patrons. Authentic sillage. Verified reviews.',
  description_line_2: 'See why connoisseurs choose Mahirash Parfumerie.',
  is_active: true
};

const DEFAULT_TEXT_REVIEWS = [
  {
    id: 'rev_1',
    name: 'Devendra R.',
    location: 'Mumbai',
    rating: 5,
    fragrance: 'Oud Noir Extrait (50ml)',
    title: 'Unrivaled Sillage & Longevity',
    review: 'Mahirash Oud Noir is absolute royalty. Just two sprays on my pulse points lasted over 18 hours. The depth of genuine Cambodian oud combined with warm amber gathers compliments wherever I go.',
    status: 'Verified Patron',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'rev_2',
    name: 'Ananya M.',
    location: 'New Delhi',
    rating: 5,
    fragrance: 'Royal Rose & Oud (50ml)',
    title: 'Haute Perfumerie at its Finest',
    review: 'The blend of Damask rose and dark resinous oud is intoxicatingly opulent. The packaging feels like opening a bespoke jewel box. I am officially a patron for life.',
    status: 'Verified Patron',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'rev_3',
    name: 'Vikram S.',
    location: 'Bengaluru',
    rating: 5,
    fragrance: 'Imperial Amber Extrait (50ml)',
    title: 'Extremely Rich & Sophisticated',
    review: 'Warm, rich, and deeply comforting amber with spicy accords. It evolves beautifully throughout the evening. The pre-order arrived right on time with flawless packaging.',
    status: 'Verified Patron',
    sort_order: 3,
    is_active: true
  },
  {
    id: 'rev_4',
    name: 'Farhan H.',
    location: 'Dubai, UAE',
    rating: 5,
    fragrance: 'Golden Sandalwood (100ml)',
    title: 'True Artisanal Extraits',
    review: 'As an avid collector of niche perfumerie, Mahirash rivals top Parisian perfume houses. Creamy mysore sandalwood with delicate botanical notes. Extraordinary formulation.',
    status: 'Verified Patron',
    sort_order: 4,
    is_active: true
  },
  {
    id: 'rev_5',
    name: 'Priya K.',
    location: 'Hyderabad',
    rating: 5,
    fragrance: 'Velvet Musk & Spice (50ml)',
    title: 'Magnetizing Fragrance',
    review: 'Subtle yet lingering presence that lasts all day without being overwhelming. Everyone at my workplace asked what scent I was wearing. Truly high concentration extraits.',
    status: 'Verified Patron',
    sort_order: 5,
    is_active: true
  },
  {
    id: 'rev_6',
    name: 'Karan V.',
    location: 'Pune',
    rating: 5,
    fragrance: 'Midnight Vanilla Extrait (50ml)',
    title: 'Sensual & Long-Lasting',
    review: 'Smoky, dark vanilla with subtle wood accents. Far superior to standard luxury EDPs. The sillage projection is immaculate and the gold detail on the bottle is pure luxury.',
    status: 'Verified Patron',
    sort_order: 6,
    is_active: true
  }
];

const DEFAULT_COMMUNITY_STATS = [
  { id: 'stat_1', icon: 'Star', value: '15,000+', label: 'Fragrance Connoisseurs', sort_order: 1, is_active: true },
  { id: 'stat_2', icon: 'Award', value: '4.9/5', label: 'Avg Sillage Rating', sort_order: 2, is_active: true },
  { id: 'stat_3', icon: 'MessageSquare', value: '2,500+', label: 'Verified Reviews', sort_order: 3, is_active: true },
  { id: 'stat_4', icon: 'RefreshCw', value: '98%', label: 'Recommend Us', sort_order: 4, is_active: true }
];

const Testimonials = () => {
  const [settings, setSettings] = useState(DEFAULT_COMMUNITY_SETTINGS);
  const [reviews, setReviews] = useState(DEFAULT_TEXT_REVIEWS);
  const [stats, setStats] = useState(DEFAULT_COMMUNITY_STATS);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        // 1. Settings
        const settingsDoc = await getDocs(collection(db, 'community_settings'));
        if (!settingsDoc.empty) {
          setSettings(settingsDoc.docs[0]?.data() || DEFAULT_COMMUNITY_SETTINGS);
        }

        // 2. Text Reviews
        const revQuery = query(collection(db, 'testimonials'));
        const revSnap = await getDocs(revQuery);
        if (!revSnap.empty) {
          const list = revSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => item.is_active !== false);
          list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
          setReviews(list.length > 0 ? list : DEFAULT_TEXT_REVIEWS);
        } else {
          setReviews(DEFAULT_TEXT_REVIEWS);
        }

        // 3. Stats
        const statsQuery = query(collection(db, 'community_stats'), orderBy('sort_order', 'asc'));
        const statsSnap = await getDocs(statsQuery);
        if (!statsSnap.empty) {
          const list = statsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => item.is_active !== false);
          setStats(list.length > 0 ? list : DEFAULT_COMMUNITY_STATS);
        }
      } catch (err) {
        console.warn("Using default testimonials fallback:", err);
        setSettings(DEFAULT_COMMUNITY_SETTINGS);
        setReviews(DEFAULT_TEXT_REVIEWS);
        setStats(DEFAULT_COMMUNITY_STATS);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, []);

  if (loading || !settings.is_active) return null;

  return (
    <section className="py-14 md:py-24 bg-[#F5F2EB] overflow-hidden relative border-t border-[#E5D5B8]/40">
      {/* Luxury Ambient Radial Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-[1450px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Centered Header Layout without eyebrow */}
        <div className="flex flex-col items-center justify-center text-center gap-4 mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-[0.15em] text-[#0D0D0D] uppercase text-center">
            {(() => {
              const text = settings.heading || 'CLIENT EXPERIENCES';
              const words = text.trim().split(' ');
              if (words.length <= 1) return text;
              const last = words.pop();
              return (
                <>
                  {words.join(' ')} <span className="text-[#B8860B] italic font-serif">{last}</span>
                </>
              );
            })()}
          </h2>
          <div className="flex items-center justify-center gap-2.5">
            <button
              onClick={() => swiperRef.current?.slidePrev()}
              aria-label="Previous review"
              className="w-9 h-9 rounded-full border border-[#E5D5B8] bg-white flex items-center justify-center text-zinc-700 hover:text-white hover:bg-[#B8860B] hover:border-[#B8860B] transition-all duration-300 cursor-pointer shadow-xs"
            >
              &larr;
            </button>
            <button
              onClick={() => swiperRef.current?.slideNext()}
              aria-label="Next review"
              className="w-9 h-9 rounded-full border border-[#E5D5B8] bg-white flex items-center justify-center text-zinc-700 hover:text-white hover:bg-[#B8860B] hover:border-[#B8860B] transition-all duration-300 cursor-pointer shadow-xs"
            >
              &rarr;
            </button>
          </div>
        </div>

        {/* Written Review Swiper Slider */}
        <div className="w-full mb-14 testimonials-swiper">
          <Swiper
            onSwiper={(swiper) => { swiperRef.current = swiper; }}
            spaceBetween={20}
            slidesPerView={1}
            speed={800}
            mousewheel={{
              forceToAxis: true,
              sensitivity: 1,
            }}
            autoplay={{
              delay: 4500,
              disableOnInteraction: false,
            }}
            breakpoints={{
              640: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
            }}
            modules={[Autoplay, Mousewheel, Pagination]}
            className="w-full overflow-visible py-2"
          >
            {reviews.map((item) => (
              <SwiperSlide key={item.id} className="h-full">
                <div className="relative h-full flex flex-col justify-between bg-white rounded-2xl border border-[#E5D5B8] p-6 sm:p-8 transition-all duration-500 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:border-[#B8860B] hover:shadow-[0_15px_35px_rgba(184,134,11,0.12)] group">
                  {/* Decorative Gold Top Accent Line */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#B8860B]/60 to-transparent group-hover:via-[#B8860B] transition-colors duration-500" />

                  {/* Top Content: Stars & Fragrance Tag */}
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      {/* 5 Imperial Gold Stars */}
                      <div className="flex items-center gap-1">
                        {[...Array(item.rating || 5)].map((_, idx) => (
                          <Star key={idx} size={14} fill="#B8860B" stroke="#B8860B" />
                        ))}
                      </div>

                      {/* Verified Badge */}
                      <span className="inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.2em] font-bold text-[#B8860B] bg-[#FAF8F5] border border-[#E5D5B8] px-2.5 py-1 rounded-full shadow-sm">
                        <CheckCircle2 size={11} className="text-[#B8860B]" />
                        {item.status || 'Verified Patron'}
                      </span>
                    </div>

                    {/* Fragrance Tag */}
                    {item.fragrance && (
                      <span className="text-[12px] uppercase tracking-[0.25em] font-bold text-[#B8860B] block mb-3">
                        {item.fragrance}
                      </span>
                    )}

                    {/* Review Title */}
                    {item.title && (
                      <h4 className="text-base sm:text-lg font-medium text-[#0D0D0D] tracking-wide mb-3 leading-snug">
                        "{item.title}"
                      </h4>
                    )}

                    {/* Review Body */}
                    <p className="text-stone-600 text-[14px] sm:text-sm font-light leading-relaxed mb-6 italic">
                      "{item.review}"
                    </p>
                  </div>

                  {/* Bottom Content: Author & Location */}
                  <div className="pt-4 border-t border-[#E5D5B8]/50 flex items-center justify-between mt-auto">
                    <div>
                      <h5 className="text-[14px] font-bold uppercase tracking-[0.15em] text-[#0D0D0D]">
                        {item.name}
                      </h5>
                      {item.location && (
                        <span className="text-[12px] text-stone-500 uppercase tracking-wider font-light">
                          {item.location}
                        </span>
                      )}
                    </div>
                    <Quote size={22} className="text-[#B8860B]/20 group-hover:text-[#B8860B]/50 transition-colors" />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Social Proof Statistics Grid Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-8 border-t border-[#E5D5B8]/40">
          {stats.map((st) => {
            const Icon = IconMap[st.icon] || Star;
            return (
              <div key={st.id} className="bg-white rounded-2xl border border-[#E5D5B8] p-6 text-center flex flex-col items-center justify-center hover:border-[#B8860B] transition-all duration-300 shadow-sm group">
                <div className="w-11 h-11 rounded-full bg-[#FAF8F5] border border-[#E5D5B8] flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <Icon size={18} className="text-[#B8860B]" />
                </div>
                <span className="text-xl sm:text-2xl font-bold tracking-wide text-[#0D0D0D] uppercase leading-none mb-1">
                  {st.value}
                </span>
                <span className="text-[12px] sm:text-[12px] uppercase tracking-[0.2em] font-semibold text-stone-600">
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
export { Testimonials as TestimonialsSection };
