import React, { useState, useEffect } from "react";
import { db } from "../../../components/Firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save, Phone, Mail, MessageSquare } from "lucide-react";

const SiteSettingsManager = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [settings, setSettings] = useState({
        whatsapp_number: "",
        phone: "",
        email: "",
        preorder_message: ""
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const d = await getDoc(doc(db, "settings", "global"));
                if (d.exists()) {
                    setSettings({
                        whatsapp_number: d.data().whatsapp_number || "",
                        phone: d.data().phone || "",
                        email: d.data().email || "",
                        preorder_message: d.data().preorder_message || ""
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

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccess(false);
        try {
            await setDoc(doc(db, "settings", "global"), settings, { merge: true });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Error saving settings:", err);
            alert("Failed to save settings: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-200">
                <h2 className="text-xl font-bold font-['Clash_Display'] uppercase tracking-wider text-black">
                    Global Site Settings
                </h2>
                <p className="text-zinc-500 text-sm mt-1">
                    Configure common phone numbers, emails, and templates used across the website.
                </p>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[14px] font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-2">
                            <Phone size={14} className="text-[#c9a962]" />
                            WhatsApp Number
                        </label>
                        <input
                            type="text"
                            name="whatsapp_number"
                            value={settings.whatsapp_number}
                            onChange={handleChange}
                            placeholder="e.g. 9584826112"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none text-sm"
                        />
                        <p className="text-[11px] text-zinc-400">Used for pre-order WhatsApp links</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[14px] font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-2">
                            <Phone size={14} className="text-[#c9a962]" />
                            Display Phone Number
                        </label>
                        <input
                            type="text"
                            name="phone"
                            value={settings.phone}
                            onChange={handleChange}
                            placeholder="e.g. +91 9584826112"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none text-sm"
                        />
                        <p className="text-[11px] text-zinc-400">Shown in footer & contact pages</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[14px] font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-2">
                            <Mail size={14} className="text-[#c9a962]" />
                            Support Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={settings.email}
                            onChange={handleChange}
                            placeholder="e.g. care@mahirash.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none text-sm"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[14px] font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare size={14} className="text-[#c9a962]" />
                        Pre-Order WhatsApp Message Template
                    </label>
                    <p className="text-[11px] text-zinc-500">
                        Use <b>{`{productName}`}</b>, <b>{`{productSize}`}</b>, and <b>{`{productPrice}`}</b> as placeholders which will be automatically replaced with product details when the customer clicks the pre-order button.
                    </p>
                    <textarea
                        name="preorder_message"
                        value={settings.preorder_message}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Hi, I would like to pre-order {productName} ({productSize}) for ₹{productPrice}."
                        className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 focus:border-[#c9a962] focus:ring-1 focus:ring-[#c9a962] outline-none text-sm resize-none"
                    />
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-4">
                    {success && <span className="text-emerald-600 text-sm font-semibold">Saved successfully!</span>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white font-bold uppercase tracking-widest text-[14px] rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : <><Save size={16} /> Save Settings</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SiteSettingsManager;
