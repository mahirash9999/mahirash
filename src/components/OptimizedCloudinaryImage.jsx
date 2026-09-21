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

  // Cross-cloud fallback: if an image fails on one cloud account, fallback to the configured or alternative account
  const autoFallback = React.useMemo(() => {
    if (fallbackSrc) return fallbackSrc;
    const configuredCloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    if (typeof src === 'string' && src.includes('res.cloudinary.com')) {
      if (configuredCloud) {
        if (src.includes('dcjn4y284') && !src.includes(configuredCloud)) {
          return src.replace('dcjn4y284', configuredCloud);
        }
        if (src.includes('dlsbj8nug') && !src.includes(configuredCloud)) {
          return src.replace('dlsbj8nug', configuredCloud);
        }
      }
      if (src.includes('dlsbj8nug')) return src.replace('dlsbj8nug', 'dcjn4y284');
      if (src.includes('dcjn4y284')) return src.replace('dcjn4y284', 'dlsbj8nug');
    }
    return undefined;
  }, [src, fallbackSrc]);

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
