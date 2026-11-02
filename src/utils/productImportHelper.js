import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { parseCSV, exportToCSV } from './exportUtils';

/**
 * Canonical product keys and their friendly display headers
 */
export const PRODUCT_CSV_COLUMNS = [
  { key: 'id', header: 'Product ID', help: 'Leave blank for new products. Keep existing ID when updating.' },
  { key: 'name', header: 'Product Name', help: 'Required. Used to detect existing products and prevent duplicates.' },
  { key: 'brand', header: 'Brand', help: 'e.g. MAHIRASH. Auto-synced to Brands collection if new.' },
  { key: 'category', header: 'Category', help: 'e.g. Extrait De Parfum. Auto-synced to Categories collection.' },
  { key: 'subcategory', header: 'Subcategory', help: 'e.g. Mens Perfumes. Auto-synced to Subcategories collection.' },
  { key: 'collection', header: 'Collection', help: 'e.g. Royal Oud Collection. Auto-synced to Collections.' },
  { key: 'gender', header: 'Gender', help: 'Men, Women, or Unisex' },
  { key: 'fragrance_family', header: 'Fragrance Family', help: 'e.g. Woody Oriental, Fresh Citrus, Floral' },
  { key: 'fragrance_concentration', header: 'Fragrance Concentration', help: 'e.g. Extrait de Parfum, Eau de Parfum' },
  { key: 'availability', header: 'Availability', help: 'In Stock, Low Stock, Out of Stock, or Pre-Order' },
  { key: 'price', header: 'Price (INR)', help: 'Base selling price in Rupees' },
  { key: 'original_price', header: 'Original Price (INR)', help: 'MRP / strike-through price' },
  { key: 'stock', header: 'Stock Quantity', help: 'Total units in stock' },
  { key: 'sizes', header: 'Sizes', help: 'Comma separated e.g. "50ml, 100ml"' },
  { key: 'size_prices', header: 'Size Prices (JSON)', help: 'Optional variant JSON e.g. [{"size":"50ml","price":1999,"stock":20}]' },
  { key: 'is_bestseller', header: 'Is Bestseller', help: 'TRUE or FALSE' },
  { key: 'is_new_arrival', header: 'Is New Arrival', help: 'TRUE or FALSE' },
  { key: 'is_miniature', header: 'Is Miniature', help: 'TRUE or FALSE' },
  { key: 'rating', header: 'Rating', help: 'Customer rating e.g. 4.8' },
  { key: 'reviews_count', header: 'Reviews Count', help: 'e.g. 24' },
  { key: 'top_notes', header: 'Top Notes', help: 'e.g. Bergamot, Saffron, Pink Pepper' },
  { key: 'heart_notes', header: 'Heart Notes', help: 'e.g. Cambodian Oud, Rose Damascena' },
  { key: 'base_notes', header: 'Base Notes', help: 'e.g. Amber, White Musk, Sandalwood' },
  { key: 'longevity', header: 'Longevity', help: 'e.g. 8-12 Hours' },
  { key: 'sillage', header: 'Sillage', help: 'e.g. Strong / Intense' },
  { key: 'tags', header: 'Tags (JSON)', help: 'Optional custom badges' },
  { key: 'image', header: 'Primary Image URL', help: 'Direct image URL' },
  { key: 'images', header: 'All Image URLs (JSON)', help: 'JSON array or comma-separated image URLs' },
  { key: 'description', header: 'Description', help: 'Product detailed description' },
  { key: 'shipping_weight', header: 'Shipping Weight (kg)', help: 'e.g. 0.5' },
  { key: 'shipping_length', header: 'Shipping Length (cm)', help: 'e.g. 30' },
  { key: 'shipping_breadth', header: 'Shipping Breadth (cm)', help: 'e.g. 20' },
  { key: 'shipping_height', header: 'Shipping Height (cm)', help: 'e.g. 5' }
];

export const PRODUCT_CSV_KEYS = PRODUCT_CSV_COLUMNS.map(c => c.key);
export const PRODUCT_CSV_HEADERS = PRODUCT_CSV_COLUMNS.map(c => c.header);

/**
 * Flexible header normalizer: handles variations across Excel, Google Sheets & CSV formats
 */
const HEADER_ALIAS_MAP = {
  // ID variations
  'id': 'id',
  'product id': 'id',
  'productid': 'id',
  'item id': 'id',
  'doc id': 'id',
  'document id': 'id',

  // Name variations
  'name': 'name',
  'product name': 'name',
  'productname': 'name',
  'title': 'name',
  'item name': 'name',
  'product': 'name',

  // Brand variations
  'brand': 'brand',
  'brand name': 'brand',
  'manufacturer': 'brand',

  // Category variations
  'category': 'category',
  'category name': 'category',
  'main category': 'category',

  // Subcategory variations
  'subcategory': 'subcategory',
  'sub category': 'subcategory',
  'sub-category': 'subcategory',

  // Collection variations
  'collection': 'collection',
  'collections': 'collection',
  'collection name': 'collection',
  'home page collection': 'collection',

  // Gender variations
  'gender': 'gender',
  'target gender': 'gender',

  // Fragrance Family
  'fragrance family': 'fragrance_family',
  'fragrance_family': 'fragrance_family',
  'family': 'fragrance_family',
  'scent family': 'fragrance_family',

  // Fragrance Concentration
  'fragrance concentration': 'fragrance_concentration',
  'fragrance_concentration': 'fragrance_concentration',
  'concentration': 'fragrance_concentration',

  // Availability / Stock Status
  'availability': 'availability',
  'stock status': 'availability',
  'stock_status': 'availability',
  'status': 'availability',

  // Price variations
  'price': 'price',
  'price (inr)': 'price',
  'selling price': 'price',
  'selling price (inr)': 'price',
  'sale price': 'price',
  'amount': 'price',

  // Original Price / MRP variations
  'original price': 'original_price',
  'original price (inr)': 'original_price',
  'original_price': 'original_price',
  'mrp': 'original_price',
  'mrp (inr)': 'original_price',
  'regular price': 'original_price',
  'list price': 'original_price',

  // Stock variations
  'stock': 'stock',
  'stock quantity': 'stock',
  'quantity': 'stock',
  'qty': 'stock',
  'inventory': 'stock',

  // Sizes
  'sizes': 'sizes',
  'size': 'sizes',
  'available sizes': 'sizes',

  // Size Prices
  'size prices': 'size_prices',
  'size_prices': 'size_prices',
  'size prices (json)': 'size_prices',
  'variants': 'size_prices',

  // Flags
  'is bestseller': 'is_bestseller',
  'is_bestseller': 'is_bestseller',
  'bestseller': 'is_bestseller',
  'is new arrival': 'is_new_arrival',
  'is_new_arrival': 'is_new_arrival',
  'new arrival': 'is_new_arrival',
  'is miniature': 'is_miniature',
  'is_miniature': 'is_miniature',
  'miniature': 'is_miniature',

  // Notes & Specs
  'top notes': 'top_notes',
  'top_notes': 'top_notes',
  'heart notes': 'heart_notes',
  'heart_notes': 'heart_notes',
  'middle notes': 'heart_notes',
  'base notes': 'base_notes',
  'base_notes': 'base_notes',
  'longevity': 'longevity',
  'sillage': 'sillage',
  'rating': 'rating',
  'reviews count': 'reviews_count',
  'reviews_count': 'reviews_count',
  'tags': 'tags',
  'tags (json)': 'tags',
  'description': 'description',
  'desc': 'description',

  // Images
  'primary image url': 'image',
  'primary image': 'image',
  'image': 'image',
  'image url': 'image',
  'photo': 'image',
  'all image urls (json)': 'images',
  'images': 'images',
  'gallery': 'images',

  // Shipping
  'shipping weight': 'shipping_weight',
  'shipping weight (kg)': 'shipping_weight',
  'weight': 'shipping_weight',
  'weight (kg)': 'shipping_weight',
  'shipping length': 'shipping_length',
  'shipping length (cm)': 'shipping_length',
  'length': 'shipping_length',
  'shipping breadth': 'shipping_breadth',
  'shipping breadth (cm)': 'shipping_breadth',
  'breadth': 'shipping_breadth',
  'width': 'shipping_breadth',
  'shipping height': 'shipping_height',
  'shipping height (cm)': 'shipping_height',
  'height': 'shipping_height'
};

/**
 * Normalize product name for duplicate comparison:
 * Trims, lowercases, removes double spaces and extra symbols
 */
export const normalizeProductName = (name) => {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/['’"“”]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
};

/**
 * Generate a clean kebab-case URL slug
 */
export const slugify = (text) => {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

/**
 * Parse CSV text into standardized product objects using flexible alias mapping
 */
export const parseProductCSV = (csvText) => {
  const lines = parseCSV(csvText);
  if (lines.length < 2) return [];

  const rawHeaders = lines[0].map(h => String(h || '').trim().toLowerCase());

  // Build mapping from column index to our canonical key
  const colIndexToKey = {};
  rawHeaders.forEach((headerStr, colIdx) => {
    // 1. Direct alias match
    if (HEADER_ALIAS_MAP[headerStr]) {
      colIndexToKey[colIdx] = HEADER_ALIAS_MAP[headerStr];
      return;
    }
    // 2. Try removing parenthesis and brackets, e.g. "price (inr)" -> "price"
    const cleaned = headerStr.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();
    if (HEADER_ALIAS_MAP[cleaned]) {
      colIndexToKey[colIdx] = HEADER_ALIAS_MAP[cleaned];
      return;
    }
    // 3. Fallback: check if exact canonical key
    if (PRODUCT_CSV_KEYS.includes(cleaned)) {
      colIndexToKey[colIdx] = cleaned;
    }
  });

  const parsedRows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (!row || row.length === 0 || (row.length === 1 && String(row[0] || '').trim() === '')) {
      continue;
    }

    const item = {};
    let hasData = false;

    Object.entries(colIndexToKey).forEach(([colIdxStr, key]) => {
      const idx = Number(colIdxStr);
      if (idx < row.length) {
        const val = String(row[idx] ?? '').trim();
        item[key] = val;
        if (val !== '') hasData = true;
      }
    });

    if (hasData && item.name) {
      parsedRows.push(item);
    }
  }

  return parsedRows;
};

/**
 * Automatically synchronize related metadata collections:
 * Categories, Brands, Collections, Subcategories, Fragrance Families, Fragrance Concentrations
 */
export const syncRelatedCatalogMetadata = async (rows, db) => {
  const stats = {
    newCategories: [],
    newBrands: [],
    newCollections: [],
    newSubcategories: [],
    newFamilies: [],
    newConcentrations: []
  };

  try {
    // 1. Fetch current existing collections
    const [catSnap, brandSnap, colSnap, subSnap, famSnap, concSnap] = await Promise.all([
      getDocs(collection(db, 'categories')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'brands')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'collections')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'subcategories')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'fragrance_families')).catch(() => ({ docs: [] })),
      getDocs(collection(db, 'fragrance_concentrations')).catch(() => ({ docs: [] }))
    ]);

    const existingCategories = new Set(catSnap.docs.map(d => normalizeProductName(d.data().name)));
    const existingBrands = new Set(brandSnap.docs.map(d => normalizeProductName(d.data().name)));
    const existingCollections = new Set(colSnap.docs.map(d => normalizeProductName(d.data().name)));
    const existingSubcategories = new Set(subSnap.docs.map(d => normalizeProductName(d.data().name)));
    const existingFamilies = new Set(famSnap.docs.map(d => normalizeProductName(d.data().name)));
    const existingConcentrations = new Set(concSnap.docs.map(d => normalizeProductName(d.data().name)));

    let catSortOrder = catSnap.docs.length + 1;
    let brandSortOrder = brandSnap.docs.length + 1;
    let colSortOrder = colSnap.docs.length + 1;
    let subSortOrder = subSnap.docs.length + 1;
    let famSortOrder = famSnap.docs.length + 1;
    let concSortOrder = concSnap.docs.length + 1;

    // 2. Iterate rows and auto-create missing entries
    for (const row of rows) {
      // Category
      const catName = (row.category || '').trim();
      if (catName && !existingCategories.has(normalizeProductName(catName))) {
        const catId = slugify(catName) || doc(collection(db, 'categories')).id;
        await setDoc(doc(db, 'categories', catId), {
          name: catName,
          slug: slugify(catName),
          sort_order: catSortOrder++,
          is_active: true,
          createdAt: serverTimestamp()
        }, { merge: true });
        existingCategories.add(normalizeProductName(catName));
        stats.newCategories.push(catName);
      }

      // Brand
      const brandName = (row.brand || '').trim();
      if (brandName && !existingBrands.has(normalizeProductName(brandName))) {
        const brandId = slugify(brandName) || doc(collection(db, 'brands')).id;
        await setDoc(doc(db, 'brands', brandId), {
          name: brandName,
          slug: slugify(brandName),
          sort_order: brandSortOrder++,
          is_active: true,
          createdAt: serverTimestamp()
        }, { merge: true });
        existingBrands.add(normalizeProductName(brandName));
        stats.newBrands.push(brandName);
      }

      // Collection
      const colName = (row.collection || '').trim();
      if (colName && !existingCollections.has(normalizeProductName(colName))) {
        const colId = slugify(colName) || doc(collection(db, 'collections')).id;
        await setDoc(doc(db, 'collections', colId), {
          name: colName,
          slug: slugify(colName),
          sort_order: colSortOrder++,
          is_active: true,
          createdAt: serverTimestamp()
        }, { merge: true });
        existingCollections.add(normalizeProductName(colName));
        stats.newCollections.push(colName);
      }

      // Subcategory
      const subName = (row.subcategory || '').trim();
      if (subName && !existingSubcategories.has(normalizeProductName(subName))) {
        const subId = slugify(subName) || doc(collection(db, 'subcategories')).id;
        await setDoc(doc(db, 'subcategories', subId), {
          name: subName,
          slug: slugify(subName),
          category: catName || 'Extrait De Parfum',
          sort_order: subSortOrder++,
          is_active: true,
          createdAt: serverTimestamp()
        }, { merge: true });
        existingSubcategories.add(normalizeProductName(subName));
        stats.newSubcategories.push(subName);
      }

      // Fragrance Family
      const famName = (row.fragrance_family || '').trim();
      if (famName && !existingFamilies.has(normalizeProductName(famName))) {
        const famId = slugify(famName) || doc(collection(db, 'fragrance_families')).id;
        await setDoc(doc(db, 'fragrance_families', famId), {
          name: famName,
          slug: slugify(famName),
          sort_order: famSortOrder++,
          is_active: true,
          createdAt: serverTimestamp()
        }, { merge: true });
        existingFamilies.add(normalizeProductName(famName));
        stats.newFamilies.push(famName);
      }

      // Fragrance Concentration
      const concName = (row.fragrance_concentration || '').trim();
      if (concName && !existingConcentrations.has(normalizeProductName(concName))) {
        const concId = slugify(concName) || doc(collection(db, 'fragrance_concentrations')).id;
        await setDoc(doc(db, 'fragrance_concentrations', concId), {
          name: concName,
          slug: slugify(concName),
          sort_order: concSortOrder++,
          is_active: true,
          createdAt: serverTimestamp()
        }, { merge: true });
        existingConcentrations.add(normalizeProductName(concName));
        stats.newConcentrations.push(concName);
      }
    }
  } catch (err) {
    console.warn('Metadata sync warning (continuing product import):', err);
  }

  return stats;
};

/**
 * Master Product Import Engine with Smart Upsert & Duplicate Prevention
 */
export const importProductsWithUpsert = async (csvText, db, onProgress = null) => {
  const rows = parseProductCSV(csvText);
  if (!rows || rows.length === 0) {
    throw new Error('No valid product rows found in the CSV. Please ensure the file has a "Product Name" column.');
  }

  // 1. Fetch all existing products from Firestore
  if (onProgress) onProgress({ status: 'fetching_existing', percent: 10, message: 'Analyzing existing products in database...' });
  const existingSnap = await getDocs(collection(db, 'products'));
  const existingProducts = existingSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 2. Build fast lookup maps: ID map & Name map
  const idMap = new Map();
  const nameMap = new Map();

  existingProducts.forEach(p => {
    if (p.id) idMap.set(String(p.id).trim().toLowerCase(), p);
    if (p.name) nameMap.set(normalizeProductName(p.name), p);
  });

  // 3. Auto-sync related collections (categories, brands, collections)
  if (onProgress) onProgress({ status: 'syncing_metadata', percent: 25, message: 'Synchronizing categories, brands, and collections...' });
  const metaStats = await syncRelatedCatalogMetadata(rows, db);

  // 4. Process each row with Smart Upsert
  let createdCount = 0;
  let updatedCount = 0;
  const processedProducts = [];

  const total = rows.length;

  for (let idx = 0; idx < total; idx++) {
    const row = rows[idx];
    const name = (row.name || '').trim();
    if (!name) continue;

    const normName = normalizeProductName(name);
    const providedId = (row.id || '').trim();
    const normalizedProvidedId = providedId.toLowerCase();

    // Determine if product already exists
    let matchedProduct = null;

    // Check A: Match by provided Product ID
    if (providedId && idMap.has(normalizedProvidedId)) {
      matchedProduct = idMap.get(normalizedProvidedId);
    }

    // Check B: Match by Product Name (prevent duplicate creation!)
    if (!matchedProduct && nameMap.has(normName)) {
      matchedProduct = nameMap.get(normName);
    }

    // Parse numeric fields safely
    const priceNum = Math.max(0, Number(row.price) || 0);
    const origPriceNum = Math.max(0, Number(row.original_price) || priceNum);
    const stockNum = Math.max(0, Number(row.stock) || 0);
    const ratingNum = row.rating ? Math.min(5, Math.max(1, Number(row.rating) || 4.8)) : 4.8;
    const reviewsCountNum = Math.max(0, Number(row.reviews_count) || 0);

    // Process images
    let imagesArr = [];
    if (row.images) {
      try {
        const parsedImg = JSON.parse(row.images);
        if (Array.isArray(parsedImg)) imagesArr = parsedImg;
        else imagesArr = [String(row.images).trim()];
      } catch (_) {
        imagesArr = String(row.images).split(',').map(s => s.trim()).filter(Boolean);
      }
    }
    if (row.image && !imagesArr.includes(row.image)) {
      imagesArr.unshift(row.image);
    }
    // If updating and no new images in CSV, keep existing product images
    if (imagesArr.length === 0 && matchedProduct?.images?.length) {
      imagesArr = matchedProduct.images;
    }

    // Process size_prices (variants)
    let sizePricesArr = [];
    if (row.size_prices) {
      try {
        const parsedSp = JSON.parse(row.size_prices);
        if (Array.isArray(parsedSp)) sizePricesArr = parsedSp;
      } catch (_) {}
    }
    if (sizePricesArr.length === 0 && row.sizes) {
      const splitSizes = String(row.sizes).split(',').map(s => s.trim()).filter(Boolean);
      if (splitSizes.length > 0) {
        sizePricesArr = splitSizes.map(sz => ({
          size: sz,
          price: priceNum,
          original_price: origPriceNum,
          stock: stockNum,
          is_preorder: false,
          images: imagesArr
        }));
      }
    }
    // If updating and CSV had no variant details, keep matched product's variants
    if (sizePricesArr.length === 0 && matchedProduct?.size_prices?.length) {
      sizePricesArr = matchedProduct.size_prices;
    }

    // Normalize size_prices items
    if (sizePricesArr.length > 0) {
      sizePricesArr = sizePricesArr.map(sp => ({
        size: String(sp.size || '').trim(),
        price: Math.max(0, Number(sp.price) || priceNum),
        original_price: Math.max(0, Number(sp.original_price) || origPriceNum),
        stock: sp.stock !== undefined ? Math.max(0, Number(sp.stock)) : stockNum,
        is_preorder: Boolean(sp.is_preorder === true || sp.is_preorder === 'true'),
        images: Array.isArray(sp.images) ? sp.images : (sp.image ? [sp.image] : imagesArr),
        image: sp.image || (Array.isArray(sp.images) && sp.images[0] ? sp.images[0] : imagesArr[0] || '')
      }));
    }

    const sizesStr = row.sizes || (sizePricesArr.length > 0 ? sizePricesArr.map(sp => sp.size).join(', ') : (matchedProduct?.sizes || ''));
    const effectiveStock = sizePricesArr.length > 0
      ? sizePricesArr.reduce((sum, sp) => sum + (Number(sp.stock) || 0), 0)
      : stockNum;

    const autoStatus = effectiveStock === 0 ? 'Out of Stock' : effectiveStock <= 5 ? 'Low Stock' : 'In Stock';
    const chosenAvailability = row.availability || autoStatus;
    const chosenCollection = row.collection || matchedProduct?.collection || '';

    // Booleans
    const isBestseller = row.is_bestseller === 'TRUE' || row.is_bestseller === 'true' || row.is_bestseller === true || row.is_bestseller === '1';
    const isNewArrival = row.is_new_arrival === 'TRUE' || row.is_new_arrival === 'true' || row.is_new_arrival === true || row.is_new_arrival === '1';
    const isMiniature = row.is_miniature === 'TRUE' || row.is_miniature === 'true' || row.is_miniature === true || row.is_miniature === '1';

    // Tags
    let tagsArr = [];
    if (row.tags) {
      try {
        const parsedTags = JSON.parse(row.tags);
        if (Array.isArray(parsedTags)) tagsArr = parsedTags;
        else tagsArr = String(row.tags).split(',').map(s => s.trim()).filter(Boolean);
      } catch (_) {
        tagsArr = String(row.tags).split(',').map(s => s.trim()).filter(Boolean);
      }
    } else if (matchedProduct?.tags) {
      tagsArr = [...matchedProduct.tags];
    }

    if (isBestseller && !tagsArr.some(t => (typeof t === 'string' ? t : t?.label)?.toUpperCase() === 'BESTSELLER')) {
      tagsArr.push({ label: 'BESTSELLER', bg: '#dc2626', text: '#ffffff' });
    }
    if (isNewArrival && !tagsArr.some(t => (typeof t === 'string' ? t : t?.label)?.toUpperCase() === 'NEW ARRIVAL')) {
      tagsArr.push({ label: 'NEW ARRIVAL', bg: '#b8860b', text: '#ffffff' });
    }

    // Prepare complete Firestore document payload
    const docData = {
      name,
      brand: row.brand || matchedProduct?.brand || 'MAHIRASH',
      category: row.category || matchedProduct?.category || 'Extrait De Parfum',
      subcategory: row.subcategory || matchedProduct?.subcategory || '',
      collection: chosenCollection,
      collections: chosenCollection ? [chosenCollection] : (matchedProduct?.collections || []),
      home_page_collection: chosenCollection,
      gender: row.gender || matchedProduct?.gender || 'Unisex',
      fragrance_family: row.fragrance_family || matchedProduct?.fragrance_family || '',
      fragrance_concentration: row.fragrance_concentration || matchedProduct?.fragrance_concentration || '',
      availability: chosenAvailability,
      stock_status: chosenAvailability,
      price: sizePricesArr.length > 0 ? sizePricesArr[0].price : priceNum,
      original_price: sizePricesArr.length > 0 ? sizePricesArr[0].original_price : origPriceNum,
      stock: effectiveStock,
      sizes: sizesStr,
      size_prices: sizePricesArr,
      rating: ratingNum,
      reviews_count: reviewsCountNum,
      top_notes: row.top_notes || matchedProduct?.top_notes || '',
      heart_notes: row.heart_notes || matchedProduct?.heart_notes || '',
      base_notes: row.base_notes || matchedProduct?.base_notes || '',
      longevity: row.longevity || matchedProduct?.longevity || '8-12 Hours',
      sillage: row.sillage || matchedProduct?.sillage || 'Intense',
      is_bestseller: isBestseller,
      is_new_arrival: isNewArrival,
      is_miniature: isMiniature,
      is_atelier_edition: false,
      tags: tagsArr,
      image: row.image || imagesArr[0] || matchedProduct?.image || '',
      images: imagesArr,
      description: row.description || matchedProduct?.description || '',
      shipping: {
        weight: Math.max(0, Number(row.shipping_weight) || matchedProduct?.shipping?.weight || 0.5),
        length: Math.max(0, Number(row.shipping_length) || matchedProduct?.shipping?.length || 30),
        breadth: Math.max(0, Number(row.shipping_breadth) || matchedProduct?.shipping?.breadth || 20),
        height: Math.max(0, Number(row.shipping_height) || matchedProduct?.shipping?.height || 5)
      },
      updatedAt: serverTimestamp()
    };

    if (matchedProduct) {
      // ── UPDATE EXISTING PRODUCT (Zero Duplicates!) ──
      const targetId = matchedProduct.id;
      await setDoc(doc(db, 'products', targetId), docData, { merge: true });
      updatedCount++;

      // Update in-memory entry for any repeated rows in the same CSV
      const updatedEntry = { ...matchedProduct, ...docData, id: targetId };
      idMap.set(String(targetId).toLowerCase(), updatedEntry);
      nameMap.set(normName, updatedEntry);
      processedProducts.push({ action: 'updated', id: targetId, name });
    } else {
      // ── CREATE NEW PRODUCT ──
      // If user supplied an explicit new ID in CSV, use it; otherwise auto-generate clean doc ID
      const targetId = (providedId && !idMap.has(normalizedProvidedId))
        ? providedId
        : doc(collection(db, 'products')).id;

      await setDoc(doc(db, 'products', targetId), {
        ...docData,
        id: targetId,
        createdAt: serverTimestamp()
      });
      createdCount++;

      // Register in map to prevent duplicate if repeated later in the same sheet
      const newEntry = { ...docData, id: targetId };
      idMap.set(String(targetId).toLowerCase(), newEntry);
      nameMap.set(normName, newEntry);
      processedProducts.push({ action: 'created', id: targetId, name });
    }

    if (onProgress && idx % 5 === 0) {
      const currentPercent = 25 + Math.round(((idx + 1) / total) * 70);
      onProgress({
        status: 'importing_rows',
        percent: currentPercent,
        message: `Processing product ${idx + 1} of ${total} (${createdCount} new, ${updatedCount} updated)...`
      });
    }
  }

  if (onProgress) onProgress({ status: 'done', percent: 100, message: 'Import completed successfully!' });

  return {
    totalRows: rows.length,
    createdCount,
    updatedCount,
    duplicatesPrevented: updatedCount,
    metaStats,
    processedProducts
  };
};

/**
 * Generate a downloadable sample CSV template for the admin
 */
export const downloadSampleProductCSV = () => {
  const sampleRows = [
    {
      id: '', // Left blank to demonstrate auto-generation
      name: 'Oud Al Sultani Extrait',
      brand: 'MAHIRASH',
      category: 'Extrait De Parfum',
      subcategory: 'Mens Perfumes',
      collection: 'Royal Oud Collection',
      gender: 'Unisex',
      fragrance_family: 'Woody Oriental',
      fragrance_concentration: 'Extrait de Parfum',
      availability: 'In Stock',
      price: 2499,
      original_price: 3499,
      stock: 50,
      sizes: '50ml, 100ml',
      size_prices: JSON.stringify([
        { size: '50ml', price: 2499, original_price: 3499, stock: 30, is_preorder: false },
        { size: '100ml', price: 4299, original_price: 5999, stock: 20, is_preorder: false }
      ]),
      is_bestseller: 'TRUE',
      is_new_arrival: 'TRUE',
      is_miniature: 'FALSE',
      rating: 4.9,
      reviews_count: 32,
      top_notes: 'Cambodian Agarwood, Bergamot',
      heart_notes: 'Damascus Rose, Cardamom',
      base_notes: 'Amber, Cedarwood, Musk',
      longevity: '12-14 Hours',
      sillage: 'Heavy / Regal',
      tags: JSON.stringify([{ label: 'ROYAL RESERVE', bg: '#800020', text: '#ffffff' }]),
      image: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80'
      ]),
      description: 'An opulent royal extrait de parfum celebrating pure Cambodian oud and velvety floral warmth.',
      shipping_weight: 0.5,
      shipping_length: 30,
      shipping_breadth: 20,
      shipping_height: 5
    },
    {
      id: '', // Left blank
      name: 'Velvet Noir Parfum',
      brand: 'MAHIRASH',
      category: 'Parfum',
      subcategory: 'Unisex Fragrances',
      collection: 'Signature Collection',
      gender: 'Unisex',
      fragrance_family: 'Warm Floral',
      fragrance_concentration: 'Parfum',
      availability: 'In Stock',
      price: 1999,
      original_price: 2799,
      stock: 40,
      sizes: '100ml',
      size_prices: '',
      is_bestseller: 'TRUE',
      is_new_arrival: 'FALSE',
      is_miniature: 'FALSE',
      rating: 4.8,
      reviews_count: 18,
      top_notes: 'Black Cherry, Pink Pepper',
      heart_notes: 'Jasmine Sambac, Orris',
      base_notes: 'Vanilla Bourbon, Tonka Bean',
      longevity: '8-10 Hours',
      sillage: 'Moderate',
      tags: '',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
      images: '',
      description: 'A seductive dark gourmand fragrance layered with black cherry and bourbon vanilla.',
      shipping_weight: 0.5,
      shipping_length: 30,
      shipping_breadth: 20,
      shipping_height: 5
    }
  ];

  exportToCSV(sampleRows, PRODUCT_CSV_KEYS, PRODUCT_CSV_HEADERS, 'mahirash_sample_product_import_template');
};

