import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../../components/Firebase';
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { ClipboardCheck, Search, Plus, Minus, Save, AlertTriangle, CheckCircle, Package, Download, Upload } from 'lucide-react';
import OptimizedCloudinaryImage from '../../../components/OptimizedCloudinaryImage';
import { exportToCSV, parseCSV, csvToJSON } from '../../../utils/exportUtils';


const InventoryView = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all', 'low', 'out', 'in'
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const fileInputRef = useRef(null);

  const PRODUCT_CSV_KEYS = [
    'id', 'name', 'brand', 'category', 'subcategory', 'collection', 'gender',
    'fragrance_family', 'fragrance_concentration', 'price', 'original_price',
    'stock', 'stock_status', 'sizes', 'size_prices', 'rating', 'reviews_count',
    'top_notes', 'heart_notes', 'base_notes', 'longevity', 'sillage',
    'tags', 'image', 'images', 'description'
  ];

  const PRODUCT_CSV_HEADERS = [
    'Product ID', 'Product Name', 'Brand', 'Category', 'Subcategory', 'Collection', 'Gender',
    'Fragrance Family', 'Fragrance Concentration', 'Price (INR)', 'Original Price (INR)',
    'Stock Quantity', 'Stock Status', 'Sizes', 'Size Prices (JSON)', 'Rating', 'Reviews Count',
    'Top Notes', 'Heart Notes', 'Base Notes', 'Longevity', 'Sillage',
    'Tags', 'Primary Image URL', 'All Image URLs', 'Description'
  ];

  const handleExportInventory = () => {
    exportToCSV(products, PRODUCT_CSV_KEYS, PRODUCT_CSV_HEADERS, 'mahirash_inventory');
  };

  const handleImportInventory = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const rows = csvToJSON(text, PRODUCT_CSV_KEYS, PRODUCT_CSV_HEADERS);
        if (!rows || rows.length === 0) {
          alert("No rows found or headers do not match!");
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
            } catch (_) {}
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
          const stockStatus = row.stock_status || autoStatus;

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

          const docData = {
            name,
            brand: row.brand || "MAHIRASH",
            category: row.category || "Extrait De Parfum",
            subcategory: row.subcategory || "",
            collection: row.collection || "",
            gender: row.gender || "Unisex",
            fragrance_family: row.fragrance_family || "",
            fragrance_concentration: row.fragrance_concentration || "",
            price: sizePricesArr.length > 0 ? sizePricesArr[0].price : priceNum,
            original_price: sizePricesArr.length > 0 ? sizePricesArr[0].original_price : origPriceNum,
            stock: effectiveStock,
            stock_status: stockStatus,
            sizes: sizesStr,
            size_prices: sizePricesArr,
            rating: ratingNum,
            reviews_count: reviewsCountNum,
            top_notes: row.top_notes || "",
            heart_notes: row.heart_notes || "",
            base_notes: row.base_notes || "",
            longevity: row.longevity || "",
            sillage: row.sillage || "",
            tags: tagsArr,
            image: row.image || imagesArr[0] || "",
            images: imagesArr,
            description: row.description || "",
            updatedAt: new Date()
          };

          if (row.id) {
            const docRef = doc(db, "products", row.id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              const existingData = docSnap.data();
              await setDoc(docRef, {
                ...docData,
                createdAt: existingData.createdAt || new Date()
              }, { merge: true });
            } else {
              await setDoc(docRef, {
                ...docData,
                id: row.id,
                createdAt: new Date()
              });
            }
            updateCount++;
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

        alert(`Successfully imported inventory! ${importCount} new products created, ${updateCount} updated.`);
        fetchInventory();
      } catch (err) {
        alert("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'products'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(list);
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleStockChange = (id, delta) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const current = parseInt(p.stock) || 0;
        const newStock = Math.max(0, current + delta);
        const newStatus = newStock === 0 ? "Out of Stock" : newStock <= 5 ? "Low Stock" : "In Stock";
        return { ...p, stock: newStock, stock_status: newStatus };
      }
      return p;
    }));
  };

  const handleManualStockInput = (id, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    const newStatus = num === 0 ? "Out of Stock" : num <= 5 ? "Low Stock" : "In Stock";
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: num, stock_status: newStatus } : p));
  };

  const handleVariantStockChange = (id, vIdx, delta) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id && Array.isArray(p.size_prices)) {
        const updatedSizes = p.size_prices.map((sp, idx) => {
          if (idx === vIdx) {
            const cur = Number(sp.stock) || 0;
            return { ...sp, stock: Math.max(0, cur + delta) };
          }
          return sp;
        });
        const newStockTotal = updatedSizes.reduce((sum, sp) => sum + (Number(sp.stock) || 0), 0);
        const newStatus = newStockTotal === 0 ? "Out of Stock" : newStockTotal <= 5 ? "Low Stock" : "In Stock";
        return { ...p, size_prices: updatedSizes, stock: newStockTotal, stock_status: newStatus };
      }
      return p;
    }));
  };

  const handleVariantManualStockInput = (id, vIdx, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setProducts(prev => prev.map(p => {
      if (p.id === id && Array.isArray(p.size_prices)) {
        const updatedSizes = p.size_prices.map((sp, idx) => {
          if (idx === vIdx) {
            return { ...sp, stock: num };
          }
          return sp;
        });
        const newStockTotal = updatedSizes.reduce((sum, sp) => sum + (Number(sp.stock) || 0), 0);
        const newStatus = newStockTotal === 0 ? "Out of Stock" : newStockTotal <= 5 ? "Low Stock" : "In Stock";
        return { ...p, size_prices: updatedSizes, stock: newStockTotal, stock_status: newStatus };
      }
      return p;
    }));
  };

  const handleSaveStock = async (product) => {
    setSavingId(product.id);
    try {
      let updatedSizePrices = product.size_prices;
      let stockNum = parseInt(product.stock) || 0;

      if (Array.isArray(updatedSizePrices) && updatedSizePrices.length > 0) {
        stockNum = updatedSizePrices.reduce((sum, sp) => sum + (Number(sp.stock) || 0), 0);
      }

      const statusStr = stockNum === 0 ? "Out of Stock" : stockNum <= 5 ? "Low Stock" : "In Stock";
      // Use updateDoc (not setDoc) to only update stock fields without overwriting the entire product document
      await updateDoc(doc(db, 'products', product.id), {
        stock: stockNum,
        stock_status: statusStr,
        size_prices: updatedSizePrices || [],
        updatedAt: new Date().toISOString()
      });
      alert(`Stock updated for "${product.name}"!`);
    } catch (err) {
      alert("Failed to save stock: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const filteredProducts = products.filter(p => {
    const stockNum = parseInt(p.stock) || 0;
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || p.category?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === "low") return stockNum > 0 && stockNum <= 5;
    if (filter === "out") return stockNum === 0;
    if (filter === "in") return stockNum > 5;
    return true;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
    }
  };

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
      alert("Selected products deleted!");
      setSelectedIds([]);
      fetchInventory();
    } catch (err) {
      alert("Bulk delete failed: " + err.message);
    }
  };

  const handleBulkStatusChange = async (status) => {
    try {
      for (const id of selectedIds) {
        const stockVal = status === "Out of Stock" ? 0 : status === "Low Stock" ? 3 : 15;
        await updateDoc(doc(db, "products", id), {
          stock_status: status,
          stock: stockVal
        });
      }
      alert(`Updated stock status to ${status} for ${selectedIds.length} items!`);
      setSelectedIds([]);
      fetchInventory();
    } catch (err) {
      alert("Bulk stock status change failed: " + err.message);
    }
  };

  const totalStockCount = products.reduce((acc, p) => acc + (parseInt(p.stock) || 0), 0);
  const lowStockCount = products.filter(p => (parseInt(p.stock) || 0) > 0 && (parseInt(p.stock) || 0) <= 5).length;
  const outOfStockCount = products.filter(p => (parseInt(p.stock) || 0) === 0).length;

  return (
    <div className="space-y-6 text-zinc-900 font-['Inter',sans-serif]">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h2 className="text-xl   font-poppins text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <ClipboardCheck className="text-[#b8860b]" size={22} /> Inventory & Stock Control Center
          </h2>
          <p className="text-[14px] text-zinc-500 mt-1">Live stock levels, inventory valuation, and instant stock update controls.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportInventory}
            accept=".csv"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-300 rounded-lg bg-white hover:bg-zinc-50 text-[13px] font-semibold text-zinc-700 cursor-pointer transition-all shadow-sm"
          >
            <Upload size={14} /> Import Inventory
          </button>
          <button
            type="button"
            onClick={handleExportInventory}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-300 rounded-lg bg-white hover:bg-zinc-50 text-[13px] font-semibold text-zinc-700 cursor-pointer transition-all shadow-sm"
          >
            <Download size={14} /> Export Inventory
          </button>
        </div>
      </div>

      {/* Stock Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px]   text-zinc-400 uppercase tracking-widest block">Total Inventory Stock</span>
            <h3 className="text-2xl   text-zinc-900 mt-1">{totalStockCount} units</h3>
          </div>
          <div className="p-3 bg-zinc-100 rounded-xl text-zinc-700"><Package size={20} /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px]   text-amber-600 uppercase tracking-widest block">Low Stock Alerts</span>
            <h3 className="text-2xl   text-amber-700 mt-1">{lowStockCount} items</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><AlertTriangle size={20} /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px]   text-red-600 uppercase tracking-widest block">Out of Stock Items</span>
            <h3 className="text-2xl   text-red-700 mt-1">{outOfStockCount} items</h3>
          </div>
          <div className="p-3 bg-red-50 rounded-xl text-red-600"><AlertTriangle size={20} /></div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by title or category..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-[14px] outline-none focus:border-black focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilter("all")}
            className={`px-3.5 py-1.5 text-[14px]   rounded-lg transition-all ${filter === "all" ? "bg-white text-black shadow-sm" : "text-zinc-500 hover:text-black"}`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setFilter("low")}
            className={`px-3.5 py-1.5 text-[14px]   rounded-lg transition-all ${filter === "low" ? "bg-amber-500 text-white shadow-sm" : "text-amber-700 hover:bg-amber-100"}`}
          >
            Low Stock ({lowStockCount})
          </button>
          <button
            onClick={() => setFilter("out")}
            className={`px-3.5 py-1.5 text-[14px]   rounded-lg transition-all ${filter === "out" ? "bg-red-600 text-white shadow-sm" : "text-red-700 hover:bg-red-100"}`}
          >
            Out of Stock ({outOfStockCount})
          </button>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        {selectedIds.length > 0 && (
          <div className="mb-4 flex flex-col sm:flex-row justify-between items-center bg-zinc-50 border border-zinc-200 p-4 rounded-xl gap-3">
            <div className="text-[13px] font-semibold text-zinc-700">
              {selectedIds.length} item(s) selected
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBulkStatusChange("In Stock")}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded text-[13px] font-semibold cursor-pointer transition-colors"
              >
                Mark In Stock
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange("Low Stock")}
                className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-[#d9a036]/20 hover:bg-amber-100 rounded text-[13px] font-semibold cursor-pointer transition-colors"
              >
                Mark Low Stock
              </button>
              <button
                type="button"
                onClick={() => handleBulkStatusChange("Out of Stock")}
                className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded text-[13px] font-semibold cursor-pointer transition-colors"
              >
                Mark Out of Stock
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded text-[13px] font-semibold cursor-pointer transition-colors"
              >
                Delete Selected
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded text-[13px] font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="py-12 text-center text-[14px] text-zinc-500">Loading live stock data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead>
                <tr className="text-[10px]   uppercase tracking-widest text-zinc-400 border-b border-zinc-200">
                  <th className="py-3 px-3 w-10">
                    <input
                      type="checkbox"
                      checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-black cursor-pointer rounded border-zinc-300"
                    />
                  </th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Adjust Quantity</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredProducts.map((p) => {
                  const stockNum = parseInt(p.stock) || 0;
                  return (
                    <tr key={p.id} className={`hover:bg-zinc-50/80 transition-colors ${selectedIds.includes(p.id) ? 'bg-zinc-50' : ''}`}>
                      <td className="py-3.5 px-3 w-10">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(p.id)}
                          onChange={() => toggleSelectRow(p.id)}
                          className="w-4 h-4 accent-black cursor-pointer rounded border-zinc-300"
                        />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-3">
                          <OptimizedCloudinaryImage src={p.image || p.images?.[0]} preset="avatar" className="w-10 h-10 object-cover rounded-lg bg-zinc-100 border border-zinc-200" alt={p.name} />
                          <div>
                            <p className="  text-zinc-900">{p.name}</p>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: #{p.id?.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-600 font-semibold">{p.category || 'General'}</td>
                      <td className="py-3.5 px-3   text-zinc-900">₹{(p.price || 0).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded text-[9px]   ${stockNum === 0 ? "bg-red-100 text-red-800 border border-red-200" :
                          stockNum <= 5 ? "bg-amber-100 text-amber-800 border border-amber-200" :
                            "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          }`}>
                          {stockNum === 0 ? "OUT OF STOCK" : stockNum <= 5 ? "LOW STOCK" : "IN STOCK"}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        {Array.isArray(p.size_prices) && p.size_prices.length > 0 ? (
                          <div className="space-y-2 py-1">
                            {p.size_prices.map((sp, vIdx) => {
                              const vStockNum = Number(sp.stock) || 0;
                              return (
                                <div key={vIdx} className="flex items-center justify-between gap-3 bg-zinc-50 border border-zinc-200/80 px-2.5 py-1.5 rounded-lg text-[14px]">
                                  <span className="font-extrabold uppercase text-zinc-900 min-w-[50px]">{sp.size || `Var ${vIdx + 1}`}</span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleVariantStockChange(p.id, vIdx, -1)}
                                      className="w-6 h-6 flex items-center justify-center bg-white hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded transition-colors cursor-pointer"
                                    >
                                      <Minus size={11} />
                                    </button>
                                    <input
                                      type="number"
                                      min="0"
                                      value={sp.stock ?? 0}
                                      onChange={(e) => handleVariantManualStockInput(p.id, vIdx, e.target.value)}
                                      className={`w-12 px-1 py-0.5 text-center font-bold border rounded outline-none text-[14px] ${vStockNum === 0 ? 'bg-red-50 text-red-700 border-red-300' :
                                          vStockNum <= 5 ? 'bg-amber-50 text-amber-800 border-amber-300' :
                                            'bg-white text-zinc-900 border-zinc-300'
                                        }`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleVariantStockChange(p.id, vIdx, 1)}
                                      className="w-6 h-6 flex items-center justify-center bg-white hover:bg-zinc-200 text-zinc-800 border border-zinc-300 rounded transition-colors cursor-pointer"
                                    >
                                      <Plus size={11} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                            <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider text-right pr-1">
                              Total Stock: <span className="text-zinc-900 font-extrabold">{stockNum}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStockChange(p.id, -1)}
                              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Minus size={13} />
                            </button>
                            <input
                              type="number"
                              value={p.stock ?? 0}
                              onChange={(e) => handleManualStockInput(p.id, e.target.value)}
                              className="w-16 px-2 py-1 text-center bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] outline-none focus:border-black"
                            />
                            <button
                              onClick={() => handleStockChange(p.id, 1)}
                              className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => handleSaveStock(p)}
                          disabled={savingId === p.id}
                          className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white   text-[14px] rounded-lg transition-all flex items-center gap-1.5 ml-auto cursor-pointer shadow-sm"
                        >
                          <Save size={13} />
                          <span>{savingId === p.id ? "Saving..." : "Save Stock"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500 text-[14px]">No matching inventory items found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryView;
