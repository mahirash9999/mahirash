import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { db, auth } from "../../components/Firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  where,
  limit,
  onSnapshot
} from "firebase/firestore";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from "recharts";
import {
  X, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle,
  User, Calendar, DollarSign, ShoppingBag, Eye, Printer,
  Download, PlusCircle, Check, HelpCircle, FileText,
  Shirt, AlertCircle, Mail, Lock, ArrowRight, Image as ImageIcon,
  Upload, Sparkles
} from "lucide-react";

import { useSearchParams } from "react-router-dom";

// Import components
import AdminSidebar from "./components/AdminSidebar";
import AdminHeader from "./components/AdminHeader";
import MetricCards from "./components/MetricCards";
import ProductsTable from "./components/ProductsTable";
import OrdersTable from "./components/OrdersTable";
import UsersTable from "./components/UsersTable";
import ProductForm from "./components/ProductForm";
import AnalyticsView from "./components/AnalyticsView";
import ReportsView from "./components/ReportsView";
import InventoryView from "./components/InventoryView";
import ReturnsRefundsManager from "./components/ReturnsRefundsManager";
import CouponsManager from "./components/CouponsManager";
import SiteSettingsManager from "./components/SiteSettingsManager";

import BillingSystem from "./components/BillingSystem";
import AdminProfileSettings from "./components/AdminProfileSettings";
import HeroVideoManager from "./components/HeroVideoManager";
import AboutUsManager from "./components/AboutUsManager";
import CloudinaryMediaPickerModal from "../../components/CloudinaryMediaPickerModal";

import uploadToCloudinary from "../../utils/cloudinary";
import OptimizedCloudinaryImage from "../../components/OptimizedCloudinaryImage";
import { exportToCSV, csvToJSON } from "../../utils/exportUtils";
export { uploadToCloudinary };

// Default Seed Data for Firebase Firestore
// Default Seed Data for Firebase Firestore
const DEFAULT_SEED_DATA = {
  categories: [
    { id: 'cat_extrait', name: 'Extrait de Parfum', slug: 'extrait-de-parfum', description: 'Concentrated 25-30% Artisanal Extraits', is_active: true, sort_order: 1 },
    { id: 'cat_eau_parfum', name: 'Eau de Parfum', slug: 'eau-de-parfum', description: 'Rich 15-20% Everyday Luxury Perfumes', is_active: true, sort_order: 2 },
    { id: 'cat_oud', name: 'Oud Collection', slug: 'oud-collection', description: 'Royal Agarwood & Oriental Reserve', is_active: true, sort_order: 3 },
    { id: 'cat_woody', name: 'Woody & Amber', slug: 'woody-amber', description: 'Cedar, Sandalwood & Amber Formulations', is_active: true, sort_order: 4 },
    { id: 'cat_floral', name: 'Floral & Fresh', slug: 'floral-fresh', description: 'Rare Blooming Rose, Jasmine & Citrus', is_active: true, sort_order: 5 },
    { id: 'cat_gifts', name: 'Gift Sets', slug: 'gift-sets', description: 'Discovery Vaults & Luxury Gift Boxes', is_active: true, sort_order: 6 }
  ],
  subcategories: [
    { id: 'sub_signature_oud', name: 'Signature Oud', slug: 'signature-oud', parent_category: 'Oud Collection', is_active: true, sort_order: 1 },
    { id: 'sub_royal_extraits', name: 'Royal Extraits', slug: 'royal-extraits', parent_category: 'Extrait de Parfum', is_active: true, sort_order: 2 },
    { id: 'sub_amber_spice', name: 'Amber & Spice', slug: 'amber-spice', parent_category: 'Woody & Amber', is_active: true, sort_order: 3 },
    { id: 'sub_fresh_citrus', name: 'Zesty Citrus', slug: 'zesty-citrus', parent_category: 'Floral & Fresh', is_active: true, sort_order: 4 },
    { id: 'sub_discovery_vault', name: 'Discovery Set', slug: 'discovery-set', parent_category: 'Gift Sets', is_active: true, sort_order: 5 }
  ],
  collections: [
    { id: 'col_new', name: 'New Launches', slug: 'new-launches', description: 'Fresh drops for the new season', is_active: true, sort_order: 1 },
    { id: 'col_bestsellers', name: 'Bestselling Scents', slug: 'bestsellers', description: 'Most loved fragrances by connoisseurs', is_active: true, sort_order: 2 },
    { id: 'col_royal', name: 'The Royal Edition', slug: 'the-royal-edition', description: 'Limited handcrafted extraits', is_active: true, sort_order: 3 },
    { id: 'col_private', name: 'Private Reserve', slug: 'private-reserve', description: 'Exclusive rare botanical formulations', is_active: true, sort_order: 4 }
  ],
  brands: [
    { id: 'brand_mahirash', name: 'MAHIRASH', slug: 'mahirash', description: 'Haute Perfumerie Atelier', is_active: true, sort_order: 1 },
    { id: 'brand_roja', name: 'Roja Parfums', slug: 'roja-parfums', description: 'Haute Luxe Perfumery', is_active: true, sort_order: 2 },
    { id: 'brand_creed', name: 'House of Creed', slug: 'house-of-creed', description: 'Artisan Perfume Heritage', is_active: true, sort_order: 3 },
    { id: 'brand_maison', name: 'Maison Francis Kurkdjian', slug: 'maison-francis-kurkdjian', description: 'Parisian Niche Parfums', is_active: true, sort_order: 4 },
    { id: 'brand_tomford', name: 'Tom Ford Private Blend', slug: 'tom-ford-private-blend', description: 'Luxury Private Blends', is_active: true, sort_order: 5 }
  ],
  fragrance_concentrations: [
    { id: 'conc_1', name: 'Eau de Toilette (EDT)', slug: 'eau-de-toilette-edt', is_active: true, sort_order: 1 },
    { id: 'conc_2', name: 'Eau de Parfum (EDP)', slug: 'eau-de-parfum-edp', is_active: true, sort_order: 2 },
    { id: 'conc_3', name: 'Extrait de Parfum', slug: 'extrait-de-parfum', is_active: true, sort_order: 3 },
    { id: 'conc_4', name: 'Parfum', slug: 'parfum', is_active: true, sort_order: 4 },
    { id: 'conc_5', name: 'Eau de Cologne (EDC)', slug: 'eau-de-cologne-edc', is_active: true, sort_order: 5 }
  ],
  fragrance_families: [
    { id: 'fam_1', name: 'Aromatic', slug: 'aromatic', is_active: true, sort_order: 1 },
    { id: 'fam_2', name: 'Citrus', slug: 'citrus', is_active: true, sort_order: 2 },
    { id: 'fam_3', name: 'Floral', slug: 'floral', is_active: true, sort_order: 3 },
    { id: 'fam_4', name: 'Fougere', slug: 'fougere', is_active: true, sort_order: 4 },
    { id: 'fam_5', name: 'Fruity', slug: 'fruity', is_active: true, sort_order: 5 },
    { id: 'fam_6', name: 'Leather', slug: 'leather', is_active: true, sort_order: 6 },
    { id: 'fam_7', name: 'Woody', slug: 'woody', is_active: true, sort_order: 7 },
    { id: 'fam_8', name: 'Warm & Spicy', slug: 'warm-spicy', is_active: true, sort_order: 8 }
  ],
  attributes: [
    { id: 'attr_volume', name: 'Volume', values: '50ml, 100ml, 200ml, Sample Set', is_active: true, sort_order: 1 },
    { id: 'attr_concentration', name: 'Concentration', values: 'Extrait de Parfum (30%), Eau de Parfum (20%), Eau de Toilette (15%)', is_active: true, sort_order: 2 },
    { id: 'attr_profile', name: 'Fragrance Profile', values: 'Oud, Woody, Oriental Amber, Floral Essence, Zesty Citrus, Vanilla Gourmand', is_active: true, sort_order: 3 }
  ],
  shop_by_category: [
    { id: 'cat_sbc_1', name: 'EXTRAIT DE PARFUM', title: 'EXTRAIT DE PARFUM', slug: 'extrait-de-parfum', image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop', link: '/shop?category=Extrait+de+Parfum', sort_order: 1, is_active: true },
    { id: 'cat_sbc_2', name: 'EAU DE PARFUM', title: 'EAU DE PARFUM', slug: 'eau-de-parfum', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop', link: '/shop?category=Eau+de+Parfum', sort_order: 2, is_active: true },
    { id: 'cat_sbc_3', name: 'ROYAL OUD RESERVE', title: 'ROYAL OUD RESERVE', slug: 'royal-oud-reserve', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop', link: '/shop?category=Oud+Collection', sort_order: 3, is_active: true },
    { id: 'cat_sbc_4', name: 'AMBER & WOODS', title: 'AMBER & WOODS', slug: 'amber-and-woods', image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop', link: '/shop?category=Woody+%26+Amber', sort_order: 4, is_active: true }
  ],
  mobile_categories: [
    { id: 'm_cat_1', name: 'EXTRAIT DE PARFUM', title: 'EXTRAIT DE PARFUM', badge: 'POPULAR', image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=800&auto=format&fit=crop', link: '/shop?category=Extrait+de+Parfum', sort_order: 1, is_active: true },
    { id: 'm_cat_2', name: 'EAU DE PARFUM', title: 'EAU DE PARFUM', badge: '', image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=800&auto=format&fit=crop', link: '/shop?category=Eau+de+Parfum', sort_order: 2, is_active: true },
    { id: 'm_cat_3', name: 'ROYAL OUD', title: 'ROYAL OUD', badge: 'SIGNATURE', image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=800&auto=format&fit=crop', link: '/shop?category=Oud+Collection', sort_order: 3, is_active: true },
    { id: 'm_cat_4', name: 'WOODY & AMBER', title: 'WOODY & AMBER', badge: '', image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=80&w=800&auto=format&fit=crop', link: '/shop?category=Woody+%26+Amber', sort_order: 4, is_active: true },
    { id: 'm_cat_5', name: 'FLORAL ESSENCE', title: 'FLORAL ESSENCE', badge: '', image: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=80&w=800&auto=format&fit=crop', link: '/shop?category=Floral+%26+Fresh', sort_order: 5, is_active: true },
    { id: 'm_cat_6', name: 'DISCOVERY SETS', title: 'DISCOVERY SETS', badge: 'GIFT BOX', image: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=800&auto=format&fit=crop', link: '/shop?category=Gift+Sets', sort_order: 6, is_active: true }
  ],
  
};

// Generic CMS Manager helper
const GenericCRUDManager = ({ collectionName, title, fields, defaultItem }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(defaultItem);
  const [uploading, setUploading] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [activePickerField, setActivePickerField] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setSelectedIds([]);
    setCurrentPage(1);
  }, [collectionName]);

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
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
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected items?`)) return;
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await deleteDoc(doc(db, collectionName, id));
      }
      alert("Deleted successfully!");
      setSelectedIds([]);
      fetchItems();
    } catch (err) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    const statusField = fields.find(f => f.type === 'boolean');
    if (!statusField) return;
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await updateDoc(doc(db, collectionName, id), {
          [statusField.key]: newStatus
        });
      }
      alert(`Updated status to ${newStatus ? 'Active' : 'Inactive'} successfully!`);
      setSelectedIds([]);
      fetchItems();
    } catch (err) {
      alert("Error: " + err.message);
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, collectionName));
      const snap = await getDocs(q);
      if (snap.empty && DEFAULT_SEED_DATA[collectionName]) {
        const seedItems = DEFAULT_SEED_DATA[collectionName];
        for (const item of seedItems) {
          await setDoc(doc(db, collectionName, item.id), item);
        }
        setItems(seedItems);
      } else {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
        setItems(list);
      }
    } catch (err) {
      console.error("Error fetching or seeding collection:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [collectionName]);

  const handleInputChange = (fieldKey, value, isNumber = false) => {
    setFormData(prev => {
      const finalVal = isNumber ? (parseFloat(value) || 0) : value;
      const updated = { ...prev, [fieldKey]: finalVal };
      const hasSlug = fields.some(f => f.key === 'slug');
      if ((fieldKey === 'name' || fieldKey === 'title' || fieldKey === 'code') && hasSlug) {
        const generatedSlug = String(value)
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');
        updated.slug = generatedSlug;
      }
      if (collectionName === 'shop_by_scents' && fieldKey === 'name') {
        updated.link = `/shop?scent=${encodeURIComponent(value)}`;
      }
      return updated;
    });
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      alert("Deleted successfully!");
      fetchItems();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleCreateNew = () => {
    setEditingItem(null);
    setFormData(defaultItem);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (file, field) => {
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadToCloudinary(file);
      setFormData(prev => ({ ...prev, [field]: url }));
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const docData = { ...formData };
      if (editingItem) {
        await setDoc(doc(db, collectionName, editingItem.id), docData);
        alert("Updated successfully!");
      } else {
        const newId = doc(collection(db, collectionName)).id;
        await setDoc(doc(db, collectionName, newId), { ...docData, id: newId });
        alert("Created successfully!");
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const fileInputRef = useRef(null);

  const handleExport = () => {
    const keys = ["id", ...fields.map(f => f.key)];
    const headers = ["ID", ...fields.map(f => f.label)];
    exportToCSV(items, keys, headers, `mahirash_${collectionName}`);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const keys = ["id", ...fields.map(f => f.key)];
        const headers = ["ID", ...fields.map(f => f.label)];

        const rows = csvToJSON(text, keys, headers);
        if (!rows || rows.length === 0) {
          alert("No rows found or headers do not match!");
          return;
        }

        let importCount = 0;
        let updateCount = 0;

        for (const row of rows) {
          const docData = {};

          fields.forEach(field => {
            const rawVal = row[field.key];
            if (field.type === 'boolean') {
              docData[field.key] = rawVal === 'true' || rawVal === '1' || rawVal === 'Yes' || rawVal === 'ACTIVE' || rawVal === true;
            } else if (field.type === 'number') {
              docData[field.key] = parseFloat(rawVal) || 0;
            } else {
              docData[field.key] = rawVal || '';
            }
          });

          if (row.id) {
            await setDoc(doc(db, collectionName, row.id), docData, { merge: true });
            updateCount++;
          } else {
            const newId = doc(collection(db, collectionName)).id;
            await setDoc(doc(db, collectionName, newId), { ...docData, id: newId });
            importCount++;
          }
        }

        alert(`Import completed! ${importCount} new items created, ${updateCount} updated.`);
        fetchItems();
      } catch (err) {
        alert("Import failed: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-6 text-zinc-900 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 uppercase tracking-wider">{title}</h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Live records with Cloudinary image upload and media management</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".csv"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 text-[12px] font-semibold text-zinc-700 cursor-pointer transition-all shadow-xs"
          >
            <Upload size={13} /> Import
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 rounded-xl bg-white hover:bg-zinc-50 text-[12px] font-semibold text-zinc-700 cursor-pointer transition-all shadow-xs"
          >
            <Download size={13} /> Export
          </button>
          <button
            type="button"
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-zinc-800 transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Plus size={14} /> Add New
          </button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-zinc-50 border border-zinc-200 p-4 rounded-xl mb-4 gap-3">
          <div className="text-[13px] font-semibold text-zinc-700">
            {selectedIds.length} item(s) selected
          </div>
          <div className="flex items-center gap-2">
            {fields.some(f => f.type === 'boolean') && (
              <>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange(true)}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded text-[13px] font-semibold cursor-pointer transition-colors"
                >
                  Mark Active
                </button>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange(false)}
                  className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded text-[13px] font-semibold cursor-pointer transition-colors"
                >
                  Mark Inactive
                </button>
              </>
            )}
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
        <div className="py-8 text-center text-zinc-500 text-[14px]">Loading items...</div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <table className="w-full min-w-[620px] text-left text-[13px] border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500 uppercase tracking-widest text-[10px]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 accent-black cursor-pointer rounded border-zinc-300"
                  />
                </th>
                {fields.map(f => (
                  <th key={f.key} className="py-3 px-4">{f.label}</th>
                ))}
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(item => (
                <tr key={item.id} className={`border-b border-zinc-200 hover:bg-zinc-50/80 transition-colors ${selectedIds.includes(item.id) ? 'bg-zinc-50' : ''}`}>
                  <td className="py-3.5 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelectRow(item.id)}
                      className="w-4 h-4 accent-black cursor-pointer rounded border-zinc-300"
                    />
                  </td>
                  {fields.map(f => (
                    <td key={f.key} className="py-3.5 px-4 font-medium text-zinc-800">
                      {f.type === 'image' ? (
                        <OptimizedCloudinaryImage src={item[f.key]} preset="avatar" className="w-10 h-10 object-cover rounded bg-zinc-100 border border-zinc-200" alt="thumb" />
                      ) : f.type === 'boolean' ? (
                        <span className={`px-2 py-0.5 rounded text-[9px]   ${item[f.key] ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                          {item[f.key] ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      ) : (
                        item[f.key] || '-'
                      )}
                    </td>
                  ))}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded transition-colors"><Edit2 size={13} /></button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-zinc-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={fields.length + 2} className="py-8 text-center text-zinc-500">No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
          {items.length > itemsPerPage && (
            <div className="flex justify-between items-center px-4 py-4 border-t border-zinc-200">
              <span className="text-[13px] text-zinc-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, items.length)} of {items.length} items
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-zinc-300 rounded text-[13px] hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(items.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(items.length / itemsPerPage)}
                  className="px-3 py-1.5 border border-zinc-300 rounded text-[13px] hover:bg-zinc-100 disabled:opacity-50 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
          <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-zinc-900">{editingItem ? "Edit Item" : "Create Item"}</h3>
                <p className="text-[11px] text-zinc-400">Save your changes directly to the cloud</p>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-black p-1.5 rounded-full hover:bg-zinc-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 overflow-y-auto flex-1 pr-1.5 py-1">
              {fields.map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-[10px]   text-zinc-500 uppercase tracking-wider block">{f.label}</label>
                  {f.type === 'image' ? (
                    <div className="space-y-2">
                      {formData[f.key] && (
                        <OptimizedCloudinaryImage src={formData[f.key]} preset="category" className="w-20 h-20 object-cover rounded-lg border border-zinc-200 bg-zinc-50" alt="preview" />
                      )}
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-[11px] font-semibold text-zinc-900 cursor-pointer transition-all">
                          Upload from Device
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0], f.key)}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePickerField(f.key);
                            setIsPickerOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-[11px] font-semibold text-zinc-900 cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                        >
                          <ImageIcon size={13} className="text-[#b8860b]" /> Choose from Cloudinary
                        </button>
                      </div>
                      {uploading && (
                        <p className="text-[10px] text-[#b8860b]   animate-pulse">Uploading image...</p>
                      )}
                    </div>
                  ) : f.type === 'boolean' ? (
                    <select
                      value={formData[f.key] ? 'true' : 'false'}
                      onChange={(e) => setFormData(prev => ({ ...prev, [f.key]: e.target.value === 'true' }))}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 focus:bg-white focus:border-black outline-none transition-all"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : f.type === 'select' ? (
                    <select
                      value={formData[f.key] || ''}
                      onChange={(e) => handleInputChange(f.key, e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 focus:bg-white focus:border-black outline-none transition-all"
                    >
                      <option value="" disabled>Select an option</option>
                      {f.options?.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      value={formData[f.key] || ''}
                      onChange={(e) => handleInputChange(f.key, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 focus:bg-white focus:border-black outline-none transition-all"
                    />
                  ) : (
                    <input
                      type={f.type || 'text'}
                      value={formData[f.key] ?? ''}
                      onChange={(e) => handleInputChange(f.key, e.target.value, f.type === 'number')}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 focus:bg-white focus:border-black outline-none transition-all"
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3.5 mt-2 border-t border-zinc-200/80 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-zinc-300 text-zinc-700 text-[13px] font-semibold rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="px-5 py-2 bg-black text-white text-[13px] font-bold rounded-xl hover:bg-zinc-800 disabled:opacity-50 shadow-sm transition-all cursor-pointer active:scale-98"
              >
                {uploading ? "Uploading..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      <CloudinaryMediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={(url) => {
          if (activePickerField) {
            setFormData(prev => ({ ...prev, [activePickerField]: url }));
          }
        }}
        isMultiSelect={false}
      />
    </div>
  );
};

// Testimonials Manager
const CommunityManager = () => {
  const [subTab, setSubTab] = useState("settings");

  const [settings, setSettings] = useState({
    eyebrow: "",
    heading: "",
    description_line_1: "",
    description_line_2: "",
    is_active: true
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [images, setImages] = useState([]);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [savingImgId, setSavingImgId] = useState(null);
  const [uploadingImgId, setUploadingImgId] = useState(null);

  const [stats, setStats] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [savingStatId, setSavingStatId] = useState(null);

  const handleExportGallery = () => {
    const keys = ['id', 'image', 'link', 'sort_order', 'is_active'];
    const headers = ['Image ID', 'Image URL', 'Destination Link', 'Sort Order', 'Active Status'];
    exportToCSV(images, keys, headers, 'mahirash_community_gallery');
  };

  const handleExportStats = () => {
    const keys = ['id', 'icon', 'value', 'label', 'sort_order', 'is_active'];
    const headers = ['Stat ID', 'Icon', 'Primary Value', 'Label', 'Sort Order', 'Active Status'];
    exportToCSV(stats, keys, headers, 'mahirash_community_stats');
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const snap = await getDocs(collection(db, 'community_settings'));
      if (!snap.empty) {
        setSettings(snap.docs[0].data());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const fetchImages = async () => {
    setImagesLoading(true);
    try {
      const q = query(collection(db, 'community_images'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      setImages(list);
    } catch (err) {
      console.error("Error loading images:", err);
    } finally {
      setImagesLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const q = query(collection(db, 'community_stats'));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
      setStats(list);
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchImages();
    fetchStats();
  }, []);

  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      await setDoc(doc(db, 'community_settings', 'main'), settings);
      alert("Settings saved successfully!");
    } catch (err) {
      alert("Failed to save: " + err.message);
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleImageChange = (id, field, value) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, [field]: value } : img));
  };

  const handleImageUpload = async (id, file) => {
    if (!file) return;
    try {
      setUploadingImgId(id);
      const url = await uploadToCloudinary(file);
      handleImageChange(id, 'image', url);
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingImgId(null);
    }
  };

  const handleSaveImage = async (img) => {
    setSavingImgId(img.id);
    try {
      await setDoc(doc(db, 'community_images', img.id), {
        image: img.image || '',
        link: img.link || '',
        sort_order: parseInt(img.sort_order) || 0,
        is_active: img.is_active !== false
      });
      alert("Image saved!");
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSavingImgId(null);
    }
  };

  const handleDeleteImage = async (id) => {
    if (!confirm("Are you sure?")) return;
    try {
      await deleteDoc(doc(db, 'community_images', id));
      setImages(prev => prev.filter(img => img.id !== id));
      alert("Deleted!");
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const handleAddImage = () => {
    const newId = 'img_' + Date.now();
    const newImg = { id: newId, image: '', link: '', sort_order: images.length + 1, is_active: true };
    setImages(prev => [...prev, newImg]);
  };

  const handleStatChange = (id, field, value) => {
    setStats(prev => prev.map(st => st.id === id ? { ...st, [field]: value } : st));
  };

  const handleSaveStat = async (stat) => {
    setSavingStatId(stat.id);
    try {
      await setDoc(doc(db, 'community_stats', stat.id), {
        icon: stat.icon || 'Star',
        value: stat.value || '',
        label: stat.label || '',
        sort_order: parseInt(stat.sort_order) || 0,
        is_active: stat.is_active !== false
      });
      alert("Stat saved successfully!");
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSavingStatId(null);
    }
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-6 text-zinc-900 shadow-sm">
      <div className="flex border-b border-zinc-200 mb-6 text-[14px]">
        <button
          onClick={() => setSubTab("settings")}
          className={`px-4 py-2   border-b-2 transition-all ${subTab === "settings" ? "border-black text-zinc-900 font-extrabold" : "border-transparent text-zinc-500 hover:text-black"}`}
        >
          Section Settings
        </button>
        <button
          onClick={() => setSubTab("gallery")}
          className={`px-4 py-2   border-b-2 transition-all ${subTab === "gallery" ? "border-black text-zinc-900 font-extrabold" : "border-transparent text-zinc-500 hover:text-black"}`}
        >
          Gallery Images
        </button>
        <button
          onClick={() => setSubTab("stats")}
          className={`px-4 py-2   border-b-2 transition-all ${subTab === "stats" ? "border-black text-zinc-900 font-extrabold" : "border-transparent text-zinc-500 hover:text-black"}`}
        >
          Social Proof Stats
        </button>
      </div>

      {subTab === "settings" && !settingsLoading && (
        <div className="max-w-xl space-y-4 text-[14px]">
          <div className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              id="settings-active"
              checked={settings.is_active !== false}
              onChange={(e) => setSettings(prev => ({ ...prev, is_active: e.target.checked }))}
              className="rounded text-black focus:ring-black accent-black w-4 h-4 cursor-pointer"
            />
            <label htmlFor="settings-active" className="  text-zinc-800 cursor-pointer">Section Active</label>
          </div>
          <div className="space-y-1">
            <label className="text-[10px]   text-zinc-500 uppercase tracking-wider block">Eyebrow</label>
            <input
              type="text"
              value={settings.eyebrow}
              onChange={(e) => setSettings(prev => ({ ...prev, eyebrow: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded text-zinc-900 focus:bg-white focus:border-black outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px]   text-zinc-500 uppercase tracking-wider block">Heading</label>
            <input
              type="text"
              value={settings.heading}
              onChange={(e) => setSettings(prev => ({ ...prev, heading: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded text-zinc-900 focus:bg-white focus:border-black outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px]   text-zinc-500 uppercase tracking-wider block">Description Line 1</label>
            <input
              type="text"
              value={settings.description_line_1}
              onChange={(e) => setSettings(prev => ({ ...prev, description_line_1: e.target.value }))}
              className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded text-zinc-900 focus:bg-white focus:border-black outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px]   text-zinc-500 uppercase tracking-wider block">Description Line 2</label>
            <input
              type="text"
              value={settings.description_line_2}
              onChange={(e) => setSettings(prev => ({ ...prev, description_line_2: e.target.value }))}
              className="w-full px-3 py-2 bg-[#161616] border border-[#222] rounded text-white"
            />
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={settingsSaving}
            className="px-6 py-2.5 bg-[#c9a962] text-[#090909] hover:bg-white hover:text-black rounded text-[14px]   transition-all"
          >
            {settingsSaving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      )}

      {subTab === "gallery" && !imagesLoading && (
        <div className="space-y-6 text-[14px]">
          <div className="flex justify-between items-center sm:flex-row flex-col gap-3 bg-zinc-50 p-4 border border-zinc-200 rounded-xl">
            <button
              onClick={handleExportGallery}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 rounded bg-white hover:bg-zinc-100 text-[13px] font-semibold text-zinc-700 cursor-pointer transition-all shadow-sm"
            >
              <Download size={14} /> Export Gallery Images
            </button>
            <button onClick={handleAddImage} className="px-4 py-2 bg-[#c9a962] text-[#090909] hover:bg-white hover:text-black rounded transition-all">Add New Image</button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {images.map((img, idx) => (
              <div key={img.id} className="border border-[#1a1a1a] rounded-xl p-5 bg-[#161616] space-y-4">
                <div className="flex items-center justify-between border-b border-[#222] pb-3">
                  <span className="  text-zinc-300">Image #{idx + 1}</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        id={`img-active-${img.id}`}
                        checked={img.is_active !== false}
                        onChange={(e) => handleImageChange(img.id, 'is_active', e.target.checked)}
                        className="rounded text-[#c9a962] focus:ring-[#c9a962] w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor={`img-active-${img.id}`} className="  text-zinc-400 cursor-pointer">Active</label>
                    </div>
                    <button onClick={() => handleDeleteImage(img.id)} className="text-red-400 hover:text-red-300  ">Delete</button>
                  </div>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-[#0f0f0f] border border-[#222] rounded overflow-hidden flex items-center justify-center shrink-0">
                    {img.image ? <OptimizedCloudinaryImage src={img.image} preset="category" className="w-full h-full object-cover" alt="look" /> : <span className="text-[9px] text-zinc-600">No Image</span>}
                  </div>
                  <div className="flex-1">
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(img.id, e.target.files[0])} className="hidden" id={`gallery-file-${img.id}`} />
                    <label htmlFor={`gallery-file-${img.id}`} className="inline-block px-3 py-1.5 border border-zinc-700 rounded   text-zinc-300 bg-[#0f0f0f] hover:bg-zinc-800 cursor-pointer">
                      {uploadingImgId === img.id ? "Uploading..." : "Change Image"}
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px]   text-zinc-400 uppercase tracking-wider block">Destination Link</label>
                  <input type="text" value={img.link || ''} onChange={(e) => handleImageChange(img.id, 'link', e.target.value)} className="w-full px-3 py-2 bg-[#090909] border border-[#222] rounded text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px]   text-zinc-400 uppercase tracking-wider block">Sort Order</label>
                  <input type="number" value={img.sort_order} onChange={(e) => handleImageChange(img.id, 'sort_order', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-[#090909] border border-[#222] rounded text-white" />
                </div>

                <button onClick={() => handleSaveImage(img)} disabled={savingImgId === img.id || uploadingImgId === img.id} className="w-full py-2 bg-[#c9a962] text-[#090909] hover:bg-white hover:text-black   rounded">
                  {savingImgId === img.id ? "Saving..." : "Save"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === "stats" && !statsLoading && (
        <div className="space-y-6 text-[14px]">
          <div className="flex justify-between items-center bg-zinc-50 p-4 border border-zinc-200 rounded-xl">
            <button
              onClick={handleExportStats}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-zinc-300 rounded bg-white hover:bg-zinc-100 text-[13px] font-semibold text-zinc-700 cursor-pointer transition-all shadow-sm"
            >
              <Download size={14} /> Export Stats
            </button>
            <span className="text-[13px] text-zinc-500 font-medium">{stats.length} Stats</span>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {stats.map((stat, idx) => (
              <div key={stat.id} className="border border-[#1a1a1a] rounded-xl p-5 bg-[#161616] space-y-4">
                <div className="flex items-center justify-between border-b border-[#222] pb-3">
                  <span className="  text-zinc-300">Stat #{idx + 1}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`stat-active-${stat.id}`}
                      checked={stat.is_active !== false}
                      onChange={(e) => handleStatChange(stat.id, 'is_active', e.target.checked)}
                      className="rounded text-[#c9a962] focus:ring-[#c9a962] w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor={`stat-active-${stat.id}`} className="  text-zinc-400 cursor-pointer">Active</label>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px]   text-zinc-400 uppercase tracking-wider block">Icon</label>
                  <select value={stat.icon} onChange={(e) => handleStatChange(stat.id, 'icon', e.target.value)} className="w-full px-3 py-2 bg-[#090909] border border-[#222] rounded text-white">
                    <option value="Star">Star (Rating)</option>
                    <option value="Award">Award (Badge)</option>
                    <option value="MessageSquare">Message (Reviews)</option>
                    <option value="RefreshCw">Refresh (Retention)</option>
                    <option value="Heart">Heart (Likes)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px]   text-zinc-400 uppercase tracking-wider block">Primary Value</label>
                  <input type="text" value={stat.value} onChange={(e) => handleStatChange(stat.id, 'value', e.target.value)} className="w-full px-3 py-2 bg-[#090909] border border-[#222] rounded text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px]   text-zinc-400 uppercase tracking-wider block">Label</label>
                  <input type="text" value={stat.label} onChange={(e) => handleStatChange(stat.id, 'label', e.target.value)} className="w-full px-3 py-2 bg-[#090909] border border-[#222] rounded text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px]   text-zinc-400 uppercase tracking-wider block">Sort Order</label>
                  <input type="number" value={stat.sort_order} onChange={(e) => handleStatChange(stat.id, 'sort_order', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-[#090909] border border-[#222] rounded text-white" />
                </div>

                <button onClick={() => handleSaveStat(stat)} disabled={savingStatId === stat.id} className="w-full py-2 bg-[#c9a962] text-[#090909] hover:bg-white hover:text-black   rounded">
                  {savingStatId === stat.id ? "Saving..." : "Save"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const CMSManager = ({ collectionName, title }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, collectionName), orderBy('sort_order', 'asc'));
      const snap = await getDocs(q);
      setItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Error loading CMS items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [collectionName]);

  const handleChange = (id, field, value) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleImageUpload = async (id, file) => {
    if (!file) return;
    try {
      setUploadingId(id);
      const url = await uploadToCloudinary(file);
      handleChange(id, 'image', url);
    } catch (err) {
      alert("Image upload failed: " + err.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleSave = async (item) => {
    try {
      setSavingId(item.id);
      if (!item.title) {
        alert("Title is required");
        return;
      }
      const docRef = doc(db, collectionName, item.id);
      await setDoc(docRef, {
        title: item.title,
        image: item.image || '',
        link: item.link || '',
        sort_order: parseInt(item.sort_order) || 0,
        is_active: item.is_active !== undefined ? item.is_active : true
      });
      alert(`${item.title} saved successfully!`);
    } catch (err) {
      alert("Error saving: " + err.message);
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500 text-[14px]">Loading CMS data...</div>;
  }

  return (
    <div className="bg-[#121212] border border-[#1a1a1a] rounded-xl p-6 text-white text-[14px]">
      <h2 className="text-base   text-white mb-6 uppercase tracking-wider">{title}</h2>
      <div className="grid gap-8 md:grid-cols-2">
        {items.map((item, index) => (
          <div key={item.id} className="border border-[#1a1a1a] rounded-xl p-5 bg-[#161616] space-y-4">
            <div className="flex items-center justify-between border-b border-[#222] pb-3">
              <span className="  text-zinc-300">Panel 0{index + 1} ({item.id})</span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`active-${item.id}`}
                  checked={item.is_active !== false}
                  onChange={(e) => handleChange(item.id, 'is_active', e.target.checked)}
                  className="rounded text-[#c9a962] focus:ring-[#c9a962] w-4 h-4 cursor-pointer"
                />
                <label htmlFor={`active-${item.id}`} className="  text-zinc-400 cursor-pointer">Active</label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px]   text-zinc-400 uppercase tracking-wider block">Image</label>
              <div className="flex gap-4 items-center">
                <div className="w-24 h-24 bg-[#090909] border border-[#222] rounded overflow-hidden flex items-center justify-center">
                  {item.image ? <OptimizedCloudinaryImage src={item.image} preset="category" alt={item.title} className="w-full h-full object-cover" /> : <span className="text-[10px] text-zinc-600">No Image</span>}
                </div>
                <div className="flex-1 space-y-2">
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(item.id, e.target.files[0])} className="hidden" id={`file-input-${item.id}`} />
                  <label htmlFor={`file-input-${item.id}`} className="inline-block px-3 py-1.5 border border-zinc-700 rounded   text-zinc-300 bg-[#090909] hover:bg-zinc-800 cursor-pointer">
                    {uploadingId === item.id ? "Uploading..." : "Change Image"}
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px]   text-zinc-400 uppercase tracking-wider block">Title</label>
              <input type="text" value={item.title} onChange={(e) => handleChange(item.id, 'title', e.target.value)} className="w-full px-3 py-2 bg-[#090909] border border-[#222] rounded text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px]   text-zinc-400 uppercase tracking-wider block">Destination Link</label>
              <input type="text" value={item.link} onChange={(e) => handleChange(item.id, 'link', e.target.value)} className="w-full px-3 py-2 bg-[#090909] border border-[#222] rounded text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px]   text-zinc-400 uppercase tracking-wider block">Sort Order</label>
              <input type="number" value={item.sort_order} onChange={(e) => handleChange(item.id, 'sort_order', parseInt(e.target.value) || 0)} className="w-full px-3 py-2 bg-[#090909] border border-[#222] rounded text-white" />
            </div>

            <button onClick={() => handleSave(item)} disabled={savingId === item.id || uploadingId === item.id} className="w-full py-2 bg-[#c9a962] text-[#090909] hover:bg-white hover:text-black   rounded">
              {savingId === item.id ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Activity Log Viewer
const ActivityLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'activity_logs'), orderBy('timestamp', 'desc'), limit(15)));
        setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        // Fallback mock logs
        setLogs([
          { id: '1', admin: 'superadmin@pasoja.com', action: 'Product Created', entity: 'Black Oversized Tee', timestamp: { toDate: () => new Date() } },
          { id: '2', admin: 'superadmin@pasoja.com', action: 'Stock Adjusted', entity: 'White Graphic Tee (+5)', timestamp: { toDate: () => new Date() } }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="bg-[#121212] border border-[#1a1a1a] rounded-xl p-6 text-white text-[14px]">
      <h2 className="text-base   text-white mb-6 uppercase tracking-wider">System Activity Logs</h2>
      {loading ? <div className="text-zinc-500">Loading...</div> : (
        <div className="space-y-3.5">
          {logs.map(log => (
            <div key={log.id} className="p-3 bg-[#161616] border border-[#222] rounded flex justify-between items-center">
              <div>
                <p className="  text-[#c9a962]">{log.action}</p>
                <p className="text-zinc-400 text-[10px] mt-0.5">Admin: {log.admin} | target: {log.entity}</p>
              </div>
              <span className="text-[10px] text-zinc-500">
                {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : new Date().toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    localStorage.getItem("adminToken") === "PASOJA_SUPER_ADMIN" ||
    sessionStorage.getItem("adminToken") === "PASOJA_SUPER_ADMIN"
  );
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setIsSubmitting(true);
    try {
      // Allow fallback default credentials
      if ((adminEmail === "mahirsh9999@gmail.com" || adminEmail === "admin@mahirash.com") && (adminPassword === "Super@321.Admin" || adminPassword === "Mahirash@2026")) {
        try {
          await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        } catch (err) {
          try {
            await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
          } catch (regErr) {
            console.warn("Default admin auto-reg notice:", regErr);
          }
        }
        sessionStorage.setItem("adminToken", "PASOJA_SUPER_ADMIN");
        localStorage.setItem("adminToken", "PASOJA_SUPER_ADMIN");
        setIsAdminLoggedIn(true);
        setLoginError("");
        return;
      }

      // Standard Firebase Auth Login for registered admin accounts
      await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      sessionStorage.setItem("adminToken", "PASOJA_SUPER_ADMIN");
      localStorage.setItem("adminToken", "PASOJA_SUPER_ADMIN");
      setIsAdminLoggedIn(true);
      setLoginError("");
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        setLoginError("Invalid Admin ID or Password. Please ensure you are using authorized credentials.");
      } else {
        setLoginError("Login Failed: " + err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        sessionStorage.setItem("adminToken", "PASOJA_SUPER_ADMIN");
        localStorage.setItem("adminToken", "PASOJA_SUPER_ADMIN");
        setIsAdminLoggedIn(true);
      } else {
        sessionStorage.removeItem("adminToken");
        localStorage.removeItem("adminToken");
        setIsAdminLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const tabFromUrl = searchParams.get("tab") || "Overview";
  const [activeItem, setActiveItemState] = useState(tabFromUrl);

  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab && currentTab !== activeItem) {
      setActiveItemState(currentTab);
    } else if (!currentTab && activeItem !== "Overview") {
      setActiveItemState("Overview");
    }
  }, [searchParams]);

  const setActiveItem = (newItem) => {
    setActiveItemState(newItem);
    setSearchParams({ tab: newItem });
  };
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbFragranceFamilies, setDbFragranceFamilies] = useState([]);

  const [productsLoading, setProductsLoading] = useState(true);
  const [statsSummary, setStatsSummary] = useState({
    revenue: 0,
    orders: 0,
    customers: 0,
    products: 0,
    revChange: 0,
    ordersChange: 0,
    custChange: 0
  });

  const loadData = async () => {
    setLoading(true);
    setProductsLoading(true);

    // 1. Fetch Products IMMEDIATELY without waiting for users/orders
    const fetchProductsPromise = (async () => {
      try {
        const prodSnap = await getDocs(collection(db, "products"));
        const prodList = prodSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        prodList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
          return timeB - timeA;
        });
        setProducts(prodList);
        setProductsLoading(false);
        return prodList;
      } catch (prodErr) {
        console.error("Error loading products:", prodErr);
        setProductsLoading(false);
        return [];
      }
    })();

    // 2. Fetch Fragrance Families in parallel
    const fetchFamiliesPromise = (async () => {
      try {
        const famSnap = await getDocs(collection(db, "fragrance_families"));
        if (!famSnap.empty) {
          setDbFragranceFamilies(famSnap.docs.map(doc => doc.data().name).filter(Boolean));
        } else {
          setDbFragranceFamilies(["Aromatic", "Citrus", "Floral", "Fougere", "Fruity", "Leather", "Woody", "Warm & Spicy"]);
        }
      } catch (famErr) {
        setDbFragranceFamilies(["Aromatic", "Citrus", "Floral", "Fougere", "Fruity", "Leather", "Woody", "Warm & Spicy"]);
      }
    })();

    // 3. Fetch Users in parallel
    const fetchUsersPromise = (async () => {
      try {
        const userSnap = await getDocs(query(collection(db, "users")));
        const userList = userSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUsers(userList);
        return userList;
      } catch (userErr) {
        console.warn("Notice loading users:", userErr);
        return [];
      }
    })();

    // 4. Fetch Orders in parallel
    const fetchOrdersPromise = (async () => {
      try {
        const orderSnap = await getDocs(collection(db, "orders"));
        const orderList = orderSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        orderList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
          const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
          return timeB - timeA;
        });
        setOrders(orderList);
        return orderList;
      } catch (orderErr) {
        console.warn("Notice loading orders:", orderErr);
        return [];
      }
    })();

    try {
      const [prodList, , userList, orderList] = await Promise.all([
        fetchProductsPromise,
        fetchFamiliesPromise,
        fetchUsersPromise,
        fetchOrdersPromise
      ]);

      // Aggregate revenue & calculate changes for metrics cards
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let currentRev = 0, lastRev = 0;
      let currentOrders = 0, lastOrders = 0;

      orderList.forEach(o => {
        const amt = parseFloat(o.total || o.grandTotal || 0);
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt ? new Date(o.createdAt) : null);
        if (oDate) {
          if (oDate.getMonth() === currentMonth && oDate.getFullYear() === currentYear) {
            currentRev += amt;
            currentOrders++;
          } else if (oDate.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1) && oDate.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear)) {
            lastRev += amt;
            lastOrders++;
          }
        }
      });

      let currentCust = 0, lastCust = 0;
      userList.forEach(u => {
        const uDate = u.createdAt?.toDate ? u.createdAt.toDate() : (u.createdAt ? new Date(u.createdAt) : null);
        if (uDate) {
          if (uDate.getMonth() === currentMonth && uDate.getFullYear() === currentYear) {
            currentCust++;
          } else if (uDate.getMonth() === (currentMonth === 0 ? 11 : currentMonth - 1) && uDate.getFullYear() === (currentMonth === 0 ? currentYear - 1 : currentYear)) {
            lastCust++;
          }
        }
      });

      const totalRev = orderList.reduce((acc, curr) => acc + (parseFloat(curr.total || curr.grandTotal || 0)), 0);

      const revChange = lastRev > 0 ? ((currentRev - lastRev) / lastRev) * 100 : (currentRev > 0 ? 100 : 0);
      const ordersChange = lastOrders > 0 ? ((currentOrders - lastOrders) / lastOrders) * 100 : (currentOrders > 0 ? 100 : 0);
      const custChange = lastCust > 0 ? ((currentCust - lastCust) / lastCust) * 100 : (currentCust > 0 ? 100 : 0);

      setStatsSummary({
        revenue: totalRev,
        orders: orderList.length,
        customers: userList.length,
        products: prodList.length,
        revChange,
        ordersChange,
        custChange
      });
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
    } finally {
      setLoading(false);
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Real-time products listener so stock deductions from checkout reflect instantly in Admin
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      const prodList = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      prodList.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0));
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0));
        return timeB - timeA;
      });
      setProducts(prodList);
      setProductsLoading(false);
      setStatsSummary(prev => ({ ...prev, products: prodList.length }));
    }, (err) => {
      console.warn("Realtime products listener notice:", err);
    });

    return () => unsubProducts();
  }, []);

  const handleDeleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setIsEditModalOpen(true);
  };

  const handleAddProductSubmit = async (docData) => {
    const newDoc = {
      ...docData,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "products"), newDoc);
    setIsProductModalOpen(false);
    await loadData();
    // Log Activity
    await addDoc(collection(db, "activity_logs"), {
      admin: "superadmin@pasoja.com",
      action: "Product Created",
      entity: docData.name,
      timestamp: serverTimestamp()
    });
  };

  const handleEditProductSubmit = async (docData) => {
    if (!editingProduct?.id) return;
    await updateDoc(doc(db, "products", editingProduct.id), docData);
    setIsEditModalOpen(false);
    setEditingProduct(null);
    await loadData();
    // Log Activity
    await addDoc(collection(db, "activity_logs"), {
      admin: "superadmin@pasoja.com",
      action: "Product Updated",
      entity: docData.name,
      timestamp: serverTimestamp()
    });
  };

  // Filtered lists
  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(searchVal.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchVal.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    o.id?.toLowerCase().includes(searchVal.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchVal.toLowerCase())
  );

  const renderDashboardCharts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return {
        name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Revenue: 0,
        Orders: 0,
        dateObj: d.getTime()
      };
    });

    orders.forEach(o => {
      let d = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt ? new Date(o.createdAt) : null);
      if (d) {
        let orderDate = new Date(d);
        orderDate.setHours(0, 0, 0, 0);
        let match = last7Days.find(day => day.dateObj === orderDate.getTime());
        if (match) {
          match.Revenue += (parseFloat(o.total || o.grandTotal || 0));
          match.Orders += 1;
        }
      }
    });

    const chartData = last7Days;

    return (
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        {/* Revenue Chart */}
        <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm">
          <h3 className="text-[14px]   uppercase tracking-wider text-zinc-500 mb-4">Revenue Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b8860b" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#b8860b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} />
                <YAxis stroke="#a1a1aa" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", color: "#111111", borderRadius: 8, fontSize: 11, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
                <Area type="monotone" dataKey="Revenue" stroke="#b8860b" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Chart */}
        <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm">
          <h3 className="text-[14px]   uppercase tracking-wider text-zinc-500 mb-4">Orders Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={10} />
                <YAxis stroke="#a1a1aa" fontSize={10} />
                <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e4e4e7", color: "#111111", borderRadius: 8, fontSize: 11, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="Orders" fill="#111111" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  const renderOverview = () => {
    return (
      <div className="space-y-6">
        {/* KPI Row */}
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-4">
          <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm">
            <p className="text-[10px]   text-zinc-500 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-xl   text-zinc-900 mt-1">₹{statsSummary.revenue.toLocaleString('en-IN')}</h3>
            <span className={`text-[10px] block mt-1 ${statsSummary.revChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {statsSummary.revChange >= 0 ? '+' : ''}{statsSummary.revChange.toFixed(1)}% vs last month
            </span>
          </div>
          <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm">
            <p className="text-[10px]   text-zinc-500 uppercase tracking-wider">Total Orders</p>
            <h3 className="text-xl   text-zinc-900 mt-1">{statsSummary.orders}</h3>
            <span className={`text-[10px] block mt-1 ${statsSummary.ordersChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {statsSummary.ordersChange >= 0 ? '+' : ''}{statsSummary.ordersChange.toFixed(1)}% vs last month
            </span>
          </div>
          <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm">
            <p className="text-[10px]   text-zinc-500 uppercase tracking-wider">Total Customers</p>
            <h3 className="text-xl   text-zinc-900 mt-1">{statsSummary.customers}</h3>
            <span className={`text-[10px] block mt-1 ${statsSummary.custChange >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {statsSummary.custChange >= 0 ? '+' : ''}{statsSummary.custChange.toFixed(1)}% vs last month
            </span>
          </div>
          <div className="bg-white border border-zinc-200 p-5 rounded-xl shadow-sm">
            <p className="text-[10px]   text-zinc-500 uppercase tracking-wider">Total Products</p>
            <h3 className="text-xl   text-zinc-900 mt-1">{statsSummary.products}</h3>
            <span className="text-[10px] text-zinc-500 block mt-1">Live catalog items</span>
          </div>
        </div>

        {renderDashboardCharts()}

        {/* Dynamic widgets */}
        <div className="grid gap-6 md:grid-cols-3 mt-8">
          {/* Low Stock Alerts */}
          <div className="bg-white border border-zinc-200 p-5 rounded-xl text-[14px] space-y-4 shadow-sm">
            <h4 className="  text-zinc-500 uppercase tracking-wider">Low Stock Alerts</h4>
            <div className="space-y-3">
              {products.filter(p => (parseInt(p.stock) || 0) <= 5).slice(0, 3).map(p => (
                <div key={p.id} className="flex justify-between items-center border-b border-zinc-100 pb-2">
                  <div>
                    <p className="font-semibold text-zinc-900">{p.name}</p>
                    <p className="text-[10px] text-zinc-500">Category: {p.category}</p>
                  </div>
                  <span className="text-red-600  ">Stock: {p.stock || 0}</span>
                </div>
              ))}
              {products.filter(p => (parseInt(p.stock) || 0) <= 5).length === 0 && (
                <p className="text-zinc-500 text-center">No products are low in stock.</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white border border-zinc-200 p-5 rounded-xl text-[14px] space-y-4 shadow-sm">
            <h4 className="  text-zinc-500 uppercase tracking-wider">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setActiveItem("Products"); setIsProductModalOpen(true); }} className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-100 hover:text-black rounded-lg text-center cursor-pointer transition-all">Add Product</button>
              <button onClick={() => setActiveItem("Collections")} className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-100 hover:text-black rounded-lg text-center cursor-pointer transition-all">Add Collection</button>
              <button onClick={() => setActiveItem("Categories")} className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-100 hover:text-black rounded-lg text-center cursor-pointer transition-all">Categories</button>
              <button onClick={() => setActiveItem("Coupons / Offers")} className="p-3 bg-zinc-50 border border-zinc-200 text-zinc-700 font-semibold hover:bg-zinc-100 hover:text-black rounded-lg text-center cursor-pointer transition-all">Add Coupon</button>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white border border-zinc-200 p-5 rounded-xl text-[14px] space-y-4 shadow-sm">
            <h4 className="  text-zinc-500 uppercase tracking-wider">Recent Orders</h4>
            <div className="space-y-3">
              {orders.slice(0, 3).map(o => (
                <div key={o.id} className="flex justify-between items-center border-b border-zinc-100 pb-2">
                  <div>
                    <p className="font-semibold text-zinc-900">#{o.id?.slice(0, 8)}</p>
                    <p className="text-[10px] text-zinc-500">{o.customerName || 'Guest User'}</p>
                  </div>
                  <span className="text-[#b8860b]  ">₹{(o.total || o.grandTotal || 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
              {orders.length === 0 && <p className="text-zinc-500 text-center">No orders placed yet.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMainContent = () => {
    switch (activeItem) {
      case "Analytics":
        return <AnalyticsView />;
      case "Reports":
        return <ReportsView />;
      case "Inventory":
        return <InventoryView />;
      case "Returns / Refunds":
        return <ReturnsRefundsManager />;
      case "Billing & Invoices":
        return <BillingSystem />;
      case "Profile Settings":
        return <AdminProfileSettings />;
      case "Products":
        return (
          <>
            <ProductsTable
              products={filteredProducts}
              loading={productsLoading}
              onEdit={handleEditClick}
              onDelete={handleDeleteProduct}
              onImportSuccess={loadData}
            />
          </>
        );
      case "Orders":
        return (
          <>
            <OrdersTable onRefresh={loadData} />
          </>
        );
      case "Users":
      case "Customers":
        return (
          <>
            <UsersTable users={users} onRefresh={loadData} />
          </>
        );
      case "Categories":
        return (
          <GenericCRUDManager
            collectionName="categories"
            title="Category Management"
            fields={[
              { key: 'name', label: 'Name' },
              { key: 'slug', label: 'Slug' },
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ name: '', slug: '', description: '', is_active: true, sort_order: 1 }}
          />
        );
      case "Subcategories":
        return (
          <GenericCRUDManager
            collectionName="subcategories"
            title="Subcategory Management"
            fields={[
              { key: 'name', label: 'Name' },
              { key: 'slug', label: 'Slug' },
              { key: 'parent_category', label: 'Parent Category' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ name: '', slug: '', parent_category: '', is_active: true, sort_order: 1 }}
          />
        );
      case "Brands":
        return (
          <GenericCRUDManager
            collectionName="brands"
            title="Brand Management"
            fields={[
              { key: 'name', label: 'Brand Name' },
              { key: 'slug', label: 'Slug' },
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'logo', label: 'Brand Logo / Banner', type: 'image' },
              { key: 'sort_order', label: 'Sort Order', type: 'number' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ name: '', slug: '', description: '', logo: '', sort_order: 1, is_active: true }}
          />
        );
      case "Collections":
        return (
          <GenericCRUDManager
            collectionName="collections"
            title="Collection Management"
            fields={[
              { key: 'name', label: 'Name' },
              { key: 'slug', label: 'Slug' },
              { key: 'description', label: 'Description', type: 'textarea' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ name: '', slug: '', description: '', is_active: true, sort_order: 1 }}
          />
        );
      case "Fragrance Families":
        return (
          <GenericCRUDManager
            collectionName="fragrance_families"
            title="Fragrance Families Management"
            fields={[
              { key: 'name', label: 'Family Name' },
              { key: 'slug', label: 'Slug' },
              { key: 'sort_order', label: 'Sort Order', type: 'number' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ name: '', slug: '', sort_order: 1, is_active: true }}
          />
        );
      case "Fragrance Concentration":
        return (
          <GenericCRUDManager
            collectionName="fragrance_concentrations"
            title="Fragrance Concentration Management"
            fields={[
              { key: 'name', label: 'Concentration (e.g. Eau de Parfum)' },
              { key: 'slug', label: 'Slug' },
              { key: 'sort_order', label: 'Sort Order', type: 'number' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ name: '', slug: '', sort_order: 1, is_active: true }}
          />
        );
      case "Availability":
        return (
          <GenericCRUDManager
            collectionName="availabilities"
            title="Availability Management"
            fields={[
              { key: 'name', label: 'Availability Status (e.g. In Stock, Pre-Order, Limited Edition)' },
              { key: 'slug', label: 'Slug' },
              { key: 'sort_order', label: 'Sort Order', type: 'number' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ name: '', slug: '', sort_order: 1, is_active: true }}
          />
        );
      case "Attributes":
        return (
          <GenericCRUDManager
            collectionName="attributes"
            title="Catalog Attributes"
            fields={[
              { key: 'name', label: 'Attribute Name' },
              { key: 'values', label: 'Allowed Values (Comma-separated)' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ name: '', values: '', is_active: true, sort_order: 1 }}
          />
        );
      case "Store Settings":
        return <SiteSettingsManager />;
      case "Coupons / Offers":
        return <CouponsManager />;
      case "Blogs":
        return (
          <GenericCRUDManager
            collectionName="blogs"
            title="Brand Editorial Blogs"
            fields={[
              { key: 'image', label: 'Featured Image', type: 'image' },
              { key: 'title', label: 'Blog Title' },
              { key: 'slug', label: 'Slug' },
              { key: 'excerpt', label: 'Excerpt', type: 'textarea' },
              { key: 'content', label: 'Blog Content (HTML)', type: 'textarea' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ image: '', title: '', slug: '', excerpt: '', content: '', is_active: true }}
          />
        );
      case "About Us":
        return <AboutUsManager />;
      case "Mobile Category":
        return (
          <GenericCRUDManager
            collectionName="mobile_categories"
            title="Mobile Categories (Featured Grid)"
            fields={[
              { key: 'image', label: 'Category Card Image', type: 'image' },
              { key: 'name', label: 'Category Name / Title' },
              { key: 'badge', label: 'Badge / Tag (e.g. 3XL TO 6XL)' },
              { key: 'link', label: 'Destination Route / Link' },
              { key: 'sort_order', label: 'Sort Order', type: 'number' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ image: '', name: 'SHIRTS', badge: '', link: '/shop?category=Shirts', sort_order: 1, is_active: true }}
          />
        );
      case "Pages":
        return (
          <GenericCRUDManager
            collectionName="pages"
            title="Static Brand Pages"
            fields={[
              { key: 'title', label: 'Page Title' },
              { key: 'slug', label: 'Slug' },
              { key: 'content', label: 'Content', type: 'textarea' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ title: '', slug: '', content: '', is_active: true }}
          />
        );
      case "Shop By Scents":
      case "Shop By Category":
        return (
          <GenericCRUDManager
            collectionName="shop_by_scents"
            title="Shop By Scents CMS (Homepage 4-Card Row)"
            fields={[
              { key: 'image', label: 'Scent Card Image', type: 'image' },
              {
                key: 'name',
                label: 'Scent Name (Fragrance Family)',
                type: 'select',
                options: dbFragranceFamilies.map(f => ({ value: f, label: f.toUpperCase() }))
              },
              { key: 'description', label: 'Scent Notes / Subtitle (e.g. Sandalwood, Cedarwood & Amber)' },
              { key: 'badge', label: 'Badge (Optional, e.g. WARM & RICH)' },
              { key: 'link', label: 'Filter Link (e.g. /shop?scent=Woody)' },
              { key: 'sort_order', label: 'Sort Order', type: 'number' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ image: '', name: 'WOODY', description: 'Cedarwood, Sandalwood & Amber', badge: 'WARM & RICH', link: '/shop?scent=Woody', sort_order: 1, is_active: true }}
          />
        );
      case "Home Page Collection":
      case "home page Collection":
      case "Gender Banners":
      case "Shop The Look":
        return (
          <GenericCRUDManager
            collectionName="gender_banners"
            title="Home Page Collection"
            fields={[
              { key: 'image', label: 'Banner Editorial Image', type: 'image' },
              { key: 'title', label: 'Banner Title (e.g. FOR HIM, FOR HER, UNISEX, etc.)' },
              { key: 'tag', label: 'Tagline / Eyebrow (e.g. MASCULINE SIGNATURES)' },
              { key: 'subtitle', label: 'Description Text' },
              { key: 'cta', label: 'CTA Button Text (e.g. DISCOVER MEN\'S)' },
              { key: 'link', label: 'Destination Route (e.g. /shop?gender=Men)' },
              { key: 'sort_order', label: 'Sort Order', type: 'number' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ image: '', title: '', tag: '', subtitle: '', cta: 'EXPLORE COLLECTION', link: '/shop', sort_order: 1, is_active: true }}
          />
        );
      case "Explore Banner":
        return (
          <GenericCRUDManager
            collectionName="explore_banner"
            title="Explore Banner Settings"
            fields={[
              { key: 'desktop_image', label: 'Desktop Banner Image', type: 'image' },
              { key: 'tablet_image', label: 'Tablet Banner Image', type: 'image' },
              { key: 'mobile_image', label: 'Mobile Banner Image', type: 'image' },
              { key: 'link', label: 'Destination Link (e.g. /shop)' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ desktop_image: '', tablet_image: '', mobile_image: '', link: '/shop', is_active: true }}
          />
        );
      case "Community Gallery":
      case "Reviews":
        return <CommunityManager />;
      case "Global Alert":
        return (
          <GenericCRUDManager
            collectionName="global_alerts"
            title="Top Marquee Announcements"
            fields={[
              { key: 'text', label: 'Announcement Text' },
              { key: 'sort_order', label: 'Sort Order', type: 'number' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ text: 'COMPLIMENTARY EXPRESS SHIPPING OVER ₹1999', sort_order: 1, is_active: true }}
          />
        );
      case "Hero Video":
      case "Hero Slides":
        return <HeroVideoManager />;
      case "Benefits Strip":
        return (
          <GenericCRUDManager
            collectionName="benefits_strip"
            title="Homepage Benefits Info Strip CMS"
            fields={[
              {
                key: 'icon',
                label: 'Benefit Icon',
                type: 'select',
                options: [
                  { value: 'Truck', label: 'Truck (Shipping/Delivery)' },
                  { value: 'Zap', label: 'Zap (Fast/Performance)' },
                  { value: 'RotateCcw', label: 'Rotate Arrow (Returns/Refresh)' },
                  { value: 'ShieldCheck', label: 'Shield Check (Authentic/Secure)' }
                ]
              },
              { key: 'text', label: 'Benefit text' },
              { key: 'sort_order', label: 'Sort Order', type: 'number' },
              { key: 'is_active', label: 'Status', type: 'boolean' }
            ]}
            defaultItem={{ icon: 'Truck', text: 'Free Delivery', sort_order: 1, is_active: true }}
          />
        );
      case "Activity Logs":
        return <ActivityLogsView />;
      case "Store Settings":
      case "Payment Settings":
      case "Shipping Settings":
      case "Tax Settings":
      case "SEO Settings":
        return (
          <div className="bg-[#121212] border border-[#1a1a1a] rounded-xl p-6 text-white text-[14px] max-w-lg space-y-4">
            <h2 className="text-base   uppercase tracking-wider text-[#c9a962]">{activeItem}</h2>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-zinc-500 uppercase tracking-widest text-[9px] block">Primary Parameter</label>
                <input type="text" defaultValue="Mahirash Luxury Perfumes" className="w-full px-3 py-2 bg-[#161616] border border-[#222] rounded text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-500 uppercase tracking-widest text-[9px] block">Fallback Mode</label>
                <select className="w-full px-3 py-2 bg-[#161616] border border-[#222] rounded text-white">
                  <option>Enabled (Production)</option>
                  <option>Disabled (Staging)</option>
                </select>
              </div>
            </div>
            <button onClick={() => alert("Settings updated!")} className="px-5 py-2.5 bg-[#c9a962] text-[#090909]   rounded">Save Configuration</button>
          </div>
        );
      case "Help / Documentation":
        return (
          <div className="bg-white border border-zinc-200 rounded-xl p-6 text-zinc-900 text-[14px] space-y-4 max-w-xl shadow-sm">
            <h2 className="text-base   uppercase tracking-wider text-[#b8860b]">Mahirash Suite Help Center</h2>
            <p className="text-zinc-600 font-light leading-relaxed">This dashboard controls the storefront sections, database lists, order timelines, inventory, and promotions in real time. All changes are saved automatically to Firebase Firestore.</p>
          </div>
        );
      default:
        return renderOverview();
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen w-full bg-[#f5f5f5] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-['Inter',sans-serif]">
        {/* Subtle Ambient Background Elements */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#c9a962]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-black/[0.03] blur-2xl rounded-full pointer-events-none" />

        {/* Centered Admin Card Container */}
        <div className="w-full max-w-md bg-white/95 backdrop-blur-xl border border-zinc-200/90 p-6 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-3xl relative z-10 space-y-6 transition-all duration-500">

          {/* Header */}
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 rounded-2xl bg-black text-[#c9a962] flex items-center justify-center shadow-xl shadow-black/10 ring-4 ring-black/5 mx-auto mb-2 transform hover:scale-105 transition-transform duration-300">
              <Sparkles size={22} strokeWidth={2} />
            </div>
            <h1 className="text-lg font-poppins font-extrabold tracking-[0.2em] text-zinc-900 uppercase">
              MAHIRASH ADMIN
            </h1>
            <p className="text-[9.5px] text-[#b8860b] uppercase tracking-[0.25em] font-extrabold">
              HAUTE PARFUMERIE CONTROL CENTRE
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-700 text-[11px] font-medium flex items-center gap-2.5">
              <AlertCircle size={15} className="shrink-0 text-red-600" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 block pl-0.5 font-bold">
                Admin ID (Email)
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@mahirash.com"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50/80 border border-zinc-300 rounded-xl text-[13px] font-medium text-zinc-900 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all duration-300 placeholder:text-zinc-400 shadow-inner"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 block pl-0.5 font-bold">
                Security Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50/80 border border-zinc-300 rounded-xl text-[13px] font-medium text-zinc-900 outline-none focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 transition-all duration-300 placeholder:text-zinc-400 shadow-inner"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-black text-white font-extrabold text-[11px] uppercase tracking-[0.2em] transition-all duration-300 hover:bg-zinc-800 active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer shadow-lg shadow-black/10 rounded-xl mt-2 disabled:opacity-60"
            >
              <span>{isSubmitting ? "Authenticating..." : "Authenticate Admin"}</span>
              <ArrowRight size={14} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8f7f4] text-zinc-900 selection:bg-black selection:text-white relative">
      <AdminSidebar activeItem={activeItem} setActiveItem={setActiveItem} isOpen={isMobileSidebarOpen} onClose={() => setIsMobileSidebarOpen(false)} />

      <main className="flex-1 min-w-0 w-full px-3 py-4 sm:px-6 md:px-8 lg:px-10 overflow-x-hidden overflow-y-auto bg-[#f8f7f4]">
        <div className="max-w-7xl mx-auto w-full">
          <AdminHeader activeItem={activeItem} searchVal={searchVal} setSearchVal={setSearchVal} onMenuClick={() => setIsMobileSidebarOpen(true)} />

          {activeItem === "Products" && (
            <div className="flex flex-col sm:flex-row sm:justify-end mb-5">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-black text-white text-[13px] font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-[0.99]"
              >
                <Plus size={15} /> Add New Product
              </button>
            </div>
          )}

          {renderMainContent()}
        </div>
      </main>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2.5 sm:p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-900 uppercase tracking-wider">
                  Add New Fragrance Product
                </h2>
                <p className="text-[11px] text-zinc-500">Configure formulation, pricing variants, and notes</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-2 hover:bg-zinc-200/60 rounded-xl transition-colors text-zinc-500 hover:text-black cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-3.5 sm:px-7 py-4 sm:py-6 overflow-y-auto flex-1">
              <ProductForm
                onSuccess={handleAddProductSubmit}
              />
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="px-7 py-5 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-poppins   text-zinc-900 uppercase tracking-wider">
                  Edit Fragrance Product
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors text-zinc-500 hover:text-black cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-7 py-6">
              <ProductForm
                product={editingProduct}
                isEdit={true}
                onSuccess={handleEditProductSubmit}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
