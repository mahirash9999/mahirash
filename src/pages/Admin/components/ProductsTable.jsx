import React, { useRef, useState, useMemo } from 'react';
import {
  Edit2, Trash2, Tag, Eye, Download, Upload,
  ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight,
  Search, SlidersHorizontal, Package, RefreshCw
} from 'lucide-react';
import OptimizedCloudinaryImage from '../../../components/OptimizedCloudinaryImage';
import { exportToCSV, parseCSV, csvToJSON } from '../../../utils/exportUtils';
import { db } from '../../../components/Firebase';
import { collection, doc, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const statusBadgeClasses = (status) => {
  switch (status) {
    case "In Stock":
      return "bg-[#800020]/10 text-[#800020] border-[#800020]/25 font-semibold";
    case "Low Stock":
      return "bg-[#B88D46]/15 text-[#B88D46] border-[#B88D46]/30 font-semibold";
    default:
      return "bg-stone-100 text-[#75665D] border-[#E9DCCB] font-semibold";
  }
};

const getProductTimestamp = (product) => {
  if (!product) return 0;
  if (product.createdAt?.toMillis) return product.createdAt.toMillis();
  if (product.createdAt?.toDate) return product.createdAt.toDate().getTime();
  if (product.createdAt) {
    const parsed = new Date(product.createdAt).getTime();
    if (!isNaN(parsed)) return parsed;
  }
  if (product.created_at) {
    const parsed = new Date(product.created_at).getTime();
    if (!isNaN(parsed)) return parsed;
  }
  return 0;
};

const ProductsTable = ({ products = [], loading = false, onEdit, onDelete, onImportSuccess }) => {
  const fileInputRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting state: default is date-desc (recently uploaded first)
  const [sortBy, setSortBy] = useState('date-desc');
  const [tableSearch, setTableSearch] = useState('');

  // 1. Filter products by optional table quick search
  const filteredProducts = useMemo(() => {
    if (!tableSearch.trim()) return products;
    const term = tableSearch.toLowerCase().trim();
    return products.filter((p) => {
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      const id = (p.id || '').toLowerCase();
      return name.includes(term) || cat.includes(term) || id.includes(term);
    });
  }, [products, tableSearch]);

  // 2. Sort products according to sortBy selection
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];
    switch (sortBy) {
      case 'date-desc': // Recently uploaded
        return list.sort((a, b) => getProductTimestamp(b) - getProductTimestamp(a));
      case 'date-asc': // Oldest first
        return list.sort((a, b) => getProductTimestamp(a) - getProductTimestamp(b));
      case 'name-asc': // A - Z
        return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name-desc': // Z - A
        return list.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'price-asc': // Low to High
        return list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case 'price-desc': // High to Low
        return list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      case 'stock-asc': // Stock Low to High
        return list.sort((a, b) => (Number(a.stock) || 0) - (Number(b.stock) || 0));
      case 'stock-desc': // Stock High to Low
        return list.sort((a, b) => (Number(b.stock) || 0) - (Number(a.stock) || 0));
      default:
        return list;
    }
  }, [filteredProducts, sortBy]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / itemsPerPage));

  // Current page items (strictly 10 products per page)
  const paginatedProducts = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return sortedProducts.slice(startIdx, startIdx + itemsPerPage);
  }, [sortedProducts, currentPage, itemsPerPage]);

  // Keep page within bounds if products count changes
  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const toggleSelectAll = () => {
    if (paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id))) {
      setSelectedIds(selectedIds.filter(id => !paginatedProducts.some(p => p.id === id)));
    } else {
      const pageIds = paginatedProducts.map(p => p.id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    }
  };

  const isPageAllSelected = paginatedProducts.length > 0 && paginatedProducts.every(p => selectedIds.includes(p.id));

  const toggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected products?`)) return;
    try {
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "products", id));
      }
      alert("Products deleted successfully!");
      setSelectedIds([]);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      alert("Bulk delete failed: " + err.message);
    }
  };

  const handleBulkStatusChange = async (status) => {
    try {
      for (const id of selectedIds) {
        await updateDoc(doc(db, "products", id), {
          stock_status: status
        });
      }
      alert(`Updated stock status to ${status} for ${selectedIds.length} items!`);
      setSelectedIds([]);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      alert("Bulk status change failed: " + err.message);
    }
  };

  const PRODUCT_CSV_KEYS = [
    'id', 'name', 'brand', 'category', 'subcategory', 'collection', 'gender',
    'fragrance_family', 'fragrance_concentration', 'availability', 'price', 'original_price',
    'stock', 'stock_status', 'sizes', 'size_prices', 'is_bestseller', 'is_new_arrival', 'is_miniature',
    'rating', 'reviews_count', 'top_notes', 'heart_notes', 'base_notes', 'longevity', 'sillage',
    'tags', 'image', 'images', 'description',
    'shipping_weight', 'shipping_length', 'shipping_breadth', 'shipping_height'
  ];

  const PRODUCT_CSV_HEADERS = [
    'Product ID', 'Product Name', 'Brand', 'Category', 'Subcategory', 'Collection', 'Gender',
    'Fragrance Family', 'Fragrance Concentration', 'Availability', 'Price (INR)', 'Original Price (INR)',
    'Stock Quantity', 'Stock Status', 'Sizes', 'Size Prices (JSON)', 'Is Bestseller', 'Is New Arrival', 'Is Miniature',
    'Rating', 'Reviews Count', 'Top Notes', 'Heart Notes', 'Base Notes', 'Longevity', 'Sillage',
    'Tags (JSON)', 'Primary Image URL', 'All Image URLs (JSON)', 'Description',
    'Shipping Weight (kg)', 'Shipping Length (cm)', 'Shipping Breadth (cm)', 'Shipping Height (cm)'
  ];

  const handleExport = () => {
    const exportData = products.map(p => {
      const isBs = Boolean(p.is_bestseller || (Array.isArray(p.tags) && p.tags.some(t => (typeof t === 'string' ? t : t?.label)?.toUpperCase() === 'BESTSELLER')));
      const isNa = Boolean(p.is_new_arrival || (Array.isArray(p.tags) && p.tags.some(t => (typeof t === 'string' ? t : t?.label)?.toUpperCase() === 'NEW ARRIVAL')));
      const isMin = Boolean(p.is_miniature || p.isMiniature);

      return {
        ...p,
        collection: p.collection || p.home_page_collection || '',
        availability: p.availability || p.stock_status || (p.stock > 0 ? 'In Stock' : 'Out of Stock'),
        is_bestseller: isBs ? 'TRUE' : 'FALSE',
        is_new_arrival: isNa ? 'TRUE' : 'FALSE',
        is_miniature: isMin ? 'TRUE' : 'FALSE',
        size_prices: typeof p.size_prices === 'object' ? JSON.stringify(p.size_prices) : (p.size_prices || ''),
        tags: Array.isArray(p.tags) ? JSON.stringify(p.tags) : (p.tags || ''),
        images: Array.isArray(p.images) ? JSON.stringify(p.images) : (p.images || ''),
        shipping_weight: p.shipping?.weight ?? (p.shipping_weight || 0.5),
        shipping_length: p.shipping?.length ?? (p.shipping_length || 30),
        shipping_breadth: p.shipping?.breadth ?? (p.shipping_breadth || 20),
        shipping_height: p.shipping?.height ?? (p.shipping_height || 5),
      };
    });
    exportToCSV(exportData, PRODUCT_CSV_KEYS, PRODUCT_CSV_HEADERS, 'mahirash_fragrance_catalog');
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const rows = csvToJSON(text, PRODUCT_CSV_KEYS, PRODUCT_CSV_HEADERS);
        if (!rows || rows.length === 0) {
          alert("No rows found or headers do not match the expected format!");
          return;
        }

        let importCount = 0;
        let updateCount = 0;

        for (const row of rows) {
          const name = (row.name || '').trim();
          if (!name) continue;

          const priceNum = Math.max(0, Number(row.price) || 0);
          const origPriceNum = Math.max(0, Number(row.original_price) || priceNum);
          const stockNum = Math.max(0, Number(row.stock) || 0);
          const ratingNum = row.rating ? Number(row.rating) : 4.8;
          const reviewsCountNum = row.reviews_count ? Number(row.reviews_count) : 0;

          // Process images
          let imagesArr = [];
          if (row.images) {
            try {
              const parsedImg = JSON.parse(row.images);
              if (Array.isArray(parsedImg)) imagesArr = parsedImg;
              else imagesArr = [String(row.images).trim()];
            } catch (_) {
              imagesArr = String(row.images).split(',').map(s => s.trim()).filter(Boolean);
            }
          }
          if (row.image && !imagesArr.includes(row.image)) {
            imagesArr.unshift(row.image);
          }

          // Process size_prices
          let sizePricesArr = [];
          if (row.size_prices) {
            try {
              const parsedSp = JSON.parse(row.size_prices);
              if (Array.isArray(parsedSp)) sizePricesArr = parsedSp;
            } catch (_) { }
          }
          if (sizePricesArr.length === 0 && row.sizes) {
            const splitSizes = String(row.sizes).split(',').map(s => s.trim()).filter(Boolean);
            if (splitSizes.length > 0) {
              sizePricesArr = splitSizes.map(sz => ({
                size: sz,
                price: priceNum,
                original_price: origPriceNum,
                stock: stockNum,
                is_preorder: false,
                images: imagesArr
              }));
            }
          }
          if (sizePricesArr.length > 0) {
            sizePricesArr = sizePricesArr.map(sp => ({
              size: String(sp.size || '').trim(),
              price: Math.max(0, Number(sp.price) || priceNum),
              original_price: Math.max(0, Number(sp.original_price) || origPriceNum),
              stock: sp.stock !== undefined ? Math.max(0, Number(sp.stock)) : stockNum,
              is_preorder: Boolean(sp.is_preorder === true || sp.is_preorder === 'true'),
              images: Array.isArray(sp.images) ? sp.images : (sp.image ? [sp.image] : imagesArr),
              image: sp.image || (Array.isArray(sp.images) && sp.images[0] ? sp.images[0] : imagesArr[0] || '')
            }));
          }

          const sizesStr = row.sizes || (sizePricesArr.length > 0 ? sizePricesArr.map(sp => sp.size).join(', ') : '');
          const effectiveStock = sizePricesArr.length > 0
            ? sizePricesArr.reduce((sum, sp) => sum + (Number(sp.stock) || 0), 0)
            : stockNum;
          const autoStatus = effectiveStock === 0 ? "Out of Stock" : effectiveStock <= 5 ? "Low Stock" : "In Stock";
          const chosenAvailability = row.availability || row.stock_status || autoStatus;
          const chosenCollection = row.collection || row.home_page_collection || "";

          const isBestseller = row.is_bestseller === 'TRUE' || row.is_bestseller === 'true' || row.is_bestseller === true || row.is_bestseller === '1';
          const isNewArrival = row.is_new_arrival === 'TRUE' || row.is_new_arrival === 'true' || row.is_new_arrival === true || row.is_new_arrival === '1';
          const isMiniature = row.is_miniature === 'TRUE' || row.is_miniature === 'true' || row.is_miniature === true || row.is_miniature === '1';

          let tagsArr = [];
          if (row.tags) {
            try {
              const parsedTags = JSON.parse(row.tags);
              if (Array.isArray(parsedTags)) tagsArr = parsedTags;
              else tagsArr = String(row.tags).split(',').map(s => s.trim()).filter(Boolean);
            } catch (_) {
              tagsArr = String(row.tags).split(',').map(s => s.trim()).filter(Boolean);
            }
          }

          if (isBestseller && !tagsArr.some(t => (typeof t === 'string' ? t : t?.label)?.toUpperCase() === 'BESTSELLER')) {
            tagsArr.push({ label: 'BESTSELLER', bg: '#dc2626', text: '#ffffff' });
          }
          if (isNewArrival && !tagsArr.some(t => (typeof t === 'string' ? t : t?.label)?.toUpperCase() === 'NEW ARRIVAL')) {
            tagsArr.push({ label: 'NEW ARRIVAL', bg: '#b8860b', text: '#ffffff' });
          }

          const docData = {
            name,
            brand: row.brand || "MAHIRASH",
            category: row.category || "Extrait De Parfum",
            subcategory: row.subcategory || "",
            collection: chosenCollection,
            collections: chosenCollection ? [chosenCollection] : [],
            home_page_collection: chosenCollection,
            gender: row.gender || "Unisex",
            fragrance_family: row.fragrance_family || "",
            fragrance_concentration: row.fragrance_concentration || "",
            availability: chosenAvailability,
            stock_status: chosenAvailability,
            price: sizePricesArr.length > 0 ? sizePricesArr[0].price : priceNum,
            original_price: sizePricesArr.length > 0 ? sizePricesArr[0].original_price : origPriceNum,
            stock: effectiveStock,
            sizes: sizesStr,
            size_prices: sizePricesArr,
            rating: ratingNum,
            reviews_count: reviewsCountNum,
            top_notes: row.top_notes || "",
            heart_notes: row.heart_notes || "",
            base_notes: row.base_notes || "",
            longevity: row.longevity || "8-12 Hours",
            sillage: row.sillage || "Intense",
            is_bestseller: isBestseller,
            is_new_arrival: isNewArrival,
            is_miniature: isMiniature,
            is_atelier_edition: false,
            tags: tagsArr,
            image: row.image || imagesArr[0] || "",
            images: imagesArr,
            description: row.description || "",
            shipping: {
              weight: Math.max(0, Number(row.shipping_weight) || 0.5),
              length: Math.max(0, Number(row.shipping_length) || 30),
              breadth: Math.max(0, Number(row.shipping_breadth) || 20),
              height: Math.max(0, Number(row.shipping_height) || 5)
            }
          };

          let finalId = row.id;
          if (finalId) {
            const existingRef = doc(db, "products", finalId);
            const snap = await getDoc(existingRef);
            if (snap.exists()) {
              await setDoc(existingRef, { ...docData, updatedAt: new Date() }, { merge: true });
              updateCount++;
            } else {
              await setDoc(existingRef, { ...docData, id: finalId, createdAt: new Date() });
              importCount++;
            }
          } else {
            const newId = doc(collection(db, "products")).id;
            await setDoc(doc(db, "products", newId), {
              ...docData,
              id: newId,
              createdAt: new Date()
            });
            importCount++;
          }
        }

        alert(`Import completed! ${importCount} new products created, ${updateCount} updated.`);
        if (onImportSuccess) {
          onImportSuccess();
        }
      } catch (err) {
        alert("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Helper to change sort and reset to page 1
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
  };

  return (
    <section className="bg-white rounded-2xl border border-[#E9DCCB] shadow-sm overflow-hidden">
      {/* Top Header Controls */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E9DCCB]">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#30231F] tracking-tight">Fragrance Catalog</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#800020]/10 border border-[#800020]/20 text-[#800020] text-[12px] font-semibold">
              {products.length} Products
            </span>
          </div>
          <p className="text-[12px] sm:text-[13px] text-[#75665D] mt-1">
            Displaying 10 products per page sorted by most recently uploaded
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <button
            type="button"
            onClick={handleImportClick}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E9DCCB] rounded-xl bg-white hover:bg-[#FCF9F4] text-[13px] font-semibold text-[#30231F] cursor-pointer transition-all shadow-sm"
          >
            <Upload size={14} /> Import CSV
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E9DCCB] rounded-xl bg-white hover:bg-[#FCF9F4] text-[13px] font-semibold text-[#30231F] cursor-pointer transition-all shadow-sm"
          >
            <Download size={14} /> Export CSV
          </button>
          {onImportSuccess && (
            <button
              type="button"
              onClick={onImportSuccess}
              title="Refresh Catalog"
              className="p-2 border border-[#E9DCCB] rounded-xl bg-white hover:bg-[#FCF9F4] text-[#30231F] cursor-pointer transition-all shadow-sm"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="px-4 sm:px-6 py-3 bg-[#FCF9F4] border-b border-[#E9DCCB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Table Quick Search */}
        <div className="relative max-w-xs w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#75665D]" />
          <input
            type="text"
            placeholder="Search products by title, category..."
            value={tableSearch}
            onChange={(e) => {
              setTableSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-white border border-[#E9DCCB] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#800020]/25 focus:border-[#800020] transition-all text-[#30231F]"
          />
          {tableSearch && (
            <button
              type="button"
              onClick={() => {
                setTableSearch('');
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75665D] hover:text-[#30231F] text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Sort Options Dropdown */}
        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-[13px] text-[#75665D] font-medium whitespace-nowrap">
            <SlidersHorizontal size={14} className="text-[#800020]" />
            <span>Sort by:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="text-[13px] bg-white border border-[#E9DCCB] text-[#30231F] rounded-xl px-3 py-1.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#800020]/25 focus:border-[#800020] cursor-pointer shadow-sm w-full sm:w-auto"
          >
            <option value="date-desc">Recently Uploaded (Newest First)</option>
            <option value="date-asc">Date: Oldest First</option>
            <option value="name-asc">Product Name: A → Z</option>
            <option value="name-desc">Product Name: Z → A</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock-desc">Stock Quantity: High to Low</option>
            <option value="stock-asc">Stock Quantity: Low to High</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Banner */}
      {selectedIds.length > 0 && (
        <div className="mx-3.5 sm:mx-6 my-3 sm:my-4 flex flex-col sm:flex-row justify-between items-center bg-[#30231F] text-white p-3.5 rounded-2xl gap-3 shadow-lg border border-[#800020]/30">
          <div className="text-[13px] font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B88D46]"></span>
            <span>{selectedIds.length} product(s) selected</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkStatusChange("In Stock")}
              className="px-3 py-1.5 bg-[#800020] text-white hover:bg-[#650018] rounded-xl text-[12px] font-semibold cursor-pointer transition-colors shadow-sm"
            >
              Mark In Stock
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusChange("Low Stock")}
              className="px-3 py-1.5 bg-[#650018] text-[#B88D46] border border-[#B88D46]/40 hover:bg-[#800020] rounded-xl text-[12px] font-semibold cursor-pointer transition-colors"
            >
              Mark Low Stock
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusChange("Out of Stock")}
              className="px-3 py-1.5 bg-black/50 text-white/80 border border-white/20 hover:bg-black rounded-xl text-[12px] font-semibold cursor-pointer transition-colors"
            >
              Mark Out of Stock
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[12px] font-semibold cursor-pointer transition-colors shadow-sm"
            >
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/80 rounded-xl text-[12px] font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-[#FCF9F4] border-b border-[#E9DCCB]">
            <tr className="text-[12px] text-[#75665D] uppercase tracking-wider font-semibold">
              <th className="px-5 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={isPageAllSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-[#800020] cursor-pointer rounded border-[#E9DCCB]"
                  title="Select all on this page"
                />
              </th>
              <th className="px-5 py-3.5 cursor-pointer select-none hover:text-black" onClick={() => handleSortChange(sortBy === 'name-asc' ? 'name-desc' : 'name-asc')}>
                <div className="flex items-center gap-1.5">
                  <span>Product</span>
                  {sortBy === 'name-asc' ? <ArrowUp size={12} /> : sortBy === 'name-desc' ? <ArrowDown size={12} /> : <ArrowUpDown size={12} className="opacity-40" />}
                </div>
              </th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Gender</th>
              <th className="px-5 py-3.5 cursor-pointer select-none hover:text-black" onClick={() => handleSortChange(sortBy === 'price-asc' ? 'price-desc' : 'price-asc')}>
                <div className="flex items-center gap-1.5">
                  <span>Price</span>
                  {sortBy === 'price-asc' ? <ArrowUp size={12} /> : sortBy === 'price-desc' ? <ArrowDown size={12} /> : <ArrowUpDown size={12} className="opacity-40" />}
                </div>
              </th>
              <th className="px-5 py-3.5 cursor-pointer select-none hover:text-black" onClick={() => handleSortChange(sortBy === 'stock-desc' ? 'stock-asc' : 'stock-desc')}>
                <div className="flex items-center gap-1.5">
                  <span>Qty</span>
                  {sortBy === 'stock-asc' ? <ArrowUp size={12} /> : sortBy === 'stock-desc' ? <ArrowDown size={12} /> : <ArrowUpDown size={12} className="opacity-40" />}
                </div>
              </th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 cursor-pointer select-none hover:text-black" onClick={() => handleSortChange(sortBy === 'date-desc' ? 'date-asc' : 'date-desc')}>
                <div className="flex items-center gap-1.5">
                  <span>Uploaded</span>
                  {sortBy === 'date-desc' ? <ArrowDown size={12} /> : sortBy === 'date-asc' ? <ArrowUp size={12} /> : <ArrowUpDown size={12} className="opacity-40" />}
                </div>
              </th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {paginatedProducts.map((row) => {
              const timestamp = getProductTimestamp(row);
              const formattedDate = timestamp ? new Date(timestamp).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              }) : '—';

              return (
                <tr key={row.id} className={`hover:bg-zinc-50/80 transition-colors ${selectedIds.includes(row.id) ? 'bg-zinc-50' : ''}`}>
                  <td className="px-5 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => toggleSelectRow(row.id)}
                      className="w-4 h-4 accent-black cursor-pointer rounded border-zinc-300"
                    />
                  </td>
                  <td className="px-5 py-4 text-zinc-900 font-medium max-w-xs">
                    <div className="flex items-center gap-3">
                      {/* Thumbnail */}
                      <div className="relative w-11 h-13 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200 shadow-sm">
                        <OptimizedCloudinaryImage
                          src={row.image || row.images?.[0] || 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=200&auto=format&fit=crop'}
                          alt={row.name}
                          preset="avatar"
                          className="w-full h-full object-cover"
                        />
                        {row.model_image && (
                          <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#b8860b] rounded-bl-sm" title="Model photo included" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-zinc-900 block truncate" title={row.name}>{row.name}</span>
                        {Array.isArray(row.size_prices) && row.size_prices.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {row.size_prices.map((sp, vIdx) => {
                              const vStk = Number(sp.stock) || 0;
                              return (
                                <span
                                  key={vIdx}
                                  className={`text-[12px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${vStk === 0 ? 'bg-red-50 text-red-600 border-red-200' :
                                    vStk <= 5 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                      'bg-zinc-100 text-zinc-700 border-zinc-200'
                                    }`}
                                >
                                  {sp.size || `Var ${vIdx + 1}`}: {vStk}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        {row.model_image && (
                          <span className="text-[12px] text-[#b8860b] uppercase tracking-wider block mt-0.5">
                            ✦ Model Photo
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-zinc-600 text-[13px]">
                    {row.category || "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[12px] font-medium ${row.gender === 'Men' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      row.gender === 'Women' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                        'bg-zinc-100 text-zinc-700 border border-zinc-200'
                      }`}>
                      {row.gender || "Unisex"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-900 font-semibold text-[14px]">
                    ₹{Number(row.price || 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-4 text-zinc-900 tabular-nums">
                    <div className="font-semibold text-sm">{row.stock ?? '—'}</div>
                    {Array.isArray(row.size_prices) && row.size_prices.length > 0 && (
                      <span className="text-[12px] text-zinc-400 font-medium block">Total Units</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[12px] font-medium ${statusBadgeClasses(row.stock_status || "In Stock")}`}
                    >
                      {row.stock_status || "In Stock"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-zinc-500 text-[12px] whitespace-nowrap">
                    {formattedDate}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(row)}
                        title="Edit Product"
                        className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-black transition-colors border border-zinc-200 cursor-pointer"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row.id)}
                        title="Delete Product"
                        className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200 cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* Empty State */}
            {!loading && sortedProducts.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 mb-3">
                      <Package size={22} />
                    </div>
                    <p className="text-sm font-semibold text-zinc-800">
                      {tableSearch ? `No products found matching "${tableSearch}"` : "No products found in catalog"}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      {tableSearch ? "Try adjusting your search query or clear the filter." : "Click \"Add New Product\" above or import a CSV to populate products."}
                    </p>
                    {tableSearch && (
                      <button
                        type="button"
                        onClick={() => setTableSearch('')}
                        className="mt-3 text-xs font-semibold text-black underline cursor-pointer"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Loading State */}
            {loading && sortedProducts.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-zinc-500" />
                    <span className="text-sm font-medium">Loading catalog products...</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {sortedProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center px-4 sm:px-6 py-3.5 border-t border-zinc-200 bg-white gap-3">
            <span className="text-[12px] sm:text-[13px] text-zinc-500 font-medium text-center sm:text-left">
              Showing <span className="font-semibold text-zinc-800">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="font-semibold text-zinc-800">
                {Math.min(currentPage * itemsPerPage, sortedProducts.length)}
              </span>{" "}
              of <span className="font-semibold text-zinc-800">{sortedProducts.length}</span> products
              {products.length !== sortedProducts.length && ` (filtered from ${products.length} total)`}
            </span>

            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              {/* Previous Button */}
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-zinc-300 rounded-lg text-[12px] sm:text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
              >
                <ChevronLeft size={14} /> Prev
              </button>

              {/* Numbered Page Buttons - Hidden on very small screens to avoid overflow */}
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  // If lots of pages, show window around currentPage
                  if (
                    totalPages > 7 &&
                    pageNum !== 1 &&
                    pageNum !== totalPages &&
                    Math.abs(pageNum - currentPage) > 1
                  ) {
                    if (pageNum === 2 || pageNum === totalPages - 1) {
                      return <span key={pageNum} className="px-1 text-zinc-400 text-xs">...</span>;
                    }
                    return null;
                  }

                  const isActive = currentPage === pageNum;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-[32px] h-8 px-2 rounded-xl text-[13px] font-medium transition-colors cursor-pointer ${isActive
                        ? 'bg-[#800020] text-white font-semibold shadow-md shadow-[#800020]/25'
                        : 'border border-[#E9DCCB] text-[#30231F] hover:bg-[#FCF9F4]'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border border-[#E9DCCB] rounded-xl text-[13px] font-medium text-[#30231F] hover:bg-[#FCF9F4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm cursor-pointer"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsTable;
