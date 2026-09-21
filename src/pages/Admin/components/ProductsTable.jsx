import React, { useRef, useState } from 'react';
import { Edit2, Trash2, Tag, Eye, Download, Upload } from 'lucide-react';
import OptimizedCloudinaryImage from '../../../components/OptimizedCloudinaryImage';
import { exportToCSV, parseCSV, csvToJSON } from '../../../utils/exportUtils';
import { db } from '../../../components/Firebase';
import { collection, doc, setDoc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';

const statusBadgeClasses = (status) => {
  switch (status) {
    case "In Stock":
      return "bg-[#4A5D4E]/10 text-[#4A5D4E] border-[#4A5D4E]/20";
    case "Low Stock":
      return "bg-[#D9A036]/10 text-[#D9A036] border-[#D9A036]/20";
    default:
      return "bg-red-100 text-red-700 border-red-200";
  }
};

const ProductsTable = ({ products, onEdit, onDelete, onImportSuccess }) => {
  const fileInputRef = useRef(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
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

  const handleExport = () => {
    const keys = ['id', 'name', 'category', 'gender', 'price', 'stock', 'stock_status', 'sizes', 'colors', 'material', 'rating', 'image', 'model_image', 'images', 'description'];
    const headers = ['Product ID', 'Product Name', 'Category', 'Gender', 'Price (INR)', 'Stock Quantity', 'Stock Status', 'Sizes', 'Colors', 'Material', 'Rating', 'Primary Image URL', 'Model Image URL', 'All Image URLs', 'Description'];
    exportToCSV(products, keys, headers, 'mahirash_products');
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
        const keys = ['id', 'name', 'category', 'gender', 'price', 'stock', 'stock_status', 'sizes', 'colors', 'material', 'rating', 'image', 'model_image', 'images', 'description'];
        const headers = ['Product ID', 'Product Name', 'Category', 'Gender', 'Price (INR)', 'Stock Quantity', 'Stock Status', 'Sizes', 'Colors', 'Material', 'Rating', 'Primary Image URL', 'Model Image URL', 'All Image URLs', 'Description'];

        const rows = csvToJSON(text, keys, headers);
        if (!rows || rows.length === 0) {
          alert("No rows found or headers do not match the expected format!");
          return;
        }

        let importCount = 0;
        let updateCount = 0;

        for (const row of rows) {
          const priceObj = Number(row.price) || 0;
          const stockObj = Number(row.stock) || 0;
          const ratingObj = Number(row.rating) || 4.5;
          const imagesArr = row.images ? row.images.split(',').map(x => x.trim()).filter(Boolean) : (row.image ? [row.image] : []);

          const docData = {
            name: row.name || 'Unnamed Product',
            category: row.category || 'Extrait de Parfum',
            gender: row.gender || 'Unisex',
            price: priceObj,
            original_price: priceObj,
            stock: stockObj,
            stock_status: row.stock_status || (stockObj === 0 ? 'Out of Stock' : stockObj <= 5 ? 'Low Stock' : 'In Stock'),
            sizes: row.sizes || '',
            colors: row.colors || '',
            material: row.material || '',
            rating: ratingObj,
            image: row.image || (imagesArr[0] || ''),
            model_image: row.model_image || '',
            images: imagesArr,
            description: row.description || '',
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

  return (
    <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-200">
        <div>
          <h2 className="text-lg font-poppins   text-zinc-900">Fragrance Catalog</h2>
          <p className="text-[14px] text-zinc-500 mt-0.5">
            Manage your Mahirash luxury perfume catalog
          </p>
        </div>
        <div className="flex items-center gap-3">
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
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-300 rounded-lg bg-white hover:bg-zinc-50 text-[13px] font-semibold text-zinc-700 cursor-pointer transition-all shadow-sm"
          >
            <Upload size={14} /> Import Products
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-300 rounded-lg bg-white hover:bg-zinc-50 text-[13px] font-semibold text-zinc-700 cursor-pointer transition-all shadow-sm"
          >
            <Download size={14} /> Export Products
          </button>
          <span className="px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-[14px]">
            {products.length} Products
          </span>
        </div>
      </div>
      {selectedIds.length > 0 && (
        <div className="mx-6 my-4 flex flex-col sm:flex-row justify-between items-center bg-zinc-50 border border-zinc-200 p-4 rounded-xl gap-3">
          <div className="text-[13px] font-semibold text-zinc-700">
            {selectedIds.length} product(s) selected
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
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-100">
            <tr className="text-[11px]   text-zinc-700 uppercase tracking-widest">
              <th className="px-6 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={products.length > 0 && selectedIds.length === products.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-black cursor-pointer rounded border-zinc-300"
                />
              </th>
              <th className="px-6 py-3.5">Product</th>
              <th className="px-6 py-3.5">Category</th>
              <th className="px-6 py-3.5">Gender</th>
              <th className="px-6 py-3.5">Price</th>
              <th className="px-6 py-3.5">Qty</th>
              <th className="px-6 py-3.5">Stock</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row) => (
              <tr key={row.id} className={`hover:bg-zinc-50/80 transition-colors ${selectedIds.includes(row.id) ? 'bg-zinc-50' : ''}`}>
                <td className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleSelectRow(row.id)}
                    className="w-4 h-4 accent-black cursor-pointer rounded border-zinc-300"
                  />
                </td>
                <td className="px-6 py-4 text-zinc-900 font-medium">
                  <div className="flex items-center gap-3">
                    {/* Thumbnail */}
                    <div className="relative w-10 h-12 rounded overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200 shadow-sm">
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
                    <div>
                      <span className="font-semibold text-zinc-900 block">{row.name}</span>
                      {Array.isArray(row.size_prices) && row.size_prices.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {row.size_prices.map((sp, vIdx) => {
                            const vStk = Number(sp.stock) || 0;
                            return (
                              <span
                                key={vIdx}
                                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                  vStk === 0 ? 'bg-red-50 text-red-600 border-red-200' :
                                  vStk <= 5 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                  'bg-zinc-100 text-zinc-700 border-zinc-200'
                                }`}
                              >
                                {sp.size || `Var ${vIdx+1}`}: {vStk}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {row.model_image && (
                        <span className="text-[10px] text-[#b8860b] uppercase tracking-wider block mt-0.5">
                          ✦ Model Photo
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-zinc-600">
                  {row.category || "-"}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[14px] ${row.gender === 'Men' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    row.gender === 'Women' ? 'bg-pink-50 text-pink-700 border border-pink-200' :
                      'bg-zinc-100 text-zinc-700 border border-zinc-200'
                    }`}>
                    {row.gender || "Unisex"}
                  </span>
                </td>
                <td className="px-6 py-4 text-zinc-900 font-semibold">
                  ₹{Number(row.price || 0).toFixed(0)}
                </td>
                <td className="px-6 py-4 text-zinc-900 tabular-nums">
                  <div className="font-bold text-sm">{row.stock ?? '—'}</div>
                  {Array.isArray(row.size_prices) && row.size_prices.length > 0 && (
                    <span className="text-[10px] text-zinc-400 font-medium block">Total Units</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full border text-[14px]   ${statusBadgeClasses(row.stock_status || "In Stock")}`}
                  >
                    {row.stock_status || "In Stock"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(row)}
                      className="p-2 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 hover:text-black transition-colors border border-zinc-200"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(row.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-10 text-center text-sm text-zinc-500"
                >
                  No products yet. Click &quot;Add Product&quot; to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {products.length > itemsPerPage && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-200 bg-white">
            <span className="text-[13px] text-zinc-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, products.length)} of {products.length} products
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-zinc-300 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(products.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(products.length / itemsPerPage)}
                className="px-3 py-1.5 border border-zinc-300 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductsTable;
