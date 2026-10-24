import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Preloader = ({ onComplete, label = 'Loading Store', isDataReady }) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [phase, setPhase] = useState('loading'); // 'loading' | 'ready'

  useEffect(() => {
    const contentTimer = setTimeout(() => setShowContent(true), 60);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        const remaining = 100 - prev;
        const step = isDataReady ? 25 : (remaining > 20 ? 14 : 4);
        return Math.min(prev + step, 100);
      });
    }, 45);

    return () => {
      clearInterval(timer);
      clearTimeout(contentTimer);
    };
  }, [isDataReady]);

  useEffect(() => {
    if (progress >= 100) {
      setPhase('ready');
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 750);
      }, 350);
      return () => clearTimeout(exitTimer);
    }
  }, [progress, onComplete]);

  const displayProgress = Math.floor(Math.min(progress, 100));

  return (
    <div
      className="fixed inset-0 z-[10000] overflow-hidden bg-[#070707] font-['Inter',sans-serif]"
      style={{ pointerEvents: isExiting ? 'none' : 'auto' }}
    >
      {/* Radial Brand Maroon Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(128,0,32,0.15)_0%,_transparent_65%)] pointer-events-none" />

      {/* Split curtain lift transition */}
      <div className="absolute inset-0 flex flex-col pointer-events-none z-10">
        {/* Top curtain */}
        <div
          className="w-full h-1/2 bg-[#0a0a0a] border-b border-[#800020]/30"
          style={{
            transform: isExiting ? 'translateY(-100%)' : 'translateY(0%)',
            transition: 'transform 750ms cubic-bezier(0.85, 0, 0.15, 1)',
          }}
        />
        {/* Bottom curtain */}
        <div
          className="w-full h-1/2 bg-[#0a0a0a] border-t border-[#800020]/30"
          style={{
            transform: isExiting ? 'translateY(100%)' : 'translateY(0%)',
            transition: 'transform 750ms cubic-bezier(0.85, 0, 0.15, 1)',
          }}
        />
      </div>

      {/* Thin Maroon Progress Bar on top edge */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-40 bg-zinc-900">
        <div
          className="h-full bg-gradient-to-r from-[#800020] via-[#a31238] to-[#800020] transition-all duration-150 ease-out shadow-[0_0_12px_rgba(128,0,32,0.8)]"
          style={{ width: `${displayProgress}%` }}
        />
      </div>

      {/* Corner Metallic Accents */}
      <div
        className="absolute inset-6 md:inset-10 pointer-events-none z-30"
        style={{ opacity: isExiting ? 0 : 1, transition: 'opacity 400ms ease' }}
      >
        <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#800020]/40" />
        <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#800020]/40" />
        <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-[#800020]/40" />
        <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#800020]/40" />
      </div>

      {/* Central Content Container */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center z-30 px-6"
        style={{
          opacity: showContent ? (isExiting ? 0 : 1) : 0,
          transform: showContent ? (isExiting ? 'scale(0.96)' : 'scale(1)') : 'scale(0.97)',
          transition: 'opacity 450ms ease, transform 450ms ease',
        }}
      >
        {/* Crisp White Brand Logo */}
        <div className="mb-10 text-center flex flex-col items-center">
          <img
            src="/logom.webp"
            alt="MAHIRASH"
            className="h-12 sm:h-16 md:h-20 w-auto object-contain brightness-0 invert drop-shadow-[0_0_20px_rgba(255,255,255,0.15)] mb-2"
          />
          <div className="flex items-center gap-3 mt-1">
            <span className="h-[1px] w-6 bg-[#800020]/60" />
            <span className="text-[12px] sm:text-[13px] uppercase tracking-[0.35em] text-zinc-300 font-semibold">
              LUXURY PERFUMES
            </span>
            <span className="h-[1px] w-6 bg-[#800020]/60" />
          </div>
        </div>

        {/* Minimal Progress Counter */}
        <div className="relative flex flex-col items-center mb-8">
          <span className="text-3xl sm:text-4xl font-light font-mono text-white tabular-nums tracking-wider">
            {displayProgress}<span className="text-[16px] text-[#800020] font-sans ml-1 font-bold">%</span>
          </span>
          <div className="w-24 h-[2px] bg-zinc-800 mt-3 overflow-hidden rounded-full relative">
            <div
              className="h-full bg-[#800020] transition-all duration-150 ease-out shadow-[0_0_8px_rgba(128,0,32,0.8)]"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>

        {/* Phase Status Text */}
        <div className="h-5 overflow-hidden relative flex items-center justify-center">
          <span
            className="block text-[12px] uppercase tracking-[0.25em] transition-all duration-500 font-semibold"
            style={{
              color: phase === 'ready' ? '#ffffff' : '#888888',
            }}
          >
            {phase === 'ready' ? 'ENTER STORE' : label}
          </span>
        </div>

        {/* Animated Pulse Dots */}
        {phase === 'loading' && (
          <div className="flex gap-2 mt-5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 bg-[#800020] rounded-full"
                style={{
                  animation: `preloader-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes preloader-pulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

export default Preloader;