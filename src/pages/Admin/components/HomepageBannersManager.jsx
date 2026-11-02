import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../../components/Firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import uploadToCloudinary from '../../../utils/cloudinary';
import { BANNER_DEFAULTS } from '../../../components/Home/HomePromoBanner';
import CloudinaryMediaPickerModal from '../../../components/CloudinaryMediaPickerModal';
import {
  Image as ImageIcon,
  Video,
  Upload,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Sliders,
  Monitor,
  Tablet,
  Smartphone,
  ArrowRight,
  ExternalLink,
  Sparkles,
  X
} from 'lucide-react';

const SLOTS_CONFIG = [
  {
    key: 'scent_to_bestseller',
    number: 1,
    title: 'Banner 1: Between "Shop by Scent" & "Best Sellers"',
    locationDescription: 'Appears directly below the Shop by Scent 4-Card grid and immediately above the Best Sellers product row.',
    defaultData: BANNER_DEFAULTS.scent_to_bestseller
  },
  {
    key: 'miniatures_to_signature',
    number: 2,
    title: 'Banner 2: Between "Shop Miniatures" & "Signature Collection"',
    locationDescription: 'Appears directly below the Shop Miniatures slider and immediately above the Signature Collection editorial section.',
    defaultData: BANNER_DEFAULTS.miniatures_to_signature
  },
  {
    key: 'before_faq',
    number: 3,
    title: 'Banner 3: Before "Frequently Asked Questions (FAQ)"',
    locationDescription: 'Appears directly below The Journal editorial cards and right before the FAQ accordion section.',
    defaultData: BANNER_DEFAULTS.before_faq
  }
];

const HomepageBannersManager = () => {
  const [banners, setBanners] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingSlotKey, setEditingSlotKey] = useState(null);
  const [formData, setFormData] = useState(null);
  const [uploadingField, setUploadingField] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'tablet' | 'mobile'

  // Cloudinary media picker modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTargetField, setPickerTargetField] = useState('desktopMediaUrl');

  const desktopFileInputRef = useRef(null);
  const tabletFileInputRef = useRef(null);
  const mobileFileInputRef = useRef(null);
  const posterFileInputRef = useRef(null);

  // 1. Real-time subscription to homepage_banners
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'homepage_banners'), (snapshot) => {
      const bannerMap = {};
      snapshot.docs.forEach((d) => {
        bannerMap[d.id] = { id: d.id, ...d.data() };
      });
      setBanners(bannerMap);
      setLoading(false);
    }, (err) => {
      console.warn('Error reading homepage_banners:', err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 1-Click Seed Defaults
  const handleSeedDefaults = async () => {
    if (!window.confirm('Initialize all 3 Homepage Banners with default luxury templates?')) return;
    setLoading(true);
    try {
      for (const slot of SLOTS_CONFIG) {
        await setDoc(doc(db, 'homepage_banners', slot.key), {
          ...slot.defaultData,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      setStatusMessage({ type: 'success', text: 'All 3 Homepage Banners initialized successfully!' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3500);
    } catch (err) {
      console.error('Error seeding defaults:', err);
      setStatusMessage({ type: 'error', text: 'Failed to initialize banners: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (slot) => {
    const existing = banners[slot.key] || slot.defaultData;
    setEditingSlotKey(slot.key);
    setFormData({
      slot_key: slot.key,
      slot_title: slot.title,
      mediaType: existing.mediaType || (existing.desktopMediaUrl?.includes('.mp4') ? 'video' : 'image'),
      desktopMediaUrl: existing.desktopMediaUrl || existing.desktop_image || existing.desktopVideoUrl || '',
      tabletMediaUrl: existing.tabletMediaUrl || existing.tablet_image || '',
      mobileMediaUrl: existing.mobileMediaUrl || existing.mobile_image || '',
      posterUrl: existing.posterUrl || '',
      eyebrow: existing.eyebrow || '',
      title: existing.title || '',
      description: existing.description || '',
      ctaText: existing.ctaText || 'Shop Now',
      ctaLink: existing.ctaLink || '/shop',
      textAlignment: existing.textAlignment || 'center',
      is_active: existing.is_active !== false
    });
    setPreviewDevice('desktop');
  };

  // Direct File Upload to Cloudinary
  const handleFileUpload = async (file, fieldKey) => {
    if (!file) return;
    try {
      setUploadingField(fieldKey);
      setUploadProgress(0);
      setStatusMessage({ type: 'info', text: `Uploading ${file.name}...` });

      const isVideoUpload = formData.mediaType === 'video' && (fieldKey === 'desktopMediaUrl' || fieldKey === 'tabletMediaUrl' || fieldKey === 'mobileMediaUrl');
      const uploadType = isVideoUpload ? 'video' : 'banner';

      const uploadedUrl = await uploadToCloudinary(file, uploadType, (percent) => {
        setUploadProgress(percent);
      });

      if (uploadedUrl) {
        setFormData(prev => ({ ...prev, [fieldKey]: uploadedUrl }));
        setStatusMessage({ type: 'success', text: `Successfully uploaded ${file.name}!` });
        setTimeout(() => setStatusMessage({ type: '', text: '' }), 3500);
      }
    } catch (err) {
      console.error('Upload error:', err);
      const msg = err?.response?.data?.error?.message || err?.message || 'Upload failed';
      setStatusMessage({ type: 'error', text: `Upload failed: ${msg}` });
    } finally {
      setUploadingField(null);
      setUploadProgress(0);
    }
  };

  // Save Banner to Firestore
  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!formData.desktopMediaUrl) {
      alert('Please provide at least a Desktop Media URL or upload a file.');
      return;
    }

    try {
      await setDoc(doc(db, 'homepage_banners', editingSlotKey), {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setStatusMessage({ type: 'success', text: 'Banner updated and live on storefront!' });
      setEditingSlotKey(null);
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3500);
    } catch (err) {
      console.error('Error saving banner:', err);
      setStatusMessage({ type: 'error', text: 'Failed to save banner: ' + err.message });
    }
  };

  // Toggle Active directly on Card
  const handleToggleActive = async (slotKey, currentActive) => {
    try {
      await setDoc(doc(db, 'homepage_banners', slotKey), {
        is_active: !currentActive,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Error toggling active:', err);
    }
  };

  return (
    <div className="space-y-6 text-[#30231F] font-['Inter',sans-serif]">
      {/* ── Status Toast ── */}
      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between border ${
            statusMessage.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage({ type: '', text: '' })} className="p-1 hover:opacity-75">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Top Header ── */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#800020]/10 text-[#800020] rounded-xl border border-[#800020]/20">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[#30231F] uppercase tracking-wider">
                Homepage Promotional Banners (3 Slots)
              </h2>
              <p className="text-xs sm:text-sm text-[#75665D] mt-0.5">
                Manage full-width video or photo banners across Mobile, Tablet, and Desktop screen sizes.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSeedDefaults}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#B88D46] hover:bg-[#a67c37] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Sparkles size={14} /> Reset / Seed 3 Luxury Banners
        </button>
      </div>

      {/* ── 3 Banner Slots Cards ── */}
      <div className="space-y-6">
        {SLOTS_CONFIG.map((slot) => {
          const banner = banners[slot.key] || slot.defaultData;
          const isVid =
            banner.mediaType === 'video' ||
            banner.desktopMediaUrl?.includes('.mp4') ||
            banner.desktopMediaUrl?.includes('/video/');

          return (
            <div
              key={slot.key}
              className="bg-white rounded-2xl border border-[#E9DCCB] shadow-xs overflow-hidden transition-all hover:border-[#800020]/40"
            >
              {/* Slot Header Bar */}
              <div className="px-6 py-4 bg-[#FCF9F4] border-b border-[#E9DCCB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#800020] text-white text-xs font-bold flex items-center justify-center font-mono">
                    {slot.number}
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-sm sm:text-base text-[#30231F]">
                      {slot.title}
                    </h3>
                    <p className="text-xs text-[#75665D] mt-0.5">
                      {slot.locationDescription}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(slot.key, banner.is_active !== false)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      banner.is_active !== false
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                    }`}
                  >
                    {banner.is_active !== false ? '● Live on Store' : '○ Disabled'}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(slot)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#800020] hover:bg-[#650018] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-xs cursor-pointer"
                  >
                    <Edit2 size={13} /> Edit Banner
                  </button>
                </div>
              </div>

              {/* Slot Live Preview & Info Grid */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Media Preview Box */}
                <div className="lg:col-span-5 relative h-48 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-[#E9DCCB]/60 shadow-xs">
                  {isVid ? (
                    <video
                      key={banner.desktopMediaUrl}
                      src={banner.desktopMediaUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover opacity-85"
                    />
                  ) : (
                    <img
                      key={banner.desktopMediaUrl}
                      src={banner.desktopMediaUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover opacity-85"
                    />
                  )}
                  {/* Subtle dark vignette */}
                  <div className="absolute inset-0 bg-black/30 pointer-events-none" />

                  {/* Media Type Badge */}
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/70 text-white text-[10px] font-mono flex items-center gap-1.5 backdrop-blur-xs">
                    {isVid ? <Video size={11} className="text-[#B88D46]" /> : <ImageIcon size={11} className="text-[#B88D46]" />}
                    <span className="uppercase">{banner.mediaType || (isVid ? 'Video' : 'Photo')}</span>
                  </div>
                </div>

                {/* Banner Content Details */}
                <div className="lg:col-span-7 space-y-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B88D46] block">
                      {banner.eyebrow || 'PROMOTIONAL BANNER'}
                    </span>
                    <h4 className="font-serif font-bold text-lg text-[#30231F] mt-1">
                      {banner.title}
                    </h4>
                    <p className="text-xs text-[#75665D] mt-1 leading-relaxed line-clamp-2">
                      {banner.description}
                    </p>
                  </div>

                  {/* Responsive Status Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E9DCCB]/60 text-[11px]">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700">
                      <Monitor size={12} className="text-[#800020]" /> Desktop: {banner.desktopMediaUrl ? 'Configured' : 'Missing'}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700">
                      <Tablet size={12} className="text-[#800020]" /> Tablet: {banner.tabletMediaUrl ? 'Custom' : 'Desktop Fallback'}
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700">
                      <Smartphone size={12} className="text-[#800020]" /> Mobile: {banner.mobileMediaUrl ? 'Custom' : 'Desktop Fallback'}
                    </span>
                  </div>

                  {/* Button Link */}
                  <div className="flex items-center gap-4 text-xs text-[#75665D]">
                    <span>Button: <strong className="text-[#30231F]">{banner.ctaText || 'Shop Now'}</strong></span>
                    <span className="font-mono text-zinc-400">Target: {banner.ctaLink || '/shop'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Edit Banner Modal ── */}
      {editingSlotKey && formData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E9DCCB] max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#800020]">
                  Homepage Banner Slot Editor
                </span>
                <h3 className="font-serif text-lg font-bold text-[#30231F] mt-0.5">
                  {formData.slot_title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingSlotKey(null)}
                className="p-2 text-[#75665D] hover:text-[#30231F] rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-6">
              {/* 1. Media Type Selector: Video vs Photo */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                  Media Presentation Type *
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, mediaType: 'video' }))}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      formData.mediaType === 'video'
                        ? 'bg-[#800020] text-white border-[#800020] shadow-sm'
                        : 'bg-[#FCF9F4] text-[#75665D] border-[#E9DCCB] hover:text-[#30231F]'
                    }`}
                  >
                    <Video size={16} /> Video Banner
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, mediaType: 'image' }))}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      formData.mediaType === 'image'
                        ? 'bg-[#800020] text-white border-[#800020] shadow-sm'
                        : 'bg-[#FCF9F4] text-[#75665D] border-[#E9DCCB] hover:text-[#30231F]'
                    }`}
                  >
                    <ImageIcon size={16} /> Photo / Image Banner
                  </button>
                </div>
              </div>

              {/* 2. Responsive Media Inputs (Desktop, Tablet, Mobile) */}
              <div className="bg-[#FCF9F4] p-5 rounded-2xl border border-[#E9DCCB] space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#800020] flex items-center gap-1.5">
                  <Monitor size={14} /> Responsive Media Sources (Desktop, Tablet & Mobile)
                </h4>

                {/* Desktop Media */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D]">
                      Desktop Media File / URL (1920x800 recommended) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTargetField('desktopMediaUrl');
                        setIsPickerOpen(true);
                      }}
                      className="text-[11px] text-[#800020] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      Pick from Cloudinary
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={formData.desktopMediaUrl}
                      onChange={(e) => setFormData(p => ({ ...p, desktopMediaUrl: e.target.value }))}
                      placeholder={formData.mediaType === 'video' ? 'https://.../video.mp4' : 'https://.../photo.webp'}
                      className="flex-1 px-3.5 py-2.5 bg-white border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                    />
                    <input
                      type="file"
                      ref={desktopFileInputRef}
                      accept={formData.mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files?.[0], 'desktopMediaUrl')}
                    />
                    <button
                      type="button"
                      disabled={uploadingField === 'desktopMediaUrl'}
                      onClick={() => desktopFileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-[#B88D46] hover:bg-[#a67c37] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Upload size={14} />
                      {uploadingField === 'desktopMediaUrl' ? `${uploadProgress}%` : 'Upload Desktop'}
                    </button>
                  </div>
                </div>

                {/* Tablet Media */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                    Tablet Media File / URL (Optional, fallback to Desktop)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.tabletMediaUrl}
                      onChange={(e) => setFormData(p => ({ ...p, tabletMediaUrl: e.target.value }))}
                      placeholder="Optional tablet optimized media URL"
                      className="flex-1 px-3.5 py-2.5 bg-white border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                    />
                    <input
                      type="file"
                      ref={tabletFileInputRef}
                      accept={formData.mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files?.[0], 'tabletMediaUrl')}
                    />
                    <button
                      type="button"
                      disabled={uploadingField === 'tabletMediaUrl'}
                      onClick={() => tabletFileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Upload size={14} />
                      {uploadingField === 'tabletMediaUrl' ? `${uploadProgress}%` : 'Upload Tablet'}
                    </button>
                  </div>
                </div>

                {/* Mobile Media */}
                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                    Mobile Media File / URL (Optional vertical crop, fallback to Desktop)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.mobileMediaUrl}
                      onChange={(e) => setFormData(p => ({ ...p, mobileMediaUrl: e.target.value }))}
                      placeholder="Optional mobile optimized media URL"
                      className="flex-1 px-3.5 py-2.5 bg-white border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                    />
                    <input
                      type="file"
                      ref={mobileFileInputRef}
                      accept={formData.mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files?.[0], 'mobileMediaUrl')}
                    />
                    <button
                      type="button"
                      disabled={uploadingField === 'mobileMediaUrl'}
                      onClick={() => mobileFileInputRef.current?.click()}
                      className="px-4 py-2.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Upload size={14} />
                      {uploadingField === 'mobileMediaUrl' ? `${uploadProgress}%` : 'Upload Mobile'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Banner Typography & Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                    Eyebrow / Sub-tag
                  </label>
                  <input
                    type="text"
                    value={formData.eyebrow}
                    onChange={(e) => setFormData(p => ({ ...p, eyebrow: e.target.value }))}
                    placeholder="ROYAL BOTANICAL EXTRAITS"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                    Headline Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                    placeholder="Fragrance Formulations Crafted for Royalty"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                  Description Paragraph
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="Formulated with pure Cambodian oud, ambergris, and rare floral distillations."
                  className="w-full px-3.5 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                />
              </div>

              {/* CTA & Alignment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData(p => ({ ...p, ctaText: e.target.value }))}
                    placeholder="Shop Now"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                    Button Link
                  </label>
                  <input
                    type="text"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData(p => ({ ...p, ctaLink: e.target.value }))}
                    placeholder="/shop"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                    Text Alignment
                  </label>
                  <select
                    value={formData.textAlignment}
                    onChange={(e) => setFormData(p => ({ ...p, textAlignment: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020] cursor-pointer"
                  >
                    <option value="center">Center</option>
                    <option value="left">Left Aligned</option>
                    <option value="right">Right Aligned</option>
                  </select>
                </div>
              </div>

              {/* Active Switch */}
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 text-[#800020] rounded border-[#E9DCCB] focus:ring-[#800020]"
                  />
                  <span className="text-xs font-semibold text-[#30231F]">
                    Active (Show this banner on Home Page)
                  </span>
                </label>
              </div>

              {/* ── Responsive Live Preview Box ── */}
              <div className="space-y-2 pt-2 border-t border-[#E9DCCB]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#800020] flex items-center gap-1.5">
                    <Eye size={14} /> Interactive Live Preview
                  </span>
                  <div className="flex items-center gap-1 bg-[#FCF9F4] p-1 rounded-xl border border-[#E9DCCB]">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('desktop')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        previewDevice === 'desktop' ? 'bg-[#800020] text-white shadow-xs' : 'text-[#75665D]'
                      }`}
                    >
                      <Monitor size={12} /> Desktop
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('tablet')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        previewDevice === 'tablet' ? 'bg-[#800020] text-white shadow-xs' : 'text-[#75665D]'
                      }`}
                    >
                      <Tablet size={12} /> Tablet
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice('mobile')}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        previewDevice === 'mobile' ? 'bg-[#800020] text-white shadow-xs' : 'text-[#75665D]'
                      }`}
                    >
                      <Smartphone size={12} /> Mobile
                    </button>
                  </div>
                </div>

                {/* Simulated Device Frame */}
                {(() => {
                  let activeUrl = formData.desktopMediaUrl;
                  if (previewDevice === 'mobile' && formData.mobileMediaUrl) activeUrl = formData.mobileMediaUrl;
                  else if (previewDevice === 'tablet' && formData.tabletMediaUrl) activeUrl = formData.tabletMediaUrl;

                  const previewIsVid =
                    formData.mediaType === 'video' ||
                    activeUrl?.includes('.mp4') ||
                    activeUrl?.includes('/video/');

                  const containerWidth =
                    previewDevice === 'mobile' ? 'max-w-[360px]' : previewDevice === 'tablet' ? 'max-w-[640px]' : 'w-full';

                  return (
                    <div className="flex justify-center bg-zinc-100 p-4 rounded-2xl border border-zinc-200">
                      <div className={`${containerWidth} w-full h-[240px] sm:h-[280px] rounded-xl overflow-hidden bg-black relative flex items-center justify-center shadow-lg transition-all`}>
                        {previewIsVid ? (
                          <video
                            key={activeUrl}
                            src={activeUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover opacity-85"
                          />
                        ) : (
                          <img
                            key={activeUrl}
                            src={activeUrl}
                            alt={formData.title}
                            className="w-full h-full object-cover opacity-85"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/45" />

                        {/* Content Preview Overlay */}
                        <div className={`relative z-10 px-6 max-w-lg w-full flex flex-col ${
                          formData.textAlignment === 'left' ? 'items-start text-left' : formData.textAlignment === 'right' ? 'items-end text-right' : 'items-center text-center'
                        } space-y-2`}>
                          <span className="text-[#B88D46] text-[10px] font-bold uppercase tracking-widest">
                            {formData.eyebrow || 'PREVIEW EYEBROW'}
                          </span>
                          <h4 className="font-serif text-lg sm:text-xl text-white font-normal leading-tight line-clamp-2">
                            {formData.title || 'Banner Headline'}
                          </h4>
                          <p className="text-zinc-300 text-xs line-clamp-2 font-light">
                            {formData.description}
                          </p>
                          <div className="pt-1">
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#800020] text-white text-[11px] font-bold uppercase tracking-wider">
                              {formData.ctaText || 'Shop Now'} <ArrowRight size={12} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E9DCCB]">
                <button
                  type="button"
                  onClick={() => setEditingSlotKey(null)}
                  className="px-5 py-2.5 border border-[#E9DCCB] rounded-xl text-xs font-semibold text-[#75665D] hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#800020] hover:bg-[#650018] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#800020]/20 cursor-pointer"
                >
                  Save & Publish Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Cloudinary Media Picker ── */}
      {isPickerOpen && (
        <CloudinaryMediaPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={(url) => {
            setFormData(p => ({ ...p, [pickerTargetField]: url }));
            setIsPickerOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default HomepageBannersManager;

