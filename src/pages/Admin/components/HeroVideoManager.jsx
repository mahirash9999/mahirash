import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../../components/Firebase';
import { collection, doc, getDocs, setDoc, query } from 'firebase/firestore';
import uploadToCloudinary from '../../../utils/cloudinary';
import { Video, Upload, CheckCircle2, AlertCircle, Play, Pause, RefreshCw, Smartphone, Monitor, Image as ImageIcon, Sparkles, Trash2, Eye } from 'lucide-react';
import CloudinaryMediaPickerModal from '../../../components/CloudinaryMediaPickerModal';

const FALLBACK_LUXURY_VIDEO = 'https://assets.mixkit.co/videos/preview/mixkit-perfume-bottle-in-a-glass-display-41525-large.mp4';

const HeroVideoManager = () => {
  const [videoConfig, setVideoConfig] = useState({
    videoUrl: '',
    mobileVideoUrl: '',
    posterUrl: '',
    is_active: true,
    title: 'Mahirash Luxury Fragrance Video Hero'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeUploadField, setActiveUploadField] = useState(null); // 'videoUrl' | 'mobileVideoUrl' | 'posterUrl'
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerTargetField, setPickerTargetField] = useState('videoUrl');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const mobileFileInputRef = useRef(null);
  const posterFileInputRef = useRef(null);

  // Fetch current video settings from Firestore
  useEffect(() => {
    fetchHeroVideo();
  }, []);

  const fetchHeroVideo = async () => {
    setLoading(true);
    try {
      // 0. Check localStorage first
      const localStr = localStorage.getItem('mahirash_hero_video_config');
      if (localStr) {
        try {
          const parsed = JSON.parse(localStr);
          if (parsed && parsed.videoUrl) {
            setVideoConfig(parsed);
          }
        } catch (e) {
          // ignore
        }
      }

      // 1. Try fetching from dedicated 'hero_video' collection
      const q = query(collection(db, 'hero_video'));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const data = snap.docs[0].data();
        const conf = {
          id: snap.docs[0].id,
          videoUrl: data.videoUrl || data.url || '',
          mobileVideoUrl: data.mobileVideoUrl || '',
          posterUrl: data.posterUrl || '',
          is_active: data.is_active !== undefined ? data.is_active : true,
          title: data.title || 'Mahirash Hero Video'
        };
        setVideoConfig(conf);
        localStorage.setItem('mahirash_hero_video_config', JSON.stringify(conf));
      } else {
        // 2. Fallback check 'hero_slides' collection
        const slidesSnap = await getDocs(query(collection(db, 'hero_slides')));
        if (!slidesSnap.empty) {
          const firstSlide = slidesSnap.docs[0].data();
          const foundVideo = firstSlide.image && (
            firstSlide.image.endsWith('.mp4') ||
            firstSlide.image.includes('/video/upload/') ||
            firstSlide.image.endsWith('.webm') ||
            firstSlide.image.endsWith('.mov')
          ) ? firstSlide.image : '';

          const conf = {
            id: slidesSnap.docs[0].id,
            videoUrl: foundVideo || FALLBACK_LUXURY_VIDEO,
            mobileVideoUrl: firstSlide.mobileImage || '',
            posterUrl: firstSlide.posterUrl || '',
            is_active: firstSlide.is_active !== undefined ? firstSlide.is_active : true,
            title: firstSlide.title || 'Mahirash Hero Video'
          };
          setVideoConfig(conf);
          localStorage.setItem('mahirash_hero_video_config', JSON.stringify(conf));
        }
      }
    } catch (err) {
      console.warn("Error fetching hero video from Firestore:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file, fieldKey) => {
    if (!file) return;
    try {
      setActiveUploadField(fieldKey);
      setUploadProgress(0);
      setStatusMessage({ type: 'info', text: `Uploading ${file.name}...` });

      const isVideoField = fieldKey === 'videoUrl' || fieldKey === 'mobileVideoUrl';
      const uploadType = isVideoField ? 'video' : 'banner';

      const uploadedUrl = await uploadToCloudinary(file, uploadType, (percent) => {
        setUploadProgress(percent);
      });

      if (uploadedUrl) {
        setVideoConfig(prev => {
          const updated = { ...prev, [fieldKey]: uploadedUrl };
          localStorage.setItem('mahirash_hero_video_config', JSON.stringify(updated));
          return updated;
        });
        setStatusMessage({ type: 'success', text: `Successfully uploaded ${file.name}! Live preview updated below.` });
      }
    } catch (err) {
      console.error("Upload error:", err);
      const cloudMsg = err?.response?.data?.error?.message || err?.message || "Upload failed";
      setStatusMessage({ type: 'error', text: `Upload failed: ${cloudMsg}` });
    } finally {
      setActiveUploadField(null);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!videoConfig.videoUrl) {
      setStatusMessage({ type: 'error', text: 'Please provide a Desktop Video URL or upload a video file.' });
      return;
    }

    setSaving(true);
    setStatusMessage({ type: 'info', text: 'Saving video configuration...' });

    try {
      const docId = videoConfig.id || 'main_hero_video';
      const payload = {
        videoUrl: videoConfig.videoUrl,
        mobileVideoUrl: videoConfig.mobileVideoUrl || '',
        posterUrl: videoConfig.posterUrl || '',
        is_active: videoConfig.is_active,
        updatedAt: new Date().toISOString(),
        title: videoConfig.title || 'Mahirash Hero Video'
      };

      // 1. Save to LocalStorage immediately
      localStorage.setItem('mahirash_hero_video_config', JSON.stringify({ ...videoConfig, ...payload }));

      // 2. Sync to Firestore (with try-catch safety)
      try {
        await setDoc(doc(db, 'hero_video', docId), payload);
      } catch (fsErr1) {
        console.warn("Firestore hero_video write skipped or error:", fsErr1.message);
      }

      try {
        await setDoc(doc(db, 'hero_slides', 'hero_main'), {
          image: videoConfig.videoUrl,
          mobileImage: videoConfig.mobileVideoUrl || '',
          posterUrl: videoConfig.posterUrl || '',
          is_active: videoConfig.is_active,
          title: 'Homepage Video Hero',
          updatedAt: new Date().toISOString()
        });
      } catch (fsErr2) {
        console.warn("Firestore hero_slides write skipped or error:", fsErr2.message);
      }

      setStatusMessage({ type: 'success', text: 'Hero Video saved & updated successfully! Live on homepage.' });
    } catch (err) {
      console.error("Error saving hero video:", err);
      setStatusMessage({ type: 'error', text: 'Save failed: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const openPicker = (fieldKey) => {
    setPickerTargetField(fieldKey);
    setIsPickerOpen(true);
  };

  const handleSelectMediaFromPicker = (url) => {
    setVideoConfig(prev => ({ ...prev, [pickerTargetField]: url }));
    setIsPickerOpen(false);
    setStatusMessage({ type: 'success', text: 'Selected media asset updated!' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-zinc-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-emerald-500" />
        <p className="text-sm font-medium">Loading Homepage Hero Video CMS...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E9DCCB] shadow-sm text-[#30231F] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#800020]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#800020]/10 text-[#800020] text-[12px] font-semibold tracking-wider uppercase border border-[#800020]/25">
              <Sparkles size={14} className="text-[#B88D46]" /> Premium Video Hero CMS
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#30231F] font-normal tracking-wide">Homepage Hero Video</h1>
            <p className="text-sm text-[#75665D] max-w-xl">
              Upload and manage the full-bleed textless video that plays on the homepage hero section. Supports MP4, WebM, and MOV formats.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving || activeUploadField !== null}
              className="inline-flex items-center gap-2 bg-[#800020] hover:bg-[#650018] disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md shadow-[#800020]/25 active:scale-95 cursor-pointer"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? 'Saving Changes...' : 'Save Video Settings'}
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast Alert */}
      {statusMessage.text && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${statusMessage.type === 'error'
          ? 'bg-rose-50 border-rose-200 text-rose-800'
          : statusMessage.type === 'success'
            ? 'bg-[#800020]/10 border-[#800020]/25 text-[#800020]'
            : 'bg-[#FCF9F4] border-[#E9DCCB] text-[#30231F]'
          }`}>
          <div className="flex items-center gap-3">
            {statusMessage.type === 'error' ? <AlertCircle className="shrink-0 text-rose-600" /> : <CheckCircle2 className="shrink-0 text-[#800020]" />}
            <span className="text-sm font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage({ type: '', text: '' })}
            className="text-[12px] uppercase tracking-wider font-semibold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Upload Controls vs Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Video Controls & File Uploads */}
        <div className="lg:col-span-7 space-y-6">

          {/* Status Toggle Card */}
          <div className="bg-white border border-[#E9DCCB] rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#30231F] flex items-center gap-2">
                Hero Video Display Status
              </h3>
              <p className="text-[13px] text-[#75665D]">
                When enabled, the video will play full-screen on the homepage.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={videoConfig.is_active}
                onChange={(e) => setVideoConfig(prev => ({ ...prev, is_active: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#800020]"></div>
            </label>
          </div>

          {/* Main Desktop Video Card */}
          <div className="bg-white border border-[#E9DCCB] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#FCF9F4] border border-[#E9DCCB] text-[#800020]">
                  <Monitor size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#30231F]">Desktop Hero Video (Primary)</h3>
                  <p className="text-[13px] text-[#75665D]">Main background video for desktop & laptop screens</p>
                </div>
              </div>
            </div>

            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#75665D]">
                Video Direct URL (.mp4, .webm)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoConfig.videoUrl}
                  onChange={(e) => setVideoConfig(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://res.cloudinary.com/.../hero_video.mp4"
                  className="flex-1 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl px-4 py-3 text-sm text-[#30231F] placeholder-[#75665D]/60 focus:outline-none focus:border-[#800020] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => openPicker('videoUrl')}
                  className="px-4 py-3 bg-[#FCF9F4] hover:bg-zinc-100 text-[#30231F] border border-[#E9DCCB] text-[13px] font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye size={14} className="text-[#800020]" /> Library
                </button>
              </div>
            </div>

            {/* Direct File Upload */}
            <div className="pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,.mp4,.webm,.mov,.m4v,.mkv,.avi"
                onChange={(e) => handleFileUpload(e.target.files[0], 'videoUrl')}
                className="hidden"
              />
              <button
                type="button"
                disabled={activeUploadField !== null}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-4 border-2 border-dashed border-[#E9DCCB] hover:border-[#800020] bg-[#FCF9F4]/60 hover:bg-[#FCF9F4] rounded-xl flex flex-col items-center justify-center gap-2 text-[#75665D] hover:text-[#30231F] transition-all group cursor-pointer"
              >
                <Upload className="w-5 h-5 group-hover:scale-110 text-[#800020] transition-transform" />
                <span className="text-[13px] font-medium">Click to upload Video file from computer (MP4, WEBM, MOV)</span>
              </button>

              {/* Upload Progress Bar */}
              {activeUploadField === 'videoUrl' && (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-[13px] text-[#800020] font-semibold">
                    <span>Uploading Desktop Video...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#E9DCCB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#800020] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Mobile Video Card */}
          <div className="bg-white border border-[#E9DCCB] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-[#E9DCCB] pb-4">
              <div className="p-2.5 rounded-xl bg-[#FCF9F4] border border-[#E9DCCB] text-[#800020]">
                <Smartphone size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#30231F]">Mobile Portrait Video (Optional)</h3>
                <p className="text-[13px] text-[#75665D]">Vertical 9:16 optimized video for mobile devices</p>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#75665D]">
                Mobile Video URL (Optional)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoConfig.mobileVideoUrl}
                  onChange={(e) => setVideoConfig(prev => ({ ...prev, mobileVideoUrl: e.target.value }))}
                  placeholder="https://res.cloudinary.com/.../mobile_hero.mp4"
                  className="flex-1 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl px-4 py-3 text-sm text-[#30231F] placeholder-[#75665D]/60 focus:outline-none focus:border-[#800020] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => openPicker('mobileVideoUrl')}
                  className="px-4 py-3 bg-[#FCF9F4] hover:bg-zinc-100 text-[#30231F] border border-[#E9DCCB] text-[13px] font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <Eye size={14} className="text-[#800020]" /> Library
                </button>
              </div>
            </div>

            <div className="pt-2">
              <input
                ref={mobileFileInputRef}
                type="file"
                accept="video/*,.mp4,.webm,.mov,.m4v,.mkv,.avi"
                onChange={(e) => handleFileUpload(e.target.files[0], 'mobileVideoUrl')}
                className="hidden"
              />
              <button
                type="button"
                disabled={activeUploadField !== null}
                onClick={() => mobileFileInputRef.current?.click()}
                className="w-full py-3 border border-[#E9DCCB] hover:border-[#800020] bg-[#FCF9F4]/60 hover:bg-[#FCF9F4] rounded-xl flex items-center justify-center gap-2 text-[13px] font-medium text-[#75665D] hover:text-[#30231F] transition-all cursor-pointer"
              >
                <Upload size={14} className="text-[#800020]" />
                Upload Mobile Portrait Video
              </button>

              {activeUploadField === 'mobileVideoUrl' && (
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[13px] text-[#800020] font-semibold">
                    <span>Uploading Mobile Video...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E9DCCB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#800020] transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Optional Poster Image Card */}
          <div className="bg-white border border-[#E9DCCB] rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-[#E9DCCB] pb-4">
              <div className="p-2.5 rounded-xl bg-[#FCF9F4] border border-[#E9DCCB] text-[#800020]">
                <ImageIcon size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#30231F]">Video Poster Frame (Optional)</h3>
                <p className="text-[13px] text-[#75665D]">Fallback image frame shown while video buffers</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoConfig.posterUrl}
                  onChange={(e) => setVideoConfig(prev => ({ ...prev, posterUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/... or Cloudinary URL"
                  className="flex-1 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl px-4 py-3 text-sm text-[#30231F] placeholder-[#75665D]/60 focus:outline-none focus:border-[#800020] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => openPicker('posterUrl')}
                  className="px-4 py-3 bg-[#FCF9F4] hover:bg-zinc-100 text-[#30231F] border border-[#E9DCCB] text-[13px] font-semibold rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Browse
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Live Interactive Video Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E9DCCB] rounded-2xl p-6 shadow-sm sticky top-8 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#800020] animate-pulse" />
                <h3 className="text-base font-semibold text-[#30231F]">Live Hero Preview</h3>
              </div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#800020] bg-[#800020]/10 border border-[#800020]/20 px-2.5 py-1 rounded-md">
                Pure Video / No Text
              </span>
            </div>

            {/* Video Player Box */}
            <div className="relative aspect-[9/16] sm:aspect-video rounded-xl overflow-hidden bg-black border border-[#E9DCCB] shadow-lg group">
              {videoConfig.videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoConfig.videoUrl}
                  poster={videoConfig.posterUrl || undefined}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-[#75665D]">
                  <Video className="w-12 h-12 mb-2 stroke-1 opacity-50" />
                  <p className="text-[13px]">No video configured yet. Upload or enter a video URL.</p>
                </div>
              )}

              {/* Ambient Edge Gradient Preview */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40 pointer-events-none" />

              {/* Play / Mute Control Overlay */}
              <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-[13px]">
                <button
                  type="button"
                  onClick={toggleVideoPlay}
                  className="p-1 hover:text-[#B88D46] transition-colors cursor-pointer"
                  title={isPlaying ? "Pause preview" : "Play preview"}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <span className="w-[1px] h-3 bg-white/20" />
                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="px-1 text-[11px] uppercase font-semibold tracking-wider hover:text-[#B88D46] transition-colors cursor-pointer"
                >
                  {isMuted ? 'Muted' : 'Sound On'}
                </button>
              </div>
            </div>

            <div className="bg-[#FCF9F4] p-4 rounded-xl border border-[#E9DCCB] space-y-2 text-[13px] text-[#75665D]">
              <div className="flex justify-between">
                <span className="text-[#75665D]">Status:</span>
                <span className={videoConfig.is_active ? "text-[#800020] font-semibold" : "text-rose-500 font-semibold"}>
                  {videoConfig.is_active ? "Active Live on Site" : "Hidden / Inactive"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#75665D]">Desktop Video:</span>
                <span className="truncate max-w-[200px] font-mono text-[#30231F] font-medium">{videoConfig.videoUrl ? 'Configured' : 'Missing'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#75665D]">Mobile Video:</span>
                <span className="font-mono text-[#30231F] font-medium">{videoConfig.mobileVideoUrl ? 'Custom Mobile Video Set' : 'Using Desktop Video'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setVideoConfig({
                videoUrl: FALLBACK_LUXURY_VIDEO,
                mobileVideoUrl: '',
                posterUrl: '',
                is_active: true,
                title: 'Mahirash Hero Video'
              })}
              className="w-full py-2.5 text-[14px] text-zinc-500 hover:text-zinc-700 bg-zinc-100/50 hover:bg-zinc-100 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={12} /> Reset to Default Luxury Video
            </button>
          </div>
        </div>

      </div>

      {/* Cloudinary Media Picker Modal */}
      {isPickerOpen && (
        <CloudinaryMediaPickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          onSelect={handleSelectMediaFromPicker}
          collectionName="hero_video"
        />
      )}
    </div>
  );
};

export default HeroVideoManager;
