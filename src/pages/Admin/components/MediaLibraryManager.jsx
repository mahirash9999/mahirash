import React, { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../../../components/Firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from "firebase/firestore";
import {
  Image as ImageIcon,
  Video,
  Upload,
  Trash2,
  Check,
  Copy,
  Search,
  RefreshCw,
  X,
  Eye,
  CheckSquare,
  Square,
  AlertCircle,
  FileCheck,
  Sparkles,
  Film
} from "lucide-react";
import uploadToCloudinary from "../../../utils/cloudinary";
import OptimizedCloudinaryImage from "../../../components/OptimizedCloudinaryImage";

const MediaLibraryManager = () => {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "image" | "video"
  const [selectedIds, setSelectedIds] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total, percent, fileName }
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // 1. Fetch Media Library from Firestore (and harvest existing assets on first run)
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      let q = query(collection(db, "media_library"), orderBy("createdAt", "desc"));
      let snap;
      try {
        snap = await getDocs(q);
      } catch (_) {
        // Fallback without ordering if index is building
        snap = await getDocs(collection(db, "media_library"));
      }

      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate ? d.data().createdAt.toDate() : new Date()
      }));

      // If library is completely empty, harvest from existing collections to bootstrap
      if (list.length === 0) {
        console.log("Media library empty, bootstrapping from existing collections...");
        const harvested = await harvestExistingImages();
        setMediaList(harvested);
      } else {
        setMediaList(list);
      }
    } catch (err) {
      console.error("Error loading media library:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Harvest existing images from products, categories, etc., and persist them
  const harvestExistingImages = async () => {
    const harvested = [];
    const urlSet = new Set();
    const collectionsToScan = [
      "products",
      "categories",
      "subcategories",
      "collections",
      "brands",
      "hero_slides",
      "homepage_banners",
      "blogs",
      "mobile_categories"
    ];

    try {
      for (const col of collectionsToScan) {
        try {
          const s = await getDocs(collection(db, col));
          for (const d of s.docs) {
            const data = d.data();
            const candidates = [];
            if (data.image) candidates.push({ url: data.image, name: data.name || col });
            if (data.logo) candidates.push({ url: data.logo, name: data.name || col });
            if (data.desktopMedia) candidates.push({ url: data.desktopMedia, name: `${col} desktop` });
            if (data.mobileMedia) candidates.push({ url: data.mobileMedia, name: `${col} mobile` });
            if (Array.isArray(data.images)) {
              data.images.forEach((img, idx) => candidates.push({ url: img, name: `${data.name || col} #${idx + 1}` }));
            }
            if (Array.isArray(data.sizePrices)) {
              data.sizePrices.forEach(sp => {
                if (Array.isArray(sp.images)) {
                  sp.images.forEach((img, idx) => candidates.push({ url: img, name: `${sp.size || 'Variant'} #${idx + 1}` }));
                }
              });
            }

            for (const cand of candidates) {
              if (cand.url && typeof cand.url === "string" && cand.url.startsWith("http") && !urlSet.has(cand.url)) {
                urlSet.add(cand.url);
                const isVid = /\.(mp4|webm|mov|m4v)/i.test(cand.url) || cand.url.includes("/video/upload/");
                const mediaDoc = {
                  url: cand.url,
                  name: cand.name || "Media Asset",
                  type: isVid ? "video" : "image",
                  format: cand.url.split(".").pop().split("?")[0] || "jpg",
                  createdAt: new Date(),
                  source: col
                };
                harvested.push(mediaDoc);
                // Background persist
                const newId = doc(collection(db, "media_library")).id;
                setDoc(doc(db, "media_library", newId), {
                  ...mediaDoc,
                  createdAt: serverTimestamp()
                }).catch(() => {});
              }
            }
          }
        } catch (_) {}
      }
    } catch (e) {
      console.warn("Bootstrap harvest warning:", e);
    }
    return harvested;
  };

  // 2. Batch Upload Handler
  const handleUploadFiles = async (files) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const total = fileArray.length;

    try {
      for (let i = 0; i < total; i++) {
        const file = fileArray[i];
        const isVideo = file.type?.startsWith("video/") || /\.(mp4|webm|mov|m4v|mkv)/i.test(file.name);

        setUploadProgress({
          current: i + 1,
          total,
          percent: 0,
          fileName: file.name
        });

        // Upload to Cloudinary
        const secureUrl = await uploadToCloudinary(
          file,
          isVideo ? "video" : "product",
          (percent) => {
            setUploadProgress(prev => prev ? { ...prev, percent } : null);
          }
        );

        if (secureUrl) {
          // Persist in Firestore media_library
          const docId = doc(collection(db, "media_library")).id;
          const newMediaRecord = {
            id: docId,
            url: secureUrl,
            name: file.name,
            size: file.size,
            type: isVideo ? "video" : "image",
            format: file.name.split(".").pop().toLowerCase(),
            createdAt: serverTimestamp()
          };

          await setDoc(doc(db, "media_library", docId), newMediaRecord);

          // Update local state immediately
          setMediaList(prev => [{ ...newMediaRecord, createdAt: new Date() }, ...prev]);
        }
      }
    } catch (err) {
      alert("Upload failed: " + (err.message || "Unknown error"));
    } finally {
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Drag and Drop
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer?.files?.length) {
      handleUploadFiles(e.dataTransfer.files);
    }
  };

  // 3. Selection Handlers
  const toggleSelectOne = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredList.map(item => item.id));
    }
  };

  // 4. Delete Single Media
  const handleDeleteSingle = async (item, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${item.name || 'this media file'}" from your library?`)) {
      return;
    }
    try {
      if (item.id) {
        await deleteDoc(doc(db, "media_library", item.id));
      }
      setMediaList(prev => prev.filter(x => x.id !== item.id && x.url !== item.url));
      setSelectedIds(prev => prev.filter(id => id !== item.id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // 5. Bulk Delete Selected Media
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected media files?`)) {
      return;
    }
    try {
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "media_library", id)).catch(() => {});
      }
      setMediaList(prev => prev.filter(x => !selectedIds.includes(x.id)));
      setSelectedIds([]);
    } catch (err) {
      alert("Bulk delete failed: " + err.message);
    }
  };

  // 6. Copy URL helper
  const handleCopyUrl = (url, e) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  // 7. Filtering & Search
  const filteredList = mediaList.filter(item => {
    if (activeFilter === "image" && item.type !== "image") return false;
    if (activeFilter === "video" && item.type !== "video") return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name?.toLowerCase().includes(q);
      const matchUrl = item.url?.toLowerCase().includes(q);
      return matchName || matchUrl;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9DCCB] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-serif font-bold uppercase tracking-wider text-[#30231F] flex items-center gap-2.5">
              <ImageIcon className="text-[#800020]" size={24} />
              Media Library (Cloudinary)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#75665D] mt-1">
            Upload, preview, and batch-manage your fragrance imagery and videos. All assets are available in product, category, and banner forms.
          </p>
        </div>

        {/* Quick Upload CTA */}
        <div className="flex items-center gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => handleUploadFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={fetchMedia}
            disabled={loading}
            className="p-2.5 bg-white border border-[#E9DCCB] rounded-xl hover:bg-[#FCF9F4] text-[#30231F] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Refresh Library"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-[#800020] text-white text-xs sm:text-sm font-bold uppercase tracking-wider rounded-xl hover:bg-[#66001a] transition-all flex items-center gap-2 cursor-pointer shadow-md shadow-[#800020]/20"
          >
            <Upload size={16} />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* ── Drag & Drop Upload Zone ── */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 sm:p-8 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
          isDragOver
            ? "border-[#800020] bg-[#800020]/5 scale-[0.99]"
            : "border-[#E9DCCB] bg-white hover:border-[#800020]/60 hover:bg-[#FCF9F4]"
        }`}
      >
        <div className="max-w-md mx-auto space-y-2 pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-[#FCF9F4] border border-[#E9DCCB] mx-auto flex items-center justify-center text-[#800020]">
            <Upload size={20} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#30231F]">
            Drag & Drop photos or videos here, or <span className="text-[#800020] underline">browse files</span>
          </h3>
          <p className="text-xs text-[#75665D]">
            Select multiple images or videos at once. High-resolution JPG, PNG, WEBP, MP4 supported.
          </p>
        </div>
      </div>

      {/* ── Live Batch Upload Progress Bar ── */}
      {uploadProgress && (
        <div className="p-4 bg-white border border-[#E9DCCB] rounded-xl shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[#800020] flex items-center gap-2">
              <RefreshCw size={13} className="animate-spin text-[#800020]" />
              Uploading {uploadProgress.current} of {uploadProgress.total}:
              <span className="text-[#30231F] font-normal truncate max-w-xs">{uploadProgress.fileName}</span>
            </span>
            <span className="font-mono font-bold text-[#30231F]">{uploadProgress.percent}%</span>
          </div>
          <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#800020] transition-all duration-200"
              style={{ width: `${uploadProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Toolbar: Search, Filters & Bulk Actions ── */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-white p-3.5 border border-[#E9DCCB] rounded-xl">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media by filename or link..."
            className="w-full pl-10 pr-4 py-2 bg-[#FCF9F4] border border-[#E9DCCB] rounded-lg text-xs text-[#30231F] outline-none focus:border-[#800020] transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
              activeFilter === "all"
                ? "bg-[#800020] text-white border-[#800020]"
                : "bg-white text-[#75665D] border-[#E9DCCB] hover:border-[#800020]"
            }`}
          >
            All ({mediaList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("image")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === "image"
                ? "bg-[#800020] text-white border-[#800020]"
                : "bg-white text-[#75665D] border-[#E9DCCB] hover:border-[#800020]"
            }`}
          >
            <ImageIcon size={12} /> Images ({mediaList.filter(m => m.type === "image").length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("video")}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
              activeFilter === "video"
                ? "bg-[#800020] text-white border-[#800020]"
                : "bg-white text-[#75665D] border-[#E9DCCB] hover:border-[#800020]"
            }`}
          >
            <Video size={12} /> Videos ({mediaList.filter(m => m.type === "video").length})
          </button>
        </div>
      </div>

      {/* ── Selection Action Bar (Shown when items are selected) ── */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-[#800020]/10 border border-[#800020]/30 rounded-xl animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5">
            <CheckSquare size={16} className="text-[#800020]" />
            <span className="text-xs font-bold text-[#800020] uppercase tracking-wider">
              {selectedIds.length} {selectedIds.length === 1 ? "Item" : "Items"} Selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 size={13} />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-700 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* ── Select All Toggle Button ── */}
      {filteredList.length > 0 && (
        <div className="flex items-center justify-between text-xs text-[#75665D] px-1">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 font-bold hover:text-[#800020] cursor-pointer"
          >
            {selectedIds.length === filteredList.length ? (
              <>
                <CheckSquare size={14} className="text-[#800020]" />
                <span>Deselect All ({filteredList.length})</span>
              </>
            ) : (
              <>
                <Square size={14} />
                <span>Select All ({filteredList.length})</span>
              </>
            )}
          </button>
          <span>Showing {filteredList.length} media files</span>
        </div>
      )}

      {/* ── Media Grid ── */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <RefreshCw size={24} className="animate-spin text-[#800020] mx-auto" />
          <p className="text-xs text-[#75665D] uppercase tracking-widest font-semibold">
            Loading Media Assets...
          </p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="py-20 text-center bg-white border border-[#E9DCCB] rounded-2xl space-y-3 p-8">
          <div className="w-14 h-14 rounded-full bg-[#FCF9F4] border border-[#E9DCCB] mx-auto flex items-center justify-center text-[#800020]">
            <ImageIcon size={24} />
          </div>
          <h3 className="text-base font-serif font-bold text-[#30231F]">No Media Files Found</h3>
          <p className="text-xs text-[#75665D] max-w-sm mx-auto">
            {searchQuery
              ? `No files match "${searchQuery}". Try clearing search filter.`
              : "Upload high-resolution images or videos above to populate your Cloudinary media library."}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-[#800020] text-white text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#66001a] transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <Upload size={13} /> Upload First File
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5">
          {filteredList.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isVid = item.type === "video" || /\.(mp4|webm|mov|m4v)/i.test(item.url);

            return (
              <div
                key={item.id || item.url}
                onClick={() => toggleSelectOne(item.id)}
                className={`group relative bg-white border-2 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 flex flex-col ${
                  isSelected
                    ? "border-[#800020] ring-2 ring-[#800020]/20 shadow-md scale-[0.98]"
                    : "border-[#E9DCCB] hover:border-[#800020]/60 hover:shadow-md"
                }`}
              >
                {/* Media Preview Box */}
                <div className="relative aspect-square w-full bg-[#FCF9F4] overflow-hidden">
                  {isVid ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-white relative">
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        onMouseOver={(e) => e.target.play().catch(() => {})}
                        onMouseOut={(e) => e.target.pause()}
                      />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold uppercase rounded flex items-center gap-1">
                        <Film size={10} /> Video
                      </div>
                    </div>
                  ) : (
                    <OptimizedCloudinaryImage
                      src={item.url}
                      preset="category"
                      alt={item.name || "Media"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}

                  {/* Top-Left Selection Checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectOne(item.id);
                    }}
                    className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-[#800020] text-white shadow"
                        : "bg-white/80 backdrop-blur-xs text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-black border border-zinc-200"
                    }`}
                  >
                    {isSelected ? <Check size={14} strokeWidth={3} /> : <Square size={13} />}
                  </div>

                  {/* Hover Action Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewItem(item);
                      }}
                      className="p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-lg shadow-sm hover:scale-105 transition-all"
                      title="Preview full size"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleCopyUrl(item.url, e)}
                      className="p-2 bg-white/90 hover:bg-white text-zinc-900 rounded-lg shadow-sm hover:scale-105 transition-all"
                      title="Copy URL"
                    >
                      {copiedUrl === item.url ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingle(item, e)}
                      className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm hover:scale-105 transition-all"
                      title="Delete asset"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* File Details Footer */}
                <div className="p-2.5 bg-white border-t border-zinc-100 flex flex-col justify-between flex-1">
                  <p className="text-[11px] font-semibold text-[#30231F] truncate" title={item.name}>
                    {item.name || "Media File"}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-[#75665D] mt-1 font-mono">
                    <span className="uppercase">{item.format || (isVid ? "MP4" : "JPG")}</span>
                    {item.size ? (
                      <span>{(item.size / 1024 / 1024).toFixed(1)} MB</span>
                    ) : (
                      <span>Cloudinary</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Fullscreen Preview Modal ── */}
      {previewItem && (
        <div
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#E9DCCB] rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-4 p-5"
          >
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div className="truncate pr-4">
                <h3 className="text-sm font-bold text-[#30231F] truncate">{previewItem.name || "Media Preview"}</h3>
                <p className="text-xs text-[#75665D] font-mono mt-0.5 truncate">{previewItem.url}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1.5 text-zinc-400 hover:text-black rounded-lg hover:bg-zinc-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Media Rendering */}
            <div className="max-h-[60vh] flex items-center justify-center bg-[#FCF9F4] rounded-xl overflow-hidden p-2">
              {previewItem.type === "video" ? (
                <video src={previewItem.url} controls autoPlay className="max-h-[55vh] max-w-full rounded-lg" />
              ) : (
                <img src={previewItem.url} alt={previewItem.name} className="max-h-[55vh] max-w-full object-contain rounded-lg" />
              )}
            </div>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={(e) => handleCopyUrl(previewItem.url, e)}
                className="px-4 py-2 border border-[#E9DCCB] rounded-lg bg-white hover:bg-[#FCF9F4] text-xs font-bold text-[#30231F] flex items-center gap-1.5 cursor-pointer"
              >
                {copiedUrl === previewItem.url ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copiedUrl === previewItem.url ? "URL Copied to Clipboard!" : "Copy Asset URL"}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    handleDeleteSingle(previewItem, e);
                    setPreviewItem(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaLibraryManager;

