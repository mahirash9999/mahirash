import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './Firebase';
import { useStore } from './StoreProvider';
import {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Phone,
  Mail,
  MapPin,
  ChevronUp,
  Sparkles,
  ArrowRight
} from 'lucide-react';

const Footer = () => {
  const { siteSettings } = useStore();
  const currentYear = new Date().getFullYear();
  const [categories, setCategories] = useState([]);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const snap = await getDocs(collection(db, 'categories'));
        if (!snap.empty) {
          const list = snap.docs
            .map(d => d.data())
            .filter(c => c.is_active !== false)
            .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
            .map(c => c.name)
            .filter(Boolean);
          if (list.length > 0) {
            setCategories(list.slice(0, 6));
          }
        }
      } catch (err) {
        console.error("Failed to fetch footer categories", err);
      }
    };
    fetchCats();
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="relative bg-black pt-16 md:pt-24 pb-10 overflow-hidden border-t border-[#c9a962]/40 text-white font-sans">
      {/* Luxury Ambient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[radial-gradient(circle_at_top,rgba(201,169,98,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-[1800px] mx-auto px-5 sm:px-8 lg:px-12 relative z-10">

        {/* ── BRAND STATEMENT ── */}
        <div className="mb-14 pb-10 border-b border-zinc-800/90 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl">
            <Link to="/" className="inline-flex flex-col mb-2">
              <img
                src={siteSettings?.logo_url || "/logom.webp"}
                alt="MAHIRASH"
                className="h-8 md:h-10 w-auto object-contain brightness-0 invert mb-1"
              />
              <span className="text-[12px] uppercase tracking-[0.4em] text-[#c9a962] font-semibold">
                HAUTE PARFUMERIE · PARIS & DUBAI
              </span>
            </Link>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-light">
              Crafting rare botanical extraits de parfum, royal Cambodian ouds, and bespoke olfactory signatures designed to leave an undeniable sillage.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {[
              { icon: Instagram, url: siteSettings?.instagram_url || 'https://www.instagram.com/mahirashparfumerie/', label: 'Instagram' },
              { icon: Facebook, url: siteSettings?.facebook_url || 'https://www.facebook.com/mahirashparfumerie/', label: 'Facebook' },
              { icon: Youtube, url: siteSettings?.youtube_url || 'https://www.youtube.com/@mahirashparfumerie', label: 'YouTube' },
              { icon: Twitter, url: siteSettings?.twitter_url || 'https://x.com/MahirashParfum', label: 'Twitter' }
            ].map(({ icon: Icon, url, label }, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-9 h-9 border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-[#c9a962] hover:border-[#c9a962] transition-all duration-300 cursor-pointer"
              >
                <Icon size={15} strokeWidth={1.75} />
              </a>
            ))}
          </div>
        </div>

        {/* ── 4-COLUMN CONTENT GRID (BELVISH CONTENT & MAHIRASH DESIGN) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16">

          {/* Col 1: Join The Club */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#c9a962]">
              Join The Club
            </h4>
            <p className="text-zinc-300 text-sm font-light leading-relaxed">
              Stay ahead of the curve with our offers updates!
            </p>

            <form onSubmit={handleSubscribe} className="relative mt-2">
              <div className="relative border-b border-zinc-700 focus-within:border-[#c9a962] transition-colors pb-1 flex items-center">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-transparent py-2.5 pr-8 text-sm text-white placeholder-zinc-500 outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="text-zinc-400 hover:text-[#c9a962] transition-colors cursor-pointer p-1"
                >
                  <ArrowRight size={17} />
                </button>
              </div>
              {subscribed && (
                <p className="text-xs text-[#c9a962] mt-2 font-medium">
                  ✓ Thank you for subscribing!
                </p>
              )}
            </form>

            {/* DMCA Protected Badge */}
            <div className="pt-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-sm">
                <span className="bg-[#4caf50] text-black text-[12px] font-black px-1.5 py-0.5 rounded-xs tracking-wider">
                  DMCA
                </span>
                <span className="text-[12px] uppercase font-bold tracking-widest text-zinc-300">
                  PROTECTED
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Menu */}
          <div>
            <h4 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#c9a962] mb-5">
              Menu
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { label: 'Home', path: '/' },
                { label: 'Shop', path: '/shop' },
                { label: 'Brands', path: '/shop' },
                { label: 'About Us', path: '/about' },
                { label: 'Contact Us', path: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-sm text-zinc-300 hover:text-[#c9a962] transition-colors font-light tracking-wide flex items-center gap-2 group"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#c9a962]">&rarr;</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#c9a962] mb-5">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { label: 'Search', path: '/shop' },
                { label: 'FAQs', path: '/#faq' },
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Shipping Policy', path: '/terms' },
                { label: 'Terms & Conditions', path: '/terms' },
                { label: 'Request a fragrance', path: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    className="text-sm text-zinc-300 hover:text-[#c9a962] transition-colors font-light tracking-wide flex items-center gap-2 group"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#c9a962]">&rarr;</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Our Store */}
          <div className="space-y-4">
            <h4 className="text-[13px] font-bold uppercase tracking-[0.2em] text-[#c9a962] mb-5">
              Our Store
            </h4>
            <div className="flex flex-col gap-3 text-sm text-zinc-300 font-light leading-relaxed">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-[#c9a962] shrink-0 mt-0.5" />
                <div>
                  <p>M-4, Kirti Nagar, New Delhi</p>
                  <p className="text-zinc-400 text-xs mt-0.5">Zip Code: 110015</p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Phone size={16} className="text-[#c9a962] shrink-0" />
                <a
                  href={`tel:${siteSettings?.whatsapp_number || "+918959041514"}`}
                  className="font-mono text-zinc-300 hover:text-[#c9a962] transition-colors"
                >
                  Phone: {siteSettings?.whatsapp_number || "+91 8959041514"}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail size={16} className="text-[#c9a962] shrink-0" />
                <a
                  href={`mailto:${siteSettings?.email || "care@mahirash.com"}`}
                  className="text-zinc-300 hover:text-[#c9a962] transition-colors"
                >
                  Email: {siteSettings?.email || "care@mahirash.com"}
                </a>
              </div>
            </div>
          </div>
        </div>



        {/* ── BOTTOM BAR & LEGAL ── */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 pt-4">
          <p className="text-zinc-400 text-[14px] tracking-wider text-center md:text-left font-light">
            © {currentYear} MAHIRASH PARFUMERIE. ALL RIGHTS RESERVED.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-5 text-[14px] font-light tracking-wider">
            <Link to="/privacy" className="text-zinc-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span className="text-zinc-700">•</span>
            <Link to="/terms" className="text-zinc-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span className="text-zinc-700">•</span>
            <Link to="/return-policy" className="text-zinc-400 hover:text-white transition-colors">
              Return & Refund
            </Link>
            <span className="text-zinc-700">•</span>
            <a
              href="https://www.letskillify.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c9a962] hover:underline font-semibold transition-colors"
            >
              Designed by LetSkillify
            </a>
          </div>

          <button
            type="button"
            onClick={() => {
              window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
            }}
            className="w-10 h-10 border border-zinc-800 bg-zinc-950 text-zinc-400 flex items-center justify-center hover:bg-[#b8860b] hover:text-white hover:border-[#b8860b] transition-all duration-300 order-first md:order-last cursor-pointer rounded-none shadow-md"
            aria-label="Scroll to top"
          >
            <ChevronUp size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
