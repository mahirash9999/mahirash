import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SectionHeader = ({
  eyebrow,
  title,
  accent,
  accentWord,
  onPrev,
  onNext,
  showArrows = false,
  className = "",
  description = null,
  rightContent = null
}) => {
  let primaryText = title;
  let maroonText = accent || accentWord;

  if (!maroonText && typeof title === 'string') {
    const words = title.trim().split(' ');
    if (words.length > 1) {
      maroonText = words.pop();
      primaryText = words.join(' ');
    }
  }

  return (
    <div className={`w-full mb-7 md:mb-10 text-center relative ${className}`}>
      {/* Optional Eyebrow */}
      {eyebrow && (
        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#B88D46] font-semibold block mb-2 font-sans">
          {eyebrow}
        </span>
      )}

      {/* Main Header Row with Gold Decorative Lines */}
      <div className="relative flex items-center justify-center">
        <div className="flex items-center justify-center gap-3 sm:gap-4 md:gap-5">
          {/* Left Decorative Gold Line */}
          <span className="w-8 sm:w-12 md:w-14 h-[1px] bg-[#B88D46] inline-block opacity-85 shrink-0" />

          {/* Title */}
          <h2 className="text-xl sm:text-2xl lg:text-[26px] font-normal tracking-[0.1em] text-[#30231F] uppercase font-serif select-none">
            {primaryText}{' '}
            {maroonText && (
              <span className="text-[#800020] font-serif font-normal">{maroonText}</span>
            )}
          </h2>

          {/* Right Decorative Gold Line */}
          <span className="w-8 sm:w-12 md:w-14 h-[1px] bg-[#B88D46] inline-block opacity-85 shrink-0" />
        </div>

        {/* Optional Right Action Controls (e.g. Carousel Prev/Next Arrows) */}
        {(onPrev || onNext || rightContent) && (
          <div className="hidden sm:flex items-center gap-2 absolute right-0 top-1/2 -translate-y-1/2 z-10">
            {rightContent}
            {onPrev && (
              <button
                type="button"
                onClick={onPrev}
                aria-label="Previous slide"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#E9E0D6] bg-white flex items-center justify-center text-[#75665D] hover:text-[#800020] hover:border-[#800020] transition-all cursor-pointer shadow-xs"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                aria-label="Next slide"
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#E9E0D6] bg-white flex items-center justify-center text-[#75665D] hover:text-[#800020] hover:border-[#800020] transition-all cursor-pointer shadow-xs"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Optional Short Description */}
      {description && (
        <p className="text-[#75665D] text-xs sm:text-[13px] font-light leading-relaxed max-w-lg mx-auto mt-2.5">
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeader;
