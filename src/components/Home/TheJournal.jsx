import React, { useState, useEffect } from "react";
import { Instagram, ArrowRight } from "lucide-react";
import { listenToNewsReels, DEFAULT_REELS } from "../../services/newsService";
import { getOptimizedVideoUrl } from "../../config/cloudinary";
import SectionHeader from "./SectionHeader";

const TheJournal = () => {
  const [reelPosts, setReelPosts] = useState(DEFAULT_REELS);

  useEffect(() => {
    const unsubscribe = listenToNewsReels((data) => {
      if (data && data.length > 0) {
        setReelPosts(data);
      }
    });
    return () => unsubscribe();
  }, []);

  const count = reelPosts.length;
  // If 2 posts, render 2 intentionally large, prominent cards
  const isTwoPosts = count === 2;
  const displayPosts = count >= 3 ? reelPosts.slice(0, 3) : reelPosts.slice(0, 2);

  return (
    <section className="bg-[#FCF9F4] py-10 sm:py-14 relative">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8">

        {/* Centered Section Header with Decorative Gold Lines */}
        <SectionHeader title="MOMENTS THAT" accent="INSPIRE US" />

        {/* Social Cards: Prominent, properly proportioned cards */}
        <div className="flex justify-center mt-3">
          <div
            className={`w-full ${
              isTwoPosts
                ? "max-w-[840px] grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8"
                : "max-w-[1100px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6"
            }`}
          >
            {displayPosts.map((post, index) => {
              const videoSrc = getOptimizedVideoUrl(post.video, { width: 600 });
              return (
                <div
                  key={post.id || index}
                  onClick={() => window.open(post.url || "https://www.instagram.com/mahirashparfumerie/", "_blank")}
                  className="group bg-white rounded-xl border border-[#E9E0D6] overflow-hidden shadow-sm hover:border-[#800020] hover:shadow-xl transition-all duration-500 cursor-pointer flex flex-col"
                >
                  {/* Media Container (Video / Image) with generous aspect ratio */}
                  <div className="relative aspect-[1/1] sm:aspect-[4/3] lg:aspect-[1/1] w-full min-h-[240px] sm:min-h-[270px] overflow-hidden bg-stone-900">
                    {post.video ? (
                      <video
                        src={videoSrc}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <img
                        src={post.image || "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800"}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none" />

                    {/* Top Badges */}
                    <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between z-10">
                      <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 shadow-xs">
                        <Instagram size={12} className="text-white" />
                        <span className="text-[10px] font-bold text-white tracking-wider uppercase">
                          @MAHIRASH.PERFUMES
                        </span>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-xs">
                        <Instagram size={12} />
                      </div>
                    </div>
                  </div>

                  {/* Caption Below Image with comfortable padding */}
                  <div className="p-4 sm:p-5 bg-white flex-grow flex items-center border-t border-[#E9E0D6]/60">
                    <p className="text-[12px] sm:text-[13px] text-[#30231F] leading-snug line-clamp-2 font-normal">
                      {post.title || "Behind the scenes at Mahirash — crafting luxury fragrances for you."}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Centered Maroon Pill CTA: FOLLOW OUR JOURNEY → */}
        <div className="mt-8 sm:mt-10 flex justify-center">
          <a
            href="https://www.instagram.com/mahirashparfumerie/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-8 py-3 rounded-full bg-[#800020] hover:bg-[#650018] text-white text-[11px] sm:text-[12px] font-semibold uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-xl cursor-pointer active:scale-95 group"
          >
            <Instagram size={15} />
            <span>FOLLOW OUR JOURNEY</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

      </div>
    </section>
  );
};

export default TheJournal;
