import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Search, Truck, MapPin, Calendar, ArrowRight,
    CheckCircle2, Package, Clock, ShieldCheck, ChevronRight,
    AlertCircle, ArrowLeft, RefreshCw, BarChart2
} from "lucide-react";
import SEOHead from "../components/SEOHead";
import PageHeader from "../components/Home/PageHeader";
import { db } from "../components/Firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useAuth } from "../components/useAuth";

const TrackOrder = () => {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [trackingKey, setTrackingKey] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [orderData, setOrderData] = useState(null); // Firebase order record if searched by OrderId
    const [trackingData, setTrackingData] = useState(null); // Shiprocket live info
    const [recentOrders, setRecentOrders] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);

    // AWB parameter from URL (e.g. /track?awb=AWB-123 or /track?orderId=XYZ)
    const urlAwb = searchParams.get("awb");
    const urlOrderId = searchParams.get("orderId");

    useEffect(() => {
        // If we have logged in user, fetch recent orders for convenience
        if (user) {
            const fetchRecent = async () => {
                try {
                    setLoadingRecent(true);
                    const q = query(collection(db, "orders"), where("userId", "==", user.uid));
                    const snap = await getDocs(q);
                    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    // sort by date desc
                    list.sort((a, b) => {
                        const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                        const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                        return tB - tA;
                    });
                    setRecentOrders(list.slice(0, 4));
                } catch (e) {
                    console.error("Error fetching user recent orders:", e);
                } finally {
                    setLoadingRecent(false);
                }
            };
            fetchRecent();
        }
    }, [user]);

    useEffect(() => {
        if (urlAwb) {
            setTrackingKey(urlAwb);
            handleTrack(urlAwb, "awb");
        } else if (urlOrderId) {
            setTrackingKey(urlOrderId);
            handleTrack(urlOrderId, "orderId");
        }
    }, [urlAwb, urlOrderId]);

    const handleTrackSubmit = (e) => {
        e.preventDefault();
        if (!trackingKey.trim()) return;

        // Guess type: Firebase IDs are usually long hashes. 
        // AWBs are usually capital mixed string structures like AWB_ or numbers.
        const cleanKey = trackingKey.trim();
        if (cleanKey.length > 15 && !cleanKey.startsWith("AWB_") && !cleanKey.startsWith("SIM_")) {
            setSearchParams({ orderId: cleanKey });
        } else {
            setSearchParams({ awb: cleanKey });
        }
    };

    const handleTrack = async (key, forcedType = null) => {
        setLoading(true);
        setError("");
        setTrackingData(null);
        setOrderData(null);

        const cleanKey = key.trim();
        let type = forcedType;
        if (!type) {
            type = (cleanKey.length > 15 && !cleanKey.startsWith("AWB_") && !cleanKey.startsWith("SIM_"))
                ? "orderId"
                : "awb";
        }

        try {
            if (type === "orderId") {
                // Query firebase order
                const docRef = doc(db, "orders", cleanKey);
                const docSnap = await getDoc(docRef);

                if (!docSnap.exists()) {
                    setError("No order found with code #" + cleanKey + ". Please check details.");
                    setLoading(false);
                    return;
                }

                const order = { id: docSnap.id, ...docSnap.data() };
                setOrderData(order);

                // If the order has an AWB tracking code, grab it!
                if (order.awbCode) {
                    await fetchShiprocketTracking(order.awbCode);
                } else {
                    // Handled: confirmed, but not shipped
                    const displayStatus = order.fulfillmentStatus || (order.status === "confirmed" ? "Under Packaging" : "Order Recieved");

                    let activityLabel = "Order received in our system. Processing payment clearance.";
                    if (order.fulfillmentStatus && order.fulfillmentStatus !== "Unfulfilled") {
                        activityLabel = `Order status updated to: ${order.fulfillmentStatus}. Pending carrier handover.`;
                    } else if (order.status === "confirmed") {
                        activityLabel = "Order details verified. Your package is currently being tailored & packed.";
                    }

                    setTrackingData({
                        currentStatus: displayStatus,
                        provider: "Pending Handover",
                        estimatedDelivery: "Will be updated",
                        scans: [
                            {
                                date: order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString("en-IN") : "Just now",
                                activity: activityLabel,
                                location: "Mahirash Atelier",
                                status: order.fulfillmentStatus || "Pending Handover"
                            }
                        ]
                    });
                }
            } else {
                // Direct AWB search
                await fetchShiprocketTracking(cleanKey);
            }
        } catch (err) {
            console.error(err);
            setError("Unable to retrieve tracking logs at this time. Verify values or try later.");
        } finally {
            setLoading(false);
        }
    };

    const fetchShiprocketTracking = async (awbCode) => {
        const res = await fetch(`/api/track?awb=${encodeURIComponent(awbCode)}`);
        if (!res.ok) {
            throw new Error("Shiprocket fetch error");
        }
        const data = await res.json();
        if (data.error) {
            throw new Error(data.error);
        }
        setTrackingData(data);
    };

    // Status mapping to color code
    const getStatusColor = (status = "") => {
        const s = status.toLowerCase();
        if (s.includes("deliver")) return "text-emerald-700 bg-emerald-50 border-emerald-200";
        if (s.includes("transit") || s.includes("ship")) return "text-blue-700 bg-blue-50 border-blue-200";
        if (s.includes("pick") || s.includes("out")) return "text-purple-700 bg-purple-50 border-purple-200";
        return "text-zinc-700 bg-zinc-55 border-zinc-200";
    };

    return (
        <div className="min-h-screen bg-[#faf9f6] text-zinc-900 font-sans">
            <SEOHead
                title="Track Live Order | Mahirash Parfumerie"
                description="Verify and track your shipment details with real-time Shiprocket updates."
                url="https://mahirash.com/track"
            />
            <PageHeader
                title="Shipment Tracking"
                subtitle="Access real-time dynamic logistics feedback on your Mahirash luxury purchases"
                breadcrumbItems={[{ label: "Home", path: "/" }, { label: "Track Order" }]}
            />

            <div className="max-w-6xl mx-auto px-4 md:px-10 py-12 md:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Tracking Input Column */}
                    <div className="lg:col-span-4 space-y-8">
                        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-950 font-serif mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2">
                                <Search size={15} /> Input Details
                            </h2>
                            <form onSubmit={handleTrackSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                                        Order Reference or AWB Track Code
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={trackingKey}
                                            onChange={(e) => setTrackingKey(e.target.value)}
                                            placeholder="e.g. #PSJ-10293 or AWB..."
                                            className="w-full bg-zinc-50 border border-zinc-300 rounded-lg pl-3 pr-10 py-2.5 text-[14px] font-mono text-zinc-900 outline-none focus:border-zinc-800 focus:bg-white transition-all placeholder:text-zinc-400 placeholder:font-sans uppercase"
                                        />
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-zinc-900 hover:bg-black text-white rounded-md transition-colors"
                                        >
                                            {loading ? (
                                                <RefreshCw size={12} className="animate-spin" />
                                            ) : (
                                                <ArrowRight size={12} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading || !trackingKey.trim()}
                                    className="w-full py-2.5 bg-black hover:bg-zinc-800 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                                >
                                    Retrieve Updates
                                </button>
                            </form>
                        </div>

                        {/* User's recent orders option */}
                        {user && (
                            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
                                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-zinc-950 font-serif mb-4 pb-2 border-b border-zinc-100 flex items-center gap-2">
                                    <Package size={15} /> Your Orders
                                </h2>
                                {loadingRecent ? (
                                    <div className="flex justify-center py-4">
                                        <RefreshCw size={16} className="animate-spin text-zinc-400" />
                                    </div>
                                ) : recentOrders.length === 0 ? (
                                    <p className="text-[14px] text-zinc-400 font-light text-center py-4">
                                        No orders linked to this account yet.
                                    </p>
                                ) : (
                                    <div className="space-y-3.5">
                                        {recentOrders.map(order => (
                                            <button
                                                key={order.id}
                                                onClick={() => {
                                                    setTrackingKey(order.id);
                                                    setSearchParams({ orderId: order.id });
                                                }}
                                                className="w-full text-left p-3 rounded-lg border border-zinc-105 hover:bg-zinc-50 transition-all font-mono text-[14px] flex items-center justify-between group"
                                            >
                                                <div>
                                                    <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-zinc-800 group-hover:text-black">
                                                        #{order.id.slice(0, 11).toUpperCase()}
                                                    </p>
                                                    <p className="text-[10px] text-zinc-400 mt-0.5 font-sans font-light">
                                                        {order.createdAt?.toDate
                                                            ? order.createdAt.toDate().toLocaleDateString("en-IN", { day: '2-digit', month: 'short' })
                                                            : "Recent"}
                                                        {" • ₹"}{order.total?.toLocaleString("en-IN")}
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className="text-zinc-300 group-hover:translate-x-0.5 transition-transform" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Results Column */}
                    <div className="lg:col-span-8">
                        <AnimatePresence mode="wait">
                            {loading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white border border-zinc-200 rounded-xl p-16 text-center shadow-sm flex flex-col items-center justify-center space-y-4"
                                >
                                    <RefreshCw size={36} className="animate-spin text-zinc-900" />
                                    <p className="text-sm font-light text-zinc-400 uppercase tracking-widest">
                                        Retrieving Live Shiprocket Checkpoints…
                                    </p>
                                </motion.div>
                            )}

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-red-50 border border-red-200 rounded-xl p-8 text-center text-red-800 space-y-3"
                                >
                                    <AlertCircle size={28} className="mx-auto text-red-650" />
                                    <p className="text-sm font-bold">{error}</p>
                                </motion.div>
                            )}

                            {!loading && !error && !trackingData && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="bg-white border border-zinc-200 rounded-xl p-12 md:p-20 text-center shadow-sm space-y-6"
                                >
                                    <div className="w-16 h-16 rounded-full border border-zinc-100 bg-zinc-50 flex items-center justify-center mx-auto">
                                        <Truck size={24} className="text-zinc-400" />
                                    </div>
                                    <div className="max-w-md mx-auto space-y-2">
                                        <h3 className="text-lg font-light uppercase tracking-widest font-serif text-zinc-950">
                                            Looking For Your Courier?
                                        </h3>
                                        <p className="text-zinc-500 font-light text-[14px] leading-relaxed">
                                            Enter your order reference code or the AWB tracking key in the form, or select an item from your profile list to check dynamic logistics history.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            {!loading && !error && trackingData && (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Live Status Overview */}
                                    <div className="bg-white border border-zinc-200 rounded-xl p-6 md:p-8 shadow-sm text-left">
                                        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-zinc-150">
                                            <div>
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b8860b]">
                                                    Tracking Number : {trackingData.awb || trackingKey}
                                                </span>
                                                <h2 className="text-xl font-light uppercase tracking-wider font-serif text-zinc-950 mt-1">
                                                    Carrier status: {trackingData.currentStatus}
                                                </h2>
                                            </div>
                                            <span className={`px-4 py-1.5 text-[9px] font-extrabold uppercase tracking-widest border rounded-full ${getStatusColor(trackingData.currentStatus)}`}>
                                                {trackingData.currentStatus}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-[14px] text-left">
                                            {orderData && (
                                                <div>
                                                    <span className="text-zinc-400 uppercase tracking-widest text-[9px] block">Customer Name</span>
                                                    <span className="text-zinc-900 font-bold block mt-1 font-serif text-sm">{orderData.shipping?.name}</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-zinc-400 uppercase tracking-widest text-[9px] block">Courier Partner</span>
                                                <span className="text-zinc-900 font-bold block mt-1 text-sm">{trackingData.provider || "Delhivery"}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-400 uppercase tracking-widest text-[9px] block">Est. Delivery</span>
                                                <span className="text-zinc-900 font-bold block mt-1 text-sm text-emerald-700">
                                                    {trackingData.estimatedDelivery}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Scans Timeline */}
                                    <div className="bg-white border border-zinc-200 rounded-xl p-6 md:p-8 shadow-sm">
                                        <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-zinc-900 font-sans pb-4 border-b border-zinc-100 text-left">
                                            Shipment Scan Checkpoints
                                        </h3>
                                        <div className="relative border-l border-zinc-200 ml-3 md:ml-6 pl-6 md:pl-10 space-y-8 pt-6 pb-2 text-left">
                                            {trackingData.scans && trackingData.scans.length > 0 ? (
                                                trackingData.scans.map((scan, idx) => (
                                                    <div key={idx} className="relative group">
                                                        {/* Point Dot */}
                                                        <span className={`absolute -left-[31px] md:-left-[47px] top-1 w-3 h-3 rounded-full border-2 ${idx === 0 ? "bg-black border-black ring-4 ring-zinc-100" : "bg-white border-zinc-300Group-hover:border-black"} transition-all`} />

                                                        <div className="space-y-1">
                                                            <span className="text-[10px] font-mono text-zinc-400 block">
                                                                {scan.date}
                                                            </span>
                                                            <h4 className="text-[14px] font-bold text-zinc-900 group-hover:text-black transition-colors uppercase tracking-wide">
                                                                {scan.activity}
                                                            </h4>
                                                            {scan.location && (
                                                                <p className="text-[11px] text-zinc-500 font-light flex items-center gap-1">
                                                                    <MapPin size={11} className="text-zinc-400" />
                                                                    {scan.location}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="relative group">
                                                    <span className="absolute -left-[30px] md:-left-[46px] top-1 w-3 h-3 rounded-full border-2 bg-black border-black" />
                                                    <div className="space-y-1">
                                                        <span className="text-[10px] font-mono text-zinc-400 block">Just Now</span>
                                                        <h4 className="text-[14px] font-bold text-zinc-900">Carrier Information Requested</h4>
                                                        <p className="text-[11px] text-zinc-500 font-light">
                                                            Shipping label printed successfully. We are coordinating carrier pickup handoff.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Items Preview (if fetched from orderId) */}
                                    {orderData && (
                                        <div className="bg-white border border-zinc-200 rounded-xl p-6 md:p-8 shadow-sm text-left">
                                            <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-zinc-900 font-sans pb-4 border-b border-zinc-100 mb-4">
                                                Items Under This Order
                                            </h3>
                                            <div className="divide-y divide-zinc-100">
                                                {orderData.items?.map((item, idx) => (
                                                    <div key={idx} className="py-2.5 flex items-center justify-between gap-4 text-[14px]">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-zinc-50 border border-zinc-200 rounded-lg overflow-hidden shrink-0">
                                                                <img
                                                                    src={item.image}
                                                                    alt={item.name}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-zinc-900 font-serif text-sm">{item.name}</p>
                                                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                                                    {item.size ? `Size: ${item.size}` : ""} • Qty: {item.quantity || 1}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className="font-semibold text-zinc-800">
                                                            ₹{((Number(item.price) || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TrackOrder;
