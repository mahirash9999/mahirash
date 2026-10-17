import React, { useState, useEffect } from "react";
import { db } from "../../../components/Firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Phone, Mail, MessageSquare, Image, Upload, Bot, Globe, CheckCircle2, Trash2 } from "lucide-react";
import CloudinaryMediaPickerModal from "../../../components/CloudinaryMediaPickerModal";

const SiteSettingsManager = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [pickerTarget, setPickerTarget] = useState(null); // 'logo' | 'icon' | null
    const [settings, setSettings] = useState({
        whatsapp_number: "",
        phone: "",
        email: "",
        preorder_message: "",
        logo_url: "",
        site_icon_url: "",
        gemini_api_key: ""
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const d = await getDoc(doc(db, "settings", "global"));
                if (d.exists()) {
                    const data = d.data();
                    setSettings({
                        whatsapp_number: data.whatsapp_number || "",
                        phone: data.phone || "",
                        email: data.email || "",
                        preorder_message: data.preorder_message || "",
                        logo_url: data.logo_url || "",
                        site_icon_url: data.site_icon_url || "",
                        gemini_api_key: data.gemini_api_key || ""
                    });
                }
            } catch (err) {
                console.error("Error fetching settings:", err);
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setSettings(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSelectMedia = (url) => {
        if (pickerTarget === 'logo') {
            setSettings(prev => ({ ...prev, logo_url: url }));
        } else if (pickerTarget === 'icon') {
            setSettings(prev => ({ ...prev, site_icon_url: url }));
        }
        setPickerTarget(null);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        try {
            await setDoc(doc(db, "settings", "global"), settings, { merge: true });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3500);
        } catch (err) {
            console.error("Error saving settings:", err);
            alert("Failed to save settings: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden font-sans">
            <div className="p-6 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold uppercase tracking-wider text-black">
                        Store Branding & Global Settings
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1">
                        Upload your store logo, website favicon/site-icon, contact details, and Gemini Chatbot key.
                    </p>
                </div>
                {success && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
                        <CheckCircle2 size={14} /> Saved & Synced across website!
                    </span>
                )}
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-8">
                {/* ── SECTION 1: LOGO & SITE ICON UPLOAD ── */}
                <div className="border border-zinc-200/90 rounded-2xl p-5 bg-zinc-50/60 space-y-6">
                    <div className="border-b border-zinc-200 pb-3 flex items-center gap-2">
                        <Image size={18} className="text-[#B8860B]" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                            Website Brand Logo & Site Icon (Favicon)
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 1. Website Brand Logo */}
                        <div className="space-y-3 bg-white p-4.5 rounded-xl border border-zinc-200">
                            <label className="text-[13px] font-bold text-zinc-800 uppercase tracking-wider block">
                                Main Store Logo
                            </label>
                            <p className="text-[12px] text-zinc-500">
                                Displayed in header, footer, checkout, and emails. Recommended: PNG or WebP with transparent background.
                            </p>

                            {/* Live Preview Box */}
                            <div className="h-20 bg-zinc-900 rounded-xl flex items-center justify-center p-3 relative border border-zinc-700 overflow-hidden">
                                <img
                                    src={settings.logo_url || "/logom.webp"}
                                    alt="Store Logo Preview"
                                    className="max-h-12 max-w-[200px] object-contain brightness-0 invert"
                                />
                                <span className="absolute bottom-1 right-2 text-[10px] text-zinc-400 font-mono">
                                    {settings.logo_url ? "Custom" : "Default"}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="logo_url"
                                    value={settings.logo_url}
                                    onChange={handleChange}
                                    placeholder="Enter image URL or select from media"
                                    className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 text-xs outline-none focus:border-[#B8860B]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPickerTarget('logo')}
                                    className="px-3 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                    <Upload size={13} />
                                    <span>Upload / Pick</span>
                                </button>
                                {settings.logo_url && (
                                    <button
                                        type="button"
                                        onClick={() => setSettings(p => ({ ...p, logo_url: "" }))}
                                        className="p-2 text-zinc-400 hover:text-red-600 rounded-lg border border-zinc-200 hover:border-red-200 transition-colors"
                                        title="Reset to default logo"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. Site Icon / Favicon */}
                        <div className="space-y-3 bg-white p-4.5 rounded-xl border border-zinc-200">
                            <label className="text-[13px] font-bold text-zinc-800 uppercase tracking-wider block">
                                Website Favicon (Site Icon)
                            </label>
                            <p className="text-[12px] text-zinc-500">
                                Shown in browser tabs, bookmarks, and mobile shortcut icons. Recommended: Square 512x512 PNG/ICO.
                            </p>

                            {/* Live Preview Box */}
                            <div className="h-20 bg-zinc-100 rounded-xl flex items-center justify-center p-3 relative border border-zinc-300 overflow-hidden">
                                {settings.site_icon_url ? (
                                    <img
                                        src={settings.site_icon_url}
                                        alt="Site Icon Preview"
                                        className="w-12 h-12 object-contain rounded-lg shadow-sm"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 text-zinc-400 text-xs">
                                        <Globe size={18} />
                                        <span>Default Mahirash Favicon</span>
                                    </div>
                                )}
                                <span className="absolute bottom-1 right-2 text-[10px] text-zinc-500 font-mono">
                                    {settings.site_icon_url ? "Custom Favicon" : "Default"}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="site_icon_url"
                                    value={settings.site_icon_url}
                                    onChange={handleChange}
                                    placeholder="Enter favicon URL or select from media"
                                    className="flex-1 px-3 py-2 rounded-lg border border-zinc-300 text-xs outline-none focus:border-[#B8860B]"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPickerTarget('icon')}
                                    className="px-3 py-2 bg-zinc-900 hover:bg-black text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                    <Upload size={13} />
                                    <span>Upload / Pick</span>
                                </button>
                                {settings.site_icon_url && (
                                    <button
                                        type="button"
                                        onClick={() => setSettings(p => ({ ...p, site_icon_url: "" }))}
                                        className="p-2 text-zinc-400 hover:text-red-600 rounded-lg border border-zinc-200 hover:border-red-200 transition-colors"
                                        title="Reset to default favicon"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SECTION 2: GOOGLE GEMINI AI CHATBOT KEY ── */}
                <div className="border border-zinc-200/90 rounded-2xl p-5 bg-zinc-50/60 space-y-4">
                    <div className="border-b border-zinc-200 pb-3 flex items-center gap-2">
                        <Bot size={18} className="text-[#B8860B]" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                            Google Gemini AI Chatbot Settings
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-zinc-800 uppercase tracking-wider block">
                            Google Gemini API Key
                        </label>
                        <p className="text-[12px] text-zinc-500">
                            Powers the floating AI Fragrance Concierge on the bottom right of the website. Leave blank to use built-in smart assistant mode.
                        </p>
                        <input
                            type="password"
                            name="gemini_api_key"
                            value={settings.gemini_api_key}
                            onChange={handleChange}
                            placeholder="AIzaSy..."
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] outline-none text-sm font-mono"
                        />
                    </div>
                </div>

                {/* ── SECTION 3: CONTACT & PRE-ORDER TEMPLATE ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                            <Phone size={14} className="text-[#B8860B]" />
                            WhatsApp Number
                        </label>
                        <input
                            type="text"
                            name="whatsapp_number"
                            value={settings.whatsapp_number}
                            onChange={handleChange}
                            placeholder="e.g. 9584826112"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] outline-none text-sm"
                        />
                        <p className="text-[11px] text-zinc-400">Used for floating WhatsApp & pre-orders</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                            <Phone size={14} className="text-[#B8860B]" />
                            Display Phone Number
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={settings.phone}
                            onChange={handleChange}
                            placeholder="e.g. +91 9584826112"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] outline-none text-sm"
                        />
                        <p className="text-[11px] text-zinc-400">Shown in footer & contact pages</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[13px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                            <Mail size={14} className="text-[#B8860B]" />
                            Support Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={settings.email}
                            onChange={handleChange}
                            placeholder="e.g. care@mahirash.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[13px] font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare size={14} className="text-[#B8860B]" />
                        Pre-Order WhatsApp Message Template
                    </label>
                    <p className="text-[12px] text-zinc-500">
                        Use <b>{`{productName}`}</b>, <b>{`{productSize}`}</b>, and <b>{`{productPrice}`}</b> as placeholders which will be automatically replaced with product details.
                    </p>
                    <textarea
                        name="preorder_message"
                        value={settings.preorder_message}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Hi, I would like to pre-order {productName} ({productSize}) for ₹{productPrice}."
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-[#B8860B] focus:ring-1 focus:ring-[#B8860B] outline-none text-sm resize-none"
                    />
                </div>

                <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-4">
                    {success && <span className="text-emerald-600 text-sm font-semibold">✓ Settings updated!</span>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-7 py-3 bg-black hover:bg-[#B8860B] text-white font-bold uppercase tracking-widest text-[13px] rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 shadow-md"
                    >
                        {loading ? "Saving..." : <><Save size={16} /> Save All Settings</>}
                    </button>
                </div>
            </form>

            {/* Cloudinary Media Picker Modal */}
            {pickerTarget && (
                <CloudinaryMediaPickerModal
                    isOpen={Boolean(pickerTarget)}
                    onClose={() => setPickerTarget(null)}
                    onSelect={handleSelectMedia}
                    collectionName={pickerTarget === 'logo' ? 'branding_logo' : 'branding_icon'}
                />
            )}
        </div>
    );
};

export default SiteSettingsManager;
