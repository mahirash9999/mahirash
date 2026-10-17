import { uploadToCloudinary } from "../utils/cloudinary";

/**
 * Uploads a video or media file to Cloudinary with real-time percentage progress callback
 * @param {File} file 
 * @param {Function} onProgress (percent: number) => void
 * @returns {Promise<string>} secure_url
 */
export const uploadToCloudinaryWithProgress = async (file, onProgress) => {
  return await uploadToCloudinary(file, "video", onProgress);
};

/**
 * Optimizes Cloudinary video URL by applying automatic quality, format, and dimension scaling
 * @param {string} url 
 * @param {object} options { width: number }
 * @returns {string} optimized URL
 */
export const getOptimizedVideoUrl = (url, options = {}) => {
  if (!url || typeof url !== "string") return "";
  if (!url.includes("cloudinary.com") || !url.includes("/video/upload/")) {
    return url;
  }
  const width = options.width || 480;
  // Insert f_auto,q_auto,w_${width} transformation after /video/upload/
  return url.replace("/video/upload/", `/video/upload/f_auto,q_auto,w_${width}/`);
};

export { uploadToCloudinary };
export default uploadToCloudinary;
