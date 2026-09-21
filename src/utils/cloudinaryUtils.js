/**
 * Cloudinary Optimization Utility Functions
 * Handles URL parsing, default transformation injection, responsive srcSet generation,
 * image size presets, browser-side compression, and upload deduplication.
 */

export const PRESET_WIDTHS = {
  logo: 150,
  avatar: 100,
  category: 1200,
  'product-card': 400,
  'product-grid': 500,
  'product-details': 900,
  zoom: 1600,
  banner: 1920,
  default: 800,
};

export const getPresetWidth = (preset) => {
  if (!preset) return null;
  return PRESET_WIDTHS[preset] || PRESET_WIDTHS.default;
};

/**
 * Checks if a string is a Cloudinary URL or Public ID
 */
export const isCloudinaryUrlOrId = (str) => {
  if (!str || typeof str !== 'string') return false;
  if (str.startsWith('data:') || str.startsWith('blob:')) return false;
  if (str.includes('res.cloudinary.com')) return true;
  // If it doesn't start with http/https or leading slash, it could be a raw public ID
  if (!str.startsWith('http://') && !str.startsWith('https://') && !str.startsWith('/')) {
    return true;
  }
  return false;
};

/**
 * Parse a Cloudinary URL into its constituent parts
 */
export const parseCloudinaryUrl = (urlOrPublicId) => {
  const defaultCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  if (!defaultCloudName) console.warn("Missing VITE_CLOUDINARY_CLOUD_NAME config");

  if (!urlOrPublicId || typeof urlOrPublicId !== 'string') {
    return null;
  }

  // Handle full Cloudinary URL
  if (urlOrPublicId.includes('res.cloudinary.com')) {
    try {
      const parsedUrl = new URL(urlOrPublicId);
      const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
      // path format: /[cloud_name]/[resource_type]/[type]/[transformations?]/[version?]/[public_id]
      const cloudName = pathSegments[0];
      const resourceType = pathSegments[1] || 'image';
      const type = pathSegments[2] || 'upload';

      let remainingSegments = pathSegments.slice(3);
      let transformationsStr = '';
      let versionStr = '';

      // Check if first remaining segment is transformation (e.g. contains _ or , but not v\d+)
      if (remainingSegments.length > 0) {
        const seg = remainingSegments[0];
        if (!/^v\d+$/.test(seg) && (seg.includes('_') || seg.includes(','))) {
          transformationsStr = remainingSegments.shift();
        }
      }

      // Check if next remaining segment is version
      if (remainingSegments.length > 0) {
        const seg = remainingSegments[0];
        if (/^v\d+$/.test(seg)) {
          versionStr = remainingSegments.shift();
        }
      }

      const publicId = remainingSegments.join('/');

      return {
        cloudName,
        resourceType,
        type,
        existingTransformations: transformationsStr,
        version: versionStr,
        publicId,
        isFullUrl: true,
      };
    } catch (e) {
      return null;
    }
  }

  // Handle raw public ID or versioned public ID (e.g. "v1786029668/p3jd3nuet4vkqbfd5qaz.png")
  if (isCloudinaryUrlOrId(urlOrPublicId)) {
    let versionStr = '';
    let publicId = urlOrPublicId;

    if (/^v\d+\//.test(urlOrPublicId)) {
      const parts = urlOrPublicId.split('/');
      versionStr = parts[0];
      publicId = parts.slice(1).join('/');
    }

    return {
      cloudName: defaultCloudName,
      resourceType: 'image',
      type: 'upload',
      existingTransformations: '',
      version: versionStr,
      publicId,
      isFullUrl: false,
    };
  }

  return null;
};

/**
 * Generates an optimized Cloudinary delivery URL with mandatory & dynamic transformations.
 * Mandatory defaults: f_auto, q_auto, dpr_auto, fl_progressive, c_limit
 */
export const getOptimizedCloudinaryUrl = (urlOrPublicId, options = {}) => {
  if (!urlOrPublicId || typeof urlOrPublicId !== 'string') return urlOrPublicId;

  // Non-cloudinary external or local URLs pass through unchanged
  if (
    (urlOrPublicId.startsWith('http://') || urlOrPublicId.startsWith('https://')) &&
    !urlOrPublicId.includes('res.cloudinary.com')
  ) {
    return urlOrPublicId;
  }
  if (urlOrPublicId.startsWith('/') || urlOrPublicId.startsWith('data:') || urlOrPublicId.startsWith('blob:')) {
    return urlOrPublicId;
  }

  const parsed = parseCloudinaryUrl(urlOrPublicId);
  if (!parsed || !parsed.publicId) return urlOrPublicId;

  const {
    preset,
    width,
    height,
    crop = 'limit',
    quality = 'auto',
    format = 'auto',
    dpr = 'auto',
    flags = ['progressive'],
    rawTransformations = '',
  } = options;

  // Resolve target width
  let targetWidth = width;
  if (!targetWidth && preset) {
    targetWidth = getPresetWidth(preset);
  }

  // Build transformation parameters array
  const transforms = [];

  // Mandatory format & quality & dpr
  transforms.push(`f_${format}`);
  transforms.push(`q_${quality}`);
  transforms.push(`dpr_${dpr}`);

  // Flags
  if (Array.isArray(flags) && flags.length > 0) {
    flags.forEach((flag) => transforms.push(`fl_${flag}`));
  } else if (typeof flags === 'string' && flags) {
    transforms.push(`fl_${flags}`);
  }

  // Crop & limit
  transforms.push(`c_${crop}`);

  // Width & Height
  if (targetWidth) {
    transforms.push(`w_${targetWidth}`);
  }
  if (height) {
    transforms.push(`h_${height}`);
  }

  // Custom raw transformations
  if (rawTransformations) {
    transforms.push(rawTransformations);
  }

  const transformString = transforms.join(',');
  const versionSegment = parsed.version ? `${parsed.version}/` : '';

  return `https://res.cloudinary.com/${parsed.cloudName}/${parsed.resourceType}/${parsed.type}/${transformString}/${versionSegment}${parsed.publicId}`;
};

/**
 * Generates srcSet string for Cloudinary images with specified width steps
 */
export const generateCloudinarySrcSet = (
  urlOrPublicId,
  options = {},
  customWidths = [300, 600, 900, 1200, 1600]
) => {
  if (!isCloudinaryUrlOrId(urlOrPublicId)) return null;

  // Filter out widths larger than preset max limit if preset provided
  let widths = [...customWidths];
  if (options.preset && PRESET_WIDTHS[options.preset]) {
    const maxPresetWidth = PRESET_WIDTHS[options.preset];
    // Include widths up to maxPresetWidth, and cap at maxPresetWidth
    widths = widths.filter((w) => w <= maxPresetWidth);
    if (!widths.includes(maxPresetWidth)) {
      widths.push(maxPresetWidth);
    }
    widths.sort((a, b) => a - b);
  }

  return widths
    .map((w) => {
      const optUrl = getOptimizedCloudinaryUrl(urlOrPublicId, { ...options, width: w });
      return `${optUrl} ${w}w`;
    })
    .join(', ');
};

/**
 * Default sizes attribute based on preset or layout standard
 */
export const getDefaultSizes = (preset) => {
  switch (preset) {
    case 'logo':
      return '150px';
    case 'avatar':
      return '100px';
    case 'category':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 1200px';
    case 'product-card':
      return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px';
    case 'product-grid':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 500px';
    case 'product-details':
      return '(max-width: 1024px) 100vw, 900px';
    case 'zoom':
      return '100vw';
    case 'banner':
      return '(max-width: 640px) 600px, (max-width: 1024px) 1200px, 1920px';
    default:
      return '(max-width: 768px) 100vw, 800px';
  }
};

/**
 * Browser-side image compression using HTML5 Canvas
 * Targets:
 * - Product images: 250 KB–500 KB
 * - Banner images: 400 KB–700 KB
 * - Logos: <150 KB
 */
export const compressImageBeforeUpload = async (file, type = 'product') => {
  if (!file || !(file instanceof Blob)) return file;
  // If image is already smaller than lower target, return as-is
  const sizeKB = file.size / 1024;
  if (type === 'logo' && sizeKB <= 150) return file;
  if (type === 'product' && sizeKB <= 300) return file;
  if (type === 'banner' && sizeKB <= 500) return file;

  let maxDimension = 1920;
  let targetQuality = 0.82;

  if (type === 'logo') {
    maxDimension = 600;
    targetQuality = 0.9;
  } else if (type === 'banner') {
    maxDimension = 2000;
    targetQuality = 0.85;
  } else {
    // product
    maxDimension = 1600;
    targetQuality = 0.82;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/webp' : file.type;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          // If compressed blob is smaller, return converted file
          if (blob.size < file.size) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
              type: mimeType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        mimeType,
        targetQuality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
};

/**
 * Upload Protection: Generates SHA-256 hash or signature of file to avoid duplicate Cloudinary uploads
 */
const UPLOAD_CACHE_KEY = 'cloudinary_uploaded_assets';

export const getFileHash = async (file) => {
  try {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }
};

export const getCachedUploadUrl = async (file) => {
  try {
    const hash = await getFileHash(file);
    const cacheStr = localStorage.getItem(UPLOAD_CACHE_KEY);
    if (!cacheStr) return null;
    const cache = JSON.parse(cacheStr);
    return cache[hash] || null;
  } catch (e) {
    return null;
  }
};

export const setCachedUploadUrl = async (file, url) => {
  try {
    const hash = await getFileHash(file);
    const cacheStr = localStorage.getItem(UPLOAD_CACHE_KEY);
    const cache = cacheStr ? JSON.parse(cacheStr) : {};
    cache[hash] = url;
    localStorage.setItem(UPLOAD_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // ignore
  }
};
