import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { db } from '../../components/Firebase';
import { collection, getDocs, query } from 'firebase/firestore';

const FALLBACK_LUXURY_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-perfume-bottle-in-a-glass-display-41525-large.mp4';

const Hero = () => {
  const [videoConfig, setVideoConfig] = useState({
    videoUrl: FALLBACK_LUXURY_VIDEO,
    mobileVideoUrl: '',
    posterUrl: '',
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchHeroVideo = async () => {
      try {
        // 0. Check localStorage for instant sync
        const localStr = localStorage.getItem('mahirash_hero_video_config');
        if (localStr) {
          try {
            const parsed = JSON.parse(localStr);
            if (parsed && parsed.videoUrl) {
              setVideoConfig(parsed);
            }
          } catch (e) {
            // ignore
          }
        }

        // 1. Check dedicated hero_video collection
        const qVideo = query(collection(db, 'hero_video'));
        const snapVideo = await getDocs(qVideo);

        if (!snapVideo.empty) {
          const data = snapVideo.docs[0].data();
          if (data.is_active !== false) {
            const conf = {
              videoUrl: data.videoUrl || data.url || FALLBACK_LUXURY_VIDEO,
              mobileVideoUrl: data.mobileVideoUrl || '',
              posterUrl: data.posterUrl || '',
              is_active: true
            };
            setVideoConfig(conf);
            localStorage.setItem('mahirash_hero_video_config', JSON.stringify(conf));
          }
        } else {
          // 2. Fallback check hero_slides collection
          const qSlides = query(collection(db, 'hero_slides'));
          const snapSlides = await getDocs(qSlides);
          if (!snapSlides.empty) {
            const first = snapSlides.docs[0].data();
            if (first.is_active !== false) {
              const videoCandidate = first.image && (
                first.image.endsWith('.mp4') ||
                first.image.includes('/video/upload/') ||
                first.image.endsWith('.webm') ||
                first.image.endsWith('.mov')
              ) ? first.image : FALLBACK_LUXURY_VIDEO;

              const conf = {
                videoUrl: videoCandidate,
                mobileVideoUrl: first.mobileImage || '',
                posterUrl: first.posterUrl || '',
                is_active: true
              };
              setVideoConfig(conf);
              localStorage.setItem('mahirash_hero_video_config', JSON.stringify(conf));
            }
          }
        }
      } catch (err) {
        console.warn("Using default hero video fallback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroVideo();
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const currentVideoUrl = (typeof window !== 'undefined' && window.innerWidth <= 640 && videoConfig.mobileVideoUrl)
    ? videoConfig.mobileVideoUrl
    : (videoConfig.videoUrl || FALLBACK_LUXURY_VIDEO);

  if (!videoConfig.is_active) {
    return null;
  }

  return (
    <section className="relative h-[85vh] sm:h-[90vh] md:h-screen w-full overflow-hidden bg-[#FAF8F5] mt-[72px] md:mt-[115px]">
      {/* Background Video Player */}
      <div className="absolute inset-0 z-0">
        {loading ? (
          <div className="w-full h-full bg-[#FAF8F5] animate-pulse flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-2 border-[#B8860B]/30 border-t-[#B8860B] animate-spin" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
            className="w-full h-full"
          >
            <video
              key={currentVideoUrl}
              ref={videoRef}
              src={currentVideoUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="auto"
              poster={videoConfig.posterUrl || undefined}
              className="w-full h-full object-cover select-none pointer-events-none"
            />
          </motion.div>
        )}
      </div>

      {/* Aesthetic Light Edge & Gradient Overlays */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-[#FAF8F5] pointer-events-none" />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,rgba(184,134,11,0.06)_0%,transparent_75%)] pointer-events-none" />

      {/* Floating White Glassmorphism Sound Mute Toggle */}
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        onClick={toggleMute}
        aria-label={isMuted ? "Unmute video audio" : "Mute video audio"}
        className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 z-10 p-3 rounded-full bg-white/85 hover:bg-white backdrop-blur-md border border-[#E5D5B8] text-[#B8860B] hover:text-[#8C6207] transition-all shadow-xl active:scale-95 group gold-glow-sm"
      >
        {isMuted ? (
          <VolumeX size={18} className="group-hover:scale-110 transition-transform text-[#B8860B]" />
        ) : (
          <Volume2 size={18} className="group-hover:scale-110 transition-transform text-[#B8860B]" />
        )}
      </motion.button>
    </section>
  );
};

export default Hero;

