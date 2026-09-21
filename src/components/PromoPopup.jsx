import React, { useState, useEffect } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { db } from './Firebase';
import { doc, getDoc } from 'firebase/firestore';
import OptimizedCloudinaryImage from './OptimizedCloudinaryImage';

const PromoPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [notify, setNotify] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [promoConfig, setPromoConfig] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "promo_popup"));
        if (snap.exists() && snap.data().isActive) {
          setPromoConfig(snap.data());
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!promoConfig) return;
    const hasBeenDismissed = sessionStorage.getItem('pasoja_promo_dismissed');
    if (hasBeenDismissed) return;

    if (location.pathname.startsWith('/admin')) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 8000);

    return () => clearTimeout(timer);
  }, [promoConfig, location.pathname]);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('pasoja_promo_dismissed', 'true');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
    sessionStorage.setItem('pasoja_promo_dismissed', 'true');

    if (promoConfig?.whatsapp_number) {
      const msg = `*New Sign-up Request!* ✨%0A%0A*Email:* ${email}%0A*Mobile:* +91 ${mobile}%0A*Birthday:* ${birthday}%0A*Updates Subscribe:* ${notify ? "Yes" : "No"}`;
      const waUrl = `https://wa.me/${promoConfig.whatsapp_number}?text=${msg}`;
      window.open(waUrl, '_blank');
    }

    setTimeout(() => {
      setIsVisible(false);
    }, 2500);
  };

  if (!isVisible || !promoConfig) return null;

  return (
    <div
      className="fixed inset-0 z-[100000] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300"
      onClick={handleClose}
    >
      {/* Modal Card */}
      <div
        className="relative bg-white max-w-3xl w-full rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 text-zinc-900 border border-zinc-200 animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-20 p-1.5 rounded-full bg-white/90 md:bg-zinc-100 text-zinc-600 hover:text-black hover:bg-zinc-200 transition-all shadow-md cursor-pointer"
          aria-label="Close popup"
        >
          <X size={18} />
        </button>

        {/* Left Column: Visual Banner Graphic */}
        <div className="md:col-span-6 relative bg-black min-h-[240px] md:min-h-[460px] flex items-center justify-center overflow-hidden group">

          <picture className="absolute inset-0 w-full h-full object-cover">
            <source media="(min-width: 1024px)" srcSet={promoConfig.desktop_image || promoConfig.tablet_image || promoConfig.mobile_image} />
            <source media="(min-width: 768px)" srcSet={promoConfig.tablet_image || promoConfig.desktop_image || promoConfig.mobile_image} />
            <img
              src={promoConfig.mobile_image || promoConfig.desktop_image}
              alt="Promo Flash Campaign Window"
              className="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-700"
            />
          </picture>

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

          {/* Graphical Poster Typography Overlay */}
          <div className="relative z-10 p-6 text-center text-white space-y-2 flex flex-col items-center justify-end h-full w-full">
            <span className="px-3 py-1 bg-[#b8860b] text-white font-black text-[9px] uppercase tracking-[0.25em] rounded-sm shadow-md flex items-center gap-1 mx-auto">
              <Sparkles size={11} /> MAHIRASH PARFUMERIE
            </span>

            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none text-white drop-shadow-md">
              {promoConfig.title || "MAHIRASH SALE"}
            </h3>
          </div>
        </div>

        {/* Right Column: Lead Form */}
        <div className="md:col-span-6 p-6 sm:p-8 flex flex-col justify-center relative bg-white">
          {isSubmitted ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in duration-300">
              <div className="w-14 h-14 bg-amber-50 text-[#b8860b] border border-amber-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check size={28} strokeWidth={2.5} />
              </div>
              <h4 className="text-xl text-zinc-900 uppercase tracking-wide">You're On The List!</h4>
              <p className="text-[14px] text-zinc-600 leading-relaxed max-w-xs mx-auto">
                Thank you for joining Mahirash Parfumerie.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Header Text */}
              <div>
                <h4 className="text-lg md:text-xl text-zinc-900 font-bold tracking-tight mb-0.5">
                  {promoConfig.title || 'Mahirash Sale is LIVE ✨'}
                </h4>
                <p className="text-[14px] text-zinc-600 leading-relaxed font-light">
                  {promoConfig.subtitle || 'Your favourite luxury extraits just dropped.'} <br />
                  <span className="font-semibold text-zinc-800">
                    {promoConfig.highlight_text || 'Log in and claim your discount 💖'}
                  </span>
                </p>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Phone Input with +91 Country Code */}
                <div className="flex gap-2">
                  <span className="px-3 py-2.5 bg-zinc-100 border border-zinc-300 rounded-lg text-[14px]   text-zinc-700 flex items-center justify-center shrink-0">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    placeholder="Enter Mobile Number*"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                {/* Email Input */}
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email*"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                {/* Birthday Input */}
                <div>
                  <input
                    type="text"
                    placeholder="Birthday (DD-MM-YYYY)"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-black focus:bg-white transition-all"
                  />
                </div>

                {/* Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                  <input
                    type="checkbox"
                    checked={notify}
                    onChange={(e) => setNotify(e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer accent-black"
                  />
                  <span className="text-[11px] text-zinc-600 font-medium">
                    Notify me for any updates & offers
                  </span>
                </label>

                {/* Submit CTA */}
                <button
                  type="submit"
                  className="w-full py-3 bg-[#505050] hover:bg-black text-white   text-[14px] rounded-lg uppercase tracking-wider transition-all duration-300 shadow-md active:scale-[0.99] mt-2 cursor-pointer"
                >
                  Join Us
                </button>
              </form>

              {/* Footer Terms Micro-text */}
              <p className="text-[10px] text-zinc-400 text-center leading-normal pt-1">
                By logging in, you're agreeing to our{' '}
                <Link to="/privacy" onClick={handleClose} className="underline text-zinc-600 hover:text-black">
                  Privacy Policy
                </Link>{' '}
                &{' '}
                <Link to="/terms" onClick={handleClose} className="underline text-zinc-600 hover:text-black">
                  Terms of Service
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoPopup;
