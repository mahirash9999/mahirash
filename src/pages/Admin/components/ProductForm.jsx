import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import uploadToCloudinary from "../../../utils/cloudinary";
import { db } from "../../../components/Firebase";
import { collection, getDocs } from "firebase/firestore";
import { Editor } from "@tinymce/tinymce-react";
import { Image as ImageIcon, Upload, X, Plus, Package, Sparkles, Clock, Tag } from "lucide-react";
import CloudinaryMediaPickerModal from "../../../components/CloudinaryMediaPickerModal";
import OptimizedCloudinaryImage from "../../../components/OptimizedCloudinaryImage";

const normalizeTags = (rawTags) => {
  let arr = Array.isArray(rawTags) ? rawTags : (rawTags ? [rawTags] : []);
  return arr.map(t => {
    if (typeof t === 'string') return { label: t, bg: '#000000', text: '#ffffff' };
    return t;
  });
};

const ProductForm = ({ onSuccess, isEdit = false, product = null }) => {
  // Initialize size_prices from existing product or default with empty array
  const initialSizePrices = product?.size_prices || [];
  const [sizePrices, setSizePrices] = useState(
    initialSizePrices.length > 0
      ? initialSizePrices.map(sp => ({
        ...sp,
        stock: sp.stock !== undefined ? Number(sp.stock) : (product?.stock ?? 10),
        is_preorder: Boolean(sp.is_preorder),
        images: Array.isArray(sp.images) && sp.images.length > 0
          ? sp.images
          : (sp.image ? [sp.image] : [])
      }))
      : [{ size: "", price: 0, original_price: 0, stock: 10, is_preorder: false, images: [] }]
  );

  // Live dynamic catalog data from Firestore
  const [dbCategories, setDbCategories] = useState([]);
  const [dbSubcategories, setDbSubcategories] = useState([]);
  const [dbCollections, setDbCollections] = useState([]);
  const [dbBrands, setDbBrands] = useState([]);
  const [dbAttributes, setDbAttributes] = useState([]);
  const [dbFragranceFamilies, setDbFragranceFamilies] = useState([]);
  const [dbFragranceConcentrations, setDbFragranceConcentrations] = useState([]);
  const [dbAvailabilities, setDbAvailabilities] = useState([]);

  // Multi-select collection tags state
  const [selectedCollections, setSelectedCollections] = useState(
    Array.isArray(product?.collections)
      ? product.collections
      : (product?.collection ? [product.collection] : [])
  );
  const [selectedTags, setSelectedTags] = useState(normalizeTags(product?.tags || product?.tag));

  // Featured home showcase flags (Bestseller and New Arrivals)
  const [isBestseller, setIsBestseller] = useState(
    product?.is_bestseller ?? (
      Array.isArray(product?.tags)
        ? product.tags.some(t => (typeof t === 'string' ? t : t?.label)?.toUpperCase() === 'BESTSELLER')
        : (product?.tag?.toUpperCase?.() === 'BESTSELLER')
    )
  );
  const [isNewArrival, setIsNewArrival] = useState(
    product?.is_new_arrival ?? (
      Array.isArray(product?.tags)
        ? product.tags.some(t => (typeof t === 'string' ? t : t?.label)?.toUpperCase()?.includes('NEW'))
        : (product?.tag?.toUpperCase?.()?.includes('NEW'))
    )
  );
  const [isMiniature, setIsMiniature] = useState(Boolean(product?.is_miniature || product?.isMiniature));

  const [customTagLabel, setCustomTagLabel] = useState("");
  const [customTagBg, setCustomTagBg] = useState("#000000");
  const [customTagText, setCustomTagText] = useState("#ffffff");

  // Cloudinary Library Picker state per variant row
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerVariantIndex, setPickerVariantIndex] = useState(null);

  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        const catSnap = await getDocs(collection(db, "categories"));
        if (!catSnap.empty) {
          setDbCategories(catSnap.docs.map(doc => doc.data().name).filter(Boolean));
        }

        const brandSnap = await getDocs(collection(db, "brands"));
        if (!brandSnap.empty) {
          setDbBrands(brandSnap.docs.map(doc => doc.data().name).filter(Boolean));
        }

        const subSnap = await getDocs(collection(db, "subcategories"));
        if (!subSnap.empty) {
          setDbSubcategories(subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        // Fetch Home Page Collection from gender_banners (the exact "Home Page Collection" table in Admin)
        const bannerSnap = await getDocs(collection(db, "gender_banners"));
        const bannerCols = [];
        if (!bannerSnap.empty) {
          const sortedBanners = bannerSnap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(item => item.is_active !== false)
            .sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));

          sortedBanners.forEach(doc => {
            const name = (doc.title || doc.name || "").trim();
            if (name && !bannerCols.includes(name)) bannerCols.push(name);
          });
        }
        setDbCollections(bannerCols);

        const attrSnap = await getDocs(collection(db, "attributes"));
        if (!attrSnap.empty) {
          setDbAttributes(attrSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }

        const famSnap = await getDocs(collection(db, "fragrance_families"));
        if (!famSnap.empty) {
          setDbFragranceFamilies(famSnap.docs.map(doc => doc.data().name).filter(Boolean));
        }

        const concSnap = await getDocs(collection(db, "fragrance_concentrations"));
        if (!concSnap.empty) {
          setDbFragranceConcentrations(concSnap.docs.map(doc => doc.data().name).filter(Boolean));
        }

        const availSnap = await getDocs(collection(db, "availabilities"));
        if (!availSnap.empty) {
          setDbAvailabilities(availSnap.docs.map(doc => doc.data().name).filter(Boolean));
        }
      } catch (err) {
        console.error("Error fetching catalog data for product form:", err);
      }
    };
    fetchCatalogData();
  }, []);

  const { register, handleSubmit, reset, formState, setValue, watch } = useForm({
    defaultValues: {
      name: product?.name || "",
      brand: product?.brand || "MAHIRASH",
      category: product?.category || "",
      subcategory: product?.subcategory || "",
      collection: product?.collection || "",
      gender: product?.gender || "Unisex",
      description: product?.description || "",
      price: product?.price || 0,
      original_price: product?.original_price || 0,
      stock: product?.stock ?? 10,
      stock_status: product?.stock_status || "In Stock",
      sizes: product?.sizes || "",
      top_notes: product?.top_notes || "",
      heart_notes: product?.heart_notes || "",
      base_notes: product?.base_notes || "",
      longevity: product?.longevity || "8-12 Hours",
      sillage: product?.sillage || "Intense",
      rating: product?.rating || 4.5,
      fragrance_family: product?.fragrance_family || "",
      fragrance_concentration: product?.fragrance_concentration || "",
      shipping_weight: product?.shipping?.weight || 0.5,
      shipping_length: product?.shipping?.length || 30,
      shipping_breadth: product?.shipping?.breadth || 20,
      shipping_height: product?.shipping?.height || 5,
    },
  });

  const selectedCategory = watch("category");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredSubcategories = dbSubcategories.filter(
    sub => !selectedCategory || !sub.parent_category || sub.parent_category === selectedCategory
  );

  useEffect(() => {
    if (product) {
      setSizePrices(
        product.size_prices && product.size_prices.length > 0
          ? product.size_prices.map(sp => ({
            ...sp,
            stock: sp.stock !== undefined ? Number(sp.stock) : (product.stock ?? 10),
            is_preorder: Boolean(sp.is_preorder),
            images: Array.isArray(sp.images) && sp.images.length > 0
              ? sp.images
              : (sp.image ? [sp.image] : [])
          }))
          : [{ size: "", price: 0, original_price: 0, stock: 10, is_preorder: false, images: [] }]
      );
      setSelectedTags(normalizeTags(product.tags || product.tag));
      const hasBestsellerTag = Array.isArray(product.tags)
        ? product.tags.some(t => (typeof t === 'string' ? t : t?.label)?.toUpperCase() === 'BESTSELLER')
        : (product.tag?.toUpperCase?.() === 'BESTSELLER');
      const hasNewArrivalTag = Array.isArray(product.tags)
        ? product.tags.some(t => (typeof t === 'string' ? t : t?.label)?.toUpperCase()?.includes('NEW'))
        : (product.tag?.toUpperCase?.()?.includes('NEW'));

      setIsBestseller(product.is_bestseller !== undefined ? Boolean(product.is_bestseller) : Boolean(hasBestsellerTag));
      setIsNewArrival(product.is_new_arrival !== undefined ? Boolean(product.is_new_arrival) : Boolean(hasNewArrivalTag));
      setIsMiniature(Boolean(product.is_miniature || product.isMiniature));

      reset({
        name: product.name || "",
        brand: product.brand || "MAHIRASH",
        category: product.category || "",
        subcategory: product.subcategory || "",
        collection: product.collection || product.home_page_collection || (Array.isArray(product.collections) && product.collections[0]) || "",
        gender: product.gender || "Unisex",
        description: product.description || "",
        price: product.price || 0,
        original_price: product.original_price || 0,
        stock: product.stock ?? 10,
        stock_status: product.stock_status || product.availability || "In Stock",
        availability: product.availability || product.stock_status || "In Stock",
        sizes: product.sizes || "",
        top_notes: product.top_notes || "",
        heart_notes: product.heart_notes || "",
        base_notes: product.base_notes || "",
        longevity: product.longevity || "8-12 Hours",
        sillage: product.sillage || "Intense",
        rating: product.rating || 4.5,
        fragrance_family: product.fragrance_family || "",
        fragrance_concentration: product.fragrance_concentration || "",
        shipping_weight: product.shipping?.weight || 0.5,
        shipping_length: product.shipping?.length || 30,
        shipping_breadth: product.shipping?.breadth || 20,
        shipping_height: product.shipping?.height || 5,
      });
    } else {
      setIsBestseller(false);
      setIsNewArrival(false);
      setIsMiniature(false);
      setSizePrices([{ size: "", price: 0, original_price: 0, stock: 10, is_preorder: false, images: [] }]);
      reset({
        name: "",
        brand: "MAHIRASH",
        category: "",
        subcategory: "",
        collection: "",
        gender: "Unisex",
        description: "",
        price: 0,
        original_price: 0,
        stock: 10,
        stock_status: "In Stock",
        availability: "In Stock",
        sizes: "",
        top_notes: "",
        heart_notes: "",
        base_notes: "",
        longevity: "8-12 Hours",
        sillage: "Intense",
        rating: 4.5,
        shipping_weight: 0.5,
        shipping_length: 30,
        shipping_breadth: 20,
        shipping_height: 5,
      });
    }
  }, [product, reset]);


  const toggleProductTag = (tagObj) => {
    setSelectedTags(prev => prev.filter(t => t.label !== tagObj.label));
  };

  const addCustomTag = () => {
    if (!customTagLabel.trim()) return;
    const uppercased = customTagLabel.trim().toUpperCase();
    setSelectedTags(prev => {
      const filtered = prev.filter(t => (t.label || "").toUpperCase() !== uppercased);
      return [...filtered, {
        label: uppercased,
        bg: customTagBg,
        text: customTagText
      }];
    });
    setCustomTagLabel("");
  };

  const addSizePrice = (sizeName = "") => {
    setSizePrices(prev => [...prev, { size: sizeName, price: 0, original_price: 0, stock: 10, is_preorder: false, images: [] }]);
  };

  const removeSizePrice = (index) => {
    setSizePrices(sizePrices.filter((_, i) => i !== index));
  };

  const updateSizePrice = (index, field, value) => {
    const updated = [...sizePrices];
    updated[index][field] = value;
    setSizePrices(updated);
  };

  const addVariantImages = (index, newUrls) => {
    const updated = [...sizePrices];
    const existing = updated[index].images || [];
    const combined = Array.from(new Set([...existing, ...newUrls]));
    updated[index].images = combined;
    if (!updated[index].image && combined.length > 0) {
      updated[index].image = combined[0];
    }
    setSizePrices(updated);
  };

  const removeVariantImage = (variantIndex, imageIndex) => {
    const updated = [...sizePrices];
    const currentImgs = updated[variantIndex].images || [];
    const filtered = currentImgs.filter((_, i) => i !== imageIndex);
    updated[variantIndex].images = filtered;
    updated[variantIndex].image = filtered[0] || "";
    setSizePrices(updated);
  };

  const onSubmit = async (values) => {
    setError("");
    setLoading(true);
    try {
      const validSizePrices = sizePrices
        .filter(sp => sp.size.trim() !== "")
        .map(sp => ({
          size: sp.size.trim(),
          price: Number(sp.price) || 0,
          original_price: Number(sp.original_price) || 0,
          stock: Math.max(0, Number(sp.stock) || 0),
          is_preorder: Boolean(sp.is_preorder),
          images: Array.isArray(sp.images) ? sp.images.filter(Boolean) : [],
          image: sp.images?.[0] || ""
        }));

      const allVariantImages = validSizePrices.flatMap(sp => sp.images).filter(Boolean);
      const defaultPrice = validSizePrices.length > 0 ? validSizePrices[0].price : Number(values.price) || 0;
      const defaultOriginalPrice = validSizePrices.length > 0 ? validSizePrices[0].original_price : Number(values.original_price) || 0;

      const totalVariantStock = validSizePrices.reduce((sum, sp) => sum + (Number(sp.stock) || 0), 0);
      const stockQty = totalVariantStock;
      const autoStatus = stockQty === 0 ? "Out of Stock" : stockQty <= 5 ? "Low Stock" : "In Stock";
      const chosenAvailability = values.availability || values.stock_status || autoStatus;

      const docData = {
        name: values.name,
        brand: values.brand || "MAHIRASH",
        category: values.category,
        subcategory: values.subcategory || "",
        collection: values.collection || "",
        collections: values.collection ? [values.collection] : selectedCollections,
        home_page_collection: values.collection || "",
        gender: values.gender || "Unisex",
        fragrance_family: values.fragrance_family || "",
        fragrance_concentration: values.fragrance_concentration || "",
        availability: chosenAvailability,
        stock_status: chosenAvailability,
        description: values.description,
        price: defaultPrice,
        original_price: defaultOriginalPrice,
        size_prices: validSizePrices,
        stock: stockQty,
        sizes: validSizePrices.map(sp => sp.size).join(", "),
        top_notes: values.top_notes || "",
        heart_notes: values.heart_notes || "",
        base_notes: values.base_notes || "",
        longevity: values.longevity || "8-12 Hours",
        sillage: values.sillage || "Intense",
        rating: Number(values.rating) || 4.5,
        images: allVariantImages.length > 0 ? allVariantImages : [],
        image: allVariantImages[0] || "",
        is_bestseller: Boolean(isBestseller),
        is_new_arrival: Boolean(isNewArrival),
        is_miniature: Boolean(isMiniature),
        is_atelier_edition: false,
        tags: (() => {
          let tagsToSave = [...selectedTags].filter(t => t.label?.toUpperCase() !== 'ATELIER EDITION');
          if (isBestseller && !tagsToSave.some(t => t.label?.toUpperCase() === 'BESTSELLER')) {
            tagsToSave.push({ label: 'BESTSELLER', bg: '#dc2626', text: '#ffffff' });
          } else if (!isBestseller) {
            tagsToSave = tagsToSave.filter(t => t.label?.toUpperCase() !== 'BESTSELLER');
          }
          if (isNewArrival && !tagsToSave.some(t => t.label?.toUpperCase() === 'NEW ARRIVAL')) {
            tagsToSave.push({ label: 'NEW ARRIVAL', bg: '#b8860b', text: '#ffffff' });
          } else if (!isNewArrival) {
            tagsToSave = tagsToSave.filter(t => t.label?.toUpperCase() !== 'NEW ARRIVAL');
          }
          return tagsToSave;
        })(),
        shipping: {
          weight: Number(values.shipping_weight) || 0.5,
          length: Number(values.shipping_length) || 30,
          breadth: Number(values.shipping_breadth) || 20,
          height: Number(values.shipping_height) || 5,
        }
      };


      if (onSuccess) {
        onSuccess(docData);
      }
      reset();
    } catch (err) {
      setError("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const sizeAttr = dbAttributes.find(a => a.name?.toLowerCase() === 'size')?.values || "50ml, 100ml, 200ml, Sample Set";
  const availableSizes = sizeAttr.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">

        {/* Product Name */}
        <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
          <label className="text-[14px] text-zinc-600 uppercase tracking-wide">
            Product Name
          </label>
          <input
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none transition-all text-sm bg-white"
            placeholder="e.g. Royal Amber Oud Extrait"
            {...register("name", { required: true })}
          />
        </div>

        {/* Perfume Brand Beside Name */}
        <div className="space-y-1.5 md:col-span-2 lg:col-span-3">
          <label className="text-[14px] text-zinc-600 uppercase tracking-wide flex items-center justify-between">
            <span>Perfume Brand</span>
            {/* <span className="text-[12px] text-[#b8860b] font-bold">Select or type custom brand</span> */}
          </label>
          <div className="flex gap-2">
            <select
              className="w-1/2 px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none transition-all text-sm bg-white cursor-pointer"
              value={watch("brand")}
              onChange={(e) => setValue("brand", e.target.value)}
            >
              <option value="MAHIRASH">MAHIRASH (Default)</option>
              {dbBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {/* <input
              type="text"
              placeholder="Or enter custom brand name"
              className="w-1/2 px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none transition-all text-sm bg-white"
              {...register("brand")}
            /> */}
          </div>
        </div>

        {/* Category */}
        <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
          <label className="text-[14px] text-zinc-600 uppercase tracking-wide">
            Category
          </label>
          <select
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none transition-all text-sm bg-white cursor-pointer"
            value={watch("category") || ""}
            onChange={(e) => setValue("category", e.target.value, { shouldValidate: true, shouldDirty: true })}
          >
            <option value="">Select Category</option>
            {dbCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Gender */}
        <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
          <label className="text-[14px] text-zinc-600 uppercase tracking-wide">
            Gender
          </label>
          <select
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none transition-all text-sm bg-white cursor-pointer"
            value={watch("gender") || "Unisex"}
            onChange={(e) => setValue("gender", e.target.value, { shouldValidate: true, shouldDirty: true })}
          >
            <option value="Unisex">Unisex</option>
            <option value="Men">Men</option>
            <option value="Women">Women</option>
          </select>
        </div>

        {/* Fragrance Family */}
        <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
          <label className="text-[14px] text-zinc-600 uppercase tracking-wide">
            Fragrance Family
          </label>
          <select
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none transition-all text-sm bg-white cursor-pointer"
            value={watch("fragrance_family") || ""}
            onChange={(e) => setValue("fragrance_family", e.target.value, { shouldValidate: true, shouldDirty: true })}
          >
            <option value="">Select Family</option>
            {dbFragranceFamilies.map((fam) => (
              <option key={fam} value={fam}>{fam}</option>
            ))}
          </select>
        </div>

        {/* Fragrance Concentration */}
        <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
          <label className="text-[14px] text-zinc-600 uppercase tracking-wide">
            Concentration
          </label>
          <select
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none transition-all text-sm bg-white cursor-pointer"
            value={watch("fragrance_concentration") || ""}
            onChange={(e) => setValue("fragrance_concentration", e.target.value, { shouldValidate: true, shouldDirty: true })}
          >
            <option value="">Select Concentration</option>
            {dbFragranceConcentrations.map((conc) => (
              <option key={conc} value={conc}>{conc}</option>
            ))}
          </select>
        </div>

        {/* Home Page Collection Selector */}
        <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
          <label className="text-[14px] text-zinc-600 uppercase tracking-wide flex items-center justify-between">
            <span>Home Page Collection</span>
            <span className="text-[12px] text-[#b8860b] font-semibold">Admin Collection</span>
          </label>
          <select
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none transition-all text-sm bg-white cursor-pointer"
            value={watch("collection") || ""}
            onChange={(e) => setValue("collection", e.target.value, { shouldValidate: true, shouldDirty: true })}
          >
            <option value="">None / Standard</option>
            {dbCollections.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {/* Availability Status Selector */}
        <div className="space-y-1.5 md:col-span-1 lg:col-span-3">
          <label className="text-[14px] text-zinc-600 uppercase tracking-wide flex items-center justify-between">
            <span>Availability Status</span>
            <span className="text-[12px] text-[#b8860b] font-semibold">Managed from Admin</span>
          </label>
          <select
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none transition-all text-sm bg-white cursor-pointer"
            value={watch("availability") || watch("stock_status") || "In Stock"}
            onChange={(e) => {
              setValue("availability", e.target.value, { shouldValidate: true, shouldDirty: true });
              setValue("stock_status", e.target.value, { shouldValidate: true, shouldDirty: true });
            }}
          >
            {dbAvailabilities.length > 0 ? (
              dbAvailabilities.map((avail) => (
                <option key={avail} value={avail}>{avail}</option>
              ))
            ) : (
              <>
                <option value="In Stock">In Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Pre-Order">Pre-Order</option>
                <option value="Limited Edition">Limited Edition</option>
              </>
            )}
          </select>
        </div>

        {/* Featured Showcase Badges (Bestseller, New Arrivals) */}
        <div className="space-y-2 md:col-span-2 lg:col-span-6 bg-gradient-to-r from-amber-50/80 via-stone-50 to-amber-50/40 border border-[#E5D5B8] p-4 rounded-xl mt-1 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="text-[13px] font-bold text-zinc-900 uppercase tracking-wide flex items-center gap-2">
              <Sparkles size={15} className="text-[#b8860b]" />
              Home Page Showcases & Badges
            </label>
            <span className="text-[11px] text-[#b8860b] font-semibold">
              Select which home page sections this product will display in
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {/* Bestseller Checkbox */}
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isBestseller
              ? 'bg-red-50/90 border-red-300 shadow-sm ring-1 ring-red-400/30'
              : 'bg-white border-zinc-200 hover:border-zinc-300'
              }`}>
              <input
                type="checkbox"
                checked={isBestseller}
                onChange={e => setIsBestseller(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  Bestseller
                  <span className="text-[12px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black tracking-normal">HOT</span>
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">
                  Display in home "Bestseller" section
                </span>
              </div>
            </label>

            {/* New Arrivals Checkbox */}
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isNewArrival
              ? 'bg-amber-50/90 border-[#b8860b] shadow-sm ring-1 ring-[#b8860b]/30'
              : 'bg-white border-zinc-200 hover:border-zinc-300'
              }`}>
              <input
                type="checkbox"
                checked={isNewArrival}
                onChange={e => setIsNewArrival(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#b8860b] focus:ring-[#b8860b] accent-[#b8860b] cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  New Arrival
                  <span className="text-[12px] bg-[#b8860b] text-white px-1.5 py-0.5 rounded font-black tracking-normal">NEW</span>
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">
                  Display in "Recent Arrivals" showcase
                </span>
              </div>
            </label>

            {/* Shop Miniatures Checkbox */}
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isMiniature
              ? 'bg-amber-50/90 border-[#b8860b] shadow-sm ring-1 ring-[#b8860b]/30'
              : 'bg-white border-zinc-200 hover:border-zinc-300'
              }`}>
              <input
                type="checkbox"
                checked={isMiniature}
                onChange={e => setIsMiniature(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-[#b8860b] focus:ring-[#b8860b] accent-[#b8860b] cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                  Shop Miniatures
                  <span className="text-[12px] bg-[#b8860b] text-white px-1.5 py-0.5 rounded font-black tracking-normal">MINI</span>
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">
                  Display in "SHOP MINIATURES" section
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Product Tags / Labels */}
        <div className="space-y-1.5 md:col-span-2 lg:col-span-6 bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl mt-3">
          <label className="text-[13px] font-bold text-zinc-800 uppercase tracking-wide flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Tag size={14} className="text-[#b8860b]" />
              Tags & Labels
            </span>
            <span className="text-[12px] text-[#b8860b] font-semibold">
              {selectedTags.length > 0 ? `${selectedTags.length} Selected` : 'Click to add badges'}
            </span>
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            {/* Render custom tag objects */}
            {selectedTags.map((tagObj, idx) => (
              <button
                key={`custom-${idx}`}
                type="button"
                onClick={() => toggleProductTag(tagObj)}
                style={{ backgroundColor: tagObj.bg, color: tagObj.text, borderColor: tagObj.text }}
                className="px-3 py-1.5 text-[14px] font-bold uppercase tracking-wider rounded-lg transition-all border cursor-pointer shadow-sm relative group"
              >
                <span className="group-hover:hidden">{tagObj.label}</span>
                <span className="hidden group-hover:inline">✗ REMOVE</span>
              </button>
            ))}
          </div>

          {/* Custom Tag Inputs */}
          <div className="mt-3 flex flex-wrap items-end gap-3 p-3 bg-white border border-zinc-200 rounded-lg">
            <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
              <label className="text-[12px] font-bold uppercase text-zinc-500">Custom Tag Text</label>
              <input
                type="text"
                value={customTagLabel}
                onChange={e => setCustomTagLabel(e.target.value)}
                className="border border-zinc-300 px-3 py-1.5 text-[14px] font-bold uppercase rounded outline-none focus:border-[#b8860b]"
                placeholder="e.g. VIP ONLY"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold uppercase text-zinc-500">Background Color</label>
              <input type="color" value={customTagBg} onChange={e => setCustomTagBg(e.target.value)} className="h-8 w-12 cursor-pointer border border-zinc-300 rounded" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[12px] font-bold uppercase text-zinc-500">Font Color</label>
              <input type="color" value={customTagText} onChange={e => setCustomTagText(e.target.value)} className="h-8 w-12 cursor-pointer border border-zinc-300 rounded" />
            </div>
            <button
              type="button"
              onClick={addCustomTag}
              className="bg-[#b8860b] text-white px-4 py-1.5 font-bold uppercase text-[14px] h-8 rounded hover:bg-black transition-colors cursor-pointer"
            >
              Add Tag
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-sm font-semibold text-[#71717b] uppercase tracking-wide">
          Description
        </label>
        <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
          <Editor
            apiKey="fyliq0cjbctqb3mtuka0gznhq60oqj2j9seqkjtee5evz7fo"
            value={watch("description") || ""}
            onEditorChange={(content) => setValue("description", content, { shouldValidate: true, shouldDirty: true })}
            init={{
              height: 320,
              menubar: false,
              plugins: [
                'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
                'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
              ],
              toolbar: 'undo redo | blocks | ' +
                'bold italic forecolor | alignleft aligncenter ' +
                'alignright alignjustify | bullist numlist outdent indent | ' +
                'removeformat | help',
              content_style: 'body { font-family:Inter,sans-serif; font-size:14px; color:#27272a }',
              branding: false,
              statusbar: true
            }}
          />
        </div>
      </div>

      {/* Volume & Price Variants Section */}
      <div className="space-y-4 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-sm font-bold text-zinc-900 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#b8860b]" />
            Volume & Price Variants (Per-Variant Images & Pre-Orders)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addSizePrice("")}
              className="px-4 py-2 bg-[#b8860b] text-white text-[14px] font-bold uppercase tracking-wider rounded-lg hover:bg-black transition-colors cursor-pointer"
            >
              + Add Volume Variant
            </button>
          </div>
        </div>

        {/* Quick Size Pills */}
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[12px] text-zinc-500 uppercase font-semibold mr-1">Quick Add Volumes:</span>
          {availableSizes.map(sz => (
            <button
              key={sz}
              type="button"
              onClick={() => addSizePrice(sz)}
              className="px-2.5 py-1 bg-white hover:bg-black hover:text-white text-[11px] font-bold text-zinc-700 rounded-md transition-all cursor-pointer border border-zinc-300"
            >
              + {sz}
            </button>
          ))}
        </div>

        {sizePrices.map((sp, index) => (
          <div key={index} className="space-y-3 bg-white border border-gray-200 p-4 rounded-xl shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">Volume</label>
                <input
                  type="text"
                  value={sp.size}
                  onChange={(e) => updateSizePrice(index, "size", e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none text-sm"
                  placeholder="e.g. 50ml"
                />
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">Original (₹)</label>
                <input
                  type="number"
                  value={sp.original_price}
                  onChange={(e) => updateSizePrice(index, "original_price", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none text-sm"
                  placeholder="4999"
                />
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">Selling (₹)</label>
                <input
                  type="number"
                  value={sp.price}
                  onChange={(e) => updateSizePrice(index, "price", Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none text-sm"
                  placeholder="3999"
                />
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[12px] font-bold text-emerald-700 uppercase tracking-wide flex items-center gap-1">
                  <span>Stock Qty</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={sp.stock ?? 10}
                  onChange={(e) => updateSizePrice(index, "stock", Math.max(0, Number(e.target.value)))}
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-sm font-semibold text-emerald-900 bg-emerald-50/30"
                  placeholder="10"
                />
              </div>
              <div className="space-y-1.5 md:col-span-1">
                <label className="text-[12px] font-bold text-amber-700 uppercase tracking-wide block">
                  Pre-Order
                </label>
                <label className="flex items-center gap-2 h-[38px] px-3 rounded-lg border border-amber-300 bg-amber-50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(sp.is_preorder)}
                    onChange={(e) => updateSizePrice(index, "is_preorder", e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded cursor-pointer"
                  />
                  <span className="text-[14px] font-bold text-amber-900 flex items-center gap-1">
                    <Clock size={13} className="text-amber-600 shrink-0" />
                    <span>Pre-Order</span>
                  </span>
                </label>
              </div>
              <div className="flex items-center justify-end md:col-span-1">
                {sizePrices.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSizePrice(index)}
                    className="w-full py-2 bg-red-100 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-200 transition-colors cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            {/* Multiple Images per Variant Gallery */}
            <div className="pt-3 border-t border-zinc-100 space-y-2 bg-zinc-50 p-3 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-[12px] font-bold text-zinc-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-[#b8860b]" />
                  <span>Images for {sp.size || `Variant ${index + 1}`} ({sp.images?.length || 0} Images)</span>
                </span>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1 bg-black text-white hover:bg-zinc-800 text-[11px] font-bold rounded cursor-pointer transition-all shadow-xs flex items-center gap-1">
                    <Upload size={12} />
                    <span>Upload Images</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length > 0) {
                          const uploaded = [];
                          for (const file of files) {
                            const url = await uploadToCloudinary(file);
                            uploaded.push(url);
                          }
                          addVariantImages(index, uploaded);
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setPickerVariantIndex(index);
                      setIsPickerOpen(true);
                    }}
                    className="px-3 py-1 bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-300 text-[11px] font-bold rounded transition-all cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <ImageIcon size={12} className="text-[#b8860b]" />
                    <span>Cloudinary</span>
                  </button>
                </div>
              </div>

              {/* Variant Images Grid */}
              {Array.isArray(sp.images) && sp.images.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {sp.images.map((imgUrl, imgIdx) => (
                    <div key={imgIdx} className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-zinc-200 group bg-white shadow-xs">
                      <OptimizedCloudinaryImage
                        src={imgUrl}
                        preset="avatar"
                        className="w-full h-full object-cover"
                        alt={`Variant ${sp.size} image ${imgIdx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => removeVariantImage(index, imgIdx)}
                        className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full hover:bg-red-700 transition-colors shadow"
                        title="Remove photo"
                      >
                        <X size={10} />
                      </button>
                      {imgIdx === 0 && (
                        <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[7px] font-extrabold text-center uppercase py-0.5">
                          Main
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400 italic">No images added for this variant yet. Upload photos or choose from Cloudinary library above.</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Fragrance Pyramids & Notes Section */}
      <div className="space-y-3 bg-zinc-900 text-white p-4 rounded-xl border border-zinc-800">
        <label className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-[#c9a962]">
          <Sparkles size={16} /> Olfactory Notes & Fragrance Pyramid
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Top Notes</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-[14px] outline-none focus:border-[#c9a962]"
              placeholder="e.g. Bergamot, Saffron, Pink Pepper"
              {...register("top_notes")}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Heart / Middle Notes</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-[14px] outline-none focus:border-[#c9a962]"
              placeholder="e.g. Damask Rose, Jasmine, Cedarwood"
              {...register("heart_notes")}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Base Notes</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-[14px] outline-none focus:border-[#c9a962]"
              placeholder="e.g. Royal Oud, Sandalwood, Amber, Musk"
              {...register("base_notes")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Longevity</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-[14px] outline-none focus:border-[#c9a962]"
              placeholder="e.g. 12+ Hours"
              {...register("longevity")}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">Sillage / Projection</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-[14px] outline-none focus:border-[#c9a962]"
              placeholder="e.g. Intense / Heavy Sillage"
              {...register("sillage")}
            />
          </div>
        </div>
      </div>

      {/* Shiprocket Package Information */}
      <div className="space-y-3 bg-zinc-50 border border-zinc-200 p-4 rounded-xl">
        <label className="text-[14px] font-extrabold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <Package className="text-[#b8860b]" size={16} /> Package Info (For Shiprocket)
        </label>
        <span className="text-[11px] font-medium text-zinc-500 block">Provide final package dimensions (cm) and packed weight (kg) for accurate Shiprocket freight charges. Minimum weight should be 0.5kg for standard boxes.</span>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[14px] font-semibold text-zinc-600 uppercase">Weight (kg)</label>
            <input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#c9a962] outline-none text-sm bg-white" {...register("shipping_weight")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[14px] font-semibold text-zinc-600 uppercase">Length (cm)</label>
            <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#c9a962] outline-none text-sm bg-white" {...register("shipping_length")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[14px] font-semibold text-zinc-600 uppercase">Breadth (cm)</label>
            <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#c9a962] outline-none text-sm bg-white" {...register("shipping_breadth")} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[14px] font-semibold text-zinc-600 uppercase">Height (cm)</label>
            <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-[#c9a962] outline-none text-sm bg-white" {...register("shipping_height")} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-[#71717b] uppercase tracking-wide">
            Rating
          </label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="5"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none transition-all text-sm bg-white"
            placeholder="4.5"
            {...register("rating")}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 mt-4">
        {formState.isSubmitted && !loading && !error && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
            Product {isEdit ? "Updated" : "Created"} Successfully
          </span>
        )}
        {error && (
          <span className="text-sm text-red-600 font-semibold">
            Error: {error}
          </span>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 rounded-xl bg-black text-white text-sm font-bold shadow-md hover:bg-zinc-800 transition-all disabled:opacity-60 disabled:translate-y-0 cursor-pointer"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-[#71717b]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {isEdit ? "Saving..." : "Uploading..."}
            </span>
          ) : isEdit ? "Save Changes" : "Publish Product"}
        </button>
      </div>

      <CloudinaryMediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => {
          setIsPickerOpen(false);
          setPickerVariantIndex(null);
        }}
        isMultiSelect={true}
        onSelect={(selected) => {
          if (pickerVariantIndex !== null) {
            const urls = Array.isArray(selected) ? selected : [selected];
            addVariantImages(pickerVariantIndex, urls);
          }
        }}
      />
    </form >
  );
};

export default ProductForm;
