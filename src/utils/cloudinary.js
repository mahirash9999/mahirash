import axios from "axios";
import {
  compressImageBeforeUpload,
  getCachedUploadUrl,
  setCachedUploadUrl,
  getOptimizedCloudinaryUrl,
} from "./cloudinaryUtils";

export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadToCloudinary = async (file, uploadType = "product", onProgress = null) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Cloudinary configuration missing in environment variables.");
  }

  if (!file) return null;

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

  // Try endpoints: video -> auto -> image (for max compatibility with Cloudinary unsigned upload preset settings)
  const endpointsToTry = isVideo
    ? [
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
    ]
    : [
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`
    ];

  const presetsToTry = Array.from(new Set([CLOUDINARY_UPLOAD_PRESET].filter(Boolean)));

  let lastErrorMsg = "";

  for (const uploadUrl of endpointsToTry) {
    for (const presetName of presetsToTry) {
      try {
        const data = new FormData();
        data.append("file", fileToUpload);
        data.append("upload_preset", presetName);

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
          console.log(`Cloudinary Upload Success [${uploadUrl}, preset=${presetName}]:`, secureUrl);
          await setCachedUploadUrl(file, secureUrl);
          return secureUrl;
        }
      } catch (err) {
        const cloudMsg = err?.response?.data?.error?.message || err?.message;
        console.warn(`Cloudinary upload attempt failed [${uploadUrl}, preset=${presetName}]:`, cloudMsg);
        lastErrorMsg = cloudMsg;
      }
    }
  }

  throw new Error(`Cloudinary Upload Failed: ${lastErrorMsg || "Unknown error"}`);
};

export { getOptimizedCloudinaryUrl };
export default uploadToCloudinary;


