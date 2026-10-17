import React, { useState, useEffect, useCallback } from "react";
import MiniLoader from "../components/MiniLoader";
import { useAuth } from "../components/useAuth";
import { useCustomerAuth } from "../components/CustomerAuthProvider";
import { auth, db } from "../components/Firebase";
import { updateProfile } from "firebase/auth";
import { doc, getDoc, collection, getDocs, query, where, updateDoc, setDoc, addDoc, deleteDoc } from "firebase/firestore";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import Preloader from "./Preloader";
import {
  User, Package, Heart, LogOut, ChevronRight, Settings, ShoppingBag,
  CreditCard, MapPin, Bell, Camera, Plus, Trash2, Edit3, Check, X,
  ShieldCheck, Truck, RotateCcw, Download, Printer, Phone, CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import uploadToCloudinary from "../utils/cloudinary";
import OptimizedCloudinaryImage from "../components/OptimizedCloudinaryImage";
import { cleanPhone, isValidPhone, cleanPincode, isValidPincode, isValidName, sanitizeText } from "../utils/validation";

const Account = () => {
  const { customer, customerLogout } = useCustomerAuth();   // OTP-based customer session
  const { logout: firebaseLogout } = useAuth();              // Firebase Auth sign-out

  const activeEmail = customer?.email || null;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userData, setUserData] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [stats, setStats] = useState({ cart: 0, wishlist: 0, orders: 0 });
  const [loading, setLoading] = useState(true);
  // Tab driven by URL ?tab= query param
  const activeTab = searchParams.get("tab") || "overview";
  const setActiveTab = (tab) => setSearchParams({ tab }, { replace: true });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals & Feedback
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Profile Forms
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Saved Addresses
  const [addresses, setAddresses] = useState([]);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
    flat: "",
    street: "",
    landmark: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    type: "Home",
    isDefault: false
  });
  const [showAddressForm, setShowAddressForm] = useState(false);

  // Stored Payments
  const [payments, setPayments] = useState([
    { id: "p1", cardHolder: "MEMBER USER", cardNumber: "•••• •••• •••• 4242", expiry: "12/29", brand: "Visa" }
  ]);
  const [newCard, setNewCard] = useState({ cardHolder: "", cardNumber: "", expiry: "", brand: "Visa" });
  const [showCardForm, setShowCardForm] = useState(false);

  // Notifications Preferences
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotionalOffers: false,
    newsletter: true,
    securityAlerts: true
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchData = useCallback(async (email) => {
    if (!email) return;
    try {
      const cleanEmail = email.toLowerCase().trim();
      const customerDocId = cleanEmail.replace(/[^a-z0-9]/g, "_");
      const customerSnap = await getDoc(doc(db, "customers", customerDocId));
      if (customerSnap.exists()) {
        const d = customerSnap.data();
        setUserData(d);
        setDisplayName(d.name || customer?.name || "");
        setPhone(d.phone || customer?.phone || "");
        setBio(d.bio || d.shortBio || "");
      } else {
        setDisplayName(customer?.name || "");
        setPhone(customer?.phone || "");
      }

      // Fetch orders reliably via server API (guaranteed to bypass Firestore client permission restrictions)
      let ordersList = [];
      try {
        const apiRes = await fetch(`/api/get-orders?email=${encodeURIComponent(cleanEmail)}&userId=${encodeURIComponent(customer?.uid || customer?.id || "")}`);
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (Array.isArray(apiData.orders)) {
            ordersList = apiData.orders;
          }
        }
      } catch (apiErr) {
        console.warn("Account orders API notice:", apiErr);
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
        } catch (_) { }
      }

      setRecentOrders(ordersList);
      setStats(prev => ({ ...prev, orders: ordersList.length }));

      // Load addresses from customers sub-collection
      try {
        const addrSnap = await getDocs(collection(db, "customers", customerDocId, "addresses"));
        const addrsList = addrSnap.docs.map(aDoc => ({ id: aDoc.id, ...aDoc.data() }));
        const d = customerSnap.exists() ? customerSnap.data() : null;
        if (addrsList.length === 0 && d && d.address) {
          addrsList.push({
            id: 'legacy-root-address',
            name: d.name || customer?.name || "",
            phone: d.phone || customer?.phone || "",
            address: d.address || "",
            city: d.city || "",
            state: d.state || "",
            pincode: d.pincode || "",
            type: "Home",
            isDefault: true
          });
        }
        setAddresses(addrsList);
      } catch (_) { }

      // Load saved cards
      try {
        const cardsSnap = await getDocs(collection(db, "customers", customerDocId, "payments"));
        const cardsList = cardsSnap.docs.map(td => ({ id: td.id, ...td.data() }));
        if (cardsList.length > 0) setPayments(cardsList);
        else setPayments([]);
      } catch (_) { setPayments([]); }

    } catch (error) {
      console.error("Error loading account data:", error);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Use email string as dep (not customer object) to avoid re-fetch loop on profile saves
  useEffect(() => {
    if (!customer?.email) {
      navigate("/login");
      return;
    }
    fetchData(customer.email);
  }, [customer?.email, navigate, fetchData]);

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      try {
        // Clear OTP customer session first
        customerLogout();
        // Also sign out Firebase Auth so CustomerAuthProvider doesn't re-populate customer
        if (firebaseLogout) await firebaseLogout();
        navigate("/");
      } catch (error) {
        console.error("Logout failed:", error);
        // Still navigate away even if Firebase signOut fails
        navigate("/");
      }
    }
  };

  // Avatar Upload directly to Cloudinary
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const imageUrl = await uploadToCloudinary(file, "logo");
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { photoURL: imageUrl });
      }
      const docId = (customer.email || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
      await setDoc(doc(db, "customers", docId), { photoURL: imageUrl }, { merge: true });
      setUserData(prev => ({ ...prev, photoURL: imageUrl }));
      showToast("Profile picture updated!");
    } catch (err) {
      showToast("Avatar update failed: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Profile fields submit
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const cleanDName = sanitizeText(displayName, 60);
    if (!cleanDName || !isValidName(cleanDName)) {
      showToast("Please enter a valid full name (letters only, min 2 characters)", "error");
      return;
    }

    const cleanP = cleanPhone(phone);
    if (cleanP && !isValidPhone(cleanP)) {
      showToast("Please enter a valid 10-digit mobile number (starts with 6, 7, 8, or 9)", "error");
      return;
    }

    setSavingProfile(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: cleanDName });
      }
      // OTP customer → write to customers collection
      const docId = (customer.email || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
      await setDoc(doc(db, "customers", docId), {
        name: cleanDName, phone: cleanP, shortBio: sanitizeText(bio, 250),
        email: customer.email,
        updatedAt: new Date()
      }, { merge: true });
      // Also update the local customer session
      const updated = { ...JSON.parse(localStorage.getItem("pasoja_customer_session") || "{}"), name: cleanDName, phone: cleanP };
      localStorage.setItem("pasoja_customer_session", JSON.stringify(updated));
      setUserData(prev => ({ ...prev, displayName: cleanDName, name: cleanDName, phone: cleanP, bio }));
      showToast("Profile details updated successfully!");
    } catch (err) {
      showToast("Error saving profile: " + err.message);
    } finally {
      setSavingProfile(false);
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
      address: "",
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
    if (!addressForm.name || !addressForm.phone || (!addressForm.flat && !addressForm.address) || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      showToast("Please fill all required address fields", "error");
      return;
    }

    const cleanP = cleanPhone(addressForm.phone);
    if (!isValidPhone(cleanP)) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }

    if (addressForm.alternatePhone) {
      const cleanAlt = cleanPhone(addressForm.alternatePhone);
      if (!isValidPhone(cleanAlt)) {
        showToast("Alternate phone must be a valid 10-digit mobile number", "error");
        return;
      }
    }

    const cleanPin = cleanPincode(addressForm.pincode);
    if (!isValidPincode(cleanPin)) {
      showToast("Please enter a valid 6-digit delivery PIN code", "error");
      return;
    }

    const synthesizedAddress = [
      addressForm.flat,
      addressForm.street,
      addressForm.landmark ? `Near ${addressForm.landmark}` : null
    ].filter(Boolean).join(", ") || addressForm.address;

    const payload = {
      ...addressForm,
      phone: cleanP,
      alternatePhone: cleanPhone(addressForm.alternatePhone),
      pincode: cleanPin,
      address: synthesizedAddress
    };

    try {
      const addrCollection = collection(db, "customers", (customer.email || "").toLowerCase().replace(/[^a-z0-9]/g, "_"), "addresses");

      if (editingAddressId) {
        if (editingAddressId === 'legacy-root-address') {
          const docRef = await addDoc(addrCollection, payload);
          setAddresses(prev => prev.map(a => a.id === editingAddressId ? { id: docRef.id, ...payload } : a));
          showToast("Address updated!");
        } else {
          const addrRef = doc(db, "customers", (customer.email || "").toLowerCase().replace(/[^a-z0-9]/g, "_"), "addresses", editingAddressId);
          await updateDoc(addrRef, payload);
          setAddresses(prev => prev.map(a => a.id === editingAddressId ? { ...a, ...payload } : a));
          showToast("Address updated!");
        }
      } else {
        const docRef = await addDoc(addrCollection, payload);
        setAddresses(prev => [...prev, { id: docRef.id, ...payload }]);
        showToast("New address added!");
      }
      resetAddressForm();
    } catch (err) {
      console.error(err);
      showToast("Failed to save address: " + err.message);
    }
  };

  const handleEditAddressInit = (addr) => {
    setAddressForm({
      name: addr.name || "",
      phone: addr.phone || "",
      alternatePhone: addr.alternatePhone || "",
      flat: addr.flat || "",
      street: addr.street || addr.address || "",
      landmark: addr.landmark || "",
      address: addr.address || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      type: addr.type || "Home",
      isDefault: addr.isDefault || false
    });
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      if (id === 'legacy-root-address') {
        setAddresses(prev => prev.filter(a => a.id !== id));
        showToast("Address deleted");
        return;
      }
      const addrRef = doc(db, "customers", (customer?.email || "").toLowerCase().replace(/[^a-z0-9]/g, "_"), "addresses", id);
      await deleteDoc(addrRef);
      setAddresses(prev => prev.filter(a => a.id !== id));
      showToast("Address deleted");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const updatedList = addresses.map(a => ({ ...a, isDefault: a.id === id }));
      setAddresses(updatedList);
      for (const a of updatedList) {
        if (a.id === 'legacy-root-address') continue;
        const addrRef = doc(db, "customers", (customer?.email || "").toLowerCase().replace(/[^a-z0-9]/g, "_"), "addresses", a.id);
        await updateDoc(addrRef, { isDefault: a.id === id });
      }
      showToast("Default address updated!");
    } catch (err) {
      console.error(err);
    }
  };

  // Payment Cards
  const handleAddCard = async (e) => {
    e.preventDefault();
    if (!newCard.cardNumber || !newCard.cardHolder) return;
    const maskedCard = `•••• •••• •••• ${newCard.cardNumber.slice(-4)}`;
    const cardData = { ...newCard, cardNumber: maskedCard };

    try {
      const docId = (customer.email || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
      const paymentsCol = collection(db, "customers", docId, "payments");
      const docRef = await addDoc(paymentsCol, cardData);
      setPayments(prev => [...prev, { id: docRef.id, ...cardData }]);
      setNewCard({ cardHolder: "", cardNumber: "", expiry: "", brand: "Visa" });
      setShowCardForm(false);
      showToast("Card saved to profile!");
    } catch (err) {
      showToast("Failed to save card");
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm("Remove this card?")) return;
    try {
      const docId = (customer.email || "").toLowerCase().replace(/[^a-z0-9]/g, "_");
      await deleteDoc(doc(db, "customers", docId, "payments", cardId));
      setPayments(prev => prev.filter(p => p.id !== cardId));
      showToast("Card removed");
    } catch (err) {
      showToast("Failed to remove card");
    }
  };

  // INVOICE GENERATION & PRINT
  const handleDownloadInvoice = (order) => {
    const invoiceWindow = window.open('', '_blank', 'width=850,height=950');
    if (!invoiceWindow) {
      alert("Please allow popups to download or print your invoice.");
      return;
    }

    const orderDate = order.createdAt?.toDate
      ? order.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
      : (order.createdAt?.toMillis
        ? new Date(order.createdAt.toMillis()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Recent Date');

    const itemsList = order.items || [];
    const itemsRows = itemsList.map((item, idx) => `
      <tr>
        <td style="padding: 12px 14px; border-bottom: 1px solid #eeeeee; font-size: 12px; color: #555;">${idx + 1}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #eeeeee; font-size: 12px; font-weight: 600; color: #111;">
          ${item.name}
          ${item.size ? `<span style="font-size:10px; color:#777; font-weight: normal; margin-left: 6px;">(Size: ${item.size})</span>` : ''}
        </td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #eeeeee; font-size: 12px; text-align: center; color: #333;">${item.quantity || 1}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #eeeeee; font-size: 12px; text-align: right; color: #333;">₹${(item.price || 0).toLocaleString()}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #eeeeee; font-size: 12px; text-align: right; font-weight: 700; color: #000;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString()}</td>
      </tr>
    `).join('');

    const shippingAddr = order.shipping || {};
    const recipientName = shippingAddr.name || displayName || userData?.displayName || customer?.name || 'Valued Customer';
    const recipientPhone = shippingAddr.phone || phone || 'N/A';

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice #${order.id.toUpperCase()} - MAHIRASH PARFUMERIE</title>
          <style>
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; background: #fafafa; }
            .container { max-width: 800px; margin: 0 auto; background: #ffffff; padding: 40px; border: 1px solid #e5e5e5; border-radius: 4px; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111111; padding-bottom: 24px; margin-bottom: 32px; }
            .brand { font-size: 28px; font-weight: 900; letter-spacing: 5px; text-transform: uppercase; color: #000; margin: 0; }
            .tagline { font-size: 9px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-top: 4px; }
            .inv-meta { text-align: right; }
            .inv-meta h2 { margin: 0; font-size: 20px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase; color: #111; }
            .inv-meta p { margin: 4px 0 0; font-size: 11px; color: #666; }
            .addresses { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 36px; }
            .address-box { width: 48%; font-size: 12px; line-height: 1.6; }
            .address-box h3 { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #888; margin: 0 0 10px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f5f5f5; padding: 12px 14px; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #444; border-bottom: 1px solid #ddd; }
            .summary { display: flex; justify-content: flex-end; margin-bottom: 30px; }
            .summary-table { width: 320px; font-size: 12px; }
            .summary-table td { padding: 8px 12px; }
            .total-row { font-weight: 800; font-size: 15px; border-top: 2px solid #111; border-bottom: 2px solid #111; color: #000; }
            .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px; text-align: center; font-size: 11px; color: #888; }
            .actions { margin-bottom: 24px; text-align: right; }
            .btn-print { background: #000; color: #fff; border: none; padding: 12px 24px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; border-radius: 2px; }
            .btn-print:hover { background: #222; }
            @media print {
              body { padding: 0; background: #fff; }
              .container { border: none; shadow: none; padding: 0; }
              .actions { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="actions">
            <button class="btn-print" onclick="window.print()">Print / Save PDF Invoice</button>
          </div>
          <div class="container">
            <div class="header">
              <div>
                <h1 class="brand">MAHIRASH</h1>
                <div class="tagline">Haute Parfumerie & Luxury Extraits</div>
              </div>
              <div class="inv-meta">
                <h2>TAX INVOICE</h2>
                <p>Invoice #: <strong>INV-${order.id.toUpperCase()}</strong></p>
                <p>Date: ${orderDate}</p>
                <p>Status: <strong style="color: #10B981;">PAID</strong></p>
              </div>
            </div>

            <div class="addresses">
              <div class="address-box">
                <h3>Billed & Shipped To</h3>
                <strong>${recipientName}</strong><br />
                ${shippingAddr.address || 'Standard Address'}<br />
                ${shippingAddr.city ? `${shippingAddr.city}, ${shippingAddr.state} - ${shippingAddr.pincode}` : ''}<br />
                Phone: ${recipientPhone}<br />
                Email: ${customer?.email || 'N/A'}
              </div>
              <div class="address-box" style="text-align: right;">
                <h3>Order Info</h3>
                Order Reference: #${order.id.toUpperCase()}<br />
                Payment Method: ${(order.paymentMethod || 'Online').toUpperCase()}<br />
                Fulfillment Status: <strong>${(order.status || 'Confirmed').toUpperCase()}</strong><br />
                Shipping Standard: Free Priority Delivery
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Item Specification</th>
                  <th style="text-align: center; width: 60px;">Qty</th>
                  <th style="text-align: right; width: 110px;">Unit Price</th>
                  <th style="text-align: right; width: 110px;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsRows}
              </tbody>
            </table>

            <div class="summary">
              <table class="summary-table">
                <tr>
                  <td>Items Subtotal</td>
                  <td style="text-align: right;">₹${(order.total || 0).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Express Shipping</td>
                  <td style="text-align: right; color: #10B981; font-weight: 600;">FREE</td>
                </tr>
                <tr>
                  <td>Estimated GST (Included)</td>
                  <td style="text-align: right;">₹0</td>
                </tr>
                <tr class="total-row">
                  <td style="padding-top: 12px; padding-bottom: 12px;">Grand Total</td>
                  <td style="text-align: right; padding-top: 12px; padding-bottom: 12px;">₹${(order.total || 0).toLocaleString()}</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              <p>Thank you for choosing MAHIRASH PARFUMERIE. For support, returns, or queries regarding this invoice, please reach us at help@mahirash.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();
  };

  if (loading) {
    return <MiniLoader message="Loading Account" />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-zinc-900 pt-[145px] md:pt-[105px] pb-24 px-4 sm:px-6 md:px-10 lg:px-14 font-sans select-none">
      <SEOHead
        title="My Account | Mahirash Parfumerie"
        description="Manage your account profile, orders, and addresses on Mahirash Parfumerie."
        robots="noindex, follow"
        url="https://mahirash.com/account"
      />
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-[100] bg-black text-white px-6 py-3.5 shadow-2xl flex items-center gap-3 border border-zinc-800 animate-bounce">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <p className="text-[12px]   uppercase tracking-wider">{toastMessage}</p>
        </div>
      )}

      <div className="max-w-7xl mx-auto pt-8 md:pt-12">

        {/* PROFILE HEADER CARD */}
        <div className="bg-white border border-zinc-200 p-6 sm:p-8 md:p-10 mb-8 relative overflow-hidden shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left w-full md:w-auto">
              <div className="relative group">
                <div className="w-24 h-24 bg-zinc-100 border border-zinc-300 flex items-center justify-center text-zinc-800 overflow-hidden relative rounded-full">
                  {userData?.photoURL ? (
                    <OptimizedCloudinaryImage src={userData.photoURL} alt="Profile" preset="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User size={40} strokeWidth={1.2} className="text-zinc-400" />
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity rounded-full">
                  <Camera size={20} className="text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h1 className="text-2xl font-light text-zinc-900 uppercase tracking-widest">
                    {userData?.displayName || userData?.name || customer?.name || "Atelier Guest"}
                  </h1>
                  <span className="px-2.5 py-0.5 bg-[#b8860b]/10 border border-[#b8860b]/30 text-[#b8860b] text-[12px] font-black uppercase tracking-widest">Client Member</span>
                </div>
                <p className="text-[14px] text-zinc-500">{activeEmail}</p>
                {phone && (
                  <p className="text-[12px] text-[#b8860b] flex items-center justify-center md:justify-start gap-1 font-semibold">
                    <Phone size={10} /> {phone}
                  </p>
                )}
                {userData?.bio && <p className="text-[12px] text-zinc-500 italic max-w-sm leading-relaxed">{userData.bio}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 border border-zinc-300 text-zinc-600 hover:bg-zinc-100 rounded"
              >
                {mobileMenuOpen ? <X size={20} /> : <Settings size={20} />}
              </button>

              <button onClick={handleLogout}
                className="h-10 px-5 bg-zinc-100 border border-zinc-300 text-zinc-700   text-[12px] uppercase tracking-[0.2em] hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all flex items-center gap-2"
              >
                <LogOut size={12} strokeWidth={2} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* CONTAINER GRID */}
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* Mobile Drawer Backdrop */}
          {mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-30 lg:hidden"
            />
          )}

          {/* SIDEBAR NAVIGATION */}
          <aside className={`lg:col-span-3 space-y-4 fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200 bg-white text-zinc-600 flex flex-col h-screen shrink-0 transition-transform duration-300 lg:static lg:translate-x-0 lg:border-none lg:bg-transparent lg:h-auto ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

            {/* Mobile Header */}
            <div className="lg:hidden px-6 py-5 border-b border-zinc-200 sticky top-0 bg-white z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-black text-white flex items-center justify-center shadow-md">
                  <User size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-poppins   tracking-wider text-zinc-900 uppercase">
                    ACCOUNT
                  </p>
                  <p className="text-[12px] text-zinc-500 uppercase tracking-widest font-semibold">Panel</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 hover:bg-zinc-100 text-zinc-500 hover:text-black rounded"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-grow overflow-y-auto px-4 py-6 space-y-4 lg:space-y-4 lg:px-0 lg:py-0">
              {/* Mobile Only - Quick Metrics & Nav */}
              <div className="lg:hidden space-y-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="group bg-white border border-zinc-200 p-4 hover:border-black/30 transition-all text-center sm:text-left shadow-sm">
                    <div className="w-8 h-8 border border-zinc-300 flex items-center justify-center text-zinc-500 mb-2 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all mx-auto sm:mx-0">
                      <ShoppingBag size={13} strokeWidth={1.5} />
                    </div>
                    <p className="text-xl font-light text-zinc-900 tracking-wider">{stats.cart}</p>
                    <p className="text-[12px]   text-zinc-500 uppercase tracking-widest mt-0.5">In Cart</p>
                  </Link>

                  <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="group bg-white border border-zinc-200 p-4 hover:border-black/30 transition-all text-center sm:text-left shadow-sm">
                    <div className="w-8 h-8 border border-zinc-300 flex items-center justify-center text-zinc-500 mb-2 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all mx-auto sm:mx-0">
                      <Heart size={13} strokeWidth={1.5} />
                    </div>
                    <p className="text-xl font-light text-zinc-900 tracking-wider">{stats.wishlist}</p>
                    <p className="text-[12px]   text-zinc-500 uppercase tracking-widest mt-0.5">Wishlist</p>
                  </Link>

                  <button onClick={() => { setActiveTab("orders"); setMobileMenuOpen(false); }} className="group bg-white border border-zinc-200 p-4 hover:border-black/30 transition-all text-center sm:text-left shadow-sm">
                    <div className="w-8 h-8 border border-zinc-300 flex items-center justify-center text-zinc-500 mb-2 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all mx-auto sm:mx-0">
                      <Package size={13} strokeWidth={1.5} />
                    </div>
                    <p className="text-xl font-light text-zinc-900 tracking-wider">{stats.orders}</p>
                    <p className="text-[12px]   text-zinc-500 uppercase tracking-widest mt-0.5">Orders</p>
                  </button>
                </div>

                <div className="bg-white border border-zinc-200 p-1.5 shadow-sm">
                  <span className="block px-3 py-2 text-[12px]   text-zinc-400 uppercase tracking-[0.3em]">Account Panel</span>
                  {[
                    { id: "profile", icon: Settings, label: "Profile & Phone" },
                    { id: "orders", icon: Package, label: "Orders & Invoices" },
                    { id: "addresses", icon: MapPin, label: "Shipping Addresses" },
                    { id: "payments", icon: CreditCard, label: "Saved Cards" },
                    { id: "notifications", icon: Bell, label: "Notification Preferences" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-semibold tracking-wide transition-all ${activeTab === item.id ? 'bg-black text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-100 hover:text-black border border-transparent'}`}
                    >
                      <item.icon size={14} strokeWidth={2} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Desktop Only - Quick Metrics & Nav */}
              <div className="hidden lg:block space-y-4">
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <Link to="/cart" className="group bg-white border border-zinc-200 p-4 hover:border-black/30 transition-all text-center sm:text-left shadow-sm">
                    <div className="w-8 h-8 border border-zinc-300 flex items-center justify-center text-zinc-500 mb-2 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all mx-auto sm:mx-0">
                      <ShoppingBag size={13} strokeWidth={1.5} />
                    </div>
                    <p className="text-xl font-light text-zinc-900 tracking-wider">{stats.cart}</p>
                    <p className="text-[12px]   text-zinc-500 uppercase tracking-widest mt-0.5">In Cart</p>
                  </Link>

                  <Link to="/wishlist" className="group bg-white border border-zinc-200 p-4 hover:border-black/30 transition-all text-center sm:text-left shadow-sm">
                    <div className="w-8 h-8 border border-zinc-300 flex items-center justify-center text-zinc-500 mb-2 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all mx-auto sm:mx-0">
                      <Heart size={13} strokeWidth={1.5} />
                    </div>
                    <p className="text-xl font-light text-zinc-900 tracking-wider">{stats.wishlist}</p>
                    <p className="text-[12px]   text-zinc-500 uppercase tracking-widest mt-0.5">Wishlist</p>
                  </Link>

                  <button onClick={() => setActiveTab("orders")} className="group bg-white border border-zinc-200 p-4 hover:border-black/30 transition-all text-center sm:text-left shadow-sm">
                    <div className="w-8 h-8 border border-zinc-300 flex items-center justify-center text-zinc-500 mb-2 group-hover:bg-black group-hover:text-white group-hover:border-black transition-all mx-auto sm:mx-0">
                      <Package size={13} strokeWidth={1.5} />
                    </div>
                    <p className="text-xl font-light text-zinc-900 tracking-wider">{stats.orders}</p>
                    <p className="text-[12px]   text-zinc-500 uppercase tracking-widest mt-0.5">Orders</p>
                  </button>
                </div>

                <div className="bg-white border border-zinc-200 p-1.5 shadow-sm">
                  <span className="block px-3 py-2 text-[12px]   text-zinc-400 uppercase tracking-[0.3em]">Account Panel</span>
                  {[
                    { id: "profile", icon: Settings, label: "Profile & Phone" },
                    { id: "orders", icon: Package, label: "Orders & Invoices" },
                    { id: "addresses", icon: MapPin, label: "Shipping Addresses" },
                    { id: "payments", icon: CreditCard, label: "Saved Cards" },
                    { id: "notifications", icon: Bell, label: "Notification Preferences" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-semibold tracking-wide transition-all ${activeTab === item.id ? 'bg-black text-white shadow-sm' : 'text-zinc-600 hover:bg-zinc-100 hover:text-black border border-transparent'}`}
                    >
                      <item.icon size={14} strokeWidth={2} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </nav>

            {/* Logout button */}
            <div className="p-4 border-t border-zinc-200 bg-zinc-50 lg:hidden">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-[14px]   text-red-600 hover:bg-red-50 hover:text-red-700 transition-all border border-red-200"
              >
                <LogOut size={14} />
                <span>LOGOUT</span>
              </button>
            </div>
          </aside>

          {/* MAIN DYNAMIC CONTENT */}
          <div className="lg:col-span-9 lg:pl-8">

            {/* TAB: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Recent Orders Overview */}
                <div className="bg-white border border-zinc-200 p-6 md:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-200">
                    <div>
                      <h3 className="text-lg font-light text-zinc-900 uppercase tracking-widest">Recent Purchases</h3>
                      <p className="text-[12px] text-zinc-500 mt-0.5">Track shipment timeline & download tax invoices</p>
                    </div>
                    {recentOrders.length > 0 && (
                      <button onClick={() => setActiveTab("orders")} className="h-8 px-4 border border-zinc-300 text-[12px] font-semibold text-zinc-600 uppercase tracking-wider hover:border-black hover:text-black transition-all flex items-center">
                        View All ({recentOrders.length})
                      </button>
                    )}
                  </div>

                  {recentOrders.length > 0 ? (
                    <div className="divide-y divide-zinc-200">
                      {recentOrders.slice(0, 3).map((order) => (
                        <div key={order.id}
                          className="group py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setSelectedOrder(order)}>
                            <div className="w-10 h-10 border border-zinc-300 flex items-center justify-center text-zinc-500 group-hover:border-black group-hover:text-black transition-all">
                              <Package size={16} strokeWidth={1.5} />
                            </div>
                            <div>
                              <p className="text-[13px]   text-zinc-800 group-hover:text-black transition-colors">
                                #{order.id.toUpperCase()}
                              </p>
                              <p className="text-[12px] text-zinc-500">
                                {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                              </p>
                            </div>
                          </div>

                          <div className="w-full sm:w-auto flex sm:flex-row items-center justify-between sm:justify-end gap-3">
                            <div className="text-right">
                              <p className="text-sm   text-zinc-900">₹{order.total?.toLocaleString()}</p>
                              <span className={`inline-block px-2 py-0.5 text-[12px]   uppercase tracking-wider border ${order.status === 'confirmed' || order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : order.status === 'failed' ? 'bg-red-50 text-red-700 border-red-300'
                                  : 'bg-amber-50 text-amber-700 border-amber-300'
                                }`}>{order.status || 'Confirmed'}</span>
                            </div>

                            <div className="flex gap-2">
                              {order.awbCode && (
                                <Link
                                  to={`/track?awb=${order.awbCode}`}
                                  className="p-2 border border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all flex items-center"
                                  title="Track Shipment Live"
                                >
                                  <Truck size={13} />
                                </Link>
                              )}
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="px-3 py-2 bg-zinc-100 border border-zinc-300 text-zinc-800 text-[12px]   uppercase tracking-wider hover:bg-black hover:text-white transition-all"
                              >
                                Details
                              </button>
                              <button
                                onClick={() => handleDownloadInvoice(order)}
                                className="p-2 border border-zinc-300 text-[#b8860b] hover:bg-[#b8860b] hover:text-white transition-all"
                                title="Download Invoice"
                              >
                                <Download size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 border border-zinc-300 flex items-center justify-center text-zinc-400 mx-auto mb-3">
                        <ShoppingBag size={20} strokeWidth={1.5} />
                      </div>
                      <h4 className="text-sm font-light text-zinc-900 uppercase tracking-widest mb-1">No orders yet</h4>
                      <p className="text-[12px] text-zinc-500 mb-4">Start exploring the shop to place your first order.</p>
                      <Link to="/shop" className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white   text-[12px] uppercase tracking-widest hover:bg-zinc-800 transition-all">
                        Explore Shop <ChevronRight size={11} />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Primary Shipping Address Overview */}
                <div className="bg-white border border-zinc-200 p-6 md:p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-[#b8860b]" />
                      <h4 className="text-[14px]   text-zinc-900 uppercase tracking-widest">Primary Shipping Address</h4>
                    </div>
                    <button onClick={() => setActiveTab("addresses")} className="text-[12px] text-[#b8860b] font-semibold hover:underline uppercase tracking-wider">
                      Manage Addresses ({addresses.length})
                    </button>
                  </div>

                  {addresses.length > 0 ? (
                    (() => {
                      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
                      return (
                        <div className="text-[14px] text-zinc-700 space-y-1">
                          <p className="  text-zinc-900 uppercase tracking-wider">{defaultAddr.name}</p>
                          <p className="text-zinc-500">{defaultAddr.address}, {defaultAddr.city}, {defaultAddr.state} - {defaultAddr.pincode}</p>
                          <p className="text-[12px] text-[#b8860b] font-semibold">Contact: {defaultAddr.phone}</p>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex items-center justify-between text-[14px] text-zinc-500">
                      <p>No saved addresses.</p>
                      <button onClick={() => { setActiveTab("addresses"); setShowAddressForm(true); }} className="text-[12px] text-zinc-900 underline uppercase  ">Add Address</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: PROFILE & PHONE */}
            {activeTab === "profile" && (
              <div className="bg-white border border-zinc-200 p-6 md:p-8 space-y-6 shadow-sm">
                <div className="pb-4 border-b border-zinc-200">
                  <h3 className="text-lg font-light text-zinc-900 uppercase tracking-widest">Personal Information</h3>
                  <p className="text-[12px] text-zinc-500">Update your profile name, contact number, and biography</p>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px]   text-zinc-500 uppercase tracking-widest">Profile Name</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                        placeholder="Your Full Name"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] text-zinc-500 uppercase tracking-widest">Contact Phone Number (10 digits)</label>
                      <input
                        type="tel"
                        maxLength={10}
                        inputMode="numeric"
                        value={phone}
                        onChange={(e) => setPhone(cleanPhone(e.target.value))}
                        placeholder="10-digit phone number"
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px]   text-zinc-400 uppercase tracking-widest">Registered Email (Read-only)</label>
                    <input
                      type="email"
                      value={activeEmail || ""}
                      disabled
                      className="w-full px-4 py-3 bg-zinc-100 border border-zinc-200 text-[14px] text-zinc-500 cursor-not-allowed outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px]   text-zinc-500 uppercase tracking-widest">Short Bio</label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share your fashion preferences..."
                      rows={3}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none transition-colors resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-8 py-3.5 bg-black text-white text-[12px]   uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    {savingProfile ? "Saving Details..." : "Save Profile Changes"}
                  </button>
                </form>
              </div>
            )}

            {/* TAB: ORDERS & INVOICES */}
            {activeTab === "orders" && (
              <div className="bg-white border border-zinc-200 p-6 md:p-8 space-y-6 shadow-sm">
                <div className="pb-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-light text-zinc-900 uppercase tracking-widest">Order History & Invoices</h3>
                    <p className="text-[12px] text-zinc-500">Track shipments and download official invoices</p>
                  </div>
                  <span className="text-[12px] text-zinc-500 font-mono">Total Orders: {recentOrders.length}</span>
                </div>

                {recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="p-5 bg-zinc-50 border border-zinc-200 hover:border-zinc-400 transition-all rounded space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                          <div>
                            <span className="text-[12px] text-[#b8860b] font-black uppercase tracking-widest">Order Reference</span>
                            <h4 className="text-[14px]   text-zinc-900 uppercase tracking-wider">#{order.id.toUpperCase()}</h4>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 text-[12px]   uppercase tracking-widest border ${order.status === 'confirmed' || order.status === 'delivered' ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : order.status === 'failed' ? 'bg-red-50 text-red-700 border-red-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                              }`}>{order.status || 'Confirmed'}</span>

                            <button
                              onClick={() => handleDownloadInvoice(order)}
                              className="px-3 py-1 bg-white border border-zinc-300 hover:bg-[#b8860b] hover:text-white text-[#b8860b] text-[12px]   uppercase tracking-wider transition-all flex items-center gap-1.5"
                            >
                              <Download size={11} /> Invoice
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px] text-zinc-600">
                          <div>
                            <span className="block text-[12px] uppercase tracking-wider text-zinc-500   mb-0.5">Date Placed</span>
                            <span className="text-zinc-900">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-IN') : 'Recent'}</span>
                          </div>
                          <div>
                            <span className="block text-[12px] uppercase tracking-wider text-zinc-500   mb-0.5">Total Amount</span>
                            <span className="text-zinc-900  ">₹{order.total?.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="block text-[12px] uppercase tracking-wider text-zinc-500   mb-0.5">Payment Method</span>
                            <span className="text-zinc-900 uppercase">{order.paymentMethod || 'Online'}</span>
                          </div>
                          <div>
                            <span className="block text-[12px] uppercase tracking-wider text-zinc-500   mb-0.5">Items</span>
                            <span className="text-zinc-900">{order.items?.length || 1} Item(s)</span>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-between items-center">
                          {order.awbCode ? (
                            <Link
                              to={`/track?awb=${order.awbCode}`}
                              className="text-[12px] text-emerald-700 hover:text-emerald-800 font-bold uppercase tracking-wider flex items-center gap-1"
                            >
                              <Truck size={12} className="animate-pulse" /> Track Shipment Live
                            </Link>
                          ) : (
                            <Link
                              to={`/track?orderId=${order.id}`}
                              className="text-[12px] text-zinc-500 hover:text-zinc-800 font-semibold uppercase tracking-wider flex items-center gap-1"
                            >
                              <Clock size={11} /> View Packing Status
                            </Link>
                          )}
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="text-[12px] text-zinc-600 hover:text-black uppercase tracking-widest flex items-center gap-1 transition-colors"
                          >
                            Details <ChevronRight size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <p className="text-zinc-500 text-[14px] uppercase tracking-widest mb-3">No order history available.</p>
                    <Link to="/shop" className="px-6 py-3 bg-black text-white   text-[12px] uppercase tracking-widest hover:bg-zinc-800 transition-all inline-block">
                      Browse Shop
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* TAB: SHIPPING ADDRESSES */}
            {activeTab === "addresses" && (
              <div className="bg-white border border-zinc-200 p-6 md:p-8 space-y-6 shadow-sm">
                <div className="pb-4 border-b border-zinc-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-light text-zinc-900 uppercase tracking-widest">Saved Addresses</h3>
                    <p className="text-[12px] text-zinc-500">Manage your shipping destinations & contact numbers</p>
                  </div>
                  <button
                    onClick={() => {
                      if (showAddressForm) resetAddressForm();
                      else setShowAddressForm(true);
                    }}
                    className="h-9 px-4 border border-zinc-300 text-[12px]   text-[#b8860b] uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all flex items-center gap-1.5"
                  >
                    <Plus size={12} /> {showAddressForm ? "Cancel" : "Add New Address"}
                  </button>
                </div>

                {/* ADDRESS FORM */}
                {/* ADDRESS FORM */}
                {showAddressForm && (
                  <form onSubmit={handleSaveAddress} className="bg-zinc-50 border border-zinc-200 p-6 space-y-4 rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200">
                      <h4 className="text-[14px] font-bold uppercase tracking-widest text-[#b8860b]">
                        {editingAddressId ? "Edit Shipping Address" : "New Shipping Address Details"}
                      </h4>
                      {/* Address Type Selector */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-semibold text-zinc-500 uppercase tracking-wider mr-1">Type:</span>
                        {["Home", "Office", "Other"].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setAddressForm(p => ({ ...p, type: t }))}
                            className={`px-2.5 py-1 text-[12px] font-semibold uppercase tracking-wider rounded border transition-all cursor-pointer ${addressForm.type === t
                              ? "bg-black text-white border-black shadow-xs"
                              : "bg-white text-zinc-600 border-zinc-300 hover:border-black hover:text-black"
                              }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Contact Person Full Name *</label>
                        <input
                          type="text"
                          value={addressForm.name}
                          onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                          required
                          placeholder="e.g. John Doe"
                          className="w-full px-3 py-2.5 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none rounded"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Primary Mobile Phone (10 digits) *</label>
                        <input
                          type="tel"
                          maxLength={10}
                          inputMode="numeric"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: cleanPhone(e.target.value) })}
                          required
                          placeholder="10-digit mobile number"
                          className="w-full px-3 py-2.5 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none rounded font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Alternate Phone (Optional)</label>
                        <input
                          type="tel"
                          maxLength={10}
                          inputMode="numeric"
                          value={addressForm.alternatePhone || ""}
                          onChange={(e) => setAddressForm({ ...addressForm, alternatePhone: cleanPhone(e.target.value) })}
                          placeholder="Secondary 10-digit mobile"
                          className="w-full px-3 py-2.5 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none rounded font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Flat, House No., Building, Apartment *</label>
                        <input
                          type="text"
                          value={addressForm.flat || ""}
                          onChange={(e) => setAddressForm({ ...addressForm, flat: e.target.value })}
                          required
                          placeholder="e.g. Flat 402, Royal Residency, Tower B"
                          className="w-full px-3 py-2.5 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none rounded"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Area, Street, Sector, Locality *</label>
                        <input
                          type="text"
                          value={addressForm.street || ""}
                          onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                          required
                          placeholder="e.g. MG Road, Scheme 54, Vijay Nagar"
                          className="w-full px-3 py-2.5 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none rounded"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Landmark (Optional)</label>
                        <input
                          type="text"
                          value={addressForm.landmark || ""}
                          onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                          placeholder="e.g. Near Apollo Hospital / Opp. City Center"
                          className="w-full px-3 py-2.5 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none rounded"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">City / District *</label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          required
                          placeholder="e.g. Indore"
                          className="w-full px-3 py-2.5 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none rounded"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">State *</label>
                        <input
                          type="text"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          required
                          placeholder="e.g. Madhya Pradesh"
                          className="w-full px-3 py-2.5 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none rounded"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider">Pincode (6 digits) *</label>
                        <input
                          type="text"
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: cleanPincode(e.target.value) })}
                          required
                          maxLength={6}
                          inputMode="numeric"
                          placeholder="6-digit Pincode"
                          className="w-full px-3 py-2.5 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none rounded font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer text-[14px] text-zinc-700">
                        <input
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="rounded text-[#b8860b] focus:ring-0 w-4 h-4 cursor-pointer border-zinc-300"
                        />
                        Set as Default Address
                      </label>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="px-5 py-2.5 bg-black text-white text-[12px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors rounded">
                        {editingAddressId ? "Update Address" : "Save Address"}
                      </button>
                      <button type="button" onClick={resetAddressForm} className="px-5 py-2.5 border border-zinc-300 text-zinc-600 text-[12px] font-bold uppercase tracking-wider hover:text-black transition-colors rounded">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* ADDRESS LIST */}
                <div className="grid md:grid-cols-2 gap-4">
                  {addresses.map((a) => (
                    <div key={a.id} className={`p-5 bg-zinc-50 border ${a.isDefault ? 'border-[#b8860b]' : 'border-zinc-200'} rounded-xl flex flex-col justify-between space-y-4 relative shadow-xs`}>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 bg-zinc-200 text-zinc-800 text-[12px] font-bold uppercase tracking-wider rounded">
                          {a.type || "Home"}
                        </span>
                        {a.isDefault && (
                          <span className="px-2 py-0.5 bg-[#b8860b]/10 border border-[#b8860b]/30 text-[#b8860b] text-[12px] font-bold uppercase tracking-wider rounded">
                            Default
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-[14px]">
                        <h4 className="font-bold text-zinc-900 tracking-wide uppercase">{a.name}</h4>
                        {a.flat && <p className="text-zinc-800 font-medium text-xs">{a.flat}</p>}
                        <p className="text-zinc-600 leading-relaxed text-xs">{a.street || a.address}</p>
                        {a.landmark && <p className="text-zinc-500 text-[12px]">Landmark: {a.landmark}</p>}
                        <p className="text-zinc-600 text-xs">{a.city}, {a.state} - <span className="font-mono font-semibold">{a.pincode}</span></p>
                        <div className="pt-1.5 flex flex-col gap-0.5 text-[12px] text-zinc-700">
                          <p className="flex items-center gap-1.5 font-semibold text-[#b8860b]">
                            <Phone size={11} /> {a.phone}
                          </p>
                          {a.alternatePhone && (
                            <p className="text-zinc-500 pl-4 text-[12px]">
                              Alt: {a.alternatePhone}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-zinc-200">
                        {!a.isDefault ? (
                          <button
                            onClick={() => handleSetDefaultAddress(a.id)}
                            className="text-[12px] text-zinc-500 hover:text-[#b8860b] uppercase tracking-wider transition-colors  "
                          >
                            Set Default
                          </button>
                        ) : <span />}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditAddressInit(a)}
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

                  {addresses.length === 0 && !showAddressForm && (
                    <div className="col-span-2 text-center py-12 border border-dashed border-zinc-300 rounded">
                      <MapPin size={24} className="mx-auto text-zinc-400 mb-2" />
                      <p className="text-zinc-500 text-[14px] uppercase tracking-widest mb-3">No saved addresses found.</p>
                      <button
                        onClick={() => setShowAddressForm(true)}
                        className="px-4 py-2 border border-zinc-400 text-zinc-900 text-[12px]   uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                      >
                        Add Your First Address
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: PAYMENT METHODS */}
            {activeTab === "payments" && (
              <div className="bg-white border border-zinc-200 p-6 md:p-8 space-y-6 shadow-sm">
                <div className="pb-4 border-b border-zinc-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-light text-zinc-900 uppercase tracking-widest">Saved Payment Cards</h3>
                    <p className="text-[12px] text-zinc-500">Manage cards saved for express checkout</p>
                  </div>
                  <button
                    onClick={() => setShowCardForm(!showCardForm)}
                    className="h-8 px-4 border border-zinc-300 text-[12px]   text-[#b8860b] uppercase tracking-widest hover:bg-black hover:text-white hover:border-black transition-all flex items-center gap-1.5"
                  >
                    <Plus size={11} /> {showCardForm ? "Cancel" : "Add Card"}
                  </button>
                </div>

                {showCardForm && (
                  <form onSubmit={handleAddCard} className="bg-zinc-50 border border-zinc-200 p-5 space-y-4 rounded">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[12px]   text-zinc-500 uppercase tracking-wider">Cardholder Name</label>
                        <input
                          type="text"
                          value={newCard.cardHolder}
                          onChange={(e) => setNewCard({ ...newCard, cardHolder: e.target.value })}
                          required
                          placeholder="John Doe"
                          className="w-full px-3 py-2 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px]   text-zinc-500 uppercase tracking-wider">Card Number</label>
                        <input
                          type="text"
                          value={newCard.cardNumber}
                          onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                          required
                          maxLength={16}
                          placeholder="4242 4242 4242 4242"
                          className="w-full px-3 py-2 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[12px]   text-zinc-500 uppercase tracking-wider">Expiry Date</label>
                        <input
                          type="text"
                          value={newCard.expiry}
                          onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                          required
                          placeholder="MM/YY"
                          maxLength={5}
                          className="w-full px-3 py-2 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[12px]   text-zinc-500 uppercase tracking-wider">Card Network</label>
                        <select
                          value={newCard.brand}
                          onChange={(e) => setNewCard({ ...newCard, brand: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-zinc-300 text-[14px] text-zinc-900 focus:border-zinc-500 outline-none"
                        >
                          <option value="Visa">Visa</option>
                          <option value="Mastercard">Mastercard</option>
                          <option value="Rupay">Rupay</option>
                          <option value="Amex">American Express</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="submit" className="px-4 py-2 bg-black text-white text-[12px]   uppercase tracking-wider hover:bg-zinc-800 transition-colors">
                        Save Card
                      </button>
                      <button type="button" onClick={() => setShowCardForm(false)} className="px-4 py-2 border border-zinc-300 text-zinc-600 text-[12px]   uppercase tracking-wider hover:text-black transition-colors">
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {payments.map((p) => (
                    <div key={p.id} className="p-5 bg-gradient-to-br from-zinc-900 to-black text-white border border-zinc-800 rounded relative overflow-hidden flex flex-col justify-between h-40 shadow-md">
                      <div className="flex justify-between items-start">
                        <span className="text-[12px]   text-[#c9a962] tracking-[0.25em] uppercase">{p.brand}</span>
                        <div className="flex items-center gap-2">
                          <CreditCard size={18} strokeWidth={1.2} className="text-white/40" />
                          <button onClick={() => handleDeleteCard(p.id)} className="text-white/40 hover:text-red-400 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-mono tracking-widest text-white">{p.cardNumber}</p>
                        <div className="flex justify-between items-end">
                          <div>
                            <span className="block text-[7px] uppercase tracking-wider text-zinc-400  ">Holder</span>
                            <span className="text-[12px]   text-white/80">{p.cardHolder}</span>
                          </div>
                          <div>
                            <span className="block text-[7px] uppercase tracking-wider text-zinc-400  ">Expiry</span>
                            <span className="text-[12px] font-mono   text-white/80">{p.expiry}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATION PREFERENCES */}
            {activeTab === "notifications" && (
              <div className="bg-white border border-zinc-200 p-6 md:p-8 space-y-6 shadow-sm">
                <div className="pb-4 border-b border-zinc-200">
                  <h3 className="text-lg font-light text-zinc-900 uppercase tracking-widest">Notification Settings</h3>
                  <p className="text-[12px] text-zinc-500">Manage your communication channels and alert preferences</p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: "orderUpdates", title: "Order Timeline & Tracking Alerts", sub: "Receive real-time SMS & email notifications when shipment status changes" },
                    { key: "promotionalOffers", title: "Exclusive Drops & Offers", sub: "Be first to know about capsule collection releases and exclusive client discounts" },
                    { key: "newsletter", title: "Editorial Newsletter", sub: "Curated brand stories and style guidance" },
                    { key: "securityAlerts", title: "Account Security Alerts", sub: "Instant notifications for password updates or login location flags" }
                  ].map((notif) => (
                    <div key={notif.key} className="flex justify-between items-center p-4 bg-zinc-50 border border-zinc-200 rounded">
                      <div className="max-w-[80%] space-y-0.5">
                        <h4 className="text-[14px]   text-zinc-900 uppercase tracking-wider">{notif.title}</h4>
                        <p className="text-[12px] text-zinc-500 leading-relaxed">{notif.sub}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifications[notif.key]}
                        onChange={(e) => {
                          setNotifications({ ...notifications, [notif.key]: e.target.checked });
                          showToast("Preference updated");
                        }}
                        className="rounded text-[#b8860b] focus:ring-0 w-4 h-4 cursor-pointer border-zinc-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* TRACKING & ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-zinc-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded shadow-2xl text-zinc-900">

            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <span className="text-[12px] text-[#b8860b] font-black uppercase tracking-widest">Order Details & Tracking</span>
                <h3 className="text-[14px]   uppercase tracking-widest text-zinc-900 mt-0.5">
                  Order #{selectedOrder.id.toUpperCase()}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="px-3 py-1.5 bg-black text-white text-[12px]   uppercase tracking-wider hover:bg-zinc-800 transition-all flex items-center gap-1.5"
                >
                  <Download size={11} /> Invoice
                </button>
                <button onClick={() => setSelectedOrder(null)} className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-black">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 text-[14px]">
              {/* STEPPER TIMELINE */}
              <div className="space-y-4 bg-zinc-50 border border-[#e4e4e7] p-5 rounded">
                <div className="flex justify-between items-center">
                  <span className="text-[12px] text-zinc-500 uppercase tracking-widest">Shipment status</span>
                  <div className="flex items-center gap-2">
                    {selectedOrder.awbCode && (
                      <Link
                        to={`/track?awb=${selectedOrder.awbCode}`}
                        className="px-2.5 py-0.5 text-[12px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded uppercase tracking-wider transition"
                      >
                        Track Live Shipment
                      </Link>
                    )}
                    <span className="px-2.5 py-0.5 text-[12px] font-black uppercase tracking-wider border border-[#b8860b]/40 text-[#b8860b] bg-[#b8860b]/10 rounded">
                      {selectedOrder.status || 'Confirmed'}
                    </span>
                  </div>
                </div>

                <div className="relative pt-2">
                  <div className="h-1 bg-zinc-200 w-full rounded" />
                  <div className={`absolute top-2 h-1 bg-[#b8860b] rounded transition-all duration-500 ${selectedOrder.status === 'delivered' ? 'w-full' : selectedOrder.status === 'shipped' || selectedOrder.status === 'shipping' ? 'w-2/3' : 'w-1/3'
                    }`} />
                  <div className="flex justify-between text-[12px] uppercase tracking-wider mt-3 text-zinc-500  ">
                    <span className="text-zinc-900 flex items-center gap-1"><CheckCircle2 size={10} className="text-[#b8860b]" /> Confirmed</span>
                    <span className={selectedOrder.status === 'shipped' || selectedOrder.status === 'delivered' ? 'text-zinc-900 flex items-center gap-1' : ''}>
                      <Truck size={10} /> Shipped
                    </span>
                    <span className={selectedOrder.status === 'delivered' ? 'text-zinc-900 flex items-center gap-1' : ''}>
                      <Package size={10} /> Delivered
                    </span>
                  </div>
                </div>
              </div>

              {/* PURCHASED ITEMS */}
              <div className="space-y-3">
                <span className="text-[12px]   text-zinc-500 uppercase tracking-widest block">Purchased Items ({selectedOrder.items?.length || 1})</span>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, i) => (
                    <div key={i} className="flex gap-4 items-center bg-zinc-50 border border-zinc-200 p-3.5 rounded">
                      <div className="w-12 h-14 bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                        <OptimizedCloudinaryImage src={item.image} alt={item.name} preset="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="  text-zinc-900 truncate uppercase tracking-wider">{item.name}</h4>
                        <p className="text-[12px] text-zinc-500 uppercase mt-0.5">Qty: {item.quantity || 1} {item.size && `| Size: ${item.size}`}</p>
                      </div>
                      <span className="  text-zinc-900 text-sm">₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SHIPPING & SUMMARY INFO */}
              <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-200">
                <div className="space-y-1.5">
                  <span className="block text-[12px] uppercase tracking-wider text-zinc-500  ">Shipping Destination</span>
                  <p className="text-zinc-700 leading-relaxed">
                    <strong>{selectedOrder.shipping?.name || displayName || 'Valued Customer'}</strong><br />
                    {selectedOrder.shipping?.address}, {selectedOrder.shipping?.city}, {selectedOrder.shipping?.state} - {selectedOrder.shipping?.pincode}<br />
                    Phone: {selectedOrder.shipping?.phone || phone || 'N/A'}
                  </p>
                </div>
                <div className="space-y-2 text-right">
                  <div>
                    <span className="block text-[12px] uppercase tracking-wider text-zinc-500  ">Payment Status</span>
                    <span className="text-emerald-700   uppercase">PAID ({selectedOrder.paymentMethod || 'Online'})</span>
                  </div>
                  <div>
                    <span className="block text-[12px] uppercase tracking-wider text-zinc-500  ">Grand Total</span>
                    <span className="text-lg   text-zinc-900">₹{(selectedOrder.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="w-full py-3 bg-black text-white   text-[12px] uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={13} /> Print / Download Tax Invoice
                </button>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Account;
