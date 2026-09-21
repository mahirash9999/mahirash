import React, { useState, useEffect } from 'react';
import { db } from '../../../components/Firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save, Image as ImageIcon, Phone } from 'lucide-react';
import { motion } from 'framer-motion';

const PromoPopupManager = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState({
        isActive: true,
        desktop_image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1786029696/yastxilcsghbsdmkcp2x.jpg',
        tablet_image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1786029696/yastxilcsghbsdmkcp2x.jpg',
        mobile_image: 'https://res.cloudinary.com/dcjn4y284/image/upload/v1786029696/yastxilcsghbsdmkcp2x.jpg',
        whatsapp_number: '',
        title: 'Mahirash Sale is LIVE ✨',
        subtitle: 'Your favourite luxury extraits just dropped.',
        highlight_text: 'Log in and claim your discount 💖',
    });

    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchPromoConfig = async () => {
            try {
                const snap = await getDoc(doc(db, "settings", "promo_popup"));
                if (snap.exists()) {
                    setData(prev => ({ ...prev, ...snap.data() }));
                }
            } catch (err) {
                console.error("Error fetching promo setup:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchPromoConfig();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });
        try {
            await setDoc(doc(db, "settings", "promo_popup"), data, { merge: true });
            setMessage({ type: 'success', text: 'Promo popup settings updated successfully!' });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-zinc-500">Loading Configuration...</div>;
    }

    return (
        <section className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden font-sans">
            <div className="px-6 py-5 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 border-l-4 border-black pl-3 uppercase tracking-widest font-serif">
                        Promo Popup Configuration
                    </h2>
                    <p className="text-[14px] text-zinc-500 mt-1 pl-4">
                        Manage the welcome screen promotional modal content & lead captures.
                    </p>
                </div>
            </div>

            <div className="p-6">
                {message.text && (
                    <div className={`mb-6 p-4 rounded-xl text-sm font-semibold border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
                    <div className="flex items-center gap-3 bg-zinc-100 p-4 rounded-xl border border-zinc-200">
                        <input
                            type="checkbox"
                            id="isActive"
                            name="isActive"
                            checked={data.isActive}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-zinc-300 text-black focus:ring-black cursor-pointer accent-black"
                        />
                        <label htmlFor="isActive" className="text-zinc-900 font-bold cursor-pointer">
                            Enable Promo Modal on Website Loading
                        </label>
                    </div>

                    <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200">
                        <h3 className="font-bold text-zinc-800 uppercase tracking-wider text-[12px] mb-4 flex items-center gap-2">
                            <ImageIcon size={14} /> Banner Creatives
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold text-zinc-600 block">Desktop Graphic URL</label>
                                <input
                                    type="url"
                                    name="desktop_image"
                                    value={data.desktop_image}
                                    onChange={handleChange}
                                    className="w-full border border-zinc-300 rounded px-3 py-2 text-[14px] focus:outline-black"
                                    placeholder="https://..."
                                />
                                {data.desktop_image && <img src={data.desktop_image} alt="" className="w-full h-32 object-cover border rounded" />}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold text-zinc-600 block">Tablet Graphic URL</label>
                                <input
                                    type="url"
                                    name="tablet_image"
                                    value={data.tablet_image}
                                    onChange={handleChange}
                                    className="w-full border border-zinc-300 rounded px-3 py-2 text-[14px] focus:outline-black"
                                    placeholder="https://..."
                                />
                                {data.tablet_image && <img src={data.tablet_image} alt="" className="w-full h-32 object-contain border rounded" />}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[12px] font-semibold text-zinc-600 block">Mobile Graphic URL</label>
                                <input
                                    type="url"
                                    name="mobile_image"
                                    value={data.mobile_image}
                                    onChange={handleChange}
                                    className="w-full border border-zinc-300 rounded px-3 py-2 text-[14px] focus:outline-black"
                                    placeholder="https://..."
                                />
                                {data.mobile_image && <img src={data.mobile_image} alt="" className="w-full h-32 object-contain border rounded" />}
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 space-y-4">
                        <h3 className="font-bold text-zinc-800 uppercase tracking-wider text-[12px] mb-2 flex items-center gap-2">
                            <Phone size={14} /> Lead Capture & WhatsApp
                        </h3>
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-zinc-600 block">WhatsApp Forward Number</label>
                            <input
                                type="text"
                                name="whatsapp_number"
                                value={data.whatsapp_number}
                                onChange={handleChange}
                                className="w-full md:w-1/2 border border-zinc-300 rounded px-3 py-2 text-[14px] focus:outline-black"
                                placeholder="e.g. 919876543210 (Country code without +)"
                            />
                            <p className="text-[11px] text-zinc-500">Filled forms will be forwarded directly to this WhatsApp contact if provided.</p>
                        </div>
                    </div>

                    <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[12px] font-semibold text-zinc-600 block">Offer Title</label>
                            <input
                                type="text"
                                name="title"
                                value={data.title}
                                onChange={handleChange}
                                className="w-full border border-zinc-300 rounded px-3 py-2 text-[14px] font-bold focus:outline-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-zinc-600 block">Offer Subtitle</label>
                            <textarea
                                name="subtitle"
                                rows={2}
                                value={data.subtitle}
                                onChange={handleChange}
                                className="w-full border border-zinc-300 rounded px-3 py-2 text-[14px] focus:outline-black"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-semibold text-zinc-600 block">Highlight Text (Login CTA)</label>
                            <textarea
                                name="highlight_text"
                                rows={2}
                                value={data.highlight_text}
                                onChange={handleChange}
                                className="w-full border border-zinc-300 rounded px-3 py-2 text-[14px] focus:outline-black"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white font-semibold uppercase tracking-wider text-[14px] rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
};

export default PromoPopupManager;
