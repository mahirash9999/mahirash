import React, { useState, useEffect } from 'react';
import { db } from '../../../components/Firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import {
  ShieldCheck,
  Sparkles,
  Lock,
  Plane,
  Truck,
  Globe,
  RotateCcw,
  Award,
  CheckCircle2,
  Heart,
  Zap,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  Eye,
  ArrowUpDown
} from 'lucide-react';

export const AVAILABLE_ICONS = [
  { id: 'ShieldCheck', name: 'Shield (Authenticity)', icon: ShieldCheck },
  { id: 'Sparkles', name: 'Sparkles (Luxury / Fragrance)', icon: Sparkles },
  { id: 'Lock', name: 'Lock (Secure Checkout)', icon: Lock },
  { id: 'Plane', name: 'Airplane (Worldwide Shipping)', icon: Plane },
  { id: 'Truck', name: 'Truck (Express Delivery)', icon: Truck },
  { id: 'Globe', name: 'Globe (International)', icon: Globe },
  { id: 'RotateCcw', name: 'Rotate (Easy Returns)', icon: RotateCcw },
  { id: 'Award', name: 'Award (Premium Quality)', icon: Award },
  { id: 'CheckCircle2', name: 'Checkmark (Verified)', icon: CheckCircle2 },
  { id: 'Heart', name: 'Heart (Customer Care)', icon: Heart },
  { id: 'Zap', name: 'Lightning (Fast Service)', icon: Zap }
];

export const renderBenefitIcon = (iconKey, className = "text-[#B88D46] shrink-0", size = 20) => {
  const key = String(iconKey || '').toLowerCase();
  const props = { size, strokeWidth: 1.8, className };

  if (key.includes('shield') || key === 'shieldcheck') return <ShieldCheck {...props} />;
  if (key.includes('sparkle') || key === 'sparkles') return <Sparkles {...props} />;
  if (key.includes('lock') || key === 'secure') return <Lock {...props} />;
  if (key.includes('plane') || key === 'flight') return <Plane {...props} />;
  if (key.includes('truck') || key === 'shipping') return <Truck {...props} />;
  if (key.includes('globe') || key === 'world') return <Globe {...props} />;
  if (key.includes('rotate') || key === 'return') return <RotateCcw {...props} />;
  if (key.includes('award') || key === 'medal') return <Award {...props} />;
  if (key.includes('check') || key === 'verify') return <CheckCircle2 {...props} />;
  if (key.includes('heart') || key === 'love') return <Heart {...props} />;
  if (key.includes('zap') || key === 'fast') return <Zap {...props} />;
  return <ShieldCheck {...props} />;
};

const DEFAULT_SEED_BENEFITS = [
  {
    id: 'benefit_1',
    label: '100% AUTHENTIC PRODUCTS',
    icon: 'ShieldCheck',
    sort_order: 1,
    is_active: true
  },
  {
    id: 'benefit_2',
    label: 'LONG LASTING FRAGRANCES',
    icon: 'Sparkles',
    sort_order: 2,
    is_active: true
  },
  {
    id: 'benefit_3',
    label: 'SECURE SHOPPING CHECKOUT',
    icon: 'Lock',
    sort_order: 3,
    is_active: true
  },
  {
    id: 'benefit_4',
    label: 'WIDE INTERNATIONAL AVAILABILITY',
    icon: 'Plane',
    sort_order: 4,
    is_active: true
  }
];

const BenefitsStripManager = () => {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    label: '',
    icon: 'ShieldCheck',
    sort_order: 1,
    is_active: true
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 3500);
  };

  // Real-time listener for benefits_strip collection
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'benefits_strip'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Auto-seed default benefits into Firestore
        console.log("Seeding default benefits_strip to Firestore...");
        try {
          for (const item of DEFAULT_SEED_BENEFITS) {
            await setDoc(doc(db, 'benefits_strip', item.id), {
              ...item,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          }
        } catch (e) {
          console.warn("Auto-seed error:", e);
          setBenefits(DEFAULT_SEED_BENEFITS);
          setLoading(false);
        }
      } else {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        list.sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
        setBenefits(list);
        setLoading(false);
      }
    }, (err) => {
      console.error("Error listening to benefits_strip:", err);
      setBenefits(DEFAULT_SEED_BENEFITS);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      label: '',
      icon: 'ShieldCheck',
      sort_order: benefits.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setFormData({
      label: item.label || item.text || '',
      icon: item.icon || 'ShieldCheck',
      sort_order: item.sort_order !== undefined ? item.sort_order : 1,
      is_active: item.is_active !== undefined ? item.is_active : true
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.label.trim()) {
      showToast("Please enter benefit title/text.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        label: formData.label.trim().toUpperCase(),
        text: formData.label.trim().toUpperCase(),
        icon: formData.icon || 'ShieldCheck',
        sort_order: Number(formData.sort_order) || 1,
        is_active: Boolean(formData.is_active),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'benefits_strip', editingId), payload);
        showToast("Benefit updated successfully!");
      } else {
        payload.createdAt = serverTimestamp();
        await addDoc(collection(db, 'benefits_strip'), payload);
        showToast("New benefit added to homepage strip!");
      }

      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      console.error("Error saving benefit:", err);
      showToast("Failed to save benefit: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, label) => {
    if (!window.confirm(`Are you sure you want to delete "${label}"?`)) return;

    try {
      await deleteDoc(doc(db, 'benefits_strip', id));
      showToast("Benefit deleted from strip.");
    } catch (err) {
      console.error("Error deleting benefit:", err);
      showToast("Delete failed: " + err.message, "error");
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      await updateDoc(doc(db, 'benefits_strip', item.id), {
        is_active: !item.is_active,
        updatedAt: serverTimestamp()
      });
      showToast(`Benefit ${!item.is_active ? 'activated' : 'hidden'} on homepage.`);
    } catch (err) {
      showToast("Failed to update status: " + err.message, "error");
    }
  };

  return (
    <div className="space-y-6 text-[#30231F] font-['Inter',sans-serif]">
      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-semibold transition-all ${
          toastMessage.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#800020] text-white'
        }`}>
          {toastMessage.type === 'error' ? <X size={16} /> : <Check size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-sm">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#30231F] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="text-[#800020]" size={22} /> Homepage Benefits Strip Manager
          </h2>
          <p className="text-[14px] text-[#75665D] mt-1">
            Customize the trust badges displayed right below the Hero Banner on the homepage. Change texts, icons, order, or active status in real-time.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-[#800020] hover:bg-[#650018] text-white text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus size={16} /> Add Benefit Item
        </button>
      </div>

      {/* Live Homepage Preview */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#75665D] uppercase tracking-widest flex items-center gap-1.5">
            <Eye size={14} className="text-[#800020]" /> Live Storefront Preview (As seen below Hero Banner)
          </span>
          <span className="text-[11px] text-[#75665D]">
            {benefits.filter(b => b.is_active !== false).length} active items
          </span>
        </div>

        <div className="bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl py-3 px-4 overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E9DCCB]">
            {benefits.filter(b => b.is_active !== false).map((item, idx) => (
              <div
                key={item.id || idx}
                className={`flex items-center justify-center gap-2.5 px-3 py-2 sm:py-1 ${
                  idx % 2 === 0 ? 'pr-2' : 'pl-2'
                } md:px-4`}
              >
                {renderBenefitIcon(item.icon, "text-[#B88D46] shrink-0", 18)}
                <span className="text-[#30231F] text-[10.5px] sm:text-[11px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap text-center">
                  {item.label || item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Table / Cards */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-sm">
        <h3 className="text-base font-serif font-bold text-[#30231F] mb-4 flex items-center gap-2">
          <ArrowUpDown size={16} className="text-[#800020]" /> Configured Benefit Badges
        </h3>

        {loading ? (
          <div className="py-12 text-center text-[#75665D] text-sm">Loading benefits from Firestore...</div>
        ) : benefits.length === 0 ? (
          <div className="py-12 text-center text-[#75665D] text-sm">No benefit badges configured yet. Click "Add Benefit Item" to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-[#75665D] bg-[#FCF9F4] border-b border-[#E9DCCB]">
                  <th className="py-3 px-3 w-16 text-center">Order</th>
                  <th className="py-3 px-4 w-20 text-center">Icon</th>
                  <th className="py-3 px-4">Title / Label Text</th>
                  <th className="py-3 px-4 w-32 text-center">Status</th>
                  <th className="py-3 px-4 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9DCCB]/60">
                {benefits.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FCF9F4]/70 transition-colors">
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-[#30231F]">
                      #{item.sort_order || 1}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="w-9 h-9 rounded-lg bg-[#FCF9F4] border border-[#E9DCCB] flex items-center justify-center mx-auto shadow-xs">
                        {renderBenefitIcon(item.icon, "text-[#800020]", 18)}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-[#30231F] tracking-wide">
                      {item.label || item.text}
                      <span className="block text-[11px] text-[#75665D] font-normal font-mono mt-0.5">
                        Icon: {item.icon || 'ShieldCheck'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                          item.is_active !== false
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                        }`}
                      >
                        {item.is_active !== false ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(item)}
                        className="p-2 text-[#75665D] hover:text-[#800020] hover:bg-[#800020]/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.label || item.text)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Benefit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#E9DCCB] space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-4">
              <h3 className="text-lg font-serif font-bold text-[#30231F] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="text-[#800020]" size={20} />
                {editingId ? 'Edit Benefit Item' : 'Add New Benefit Item'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Title / Label */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#75665D] mb-1.5">
                  Benefit Title / Label (Shown on Home Banner) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g. 100% AUTHENTIC PRODUCTS"
                  className="w-full px-4 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-sm font-semibold uppercase text-[#30231F] outline-none focus:border-[#800020] transition-all"
                />
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#75665D] mb-1.5">
                  Choose Icon *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl">
                  {AVAILABLE_ICONS.map((iconItem) => {
                    const isSelected = formData.icon === iconItem.id;
                    const IconComp = iconItem.icon;
                    return (
                      <button
                        key={iconItem.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon: iconItem.id })}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-[#800020] text-white border-[#800020] shadow-sm'
                            : 'bg-white text-[#30231F] border-[#E9DCCB] hover:border-[#800020]/50'
                        }`}
                      >
                        <IconComp size={20} className={isSelected ? 'text-white' : 'text-[#800020]'} />
                        <span className={`text-[9.5px] mt-1 font-semibold truncate w-full ${
                          isSelected ? 'text-white' : 'text-[#75665D]'
                        }`}>
                          {iconItem.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Order & Status Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#75665D] mb-1.5">
                    Sort Order (1, 2, 3...)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-4 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-sm font-semibold text-[#30231F] outline-none focus:border-[#800020]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#75665D] mb-1.5">
                    Status
                  </label>
                  <select
                    value={formData.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                    className="w-full px-4 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-sm font-semibold text-[#30231F] outline-none focus:border-[#800020]"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              {/* Live Item Preview in Modal */}
              <div className="p-3 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl flex items-center justify-center gap-2">
                <span className="text-xs text-[#75665D] mr-2">Preview:</span>
                {renderBenefitIcon(formData.icon, "text-[#B88D46]", 18)}
                <span className="text-[#30231F] text-xs font-bold uppercase tracking-wider">
                  {formData.label || "YOUR BENEFIT TITLE"}
                </span>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E9DCCB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm text-[#75665D] hover:text-[#30231F] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-[#800020] hover:bg-[#650018] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && <RefreshCw size={14} className="animate-spin" />}
                  {editingId ? 'Update Benefit' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BenefitsStripManager;

