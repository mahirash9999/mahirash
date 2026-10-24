import React, { useState, useEffect } from "react";
import {
  listenToNewsReels,
  addNewsReel,
  updateNewsReel,
  deleteNewsReel,
  reorderNewsReels,
} from "../../../services/newsService";
import { uploadToCloudinaryWithProgress, getOptimizedVideoUrl } from "../../../config/cloudinary";
import {
  Video,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Upload,
  Loader2,
  ArrowUp,
  ArrowDown,
  Instagram,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NewsManager = ({ isDarkMode = false }) => {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form Fields
  const [formData, setFormData] = useState({
    title: "",
    video: "",
    url: "",
    tag: "Luxury Edit",
    duration: "0:30",
  });

  useEffect(() => {
    const unsubscribe = listenToNewsReels(
      (data) => {
        setReels(data);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Failed to load news reels from database.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const openAddModal = () => {
    setEditingReel(null);
    setFormData({
      title: "",
      video: "",
      url: "https://www.instagram.com/mahirashparfumerie/",
      tag: "Luxury Edit",
      duration: "0:30",
    });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const openEditModal = (reel) => {
    setEditingReel(reel);
    setFormData({
      title: reel.title || "",
      video: reel.video || "",
      url: reel.url || "",
      tag: reel.tag || "Luxury Edit",
      duration: reel.duration || "0:30",
    });
    setError("");
    setSuccess("");
    setIsModalOpen(true);
  };

  const handleVideoFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/") && !file.type.startsWith("image/")) {
      setError("Please select a valid video file.");
      return;
    }

    setUploadingVideo(true);
    setUploadProgress(0);
    setError("");
    try {
      const uploadedUrl = await uploadToCloudinaryWithProgress(file, (percent) => {
        setUploadProgress(percent);
      });
      setFormData((prev) => ({ ...prev, video: uploadedUrl }));
      setSuccess("Video uploaded successfully to Cloudinary!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to upload video to Cloudinary.");
    } finally {
      setUploadingVideo(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError("Please enter a title for the video reel.");
      return;
    }
    if (!formData.video.trim()) {
      setError("Please upload a video or enter a video URL.");
      return;
    }
    if (!formData.url.trim()) {
      setError("Please enter an Instagram or external destination link.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      if (editingReel) {
        if (editingReel.isDefault) {
          await addNewsReel({
            ...formData,
            order: editingReel.order || Date.now(),
          });
        } else {
          await updateNewsReel(editingReel.id, formData);
        }
        setSuccess("Reel post updated successfully!");
      } else {
        const maxOrder = reels.length > 0 ? Math.max(...reels.map((r) => r.order || 0)) : 0;
        await addNewsReel({
          ...formData,
          order: maxOrder + 10,
        });
        setSuccess("New reel post added successfully!");
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccess(""), 3500);
    } catch (err) {
      console.error(err);
      setError("Operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reel) => {
    if (!window.confirm(`Are you sure you want to delete "${reel.title}"?`)) return;
    try {
      if (!reel.isDefault) {
        await deleteNewsReel(reel.id);
      }
      setReels((prev) => prev.filter((r) => r.id !== reel.id));
      setSuccess("Reel removed successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to delete reel.");
    }
  };

  const handleMove = async (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === reels.length - 1) return;

    const newReels = [...reels];
    const temp = newReels[index];
    newReels[index] = newReels[index + direction];
    newReels[index + direction] = temp;

    setReels(newReels);
    try {
      await reorderNewsReels(newReels);
    } catch (err) {
      console.error(err);
      setError("Failed to update display order.");
    }
  };

  // Styling classes based on dark/light theme
  const cardBg = "bg-white border-[#E9DCCB] shadow-sm";
  const modalBg = "bg-white border-[#E9DCCB] text-[#30231F]";
  const inputBg = "bg-[#FCF9F4] border-[#E9DCCB] text-[#30231F] focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20";
  const textMuted = "text-[#75665D]";
  const textHeader = "text-[#30231F]";

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${cardBg}`}>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Video className="text-[#800020]" size={22} />
            <h2 className={`text-xl font-serif font-bold ${textHeader}`}>Instagram Video Reels Manager</h2>
          </div>
          <p className={`text-sm ${textMuted}`}>
            Upload videos, manage Instagram reel links, and display captivating video reels in the "Moments That Inspire Us" section on the homepage.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#800020] text-white font-semibold rounded-xl hover:bg-[#650018] transition-all shadow-md shadow-[#800020]/25 active:scale-95 text-sm cursor-pointer"
        >
          <Plus size={16} />
          <span>Add Video / Reel</span>
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm flex items-center gap-2">
          <Check size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Reel Cards Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-[#b8860b]" size={32} />
          <p className={`text-sm ${textMuted}`}>Loading video reels...</p>
        </div>
      ) : reels.length === 0 ? (
        <div className={`p-12 text-center rounded-2xl border ${cardBg}`}>
          <Video className="mx-auto mb-3 text-zinc-400" size={40} />
          <h3 className={`text-lg font-semibold ${textHeader}`}>No Video Reels Added Yet</h3>
          <p className={`text-sm ${textMuted} max-w-md mx-auto mt-1 mb-4`}>
            Add video posts with Instagram links to showcase your luxury perfume collection reels on the homepage.
          </p>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 bg-[#b8860b] text-white font-semibold rounded-xl text-sm cursor-pointer"
          >
            Add First Reel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {reels.map((reel, index) => (
            <motion.div
              key={reel.id || index}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group relative rounded-2xl border overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${cardBg}`}
            >
              {/* Top Action Controls overlay */}
              <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[12px] font-bold tracking-wider">
                  <Instagram size={11} className="text-[#e8c37b]" />
                  <span>REEL</span>
                </div>
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl">
                  <button
                    onClick={() => handleMove(index, -1)}
                    disabled={index === 0}
                    className="p-1 text-white/80 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                    title="Move left/up"
                  >
                    <ArrowUp size={12} className="-rotate-90" />
                  </button>
                  <button
                    onClick={() => handleMove(index, 1)}
                    disabled={index === reels.length - 1}
                    className="p-1 text-white/80 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                    title="Move right/down"
                  >
                    <ArrowDown size={12} className="-rotate-90" />
                  </button>
                </div>
              </div>

              {/* Video Preview Aspect Box */}
              <div className="relative aspect-[9/16] bg-zinc-950 overflow-hidden">
                <video
                  src={getOptimizedVideoUrl(reel.video, { width: 360 })}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />

                {/* Bottom Overlay Info on Video */}
                <div className="absolute bottom-3 inset-x-3 text-white space-y-1 z-10">
                  <div className="flex items-center justify-between text-[12px] font-bold text-[#e8c37b]">
                    <span>✦ {reel.tag || "Luxury Edit"}</span>
                    <span>{reel.duration || "0:30"}</span>
                  </div>
                  <p className="text-xs font-serif font-medium line-clamp-2 leading-snug">
                    {reel.title}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="p-3 border-t border-zinc-200 dark:border-slate-700/40 flex items-center justify-between gap-2 text-xs">
                <a
                  href={reel.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#b8860b] font-semibold hover:underline truncate"
                  title={reel.url}
                >
                  <ExternalLink size={12} />
                  <span>Instagram Link</span>
                </a>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(reel)}
                    className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors cursor-pointer"
                    title="Edit Reel Video & Links"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(reel)}
                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 transition-colors cursor-pointer"
                    title="Delete Reel"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-2xl p-6 shadow-2xl border relative my-8 ${modalBg}`}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-zinc-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-[#b8860b]" size={20} />
                  <h3 className="text-lg font-bold">
                    {editingReel ? "Edit News Reel & Link" : "Add New Reel Post"}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-600">
                    Title / Caption *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Elegance That Speaks Without Words"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputBg}`}
                  />
                </div>

                {/* Video Upload or URL */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-600">
                    Video (File Upload or MP4 / Cloudinary URL) *
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        required
                        placeholder="https://res.cloudinary.com/.../video.mp4"
                        value={formData.video}
                        onChange={(e) => setFormData({ ...formData, video: e.target.value })}
                        className={`flex-1 px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputBg}`}
                      />
                      <label className="flex items-center gap-1.5 px-4 py-2.5 bg-zinc-900 text-white font-semibold rounded-xl text-xs cursor-pointer hover:bg-black transition-colors flex-shrink-0">
                        {uploadingVideo ? (
                          <Loader2 size={14} className="animate-spin text-[#e8c37b]" />
                        ) : (
                          <Upload size={14} />
                        )}
                        <span>{uploadingVideo ? "Uploading..." : "Upload File"}</span>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={handleVideoFileUpload}
                          disabled={uploadingVideo}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {uploadingVideo && (
                      <div className="mt-2.5 p-3 rounded-xl bg-[#b8860b]/10 border border-[#b8860b]/20 space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold text-[#b8860b]">
                          <span className="flex items-center gap-1.5">
                            <Loader2 size={13} className="animate-spin" /> Uploading Video...
                          </span>
                          <span className="font-mono text-sm">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-zinc-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#b8860b] to-[#d4af37] h-full transition-all duration-300 rounded-full"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <p className={`text-[12px] ${textMuted}`}>
                      You can paste an existing video URL or upload an MP4/video file directly to Cloudinary.
                    </p>
                  </div>
                </div>

                {/* Video Preview */}
                {formData.video && (
                  <div className="relative aspect-[16/9] bg-black rounded-xl overflow-hidden max-h-36">
                    <video
                      src={formData.video}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {/* Instagram Link */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-600">
                    Instagram Reel URL / Link *
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      required
                      placeholder="https://www.instagram.com/reel/..."
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputBg}`}
                    />
                    <Instagram size={15} className="absolute left-3 top-3 text-zinc-400" />
                  </div>
                </div>

                {/* Tag & Duration */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-600">
                      Tag / Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Luxury Edit"
                      value={formData.tag}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputBg}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-zinc-600">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 0:30"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all ${inputBg}`}
                    />
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E9DCCB]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-[#E9DCCB] text-sm font-semibold hover:bg-[#FCF9F4] text-[#75665D] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingVideo}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#800020] text-white font-semibold rounded-xl text-sm hover:bg-[#650018] shadow-md shadow-[#800020]/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    <span>{editingReel ? "Save Changes" : "Create Reel"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NewsManager;
