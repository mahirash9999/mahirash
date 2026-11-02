import React, { useState, useRef } from 'react';
import { db } from '../../../components/Firebase';
import {
  importProductsWithUpsert,
  downloadSampleProductCSV,
  PRODUCT_CSV_KEYS,
  PRODUCT_CSV_HEADERS
} from '../../../utils/productImportHelper';
import { exportToCSV } from '../../../utils/exportUtils';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
  Info
} from 'lucide-react';

const ProductCSVModal = ({ isOpen, onClose, products = [], onSuccess }) => {
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'export'
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ status: '', percent: 0, message: '' });
  const [importResult, setImportResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExportFullCatalog = () => {
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

    const dateStr = new Date().toISOString().slice(0, 10);
    exportToCSV(exportData, PRODUCT_CSV_KEYS, PRODUCT_CSV_HEADERS, `mahirash_products_catalog_${dateStr}`);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Please select a valid .csv file.');
      return;
    }

    setSelectedFileName(file.name);
    setErrorMsg('');
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setImporting(true);
        const text = evt.target.result;

        const result = await importProductsWithUpsert(text, db, (prog) => {
          setProgress(prog);
        });

        setImportResult(result);
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error('Import error:', err);
        setErrorMsg(err.message || 'Failed to process CSV file.');
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto font-['Inter',sans-serif]">
      <div className="bg-white rounded-3xl border border-[#E9DCCB] max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-[#30231F]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#800020]/10 text-[#800020] rounded-xl border border-[#800020]/20">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-bold uppercase tracking-wider text-[#30231F]">
                Product CSV Import & Export Hub
              </h2>
              <p className="text-xs text-[#75665D] mt-0.5">
                Bulk upload, duplicate prevention, and auto-sync of categories and collections.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#75665D] hover:text-[#30231F] hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-[#FCF9F4] p-1.5 rounded-2xl border border-[#E9DCCB]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'import'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'text-[#75665D] hover:text-[#30231F]'
            }`}
          >
            <Upload size={15} /> Import Products (CSV)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-[#800020] text-white shadow-xs'
                : 'text-[#75665D] hover:text-[#30231F]'
            }`}
          >
            <Download size={15} /> Export Catalog (CSV)
          </button>
        </div>

        {/* ── TAB 1: IMPORT ── */}
        {activeTab === 'import' && (
          <div className="space-y-5">
            {/* Guide Card explaining Duplicate Prevention & ID Handling */}
            <div className="bg-[#FCF9F4] border border-[#E9DCCB] rounded-2xl p-4 sm:p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#800020] flex items-center gap-1.5">
                <Info size={14} /> How Smart CSV Import Works:
              </h4>
              <ul className="text-xs text-[#75665D] space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#800020] font-bold mt-0.5">•</span>
                  <span>
                    <strong className="text-[#30231F]">No Duplicate Products:</strong> If an existing product is found by <em>Product Name</em> or <em>Product ID</em>, it will <strong>update</strong> the price, stock, and details. It will <strong>never</strong> create a duplicate document!
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#800020] font-bold mt-0.5">•</span>
                  <span>
                    <strong className="text-[#30231F]">Adding New Products:</strong> In your Excel/CSV sheet, simply leave the <em>Product ID</em> column <strong>BLANK / EMPTY</strong>. The system will automatically generate clean unique IDs for all new products!
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#800020] font-bold mt-0.5">•</span>
                  <span>
                    <strong className="text-[#30231F]">Auto-Sync Categories & Collections:</strong> Any new Category, Brand, Collection, or Fragrance Family in your CSV is automatically registered in its respective Firestore collection so it immediately appears across the store and admin dropdowns!
                  </span>
                </li>
              </ul>
            </div>

            {/* Template Download Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-zinc-50 border border-zinc-200 rounded-xl">
              <div className="flex items-center gap-2 text-xs text-zinc-700">
                <FileText size={16} className="text-[#B88D46]" />
                <span>Need a ready-made template to fill your products?</span>
              </div>
              <button
                type="button"
                onClick={downloadSampleProductCSV}
                className="px-3.5 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-lg text-xs font-semibold text-[#800020] flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <Download size={13} /> Download Sample Template CSV
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Progress Bar */}
            {importing && (
              <div className="p-4 bg-[#FCF9F4] border border-[#E9DCCB] rounded-2xl space-y-2">
                <div className="flex justify-between text-xs font-semibold text-[#30231F]">
                  <span className="flex items-center gap-1.5">
                    <RefreshCw size={13} className="animate-spin text-[#800020]" />
                    {progress.message || 'Processing CSV file...'}
                  </span>
                  <span className="font-mono text-[#800020]">{progress.percent}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#800020] transition-all duration-300"
                    style={{ width: `${progress.percent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Import Summary Result Card */}
            {importResult && (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                  <CheckCircle2 size={18} />
                  <span>Import Completed Successfully!</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-zinc-500 block">New Products Created</span>
                    <strong className="text-emerald-700 text-base font-serif">+{importResult.createdCount}</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100">
                    <span className="text-zinc-500 block">Existing Products Updated</span>
                    <strong className="text-blue-700 text-base font-serif">{importResult.updatedCount}</strong>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-emerald-100 col-span-2 sm:col-span-1">
                    <span className="text-zinc-500 block">Duplicates Prevented</span>
                    <strong className="text-[#800020] text-base font-serif">{importResult.duplicatesPrevented}</strong>
                  </div>
                </div>

                {/* Metadata auto-sync report */}
                {(importResult.metaStats?.newCategories?.length > 0 ||
                  importResult.metaStats?.newBrands?.length > 0 ||
                  importResult.metaStats?.newCollections?.length > 0) && (
                  <div className="text-[11px] text-emerald-900 bg-emerald-100/60 p-2.5 rounded-lg space-y-1">
                    <strong className="block font-semibold">Auto-Synced Metadata Collections:</strong>
                    {importResult.metaStats.newCategories.length > 0 && (
                      <p>• New Categories: {importResult.metaStats.newCategories.join(', ')}</p>
                    )}
                    {importResult.metaStats.newBrands.length > 0 && (
                      <p>• New Brands: {importResult.metaStats.newBrands.join(', ')}</p>
                    )}
                    {importResult.metaStats.newCollections.length > 0 && (
                      <p>• New Collections: {importResult.metaStats.newCollections.join(', ')}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* File Upload Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#E9DCCB] hover:border-[#800020] bg-[#FCF9F4] hover:bg-[#FAF4EB] transition-all rounded-2xl p-8 text-center cursor-pointer space-y-2 group"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-[#800020]/10 text-[#800020] flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                <Upload size={20} />
              </div>
              <h3 className="font-semibold text-sm text-[#30231F]">
                {selectedFileName ? selectedFileName : 'Click to select or drag & drop CSV file'}
              </h3>
              <p className="text-xs text-[#75665D]">
                Supports any Excel-exported or Google Sheets CSV file (UTF-8)
              </p>
            </div>
          </div>
        )}

        {/* ── TAB 2: EXPORT ── */}
        {activeTab === 'export' && (
          <div className="space-y-5">
            <div className="bg-[#FCF9F4] border border-[#E9DCCB] rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#800020] flex items-center gap-1.5">
                <FileSpreadsheet size={15} /> Export Catalog Details
              </h4>
              <p className="text-xs text-[#75665D] leading-relaxed">
                Exporting your catalog generates a full, clean CSV file with all currently loaded products ({products.length} items).
              </p>
              <ul className="text-xs text-[#75665D] space-y-1.5 list-disc pl-4">
                <li>Each row contains the official <strong>Product ID</strong>.</li>
                <li>You can open this CSV directly in Microsoft Excel, Apple Numbers, or Google Sheets.</li>
                <li>Edit any prices, stock numbers, or descriptions.</li>
                <li>You can also append new product rows at the bottom (leave their <em>Product ID</em> blank).</li>
                <li>When re-imported, the system seamlessly updates existing rows without creating duplicates!</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={downloadSampleProductCSV}
                className="w-full sm:w-auto px-4 py-2.5 border border-[#E9DCCB] rounded-xl text-xs font-semibold text-[#75665D] hover:bg-zinc-50 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Download size={14} /> Download Sample Template
              </button>

              <button
                type="button"
                onClick={handleExportFullCatalog}
                className="w-full sm:w-auto px-6 py-2.5 bg-[#800020] hover:bg-[#650018] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#800020]/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={14} /> Export All Products ({products.length})
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-[#E9DCCB]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-[#30231F] text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCSVModal;

