import React from 'react';
import { Helmet } from 'react-helmet-async';
import { getOptimizedCloudinaryUrl } from '../utils/cloudinaryUtils';

const BASE_URL = "https://mahirash.com";
const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1200&auto=format&fit=crop";

const SEOHead = ({
  title = "Mahirash | Haute Parfumerie & Luxury Artisan Extraits",
  description = "Discover Mahirash luxury fragrances, rare botanical extraits de parfum, artisanal Cambodian oud, and bespoke olfactory signatures designed to leave an undeniable sillage.",
  keywords = "Mahirash, Mahirash perfumes, luxury perfumes, extrait de parfum, royal oud, fine fragrances, artisanal scents, luxury fragrance house India, buy perfume online",
  image = DEFAULT_IMAGE,
  imageAlt = "Mahirash Haute Parfumerie Luxury Artisanal Fragrance",
  url = BASE_URL,
  type = "website",
  robots = "index, follow",
  canonical = "",
  author = "Mahirash Parfumerie",
  product = null,
  jsonLd = null,
}) => {
  const optimizedImage = getOptimizedCloudinaryUrl?.(image, { width: 1200 }) || image;
  const fullTitle = title.includes("Mahirash") ? title : `${title} | Mahirash`;
  const targetUrl = canonical || url || BASE_URL;

  // 1. Company / Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${BASE_URL}/#organization`,
    "name": "Mahirash Parfumerie",
    "url": BASE_URL,
    "logo": `${BASE_URL}/logom.webp`,
    "description": "Mahirash Parfumerie is a modern haute perfumerie atelier crafting rare botanical extraits de parfum, royal Cambodian ouds, and bespoke olfactory signatures.",
    "email": "cares@belvish.com",
    "telephone": "+91-8588996969",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "M-4, Kirti Nagar",
      "addressLocality": "New Delhi",
      "postalCode": "110015",
      "addressCountry": "IN"
    },
    "sameAs": [
      "https://www.instagram.com/mahirashparfumerie/",
      "https://www.facebook.com/mahirashparfumerie/",
      "https://www.youtube.com/@mahirashparfumerie",
      "https://x.com/MahirashParfum"
    ]
  };

  // 2. Founder / Person Schema
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${BASE_URL}/#founder`,
    "name": "Mahirash Founder & Master Nose",
    "jobTitle": "Creative Director & Master Perfumer",
    "worksFor": {
      "@id": `${BASE_URL}/#organization`
    },
    "url": `${BASE_URL}/about`
  };

  // 3. Product Schema (Generated dynamically when product data is provided)
  let productSchema = null;
  if (product) {
    const rawPrice = product.price || product.size_prices?.[0]?.price || 0;
    const isAvailable = product.stock > 0 && product.stock_status !== "Out of Stock";
    const prodImages = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [product.image || image];

    // Strip HTML tags for clean schema description
    const cleanDesc = (product.description || description).replace(/<[^>]+>/g, '').trim();

    productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": prodImages,
      "description": cleanDesc || description,
      "sku": product.sku || product.id,
      "mpn": product.id,
      "brand": {
        "@type": "Brand",
        "name": product.brand || "MAHIRASH"
      },
      "category": product.category || "Luxury Fragrance",
      "offers": {
        "@type": "Offer",
        "url": targetUrl,
        "priceCurrency": "INR",
        "priceValidUntil": "2027-12-31",
        "itemCondition": "https://schema.org/NewCondition",
        "availability": isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "Mahirash Parfumerie"
        }
      }
    };

    if (product.rating && Number(product.rating) > 0) {
      productSchema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": Number(product.rating),
        "reviewCount": product.reviews_count || 15,
        "bestRating": "5",
        "worstRating": "1"
      };
    }
  }

  // Construct array of schemas to inject
  const activeSchemas = [organizationSchema, personSchema];
  if (productSchema) {
    activeSchemas.push(productSchema);
  }
  if (jsonLd) {
    if (Array.isArray(jsonLd)) {
      activeSchemas.push(...jsonLd);
    } else {
      activeSchemas.push(jsonLd);
    }
  }

  return (
    <Helmet>
      {/* ── Standard Meta Tags ── */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <meta name="author" content={author} />
      <meta name="publisher" content="Mahirash Parfumerie" />
      <meta name="theme-color" content="#0D0D0D" />
      <link rel="canonical" href={targetUrl} />

      {/* ── Open Graph Tags (Facebook, WhatsApp, LinkedIn) ── */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={optimizedImage} />
      <meta property="og:image:alt" content={imageAlt || fullTitle} />
      <meta property="og:url" content={targetUrl} />
      <meta property="og:type" content={product ? "product" : type} />
      <meta property="og:site_name" content="Mahirash Parfumerie" />
      <meta property="og:locale" content="en_IN" />

      {/* ── Twitter Card Tags ── */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@MahirashParfum" />
      <meta name="twitter:creator" content="@MahirashParfum" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={optimizedImage} />
      <meta name="twitter:image:alt" content={imageAlt || fullTitle} />

      {/* ── JSON-LD Structured Data (Organization, Founder & Product Schemas) ── */}
      {activeSchemas.map((schemaObj, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(schemaObj)}
        </script>
      ))}
    </Helmet>
  );
};

export default SEOHead;
