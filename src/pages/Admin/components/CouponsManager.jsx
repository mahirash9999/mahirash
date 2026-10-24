import React, { useState, useEffect } from "react";
import { db } from "../../../components/Firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { Plus, Edit2, Trash2, X, Percent, Check, Tag } from "lucide-react";
import OptimizedCloudinaryImage from "../../../components/OptimizedCloudinaryImage";

const CouponsManager = () => {
    const [coupons, setCoupons] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState(null);
    const [productSearch, setProductSearch] = useState("");

    const [formData, setFormData] = useState({
        code: "",
        discount_type: "Percentage",
        discount_val: 10,
        min_order: 999,
        applicableProducts: [], // Array of product IDs
        is_active: true
    });

    const fetchCouponsAndProducts = async () => {
        setLoading(true);
        try {
            // Fetch coupons
            const cSnap = await getDocs(collection(db, "coupons"));
            const cList = cSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCoupons(cList);

            // Fetch products
            const pSnap = await getDocs(collection(db, "products"));
            const pList = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setProducts(pList);
        } catch (err) {
            console.error("Error fetching coupons/products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCouponsAndProducts();
    }, []);

    const handleCreateNew = () => {
        setEditingCoupon(null);
        setFormData({
            code: "",
            discount_type: "Percentage",
            discount_val: 10,
            min_order: 999,
            applicableProducts: [],
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleEdit = (coupon) => {
        setEditingCoupon(coupon);
        setFormData({
            code: coupon.code || "",
            discount_type: coupon.discount_type || "Percentage",
            discount_val: Number(coupon.discount_val) || 0,
            min_order: Number(coupon.min_order) || 0,
            applicableProducts: coupon.applicableProducts || [],
            is_active: coupon.is_active !== false
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await deleteDoc(doc(db, "coupons", id));
            alert("Coupon deleted successfully!");
            fetchCouponsAndProducts();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const toggleProductSelection = (productId) => {
        setFormData(prev => {
            const selected = prev.applicableProducts.includes(productId)
                ? prev.applicableProducts.filter(id => id !== productId)
                : [...prev.applicableProducts, productId];
            return { ...prev, applicableProducts: selected };
        });
    };

    const selectAllProducts = () => {
        setFormData(prev => ({
            ...prev,
            applicableProducts: products.map(p => p.id)
        }));
    };

    const clearAllProductSelections = () => {
        setFormData(prev => ({
            ...prev,
            applicableProducts: []
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.code.trim()) {
            alert("Please enter a coupon code");
            return;
        }
        const cleanCode = formData.code.toUpperCase().trim();
        try {
            const docData = {
                ...formData,
                code: cleanCode,
                discount_val: Number(formData.discount_val),
                min_order: Number(formData.min_order)
            };

            if (editingCoupon) {
                await setDoc(doc(db, "coupons", editingCoupon.id), docData);
                alert("Coupon updated successfully!");
            } else {
                await setDoc(doc(db, "coupons", cleanCode), docData);
                alert("Coupon created successfully!");
            }
            setIsModalOpen(false);
            fetchCouponsAndProducts();
        } catch (err) {
            alert("Error saving coupon: " + err.message);
        }
    };

    const filteredProductsForSelect = products.filter(p =>
        p.name?.toLowerCase().includes(productSearch.toLowerCase())
    );

    return (
        <div className="bg-white border border-[#E9DCCB] rounded-2xl p-4 sm:p-6 text-[#30231F] shadow-sm font-['Inter',sans-serif]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-[#30231F] uppercase tracking-wider">Coupons & Offers</h2>
                    <p className="text-[12px] sm:text-[13px] text-[#75665D] mt-1">Manage brand discount campaigns and select eligible products</p>
                </div>
                <button
                    type="button"
                    onClick={handleCreateNew}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#800020] text-white text-[13px] font-bold uppercase tracking-wider rounded-xl hover:bg-[#650018] transition-all shadow-md shadow-[#800020]/25 cursor-pointer active:scale-95"
                >
                    <Plus size={14} /> Add New Coupon
                </button>
            </div>

            {loading ? (
                <div className="py-8 text-center text-[#75665D] text-[14px]">Loading campaigns...</div>
            ) : (
                <div className="overflow-x-auto scrollbar-thin">
                    <table className="w-full min-w-[720px] text-left text-[13px] border-collapse">
                        <thead>
                            <tr className="border-b border-[#E9DCCB] text-[#75665D] uppercase tracking-widest text-[12px] bg-[#FCF9F4]">
                                <th className="py-3.5 px-4">Coupon Code</th>
                                <th className="py-3.5 px-4">Type</th>
                                <th className="py-3.5 px-4">Discount</th>
                                <th className="py-3.5 px-4">Min. Order</th>
                                <th className="py-3.5 px-4">Applicable Products</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {coupons.map((coupon) => (
                                <tr key={coupon.id} className="border-b border-[#E9DCCB]/60 hover:bg-[#FCF9F4]/60 transition-colors">
                                    <td className="py-3.5 px-4 font-bold text-[#30231F]">
                                        <span className="inline-flex items-center bg-[#800020]/10 text-[#800020] text-[12px] px-2.5 py-0.5 rounded-md tracking-wider border border-[#800020]/20 font-mono font-bold">
                                            {coupon.code}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-[#75665D] font-medium">{coupon.discount_type}</td>
                                    <td className="py-3.5 px-4 font-bold text-[#30231F]">
                                        {coupon.discount_type === "Percentage"
                                            ? `${coupon.discount_val}% OFF`
                                            : `₹${Number(coupon.discount_val).toLocaleString("en-IN")} OFF`}
                                    </td>
                                    <td className="py-3.5 px-4 text-[#75665D]">
                                        ₹{Number(coupon.min_order).toLocaleString("en-IN")}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        {coupon.applicableProducts && coupon.applicableProducts.length > 0 ? (
                                            <span className="text-[12px] bg-[#FCF9F4] text-[#30231F] px-2 py-0.5 rounded border border-[#E9DCCB] font-semibold">
                                                {coupon.applicableProducts.length === products.length
                                                    ? "All Products"
                                                    : `${coupon.applicableProducts.length} Selected`}
                                            </span>
                                        ) : (
                                            <span className="text-[12px] bg-[#800020]/10 text-[#800020] px-2 py-0.5 rounded border border-[#800020]/20 font-semibold">
                                                All Products
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3.5 px-4">
                                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${coupon.is_active ? 'bg-[#800020]/10 text-[#800020] border border-[#800020]/20' : 'bg-stone-100 text-[#75665D] border border-[#E9DCCB]'}`}>
                                            {coupon.is_active ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(coupon)}
                                                className="p-1.5 text-[#75665D] hover:text-[#800020] hover:bg-[#800020]/10 rounded-lg transition-colors cursor-pointer"
                                                title="Edit Coupon"
                                            >
                                                <Edit2 size={13} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(coupon.id)}
                                                className="p-1.5 text-[#75665D] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                title="Delete Coupon"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {coupons.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-[#75665D]">No coupons active. Click Add New Coupon to create one.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4">
                    <form onSubmit={handleSubmit} className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                                {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create Brand Coupon / Offer"}
                            </h3>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-black p-1.5 rounded-full hover:bg-zinc-100 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="overflow-y-auto flex-1 pr-1">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Info Column */}
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider block">Coupon Code *</label>
                                        <input
                                            type="text"
                                            required
                                            disabled={!!editingCoupon}
                                            value={formData.code}
                                            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                            placeholder="e.g. FESTIVE20"
                                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 focus:bg-white focus:border-black outline-none transition-all placeholder:text-zinc-400 disabled:opacity-60"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider block">Discount Type</label>
                                        <select
                                            value={formData.discount_type}
                                            onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value }))}
                                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 focus:bg-white focus:border-black outline-none transition-all"
                                        >
                                            <option value="Percentage">Percentage (%)</option>
                                            <option value="Fixed">Fixed Amount (₹)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider block">
                                            {formData.discount_type === "Percentage" ? "Discount Percentage (%)" : "Discount Value (₹)"}
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.discount_val}
                                            onChange={(e) => setFormData(prev => ({ ...prev, discount_val: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 focus:bg-white focus:border-black outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider block">Minimum Order Amount (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.min_order}
                                            onChange={(e) => setFormData(prev => ({ ...prev, min_order: Number(e.target.value) }))}
                                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 focus:bg-white focus:border-black outline-none transition-all"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider block">Status</label>
                                        <select
                                            value={formData.is_active ? "true" : "false"}
                                            onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === "true" }))}
                                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-lg text-[14px] text-zinc-900 focus:bg-white focus:border-black outline-none transition-all"
                                        >
                                            <option value="true">Active</option>
                                            <option value="false">Inactive</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Products selection Column */}
                                <div className="flex flex-col border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50 p-3 h-[360px]">
                                    <div className="pb-2 border-b border-zinc-200">
                                        <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider block mb-1.5">Applicable Products</label>
                                        <div className="flex justify-between items-center gap-2 mb-2">
                                            <button
                                                type="button"
                                                onClick={selectAllProducts}
                                                className="text-[12px] font-bold text-zinc-900 hover:text-black uppercase tracking-wider border border-zinc-300 bg-white px-2 py-1 rounded"
                                            >
                                                Select All
                                            </button>
                                            <button
                                                type="button"
                                                onClick={clearAllProductSelections}
                                                className="text-[12px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wider border border-zinc-300 bg-white px-2 py-1 rounded"
                                            >
                                                Clear/All Products
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search products..."
                                            value={productSearch}
                                            onChange={(e) => setProductSearch(e.target.value)}
                                            className="w-full px-3 py-1.5 bg-white border border-zinc-300 rounded text-[14px] text-zinc-950 focus:border-black outline-none"
                                        />
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-1.5 mt-2 pr-1">
                                        {filteredProductsForSelect.map(p => {
                                            const isSelected = formData.applicableProducts.includes(p.id);
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => toggleProductSelection(p.id)}
                                                    className={`flex items-center gap-2.5 p-2 rounded-lg cursor-pointer border transition-all ${isSelected
                                                        ? "bg-[#b8860b]/5 border-[#b8860b]/30"
                                                        : "bg-white border-zinc-200 hover:bg-zinc-100"
                                                        }`}
                                                >
                                                    <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isSelected ? "border-[#b8860b] bg-[#b8860b] text-white" : "border-zinc-300 bg-white"}`}>
                                                        {isSelected && <Check size={10} strokeWidth={3} />}
                                                    </div>
                                                    {p.image && (
                                                        <OptimizedCloudinaryImage
                                                            src={p.image}
                                                            preset="avatar"
                                                            className="w-7 h-7 object-cover rounded bg-zinc-100 shrink-0"
                                                            alt=""
                                                        />
                                                    )}
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[14px] font-semibold text-zinc-900 truncate leading-snug">{p.name}</p>
                                                        <p className="text-[12px] text-zinc-500 font-mono">₹{p.price}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {filteredProductsForSelect.length === 0 && (
                                            <p className="text-center text-[14px] text-zinc-400 py-6">No products found matching query.</p>
                                        )}
                                    </div>
                                    <div className="pt-2 border-t border-zinc-200 mt-2 text-[12px] text-zinc-500">
                                        {formData.applicableProducts.length > 0 ? (
                                            <span>Selected {formData.applicableProducts.length} of {products.length} products.</span>
                                        ) : (
                                            <span>Applies to <strong>All Products</strong> in store.</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-3.5 mt-2 border-t border-[#E9DCCB] flex items-center justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border border-[#E9DCCB] text-[#75665D] text-[13px] font-semibold rounded-xl hover:bg-[#FCF9F4] cursor-pointer transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-5 py-2 bg-[#800020] text-white text-[13px] font-bold rounded-xl hover:bg-[#650018] shadow-md shadow-[#800020]/25 cursor-pointer transition-all active:scale-98"
                            >
                                {editingCoupon ? "Save Changes" : "Create Coupon"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default CouponsManager;
