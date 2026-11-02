import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../../components/Firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import uploadToCloudinary from '../../../utils/cloudinary';
import {
  Video,
  Image as ImageIcon,
  Upload,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Eye,
  Sliders,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  X
} from 'lucide-react';
import CloudinaryMediaPickerModal from '../../../components/CloudinaryMediaPickerModal';

const FALLBACK_LUXURY_VIDEO = 'https://res.cloudinary.com/djmfxpemz/video/upload/v1789045664/xr1u182rnbyoxu0dtbtp.mp4';

const DEFAULT_SLIDES = [
  {
    mediaType: 'video',
    mediaUrl: FALLBACK_LUXURY_VIDEO,
    mobileMediaUrl: '',
    posterUrl: '',
    eyebrow: 'PREMIUM FRAGRANCES',
    title: 'Fragrances That Define You',
    description: 'A perfect blend of luxury, elegance and long lasting impressions. Discover our exclusive collection of premium perfumes.',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    sort_order: 1,
    is_active: true
  },
  {
    mediaType: 'video',
    mediaUrl: FALLBACK_LUXURY_VIDEO,
    mobileMediaUrl: '',
    posterUrl: '',
    eyebrow: 'ARTISAN EXTRAITS',
    title: 'Pure Essence of Royalty',
    description: 'Handcrafted with rare botanical oils and aged Cambodian oud for an unforgettable presence.',
    ctaText: 'Explore Collection',
    ctaLink: '/shop?category=Oud',
    sort_order: 2,
    is_active: true
  },
  {
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=1920&q=80',
    mobileMediaUrl: '',
    posterUrl: '',
    eyebrow: 'LUXURY PERFUMES',
    title: 'Elegance in Every Drop',
    description: 'Formulated to captivate and linger with unmatched projection and sophisticated warmth.',
    ctaText: 'Discover Scent',
    ctaLink: '/shop',
    sort_order: 3,
    is_active: true
  }
];

const HeroVideoManager = () => {
  const [slides, setSlides] = useState([]);
  const [displayMode, setDisplayMode] = useState('all'); // 'all' | 'video_only' | 'image_only'
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  // Edit / Add Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState(null);
  const [formData, setFormData] = useState({
    mediaType: 'video',
    mediaUrl: '',
    mobileMediaUrl: '',
    posterUrl: '',
    eyebrow: '',
    title: '',
    description: '',
    ctaText: 'Shop Now',
    ctaLink: '/shop',
    sort_order: 1,
    is_active: true
  });

  // Upload state
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingField, setUploadingField] = useState(null); // 'mediaUrl' | 'mobileMediaUrl' | 'posterUrl'
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

  // Cloudinary media picker modal
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTargetField, setPickerTargetField] = useState('mediaUrl');

  // Preview state
  const [previewSlideIdx, setPreviewSlideIdx] = useState(0);

  // File input refs
  const desktopFileInputRef = useRef(null);
  const mobileFileInputRef = useRef(null);
  const posterFileInputRef = useRef(null);

  // 1. Real-time subscription to hero_slides & settings
  useEffect(() => {
    setLoading(true);

    // Fetch displayMode setting
    const fetchSettings = async () => {
      try {
        const snap = await getDocs(collection(db, 'hero_video'));
        if (!snap.empty) {
          const s = snap.docs.find(d => d.id === 'settings')?.data();
          if (s && s.displayMode) {
            setDisplayMode(s.displayMode);
          }
        }
      } catch (err) {
        console.warn('Error fetching hero_video settings:', err);
      }
    };
    fetchSettings();

    // Subscribe to hero_slides
    const unsubscribe = onSnapshot(collection(db, 'hero_slides'), (snapshot) => {
      if (snapshot.empty) {
        setSlides([]);
      } else {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })).sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
        setSlides(list);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching hero_slides:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Save displayMode setting to Firestore
  const handleDisplayModeChange = async (newMode) => {
    setDisplayMode(newMode);
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'hero_video', 'settings'), {
        displayMode: newMode,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setStatusMessage({
        type: 'success',
        text: `Hero display mode set to "${newMode === 'all' ? 'All Slides (Videos + Photos)' : newMode === 'video_only' ? 'Videos Only' : 'Photos Only'}"!`
      });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3500);
    } catch (err) {
      console.error('Error saving hero_video settings:', err);
      setStatusMessage({ type: 'error', text: 'Failed to update hero display mode.' });
    } finally {
      setSavingSettings(false);
    }
  };

  // Seed default slides if empty
  const handleSeedDefaults = async () => {
    if (!window.confirm("Seed 3 default luxury slides into the Hero Banner?")) return;
    setLoading(true);
    try {
      for (const item of DEFAULT_SLIDES) {
        await addDoc(collection(db, 'hero_slides'), {
          ...item,
          createdAt: serverTimestamp()
        });
      }
      setStatusMessage({ type: 'success', text: 'Default slides created successfully!' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3500);
    } catch (err) {
      console.error('Error seeding default slides:', err);
      setStatusMessage({ type: 'error', text: 'Error seeding default slides: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  // Open modal for Create
  const handleOpenAdd = () => {
    setEditingSlide(null);
    setFormData({
      mediaType: 'video',
      mediaUrl: '',
      mobileMediaUrl: '',
      posterUrl: '',
      eyebrow: 'PREMIUM FRAGRANCES',
      title: 'Fragrances That Define You',
      description: 'A perfect blend of luxury, elegance and long lasting impressions.',
      ctaText: 'Shop Now',
      ctaLink: '/shop',
      sort_order: slides.length + 1,
      is_active: true
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (slide) => {
    setEditingSlide(slide);
    setFormData({
      mediaType: slide.mediaType || (slide.mediaUrl?.includes('.mp4') || slide.mediaUrl?.includes('/video/') ? 'video' : 'image'),
      mediaUrl: slide.mediaUrl || slide.image || '',
      mobileMediaUrl: slide.mobileMediaUrl || slide.mobileImage || '',
      posterUrl: slide.posterUrl || '',
      eyebrow: slide.eyebrow || '',
      title: slide.title || '',
      description: slide.description || '',
      ctaText: slide.ctaText || 'Shop Now',
      ctaLink: slide.ctaLink || '/shop',
      sort_order: Number(slide.sort_order) || 1,
      is_active: slide.is_active !== false
    });
    setIsModalOpen(true);
  };

  // Handle Cloudinary direct upload
  const handleFileUpload = async (file, fieldKey) => {
    if (!file) return;
    try {
      setUploadingField(fieldKey);
      setUploadProgress(0);
      setStatusMessage({ type: 'info', text: `Uploading ${file.name}...` });

      const isVideoUpload = formData.mediaType === 'video' && fieldKey === 'mediaUrl';
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

  // Save slide (Create or Update)
  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!formData.mediaUrl) {
      alert("Please upload or enter a Media URL (video or photo) for this slide.");
      return;
    }

    try {
      const payload = {
        mediaType: formData.mediaType,
        mediaUrl: formData.mediaUrl,
        mobileMediaUrl: formData.mobileMediaUrl || '',
        posterUrl: formData.posterUrl || '',
        eyebrow: formData.eyebrow,
        title: formData.title,
        description: formData.description,
        ctaText: formData.ctaText || 'Shop Now',
        ctaLink: formData.ctaLink || '/shop',
        sort_order: Number(formData.sort_order) || 1,
        is_active: formData.is_active,
        updatedAt: serverTimestamp()
      };

      if (editingSlide && editingSlide.id) {
        await updateDoc(doc(db, 'hero_slides', editingSlide.id), payload);
        setStatusMessage({ type: 'success', text: 'Slide updated successfully!' });
      } else {
        await addDoc(collection(db, 'hero_slides'), {
          ...payload,
          createdAt: serverTimestamp()
        });
        setStatusMessage({ type: 'success', text: 'New slide added successfully!' });
      }

      setIsModalOpen(false);
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3500);
    } catch (err) {
      console.error('Error saving slide:', err);
      setStatusMessage({ type: 'error', text: 'Failed to save slide: ' + err.message });
    }
  };

  // Delete slide
  const handleDeleteSlide = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete slide "${title || id}"?`)) return;
    try {
      await deleteDoc(doc(db, 'hero_slides', id));
      setStatusMessage({ type: 'success', text: 'Slide deleted successfully!' });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 3500);
    } catch (err) {
      console.error('Error deleting slide:', err);
      setStatusMessage({ type: 'error', text: 'Failed to delete slide.' });
    }
  };

  // Toggle active state
  const handleToggleActive = async (slide) => {
    try {
      await updateDoc(doc(db, 'hero_slides', slide.id), {
        is_active: !slide.is_active,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  // Filtered slides for live preview
  const displaySlides = slides.filter(s => {
    if (s.is_active === false) return false;
    if (displayMode === 'video_only') {
      return s.mediaType === 'video' || s.mediaUrl?.includes('.mp4') || s.mediaUrl?.includes('/video/');
    }
    if (displayMode === 'image_only') {
      return s.mediaType === 'image' || (!s.mediaUrl?.includes('.mp4') && !s.mediaUrl?.includes('/video/'));
    }
    return true;
  });

  const previewSlide = displaySlides[previewSlideIdx] || displaySlides[0] || DEFAULT_SLIDES[0];

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

      {/* ── Main Top Card ── */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-[#800020]/10 text-[#800020] rounded-xl border border-[#800020]/20">
              <Sliders size={20} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-[#30231F] uppercase tracking-wider">
                Hero Banner & Video Slider CMS
              </h2>
              <p className="text-xs sm:text-sm text-[#75665D] mt-0.5">
                Manage dynamic slider content, upload multiple videos or photos, and choose slide media modes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Display Mode Selector */}
          <div className="flex items-center bg-[#FCF9F4] p-1 rounded-xl border border-[#E9DCCB]">
            <button
              type="button"
              onClick={() => handleDisplayModeChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                displayMode === 'all'
                  ? 'bg-[#800020] text-white shadow-xs'
                  : 'text-[#75665D] hover:text-[#30231F]'
              }`}
            >
              All Slides
            </button>
            <button
              type="button"
              onClick={() => handleDisplayModeChange('video_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'video_only'
                  ? 'bg-[#800020] text-white shadow-xs'
                  : 'text-[#75665D] hover:text-[#30231F]'
              }`}
            >
              <Video size={13} /> Videos Only
            </button>
            <button
              type="button"
              onClick={() => handleDisplayModeChange('image_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'image_only'
                  ? 'bg-[#800020] text-white shadow-xs'
                  : 'text-[#75665D] hover:text-[#30231F]'
              }`}
            >
              <ImageIcon size={13} /> Photos Only
            </button>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#800020] hover:bg-[#650018] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#800020]/20 cursor-pointer"
          >
            <Plus size={15} /> Add New Slide
          </button>
        </div>
      </div>

      {/* ── Live Interactive Preview of Storefront Hero ── */}
      <div className="bg-white p-5 rounded-2xl border border-[#E9DCCB] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-3">
          <div className="flex items-center gap-2">
            <Eye size={16} className="text-[#800020]" />
            <h3 className="text-xs sm:text-sm font-serif font-bold uppercase tracking-wider text-[#30231F]">
              Live Storefront Hero Preview
            </h3>
            <span className="text-[11px] px-2 py-0.5 bg-[#800020]/10 text-[#800020] rounded-md font-semibold">
              Mode: {displayMode === 'all' ? 'Videos & Photos' : displayMode === 'video_only' ? 'Videos Only' : 'Photos Only'}
            </span>
          </div>

          {displaySlides.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#75665D] font-mono">
                Slide {previewSlideIdx + 1} of {displaySlides.length}
              </span>
              <button
                type="button"
                onClick={() => setPreviewSlideIdx(p => (p - 1 + displaySlides.length) % displaySlides.length)}
                className="w-7 h-7 rounded-lg border border-[#E9DCCB] flex items-center justify-center text-[#75665D] hover:text-[#800020] hover:bg-[#FCF9F4] cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setPreviewSlideIdx(p => (p + 1) % displaySlides.length)}
                className="w-7 h-7 rounded-lg border border-[#E9DCCB] flex items-center justify-center text-[#75665D] hover:text-[#800020] hover:bg-[#FCF9F4] cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* The simulated Hero box */}
        <div className="relative w-full h-[260px] sm:h-[340px] rounded-xl overflow-hidden bg-[#0a0d14] flex items-center">
          {/* Background Media */}
          <div className="absolute inset-0 z-0">
            {previewSlide.mediaType === 'video' || previewSlide.mediaUrl?.includes('.mp4') || previewSlide.mediaUrl?.includes('/video/') ? (
              <video
                key={previewSlide.mediaUrl}
                src={previewSlide.mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                poster={previewSlide.posterUrl || undefined}
                className="w-full h-full object-cover object-right md:object-center opacity-85"
              />
            ) : (
              <img
                key={previewSlide.mediaUrl}
                src={previewSlide.mediaUrl}
                alt={previewSlide.title}
                className="w-full h-full object-cover object-right md:object-center opacity-85"
              />
            )}
            {/* Cinematic overlays matching storefront */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0d14] via-[#0a0d14]/85 to-transparent sm:w-[68%] z-[1]" />
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0a0d14]/70 to-transparent z-[1]" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/70 to-transparent z-[1]" />
          </div>

          {/* Text and CTA */}
          <div className="relative z-10 max-w-lg px-6 sm:px-10 space-y-3">
            <span className="text-[#B88D46] text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] block">
              {previewSlide.eyebrow || 'PREMIUM FRAGRANCES'}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl text-white font-normal leading-tight">
              {previewSlide.title || 'Fragrances That Define You'}
            </h1>
            <p className="text-zinc-300 text-xs sm:text-[13px] leading-relaxed line-clamp-2 max-w-md font-light">
              {previewSlide.description}
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#800020] text-white text-xs font-semibold tracking-wider">
                {previewSlide.ctaText || 'Shop Now'} <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Type Badge */}
          <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full bg-black/60 border border-white/20 text-white text-[11px] font-mono flex items-center gap-1.5 backdrop-blur-xs">
            {previewSlide.mediaType === 'video' ? <Video size={12} className="text-[#B88D46]" /> : <ImageIcon size={12} className="text-[#B88D46]" />}
            <span className="uppercase">{previewSlide.mediaType || 'Media'}</span>
          </div>
        </div>
      </div>

      {/* ── Slides Management List ── */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-3">
          <div>
            <h3 className="font-serif text-base font-bold uppercase tracking-wider text-[#30231F]">
              Hero Slides List ({slides.length})
            </h3>
            <p className="text-xs text-[#75665D]">
              Slides appear in the homepage hero banner based on sort order and active status.
            </p>
          </div>

          {slides.length === 0 && !loading && (
            <button
              type="button"
              onClick={handleSeedDefaults}
              className="px-3.5 py-2 bg-[#B88D46] hover:bg-[#a67c37] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
            >
              Seed 3 Default Luxury Slides
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-[#75665D]">
            <RefreshCw size={20} className="animate-spin mx-auto text-[#800020] mb-2" />
            Loading slides...
          </div>
        ) : slides.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-[#FCF9F4] rounded-xl border border-dashed border-[#E9DCCB]">
            <p className="text-sm text-[#75665D]">No slides found in the collection.</p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleSeedDefaults}
                className="px-4 py-2 bg-[#800020] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Seed Default Slides
              </button>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 border border-[#800020] text-[#800020] text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
              >
                + Add Custom Slide
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {slides.map((s, idx) => {
              const isVid = s.mediaType === 'video' || s.mediaUrl?.includes('.mp4') || s.mediaUrl?.includes('/video/');
              return (
                <div
                  key={s.id || idx}
                  className={`border rounded-2xl p-4 flex flex-col justify-between transition-all ${
                    s.is_active !== false
                      ? 'bg-white border-[#E9DCCB] shadow-xs'
                      : 'bg-zinc-50 border-zinc-200 opacity-60'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Media Thumbnail */}
                    <div className="relative w-full h-36 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                      {isVid ? (
                        <video
                          src={s.mediaUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={s.mediaUrl}
                          alt={s.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-mono flex items-center gap-1">
                        {isVid ? <Video size={10} className="text-[#B88D46]" /> : <ImageIcon size={10} className="text-[#B88D46]" />}
                        <span className="uppercase">{s.mediaType || (isVid ? 'Video' : 'Photo')}</span>
                      </div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/70 text-white text-[10px] font-mono">
                        #{s.sort_order || idx + 1}
                      </div>
                    </div>

                    {/* Content Details */}
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#B88D46] block">
                        {s.eyebrow || 'PREMIUM FRAGRANCES'}
                      </span>
                      <h4 className="font-serif font-bold text-sm text-[#30231F] line-clamp-1 mt-0.5">
                        {s.title}
                      </h4>
                      <p className="text-xs text-[#75665D] line-clamp-2 mt-1 leading-relaxed">
                        {s.description}
                      </p>
                    </div>

                    {/* CTA Details */}
                    <div className="text-[11px] text-[#75665D] flex items-center justify-between pt-1 border-t border-[#E9DCCB]/60">
                      <span>Button: <strong className="text-[#30231F]">{s.ctaText || 'Shop Now'}</strong></span>
                      <span className="font-mono text-[10px] truncate max-w-[120px]">{s.ctaLink || '/shop'}</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#E9DCCB]/60">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(s)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                        s.is_active !== false
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'
                      }`}
                    >
                      {s.is_active !== false ? '● Active' : '○ Disabled'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 text-[#75665D] hover:text-[#800020] hover:bg-[#800020]/10 rounded-lg transition-colors cursor-pointer"
                        title="Edit slide"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlide(s.id, s.title)}
                        className="p-1.5 text-[#75665D] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete slide"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Slide Create / Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#E9DCCB] max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#30231F] uppercase tracking-wider">
                  {editingSlide ? 'Edit Hero Slide' : 'Add New Hero Slide'}
                </h3>
                <p className="text-xs text-[#75665D] mt-0.5">
                  Configure slider media (video or photo), headlines, and call to action.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-[#75665D] hover:text-[#30231F] rounded-xl hover:bg-zinc-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSlide} className="space-y-5">
              {/* 1. Media Type Selector: Video vs Photo */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                  Slide Media Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, mediaType: 'video' }))}
                    className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      formData.mediaType === 'video'
                        ? 'bg-[#800020] text-white border-[#800020] shadow-sm'
                        : 'bg-[#FCF9F4] text-[#75665D] border-[#E9DCCB] hover:text-[#30231F]'
                    }`}
                  >
                    <Video size={16} /> Video Slide
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
                    <ImageIcon size={16} /> Photo / Image Slide
                  </button>
                </div>
              </div>

              {/* 2. Media URL & File Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D]">
                    {formData.mediaType === 'video' ? 'Desktop Video File / URL' : 'Desktop Photo File / URL'} *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setPickerTargetField('mediaUrl');
                      setIsPickerOpen(true);
                    }}
                    className="text-[11px] text-[#800020] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    Select from Cloudinary Library
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData(p => ({ ...p, mediaUrl: e.target.value }))}
                    placeholder={
                      formData.mediaType === 'video'
                        ? 'https://.../video.mp4'
                        : 'https://.../photo.webp'
                    }
                    className="flex-1 px-3.5 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                  />
                  <input
                    type="file"
                    ref={desktopFileInputRef}
                    accept={formData.mediaType === 'video' ? 'video/mp4,video/webm,video/quicktime' : 'image/*'}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0], 'mediaUrl')}
                  />
                  <button
                    type="button"
                    disabled={uploadingField === 'mediaUrl'}
                    onClick={() => desktopFileInputRef.current?.click()}
                    className="px-4 py-2.5 bg-[#B88D46] hover:bg-[#a67c37] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Upload size={14} />
                    {uploadingField === 'mediaUrl' ? `${uploadProgress}%` : 'Upload File'}
                  </button>
                </div>
                {uploadingField === 'mediaUrl' && (
                  <div className="w-full bg-zinc-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-[#800020] h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
              </div>

              {/* 3. Optional Mobile Media URL */}
              <div className="space-y-1.5">
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                  Mobile Media URL (Optional vertical crop)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.mobileMediaUrl}
                    onChange={(e) => setFormData(p => ({ ...p, mobileMediaUrl: e.target.value }))}
                    placeholder="Optional mobile media URL"
                    className="flex-1 px-3.5 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
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
                    className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-xl cursor-pointer shrink-0"
                  >
                    Upload Mobile
                  </button>
                </div>
              </div>

              {/* 4. Slide Typography & Content */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                    Eyebrow / Sub-tag *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.eyebrow}
                    onChange={(e) => setFormData(p => ({ ...p, eyebrow: e.target.value }))}
                    placeholder="PREMIUM FRAGRANCES"
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
                    placeholder="Fragrances That Define You"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                  Slide Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder="A perfect blend of luxury, elegance and long lasting impressions."
                  className="w-full px-3.5 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                />
              </div>

              {/* CTA Button Config */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                    CTA Button Label
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
                    CTA Button Link
                  </label>
                  <input
                    type="text"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData(p => ({ ...p, ctaLink: e.target.value }))}
                    placeholder="/shop"
                    className="w-full px-3.5 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                  />
                </div>
              </div>

              {/* Sort Order & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
                <div className="space-y-1">
                  <label className="text-[11px] uppercase tracking-wider font-bold text-[#75665D] block">
                    Slide Sort Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sort_order}
                    onChange={(e) => setFormData(p => ({ ...p, sort_order: Number(e.target.value) || 1 }))}
                    className="w-full px-3.5 py-2 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-xs text-[#30231F] outline-none focus:border-[#800020]"
                  />
                </div>

                <div className="pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                      className="w-4 h-4 text-[#800020] rounded border-[#E9DCCB] focus:ring-[#800020]"
                    />
                    <span className="text-xs font-semibold text-[#30231F]">
                      Active (Display in Slider)
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E9DCCB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-[#E9DCCB] rounded-xl text-xs font-semibold text-[#75665D] hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#800020] hover:bg-[#650018] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-[#800020]/20 cursor-pointer"
                >
                  {editingSlide ? 'Update Slide' : 'Create Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Cloudinary Media Picker Modal ── */}
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

export default HeroVideoManager;
