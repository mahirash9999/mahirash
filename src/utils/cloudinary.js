import axios from "axios";
import {
  compressImageBeforeUpload,
  getCachedUploadUrl,
  setCachedUploadUrl,
  getOptimizedCloudinaryUrl,
} from "./cloudinaryUtils";

// Cloudinary configuration strictly from environment variables (.env)
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "";

export const uploadToCloudinary = async (file, uploadType = "product", onProgress = null) => {
  const activeCloud = CLOUDINARY_CLOUD_NAME;
  const activePreset = CLOUDINARY_UPLOAD_PRESET;

  if (!file) return null;

  if (!activeCloud || !activePreset) {
    throw new Error(
      "Cloudinary configuration missing: Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file."
    );
  }

  // Check if file is a video by MIME type, uploadType flag, or file extension
  const isVideo =
    (file.type && file.type.startsWith("video/")) ||
    uploadType === "video" ||
    (file.name && /\.(mp4|webm|mov|m4v|mkv|avi|3gp)$/i.test(file.name));

  // 1. Upload Protection: Deduplication Check
  const cachedUrl = await getCachedUploadUrl(file);
  if (cachedUrl) {
    console.log("Reusing existing Cloudinary asset (deduplicated upload):", cachedUrl);
    if (onProgress) onProgress(100);
    return cachedUrl;
  }

  // 2. Browser-side Compression Before Upload (skip for videos)
  const fileToUpload = isVideo ? file : await compressImageBeforeUpload(file, uploadType);

  // Try endpoints: image -> auto (or video -> auto for videos)
  const endpointsToTry = isVideo
    ? [
      `https://api.cloudinary.com/v1_1/${activeCloud}/video/upload`,
      `https://api.cloudinary.com/v1_1/${activeCloud}/auto/upload`
    ]
    : [
      `https://api.cloudinary.com/v1_1/${activeCloud}/image/upload`,
      `https://api.cloudinary.com/v1_1/${activeCloud}/auto/upload`
    ];

  let lastErrorMsg = "";

  for (const uploadUrl of endpointsToTry) {
    try {
      const data = new FormData();
      data.append("file", fileToUpload);
      data.append("upload_preset", activePreset);

      const res = await axios.post(uploadUrl, data, {
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      });

      if (res.data && res.data.secure_url) {
        const secureUrl = res.data.secure_url;
        console.log(`Cloudinary Upload Success [${uploadUrl}]:`, secureUrl);
        await setCachedUploadUrl(file, secureUrl);
        return secureUrl;
      }
    } catch (err) {
      const cloudMsg = err?.response?.data?.error?.message || err?.message;
      console.warn(`Cloudinary upload attempt failed [${uploadUrl}]:`, cloudMsg);
      lastErrorMsg = cloudMsg;
    }
  }

  throw new Error(`Cloudinary Upload Failed: ${lastErrorMsg || "Unknown error"}`);
};

export { getOptimizedCloudinaryUrl };
export default uploadToCloudinary;

