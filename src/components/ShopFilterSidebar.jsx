import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronDown, ChevronUp, RotateCcw, Filter, Check, Star } from "lucide-react";

export const DEFAULT_CATEGORIES = [
  "All",
];

export const DEFAULT_GENDERS = ["All", "Unisex", "Men", "Women"];

export const DEFAULT_SIZES = ["50ml", "100ml", "200ml", "Sample Set"];

export const COLOR_MAP = {
  oud: "#3b2314",
  woody: "#5c4033",
  amber: "#d9a036",
  floral: "#e879f9",
  citrus: "#facc15",
  vanilla: "#fef08a",
  leather: "#27150c",
  spice: "#991b1b",
  black: "#000000",
  white: "#ffffff",
  gold: "#c9a962"
};

const FilterSection = ({ title, children, defaultOpen = false, activeCount = 0 }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-zinc-200 py-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group cursor-pointer py-1"
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px] uppercase tracking-[0.18em] text-zinc-900 group-hover:text-black transition-colors font-medium">
            {title}
          </span>
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#800020] text-[#ffffff] shop-sidebar-badge flex items-center justify-center font-bold shrink-0">
              {activeCount}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp size={14} className="text-zinc-400 group-hover:text-black transition-colors shrink-0" />
        ) : (
          <ChevronDown size={14} className="text-zinc-400 group-hover:text-black transition-colors shrink-0" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ShopFilterSidebar = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  resetFilters,
  totalResults,
  allCategories = DEFAULT_CATEGORIES,
  availableBrands = [],
  availableFamilies = [],
  availableColors = [],
  availableSizes = DEFAULT_SIZES,
  availableConcentrations = [],
  availableAvailabilities = [],
  availableCollections = [],
  availableGenders = [],
  availableMaterials = [],
  maxPriceLimit = 25000
}) => {
  const familiesList = (availableFamilies && availableFamilies.length > 0) ? availableFamilies : (availableColors || []);
  const concentrationsList = (availableConcentrations && availableConcentrations.length > 0) ? availableConcentrations : (availableMaterials || []);
  const genderList = (availableGenders && availableGenders.length > 0) ? availableGenders : DEFAULT_GENDERS.filter(g => g !== "All");

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.brand && filters.brand !== "All") count++;
    if (filters.category && filters.category !== "All") count++;
    if (filters.collection && filters.collection !== "All") count++;
    if (filters.gender && filters.gender !== "All") count++;
    if (filters.minPrice > 0 || (filters.maxPrice !== null && filters.maxPrice !== undefined && filters.maxPrice < maxPriceLimit)) count++;
    if (filters.families && filters.families.length > 0) count += filters.families.length;
    if (filters.sizes && filters.sizes.length > 0) count += filters.sizes.length;
    if (filters.availabilities && filters.availabilities.length > 0) count += filters.availabilities.length;
    if (filters.inStockOnly) count++;
    if (filters.onSaleOnly) count++;
    if (filters.minRating > 0) count++;
    if (filters.concentrations && filters.concentrations.length > 0) count += filters.concentrations.length;
    return count;
  };

  const activeCount = getActiveFilterCount();

  const toggleArrayFilter = (field, item) => {
    const current = filters[field] || [];
    if (current.includes(item)) {
      setFilters(prev => ({ ...prev, [field]: current.filter(x => x !== item) }));
    } else {
      setFilters(prev => ({ ...prev, [field]: [...current, item] }));
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full space-y-2 text-zinc-900">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-[#800020]" />
            <h2 className="text-[14px] uppercase tracking-[0.2em] text-zinc-900 font-semibold">
              Refine By
            </h2>
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-[12px] uppercase tracking-wider text-zinc-400 hover:text-[#800020] transition-colors"
            >
              <RotateCcw size={11} />
              <span>Reset All</span>
            </button>
          )}
        </div>

        {activeCount > 0 && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#800020]/10 border border-[#800020]/30 rounded-sm">
            <span className="text-[12px] font-bold uppercase tracking-widest text-[#800020] shop-sidebar-badge">
              {activeCount} Filter{activeCount > 1 ? "s" : ""} Active
            </span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[12px] uppercase tracking-wider text-zinc-500 hover:text-black"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Filter Sections Scroll Container */}
      <div className="flex-1 overflow-y-auto pr-1 text-[14px] scrollbar-hide space-y-1">

        {/* 1. Perfume Brands Filter */}
        {availableBrands && availableBrands.length > 0 && (
          <FilterSection
            title="Perfume Brands"
            defaultOpen={false}
            activeCount={filters.brand && filters.brand !== "All" ? 1 : 0}
          >
            <div className="space-y-0">
              {["All", ...availableBrands].map(b => {
                const isSelected = (filters.brand || "All") === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, brand: b }))}
                    className={`w-full flex items-center justify-between py-3 text-left uppercase transition-all border-b border-zinc-200 last:border-b-0 ${isSelected
                      ? "text-zinc-900 font-semibold"
                      : "text-zinc-500 hover:text-black"
                      }`}
                  >
                    <span className="shop-sidebar-label">{b}</span>
                    {isSelected && <Check size={13} className="text-[#800020] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* 2. Categories Filter */}
        <FilterSection
          title="Categories"
          defaultOpen={false}
          activeCount={filters.category !== "All" ? 1 : 0}
        >
          <div className="space-y-0">
            {allCategories.map(cat => {
              const isSelected = filters.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilters(prev => ({ ...prev, category: cat }))}
                  className={`w-full flex items-center justify-between py-3 text-left uppercase transition-all border-b border-zinc-200 last:border-b-0 ${isSelected
                    ? "text-zinc-900 font-semibold"
                    : "text-zinc-500 hover:text-black"
                    }`}
                >
                  <span className="shop-sidebar-label">{cat}</span>
                  {isSelected && <Check size={13} className="text-[#800020] shrink-0" />}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Collections Filter (Hidden as requested: display none) */}


        {/* 3. Fragrance Families Filter (Positioned dynamically under Categories) */}
        {familiesList && familiesList.length > 0 && (
          <FilterSection
            title="Fragrance Families"
            defaultOpen={false}
            activeCount={filters.families?.length || 0}
          >
            <div className="space-y-0">
              {familiesList.map(familyName => {
                const isSelected = filters.families?.includes(familyName);

                return (
                  <button
                    key={familyName}
                    type="button"
                    onClick={() => toggleArrayFilter("families", familyName)}
                    className={`w-full flex items-center justify-between py-3 text-left uppercase transition-all border-b border-zinc-200 last:border-b-0 ${isSelected
                      ? "text-zinc-900 font-semibold"
                      : "text-zinc-500 hover:text-black"
                      }`}
                  >
                    <span className="shop-sidebar-label">{familyName}</span>
                    {isSelected && <Check size={13} className="text-[#800020] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* 4. Fragrance Concentration Filter (Positioned dynamically under Families) */}
        {concentrationsList && concentrationsList.length > 0 && (
          <FilterSection
            title="Fragrance Concentration"
            defaultOpen={false}
            activeCount={filters.concentrations?.length || 0}
          >
            <div className="space-y-0">
              {concentrationsList.map(mat => {
                const isSelected = filters.concentrations?.includes(mat);
                return (
                  <button
                    key={mat}
                    type="button"
                    onClick={() => toggleArrayFilter("concentrations", mat)}
                    className={`w-full flex items-center justify-between py-3 text-left uppercase transition-all border-b border-zinc-200 last:border-b-0 ${isSelected
                      ? "text-zinc-900 font-semibold"
                      : "text-zinc-500 hover:text-black"
                      }`}
                  >
                    <span className="shop-sidebar-label">{mat}</span>
                    {isSelected && <Check size={13} className="text-[#800020] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* 5. Availability Filter (Dynamic from Admin / Database) */}
        {availableAvailabilities && availableAvailabilities.length > 0 && (
          <FilterSection
            title="Availability"
            defaultOpen={false}
            activeCount={filters.availabilities?.length || 0}
          >
            <div className="space-y-0">
              {availableAvailabilities.map(avail => {
                const isSelected = filters.availabilities?.includes(avail);
                return (
                  <button
                    key={avail}
                    type="button"
                    onClick={() => toggleArrayFilter("availabilities", avail)}
                    className={`w-full flex items-center justify-between py-3 text-left uppercase transition-all border-b border-zinc-200 last:border-b-0 ${isSelected
                      ? "text-zinc-900 font-semibold"
                      : "text-zinc-500 hover:text-black"
                      }`}
                  >
                    <span className="shop-sidebar-label">{avail}</span>
                    {isSelected && <Check size={13} className="text-[#800020] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* 6. Gender / Target Filter */}
        {genderList && genderList.length > 0 && (
          <FilterSection
            title="Gender"
            defaultOpen={false}
            activeCount={filters.gender && filters.gender !== "All" ? 1 : 0}
          >
            <div className="space-y-0">
              {["All", ...genderList].map(g => {
                const isSelected = (filters.gender || "All").toLowerCase() === g.toLowerCase();
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, gender: g }))}
                    className={`w-full flex items-center justify-between py-3 text-left uppercase transition-all border-b border-zinc-200 last:border-b-0 ${isSelected
                      ? "text-zinc-900 font-semibold"
                      : "text-zinc-500 hover:text-black"
                      }`}
                  >
                    <span className="shop-sidebar-label">{g}</span>
                    {isSelected && <Check size={13} className="text-[#800020] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* 7. Price Range: Slider & Presets */}
        <FilterSection
          title="Price Range"
          defaultOpen={false}
          activeCount={
            filters.minPrice > 0 ||
              (filters.maxPrice !== null && filters.maxPrice !== undefined && filters.maxPrice < maxPriceLimit)
              ? 1
              : 0
          }
        >
          <div className="space-y-3.5">
            {/* Price values readout */}
            <div className="flex items-center justify-between text-[14px] font-mono text-zinc-700">
              <span>₹{filters.minPrice?.toLocaleString("en-IN")}</span>
              <span className="text-[#800020]">
                ₹{(filters.maxPrice ?? maxPriceLimit)?.toLocaleString("en-IN")}
              </span>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <input
                type="range"
                min={0}
                max={maxPriceLimit}
                step={500}
                value={filters.maxPrice !== null && filters.maxPrice !== undefined ? filters.maxPrice : maxPriceLimit}
                onChange={e => {
                  const val = Number(e.target.value);
                  setFilters(prev => ({
                    ...prev,
                    maxPrice: val >= maxPriceLimit ? null : val
                  }));
                }}
                onMouseDown={e => e.stopPropagation()}
                onTouchStart={e => e.stopPropagation()}
                onTouchMove={e => e.stopPropagation()}
                style={{ touchAction: 'none' }}
                className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#800020]"
              />
            </div>

            {/* Price Presets */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {[
                { label: "Under ₹2,500", min: 0, max: 2500 },
                { label: "₹2,500 – ₹5,000", min: 2500, max: 5000 },
                { label: "₹5,000 – ₹10,000", min: 5000, max: 10000 },
                { label: "Above ₹10,000", min: 10000, max: maxPriceLimit }
              ].map(preset => {
                const isSelected =
                  filters.minPrice === preset.min &&
                  (preset.max === maxPriceLimit
                    ? (filters.maxPrice === null || filters.maxPrice === maxPriceLimit)
                    : filters.maxPrice === preset.max);

                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setFilters(prev => ({ ...prev, minPrice: 0, maxPrice: null }));
                      } else {
                        setFilters(prev => ({
                          ...prev,
                          minPrice: preset.min,
                          maxPrice: preset.max === maxPriceLimit ? null : preset.max
                        }));
                      }
                    }}
                    className={`py-2 px-2 border text-center uppercase transition-all rounded-sm flex items-center justify-center ${isSelected
                      ? "border-[#800020] bg-[#800020]/10 text-[#800020]"
                      : "border-zinc-300 text-zinc-600 hover:border-black hover:text-black"
                      }`}
                  >
                    <span className="shop-sidebar-preset-btn">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </FilterSection>

        {/* 8. Size Filter */}
        <FilterSection
          title="Size"
          defaultOpen={false}
          activeCount={filters.sizes?.length || 0}
        >
          <div className="space-y-2 pt-1">
            {availableSizes.map(szObj => {
              const sz = szObj.id ? szObj.id : szObj;
              const label = szObj.label ? szObj.label : sz;
              const count = szObj.count !== undefined ? szObj.count : 0;
              const isSelected = filters.sizes?.includes(sz);
              return (
                <label
                  key={sz}
                  className="flex items-center gap-3 text-zinc-600 hover:text-black cursor-pointer py-1 text-[13px] uppercase tracking-wide"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleArrayFilter("sizes", sz)}
                    className="w-4 h-4 accent-black bg-white border-zinc-300 rounded-sm cursor-pointer"
                  />
                  <span className="shop-sidebar-label">{label} ({count})</span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        {/* 9. Rating Filter */}
        <FilterSection
          title="Rating"
          defaultOpen={false}
          activeCount={filters.minRating > 0 ? 1 : 0}
        >
          <div className="space-y-1">
            {[4.5, 4.0, 3.5].map(stars => {
              const isSelected = filters.minRating === stars;
              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() =>
                    setFilters(prev => ({
                      ...prev,
                      minRating: isSelected ? 0 : stars
                    }))
                  }
                  className={`w-full flex items-center justify-between py-2 px-3 uppercase transition-colors rounded-sm ${isSelected
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:text-black hover:bg-zinc-50"
                    }`}
                >
                  <div className="flex items-center gap-1.5 text-[#800020]">
                    <Star size={12} fill="currentColor" />
                    <span className="shop-sidebar-label">{stars} & Above</span>
                  </div>
                  {isSelected && <Check size={13} className="text-[#800020] shrink-0" />}
                </button>
              );
            })}
          </div>
        </FilterSection>

      </div>
    </div >
  );

  return (
    <>
      {/* Desktop Sticky Sidebar with Right Border */}
      <div className="hidden lg:block w-full sticky top-28 space-y-6 lg:border-r lg:border-zinc-200 lg:pr-6 pb-20">
        {sidebarContent}
      </div>

      {/* Mobile Slide-Over Filter Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Slide Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xs sm:max-w-sm bg-[#f5f5f5] border-r border-zinc-200 h-full p-6 flex flex-col justify-between shadow-2xl z-10 text-zinc-900"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                <span className="text-[14px]   uppercase tracking-[0.2em] text-[#800020]">
                  Filter Products
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1 text-zinc-400 hover:text-black"
                >
                  <X size={18} />
                </button>
              </div>

              {sidebarContent}

              {/* Mobile Drawer Bottom Actions */}
              <div className="pt-4 border-t border-zinc-200 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    resetFilters();
                    onClose();
                  }}
                  className="w-1/3 py-3 border border-zinc-300 text-[12px]   uppercase tracking-widest text-zinc-600 hover:text-black"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-2/3 py-3 bg-[#800020] hover:bg-[#66001a] text-[#ffffff] text-[12px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md"
                >
                  Show ({totalResults})
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShopFilterSidebar;
