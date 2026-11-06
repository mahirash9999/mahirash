import React, { useState, useEffect } from 'react';
import { db } from './Firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { X, Search, Check, Upload, Image as ImageIcon, Trash2, RefreshCw } from 'lucide-react';
import uploadToCloudinary from '../utils/cloudinary';
import OptimizedCloudinaryImage from './OptimizedCloudinaryImage';

const CloudinaryMediaPickerModal = ({
  isOpen,
  onClose,
  onSelect,
  isMultiSelect = false
}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchVal, setSearchVal] = useState('');
  const [selectedUrls, setSelectedUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadMediaLibrary = async () => {
    setLoading(true);
    const urlSet = new Set();
    const mediaItems = [];

    try {
      // 1. Primary: load from media_library collection
      try {
        const mediaSnap = await getDocs(query(collection(db, 'media_library'), orderBy('createdAt', 'desc')));
        mediaSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.url && typeof data.url === 'string' && data.url.startsWith('http')) {
            if (!urlSet.has(data.url)) {
              urlSet.add(data.url);
              mediaItems.push({ id: d.id, url: data.url, name: data.name });
            }
          }
        });
      } catch (_) {
        const mediaSnap = await getDocs(collection(db, 'media_library'));
        mediaSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.url && typeof data.url === 'string' && data.url.startsWith('http')) {
            if (!urlSet.has(data.url)) {
              urlSet.add(data.url);
              mediaItems.push({ id: d.id, url: data.url, name: data.name });
            }
          }
        });
      }

      // 2. Fallback: scan other collections for any assets not yet in media_library
      const collectionNames = [
        'products',
        'categories',
        'subcategories',
        'collections',
        'brands',
        'hero_slides',
        'homepage_banners',
        'mobile_categories',
        'blogs'
      ];

      for (const colName of collectionNames) {
        try {
          const snap = await getDocs(collection(db, colName));
          snap.docs.forEach((d) => {
            const data = d.data();
            const candidates = [];
            if (data.image) candidates.push(data.image);
            if (data.logo) candidates.push(data.logo);
            if (data.desktopMedia) candidates.push(data.desktopMedia);
            if (data.mobileMedia) candidates.push(data.mobileMedia);
            if (Array.isArray(data.images)) candidates.push(...data.images);
            if (Array.isArray(data.sizePrices)) {
              data.sizePrices.forEach(sp => {
                if (Array.isArray(sp.images)) candidates.push(...sp.images);
              });
            }

            candidates.forEach((u) => {
              if (u && typeof u === 'string' && u.startsWith('http') && !urlSet.has(u)) {
                urlSet.add(u);
                mediaItems.push({ id: null, url: u, name: colName });
              }
            });
          });
        } catch (_) {}
      }
    } catch (err) {
      console.error("Error fetching media library images:", err);
    } finally {
      setImages(mediaItems);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    loadMediaLibrary();
    setSelectedUrls([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleSelectUrl = (url) => {
    if (isMultiSelect) {
      setSelectedUrls(prev =>
        prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
      );
    } else {
      setSelectedUrls([url]);
    }
  };

  const handleConfirm = () => {
    if (selectedUrls.length === 0) return;
    onSelect(isMultiSelect ? selectedUrls : selectedUrls[0]);
    onClose();
  };

  const handleDirectUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      setUploading(true);
      const newItems = [];
      for (const file of files) {
        const isVid = file.type?.startsWith('video/') || /\.(mp4|webm|mov|m4v)/i.test(file.name);
        const url = await uploadToCloudinary(file, isVid ? 'video' : 'product');
        if (url) {
          const docId = doc(collection(db, 'media_library')).id;
          const record = {
            id: docId,
            url,
            name: file.name,
            size: file.size,
            type: isVid ? 'video' : 'image',
            format: file.name.split('.').pop().toLowerCase(),
            createdAt: serverTimestamp()
          };
          await setDoc(doc(db, 'media_library', docId), record).catch(() => {});
          newItems.push({ id: docId, url, name: file.name });
        }
      }

      setImages(prev => [...newItems, ...prev]);
      const newUrls = newItems.map(i => i.url);
      if (isMultiSelect) {
        setSelectedUrls(prev => [...prev, ...newUrls]);
      } else {
        setSelectedUrls([newUrls[0]]);
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteItem = async (item, e) => {
    e.stopPropagation();
    if (!window.confirm("Remove this image from library?")) return;
    try {
      if (item.id) {
        await deleteDoc(doc(db, 'media_library', item.id)).catch(() => {});
      }
      setImages(prev => prev.filter(i => i.url !== item.url));
      setSelectedUrls(prev => prev.filter(u => u !== item.url));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const filteredImages = images.filter(item =>
    item.url.toLowerCase().includes(searchVal.toLowerCase()) ||
    (item.name && item.name.toLowerCase().includes(searchVal.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-[#FCF9F4] border border-[#E9DCCB] rounded-2xl max-w-4xl w-full flex flex-col max-h-[88vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-[#E9DCCB] bg-white">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#30231F] flex items-center gap-2">
              <ImageIcon size={18} className="text-[#800020]" />
              Cloudinary Media Library
            </h3>
            <p className="text-[12px] text-[#75665D] mt-0.5">
              {isMultiSelect
                ? 'Select one or multiple images to add to the gallery.'
                : 'Choose an image from your Cloudinary library, or upload new files.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-[#800020] p-1.5 rounded-full hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-3.5 border-b border-[#E9DCCB] bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search images by name or link..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-lg text-xs text-[#30231F] focus:border-[#800020] outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={loadMediaLibrary}
              disabled={loading}
              className="p-2 border border-[#E9DCCB] bg-white hover:bg-[#FCF9F4] rounded-lg text-[#30231F] cursor-pointer transition-colors"
              title="Refresh"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <label className="flex items-center gap-1.5 px-3 py-1.5 bg-[#800020] hover:bg-[#66001a] text-white rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer transition-all shadow-xs">
              <Upload size={13} />
              <span>{uploading ? 'Uploading...' : 'Upload New'}</span>
              <input
                type="file"
                accept="image/*,video/*"
                multiple={true}
                onChange={handleDirectUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#FCF9F4]">
          {loading ? (
            <div className="py-20 text-center text-[#75665D] text-xs uppercase tracking-wider font-semibold">
              Loading Cloudinary Media Library...
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="py-20 text-center space-y-2">
              <ImageIcon size={32} className="text-[#800020]/40 mx-auto" />
              <p className="text-xs text-[#75665D]">No images found. Upload files using the button above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
              {filteredImages.map((item, idx) => {
                const isSelected = selectedUrls.includes(item.url);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelectUrl(item.url)}
                    className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-white shadow-xs ${
                      isSelected
                        ? 'border-[#800020] ring-2 ring-[#800020]/20 scale-[0.98]'
                        : 'border-[#E9DCCB] hover:border-[#800020]'
                    }`}
                  >
                    <OptimizedCloudinaryImage
                      src={item.url}
                      alt={item.name || `cloud-${idx}`}
                      preset="category"
                      className="w-full h-full object-cover"
                    />

                    {/* Delete hover icon */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteItem(item, e)}
                      className="absolute bottom-1.5 right-1.5 z-10 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity shadow"
                      title="Delete from library"
                    >
                      <Trash2 size={11} />
                    </button>

                    {/* Checkmark overlay */}
                    <div
                      className={`absolute inset-0 bg-[#800020]/25 flex items-center justify-center transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-20'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-[#800020] text-white shadow-md' : 'bg-white text-zinc-900'
                        }`}
                      >
                        <Check size={13} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#E9DCCB] bg-white flex justify-between items-center">
          <span className="text-xs font-semibold text-[#30231F]">
            {selectedUrls.length} {selectedUrls.length === 1 ? 'asset' : 'assets'} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#E9DCCB] text-[#75665D] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#FCF9F4] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="px-5 py-2 bg-[#800020] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#66001a] disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {isMultiSelect ? `Insert Selected (${selectedUrls.length})` : 'Use Selected Asset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudinaryMediaPickerModal;
