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
  Layout,
  Video,
  Image,
  FileText,
  Printer,
  User,
  Star,
  Heart,
  Mail,
  Settings,
  CreditCard,
  Truck,
  Landmark,
  ShieldAlert,
  Globe,
  History,
  HelpCircle,
  LogOut,
  Shirt,
  X,
  AlertCircle
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
      { name: "Shop By Scents", icon: Sparkles },
      { name: "Explore Banner", icon: Image },
      { name: "Promo Popup", icon: Image },
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
      { name: "Store Settings", icon: Settings }
    ]
  }
];

const AdminSidebar = ({ activeItem, setActiveItem, isOpen, onClose }) => {
  const MIN_WIDTH = 180;
  const MAX_WIDTH = 340;
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('adminSidebarWidth');
    return saved ? Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parseInt(saved, 10))) : 256;
  });
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);

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
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
        />
      )}

      <aside
        style={{ width: sidebarWidth }}
        className={`relative fixed inset-y-0 left-0 z-40 border-r border-zinc-200 bg-white text-zinc-600 flex flex-col h-screen shrink-0 transition-transform duration-300 lg:static lg:translate-x-0 selection:bg-black selection:text-white ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Brand Header */}
        <div className="px-6 py-5 border-b border-zinc-200 sticky top-0 bg-white z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-black text-[#c9a962] flex items-center justify-center shadow-md">
              <Sparkles size={18} strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-serif tracking-wider text-zinc-900 uppercase">
                MAHIRASH ADMIN
              </p>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Haute Parfumerie</p>
            </div>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-black rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-grow overflow-y-auto px-4 py-6 space-y-7">
          {sidebarSections.map((section) => (
            <div key={section.title} className="space-y-1.5">
              <p className="text-[9px]   text-zinc-400 tracking-[0.2em] px-3 uppercase">
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
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-semibold tracking-wide transition-all ${isActive
                        ? "bg-black text-white shadow-sm"
                        : "text-zinc-600 hover:bg-zinc-100 hover:text-black border border-transparent"
                        }`}
                    >
                      <Icon size={14} strokeWidth={2} />
                      <span>{item.name}</span>
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
          className="hidden lg:block absolute top-0 right-0 h-full w-1.5 cursor-col-resize hover:bg-[#c9a962]/30 active:bg-[#c9a962]/50 transition-colors z-50 group"
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-10 rounded-full bg-zinc-300 group-hover:bg-[#c9a962] transition-colors" />
        </div>

        {/* Logout button */}
        <div className="p-4 border-t border-zinc-200 bg-zinc-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px]   text-red-600 hover:bg-red-50 hover:text-red-700 transition-all border border-red-200"
          >
            <LogOut size={14} />
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
export { sidebarSections };
