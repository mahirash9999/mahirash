import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../components/Firebase';
import { useStore } from '../../components/StoreProvider';
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

        {/* ── BRAND STATEMENT & VIP NEWSLETTER CARD ── */}
        <div className="mb-16 pb-12 border-b border-zinc-800/90">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
            <div className="max-w-xl">
              <Link to="/" className="inline-flex flex-col mb-4">
                <img
                  src={siteSettings?.logo_url || "/logom.webp"}
                  alt="MAHIRASH"
                  className="h-9 md:h-12 w-auto object-contain brightness-0 invert mb-1"
                />
                <span className="text-[12px] md:text-[13px] uppercase tracking-[0.4em] text-[#c9a962] font-semibold">
                  LUXURY PERFUMES · HANDCRAFTED EXTRAITS
                </span>
              </Link>
              <p className="text-zinc-300 text-sm leading-relaxed font-light">
                Mahirash is a modern luxury fragrance house crafting rare botanical extraits de parfum, royal Cambodian ouds, and signature fragrances designed to leave an unforgettable lasting impression.
              </p>
            </div>

            {/* VIP Newsletter Box */}
            <div className="w-full lg:max-w-lg bg-zinc-950/80 border border-[#c9a962]/30 p-6 md:p-8 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-[#c9a962]" />
                <h5 className="text-[12px] uppercase tracking-[0.3em] text-[#c9a962] font-bold">
                  JOIN THE MAHIRASH INNER CIRCLE
                </h5>
              </div>
              <p className="text-zinc-400 text-[14px] font-light mb-4">
                Receive private invitations to confidential drops, rare extraits, and secret releases.
              </p>

              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 px-4 py-3.5 bg-black border border-zinc-800 text-white placeholder-zinc-500 text-[14px] outline-none focus:border-[#c9a962] transition-colors rounded-none"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#b8860b] via-[#d4af37] to-[#b8860b] hover:from-white hover:to-white text-black font-bold text-[12px] uppercase tracking-[0.25em] px-7 py-3.5 transition-all duration-300 shrink-0 cursor-pointer shadow-md flex items-center justify-center gap-2 rounded-none"
                >
                  <span>{subscribed ? 'SUBSCRIBED' : 'JOIN VIP'}</span>
                  <ArrowRight size={13} />
                </button>
              </form>
              {subscribed && (
                <p className="text-[12px] text-[#c9a962] mt-2 tracking-wider font-semibold">
                  ✓ Welcome to the Inner Circle. Please check your inbox.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── MAIN NAVIGATION & CONTACT GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-16">

          {/* Shop Extraits */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#c9a962] mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#c9a962] rounded-full inline-block" />
              THE COLLECTIONS
            </h4>
            <ul className="flex flex-col gap-3">
              {categories.map((item) => (
                <li key={item}>
                  <Link to={`/shop?category=${encodeURIComponent(item)}`} className="text-[14px] text-zinc-300 hover:text-[#c9a962] transition-colors duration-300 font-light tracking-wide flex items-center gap-2 group">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#c9a962]">&rarr;</span>
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Menu */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#c9a962] mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#c9a962] rounded-full inline-block" />
              MENU
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { label: 'Home', path: '/' },
                { label: 'Shop', path: '/shop' },
                { label: 'About Us', path: '/about' },
                { label: 'Brands', path: '/shop' },
                { label: 'Contact Us', path: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="text-[14px] text-zinc-300 hover:text-[#c9a962] transition-colors duration-300 font-light tracking-wide flex items-center gap-2 group">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#c9a962]">&rarr;</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#c9a962] mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#c9a962] rounded-full inline-block" />
              QUICK LINKS
            </h4>
            <ul className="flex flex-col gap-3">
              {[
                { label: 'Search', path: '/shop' },
                { label: 'FAQs', path: '/#faq' },
                { label: 'Privacy Policy', path: '/privacy' },
                { label: 'Shipping Policy', path: '/terms' },
                { label: 'Terms & Conditions', path: '/terms' }
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.path} className="text-[14px] text-zinc-300 hover:text-[#c9a962] transition-colors duration-300 font-light tracking-wide flex items-center gap-2 group">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[#c9a962]">&rarr;</span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Direct & Socials */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.25em] text-[#c9a962] mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#c9a962] rounded-full inline-block" />
              DIRECT CONTACT
            </h4>
            <div className="flex flex-col gap-4 mb-7">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-[#c9a962] flex-shrink-0 mt-0.5" />
                <p className="text-[14px] text-zinc-300 font-light leading-relaxed">
                  Mahirash Parfumerie (Express Global Shipping)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-[#c9a962] flex-shrink-0" />
                <a href={`tel:${siteSettings?.whatsapp_number || "+918959041514"}`} className="text-[14px] text-zinc-300 font-mono hover:text-[#c9a962] transition-colors">
                  {siteSettings?.whatsapp_number || "+91 8959041514"}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-[#c9a962] flex-shrink-0" />
                <a href={`mailto:${siteSettings?.email || "care@mahirash.com"}`} className="text-[14px] text-zinc-300 font-light hover:text-[#c9a962] transition-colors">
                  {siteSettings?.email || "care@mahirash.com"}
                </a>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center gap-2.5">
              {[
                { icon: Instagram, url: 'https://www.instagram.com/mahirashparfumerie/', label: 'Instagram' },
                { icon: Facebook, url: 'https://www.facebook.com/mahirashparfumerie/', label: 'Facebook' },
                { icon: Youtube, url: 'https://www.youtube.com/@mahirashparfumerie', label: 'YouTube' },
                { icon: Twitter, url: 'https://x.com/MahirashParfum', label: 'Twitter' }
              ].map(({ icon: Icon, url, label }, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-10 h-10 border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-400 hover:text-black hover:bg-[#c9a962] hover:border-[#c9a962] transition-all duration-300 rounded-none cursor-pointer"
                >
                  <Icon size={16} strokeWidth={1.75} />
                </a>
              ))}
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
