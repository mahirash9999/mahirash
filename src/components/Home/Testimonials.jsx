import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../components/Firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Star, Award, ShoppingBag, ThumbsUp, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import SectionHeader from './SectionHeader';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

const DEFAULT_REVIEWS = [
  {
    id: 'rev_1',
    name: 'Rohan S.',
    rating: 5,
    status: 'VERIFIED BUYER',
    review: 'Absolutely love the fragrance! The quality and packaging is premium.'
  },
  {
    id: 'rev_2',
    name: 'Priya M.',
    rating: 5,
    status: 'VERIFIED BUYER',
    review: 'Long lasting and elegant. Perfect for daily use.'
  },
  {
    id: 'rev_3',
    name: 'Karan T.',
    rating: 5,
    status: 'VERIFIED BUYER',
    review: 'Mahirash never disappoints. Best scents and great service.'
  },
  {
    id: 'rev_4',
    name: 'Ananya D.',
    rating: 5,
    status: 'VERIFIED BUYER',
    review: 'The oud projection is exceptional. Highly recommended to perfume lovers.'
  }
];

const DEFAULT_STATS = [
  { id: '1', icon: 'users', value: '15,000+', label: 'Happy Customers' },
  { id: '2', icon: 'star', value: '4.9/5', label: 'Average Rating' },
  { id: '3', icon: 'bag', value: '2,500+', label: 'Products Sold' },
  { id: '4', icon: 'thumb', value: '98%', label: 'Positive Reviews' }
];

const renderStatIcon = (type) => {
  const props = { size: 16, strokeWidth: 1.8, className: "text-[#B88D46]" };
  switch (type?.toLowerCase()) {
    case 'users':
      return <Users {...props} />;
    case 'star':
      return <Star {...props} />;
    case 'bag':
    case 'messagesquare':
    case 'award':
      return <ShoppingBag {...props} />;
    case 'thumb':
    case 'refreshcw':
      return <ThumbsUp {...props} />;
    default:
      return <Star {...props} />;
  }
};

const Testimonials = () => {
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [loading, setLoading] = useState(true);
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchCommunityData = async () => {
      try {
        const revQuery = query(collection(db, 'testimonials'));
        const revSnap = await getDocs(revQuery);
        if (!revSnap.empty) {
          const list = revSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => item.is_active !== false);
          list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
          if (list.length > 0) {
            setReviews(list.map(r => ({
              id: r.id,
              name: r.name,
              rating: r.rating || 5,
              status: r.status || 'VERIFIED BUYER',
              review: r.review || r.text || r.title
            })));
          }
        }

        const statsQuery = query(collection(db, 'community_stats'), orderBy('sort_order', 'asc'));
        const statsSnap = await getDocs(statsQuery);
        if (!statsSnap.empty) {
          const list = statsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(item => item.is_active !== false);
          if (list.length >= 4) {
            setStats(list.slice(0, 4).map(s => ({
              id: s.id,
              icon: s.icon || 'star',
              value: s.value,
              label: s.label
            })));
          }
        }
      } catch (err) {
        console.warn("Using default testimonials fallback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, []);

  if (loading || reviews.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-[#FCF9F4] relative border-t border-[#E9DCCB]/60">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section Heading with Decorative Gold Lines */}
        <SectionHeader title="THE" accent="MAHIRASH EXPERIENCE" />

        {/* Testimonials Carousel Container with Side Arrows */}
        <div className="relative w-full mx-auto py-2 px-6 sm:px-8">

          {/* Nav Arrow Left */}
          <button
            onClick={() => swiperRef.current?.slidePrev()}
            aria-label="Previous review"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#E9DCCB] bg-white text-[#30231F] hover:text-[#800020] hover:border-[#800020] transition-all flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
          >
            <ChevronLeft size={15} />
          </button>

          {/* Nav Arrow Right */}
          <button
            onClick={() => swiperRef.current?.slideNext()}
            aria-label="Next review"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#E9DCCB] bg-white text-[#30231F] hover:text-[#800020] hover:border-[#800020] transition-all flex items-center justify-center shadow-xs cursor-pointer active:scale-95"
          >
            <ChevronRight size={15} />
          </button>

          <Swiper
            onSwiper={(swiper) => { swiperRef.current = swiper; }}
            spaceBetween={14}
            slidesPerView={1}
            breakpoints={{
              640: { slidesPerView: 2, spaceBetween: 16 },
              1024: { slidesPerView: 3, spaceBetween: 18 },
              1280: { slidesPerView: 4, spaceBetween: 18 }
            }}
            className="w-full !overflow-visible"
          >
            {reviews.map((item) => (
              <SwiperSlide key={item.id} className="h-auto">
                <div className="bg-white rounded-md border border-[#E9E0D6] p-4 sm:p-5 flex flex-col justify-between h-full shadow-xs">
                  <div>
                    {/* Top Row: 5 Red/Maroon Stars + VERIFIED BUYER badge */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-0.5 text-[#800020]">
                        {[...Array(item.rating || 5)].map((_, idx) => (
                          <Star key={idx} size={11} fill="#800020" stroke="#800020" />
                        ))}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-[#800020]">
                        {item.status || 'VERIFIED BUYER'}
                      </span>
                    </div>

                    {/* Review text */}
                    <p className="text-[#30231F] text-[11.5px] sm:text-[12px] leading-relaxed font-normal mb-3">
                      "{item.review}"
                    </p>
                  </div>

                  {/* Customer Name */}
                  <span className="text-[#75665D] text-[10.5px] font-medium pt-2 border-t border-zinc-100 block">
                    {item.name}
                  </span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* 4 Statistics Horizontal Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-10">
          {stats.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-md border border-[#E9E0D6] px-3.5 py-3 flex items-center gap-3 shadow-xs"
            >
              <div className="w-9 h-9 rounded-full bg-[#FCF9F4] border border-[#E9DCCB] flex items-center justify-center shrink-0">
                {renderStatIcon(st.icon)}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm sm:text-base font-bold text-[#30231F] leading-tight">
                  {st.value}
                </span>
                <span className="text-[9.5px] sm:text-[10px] text-[#75665D] uppercase tracking-wider font-medium">
                  {st.label}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
export { Testimonials as TestimonialsSection };
