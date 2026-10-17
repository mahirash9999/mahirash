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
    <header className="pb-4 sm:pb-6 mb-5 sm:mb-8 border-b border-zinc-200/80">
      {/* Top Navbar Row */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile Menu Trigger & Breadcrumb */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open sidebar menu"
            className="lg:hidden p-2 rounded-xl bg-white border border-zinc-200 text-zinc-700 hover:text-black hover:border-black shadow-xs transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <Menu size={18} />
          </button>

          <div className="min-w-0">
            <span className="text-[12px] uppercase tracking-[0.2em] font-bold text-[#b8860b] block truncate">
              ADMIN PANEL
            </span>
            <h1 className="text-base sm:text-xl font-bold font-serif text-zinc-900 tracking-tight truncate leading-tight">
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
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-zinc-300/80 bg-white hover:bg-zinc-50 text-zinc-800 hover:text-black hover:border-black text-[12px] font-bold rounded-xl transition-all shadow-xs"
          >
            <span>View Store</span>
            <ExternalLink size={12} />
          </a>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title="View Store"
            className="sm:hidden p-2 border border-zinc-200 bg-white text-zinc-700 hover:text-black rounded-xl shadow-xs"
          >
            <ExternalLink size={15} />
          </a>

          {/* Notifications */}
          <button
            type="button"
            title="Notifications"
            className="p-2 text-zinc-600 hover:text-black rounded-xl bg-white border border-zinc-200 hover:border-zinc-300 relative shadow-xs transition-all cursor-pointer"
          >
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          </button>

          {/* Profile Badge */}
          <div className="flex items-center gap-2.5 pl-1.5 sm:pl-3 sm:border-l sm:border-zinc-200">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shadow-xs shrink-0 ring-2 ring-[#d4af37]/20">
              <OptimizedCloudinaryImage src={profile.image} preset="avatar" className="w-full h-full object-cover" alt="Profile" />
            </div>
            <div className="hidden md:block">
              <p className="text-[13px] font-bold text-zinc-900 leading-none">{profile.name}</p>
              <p className="text-[12px] text-zinc-400 uppercase tracking-widest mt-1 font-semibold">{profile.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Quick Search Bar */}
      <div className="mt-3.5 sm:mt-4 relative max-w-xl">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder="Search products, SKU, customer orders..."
          value={searchVal || ''}
          onChange={(e) => setSearchVal?.(e.target.value)}
          className="w-full pl-10 pr-9 py-2.5 bg-white border border-zinc-200 rounded-xl text-[13px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black shadow-xs transition-all"
        />
        {searchVal && (
          <button
            type="button"
            onClick={() => setSearchVal?.('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>
    </header>
  );
};

export default AdminHeader;
