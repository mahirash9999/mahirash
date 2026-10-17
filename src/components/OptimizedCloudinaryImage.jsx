import React, { useState } from 'react';
import {
  getOptimizedCloudinaryUrl,
  generateCloudinarySrcSet,
  getDefaultSizes,
  isCloudinaryUrlOrId,
} from '../utils/cloudinaryUtils';

/**
 * Reusable Optimized Cloudinary Image Component
 * Features:
 * - Automatic f_auto, q_auto, dpr_auto, fl_progressive, c_limit transformations
 * - Responsive width resolution according to layout preset
 * - Dynamic srcSet and sizes generation
 * - Lazy loading by default (loading="lazy"), decoding="async"
 * - Priority support for above-the-fold/LCP images (loading="eager", fetchpriority="high")
 * - Fallback placeholder handling
 */
const OptimizedCloudinaryImage = ({
  src,
  alt = '',
  preset,
  width,
  height,
  sizes,
  srcSetWidths,
  loading,
  decoding = 'async',
  fetchPriority,
  priority = false,
  crop = 'limit',
  quality = 'auto',
  format = 'auto',
  className = '',
  style = {},
  onLoad,
  onError,
  fallbackSrc,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);

  // Cross-cloud fallback: if an image fails and points to an old cloud account, fallback to the configured account
  const autoFallback = React.useMemo(() => {
    if (fallbackSrc) return fallbackSrc;
    const configuredCloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (typeof src === 'string' && src.includes('res.cloudinary.com') && configuredCloud) {
      try {
        const parsed = new URL(src);
        const pathSegments = parsed.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0 && pathSegments[0] !== configuredCloud) {
          pathSegments[0] = configuredCloud;
          return `${parsed.origin}/${pathSegments.join('/')}${parsed.search}`;
        }
      } catch {
        // ignore parse errors
      }
    }
    return undefined;
  }, [src, fallbackSrc]);

  if (!src) {
    return null;
  }

  const isCloudinary = isCloudinaryUrlOrId(src);

  // Calculate optimized src URL
  const optimizedSrc = isCloudinary
    ? getOptimizedCloudinaryUrl(src, {
      preset,
      width,
      height,
      crop,
      quality,
      format,
    })
    : src;

  // Calculate responsive srcSet if Cloudinary image
  const computedSrcSet = isCloudinary
    ? generateCloudinarySrcSet(
      src,
      {
        preset,
        crop,
        quality,
        format,
      },
      srcSetWidths
    )
    : undefined;

  // Calculate responsive sizes attribute
  const computedSizes = sizes || (preset ? getDefaultSizes(preset) : undefined);

  // Compute loading & fetchPriority attributes
  const effectiveLoading = priority ? 'eager' : loading || 'lazy';
  const effectiveFetchPriority = priority ? 'high' : fetchPriority || 'auto';

  const handleImageError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  const handleImageLoad = (e) => {
    if (onLoad) onLoad(e);
  };

  const finalSrc = hasError && autoFallback ? autoFallback : optimizedSrc;

  return (
    <img
      src={finalSrc}
      alt={alt}
      width={width}
      height={height}
      srcSet={!hasError ? computedSrcSet : undefined}
      sizes={!hasError ? computedSizes : undefined}
      loading={effectiveLoading}
      decoding={decoding}
      fetchPriority={effectiveFetchPriority}
      className={className}
      style={style}
      onLoad={handleImageLoad}
      onError={handleImageError}
      {...props}
    />
  );
};

export default OptimizedCloudinaryImage;
