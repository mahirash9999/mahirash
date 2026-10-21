import React, { useState, useEffect, useMemo } from "react";
import { db } from "../components/Firebase";
import { collection, getDocs, query, orderBy, doc, getDoc } from "firebase/firestore";
import {
  Search,
  Heart,
  ArrowUpRight,
  X,
  SlidersHorizontal,
  ChevronDown,
  ShoppingCart,
  Filter
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PageHeader from "../components/Home/PageHeader";
import { useStore } from "../components/StoreProvider";
import ShopFilterSidebar, { DEFAULT_CATEGORIES } from "../components/ShopFilterSidebar";
import SEOHead from "../components/SEOHead";
import OptimizedCloudinaryImage from "../components/OptimizedCloudinaryImage";

export const SIZE_RANGES = ["1-10ML", "10-20ML", "20-50ML", "50-100ML", ">100ML"];

export const parseMl = (str) => {
  if (!str) return null;
  const match = str.toLowerCase().match(/(\d+(?:\.\d+)?)\s*(ml)/);
  if (match) return parseFloat(match[1]);
  return null;
};

import ProductCard, { resolveProductVariant, isVariantAvailable } from "../components/ProductCard";

const INITIAL_FILTERS = {
  brand: "All",
  category: "All",
  collection: "All",
  gender: "All",
  minPrice: 0,
  maxPrice: null,
  colors: [], // Kept for legacy compatibility
  sizes: [],
  families: [],
  concentrations: [],
  availabilities: [],
  inStockOnly: false,
  onSaleOnly: false,
  minRating: 0
};

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState(["All"]);
  const [brandsList, setBrandsList] = useState([]);
  const [dbFragranceFamilies, setDbFragranceFamilies] = useState([]);
  const [dbFragranceConcentrations, setDbFragranceConcentrations] = useState([]);
  const [dbCollections, setDbCollections] = useState([]);
  const [dbAvailabilities, setDbAvailabilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [feedbackMessage, setFeedbackMessage] = useState(null);
  const [activeCoupon, setActiveCoupon] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // ── Read URL query params into state on mount / URL change ──
  useEffect(() => {
    const newFilters = { ...INITIAL_FILTERS };

    const brandParam = searchParams.get("brand");
    if (brandParam) newFilters.brand = brandParam;

    const cat = searchParams.get("category");
    if (cat) {
      if (["men", "women", "unisex"].includes(cat.toLowerCase())) {
        newFilters.gender = cat.charAt(0).toUpperCase() + cat.slice(1).toLowerCase();
      } else {
        newFilters.category = cat;
      }
    }

    const colParam = searchParams.get("collection") || searchParams.get("collections");
    if (colParam) newFilters.collection = colParam;

    const availParam = searchParams.get("availability") || searchParams.get("availabilities") || searchParams.get("stock");
    if (availParam) newFilters.availabilities = availParam.split(",").map(a => a.trim()).filter(Boolean);

    const gender = searchParams.get("gender");
    if (gender) newFilters.gender = gender;

    const minPrice = searchParams.get("minPrice");
    if (minPrice && !isNaN(Number(minPrice))) newFilters.minPrice = Number(minPrice);

    const maxPrice = searchParams.get("maxPrice");
    if (maxPrice && !isNaN(Number(maxPrice))) {
      newFilters.maxPrice = Number(maxPrice);
    } else {
      newFilters.maxPrice = null;
    }

    const colors = searchParams.get("color") || searchParams.get("colors");
    if (colors) newFilters.colors = colors.split(",").map(c => c.trim()).filter(Boolean);

    const sizes = searchParams.get("size") || searchParams.get("sizes");
    if (sizes) newFilters.sizes = sizes.split(",").map(s => s.trim()).filter(Boolean);

    const families = searchParams.get("family") || searchParams.get("scent") || searchParams.get("families");
    if (families) newFilters.families = families.split(",").map(m => m.trim()).filter(Boolean);

    const concentrations = searchParams.get("concentration") || searchParams.get("concentrations");
    if (concentrations) newFilters.concentrations = concentrations.split(",").map(m => m.trim()).filter(Boolean);

    if (searchParams.get("inStock") === "true") newFilters.inStockOnly = true;
    if (searchParams.get("onSale") === "true") newFilters.onSaleOnly = true;

    const minRating = searchParams.get("minRating");
    if (minRating) newFilters.minRating = Number(minRating);

    const q = searchParams.get("search") || searchParams.get("q");
    setSearchTerm(q || "");

    const sort = searchParams.get("sort");
    if (sort) setSortBy(sort);

    setFilters(newFilters);
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        const list = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(item => item.is_active !== false);
        setProducts(list);

        try {
          const catSnap = await getDocs(collection(db, "categories"));
          if (!catSnap.empty) {
            const fetchedCats = catSnap.docs
              .map(doc => doc.data())
              .filter(cat => cat.is_active !== false)
              .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
              .map(cat => cat.name)
              .filter(Boolean);

            if (fetchedCats.length > 0) {
              setCategoriesList(["All", ...fetchedCats]);
            }
          }
        } catch (catErr) {
          console.error("Error fetching categories:", catErr);
        }

        try {
          const brandSnap = await getDocs(collection(db, "brands"));
          if (!brandSnap.empty) {
            const fetchedBrands = brandSnap.docs
              .map(doc => doc.data())
              .filter(b => b.is_active !== false)
              .map(b => b.name)
              .filter(Boolean);
            setBrandsList(fetchedBrands);
          }
        } catch (brandErr) {
          console.error("Error fetching brands:", brandErr);
        }

        try {
          const famSnap = await getDocs(collection(db, "fragrance_families"));
          if (!famSnap.empty) {
            const fetchedFams = famSnap.docs
              .map(doc => doc.data())
              .filter(f => f.is_active !== false)
              .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
              .map(f => f.name)
              .filter(Boolean);
            if (fetchedFams.length > 0) setDbFragranceFamilies(fetchedFams);
          }
        } catch (famErr) {
          console.error("Error fetching fragrance families:", famErr);
        }

        try {
          const concSnap = await getDocs(collection(db, "fragrance_concentrations"));
          if (!concSnap.empty) {
            const fetchedConcs = concSnap.docs
              .map(doc => doc.data())
              .filter(c => c.is_active !== false)
              .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
              .map(c => c.name)
              .filter(Boolean);
            if (fetchedConcs.length > 0) setDbFragranceConcentrations(fetchedConcs);
          }
        } catch (concErr) {
          console.error("Error fetching fragrance concentrations:", concErr);
        }

        try {
          const bannerSnap = await getDocs(collection(db, "gender_banners"));
          const bannerCols = [];
          if (!bannerSnap.empty) {
            const sortedBanners = bannerSnap.docs
              .map(doc => ({ id: doc.id, ...doc.data() }))
              .filter(item => item.is_active !== false)
              .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

            sortedBanners.forEach(doc => {
              const name = (doc.title || doc.name || "").trim();
              if (name && !bannerCols.includes(name)) bannerCols.push(name);
            });
          }
          if (bannerCols.length > 0) setDbCollections(bannerCols);
        } catch (colErr) {
          console.error("Error fetching home page collections:", colErr);
        }

        try {
          const availSnap = await getDocs(collection(db, "availabilities"));
          if (!availSnap.empty) {
            const fetchedAvail = availSnap.docs
              .map(doc => doc.data())
              .filter(a => a.is_active !== false)
              .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0))
              .map(a => a.name)
              .filter(Boolean);
            if (fetchedAvail.length > 0) setDbAvailabilities(fetchedAvail);
          }
        } catch (availErr) {
          console.error("Error fetching availabilities:", availErr);
        }

        // Check for coupon in url
        const params = new URLSearchParams(window.location.search);
        const couponParam = params.get("coupon") || params.get("code");
        if (couponParam) {
          const cleanCode = couponParam.toUpperCase().trim();
          const cDoc = await getDoc(doc(db, "coupons", cleanCode));
          if (cDoc.exists()) {
            const cData = cDoc.data();
            if (cData.is_active) {
              setActiveCoupon({ id: cDoc.id, ...cData });
              localStorage.setItem("applied_coupon_code", cleanCode);
              triggerToast(`Exclusive offer "${cleanCode}" applied!`);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const triggerToast = msg => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Dynamically compute unique values from products
  const maxPriceLimit = useMemo(() => {
    if (!products.length) return 25000;
    const max = Math.max(
      ...products.map(p => {
        let pMax = Number(p.price) || 0;
        if (Array.isArray(p.size_prices)) {
          p.size_prices.forEach(v => {
            const vp = Number(v.price) || 0;
            if (vp > pMax) pMax = vp;
          });
        }
        return pMax;
      })
    );
    return Math.max(5000, Math.ceil(max / 1000) * 1000);
  }, [products]);

  const dynamicCategories = useMemo(() => {
    return categoriesList;
  }, [categoriesList]);

  const availableBrands = useMemo(() => {
    return brandsList;
  }, [brandsList]);

  const availableFamilies = useMemo(() => {
    return dbFragranceFamilies;
  }, [dbFragranceFamilies]);

  const availableConcentrations = useMemo(() => {
    return dbFragranceConcentrations;
  }, [dbFragranceConcentrations]);

  const availableCollections = useMemo(() => {
    return dbCollections;
  }, [dbCollections]);

  const availableAvailabilities = useMemo(() => {
    return dbAvailabilities;
  }, [dbAvailabilities]);

  const availableGenders = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.gender && typeof p.gender === "string" && p.gender.trim()) {
        set.add(p.gender.trim());
      }
    });
    return Array.from(set).filter(Boolean);
  }, [products]);

  const availableSizes = useMemo(() => {
    const counts = {
      "1-10ML": 0,
      "10-20ML": 0,
      "20-50ML": 0,
      "50-100ML": 0,
      ">100ML": 0
    };

    products.forEach(p => {
      const pml = [];
      if (p.sizes) {
        p.sizes.split(",").forEach(s => {
          const ml = parseMl(s); if (ml) pml.push(ml);
        })
      }
      if (p.size_prices && Array.isArray(p.size_prices)) {
        p.size_prices.forEach(sp => {
          const ml = parseMl(sp.size); if (ml) pml.push(ml);
        });
      }

      const foundInRanges = new Set();
      pml.forEach(ml => {
        if (ml >= 1 && ml <= 10) foundInRanges.add("1-10ML");
        else if (ml > 10 && ml <= 20) foundInRanges.add("10-20ML");
        else if (ml > 20 && ml <= 50) foundInRanges.add("20-50ML");
        else if (ml > 50 && ml <= 100) foundInRanges.add("50-100ML");
        else if (ml > 100) foundInRanges.add(">100ML");
      });

      foundInRanges.forEach(r => { counts[r]++; });
    });

    return SIZE_RANGES.map(id => ({ id, label: id, count: counts[id] }));
  }, [products]);

  // ── Write filter state back to URL query params ──
  useEffect(() => {
    const params = new URLSearchParams();

    if (filters.brand && filters.brand !== "All") params.set("brand", filters.brand);
    if (filters.category !== "All") params.set("category", filters.category);
    if (filters.collection && filters.collection !== "All") params.set("collection", filters.collection);
    if (filters.gender !== "All") params.set("gender", filters.gender);
    if (filters.minPrice > 0) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice !== null && filters.maxPrice !== undefined && filters.maxPrice < maxPriceLimit) {
      params.set("maxPrice", String(filters.maxPrice));
    }
    if (filters.sizes.length > 0) params.set("size", filters.sizes.join(","));
    if (filters.families.length > 0) params.set("family", filters.families.join(","));
    if (filters.concentrations.length > 0) params.set("concentration", filters.concentrations.join(","));
    if (filters.availabilities && filters.availabilities.length > 0) params.set("availability", filters.availabilities.join(","));
    if (filters.inStockOnly) params.set("inStock", "true");
    if (filters.onSaleOnly) params.set("onSale", "true");
    if (filters.minRating > 0) params.set("minRating", String(filters.minRating));
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (sortBy !== "newest") params.set("sort", sortBy);

    setSearchParams(params, { replace: true });
    setCurrentPage(1);
  }, [filters, searchTerm, sortBy, maxPriceLimit, setSearchParams]);

  const resetFilters = () => {
    setSearchTerm("");
    setFilters({ ...INITIAL_FILTERS, minPrice: 0, maxPrice: null, collection: "All", availabilities: [] });
  };

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => {
        // Coupon applicable products filtering
        if (activeCoupon && activeCoupon.applicableProducts && activeCoupon.applicableProducts.length > 0) {
          if (!activeCoupon.applicableProducts.includes(p.id)) {
            return false;
          }
        }

        // Search term
        if (searchTerm && !p.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }

        // Brand matching
        if (filters.brand && filters.brand !== "All") {
          const pBrand = (p.brand || "MAHIRASH").toLowerCase().trim();
          if (pBrand !== filters.brand.toLowerCase().trim()) {
            return false;
          }
        }

        // Category & Collection matching with normalization & name fallback
        if (filters.category !== "All") {
          const normalizeCategory = (str) => {
            if (!str) return "";
            let norm = str.toLowerCase().replace(/[^a-z0-9]/g, "");
            if (norm.endsWith("s") && norm.length > 3) {
              norm = norm.slice(0, -1);
            }
            return norm;
          };

          const fNorm = normalizeCategory(filters.category);
          const pNorm = normalizeCategory(p.category);
          const pNameNorm = normalizeCategory(p.name);
          const pTagNorm = normalizeCategory(p.tag);

          // Support multi-select collection tags array or single collection fallback
          const pCollections = Array.isArray(p.collections) && p.collections.length > 0
            ? p.collections
            : (p.collection ? [p.collection] : []);

          const matchesCollection = pCollections.some(col => {
            const cNorm = normalizeCategory(col);
            return cNorm === fNorm || cNorm.includes(fNorm) || fNorm.includes(cNorm);
          });

          const matchesCat = (() => {
            if (!pNorm) return false;
            if (fNorm === pNorm) return true;
            return pNorm.includes(fNorm) || fNorm.includes(pNorm);
          })();

          const matchesName = (() => {
            if (!pNameNorm) return false;
            return pNameNorm.includes(fNorm);
          })();

          const matchesTag = (() => {
            if (!pTagNorm) return false;
            return pTagNorm.includes(fNorm);
          })();

          if (!matchesCat && !matchesName && !matchesTag && !matchesCollection) {
            return false;
          }
        }

        // Collection filter matching
        if (filters.collection && filters.collection !== "All") {
          const normalizeCol = (str) => (str || "").toLowerCase().replace(/[^a-z0-9]/g, "");
          const target = normalizeCol(filters.collection);
          const pCol = normalizeCol(p.collection);
          const pHpCol = normalizeCol(p.home_page_collection);
          const pCols = Array.isArray(p.collections) ? p.collections.map(normalizeCol) : [];
          const pCat = normalizeCol(p.category);
          const pName = normalizeCol(p.name);
          const pTag = normalizeCol(p.tag);
          const isMatch =
            pCol === target ||
            pHpCol === target ||
            pCols.includes(target) ||
            (pCol && (pCol.includes(target) || target.includes(pCol))) ||
            (pHpCol && (pHpCol.includes(target) || target.includes(pHpCol))) ||
            pCat === target ||
            pName.includes(target) ||
            pTag.includes(target);
          if (!isMatch) return false;
        }

        // Gender matching
        if (filters.gender && filters.gender !== "All") {
          const normFilter = filters.gender.toLowerCase().trim();
          const pGen = (p.gender || "Unisex").toLowerCase().trim();
          if (pGen !== "unisex") {
            const isFilterMen = normFilter.startsWith("men") || normFilter === "male" || normFilter === "him";
            const isFilterWomen = normFilter.startsWith("women") || normFilter === "female" || normFilter === "her";
            const isProdMen = pGen.startsWith("men") || pGen === "male" || pGen === "him";
            const isProdWomen = pGen.startsWith("women") || pGen === "female" || pGen === "her";

            if (isFilterMen && !isProdMen) return false;
            if (isFilterWomen && !isProdWomen) return false;
            if (!isFilterMen && !isFilterWomen && pGen !== normFilter) return false;
          }
        }

        // Price range (evaluated on the active displayed variant given active filter & sort)
        const activeVariant = resolveProductVariant(p, filters.sizes.length > 0 ? filters.sizes : null, sortBy);
        const effectivePrice = activeVariant ? (activeVariant.price ?? p.price ?? 0) : (p.price ?? 0);
        if (filters.minPrice > 0 && effectivePrice < filters.minPrice) {
          return false;
        }
        if (filters.maxPrice !== null && filters.maxPrice !== undefined && effectivePrice > filters.maxPrice) {
          return false;
        }

        // Fragrance Families
        if (filters.families && filters.families.length > 0) {
          const productFamilies = (p.fragrance_family || p.colors || "").toLowerCase().split(",").map(c => c.trim());
          const hasMatch = filters.families.some(f =>
            productFamilies.includes(f.toLowerCase())
          );
          if (!hasMatch) return false;
        }

        // Sizes mapped to Volume Ranges
        if (filters.sizes.length > 0) {
          const pml = [];
          if (p.sizes) {
            p.sizes.split(",").forEach(s => {
              const ml = parseMl(s); if (ml) pml.push(ml);
            })
          }
          if (p.size_prices && Array.isArray(p.size_prices)) {
            p.size_prices.forEach(sp => {
              const ml = parseMl(sp.size); if (ml) pml.push(ml);
            });
          }
          let hasSizeMatch = false;
          for (let ml of pml) {
            if (filters.sizes.includes("1-10ML") && ml >= 1 && ml <= 10) { hasSizeMatch = true; break; }
            if (filters.sizes.includes("10-20ML") && ml > 10 && ml <= 20) { hasSizeMatch = true; break; }
            if (filters.sizes.includes("20-50ML") && ml > 20 && ml <= 50) { hasSizeMatch = true; break; }
            if (filters.sizes.includes("50-100ML") && ml > 50 && ml <= 100) { hasSizeMatch = true; break; }
            if (filters.sizes.includes(">100ML") && ml > 100) { hasSizeMatch = true; break; }
          }
          if (!hasSizeMatch) return false;
        }

        // Fragrance Concentrations
        if (filters.concentrations && filters.concentrations.length > 0) {
          const productConc = (p.fragrance_concentration || p.material || "").toLowerCase();
          const hasMatMatch = filters.concentrations.some(m =>
            productConc.includes(m.toLowerCase())
          );
          if (!hasMatMatch) return false;
        }

        // Availability
        if (filters.availabilities && filters.availabilities.length > 0) {
          const pAvail = (p.availability || p.stock_status || (Number(p.stock) > 0 ? "In Stock" : "Out of Stock")).toLowerCase();
          const hasAvailMatch = filters.availabilities.some(a =>
            pAvail.includes(a.toLowerCase()) || a.toLowerCase().includes(pAvail)
          );
          if (!hasAvailMatch) return false;
        }

        // In Stock Only
        if (filters.inStockOnly) {
          const hasInStock = Array.isArray(p.size_prices) && p.size_prices.length > 0
            ? p.size_prices.some(v => isVariantAvailable(v, p))
            : (Number(p.stock) > 0 && p.stock_status !== "Out of Stock" && !p.is_preorder);
          if (!hasInStock) return false;
        }

        // On Sale Only
        if (filters.onSaleOnly) {
          const origPrice = activeVariant?.original_price || p.original_price;
          if (!origPrice || origPrice <= effectivePrice) return false;
        }

        // Rating
        if (filters.minRating > 0) {
          if ((p.rating || 4.5) < filters.minRating) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-low" || sortBy === "price-high") {
          const vA = resolveProductVariant(a, filters.sizes.length > 0 ? filters.sizes : null, sortBy);
          const priceA = vA ? (vA.price ?? a.price ?? 0) : (a.price ?? 0);
          const vB = resolveProductVariant(b, filters.sizes.length > 0 ? filters.sizes : null, sortBy);
          const priceB = vB ? (vB.price ?? b.price ?? 0) : (b.price ?? 0);
          return sortBy === "price-low" ? priceA - priceB : priceB - priceA;
        }
        if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
        return 0;
      });
  }, [products, searchTerm, filters, sortBy, activeCoupon]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * productsPerPage;
    return filteredProducts.slice(start, start + productsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Active filter pills count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.brand && filters.brand !== "All") count++;
    if (filters.category !== "All") count++;
    if (filters.collection && filters.collection !== "All") count++;
    if (filters.gender !== "All") count++;
    if (filters.minPrice > 0 || (filters.maxPrice !== null && filters.maxPrice !== undefined && filters.maxPrice < maxPriceLimit)) count++;
    if (filters.families && filters.families.length) count += filters.families.length;
    if (filters.sizes.length) count += filters.sizes.length;
    if (filters.concentrations && filters.concentrations.length) count += filters.concentrations.length;
    if (filters.availabilities && filters.availabilities.length) count += filters.availabilities.length;
    if (filters.inStockOnly) count++;
    if (filters.onSaleOnly) count++;
    if (filters.minRating > 0) count++;
    if (searchTerm) count++;
    return count;
  }, [filters, searchTerm, maxPriceLimit]);

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <SEOHead
        title={filters.category !== "All" ? `Shop ${filters.category} Collection | Mahirash` : "Shop All Luxury Perfumes & Scents | Mahirash"}
        description="Browse Mahirash's complete collection of artisanal extraits, eau de parfum, royal oud reserves, and discovery vaults. Filter by fragrance family, volume, and fragrance notes."
        url="https://mahirash.com/shop"
        keywords="Mahirash luxury perfumes, Mahirash fragrance collection, royal oud extrait, buy luxury perfume India, mahirash.com shop"
      />
      <PageHeader
        title="Shop Collection"
        breadcrumbItems={[{ label: "Home", path: "/" }, { label: "Shop" }]}
      />

      <div className="max-w-[1800px] py-3 mx-auto px-4 sm:px-6 lg:px-8 pb-20 md:pb-24 pt-8 md:pt-12">
        {/* Top Control Bar: Search, Sort, Mobile Filter Trigger */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between mb-8 pb-6 border-b border-zinc-200">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Search by name, fabric, or style..."
              className="w-full bg-white border border-zinc-300 pl-10 pr-9 py-3 text-[14px] text-zinc-900 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Sort Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-zinc-300 px-4 py-3 pr-9 text-[12px]   uppercase tracking-wider text-zinc-800 outline-none focus:border-zinc-500 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <option value="newest">Sort: Newest First</option>
                <option value="price-low">Sort: Price (Low to High)</option>
                <option value="price-high">Sort: Price (High to Low)</option>
                <option value="name">Sort: Name (A–Z)</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
            </div>

            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center justify-center gap-2 bg-white border border-zinc-300 px-4 py-3 text-[12px]   uppercase tracking-widest text-zinc-800 hover:bg-zinc-100 transition-all"
            >
              <SlidersHorizontal size={13} className="text-[#b8860b]" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-black text-white text-[12px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Applied Active Filter Pills Bar */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8 bg-white p-3 border border-zinc-200 shadow-sm">
            <span className="text-[12px]   uppercase tracking-widest text-zinc-500 mr-1">
              Active Filters:
            </span>

            {filters.brand && filters.brand !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[12px] uppercase tracking-wider border border-zinc-300">
                Brand: {filters.brand}
                <button
                  type="button"
                  onClick={() => setFilters(p => ({ ...p, brand: "All" }))}
                  className="hover:text-[#b8860b]"
                >
                  <X size={10} />
                </button>
              </span>
            )}

            {filters.category !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[12px] uppercase tracking-wider border border-zinc-300">
                Category: {filters.category}
                <button
                  type="button"
                  onClick={() => setFilters(p => ({ ...p, category: "All" }))}
                  className="hover:text-[#b8860b]"
                >
                  <X size={10} />
                </button>
              </span>
            )}

            {filters.collection && filters.collection !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[12px] uppercase tracking-wider border border-zinc-300">
                Collection: {filters.collection}
                <button
                  type="button"
                  onClick={() => setFilters(p => ({ ...p, collection: "All" }))}
                  className="hover:text-[#b8860b]"
                >
                  <X size={10} />
                </button>
              </span>
            )}

            {filters.availabilities && filters.availabilities.map(avail => (
              <span
                key={avail}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[12px] uppercase tracking-wider border border-zinc-300"
              >
                Availability: {avail}
                <button
                  type="button"
                  onClick={() =>
                    setFilters(p => ({ ...p, availabilities: p.availabilities.filter(x => x !== avail) }))
                  }
                  className="hover:text-[#b8860b]"
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            {filters.gender !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[12px]   uppercase tracking-wider border border-zinc-300">
                Gender: {filters.gender}
                <button
                  type="button"
                  onClick={() => setFilters(p => ({ ...p, gender: "All" }))}
                  className="hover:text-[#b8860b]"
                >
                  <X size={10} />
                </button>
              </span>
            )}

            {(filters.minPrice > 0 || (filters.maxPrice !== null && filters.maxPrice !== undefined && filters.maxPrice < maxPriceLimit)) && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[12px] uppercase tracking-wider border border-zinc-300">
                {filters.minPrice > 0 ? `₹${filters.minPrice.toLocaleString("en-IN")} - ` : "Max "}
                ₹{(filters.maxPrice ?? maxPriceLimit).toLocaleString("en-IN")}
                <button
                  type="button"
                  onClick={() => setFilters(p => ({ ...p, minPrice: 0, maxPrice: null }))}
                  className="hover:text-[#b8860b]"
                >
                  <X size={10} />
                </button>
              </span>
            )}

            {filters.sizes.map(sz => (
              <span
                key={sz}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[12px]   uppercase tracking-wider border border-zinc-300"
              >
                Size: {sz}
                <button
                  type="button"
                  onClick={() =>
                    setFilters(p => ({ ...p, sizes: p.sizes.filter(x => x !== sz) }))
                  }
                  className="hover:text-[#b8860b]"
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            {filters.families && filters.families.map(fam => (
              <span
                key={fam}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[12px]   uppercase tracking-wider border border-zinc-300"
              >
                Scent: {fam}
                <button
                  type="button"
                  onClick={() =>
                    setFilters(p => ({ ...p, families: p.families.filter(x => x !== fam) }))
                  }
                  className="hover:text-[#b8860b]"
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            {filters.concentrations && filters.concentrations.map(conc => (
              <span
                key={conc}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[12px]   uppercase tracking-wider border border-zinc-300"
              >
                Concentration: {conc}
                <button
                  type="button"
                  onClick={() =>
                    setFilters(p => ({ ...p, concentrations: p.concentrations.filter(x => x !== conc) }))
                  }
                  className="hover:text-[#b8860b]"
                >
                  <X size={10} />
                </button>
              </span>
            ))}

            {filters.inStockOnly && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[12px]   uppercase tracking-wider border border-zinc-300">
                In Stock Only
                <button
                  type="button"
                  onClick={() => setFilters(p => ({ ...p, inStockOnly: false }))}
                  className="hover:text-[#b8860b]"
                >
                  <X size={10} />
                </button>
              </span>
            )}

            {filters.onSaleOnly && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-800 text-[12px]   uppercase tracking-wider border border-zinc-300">
                On Sale
                <button
                  type="button"
                  onClick={() => setFilters(p => ({ ...p, onSaleOnly: false }))}
                  className="hover:text-[#b8860b]"
                >
                  <X size={10} />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetFilters}
              className="text-[12px]   uppercase tracking-widest text-[#b8860b] hover:underline ml-auto"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Main Grid + Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10 items-start">
          {/* Filter Sidebar (Desktop Sticky + Mobile Drawer) */}
          <ShopFilterSidebar
            isOpen={showMobileFilters}
            onClose={() => setShowMobileFilters(false)}
            filters={filters}
            setFilters={setFilters}
            resetFilters={resetFilters}
            totalResults={filteredProducts.length}
            allCategories={dynamicCategories}
            availableBrands={availableBrands}
            availableFamilies={availableFamilies}
            availableConcentrations={availableConcentrations}
            availableAvailabilities={availableAvailabilities}
            availableCollections={availableCollections}
            availableGenders={availableGenders}
            availableColors={availableFamilies}
            availableSizes={availableSizes}
            availableMaterials={availableConcentrations}
            maxPriceLimit={maxPriceLimit}
          />

          {/* Product Grid Container */}
          <div className="lg:col-span-3 font-['Inter',sans-serif]">
            {activeCoupon && (
              <div className="mb-6 bg-[#b8860b]/5 border border-dashed border-[#b8860b]/30 p-4 rounded-xl flex items-center justify-between gap-3 text-zinc-950">
                <div className="text-left">
                  <h4 className="text-[14px] font-bold text-[#b8860b] uppercase tracking-wider font-mono">Coupon Activated: {activeCoupon.code}</h4>
                  <p className="text-[12px] text-zinc-600 mt-1 leading-normal">
                    Showing products eligible for this exclusive offer. The discount will be applied during checkout.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCoupon(null);
                    localStorage.removeItem("applied_coupon_code");
                    const newParams = new URLSearchParams(window.location.search);
                    newParams.delete("coupon");
                    newParams.delete("code");
                    setSearchParams(newParams);
                  }}
                  className="bg-white border border-zinc-200 text-zinc-700 hover:text-black hover:border-zinc-400 text-[12px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all shrink-0 cursor-pointer shadow-sm"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Grid Header Info */}
            <div className="flex items-center justify-between text-[12px] text-zinc-500 uppercase tracking-widest mb-6 font-semibold">
              <span>Showing {filteredProducts.length} Results</span>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[3/4] bg-zinc-200 animate-pulse" />
                    <div className="h-3 bg-zinc-200 animate-pulse w-2/3" />
                    <div className="h-3 bg-zinc-200 animate-pulse w-1/3" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-1 gap-y-6 md:gap-x-2 md:gap-y-8">
                  {filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage).map((product, idx) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      idx={idx}
                      preferredSize={filters.sizes.length > 0 ? filters.sizes : null}
                      sortBy={sortBy}
                      triggerToast={triggerToast}
                    />
                  ))}
                </div>
                {/* Pagination Controls */}
                {filteredProducts.length > productsPerPage && (
                  <div className="flex justify-center items-center gap-2 mt-12 md:mt-16">
                    <button
                      onClick={() => {
                        setCurrentPage(p => Math.max(1, p - 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-zinc-200 text-sm font-semibold disabled:opacity-50 hover:bg-black hover:text-white transition-colors"
                    >
                      Prev
                    </button>
                    <span className="text-sm text-zinc-500 font-medium px-4">
                      Page {currentPage} of {Math.ceil(filteredProducts.length / productsPerPage)}
                    </span>
                    <button
                      onClick={() => {
                        setCurrentPage(p => Math.min(Math.ceil(filteredProducts.length / productsPerPage), p + 1));
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      disabled={currentPage === Math.ceil(filteredProducts.length / productsPerPage)}
                      className="px-4 py-2 border border-zinc-200 text-sm font-semibold disabled:opacity-50 hover:bg-black hover:text-white transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-24 bg-white border border-zinc-200 p-8 max-w-md mx-auto shadow-sm">
                <div className="w-14 h-14 border border-zinc-300 flex items-center justify-center text-zinc-400 mx-auto mb-5">
                  <Filter size={22} strokeWidth={1.5} />
                </div>
                <h3 className="text-lg font-light text-zinc-900 tracking-widest uppercase mb-2">
                  No Products Match
                </h3>
                <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
                  Try clearing or adjusting your search keywords, price slider, or selected options.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.2em] bg-black text-white px-6 py-3 hover:bg-zinc-800 transition-all"
                >
                  Reset All Filters
                  <ArrowUpRight size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast Feedback */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-3 shadow-2xl flex items-center gap-3"
          >
            <p className="text-[12px] font-black uppercase tracking-wider whitespace-nowrap">
              {feedbackMessage}
            </p>
            <button
              type="button"
              onClick={() => setFeedbackMessage(null)}
              className="opacity-40 hover:opacity-100 ml-1"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Shop;
