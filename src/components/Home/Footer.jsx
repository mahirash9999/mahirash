import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../components/StoreProvider';
import {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  ChevronUp,
  ShieldCheck,
  Heart
} from 'lucide-react';

const Footer = () => {
  const { siteSettings } = useStore();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#650018] text-[#FCF9F4] pt-12 pb-6 border-t border-[#800020] font-sans relative z-20">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-8">

        {/* 5-Column Grid Matching Reference Screenshot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 pb-10 border-b border-white/10">

          {/* Col 1: Brand Logo, Tagline & Social Links */}
          <div className="flex flex-col items-start space-y-3.5">
            <Link to="/" className="inline-block">
              <img
                src={siteSettings?.logo_url || "/logom.webp"}
                alt="MAHIRASH"
                className="h-8 sm:h-9 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-[11px] text-white/70 font-light leading-snug">
              Premium Fragrances for Every Mood
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={siteSettings?.instagram_url || "https://www.instagram.com/mahirashparfumerie/"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              >
                <Instagram size={13} />
              </a>
              <a
                href={siteSettings?.facebook_url || "https://www.facebook.com/mahirashparfumerie/"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              >
                <Facebook size={13} />
              </a>
              <a
                href={siteSettings?.youtube_url || "https://www.youtube.com/@mahirashparfumerie"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              >
                <Youtube size={13} />
              </a>
              <a
                href={siteSettings?.twitter_url || "https://x.com/MahirashParfum"}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
              >
                <Twitter size={13} />
              </a>
            </div>
          </div>

          {/* Col 2: Shop */}
          <div className="flex flex-col space-y-2">
            <h4 className="text-[11.5px] font-semibold uppercase tracking-wider text-white mb-1">
              Shop
            </h4>
            <ul className="space-y-1.5 text-[11px] text-white/70">
              <li>
                <Link to="/shop?gender=Men" className="hover:text-white transition-colors">
                  Mens Perfumes
                </Link>
              </li>
              <li>
                <Link to="/shop?gender=Women" className="hover:text-white transition-colors">
                  Womens Perfumes
                </Link>
              </li>
              <li>
                <Link to="/shop?gender=Unisex" className="hover:text-white transition-colors">
                  Unisex Fragrances
                </Link>
              </li>
              <li>
                <Link to="/shop?category=Gift%20Sets" className="hover:text-white transition-colors">
                  Gift Sets
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">
                  New Arrivals
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div className="flex flex-col space-y-2">
            <h4 className="text-[11.5px] font-semibold uppercase tracking-wider text-white mb-1">
              Quick Links
            </h4>
            <ul className="space-y-1.5 text-[11px] text-white/70">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Return & Refund
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Help */}
          <div className="flex flex-col space-y-2">
            <h4 className="text-[11.5px] font-semibold uppercase tracking-wider text-white mb-1">
              Help
            </h4>
            <ul className="space-y-1.5 text-[11px] text-white/70">
              <li>
                <a href="/#faq" className="hover:text-white transition-colors">
                  FAQs
                </a>
              </li>
              <li>
                <Link to="/account" className="hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Secure Payments */}
          <div className="flex flex-col space-y-2.5">
            <h4 className="text-[11.5px] font-semibold uppercase tracking-wider text-white mb-1">
              Secure Payments
            </h4>
            {/* Payment badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Visa Badge */}
              <div className="bg-white rounded px-2 py-0.5 h-6 flex items-center justify-center shadow-xs">
                <span className="text-[#1A1F71] font-black text-[10px] tracking-tight italic">
                  VISA
                </span>
              </div>
              {/* Mastercard Badge */}
              <div className="bg-white rounded px-1.5 py-0.5 h-6 flex items-center justify-center shadow-xs">
                <div className="flex items-center -space-x-1">
                  <div className="w-3 h-3 rounded-full bg-[#EB001B]" />
                  <div className="w-3 h-3 rounded-full bg-[#F79E1B]/90" />
                </div>
              </div>
              {/* UPI Badge */}
              <div className="bg-white rounded px-2 py-0.5 h-6 flex items-center justify-center shadow-xs">
                <span className="text-[#008000] font-bold text-[9px] tracking-wider">
                  UPI
                </span>
              </div>
            </div>
            <p className="text-[10px] text-white/60 font-light pt-1 flex items-center gap-1">
              <ShieldCheck size={11} className="text-[#B88D46]" />
              100% Secure & Safe Checkout
            </p>
          </div>

        </div>

        {/* Bottom Strip */}
        <div className="pt-5 flex flex-col sm:flex-row items-center justify-center gap-3 text-[10.5px] text-white/60">
          <p>© {currentYear} Mahirash. All Rights Reserved.</p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
