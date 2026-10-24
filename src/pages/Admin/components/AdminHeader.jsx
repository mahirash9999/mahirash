import React, { useState, useEffect } from 'react';
import { Search, Bell, Menu, ExternalLink } from 'lucide-react';
import OptimizedCloudinaryImage from '../../../components/OptimizedCloudinaryImage';

const AdminHeader = ({ activeItem, searchVal, setSearchVal, onMenuClick }) => {
  const [profile, setProfile] = useState(() => {
    const cached = localStorage.getItem("mahirash_admin_profile");
    return cached ? JSON.parse(cached) : {
      name: "Mahirash Admin",
      role: "Super Admin",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
    };
  });

  useEffect(() => {
    const updateProfile = () => {
      const cached = localStorage.getItem("mahirash_admin_profile");
      if (cached) setProfile(JSON.parse(cached));
    };

    window.addEventListener("adminProfileUpdated", updateProfile);
    return () => window.removeEventListener("adminProfileUpdated", updateProfile);
  }, []);

  return (
    <header className="pb-4 sm:pb-6 mb-5 sm:mb-8 border-b border-[#E9DCCB]">
      {/* Top Navbar Row */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile Menu Trigger & Breadcrumb */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar menu"
            className="lg:hidden p-2 rounded-xl bg-white border border-[#E9DCCB] text-[#30231F] hover:text-[#800020] hover:border-[#800020] shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#800020] block truncate">
              ADMIN PANEL
            </span>
            <h1 className="text-base sm:text-xl font-bold font-serif text-[#30231F] tracking-tight truncate leading-tight">
              {activeItem || "Overview"}
            </h1>
          </div>
        </div>

        {/* Right: Actions, Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
          {/* View Store button */}
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#E9DCCB] bg-white hover:bg-[#800020] text-[#30231F] hover:text-white hover:border-[#800020] text-[12px] font-bold rounded-xl transition-all shadow-xs"
          >
            <span>View Store</span>
            <ExternalLink size={12} />
          </a>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="View Store"
            className="sm:hidden p-2 border border-[#E9DCCB] bg-white text-[#30231F] hover:text-[#800020] hover:border-[#800020] rounded-xl shadow-xs"
          >
            <ExternalLink size={15} />
          </a>

          {/* Notifications */}
          <button
            type="button"
            title="Notifications"
            className="p-2 text-[#75665D] hover:text-[#800020] rounded-xl bg-white border border-[#E9DCCB] hover:border-[#800020] relative shadow-xs transition-all cursor-pointer"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#800020] animate-pulse" />
          </button>

          {/* Profile Badge */}
          <div className="flex items-center gap-2.5 pl-1.5 sm:pl-3 sm:border-l sm:border-[#E9DCCB]">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FCF9F4] border border-[#E9DCCB] overflow-hidden shadow-xs shrink-0 ring-2 ring-[#800020]/25">
              <OptimizedCloudinaryImage src={profile.image} preset="avatar" className="w-full h-full object-cover" alt="Profile" />
            </div>
            <div className="hidden md:block">
              <p className="text-[13px] font-bold text-[#30231F] leading-none">{profile.name}</p>
              <p className="text-[11px] text-[#75665D] uppercase tracking-widest mt-1 font-semibold">{profile.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Quick Search Bar */}
      <div className="mt-3.5 sm:mt-4 relative max-w-xl">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#75665D]" />
        <input
          type="text"
          placeholder="Search products, SKU, customer orders..."
          value={searchVal || ''}
          onChange={(e) => setSearchVal?.(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-[#E9DCCB] rounded-xl text-[13px] text-[#30231F] placeholder:text-[#75665D]/70 focus:outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 shadow-xs transition-all"
        />
        {searchVal && (
          <button
            type="button"
            onClick={() => setSearchVal?.('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75665D] hover:text-[#800020] text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
