import React, { useState, useEffect } from 'react';
import { db } from './Firebase';
import { collection, getDocs } from 'firebase/firestore';
import { X, Search, Check, Upload, Image as ImageIcon } from 'lucide-react';
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

  useEffect(() => {
    if (!isOpen) return;
    const loadMediaLibrary = async () => {
      setLoading(true);
      const urlSet = new Set();
      const collectionNames = [
        'products',
        'categories',
        'subcategories',
        'collections',
        'shop_by_category',
        'shop_the_look',
        'mobile_categories',
        'hero_slides',
        'community_images',
        'blogs'
      ];

      try {
        for (const colName of collectionNames) {
          const snap = await getDocs(collection(db, colName));
          snap.docs.forEach((doc) => {
            const data = doc.data();
            if (data.image && typeof data.image === 'string') urlSet.add(data.image);
            if (data.mobileImage && typeof data.mobileImage === 'string') urlSet.add(data.mobileImage);
            if (data.tabletImage && typeof data.tabletImage === 'string') urlSet.add(data.tabletImage);
            if (data.model_image && typeof data.model_image === 'string') urlSet.add(data.model_image);
            if (Array.isArray(data.images)) {
              data.images.forEach((imgUrl) => {
                if (imgUrl && typeof imgUrl === 'string') urlSet.add(imgUrl);
              });
            }
          });
        }
      } catch (err) {
        console.error("Error fetching media library images:", err);
      } finally {
        const uniqueUrls = Array.from(urlSet).filter(url => url.startsWith('http'));
        setImages(uniqueUrls);
        setLoading(false);
      }
    };

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
      const newUrls = [];
      for (const file of files) {
        const url = await uploadToCloudinary(file);
        newUrls.push(url);
      }
      setImages(prev => [...newUrls, ...prev]);
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

  const filteredImages = images.filter(url =>
    url.toLowerCase().includes(searchVal.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white border border-zinc-200 rounded-2xl max-w-3xl w-full flex flex-col max-h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-200 bg-zinc-50">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <ImageIcon size={18} className="text-[#b8860b]" />
              Cloudinary Media Library
            </h3>
            <p className="text-[11px] text-zinc-500 font-light mt-0.5">
              {isMultiSelect ? 'Select one or more images from previously uploaded Cloudinary media.' : 'Select an image from Cloudinary media library.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-black p-1.5 rounded-full hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-200 bg-white flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter images..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 focus:bg-white focus:border-black outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg text-[14px] font-medium text-zinc-800 cursor-pointer transition-all">
              <Upload size={14} />
              <span>{uploading ? 'Uploading...' : 'Upload New File'}</span>
              <input
                type="file"
                accept="image/*"
                multiple={isMultiSelect}
                onChange={handleDirectUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Image Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/50">
          {loading ? (
            <div className="py-16 text-center text-zinc-500 text-[14px]">Loading media library...</div>
          ) : filteredImages.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-[14px]">No images found in library.</div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {filteredImages.map((url, idx) => {
                const isSelected = selectedUrls.includes(url);
                return (
                  <div
                    key={idx}
                    onClick={() => toggleSelectUrl(url)}
                    className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all bg-white ${
                      isSelected ? 'border-black ring-2 ring-black/20 scale-[0.98]' : 'border-zinc-200 hover:border-zinc-400'
                    }`}
                  >
                    <OptimizedCloudinaryImage
                      src={url}
                      alt={`cloud-${idx}`}
                      preset="category"
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay Checkmark */}
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'
                    }`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-black text-white shadow-md' : 'bg-white/80 text-zinc-900'
                      }`}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-200 bg-white flex justify-between items-center">
          <span className="text-[14px] text-zinc-600 font-medium">
            {selectedUrls.length} {selectedUrls.length === 1 ? 'image' : 'images'} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-300 text-zinc-700 text-[14px] font-medium rounded-lg hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedUrls.length === 0}
              className="px-5 py-2 bg-black text-white text-[14px] font-medium rounded-lg hover:bg-zinc-800 disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {isMultiSelect ? `Use Selected (${selectedUrls.length})` : 'Use Selected Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CloudinaryMediaPickerModal;
