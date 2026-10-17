import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  BarChart3,
  BookOpen,
  ClipboardList,
  Package,
  Award,
  Grid,
  Layers,
  Sparkles,
  Sliders,
  ClipboardCheck,
  ShoppingCart,
  Undo2,
  Users,
  Percent,
  Video,
  Image,
  FileText,
  Printer,
  User,
  Star,
  Heart,
  Mail,
  Settings,
  LogOut,
  X,
  AlertCircle,
  CheckCircle2,
  Instagram,
  HelpCircle,
  Globe
} from 'lucide-react';

const sidebarSections = [
  {
    title: "DASHBOARD",
    items: [
      { name: "Overview", icon: LayoutDashboard },
      { name: "Analytics", icon: BarChart3 },
      { name: "Reports", icon: ClipboardList }
    ]
  },
  {
    title: "CATALOG",
    items: [
      { name: "Products", icon: Package },
      { name: "Brands", icon: Award },
      { name: "Categories", icon: Grid },
      { name: "Subcategories", icon: Layers },
      { name: "Collections", icon: Sparkles },
      { name: "Fragrance Families", icon: Sparkles },
      { name: "Fragrance Concentration", icon: Sparkles },
      { name: "Availability", icon: CheckCircle2 },
      { name: "Attributes", icon: Sliders },
      { name: "Inventory", icon: ClipboardCheck }
    ]
  },
  {
    title: "SALES",
    items: [
      { name: "Orders", icon: ShoppingCart },
      { name: "Billing & Invoices", icon: Printer },
      { name: "Returns / Refunds", icon: Undo2 },
      { name: "Customers", icon: Users },
      { name: "Coupons / Offers", icon: Percent }
    ]
  },
  {
    title: "CONTENT",
    items: [
      { name: "Hero Video", icon: Video },
      { name: "Home Page Collection", icon: Image },
      { name: "Shop Miniatures", icon: Package },
      { name: "Instagram Reels", icon: Instagram },
      { name: "FAQs", icon: HelpCircle },
      { name: "Shop By Scents", icon: Sparkles },
      { name: "Explore Banner", icon: Image },
      { name: "Global Alert", icon: AlertCircle },
      { name: "Benefits Strip", icon: ClipboardList },
      { name: "Blogs", icon: BookOpen },
      { name: "About Us", icon: FileText },
      { name: "Mobile Category", icon: Grid }
    ]
  },
  {
    title: "CUSTOMER ENGAGEMENT",
    items: [
      { name: "Reviews", icon: Star },
      { name: "Wishlists", icon: Heart },
      { name: "Newsletter Subscribers", icon: Mail }
    ]
  },
  {
    title: "SETTINGS",
    items: [
      { name: "Profile Settings", icon: User },
      { name: "Store Settings", icon: Settings },
      { name: "SEO & Sitemap", icon: Globe }
    ]
  }
];

const AdminSidebar = ({ activeItem, setActiveItem, isOpen, onClose }) => {
  const MIN_WIDTH = 220;
  const MAX_WIDTH = 340;
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('adminSidebarWidth');
    return saved ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parseInt(saved, 10))) : 260;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

  // Lock body scroll on mobile drawer open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const onMouseMove = useCallback((e) => {
    if (!isResizing.current) return;
    const diff = e.clientX - startX.current;
    const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth.current + diff));
    setSidebarWidth(newWidth);
  }, []);

  const onMouseUp = useCallback(() => {
    if (!isResizing.current) return;
    isResizing.current = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem('adminSidebarWidth', String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const handleMouseDown = (e) => {
    isResizing.current = true;
    startX.current = e.clientX;
    startWidth.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminToken");
      window.location.reload();
    }
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
      />

      {/* Main Sidebar (Desktop fixed/static & Mobile slide-out drawer) */}
      <aside
        style={{ width: undefined }}
        className={`fixed top-0 bottom-0 left-0 z-50 w-[285px] max-w-[85vw] bg-white border-r border-zinc-200 text-zinc-700 flex flex-col h-screen shrink-0 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none lg:static lg:h-screen lg:z-10 lg:translate-x-0 selection:bg-black selection:text-white ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Header */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-zinc-200/80 sticky top-0 bg-white/95 backdrop-blur z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-[#d4af37] flex items-center justify-center shadow-md border border-[#d4af37]/20">
              <Sparkles size={17} strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-[13px] font-bold font-serif tracking-[0.12em] text-zinc-900 uppercase">
                MAHIRASH
              </p>
              <p className="text-[12px] text-[#b8860b] uppercase tracking-[0.2em] font-semibold">Luxury Atelier</p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="lg:hidden p-2 rounded-xl text-zinc-400 hover:text-black hover:bg-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-grow overflow-y-auto px-3.5 py-4 sm:px-4 sm:py-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-200">
          {sidebarSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="text-[12px] font-bold text-zinc-400 tracking-[0.25em] px-3 uppercase mb-1.5">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.name === activeItem;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setActiveItem(item.name);
                        onClose();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium tracking-wide transition-all cursor-pointer ${isActive
                          ? "bg-black text-white shadow-md shadow-black/10 font-semibold"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-black border border-transparent"
                        }`}
                    >
                      <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} className={isActive ? "text-[#d4af37]" : "text-zinc-400 group-hover:text-black"} />
                      <span className="truncate">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Resize Handle - Desktop only */}
        <div
          onMouseDown={handleMouseDown}
          title="Drag to resize sidebar"
          className="hidden lg:block absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-[#c9a962]/40 active:bg-[#c9a962] transition-colors z-30 group"
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-8 rounded-full bg-zinc-300 group-hover:bg-[#c9a962] transition-colors" />
        </div>

        {/* Logout button */}
        <div className="p-3.5 sm:p-4 border-t border-zinc-200 bg-zinc-50/80">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[12px] font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-all border border-red-200/80 cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <LogOut size={14} />
            <span>LOGOUT ADMIN</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
export { sidebarSections };
