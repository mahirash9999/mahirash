import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, setDoc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Package, Heart, LogOut, ChevronRight, Settings, ShoppingBag,
  CreditCard, MapPin, Bell, Camera, Plus, Trash2, Edit3, Check, X,
  ShieldCheck, Truck, RotateCcw, Download, Printer, Phone, CheckCircle2,
  Clock, AlertCircle, Sparkles, Star, Award, Compass, Search, Copy,
  ExternalLink, ArrowRight, MessageSquare, HelpCircle, RefreshCw, KeyRound,
  Sliders, Tag, CheckSquare, Gift, ShieldAlert, Mail
} from "lucide-react";

import MiniLoader from "../components/MiniLoader";
import SEOHead from "../components/SEOHead";
import { auth, db } from "../components/Firebase";
import { useAuth } from "../components/useAuth";
import { useCustomerAuth } from "../components/CustomerAuthProvider";
import { useStore } from "../components/StoreProvider";
import uploadToCloudinary from "../utils/cloudinary";
import OptimizedCloudinaryImage from "../components/OptimizedCloudinaryImage";
import { cleanPhone, isValidPhone, cleanPincode, isValidPincode, isValidName, sanitizeText } from "../utils/validation";

// Fragrance Family definitions for Mahirash signature differentiator
const FRAGRANCE_FAMILIES = [
  { id: "woody", label: "Woody & Smoky", notes: "Cedarwood, Sandalwood, Agarwood / Oud, Vetiver" },
  { id: "oriental", label: "Amber & Oriental", notes: "Ambergris, Warm Vanilla, Spiced Cardamom, Saffron" },
  { id: "floral", label: "Rare Florals", notes: "Damask Rose, Grasse Jasmine, Neroli, Ylang-Ylang" },
  { id: "citrus", label: "Zesty Citrus", notes: "Italian Bergamot, Blood Orange, Mandora, Grapefruit" },
  { id: "fresh", label: "Fresh Aquatic", notes: "Sea Salt, Dewy Rain, Mineral Accord, Juniper" },
  { id: "gourmand", label: "Sweet Gourmand", notes: "Bourbon Vanilla, Toasted Almond, Dark Chocolate, Tonka" }
];

const OCCASIONS = [
  { id: "daily", label: "Daily Signature" },
  { id: "office", label: "Executive / Boardroom" },
  { id: "evening", label: "Evening Gala & Soirée" },
  { id: "celebration", label: "Royal Occasions & Weddings" }
];

const INTENSITIES = [
  { id: "subtle", label: "Subtle & Intimate (EDC / Cologne)" },
  { id: "moderate", label: "Balanced Sillage (Eau de Parfum 15-20%)" },
  { id: "intense", label: "Potent & Long-Lasting (Extrait de Parfum 30%+)" }
];

const CURATED_PERFUMES = [
  {
    id: "mhr-oud-royale",
    name: "Oud Royale Extrait",
    brand: "MAHIRASH",
    collection: "Royal Edition",
    concentration: "Extrait de Parfum (30%)",
    price: 4999,
    originalPrice: 6500,
    rating: 4.9,
    family: "Woody & Amber",
    notes: "Assam Agarwood, Bulgarian Rose, Smoked Leather, Ambergris",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "mhr-bergamot-reserve",
    name: "Tuscan Bergamot & Cedar",
    brand: "MAHIRASH",
    collection: "Private Reserve",
    concentration: "Eau de Parfum (20%)",
    price: 3499,
    originalPrice: 4200,
    rating: 4.8,
    family: "Citrus & Woody",
    notes: "Calabrian Bergamot, Pink Peppercorn, Haitian Vetiver, White Amber",
    image: "https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&q=80&w=800"
  },
  {
    id: "mhr-velvet-amber",
    name: "Velvet Amber & Vanilla",
    brand: "MAHIRASH",
    collection: "Signature Reserve",
    concentration: "Extrait de Parfum (32%)",
    price: 4299,
    originalPrice: 5500,
    rating: 5.0,
    family: "Oriental Amber",
    notes: "Golden Amber, Madagascar Bourbon Vanilla, Tonka, Frankincense",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&q=80&w=800"
  }
];

const FAQS = [
  {
    q: "How does Mahirash ship orders & what is the delivery timeline?",
    a: "All orders are hand-inspected, bottled, securely packaged with custom foam padding, and shipped via Shiprocket premium air couriers (Delhivery, Blue Dart, DTDC). Metro deliveries arrive within 2–3 business days; other locations within 3–5 business days."
  },
  {
    q: "How should I store my artisanal Extrait de Parfum?",
    a: "Store your luxury perfume in a cool, dark environment away from direct sunlight, humidity, and extreme temperature variations to maintain fragrance freshness and longevity."
  },
  {
    q: "What is the return & replacement policy for fragrances?",
    a: "To ensure highest hygiene and authenticity standards, we offer replacements for any item damaged in transit. We also provide a 7-day unopened return policy if the outer cellophane seal remains completely intact."
  },
  {
    q: "Are Mahirash fragrances certified authentic?",
    a: "Yes. Every Mahirash creation comes with an embossed batch serial number, tamper-evident security seal, and official certificate of formulation authenticity."
  }
];

const Account = () => {
  const { customer, customerLogout } = useCustomerAuth();
  const { logout: firebaseLogout, user: firebaseUser } = useAuth();
  const { cart, wishlist, removeFromCart, updateQuantity, removeFromWishlist, addToCart } = useStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeEmail = (customer?.email || firebaseUser?.email || "").toLowerCase().trim();
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab) => {
    setSearchParams({ tab }, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Profile fields
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [dob, setDob] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Addresses
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
    flat: "",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    type: "Home",
    isDefault: false
  });

  // Fragrance Preferences (Mahirash differentiator)
  const [preferences, setPreferences] = useState({
    families: ["woody", "oriental"],
    occasion: "daily",
    intensity: "intense",
    notes: ["Royal Oud", "Italian Bergamot", "Mysore Sandalwood"]
  });
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Modals & Order Tracking
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTrackingAwb, setActiveTrackingAwb] = useState(null);
  const [trackingModalData, setTrackingModalData] = useState(null);
  const [loadingTrackingModal, setLoadingTrackingModal] = useState(false);

  // Order status filter & search
  const [orderFilter, setOrderFilter] = useState("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");

  // Customer Reviews state
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ productName: "", rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Notification toggles
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    whatsappUpdates: true,
    promotionalOffers: false,
    newsletter: true,
    securityAlerts: true
  });

  const showToast = (msg, type = "success") => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Fetch all user account details
  const fetchData = useCallback(async (email) => {
    if (!email) return;
    setLoading(true);
    try {
      const cleanEmail = email.toLowerCase().trim();
      const customerDocId = cleanEmail.replace(/[^a-z0-9]/g, "_");

      // 1. Fetch customer document
      const customerSnap = await getDoc(doc(db, "customers", customerDocId));
      if (customerSnap.exists()) {
        const d = customerSnap.data();
        setUserData(d);
        setDisplayName(d.name || customer?.name || firebaseUser?.displayName || "");
        setPhone(d.phone || customer?.phone || "");
        setBio(d.bio || d.shortBio || "");
        setDob(d.dob || "");
        if (d.preferences) {
          setPreferences(prev => ({ ...prev, ...d.preferences }));
        }
        if (d.notifications) {
          setNotifications(prev => ({ ...prev, ...d.notifications }));
        }
      } else {
        setDisplayName(customer?.name || firebaseUser?.displayName || "");
        setPhone(customer?.phone || "");
      }

      // 2. Fetch orders via server API
      let ordersList = [];
      try {
        const apiRes = await fetch(`/api/get-orders?email=${encodeURIComponent(cleanEmail)}&userId=${encodeURIComponent(customer?.uid || firebaseUser?.uid || "")}`);
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (Array.isArray(apiData.orders)) {
            ordersList = apiData.orders;
          }
        }
      } catch (apiErr) {
        console.warn("Orders fetch server notice:", apiErr);
      }

      if (ordersList.length === 0) {
        try {
          const ordersSnap = await getDocs(query(collection(db, "orders"), where("userEmail", "==", cleanEmail)));
          ordersList = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          ordersList.sort((a, b) => {
            const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
            const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
            return tB - tA;
          });
        } catch (_) {}
      }
      setRecentOrders(ordersList);

      // 3. Fetch addresses
      try {
        const addrSnap = await getDocs(collection(db, "customers", customerDocId, "addresses"));
        const addrsList = addrSnap.docs.map(aDoc => ({ id: aDoc.id, ...aDoc.data() }));
        if (addrsList.length === 0 && customerSnap.exists()) {
          const cd = customerSnap.data();
          if (cd.address) {
            addrsList.push({
              id: "legacy-root-address",
              name: cd.name || displayName || "Client",
              phone: cd.phone || phone || "",
              address: cd.address || "",
              city: cd.city || "",
              state: cd.state || "",
              pincode: cd.pincode || "",
              type: "Home",
              isDefault: true
            });
          }
        }
        setAddresses(addrsList);
      } catch (_) {}

      // 4. Fetch customer reviews
      try {
        const revSnap = await getDocs(query(collection(db, "reviews"), where("userEmail", "==", cleanEmail)));
        setReviews(revSnap.docs.map(rd => ({ id: rd.id, ...rd.data() })));
      } catch (_) {}

    } catch (err) {
      console.error("Account data load error:", err);
    } finally {
      setLoading(false);
    }
  }, [customer?.name, customer?.phone, customer?.uid, firebaseUser?.displayName, firebaseUser?.uid]);

  useEffect(() => {
    if (!customer?.email && !firebaseUser?.email) {
      navigate("/login?redirect=account");
      return;
    }
    fetchData(activeEmail);
  }, [activeEmail, fetchData, navigate, customer?.email, firebaseUser?.email]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you wish to log out from your Mahirash account?")) {
      try {
        customerLogout();
        if (firebaseLogout) await firebaseLogout();
        navigate("/");
      } catch (err) {
        console.error("Logout notice:", err);
        navigate("/");
      }
    }
  };

  // Avatar upload
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const imageUrl = await uploadToCloudinary(file, "logo");
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: imageUrl });
      }
      const docId = activeEmail.replace(/[^a-z0-9]/g, "_");
      await setDoc(doc(db, "customers", docId), { photoURL: imageUrl }, { merge: true });
      setUserData(prev => ({ ...prev, photoURL: imageUrl }));
      showToast("Profile avatar updated successfully!");
    } catch (err) {
      showToast("Avatar update failed: " + err.message, "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const cleanDName = sanitizeText(displayName, 60);
    if (!cleanDName || !isValidName(cleanDName)) {
      showToast("Please enter a valid full name (at least 2 letters)", "error");
      return;
    }
    const cleanP = cleanPhone(phone);
    if (cleanP && !isValidPhone(cleanP)) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }

    setSavingProfile(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: cleanDName });
      }
      const docId = activeEmail.replace(/[^a-z0-9]/g, "_");
      await setDoc(doc(db, "customers", docId), {
        name: cleanDName,
        phone: cleanP,
        shortBio: sanitizeText(bio, 250),
        dob,
        email: activeEmail,
        updatedAt: serverTimestamp()
      }, { merge: true });

      setUserData(prev => ({ ...prev, name: cleanDName, phone: cleanP, bio, dob }));
      showToast("Profile information saved!");
    } catch (err) {
      showToast("Error updating profile: " + err.message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  // Fragrance Preferences save
  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      const docId = activeEmail.replace(/[^a-z0-9]/g, "_");
      await setDoc(doc(db, "customers", docId), {
        preferences,
        updatedAt: serverTimestamp()
      }, { merge: true });
      showToast("Fragrance preferences updated! Your recommendations are refreshed.");
    } catch (err) {
      showToast("Failed to save fragrance preferences: " + err.message, "error");
    } finally {
      setSavingPreferences(false);
    }
  };

  // Addresses CRUD
  const resetAddressForm = () => {
    setAddressForm({
      name: "",
      phone: "",
      alternatePhone: "",
      flat: "",
      street: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      type: "Home",
      isDefault: false
    });
    setEditingAddressId(null);
    setShowAddressForm(false);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const cleanP = cleanPhone(addressForm.phone);
    if (!isValidPhone(cleanP)) {
      showToast("Please enter a valid 10-digit phone number", "error");
      return;
    }
    const cleanPin = cleanPincode(addressForm.pincode);
    if (!isValidPincode(cleanPin)) {
      showToast("Please enter a valid 6-digit Indian PIN code", "error");
      return;
    }

    const synthesizedAddress = [
      addressForm.flat,
      addressForm.street,
      addressForm.landmark ? `Near ${addressForm.landmark}` : null
    ].filter(Boolean).join(", ");

    const payload = {
      ...addressForm,
      phone: cleanP,
      alternatePhone: cleanPhone(addressForm.alternatePhone),
      pincode: cleanPin,
      address: synthesizedAddress
    };

    try {
      const docId = activeEmail.replace(/[^a-z0-9]/g, "_");
      const colRef = collection(db, "customers", docId, "addresses");

      if (editingAddressId) {
        if (editingAddressId === "legacy-root-address") {
          const newDoc = await addDoc(colRef, payload);
          setAddresses(prev => prev.map(a => a.id === editingAddressId ? { id: newDoc.id, ...payload } : a));
        } else {
          await updateDoc(doc(db, "customers", docId, "addresses", editingAddressId), payload);
          setAddresses(prev => prev.map(a => a.id === editingAddressId ? { ...a, ...payload } : a));
        }
        showToast("Address updated successfully!");
      } else {
        const docRef = await addDoc(colRef, payload);
        setAddresses(prev => [...prev, { id: docRef.id, ...payload }]);
        showToast("New delivery address added!");
      }
      resetAddressForm();
    } catch (err) {
      showToast("Failed to save address: " + err.message, "error");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Remove this address from your profile?")) return;
    try {
      const docId = activeEmail.replace(/[^a-z0-9]/g, "_");
      if (id !== "legacy-root-address") {
        await deleteDoc(doc(db, "customers", docId, "addresses", id));
      }
      setAddresses(prev => prev.filter(a => a.id !== id));
      showToast("Address deleted");
    } catch (err) {
      showToast("Error deleting address: " + err.message, "error");
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
      setAddresses(updated);
      const docId = activeEmail.replace(/[^a-z0-9]/g, "_");
      for (const a of updated) {
        if (a.id === "legacy-root-address") continue;
        await updateDoc(doc(db, "customers", docId, "addresses", a.id), { isDefault: a.id === id });
      }
      showToast("Primary shipping address updated!");
    } catch (err) {
      console.warn("Error setting default address:", err);
    }
  };

  // Live Tracking Modal
  const openTrackingModal = async (order) => {
    setSelectedOrder(order);
    const awb = order.awbCode;
    setActiveTrackingAwb(awb || order.id);
    setLoadingTrackingModal(true);

    try {
      const url = awb ? `/api/shipping/track?awb=${encodeURIComponent(awb)}` : `/api/shipping/track?orderId=${encodeURIComponent(order.id)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTrackingModalData(data);
      } else {
        setTrackingModalData(null);
      }
    } catch (err) {
      console.warn("Tracking fetch notice:", err);
    } finally {
      setLoadingTrackingModal(false);
    }
  };

  // Printable tax invoice
  const handleDownloadInvoice = (order) => {
    const invoiceWindow = window.open("", "_blank", "width=850,height=950");
    if (!invoiceWindow) {
      alert("Please allow popups to view or print the official tax invoice.");
      return;
    }

    const orderDate = order.createdAt?.toDate
      ? order.createdAt.toDate().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
      : "Recent";

    const itemsRows = (order.items || []).map((item, idx) => `
      <tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e5e5e5; font-size: 12px; color: #555;">${idx + 1}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e5e5e5; font-size: 12px; font-weight: 600; color: #111;">
          ${item.name}
          ${item.size ? `<span style="font-size:10px; color:#888; margin-left: 6px;">(${item.size})</span>` : ""}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e5e5e5; font-size: 12px; text-align: center; color: #333;">${item.quantity || item.units || 1}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e5e5e5; font-size: 12px; text-align: right; color: #333;">₹${(item.price || 0).toLocaleString()}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #e5e5e5; font-size: 12px; text-align: right; font-weight: 700; color: #000;">₹${((item.price || 0) * (item.quantity || item.units || 1)).toLocaleString()}</td>
      </tr>
    `).join("");

    invoiceWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - #${order.id.toUpperCase()} | MAHIRASH</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 40px; color: #111; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 25px; border-bottom: 2px solid #b8860b; }
          .logo { font-size: 24px; font-weight: 300; letter-spacing: 0.25em; text-transform: uppercase; color: #111; }
          .logo span { color: #b8860b; font-weight: 600; }
          .badge { background: #faf5eb; color: #b8860b; border: 1px solid #e5d5b8; font-size: 10px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; border-radius: 2px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 25px; }
          .table th { background: #faf8f5; border-bottom: 1px solid #d4af37; padding: 10px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #444; }
          .total-box { margin-top: 30px; display: flex; justify-content: flex-end; }
          .total-table { width: 280px; font-size: 12px; }
          .total-table td { padding: 6px 0; }
          .final-price { font-size: 16px; font-weight: bold; color: #b8860b; border-top: 1px solid #ddd; padding-top: 8px; }
          .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee; font-size: 10px; color: #777; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">MAHI<span>RASH</span></div>
            <p style="font-size: 11px; color: #666; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.1em;">Luxury Perfumes Store</p>
          </div>
          <div style="text-align: right;">
            <span class="badge">Official Tax Invoice</span>
            <p style="font-size: 12px; font-family: monospace; margin: 8px 0 0 0; font-weight: bold;">#${order.id.toUpperCase()}</p>
            <p style="font-size: 11px; color: #666; margin: 2px 0 0 0;">Date: ${orderDate}</p>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 30px; font-size: 12px; line-height: 1.6;">
          <div>
            <strong style="text-transform: uppercase; font-size: 10px; color: #888; letter-spacing: 0.1em;">Billed & Shipped To:</strong>
            <p style="margin: 4px 0 0 0; font-weight: bold; text-transform: uppercase;">${order.shipping?.name || order.customerName || displayName || "Client"}</p>
            <p style="margin: 2px 0 0 0; color: #555;">${order.shipping?.address || "Delivery Address"}</p>
            <p style="margin: 2px 0 0 0; color: #555;">${order.shipping?.city || "Indore"}, ${order.shipping?.state || "MP"} - ${order.shipping?.pincode || "452001"}</p>
            <p style="margin: 2px 0 0 0; color: #b8860b; font-weight: bold;">Phone: ${order.shipping?.phone || order.customerPhone || ""}</p>
          </div>
          <div style="text-align: right;">
            <strong style="text-transform: uppercase; font-size: 10px; color: #888; letter-spacing: 0.1em;">Payment & Fulfillment:</strong>
            <p style="margin: 4px 0 0 0;">Mode: <strong style="text-transform: uppercase;">${order.paymentMethod || "Online"}</strong></p>
            <p style="margin: 2px 0 0 0;">Status: <strong style="color: #059669;">${(order.paymentStatus || "Paid").toUpperCase()}</strong></p>
            ${order.awbCode ? `<p style="margin: 2px 0 0 0; color: #555;">AWB: <span style="font-family: monospace;">${order.awbCode}</span></p>` : ""}
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="text-align: left;">#</th>
              <th style="text-align: left;">Fragrance Formulation</th>
              <th>Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="total-box">
          <table class="total-table">
            <tr>
              <td>Subtotal</td>
              <td style="text-align: right;">₹${(order.subtotal || order.total || 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Express Insured Shipping</td>
              <td style="text-align: right; color: #059669; font-weight: bold;">COMPLIMENTARY</td>
            </tr>
            ${order.discount ? `
            <tr>
              <td>Member Discount</td>
              <td style="text-align: right; color: #b8860b;">-₹${order.discount.toLocaleString()}</td>
            </tr>` : ""}
            <tr class="final-price">
              <td>Total Amount Paid</td>
              <td style="text-align: right;">₹${(order.total || 0).toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div class="footer">
          <p>Thank you for shopping with Mahirash Luxury Perfumes.</p>
          <p>For customer support queries, write to care@mahirash.com or WhatsApp +91 9584826112.</p>
        </div>
      </body>
      </html>
    `);
    invoiceWindow.document.close();
    setTimeout(() => {
      invoiceWindow.focus();
      invoiceWindow.print();
    }, 500);
  };

  // Submit product review
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReview.productName.trim() || !newReview.comment.trim()) {
      showToast("Please provide both product title and feedback text", "error");
      return;
    }
    setSubmittingReview(true);
    try {
      const reviewPayload = {
        userEmail: activeEmail,
        userName: displayName || "Customer",
        productName: newReview.productName.trim(),
        rating: Number(newReview.rating) || 5,
        comment: sanitizeText(newReview.comment, 500),
        status: "approved",
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "reviews"), reviewPayload);
      setReviews(prev => [reviewPayload, ...prev]);
      setNewReview({ productName: "", rating: 5, comment: "" });
      showToast("Thank you! Your fragrance review has been recorded.");
    } catch (err) {
      showToast("Error recording review: " + err.message, "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Derived counts
  const activeOrdersCount = useMemo(() => {
    return recentOrders.filter(o => {
      const s = (o.shipmentStatus || o.status || "").toLowerCase();
      return s !== "delivered" && s !== "cancelled" && s !== "failed";
    }).length;
  }, [recentOrders]);

  const activeShipment = useMemo(() => {
    return recentOrders.find(o => {
      const s = (o.shipmentStatus || o.status || "").toLowerCase();
      return s !== "delivered" && s !== "cancelled" && s !== "failed";
    }) || recentOrders[0] || null;
  }, [recentOrders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return recentOrders.filter(order => {
      const s = (order.shipmentStatus || order.status || "").toLowerCase();
      if (orderFilter === "active" && (s === "delivered" || s === "cancelled")) return false;
      if (orderFilter === "delivered" && s !== "delivered") return false;
      if (orderFilter === "cancelled" && s !== "cancelled") return false;
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesItems = (order.items || []).some(it => it.name?.toLowerCase().includes(q));
        if (!matchesId && !matchesItems) return false;
      }
      return true;
    });
  }, [recentOrders, orderFilter, orderSearchQuery]);

  // Navigation menu items
  const NAV_ITEMS = [
    { id: "overview", label: "Dashboard Overview", icon: Compass },
    { id: "orders", label: "My Orders & Tracking", icon: Package, badge: activeOrdersCount > 0 ? activeOrdersCount : null, badgeColor: "bg-[#b8860b]" },
    { id: "wishlist", label: "Saved Fragrances", icon: Heart, badge: wishlist.length > 0 ? wishlist.length : null },
    { id: "cart", label: "Shopping Bag", icon: ShoppingBag, badge: cart.length > 0 ? cart.length : null },
    { id: "preferences", label: "Fragrance Profile", icon: Sliders, badge: "Custom", badgeColor: "bg-emerald-600" },
    { id: "profile", label: "Personal Information", icon: User },
    { id: "addresses", label: "Shipping Addresses", icon: MapPin },
    { id: "payments", label: "Payment History", icon: CreditCard },
    { id: "reviews", label: "Reviews & Ratings", icon: Star },
    { id: "rewards", label: "Offers & Club Rewards", icon: Award },
    { id: "notifications", label: "Notification Settings", icon: Bell },
    { id: "support", label: "Customer Support & Help", icon: MessageSquare },
    { id: "settings", label: "Account Security", icon: Settings }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center pt-28">
        <SEOHead title="Customer Dashboard | Mahirash" />
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border border-zinc-300 border-t-[#b8860b] animate-spin mx-auto rounded-full" />
          <p className="text-[12px] md:text-[14px] uppercase tracking-[0.2em] text-zinc-500 font-light">
            Entering Mahirash Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] text-zinc-900 pt-28 pb-20 selection:bg-[#b8860b] selection:text-white">
      <SEOHead title="Customer Dashboard | Mahirash" />

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-4 z-50 px-5 py-3 rounded border shadow-xl flex items-center gap-2.5 text-xs uppercase tracking-wider font-semibold ${
              toastMessage.type === "error"
                ? "bg-red-50 text-red-800 border-red-300"
                : "bg-black text-white border-[#b8860b]"
            }`}
          >
            {toastMessage.type === "error" ? <AlertCircle size={15} /> : <CheckCircle2 size={15} className="text-[#b8860b]" />}
            <span>{toastMessage.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ─── LUXURY CLIENT HEADER BANNER ─────────────────────────────────── */}
        <div className="bg-white border border-zinc-200/90 shadow-sm p-6 md:p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#faf5eb]/80 to-transparent pointer-events-none" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            {/* User Profile Card Left */}
            <div className="flex items-center gap-5">
              <div className="relative group shrink-0">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-[#b8860b]/40 overflow-hidden bg-zinc-100 flex items-center justify-center shadow-inner">
                  {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-light text-[#b8860b] uppercase font-serif">
                      {(displayName || activeEmail || "M")[0]}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="avatar-input"
                  className="absolute bottom-0 right-0 p-1.5 bg-black text-white hover:bg-[#b8860b] rounded-full cursor-pointer transition-all shadow-md"
                  title="Upload avatar"
                >
                  <Camera size={12} />
                  <input
                    id="avatar-input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-light text-zinc-950 uppercase tracking-widest font-serif">
                    {displayName || "Valued Customer"}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-[#faf5eb] border border-[#e5d5b8] text-[#b8860b] text-[12px] uppercase font-bold tracking-widest inline-flex items-center gap-1 rounded-xs">
                    <Sparkles size={12} /> Privilege Member
                  </span>
                </div>
                <p className="text-xs text-zinc-500 font-mono tracking-wide">{activeEmail}</p>
                {phone && (
                  <p className="text-xs text-zinc-500 flex items-center gap-1.5 font-mono">
                    <Phone size={10} className="text-[#b8860b]" /> {phone}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Right */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden px-4 py-2 border border-zinc-300 text-xs uppercase tracking-wider font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors flex items-center gap-2"
              >
                <Sliders size={13} />
                <span>Dashboard Menu</span>
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-zinc-300 bg-zinc-50 text-zinc-700 text-xs uppercase tracking-widest font-medium hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all flex items-center gap-2"
              >
                <LogOut size={12} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── DASHBOARD GRID: SIDEBAR & MAIN BODY ──────────────────────────── */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">

          {/* Mobile Backdrop */}
          {mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
            />
          )}

          {/* ─── SIDEBAR NAVIGATION (NO HORIZONTAL OVERFLOW) ────────────────── */}
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-zinc-200 p-6 flex flex-col h-screen overflow-y-auto transition-transform duration-300 lg:static lg:translate-x-0 lg:w-full lg:h-auto lg:p-0 lg:border-none lg:bg-transparent lg:col-span-3 ${
              mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            {/* Mobile Sidebar Header */}
            <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-[#b8860b]" />
                <span className="text-xs uppercase tracking-widest font-bold text-zinc-900">
                  Client Navigation
                </span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-zinc-400 hover:text-black">
                <X size={18} />
              </button>
            </div>

            {/* Sidebar Card */}
            <div className="bg-white border border-zinc-200 shadow-sm p-3 rounded-xs space-y-1">
              <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                <span className="text-[12px] font-bold text-zinc-400 uppercase tracking-[0.2em] block">
                  Customer Menu
                </span>
              </div>

              {NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-xs md:text-sm font-medium uppercase tracking-wider transition-all rounded-xs text-left cursor-pointer ${
                      isActive
                        ? "bg-black text-white shadow-sm font-semibold"
                        : "text-zinc-600 hover:bg-[#faf8f5] hover:text-black"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon size={15} className={isActive ? "text-[#b8860b]" : "text-zinc-400"} />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.2 text-[11px] md:text-[12px] font-bold rounded-full ${
                          isActive
                            ? "bg-[#b8860b] text-white"
                            : "bg-zinc-200 text-zinc-800"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Customer Support Card */}
            <div className="mt-4 p-4 bg-gradient-to-br from-[#faf5eb] to-[#f4ebe1] border border-[#e5d5b8] rounded-xs space-y-2">
              <div className="flex items-center gap-2 text-[#b8860b]">
                <Sparkles size={16} />
                <span className="text-[12px] md:text-[14px] font-bold uppercase tracking-wider">Customer Support</span>
              </div>
              <p className="text-[12px] text-zinc-600 leading-relaxed">
                Need fragrance advice or bottle gifting recommendations? Speak directly with our team.
              </p>
              <a
                href="https://wa.me/919584826112?text=Hello%20Mahirash%20Support,%20I%20would%20like%20assistance%20with%20my%20order."
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] md:text-[13px] font-bold text-zinc-900 uppercase tracking-wider hover:text-[#b8860b] transition-colors"
              >
                <span>WhatsApp Support</span>
                <ArrowRight size={12} />
              </a>
            </div>
          </aside>

          {/* ─── MAIN CONTENT AREA ────────────────────────────────────────── */}
          <main className="lg:col-span-9 space-y-8 min-w-0">

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 1: OVERVIEW                                                */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "overview" && (
              <div className="space-y-8 animate-fadeIn">

                {/* 1. Ultra-Luxurious Spacious 4-Metric Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Total Orders */}
                  <div
                    onClick={() => setActiveTab("orders")}
                    className="group bg-white border border-zinc-200/90 p-5 hover:border-black transition-all cursor-pointer shadow-xs rounded-xs"
                  >
                    <div className="w-10 h-10 border border-zinc-200 flex items-center justify-center text-zinc-600 mb-3 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                      <Package size={16} strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-light text-zinc-950 font-serif">{recentOrders.length}</p>
                    <p className="text-xs font-semibold text-zinc-800 uppercase tracking-widest mt-1">Total Orders</p>
                    <p className="text-[12px] text-zinc-400 mt-0.5">Lifetime purchases</p>
                  </div>

                  {/* Active Orders */}
                  <div
                    onClick={() => setActiveTab("orders")}
                    className="group bg-white border border-zinc-200/90 p-5 hover:border-[#b8860b] transition-all cursor-pointer shadow-xs rounded-xs"
                  >
                    <div className="w-10 h-10 border border-[#e5d5b8] bg-[#faf5eb] flex items-center justify-center text-[#b8860b] mb-3 group-hover:bg-[#b8860b] group-hover:text-white transition-all">
                      <Truck size={16} strokeWidth={1.5} />
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-light text-zinc-950 font-serif">{activeOrdersCount}</p>
                      {activeOrdersCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-zinc-800 uppercase tracking-widest mt-1">Active Shipments</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">In transit or preparing</p>
                  </div>

                  {/* Wishlist */}
                  <div
                    onClick={() => setActiveTab("wishlist")}
                    className="group bg-white border border-zinc-200/90 p-5 hover:border-black transition-all cursor-pointer shadow-xs rounded-xs"
                  >
                    <div className="w-10 h-10 border border-zinc-200 flex items-center justify-center text-zinc-600 mb-3 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                      <Heart size={16} strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-light text-zinc-950 font-serif">{wishlist.length}</p>
                    <p className="text-xs font-semibold text-zinc-800 uppercase tracking-widest mt-1">Wishlist</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Curated saved fragrances</p>
                  </div>

                  {/* Shopping Bag */}
                  <Link
                    to="/cart"
                    className="group bg-white border border-zinc-200/90 p-5 hover:border-black transition-all shadow-xs rounded-xs"
                  >
                    <div className="w-10 h-10 border border-zinc-200 flex items-center justify-center text-zinc-600 mb-3 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all">
                      <ShoppingBag size={16} strokeWidth={1.5} />
                    </div>
                    <p className="text-2xl font-light text-zinc-950 font-serif">{cart.length}</p>
                    <p className="text-xs font-semibold text-zinc-800 uppercase tracking-widest mt-1">In Bag</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Ready for checkout</p>
                  </Link>
                </div>

                {/* 2. Live Shipment Tracker Card (If there's an active order) */}
                {activeShipment && (
                  <div className="bg-white border border-zinc-200/90 p-6 shadow-sm rounded-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-150">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[11px] font-bold uppercase tracking-widest text-[#b8860b]">
                            Active Shipment Status
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 mt-0.5">
                          Order #{activeShipment.id.toUpperCase()}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openTrackingModal(activeShipment)}
                          className="px-3.5 py-1.5 bg-black text-white hover:bg-zinc-800 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                        >
                          <Truck size={12} />
                          <span>Track Live</span>
                        </button>
                        <button
                          onClick={() => handleDownloadInvoice(activeShipment)}
                          className="px-3 py-1.5 border border-zinc-300 text-zinc-700 hover:border-black hover:text-black text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1"
                        >
                          <Download size={11} /> Invoice
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-zinc-400 uppercase tracking-wider block">Shipment Stage</span>
                        <span className="font-semibold text-zinc-900 uppercase mt-0.5 block">
                          {activeShipment.shipmentStatus || activeShipment.status || "Processing at Warehouse"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 uppercase tracking-wider block">Courier & AWB</span>
                        <span className="font-mono text-zinc-800 mt-0.5 block">
                          {activeShipment.courierName || "Delhivery"} {activeShipment.awbCode ? `(${activeShipment.awbCode})` : "· AWB Generating"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-400 uppercase tracking-wider block">Order Total</span>
                        <span className="font-semibold text-zinc-950 mt-0.5 block">
                          ₹{(activeShipment.total || 0).toLocaleString()} · {activeShipment.paymentMethod || "Prepaid"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Recent Purchases */}
                <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200">
                    <div>
                      <h3 className="text-base font-light text-zinc-950 uppercase tracking-widest font-serif">
                        Recent Purchases
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Track shipment checkpoints, AWB details & download verified GST invoices
                      </p>
                    </div>
                    {recentOrders.length > 0 && (
                      <button
                        onClick={() => setActiveTab("orders")}
                        className="px-4 py-2 border border-zinc-300 text-xs font-semibold uppercase tracking-wider text-zinc-700 hover:border-black hover:text-black transition-all"
                      >
                        View All Orders ({recentOrders.length})
                      </button>
                    )}
                  </div>

                  {recentOrders.length > 0 ? (
                    <div className="divide-y divide-zinc-200">
                      {recentOrders.slice(0, 3).map((order) => (
                        <div key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4 cursor-pointer" onClick={() => openTrackingModal(order)}>
                            <div className="w-12 h-12 border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-500 shrink-0">
                              <Package size={18} strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="text-xs font-mono font-bold text-zinc-900 hover:text-[#b8860b] transition-colors">
                                #{order.id.toUpperCase()}
                              </p>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "Recently placed"}
                                {" · "}
                                <span className="font-semibold text-zinc-700">{order.items?.length || 1} item(s)</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                              <p className="text-sm font-semibold text-zinc-900">₹{(order.total || 0).toLocaleString()}</p>
                              <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-xs ${
                                order.status === "delivered"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : order.status === "failed" || order.status === "cancelled"
                                  ? "bg-red-50 text-red-700 border-red-300"
                                  : "bg-amber-50 text-amber-800 border-amber-300"
                              }`}>
                                {order.shipmentStatus || order.status || "Confirmed"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => openTrackingModal(order)}
                                className="px-3 py-1.5 bg-zinc-100 hover:bg-black hover:text-white text-zinc-800 text-xs font-semibold uppercase tracking-wider transition-all"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => handleDownloadInvoice(order)}
                                className="p-1.5 border border-zinc-300 hover:border-[#b8860b] text-[#b8860b] hover:bg-[#b8860b] hover:text-white transition-all"
                                title="Download invoice"
                              >
                                <Download size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 space-y-3">
                      <div className="w-12 h-12 border border-zinc-200 flex items-center justify-center text-zinc-400 mx-auto">
                        <ShoppingBag size={20} />
                      </div>
                      <h4 className="text-sm font-light text-zinc-900 uppercase tracking-widest font-serif">
                        No orders recorded yet
                      </h4>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                        Discover our rare artisanal Extraits de Parfum and handcrafted discovery sets.
                      </p>
                      <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-black text-white text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all font-semibold"
                      >
                        Explore Boutique <ChevronRight size={12} />
                      </Link>
                    </div>
                  )}
                </div>

                {/* 4. Fragrance Discovery Quiz Banner (Mahirash differentiator) */}
                <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white p-6 md:p-8 rounded-xs border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#b8860b]/20 to-transparent pointer-events-none" />
                  <div className="space-y-1.5 max-w-xl">
                    <span className="text-[12px] uppercase font-bold text-[#b8860b] tracking-[0.25em] flex items-center gap-1.5">
                      <Sparkles size={12} /> Fragrance Preferences
                    </span>
                    <h3 className="text-lg md:text-xl font-light font-serif uppercase tracking-widest text-zinc-100">
                      Curate Your Signature Scent Profile
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-light">
                      Customize your preferred scent families (Woody, Amber, Citrus, Florals) and intensity to receive tailored perfume formulations crafted for your lifestyle.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("preferences")}
                    className="px-6 py-3 bg-[#b8860b] hover:bg-[#d4af37] text-white text-xs font-semibold uppercase tracking-widest transition-all shrink-0 shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <span>Tune Fragrance Profile</span>
                    <ArrowRight size={12} />
                  </button>
                </div>

                {/* 5. Primary Shipping Address Preview */}
                <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <MapPin size={15} className="text-[#b8860b]" />
                      <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-widest">
                        Primary Shipping Address
                      </h4>
                    </div>
                    <button
                      onClick={() => setActiveTab("addresses")}
                      className="text-xs text-[#b8860b] font-semibold hover:underline uppercase tracking-wider"
                    >
                      Manage All ({addresses.length})
                    </button>
                  </div>

                  {addresses.length > 0 ? (
                    (() => {
                      const def = addresses.find(a => a.isDefault) || addresses[0];
                      return (
                        <div className="text-xs text-zinc-700 space-y-1">
                          <p className="font-semibold uppercase tracking-wide text-zinc-900">{def.name}</p>
                          <p className="text-zinc-600">{def.address || def.street}, {def.city}, {def.state} - <span className="font-mono">{def.pincode}</span></p>
                          <p className="text-zinc-500 font-mono">Contact: {def.phone}</p>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <p>No saved addresses in your address book.</p>
                      <button
                        onClick={() => {
                          setActiveTab("addresses");
                          setShowAddressForm(true);
                        }}
                        className="text-zinc-900 underline uppercase font-semibold text-xs"
                      >
                        + Add Address
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 2: MY ORDERS & TRACKING                                    */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "orders" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
                  <div>
                    <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                      Order Management & Tracking
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Review complete order history, verify live courier checkpoints, and download tax invoices
                    </p>
                  </div>
                  <span className="text-xs font-mono text-zinc-500">Total Orders: {recentOrders.length}</span>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                    {[
                      { id: "all", label: "All Orders" },
                      { id: "active", label: "In Progress / Active" },
                      { id: "delivered", label: "Delivered" },
                      { id: "cancelled", label: "Cancelled" }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setOrderFilter(f.id)}
                        className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider rounded-xs border transition-all ${
                          orderFilter === f.id
                            ? "bg-black text-white border-black"
                            : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-black"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search size={13} className="absolute left-3 top-3 text-zinc-400" />
                    <input
                      type="text"
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      placeholder="Search order ID or fragrance..."
                      className="w-full pl-9 pr-3 py-2 bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-black outline-none transition-all placeholder:text-zinc-400 font-sans"
                    />
                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => {
                      const isDelivered = (order.shipmentStatus || order.status || "").toLowerCase() === "delivered";
                      const isCancelled = (order.shipmentStatus || order.status || "").toLowerCase() === "cancelled";

                      return (
                        <div
                          key={order.id}
                          className="p-5 bg-[#faf8f5]/60 border border-zinc-200/90 hover:border-zinc-400 transition-all rounded-xs space-y-4"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                            <div>
                              <span className="text-[10px] text-[#b8860b] font-bold uppercase tracking-widest">
                                Order Reference
                              </span>
                              <h4 className="text-xs font-mono font-bold text-zinc-900 uppercase">
                                #{order.id.toUpperCase()}
                              </h4>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Separate Status Badges */}
                              <span className={`px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-xs ${
                                isDelivered
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : isCancelled
                                  ? "bg-red-50 text-red-700 border-red-300"
                                  : "bg-amber-50 text-amber-800 border-amber-300"
                              }`}>
                                {order.shipmentStatus || order.status || "Confirmed"}
                              </span>

                              <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200">
                                {order.paymentStatus || "Paid"}
                              </span>

                              <button
                                onClick={() => handleDownloadInvoice(order)}
                                className="px-3 py-1 bg-white border border-zinc-300 hover:border-[#b8860b] hover:text-[#b8860b] text-zinc-700 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                              >
                                <Download size={11} /> Invoice
                              </button>
                            </div>
                          </div>

                          {/* Order Details Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-zinc-600">
                            <div>
                              <span className="block text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-0.5">Date Placed</span>
                              <span className="text-zinc-900 font-mono">
                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-IN") : "Recent"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-0.5">Total Amount</span>
                              <span className="text-zinc-900 font-semibold font-mono">₹{(order.total || 0).toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-0.5">Payment Method</span>
                              <span className="text-zinc-900 uppercase">{order.paymentMethod || "Prepaid"}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-0.5">Logistics Courier</span>
                              <span className="text-zinc-900 font-mono">{order.courierName || "Delhivery Air"}</span>
                            </div>
                          </div>

                          {/* Items Preview */}
                          {order.items && order.items.length > 0 && (
                            <div className="pt-2 border-t border-zinc-150">
                              <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block mb-2">Formulations in Package:</span>
                              <div className="flex flex-wrap gap-2">
                                {order.items.map((it, idx) => (
                                  <span key={idx} className="px-2.5 py-1 bg-white border border-zinc-200 text-xs text-zinc-800 rounded-xs">
                                    {it.name} {it.size ? `(${it.size})` : ""} × {it.quantity || it.units || 1}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Footer */}
                          <div className="pt-2 flex flex-wrap justify-between items-center gap-3">
                            {order.awbCode ? (
                              <button
                                onClick={() => openTrackingModal(order)}
                                className="text-xs text-emerald-800 hover:text-emerald-950 font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Truck size={13} className="text-emerald-600 animate-pulse" />
                                <span>Track Live Courier Timeline (AWB: {order.awbCode})</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openTrackingModal(order)}
                                className="text-xs text-zinc-500 hover:text-zinc-900 font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Clock size={12} />
                                <span>Quality Inspection & Packing</span>
                              </button>
                            )}

                            <div className="flex items-center gap-3">
                              {/* Eligible for cancellation only if not yet dispatched */}
                              {(!order.shipmentStatus || order.shipmentStatus === "Not Created" || order.status === "confirmed") && (
                                <button
                                  onClick={async () => {
                                    const reason = prompt("Please provide reason for order cancellation:");
                                    if (!reason) return;
                                    try {
                                      await updateDoc(doc(db, "orders", order.id), {
                                        status: "cancelled",
                                        shipmentStatus: "Cancelled",
                                        cancelReason: reason,
                                        cancelledAt: new Date().toISOString()
                                      });
                                      showToast("Cancellation request submitted.");
                                      fetchData(activeEmail);
                                    } catch (err) {
                                      showToast("Cancellation failed: " + err.message, "error");
                                    }
                                  }}
                                  className="text-[11px] text-red-600 hover:text-red-800 uppercase tracking-wider font-semibold transition-colors"
                                >
                                  Cancel Order
                                </button>
                              )}

                              <button
                                onClick={() => openTrackingModal(order)}
                                className="text-xs font-semibold uppercase tracking-wider text-zinc-900 hover:text-[#b8860b] flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                Full Details <ChevronRight size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-light">
                      No orders match your filter criteria.
                    </p>
                    <button
                      onClick={() => { setOrderFilter("all"); setOrderSearchQuery(""); }}
                      className="px-5 py-2 border border-zinc-300 text-xs uppercase tracking-wider font-semibold hover:border-black"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 3: SAVED FRAGRANCES (WISHLIST)                             */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "wishlist" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                  <div>
                    <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                      Saved Fragrances ({wishlist.length})
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Your personal wishlisted perfumes, private extraits, and gift discovery sets
                    </p>
                  </div>
                </div>

                {wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {wishlist.map((item) => (
                      <div key={item.id} className="group border border-zinc-200 p-4 rounded-xs flex flex-col justify-between hover:border-black transition-all bg-[#faf8f5]/40">
                        <div className="space-y-3">
                          <div className="aspect-square w-full bg-zinc-100 overflow-hidden relative">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                <Package size={24} />
                              </div>
                            )}
                            <button
                              onClick={() => removeFromWishlist(item.id)}
                              className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-black hover:text-white rounded-full transition-colors shadow-xs"
                              title="Remove from wishlist"
                            >
                              <X size={12} />
                            </button>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] text-[#b8860b] uppercase font-bold tracking-widest block">
                              {item.brand || "MAHIRASH"}
                            </span>
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 group-hover:text-black">
                              {item.name}
                            </h4>
                            <p className="text-sm font-semibold text-zinc-900">
                              ₹{(item.price || 0).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-zinc-200 mt-3 flex items-center gap-2">
                          <button
                            onClick={async () => {
                              await addToCart(item);
                              await removeFromWishlist(item.id);
                              showToast(`Moved ${item.name} to Shopping Bag!`);
                            }}
                            className="w-full py-2 bg-black hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                          >
                            <ShoppingBag size={12} />
                            <span>Move to Bag</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3">
                    <Heart size={28} className="mx-auto text-zinc-300" />
                    <h4 className="text-sm font-light text-zinc-900 uppercase tracking-widest font-serif">
                      Your fragrance wishlist is empty
                    </h4>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Explore our handcrafted botanical extraits and save your favorites here.
                    </p>
                    <Link
                      to="/shop"
                      className="inline-block px-6 py-2.5 bg-black text-white text-xs font-semibold uppercase tracking-widest hover:bg-zinc-800 transition-all"
                    >
                      Browse Boutique
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 4: SHOPPING BAG (CART)                                     */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "cart" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                  <div>
                    <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                      Shopping Bag ({cart.length})
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Review fragrances currently reserved in your bag before proceeding to secure checkout
                    </p>
                  </div>
                  <Link
                    to="/cart"
                    className="text-xs font-semibold uppercase tracking-wider text-[#b8860b] hover:underline"
                  >
                    Open Full Cart Page →
                  </Link>
                </div>

                {cart.length > 0 ? (
                  <div className="space-y-4">
                    <div className="divide-y divide-zinc-200">
                      {cart.map((item) => (
                        <div key={item.cartId || item.id} className="py-4 first:pt-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                              {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                  <Package size={16} />
                                </div>
                              )}
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-[#b8860b] uppercase font-bold tracking-widest">
                                {item.brand || "MAHIRASH"}
                              </span>
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-900">
                                {item.name}
                              </h4>
                              {item.size && (
                                <p className="text-[11px] text-zinc-500">Volume: {item.size}</p>
                              )}
                              <p className="text-xs font-semibold text-zinc-900">
                                ₹{(item.price || 0).toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Quantity controls */}
                            <div className="flex items-center border border-zinc-300">
                              <button
                                onClick={() => updateQuantity(item.cartId || item.id, -1)}
                                className="px-2 py-1 text-xs hover:bg-zinc-100 transition-colors font-mono"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 text-xs font-mono font-semibold">{item.quantity || 1}</span>
                              <button
                                onClick={() => updateQuantity(item.cartId || item.id, 1)}
                                className="px-2 py-1 text-xs hover:bg-zinc-100 transition-colors font-mono"
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.cartId || item.id)}
                              className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div>
                        <span className="text-xs text-zinc-500 uppercase tracking-wider">Bag Subtotal:</span>
                        <p className="text-xl font-light text-zinc-950 font-serif">
                          ₹{cart.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 1), 0).toLocaleString()}
                        </p>
                      </div>

                      <Link
                        to="/checkout"
                        className="w-full sm:w-auto px-8 py-3 bg-black hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2"
                      >
                        <ShieldCheck size={14} className="text-[#b8860b]" />
                        <span>Proceed to Checkout</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3">
                    <ShoppingBag size={28} className="mx-auto text-zinc-300" />
                    <h4 className="text-sm font-light text-zinc-900 uppercase tracking-widest font-serif">
                      Your shopping bag is currently empty
                    </h4>
                    <Link
                      to="/shop"
                      className="inline-block px-6 py-2.5 bg-black text-white text-xs font-semibold uppercase tracking-widest hover:bg-zinc-800 transition-all"
                    >
                      Discover Perfumes
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 5: FRAGRANCE PREFERENCES (MAHIRASH DIFFERENTIATOR)        */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "preferences" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-8 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200">
                  <div>
                    <div className="flex items-center gap-2 text-[#b8860b] mb-1">
                      <Sparkles size={14} />
                      <span className="text-[12px] font-bold uppercase tracking-[0.25em]">Mahirash Signature Selection</span>
                    </div>
                    <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                      Personalized Fragrance Profile & Scent Notes
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Fine-tune your preferred scent families, occasion profiles, and concentration intensity
                    </p>
                  </div>
                </div>

                {/* Section 1: Fragrance Families */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                    1. Preferred Fragrance Families (Select up to 3)
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {FRAGRANCE_FAMILIES.map((fam) => {
                      const isSelected = preferences.families.includes(fam.id);
                      return (
                        <div
                          key={fam.id}
                          onClick={() => {
                            setPreferences(prev => {
                              const exists = prev.families.includes(fam.id);
                              const updated = exists
                                ? prev.families.filter(f => f !== fam.id)
                                : [...prev.families, fam.id].slice(0, 3);
                              return { ...prev, families: updated };
                            });
                          }}
                          className={`p-4 border rounded-xs cursor-pointer transition-all ${
                            isSelected
                              ? "bg-black text-white border-black shadow-xs"
                              : "bg-[#faf8f5]/60 border-zinc-200 text-zinc-800 hover:border-black"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider">{fam.label}</span>
                            {isSelected && <Check size={13} className="text-[#b8860b]" />}
                          </div>
                          <p className={`text-[11px] leading-relaxed ${isSelected ? "text-zinc-300" : "text-zinc-500"}`}>
                            {fam.notes}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Preferred Occasions */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                    2. Primary Wearing Occasion
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {OCCASIONS.map((occ) => {
                      const isSelected = preferences.occasion === occ.id;
                      return (
                        <button
                          key={occ.id}
                          type="button"
                          onClick={() => setPreferences(prev => ({ ...prev, occasion: occ.id }))}
                          className={`p-3 text-xs font-medium uppercase tracking-wider rounded-xs border transition-all text-center ${
                            isSelected
                              ? "bg-black text-white border-black font-semibold"
                              : "bg-white text-zinc-700 border-zinc-200 hover:border-black"
                          }`}
                        >
                          {occ.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Intensity & Concentration */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                    3. Preferred Scent Intensity & Concentration
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {INTENSITIES.map((int) => {
                      const isSelected = preferences.intensity === int.id;
                      return (
                        <button
                          key={int.id}
                          type="button"
                          onClick={() => setPreferences(prev => ({ ...prev, intensity: int.id }))}
                          className={`p-3 text-xs font-medium uppercase tracking-wider rounded-xs border transition-all text-left ${
                            isSelected
                              ? "bg-black text-white border-black font-semibold"
                              : "bg-white text-zinc-700 border-zinc-200 hover:border-black"
                          }`}
                        >
                          {int.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save button */}
                <div className="pt-4 border-t border-zinc-200 flex items-center justify-between">
                  <p className="text-xs text-zinc-500">
                    Your profile automatically updates customized discovery recommendations.
                  </p>
                  <button
                    onClick={handleSavePreferences}
                    disabled={savingPreferences}
                    className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {savingPreferences ? "Saving Profile..." : "Save Fragrance Profile"}
                  </button>
                </div>

                {/* Tailored Fragrance Recommendations Based on Profile */}
                <div className="pt-6 border-t border-zinc-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#b8860b] font-bold uppercase tracking-widest block">Curated Formulation</span>
                      <h4 className="text-sm font-light font-serif uppercase tracking-widest text-zinc-950">
                        Tailored Recommendations For You
                      </h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {CURATED_PERFUMES.map((perfume) => (
                      <div key={perfume.id} className="border border-zinc-200 p-4 rounded-xs bg-[#faf8f5]/50 flex flex-col justify-between hover:border-black transition-all">
                        <div className="space-y-3">
                          <div className="aspect-square w-full bg-zinc-100 overflow-hidden relative">
                            <img src={perfume.image} alt={perfume.name} className="w-full h-full object-cover" />
                            <span className="absolute top-2 left-2 px-2 py-0.5 bg-black text-white text-[9px] uppercase font-bold tracking-widest">
                              {perfume.collection}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-[#b8860b] font-semibold uppercase">{perfume.concentration}</span>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-900 mt-0.5">{perfume.name}</h5>
                            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-2">Notes: {perfume.notes}</p>
                            <p className="text-xs font-semibold text-zinc-900 mt-1.5">₹{perfume.price.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-zinc-200 mt-3">
                          <button
                            onClick={async () => {
                              await addToCart(perfume);
                              showToast(`Added ${perfume.name} to Shopping Bag!`);
                            }}
                            className="w-full py-2 bg-black hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                          >
                            <ShoppingBag size={12} />
                            <span>Add to Bag</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 6: PERSONAL INFORMATION (PROFILE)                          */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "profile" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-6 animate-fadeIn">
                <div className="pb-4 border-b border-zinc-200">
                  <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                    Personal Account Information
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Update profile name, registered contact number, date of birth, and biography
                  </p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Full Name *</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        placeholder="Your Full Name"
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-black outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Mobile Phone (10 digits) *</label>
                      <input
                        type="tel"
                        maxLength={10}
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(cleanPhone(e.target.value))}
                        placeholder="10-digit mobile number"
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-black outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Registered Email (Read-only)</label>
                      <input
                        type="email"
                        value={activeEmail}
                        disabled
                        className="w-full px-4 py-2.5 bg-zinc-100 border border-zinc-200 text-xs text-zinc-500 cursor-not-allowed outline-none font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Date of Birth (For Birthday Gift)</label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-black outline-none transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-600 uppercase tracking-wider">Biography & Style Notes</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share your personal aesthetic or fragrance journey..."
                      rows={3}
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-black outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-8 py-3 bg-black hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {savingProfile ? "Saving Profile..." : "Save Profile Details"}
                  </button>
                </form>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 7: SHIPPING ADDRESSES                                      */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "addresses" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-6 animate-fadeIn">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                  <div>
                    <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                      Delivery Addresses ({addresses.length})
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Manage your delivery destinations with 6-digit Indian PIN verification
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (showAddressForm) resetAddressForm();
                      else setShowAddressForm(true);
                    }}
                    className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                  >
                    <Plus size={12} />
                    <span>{showAddressForm ? "Cancel" : "Add Address"}</span>
                  </button>
                </div>

                {/* Inline Address Form */}
                {showAddressForm && (
                  <form onSubmit={handleSaveAddress} className="p-6 bg-[#faf8f5] border border-zinc-200 rounded-xs space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-200">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-[#b8860b]">
                        {editingAddressId ? "Edit Delivery Address" : "New Delivery Address Details"}
                      </h4>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-zinc-500 uppercase mr-1">Type:</span>
                        {["Home", "Office", "Other"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setAddressForm(p => ({ ...p, type: t }))}
                            className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider border rounded-xs ${
                              addressForm.type === t ? "bg-black text-white border-black" : "bg-white text-zinc-600 border-zinc-200"
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-600 uppercase">Contact Name *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          placeholder="Recipient Name"
                          className="w-full px-3 py-2 bg-white border border-zinc-200 text-xs text-zinc-900 outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-600 uppercase">Primary Phone (10 digits) *</label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          inputMode="numeric"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: cleanPhone(e.target.value) })}
                          placeholder="10-digit mobile number"
                          className="w-full px-3 py-2 bg-white border border-zinc-200 text-xs text-zinc-900 outline-none focus:border-black font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-600 uppercase">Flat / House No. / Building *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.flat}
                          onChange={(e) => setAddressForm({ ...addressForm, flat: e.target.value })}
                          placeholder="e.g. Flat 402, Royal Residency"
                          className="w-full px-3 py-2 bg-white border border-zinc-200 text-xs text-zinc-900 outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-600 uppercase">Street / Locality *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.street}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          placeholder="e.g. MG Road, Scheme 54"
                          className="w-full px-3 py-2 bg-white border border-zinc-200 text-xs text-zinc-900 outline-none focus:border-black"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-600 uppercase">City *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          placeholder="e.g. Indore"
                          className="w-full px-3 py-2 bg-white border border-zinc-200 text-xs text-zinc-900 outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-600 uppercase">State *</label>
                        <input
                          type="text"
                          required
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          placeholder="e.g. Madhya Pradesh"
                          className="w-full px-3 py-2 bg-white border border-zinc-200 text-xs text-zinc-900 outline-none focus:border-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-600 uppercase">PIN Code (6 digits) *</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          inputMode="numeric"
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: cleanPincode(e.target.value) })}
                          placeholder="6-digit PIN code"
                          className="w-full px-3 py-2 bg-white border border-zinc-200 text-xs text-zinc-900 outline-none focus:border-black font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="rounded text-[#b8860b] focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                        <span>Set as Default Delivery Address</span>
                      </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-wider transition-all"
                      >
                        {editingAddressId ? "Update Address" : "Save Address"}
                      </button>
                      <button
                        type="button"
                        onClick={resetAddressForm}
                        className="px-5 py-2 border border-zinc-300 text-zinc-700 text-xs font-semibold uppercase tracking-wider hover:bg-zinc-100 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Address Cards Grid */}
                <div className="grid md:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      className={`p-5 bg-[#faf8f5]/60 border ${a.isDefault ? "border-[#b8860b]" : "border-zinc-200"} rounded-xs flex flex-col justify-between space-y-4`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-zinc-200 text-zinc-800 text-[10px] font-bold uppercase tracking-wider rounded-xs">
                          {a.type || "Home"}
                        </span>
                        {a.isDefault && (
                          <span className="px-2 py-0.5 bg-[#faf5eb] border border-[#e5d5b8] text-[#b8860b] text-[10px] font-bold uppercase tracking-wider rounded-xs">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="text-xs space-y-1">
                        <h4 className="font-bold text-zinc-900 uppercase tracking-wide">{a.name}</h4>
                        {a.flat && <p className="text-zinc-800 font-medium">{a.flat}</p>}
                        <p className="text-zinc-600 leading-relaxed">{a.street || a.address}</p>
                        <p className="text-zinc-600">{a.city}, {a.state} - <span className="font-mono font-semibold">{a.pincode}</span></p>
                        <p className="text-[#b8860b] font-mono font-semibold pt-1">Phone: {a.phone}</p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                        {!a.isDefault ? (
                          <button
                            onClick={() => handleSetDefaultAddress(a.id)}
                            className="text-xs text-zinc-500 hover:text-[#b8860b] uppercase tracking-wider font-semibold"
                          >
                            Set Default
                          </button>
                        ) : <span />}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setAddressForm({
                                name: a.name || "",
                                phone: a.phone || "",
                                alternatePhone: a.alternatePhone || "",
                                flat: a.flat || "",
                                street: a.street || a.address || "",
                                landmark: a.landmark || "",
                                city: a.city || "",
                                state: a.state || "",
                                pincode: a.pincode || "",
                                type: a.type || "Home",
                                isDefault: a.isDefault || false
                              });
                              setEditingAddressId(a.id);
                              setShowAddressForm(true);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-black transition-colors"
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(a.id)}
                            className="p-1.5 text-zinc-500 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 8: PAYMENT HISTORY                                         */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "payments" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-6 animate-fadeIn">
                <div className="pb-4 border-b border-zinc-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                      Payment History & Invoices
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Verified transaction logs, gateway references, and tax receipts
                    </p>
                  </div>
                </div>

                {/* RBI Tokenization / Security Reassurance Box */}
                <div className="p-4 bg-[#faf5eb]/70 border border-[#e5d5b8] rounded-xs flex items-start gap-3">
                  <ShieldCheck size={18} className="text-[#b8860b] shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-zinc-900 uppercase tracking-wider">
                      RBI-Compliant Gateway Security
                    </p>
                    <p className="text-zinc-600 leading-relaxed font-light">
                      Mahirash uses PCI-DSS Level 1 certified payment gateways with 256-bit encryption. We never store card CVVs, PINs, or raw bank details on our servers.
                    </p>
                  </div>
                </div>

                {/* Transactions Table */}
                {recentOrders.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#faf8f5] text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200">
                        <tr>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Order Reference</th>
                          <th className="py-3 px-4">Payment Method</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200">
                        {recentOrders.map((order) => (
                          <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono text-zinc-600">
                              {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-IN") : "Recent"}
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                              #{order.id.slice(0, 10).toUpperCase()}
                            </td>
                            <td className="py-3.5 px-4 uppercase text-zinc-800">
                              {order.paymentMethod || "Online"}
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-zinc-900 font-mono">
                              ₹{(order.total || 0).toLocaleString()}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xs">
                                {order.paymentStatus || "Paid"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleDownloadInvoice(order)}
                                className="text-xs font-semibold text-[#b8860b] hover:underline uppercase tracking-wider"
                              >
                                Invoice
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-zinc-500 uppercase tracking-widest font-light">
                    No payment transactions recorded yet.
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 9: REVIEWS & RATINGS                                       */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "reviews" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-6 animate-fadeIn">
                <div className="pb-4 border-b border-zinc-200">
                  <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                    My Reviews & Fragrance Ratings
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Share your feedback on delivered Mahirash fragrances
                  </p>
                </div>

                {/* Write Review Form */}
                <form onSubmit={handleReviewSubmit} className="p-5 bg-[#faf8f5] border border-zinc-200 rounded-xs space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#b8860b]">
                    Write a Fragrance Review
                  </h4>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-600 uppercase">Fragrance Formulation *</label>
                      <input
                        type="text"
                        required
                        value={newReview.productName}
                        onChange={(e) => setNewReview({ ...newReview, productName: e.target.value })}
                        placeholder="e.g. Oud Royale Extrait / Tuscan Bergamot"
                        className="w-full px-3 py-2 bg-white border border-zinc-200 text-xs text-zinc-900 outline-none focus:border-black"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-600 uppercase">Rating (1 to 5 Stars)</label>
                      <div className="flex items-center gap-1.5 pt-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewReview({ ...newReview, rating: star })}
                            className="p-1 text-zinc-300 hover:text-[#b8860b] transition-colors cursor-pointer"
                          >
                            <Star
                              size={18}
                              className={star <= newReview.rating ? "text-[#b8860b] fill-[#b8860b]" : ""}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-mono font-bold text-zinc-700 ml-2">{newReview.rating} / 5</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-600 uppercase">Your Review & Sillage Experience *</label>
                    <textarea
                      required
                      rows={3}
                      value={newReview.comment}
                      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                      placeholder="Describe the projection, dry-down notes, longevity, and your impressions..."
                      className="w-full px-3 py-2 bg-white border border-zinc-200 text-xs text-zinc-900 outline-none focus:border-black resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {submittingReview ? "Submitting Review..." : "Submit Review"}
                  </button>
                </form>

                {/* Submitted Reviews List */}
                <div className="space-y-3 pt-4 border-t border-zinc-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800">Your Past Reviews ({reviews.length})</h4>
                  {reviews.length > 0 ? (
                    <div className="space-y-3">
                      {reviews.map((rev, idx) => (
                        <div key={idx} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase text-zinc-900">{rev.productName}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(rev.rating || 5)].map((_, i) => (
                                <Star key={i} size={11} className="text-[#b8860b] fill-[#b8860b]" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-zinc-600 leading-relaxed font-light">{rev.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 font-light">No reviews posted yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 10: OFFERS, COUPONS & CLUB REWARDS                         */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "rewards" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-6 animate-fadeIn">
                <div className="pb-4 border-b border-zinc-200">
                  <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                    Offers, Coupons & Member Rewards
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Exclusive customer privilege vouchers and Mahirash Club points
                  </p>
                </div>

                {/* Loyalty Tier Box */}
                <div className="p-6 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black text-white rounded-xs border border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <span className="text-[12px] text-[#b8860b] font-bold uppercase tracking-[0.25em] flex items-center gap-1">
                      <Award size={13} /> Mahirash Privilege Club
                    </span>
                    <h4 className="text-xl font-light font-serif uppercase tracking-widest">
                      Gold Member Tier
                    </h4>
                    <p className="text-xs text-zinc-400 font-light">
                      Earn 50 reward points per ₹1,000 spent. Redeemable against discovery vaults & private reserves.
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[11px] text-zinc-400 uppercase tracking-widest block">Accumulated Points</span>
                    <span className="text-2xl font-mono font-light text-[#b8860b]">
                      {recentOrders.length * 250} PTS
                    </span>
                  </div>
                </div>

                {/* Available Coupons */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800">
                    Active Privilege Coupons
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    {[
                      { code: "WELCOME10", discount: "10% OFF", desc: "Applicable on your next order", min: "Min. spend ₹1,999" },
                      { code: "ROYAL15", discount: "15% OFF", desc: "Valid on Royal Edition Extraits de Parfum", min: "Min. spend ₹4,999" },
                      { code: "FREESHIP", discount: "FREE AIR SHIPPING", desc: "Express insured air transit nationwide", min: "No minimum spend" }
                    ].map((coupon) => (
                      <div key={coupon.code} className="p-4 border border-zinc-200 bg-[#faf8f5]/60 rounded-xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2 py-0.5 bg-black text-white text-[10px] font-mono font-bold tracking-widest">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(coupon.code);
                              showToast(`Copied coupon code: ${coupon.code}!`);
                            }}
                            className="text-zinc-400 hover:text-black transition-colors"
                            title="Copy code"
                          >
                            <Copy size={13} />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-zinc-900">{coupon.discount}</p>
                        <p className="text-xs text-zinc-600 leading-relaxed font-light">{coupon.desc}</p>
                        <span className="text-[10px] text-zinc-400 block pt-1 font-mono">{coupon.min}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 11: NOTIFICATION PREFERENCES                               */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "notifications" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-6 animate-fadeIn">
                <div className="pb-4 border-b border-zinc-200">
                  <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                    Notification Settings & Alerts
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Manage real-time shipment updates, WhatsApp delivery alerts, and editorial drops
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { key: "orderUpdates", title: "Order Timeline & Tracking Alerts", sub: "Receive real-time email notifications whenever shipment status changes" },
                    { key: "whatsappUpdates", title: "WhatsApp Shipment Alerts", sub: "Get direct WhatsApp updates when your parcel is dispatched and out for delivery" },
                    { key: "promotionalOffers", title: "Private Reserve & New Drops", sub: "Priority notification when handcrafted limited edition extraits become available" },
                    { key: "newsletter", title: "Fragrance Digest & Stories", sub: "Curated brand stories, ingredient harvesting diaries, and fragrance guides" },
                    { key: "securityAlerts", title: "Account Security Flags", sub: "Instant email notification for new logins or profile setting changes" }
                  ].map((notif) => (
                    <div key={notif.key} className="flex justify-between items-center p-4 bg-[#faf8f5]/60 border border-zinc-200 rounded-xs">
                      <div className="max-w-[85%] space-y-0.5">
                        <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">{notif.title}</h4>
                        <p className="text-xs text-zinc-500 font-light leading-relaxed">{notif.sub}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications[notif.key]}
                        onChange={(e) => {
                          const updated = { ...notifications, [notif.key]: e.target.checked };
                          setNotifications(updated);
                          const docId = activeEmail.replace(/[^a-z0-9]/g, "_");
                          setDoc(doc(db, "customers", docId), { notifications: updated }, { merge: true });
                          showToast("Preference updated");
                        }}
                        className="rounded text-[#b8860b] focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 12: CUSTOMER SUPPORT & HELP                                */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "support" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-8 animate-fadeIn">
                <div className="pb-4 border-b border-zinc-200">
                  <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                    Customer Support & Help
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Connect directly with our customer care team for order support or perfume guidance
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* WhatsApp Box */}
                  <div className="p-6 bg-[#faf8f5] border border-zinc-200 rounded-xs space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700">
                      <MessageSquare size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Direct WhatsApp Support</span>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed font-light">
                      Chat directly with our team for real-time order inquiries and fragrance recommendations.
                    </p>
                    <a
                      href="https://wa.me/919584826112?text=Hello%20Mahirash%20Support,%20I%20need%20assistance%20with%20my%20order."
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                      <ExternalLink size={12} />
                      <span>Open WhatsApp Chat</span>
                    </a>
                  </div>

                  {/* Email Support Box */}
                  <div className="p-6 bg-[#faf8f5] border border-zinc-200 rounded-xs space-y-3">
                    <div className="flex items-center gap-2 text-[#b8860b]">
                      <Mail size={16} />
                      <span className="text-xs font-bold uppercase tracking-wider">Official Email Support</span>
                    </div>
                    <p className="text-xs text-zinc-600 leading-relaxed font-light">
                      Response within 2 hours during store operating hours (Mon–Sat, 10:00 AM – 08:00 PM IST).
                    </p>
                    <a
                      href="mailto:care@mahirash.com?subject=Mahirash%20Customer%20Inquiry"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-wider transition-all"
                    >
                      <Mail size={12} />
                      <span>Email care@mahirash.com</span>
                    </a>
                  </div>
                </div>

                {/* FAQs */}
                <div className="space-y-3 pt-4 border-t border-zinc-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800">Frequently Asked Questions</h4>
                  <div className="space-y-3">
                    {FAQS.map((faq, idx) => (
                      <div key={idx} className="p-4 bg-zinc-50 border border-zinc-200 rounded-xs space-y-1">
                        <p className="text-xs font-bold text-zinc-900 uppercase tracking-wide">{faq.q}</p>
                        <p className="text-xs text-zinc-600 leading-relaxed font-light">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* TAB 13: ACCOUNT SECURITY & SETTINGS                            */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            {activeTab === "settings" && (
              <div className="bg-white border border-zinc-200/90 p-6 md:p-8 shadow-sm rounded-xs space-y-6 animate-fadeIn">
                <div className="pb-4 border-b border-zinc-200">
                  <h3 className="text-lg font-light text-zinc-950 uppercase tracking-widest font-serif">
                    Account Security & Privacy Settings
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Manage authentication credentials, password reset, and privacy policies
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Reset Password */}
                  <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Account Password</h4>
                      <p className="text-xs text-zinc-500 font-light">Request password change email or reset instructions</p>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="px-5 py-2 border border-zinc-300 hover:border-black text-xs font-semibold uppercase tracking-wider text-zinc-900 transition-colors text-center"
                    >
                      Reset Password
                    </Link>
                  </div>

                  {/* Active Login Provider */}
                  <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-xs space-y-1">
                    <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Login Identity & Session</h4>
                    <p className="text-xs text-zinc-600 font-light font-mono">
                      Authenticated as: <strong className="text-zinc-900">{activeEmail}</strong>
                    </p>
                  </div>

                  {/* Policies Links */}
                  <div className="p-5 bg-zinc-50 border border-zinc-200 rounded-xs flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="text-zinc-600 font-light">Mahirash Terms & Privacy Standards</span>
                    <div className="flex items-center gap-4">
                      <Link to="/terms" className="text-zinc-900 font-semibold hover:underline uppercase">Terms of Service</Link>
                      <Link to="/privacy" className="text-zinc-900 font-semibold hover:underline uppercase">Privacy Policy</Link>
                    </div>
                  </div>

                  {/* Logout Action */}
                  <div className="pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full sm:w-auto px-6 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut size={13} />
                      <span>Sign Out from All Devices</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>

      {/* ─── LIVE TRACKING & ORDER DETAILS MODAL ──────────────────────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-zinc-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-xs shadow-2xl text-zinc-900">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[10px] text-[#b8860b] font-bold uppercase tracking-widest">
                  Order Details & Live Shipment
                </span>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-900 mt-0.5">
                  Order #{selectedOrder.id.toUpperCase()}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="px-3 py-1.5 bg-black text-white hover:bg-zinc-800 text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  <Download size={11} /> Invoice
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 hover:bg-zinc-100 text-zinc-500 hover:text-black rounded"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 text-xs">

              {/* Status and Courier Partner */}
              <div className="p-4 bg-[#faf8f5] border border-zinc-200 rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">Current Stage</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-950 mt-0.5 block">
                    {selectedOrder.shipmentStatus || selectedOrder.status || "Order Confirmed"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">AWB Tracking Code</span>
                  <span className="text-xs font-mono font-bold text-[#b8860b] mt-0.5 block">
                    {selectedOrder.awbCode || "Generating AWB"}
                  </span>
                </div>
              </div>

              {/* Scans Timeline */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800">Shipment Activity Log</h4>
                {loadingTrackingModal ? (
                  <div className="py-8 text-center text-zinc-400 space-y-2">
                    <RefreshCw size={20} className="animate-spin mx-auto text-[#b8860b]" />
                    <p className="text-[11px] uppercase tracking-wider">Syncing Shiprocket tracking logs...</p>
                  </div>
                ) : trackingModalData?.scans && trackingModalData.scans.length > 0 ? (
                  <div className="relative border-l-2 border-zinc-200 ml-3 pl-4 space-y-4 py-2">
                    {trackingModalData.scans.map((scan, idx) => (
                      <div key={idx} className="relative">
                        <span className={`absolute -left-[23px] top-1 w-2.5 h-2.5 rounded-full border-2 ${
                          idx === 0 ? "bg-black border-black ring-4 ring-zinc-100" : "bg-white border-zinc-300"
                        }`} />
                        <div>
                          <span className="text-[10px] font-mono text-zinc-400 block">{scan.date}</span>
                          <p className="text-xs font-semibold text-zinc-900 mt-0.5">{scan.activity}</p>
                          {scan.location && (
                            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Location: {scan.location}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xs text-zinc-600 leading-relaxed font-light">
                    Your fragrance formulation is undergoing batch inspection and tamper-resistant packing at Mahirash. Real-time courier air transit checkpoints will appear here once picked up.
                  </div>
                )}
              </div>

              {/* Delivery Address & Summary */}
              <div className="pt-4 border-t border-zinc-200 grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Recipient & Address</span>
                  <p className="font-semibold text-zinc-900 uppercase">{selectedOrder.shipping?.name || selectedOrder.customerName || displayName}</p>
                  <p className="text-zinc-600">{selectedOrder.shipping?.address || "Delivery Address"}</p>
                  <p className="text-zinc-600">{selectedOrder.shipping?.city}, {selectedOrder.shipping?.state} - {selectedOrder.shipping?.pincode}</p>
                  <p className="text-zinc-600 font-mono">Contact: {selectedOrder.shipping?.phone || selectedOrder.customerPhone}</p>
                </div>
                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">Payment Breakdown</span>
                  <p className="text-zinc-600">Subtotal: ₹{(selectedOrder.subtotal || selectedOrder.total || 0).toLocaleString()}</p>
                  <p className="text-emerald-700 font-semibold">Shipping: COMPLIMENTARY</p>
                  <p className="text-sm font-bold text-zinc-950 pt-1">Total: ₹{(selectedOrder.total || 0).toLocaleString()}</p>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xs">
                    {selectedOrder.paymentStatus || "Paid"}
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Account;
