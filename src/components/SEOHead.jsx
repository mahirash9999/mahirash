import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getOptimizedCloudinaryUrl } from '../utils/cloudinaryUtils';

const SEOHead = ({
  title = "Mahirash | Luxury Perfumes & Fine Fragrances",
  description = "Discover Mahirash luxury fragrances, extraits de parfum, artisanal oud, and signature perfumes crafted to leave a lasting impression.",
  keywords = "Mahirash, Mahirash perfumes, luxury perfumes, extrait de parfum, royal oud, fine fragrances, artisanal scents, luxury fragrance house",
  image = "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1200&auto=format&fit=crop",
  url = "https://mahirash.com",
  type = "website",
  robots = "index, follow",
  canonical = "",
  jsonLd = null
}) => {
  const optimizedImage = getOptimizedCloudinaryUrl?.(image, { width: 1200 }) || image;
  const fullTitle = title.includes("Mahirash") ? title : `${title} | Mahirash`;
  const targetUrl = canonical || url || "https://mahirash.com";

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <meta name="author" content="Mahirash" />
      <link rel="canonical" href={targetUrl} />

      {/* Open Graph Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={optimizedImage} />
      <meta property="og:url" content={targetUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Mahirash" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={optimizedImage} />

      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <script type="application/ld+json" id="seo-jsonld">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
