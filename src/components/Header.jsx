import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  User, Search, Menu, X, Heart, ArrowRight, ShoppingBag,
  ChevronDown, Compass, HelpCircle, Tag, Sparkles, MapPin,
  ShieldCheck, Award, ExternalLink
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useStore } from './StoreProvider';
import { db } from './Firebase';
import { collection, getDocs } from 'firebase/firestore';
import OptimizedCloudinaryImage from './OptimizedCloudinaryImage';

const easing = [0.22, 1, 0.36, 1];

const DEFAULT_COLLECTIONS = [];

const POPULAR_SEARCHES = [
  'Extrait',
  'Oud',
  'Eau de Parfum',
  'Vanilla',
  'Amber',
  'Discovery Set'
];

const SEARCH_PLACEHOLDERS = [
  'EAU DE PARFUM',
  'EXTRAIT DE PARFUM',
  'ROYAL OUD',
  'AMBER & MUSK',
  'FLORAL ESSENCE',
  'CITRUS & WOOD',
  'DISCOVERY SETS',
  'LUXURY GIFT BOXES'
];

const AnimatedSearchBox = ({ searchQuery, setSearchQuery, onSubmit, onFocus }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <form onSubmit={onSubmit} className="relative flex items-center w-full">
      <div className="relative w-full flex items-center bg-white/90 border border-zinc-300 focus-within:border-[#c9a962] rounded-none px-3.5 py-2.5 transition-all duration-300 shadow-sm">
        <Search size={17} className="text-[#c9a962] shrink-0 mr-2.5" strokeWidth={2} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={onFocus}
          className="w-full bg-transparent text-zinc-900 outline-none font-medium text-[13px] tracking-wide z-10 placeholder-transparent"
        />
        {!searchQuery && (
          <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none overflow-hidden h-5 flex items-center z-0">
            <AnimatePresence mode="wait">
              <motion.span
                key={index}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.35, ease: easing }}
                className="text-zinc-400 text-[12px] tracking-[0.12em] uppercase whitespace-nowrap font-normal flex items-center gap-1.5"
              >
                <span>Search</span>
                <span className="text-[#c9a962] font-semibold">"{SEARCH_PLACEHOLDERS[index]}"</span>
              </motion.span>
            </AnimatePresence>
          </div>
        )}
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="p-1 text-zinc-400 hover:text-black transition-colors z-20"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </form>
  );
};

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollectionsDropdownOpen, setIsCollectionsDropdownOpen] = useState(false);
  const [isMobileCollectionsOpen, setIsMobileCollectionsOpen] = useState(false);
  const [collections, setCollections] = useState(DEFAULT_COLLECTIONS);
  const [allProducts, setAllProducts] = useState([]);
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [globalAlerts, setGlobalAlerts] = useState([
    'COMPLIMENTARY EXPRESS SHIPPING OVER ₹1999',
    'HAUTE PARFUMERIE • CRAFTED WITH RARE BOTANICAL ESSENCES',
    'SIGNATURE EXTRAITS DE PARFUM',
    '100% AUTHENTIC FINE FRAGRANCES',
    'EXPLORE OUR EXCLUSIVE DISCOVERY SETS',
  ]);

  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cart, wishlist } = useStore();
  const { scrollY } = useScroll();

  // Scroll listener for sticky styles & mobile search bar toggling
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 30);

      if (currentScrollY <= 25) {
        setShowSearchBar(true);
      } else {
        if (currentScrollY > lastScrollY + 6) {
          setShowSearchBar(false);
        } else if (currentScrollY < lastScrollY - 6) {
          setShowSearchBar(true);
        }
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const cartCount = cart.length;
  const wishlistCount = wishlist.length;

  const topbarHeight = useTransform(scrollY, [0, 50], ['40px', '0px']);
  const topbarOpacity = useTransform(scrollY, [0, 30], [1, 0]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsCollectionsDropdownOpen(false);
    setIsSearchActive(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  // Handle Escape key to close search overlay
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isSearchActive) {
        setIsSearchActive(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchActive]);

  // Fetch all products & categories
  useEffect(() => {
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        const productsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllProducts(productsList);

        try {
          const catSnap = await getDocs(collection(db, 'categories'));
          if (!catSnap.empty) {
            const categoriesList = catSnap.docs
              .map(doc => doc.data())
              .filter(cat => cat.is_active !== false)
              .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
              .map(cat => cat.name)
              .filter(Boolean);
            if (categoriesList.length > 0) {
              setCollections(categoriesList);
            }
          }
        } catch (catErr) {
          console.warn("Could not fetch categories collection", catErr);
        }

        try {
          const alertsSnap = await getDocs(collection(db, 'global_alerts'));
          if (!alertsSnap.empty) {
            const alertsList = alertsSnap.docs
              .map(doc => doc.data())
              .filter(a => a.is_active !== false)
              .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
              .map(a => a.text)
              .filter(Boolean);
            if (alertsList.length > 0) {
              setGlobalAlerts(alertsList);
            }
          }
        } catch (alertErr) {
          console.warn("Could not fetch global_alerts collection", alertErr);
        }
      } catch (err) {
        console.error('Error loading header data:', err);
      }
    };
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    const term = searchQuery.trim();
    setIsSearchActive(false);
    setSearchQuery('');
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  const handleQuickTagClick = (tag) => {
    setIsSearchActive(false);
    setSearchQuery('');
    navigate(`/shop?search=${encodeURIComponent(tag)}`);
  };

  const handleProductClick = (productId) => {
    setIsSearchActive(false);
    setSearchQuery('');
    navigate(`/product/${productId}`);
  };

  const handleCollectionSelect = (col) => {
    setIsCollectionsDropdownOpen(false);
    setIsMobileMenuOpen(false);
    if (col === 'All') {
      navigate('/shop');
    } else {
      navigate(`/shop?category=${encodeURIComponent(col)}`);
    }
  };

  // Filter live search matches
  const liveSearchResults = searchQuery.trim()
    ? allProducts.filter(p => {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.material?.toLowerCase().includes(q) ||
        p.colors?.toLowerCase().includes(q)
      );
    })
    : [];

  // Unified Navigation Menu items used for both Desktop and Mobile Header
  const MAIN_NAV_ITEMS = [
    { id: 'shop', name: 'Shop All', path: '/shop', type: 'link', position: 'left' },
    { id: 'collections', name: 'Collections', type: 'dropdown', position: 'left' },
    { id: 'story', name: 'Our Story', path: '/about', type: 'link', position: 'right' },
    { id: 'contact', name: 'Contact', path: '/contact', type: 'link', position: 'right' },
  ];

  const leftNavItems = MAIN_NAV_ITEMS.filter(item => item.position === 'left');
  const rightNavItems = MAIN_NAV_ITEMS.filter(item => item.position === 'right');

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-[100] flex flex-col pointer-events-auto font-['Inter',sans-serif]">

        {/* ── ANNOUNCEMENT TICKER BAR (Active on both Desktop and Mobile) ── */}
        <motion.div
          style={{ height: topbarHeight, opacity: topbarOpacity }}
          className="bg-[#0b0b0b] text-[#e5d5ab] text-[9.5px] sm:text-[10.5px] font-semibold tracking-[0.22em] uppercase overflow-hidden flex items-center border-b border-[#c9a962]/20"
        >
          <motion.div
            animate={{ x: ['0%', '-50%'] }}
            transition={{ repeat: Infinity, duration: 32, ease: 'linear' }}
            className="flex gap-16 whitespace-nowrap"
          >
            {[...globalAlerts, ...globalAlerts].map((item, i) => (
              <span key={i} className="flex items-center gap-6">
                <span className="text-[#c9a962] text-[12px] font-serif">✦</span>
                <span className="hover:text-white transition-colors cursor-pointer">{item}</span>
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* ── MAIN NAV BAR ── */}
        <motion.nav
          className={`transition-all duration-500 border-b w-full ${isScrolled
            ? 'bg-white/95 backdrop-blur-xl shadow-lg border-zinc-200/80 text-zinc-900 py-3.5 md:py-4'
            : 'bg-white/90 backdrop-blur-md border-zinc-200/60 text-zinc-900 py-4 md:py-5'
            } px-4 sm:px-8 md:px-12`}
        >
          <div className="max-w-[1800px] mx-auto w-full grid grid-cols-3 items-center">

            {/* Left Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8 justify-start">
              {leftNavItems.map(item => {
                if (item.type === 'link') {
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`relative text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors duration-300 py-1 group ${location.pathname === item.path && !location.search ? 'text-black' : 'text-zinc-600 hover:text-black'
                        }`}
                    >
                      {item.name}
                      <span className={`absolute bottom-0 left-0 h-[1.5px] bg-[#c9a962] transition-all duration-300 ${location.pathname === item.path && !location.search ? 'w-full' : 'w-0 group-hover:w-full'
                        }`} />
                    </Link>
                  );
                }

                if (item.type === 'dropdown') {
                  return (
                    <div
                      key={item.id}
                      className="relative py-1"
                      onMouseEnter={() => setIsCollectionsDropdownOpen(true)}
                      onMouseLeave={() => setIsCollectionsDropdownOpen(false)}
                    >
                      <button
                        type="button"
                        onClick={() => navigate('/shop')}
                        className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors duration-300 group cursor-pointer ${location.search.includes('category=') || isCollectionsDropdownOpen ? 'text-black' : 'text-zinc-600 hover:text-black'
                          }`}
                      >
                        <span>{item.name}</span>
                        <ChevronDown size={12} className={`transition-transform duration-300 ${isCollectionsDropdownOpen ? 'rotate-180 text-[#c9a962]' : 'text-zinc-400 group-hover:text-zinc-900'
                          }`} />
                        <span className={`absolute bottom-0 left-0 h-[1.5px] bg-[#c9a962] transition-all duration-300 ${location.search.includes('category=') ? 'w-full' : 'w-0 group-hover:w-full'
                          }`} />
                      </button>

                      {/* Rich Luxury Dropdown Menu */}
                      <AnimatePresence>
                        {isCollectionsDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.97 }}
                            transition={{ duration: 0.22, ease: easing }}
                            className="absolute top-full left-0 w-64 bg-white/98 backdrop-blur-xl border border-zinc-200/90 shadow-2xl p-3 z-50 rounded-none border-t-2 border-t-[#c9a962]"
                          >
                            <div className="py-1">
                              <button
                                type="button"
                                onClick={() => handleCollectionSelect('All')}
                                className="w-full text-left px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#c9a962] hover:bg-zinc-50 transition-colors border-b border-zinc-100 mb-1.5 flex items-center justify-between group"
                              >
                                <span className="flex items-center gap-2">
                                  <Sparkles size={13} className="text-[#c9a962]" />
                                  Explore All Scents
                                </span>
                                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                              </button>

                              <div className="space-y-0.5 max-h-[320px] overflow-y-auto scrollbar-hide">
                                {collections.map((col) => (
                                  <button
                                    key={col}
                                    type="button"
                                    onClick={() => handleCollectionSelect(col)}
                                    className="w-full text-left px-3.5 py-2 text-[11.5px] font-medium uppercase tracking-[0.14em] text-zinc-700 hover:text-black hover:bg-zinc-100/80 transition-colors flex items-center justify-between group rounded-none"
                                  >
                                    <span>{col}</span>
                                    <span className="opacity-0 group-hover:opacity-100 text-[#c9a962] text-[12px] transition-opacity">→</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }
                return null;
              })}
            </div>

            {/* Mobile Burger */}
            <div className="flex lg:hidden justify-start">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="text-zinc-900 p-2 -ml-2 hover:bg-zinc-100 rounded-md transition-colors flex items-center gap-2"
                aria-label="Open menu"
              >
                <Menu size={24} strokeWidth={1.5} />
              </button>
            </div>

            {/* Center Logo */}
            <div className="flex justify-center">
              <Link to="/" className="flex flex-col items-center group py-0.5">
                <img
                  src="/logom.webp"
                  alt="MAHIRASH"
                  className="h-8 sm:h-9 md:h-10 w-auto object-contain brightness-0 group-hover:opacity-85 transition-opacity"
                />

              </Link>
            </div>

            {/* Right Desktop Nav Links & Icons */}
            <div className="hidden lg:flex items-center gap-8 justify-end">
              {rightNavItems.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="relative text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600 hover:text-black transition-colors duration-300 group py-1"
                >
                  {link.name}
                  <span className={`absolute bottom-0 left-0 h-[1.5px] bg-[#c9a962] transition-all duration-300 ${location.pathname === link.path ? 'w-full' : 'w-0 group-hover:w-full'
                    }`} />
                </Link>
              ))}

              {/* Action Icons */}
              <div className="flex items-center gap-2.5 ml-2 border-l border-zinc-200/80 pl-6">
                {/* Search Toggle */}
                <button
                  onClick={() => setIsSearchActive(!isSearchActive)}
                  className="p-2 text-zinc-700 hover:text-black hover:scale-105 transition-all duration-300 relative group"
                  aria-label="Search"
                  title="Search products"
                >
                  <Search size={19} strokeWidth={1.75} />
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#c9a962] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                {/* Wishlist Icon */}
                <Link
                  to="/wishlist"
                  className="p-2 text-zinc-700 hover:text-black hover:scale-105 transition-all duration-300 relative group"
                  aria-label="Wishlist"
                  title="Wishlist"
                >
                  <Heart size={19} strokeWidth={1.75} />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#c9a962] text-black text-[12px] font-black rounded-full flex items-center justify-center border border-white shadow-sm">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart Icon */}
                <Link
                  to="/cart"
                  className="p-2 text-zinc-700 hover:text-black hover:scale-105 transition-all duration-300 relative group"
                  aria-label="Cart"
                  title="Shopping Bag"
                >
                  <ShoppingBag size={19} strokeWidth={1.75} />
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#c9a962] text-black text-[12px] font-black rounded-full flex items-center justify-center border border-white shadow-sm">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Account Icon */}
                <Link
                  to="/account"
                  className="p-2 text-zinc-700 hover:text-black hover:scale-105 transition-all duration-300 relative"
                  aria-label="Account"
                  title="My Account"
                >
                  <User size={19} strokeWidth={1.75} />
                </Link>
              </div>
            </div>

            {/* Mobile Right Action Icons */}
            <div className="flex lg:hidden justify-end items-center gap-1.5">
              <Link to="/wishlist" className="p-2 text-zinc-800 hover:text-black relative" aria-label="Wishlist">
                <Heart size={21} strokeWidth={1.6} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#c9a962] text-black text-[12px] font-bold rounded-full flex items-center justify-center border border-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link to="/cart" className="p-2 text-zinc-800 hover:text-black relative" aria-label="Cart">
                <ShoppingBag size={21} strokeWidth={1.6} />
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-[#c9a962] text-black text-[12px] font-bold rounded-full flex items-center justify-center border border-white">
                    {cartCount}
                  </span>
                )}
              </Link>
            </div>

          </div>
        </motion.nav>

        {/* ── MOBILE SEARCH & PINCODE QUICK BAR ── */}
        <motion.div
          initial={false}
          animate={{
            height: (showSearchBar || isSearchActive) ? 'auto' : 0,
            opacity: (showSearchBar || isSearchActive) ? 1 : 0,
          }}
          transition={{ duration: 0.35, ease: easing }}
          className="overflow-hidden block md:hidden bg-[#fbf9f5] border-b border-zinc-200/80 w-full"
        >
          {/* Top Line: Pincode Checker */}
          <div className="px-4 pt-2.5 pb-1 text-[11px] text-zinc-700 flex items-center justify-between border-b border-zinc-200/50">
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-[#c9a962]" />
              <span className="font-medium text-zinc-800">Enter Pincode</span>
              <span className="text-zinc-400">•</span>
              <button
                type="button"
                onClick={() => {
                  const pin = prompt("Enter 6-digit Pincode to check express delivery availability:");
                  if (pin) alert(`Pincode ${pin}: Express fragrance delivery available in 24-48 hrs!`);
                }}
                className="underline text-zinc-800 font-semibold hover:text-[#c9a962] transition-colors cursor-pointer"
              >
                check availability
              </button>
            </div>
            <span className="text-[9.5px] uppercase tracking-widest text-[#c9a962] font-bold">EXPRESS</span>
          </div>

          <div className="px-4 pb-3 pt-2">
            <AnimatedSearchBox
              searchQuery={searchQuery}
              setSearchQuery={(val) => {
                setSearchQuery(val);
                if (!isSearchActive && val.trim().length > 0) {
                  setIsSearchActive(true);
                }
              }}
              onSubmit={handleSearchSubmit}
              onFocus={() => setIsSearchActive(true)}
            />
          </div>
        </motion.div>

        {/* ── LUXURY FULL-SCREEN / EXPANDED SEARCH OVERLAY ── */}
        <AnimatePresence>
          {isSearchActive && (
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: easing }}
              className="absolute left-0 top-full w-full bg-white/98 backdrop-blur-2xl border-b border-zinc-200 px-5 md:px-14 py-8 z-[90] shadow-2xl max-h-[85vh] overflow-y-auto text-zinc-900 border-t-2 border-t-[#c9a962]"
            >
              <div className="max-w-4xl mx-auto space-y-6">

                {/* Overlay Header for Mobile */}
                <div className="flex md:hidden items-center justify-between border-b border-zinc-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#c9a962]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#c9a962] font-semibold">
                      {searchQuery.trim() ? 'Search Results' : 'Explore Perfumerie'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSearchActive(false)}
                    className="text-[11px] uppercase tracking-[0.15em] text-zinc-500 hover:text-black transition-colors flex items-center gap-1 font-semibold"
                  >
                    <span>Close</span>
                    <X size={15} />
                  </button>
                </div>

                {/* Desktop Search Input Form */}
                <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center gap-4 border-b-2 border-zinc-900 pb-4">
                  <Search size={24} className="text-[#c9a962] shrink-0" strokeWidth={2} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search fine fragrances, notes (Oud, Amber, Vanilla)..."
                    className="bg-transparent border-none outline-none w-full text-xl md:text-2xl text-zinc-900 placeholder-zinc-400 font-light tracking-wide"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1.5 text-zinc-400 hover:text-black transition-colors"
                      title="Clear text"
                    >
                      <X size={18} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-3 bg-[#0b0b0b] text-[#e5d5ab] font-bold text-[12px] uppercase tracking-[0.22em] hover:bg-[#c9a962] hover:text-black transition-all shrink-0 shadow-md"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSearchActive(false)}
                    className="text-[11px] uppercase tracking-[0.2em] text-zinc-500 hover:text-black font-semibold shrink-0 transition-colors pl-3"
                  >
                    Close
                  </button>
                </form>

                {/* Quick Suggestion Tag Chips */}
                {!searchQuery.trim() && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center gap-2 text-zinc-400 text-[10.5px] font-semibold uppercase tracking-[0.25em]">
                      <Tag size={13} className="text-[#c9a962]" />
                      <span>Popular Searches & Notes</span>
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      {POPULAR_SEARCHES.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleQuickTagClick(tag)}
                          className="px-4 py-2 bg-zinc-50 border border-zinc-200 hover:border-[#c9a962] text-zinc-700 hover:text-black text-[11px] uppercase tracking-[0.15em] transition-all hover:shadow-sm"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instant Live Search Results */}
                {searchQuery.trim() !== '' && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between text-[10.5px] font-semibold uppercase tracking-[0.22em] text-zinc-500 border-b border-zinc-200 pb-2.5">
                      <span>Products Found ({liveSearchResults.length})</span>
                      {liveSearchResults.length > 0 && (
                        <button
                          type="button"
                          onClick={handleSearchSubmit}
                          className="text-[#c9a962] hover:underline font-bold"
                        >
                          View All Results ({liveSearchResults.length}) →
                        </button>
                      )}
                    </div>

                    {liveSearchResults.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {liveSearchResults.slice(0, 4).map((product) => {
                          const image = product.image || product.images?.[0] || 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800';
                          return (
                            <div
                              key={product.id}
                              onClick={() => handleProductClick(product.id)}
                              className="group bg-white border border-zinc-200/80 hover:border-[#c9a962] p-3 cursor-pointer transition-all duration-300 hover:shadow-lg flex flex-col justify-between"
                            >
                              <div className="aspect-[3/4] bg-zinc-100 overflow-hidden mb-3 relative">
                                <OptimizedCloudinaryImage
                                  src={image}
                                  alt={product.name}
                                  preset="product-card"
                                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                                />
                                {product.stock === 0 && (
                                  <span className="absolute top-2 left-2 bg-red-700 text-white text-[12px] uppercase tracking-widest font-bold px-2 py-0.5">
                                    Sold Out
                                  </span>
                                )}
                              </div>

                              <div>
                                {product.category && (
                                  <span className="text-[12px] uppercase tracking-[0.2em] text-[#c9a962] font-bold block mb-0.5">
                                    {product.category}
                                  </span>
                                )}
                                <h4 className="text-[13px] font-medium text-zinc-900 uppercase tracking-wide truncate group-hover:text-[#c9a962] transition-colors">
                                  {product.name}
                                </h4>
                                <p className="text-[13px] font-mono text-zinc-800 mt-1 font-semibold">
                                  ₹{product.price?.toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-10 text-center space-y-2.5">
                        <p className="text-sm text-zinc-600 font-light">
                          No fragrances found matching "<span className="text-zinc-900 font-semibold">{searchQuery}</span>"
                        </p>
                        <p className="text-[11.5px] text-zinc-400">
                          Try searching for fragrance categories like "Extrait", "Oud", or "Discovery Set".
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── OPULENT MOBILE NAVIGATION DRAWER ── */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: '-100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '-100%' }}
              transition={{ duration: 0.45, ease: easing }}
              className="fixed inset-0 bg-[#0d0d0d] text-white z-[200] flex flex-col font-['Inter',sans-serif]"
            >
              {/* Drawer Top Header */}
              <div className="w-full px-6 h-[76px] flex items-center justify-between border-b border-zinc-800/80 shrink-0">
                <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex flex-col">
                  <img
                    src="/logom.webp"
                    alt="MAHIRASH"
                    className="h-7 sm:h-8 w-auto object-contain brightness-0 invert"
                  />
                  <span className="text-[7.5px] uppercase tracking-[0.38em] text-[#c9a962] mt-0.5 font-semibold">
                    PARFUMERIE
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-zinc-300 p-2 -mr-2 hover:bg-zinc-800 rounded-md transition-colors"
                  aria-label="Close menu"
                >
                  <X size={24} strokeWidth={1.5} />
                </button>
              </div>

              {/* Drawer Scrollable Navigation */}
              <div className="px-8 pt-8 flex-1 overflow-y-auto pb-32 space-y-6">
                <div className="text-[9.5px] uppercase tracking-[0.3em] text-[#c9a962] font-semibold mb-2">
                  HAUTE PERFUMERIE NAVIGATION
                </div>

                {/* Unified Mobile Navigation Items (automatically in-sync with Desktop Header) */}
                {MAIN_NAV_ITEMS.map((item, idx) => {
                  if (item.type === 'link') {
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 + 0.08, duration: 0.4, ease: easing }}
                      >
                        <Link
                          to={item.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-between py-4 border-b border-zinc-800/60 group"
                        >
                          <span className="text-[15px] font-medium tracking-[0.1em] text-zinc-100 group-hover:text-[#c9a962] transition-colors duration-300 uppercase">
                            {item.name}
                          </span>
                          <ArrowRight size={18} className="text-zinc-500 group-hover:text-[#c9a962] group-hover:translate-x-1 transition-all duration-300" />
                        </Link>
                      </motion.div>
                    );
                  }

                  if (item.type === 'dropdown') {
                    return (
                      <div key={item.id} className="border-b border-zinc-800/60">
                        <button
                          type="button"
                          onClick={() => setIsMobileCollectionsOpen(!isMobileCollectionsOpen)}
                          className="w-full flex items-center justify-between py-4 group text-left"
                        >
                          <span className="text-[15px] font-medium tracking-[0.1em] text-zinc-100 group-hover:text-[#c9a962] transition-colors duration-300 uppercase">
                            {item.name}
                          </span>
                          <ChevronDown size={18} className={`text-zinc-500 transition-transform duration-300 ${isMobileCollectionsOpen ? 'rotate-180 text-[#c9a962]' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isMobileCollectionsOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden pb-4 space-y-2.5 pl-4 border-l border-[#c9a962]/30 ml-2"
                            >
                              <button
                                type="button"
                                onClick={() => handleCollectionSelect('All')}
                                className="block text-[12px] uppercase tracking-[0.2em] text-[#c9a962] font-semibold py-1 hover:underline"
                              >
                                All Fragrances →
                              </button>
                              {collections.map((col) => (
                                <button
                                  key={col}
                                  type="button"
                                  onClick={() => handleCollectionSelect(col)}
                                  className="block w-full text-left text-[12.5px] uppercase tracking-[0.15em] text-zinc-300 hover:text-white py-1 transition-colors"
                                >
                                  {col}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  }

                  return null;
                })}

                {/* Account & Care Links */}
                <div className="pt-6 space-y-4">
                  <div className="text-[9.5px] uppercase tracking-[0.3em] text-[#c9a962] font-semibold mb-2">
                    SUPPORT & PRIVILEGES
                  </div>

                  <div className="flex items-center gap-3.5 text-zinc-300 hover:text-white transition-colors">
                    <User size={17} className="text-[#c9a962]" />
                    <Link to="/account" onClick={() => setIsMobileMenuOpen(false)} className="text-[14px] uppercase tracking-wider font-medium">My Account</Link>
                  </div>

                  <div className="flex items-center gap-3.5 text-zinc-300 hover:text-white transition-colors">
                    <Compass size={17} className="text-[#c9a962]" />
                    <Link to="/track" onClick={() => setIsMobileMenuOpen(false)} className="text-[14px] uppercase tracking-wider font-medium">Track Order</Link>
                  </div>

                  <div className="flex items-center gap-3.5 text-zinc-300 hover:text-white transition-colors">
                    <HelpCircle size={17} className="text-[#c9a962]" />
                    <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-[14px] uppercase tracking-wider font-medium">Help & Concierge</Link>
                  </div>
                </div>

                {/* Signature Brand Quote Card */}
                <div className="p-4 bg-zinc-900/80 border border-[#c9a962]/20 text-center space-y-1 rounded-none mt-6">
                  <Sparkles size={14} className="text-[#c9a962] mx-auto mb-1" />
                  <p className="text-[12px] uppercase tracking-[0.25em] text-[#c9a962] font-semibold">MAHIRASH GUARANTEE</p>
                  <p className="text-[11px] text-zinc-400 font-serif italic">"Crafted with rare botanical essences and fine artisanal extraits."</p>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
};

export default Header;