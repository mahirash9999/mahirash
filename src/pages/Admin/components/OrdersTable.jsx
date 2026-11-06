import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../../../components/Firebase';
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import {
  Download, Truck, RefreshCw, Clock, CheckCircle2, XCircle, Search,
  HelpCircle, X, MapPin, Eye, Package, ShieldCheck, AlertCircle,
  RotateCcw, Sliders, ChevronRight, CheckSquare, Printer, ArrowRight,
  Send, ExternalLink, SlidersHorizontal, User, Phone, Mail, FileText
} from 'lucide-react';
import { exportToCSV } from '../../../utils/exportUtils';
import { motion, AnimatePresence } from 'framer-motion';

// Separate status badges formatting
const getStatusBadge = (type, val) => {
  const v = (val || "").toLowerCase();
  if (type === 'payment') {
    if (v === 'paid') return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (v === 'refunded') return 'bg-purple-50 text-purple-800 border-purple-300';
    if (v === 'failed') return 'bg-red-50 text-red-800 border-red-300';
    return 'bg-amber-50 text-amber-800 border-amber-300';
  }
  if (type === 'fulfilment') {
    if (v === 'fulfilled') return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (v === 'ready to ship' || v === 'packed') return 'bg-blue-50 text-blue-800 border-blue-300';
    if (v === 'picking') return 'bg-purple-50 text-purple-800 border-purple-300';
    return 'bg-zinc-100 text-zinc-700 border-zinc-300';
  }
  if (type === 'shipment') {
    if (v === 'delivered') return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (v.includes('transit') || v.includes('out for delivery')) return 'bg-sky-50 text-sky-800 border-sky-300';
    if (v.includes('picked up') || v.includes('awb')) return 'bg-indigo-50 text-indigo-800 border-indigo-300';
    if (v.includes('exception') || v.includes('rto')) return 'bg-red-50 text-red-800 border-red-300';
    if (v.includes('cancelled')) return 'bg-red-50 text-red-700 border-red-300';
    return 'bg-zinc-100 text-zinc-600 border-zinc-300';
  }
  return 'bg-zinc-100 text-zinc-700 border-zinc-300';
};

const OrdersTable = ({ onRefresh }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModalTab, setActiveModalTab] = useState("summary"); // summary, fulfilment, shipping, returns, audit
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);

  // Live tracking drawer state
  const [activeTrackingAwb, setActiveTrackingAwb] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Packing dimensions for selected order
  const [packageDimensions, setPackageDimensions] = useState({
    weight: 0.5,
    length: 12,
    breadth: 12,
    height: 8
  });
  const [checklist, setChecklist] = useState({
    inspected: true,
    sealed: true,
    invoiced: true
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "orders"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      });
      setOrders(list);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showFeedback = (msg, isErr = false) => {
    setActionFeedback({ msg, isErr });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  // Metrics Calculation
  const metrics = useMemo(() => {
    const total = orders.length;
    const toPack = orders.filter(o => {
      const f = (o.fulfilmentStatus || "unfulfilled").toLowerCase();
      const s = (o.status || "").toLowerCase();
      return f !== "packed" && f !== "ready to ship" && f !== "fulfilled" && s !== "delivered" && s !== "cancelled";
    }).length;
    const readyToShip = orders.filter(o => {
      const f = (o.fulfilmentStatus || "").toLowerCase();
      return f === "ready to ship" || f === "packed";
    }).length;
    const inTransit = orders.filter(o => {
      const s = (o.shipmentStatus || o.status || "").toLowerCase();
      return s.includes("transit") || s.includes("picked up") || s.includes("shipped");
    }).length;
    const delivered = orders.filter(o => {
      const s = (o.shipmentStatus || o.status || "").toLowerCase();
      return s === "delivered";
    }).length;
    const exceptions = orders.filter(o => {
      const s = (o.shipmentStatus || "").toLowerCase();
      return s.includes("exception") || s.includes("rto") || o.returnStatus === "Requested";
    }).length;

    return { total, toPack, readyToShip, inTransit, delivered, exceptions };
  }, [orders]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const orderStat = (order.orderStatus || order.status || "").toLowerCase();
      const fulfilStat = (order.fulfilmentStatus || "unfulfilled").toLowerCase();
      const shipStat = (order.shipmentStatus || "not created").toLowerCase();

      if (activeFilter === "new" && orderStat !== "placed" && orderStat !== "confirmed") return false;
      if (activeFilter === "topack" && (fulfilStat === "packed" || fulfilStat === "ready to ship" || fulfilStat === "fulfilled" || orderStat === "cancelled")) return false;
      if (activeFilter === "ready" && fulfilStat !== "ready to ship" && fulfilStat !== "packed") return false;
      if (activeFilter === "intransit" && !shipStat.includes("transit") && !shipStat.includes("picked up")) return false;
      if (activeFilter === "delivered" && shipStat !== "delivered" && orderStat !== "delivered") return false;
      if (activeFilter === "cancelled" && orderStat !== "cancelled" && shipStat !== "cancelled") return false;
      if (activeFilter === "exceptions" && !shipStat.includes("exception") && !shipStat.includes("rto") && order.returnStatus !== "Requested") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesId = order.id.toLowerCase().includes(q) || (order.orderNumber && order.orderNumber.toLowerCase().includes(q));
        const matchesCustomer = (order.shipping?.name || order.customerName || "").toLowerCase().includes(q);
        const matchesEmail = (order.userEmail || order.customerEmail || "").toLowerCase().includes(q);
        const matchesPhone = (order.shipping?.phone || order.customerPhone || "").toLowerCase().includes(q);
        const matchesAwb = (order.awbCode || "").toLowerCase().includes(q);
        if (!matchesId && !matchesCustomer && !matchesEmail && !matchesPhone && !matchesAwb) return false;
      }
      return true;
    });
  }, [orders, activeFilter, searchQuery]);

  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  // Operational Action Handlers
  const handleUpdateOrderStatus = async (statusType, newStatus, reason = "") => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          actor: "Admin (Portal)",
          reason: reason || `Updated ${statusType} to ${newStatus}`,
          [statusType]: newStatus
        })
      });

      if (!res.ok) {
        throw new Error("Failed to update status on server");
      }

      const updatedRecord = { ...selectedOrder, [statusType]: newStatus };
      if (statusType === "orderStatus") updatedRecord.status = newStatus.toLowerCase();
      setSelectedOrder(updatedRecord);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updatedRecord } : o));
      showFeedback(`Successfully updated ${statusType} to ${newStatus}`);
    } catch (err) {
      showFeedback("Error updating status: " + err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Delhivery One Logistics Actions ──
  const handleCreateDelhiveryShipment = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/delhivery/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          packageInfo: packageDimensions
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Delhivery shipment creation failed");
      }

      const updated = {
        ...selectedOrder,
        shipmentId: data.waybill || data.awbCode,
        awbCode: data.waybill || data.awbCode,
        trackingNumber: data.waybill || data.awbCode,
        courierName: "Delhivery Express",
        shippingCarrier: "Delhivery Express",
        trackingUrl: data.trackingUrl || `https://www.delhivery.com/track/package/${data.waybill || data.awbCode}`,
        shipmentStatus: "Shipment Created",
        internalStatus: "Dispatched",
        fulfilmentStatus: "Manifested"
      };
      setSelectedOrder(updated);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updated } : o));
      showFeedback(`Delhivery shipment manifested! AWB: ${data.waybill || data.awbCode}`);
    } catch (err) {
      showFeedback("Delhivery error: " + err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrintDelhiveryLabel = async () => {
    if (!selectedOrder) return;
    const awb = selectedOrder.awbCode || selectedOrder.trackingNumber;
    if (!awb) {
      showFeedback("Please create Delhivery shipment first to generate an AWB.", true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/delhivery/label?waybill=${encodeURIComponent(awb)}`);
      const data = await res.json();
      const targetUrl = data.downloadUrl || data.fallbackUrl || `https://track.delhivery.com/api/p/packing_slip?wbns=${encodeURIComponent(awb)}&pdf=true`;
      window.open(targetUrl, "_blank");
      showFeedback("Opened Delhivery shipping label packing slip.");
    } catch (err) {
      showFeedback("Could not open Delhivery label: " + err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestDelhiveryPickup = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/delhivery/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          expected_package_count: 1
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Pickup scheduling failed");

      const updated = {
        ...selectedOrder,
        pickupId: data.pickupId,
        shipmentStatus: "Pickup Scheduled"
      };
      setSelectedOrder(updated);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updated } : o));
      showFeedback(`Delhivery pickup scheduled! PUR ID: ${data.pickupId}`);
    } catch (err) {
      showFeedback("Pickup note: " + err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrackDelhiveryAWB = async (awbCode) => {
    const targetAwb = awbCode || selectedOrder?.awbCode || selectedOrder?.trackingNumber;
    if (!targetAwb) {
      showFeedback("No AWB available to track.", true);
      return;
    }

    setActiveTrackingAwb(targetAwb);
    setLoadingTracking(true);
    setTrackingError("");
    setTrackingData(null);

    try {
      const res = await fetch(`/api/delhivery/track?waybill=${encodeURIComponent(targetAwb)}&orderId=${selectedOrder?.id || ""}`);
      const data = await res.json();
      if (!data.success && data.error) throw new Error(data.error);
      setTrackingData(data);
      if (data.mappedStatus && selectedOrder) {
        setSelectedOrder(p => ({ ...p, shipmentStatus: data.mappedStatus }));
        setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, shipmentStatus: data.mappedStatus } : o));
      }
    } catch (err) {
      setTrackingError("Could not retrieve Delhivery tracking: " + err.message);
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleTrackAWB = handleTrackDelhiveryAWB;

  const handleCancelDelhiveryShipment = async () => {
    if (!selectedOrder) return;
    const awb = selectedOrder.awbCode || selectedOrder.trackingNumber;
    if (!awb) {
      showFeedback("No active Delhivery AWB to cancel.", true);
      return;
    }

    const confirmCancel = window.confirm(`Are you sure you want to cancel Delhivery AWB #${awb}?`);
    if (!confirmCancel) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/delhivery/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          waybill: awb,
          reason: "Cancelled by Administrator via Admin Portal"
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to cancel shipment");

      const updated = {
        ...selectedOrder,
        shipmentStatus: "Shipment Cancelled",
        internalStatus: "Cancelled"
      };
      setSelectedOrder(updated);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updated } : o));
      showFeedback(`Delhivery AWB #${awb} cancelled successfully.`);
    } catch (err) {
      showFeedback("Cancellation error: " + err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const processed = orders.map(o => ({
      orderId: o.id,
      date: o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : "",
      customer: o.shipping?.name || o.customerName || "",
      phone: o.shipping?.phone || o.customerPhone || "",
      email: o.userEmail || o.customerEmail || "",
      total: o.total || 0,
      paymentMethod: o.paymentMethod || "Prepaid",
      paymentStatus: o.paymentStatus || "Paid",
      fulfilmentStatus: o.fulfilmentStatus || "Unfulfilled",
      shipmentStatus: o.shipmentStatus || "Not Created",
      courier: o.courierName || "",
      awb: o.awbCode || "",
      itemsCount: o.items?.length || 1,
      city: o.shipping?.city || "",
      pincode: o.shipping?.pincode || ""
    }));

    const keys = ["orderId", "date", "customer", "phone", "email", "total", "paymentMethod", "paymentStatus", "fulfilmentStatus", "shipmentStatus", "courier", "awb", "itemsCount", "city", "pincode"];
    const headers = ["Order ID", "Date", "Customer Name", "Phone", "Email", "Total (INR)", "Payment Method", "Payment Status", "Fulfilment", "Shipment", "Courier", "AWB Code", "Items Count", "City", "PIN code"];
    exportToCSV(processed, keys, headers, "mahirash_orders_shipping");
  };

  return (
    <div className="space-y-6">

      {/* ─── 1. TOP METRICS STRIP: ORDERS & SHIPPING ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { id: "all", label: "All Orders", count: metrics.total, icon: Package },
          { id: "topack", label: "To Be Packed", count: metrics.toPack, icon: Clock },
          { id: "ready", label: "Ready to Ship", count: metrics.readyToShip, icon: CheckSquare },
          { id: "intransit", label: "In Transit", count: metrics.inTransit, icon: Truck },
          { id: "delivered", label: "Delivered", count: metrics.delivered, icon: CheckCircle2 },
          { id: "exceptions", label: "Exceptions / RTO", count: metrics.exceptions, icon: AlertCircle }
        ].map((m) => (
          <div
            key={m.id}
            onClick={() => { setActiveFilter(m.id); setCurrentPage(1); }}
            className={`p-3.5 bg-white border rounded-2xl cursor-pointer transition-all shadow-sm ${activeFilter === m.id
              ? "ring-2 ring-[#800020] bg-[#800020]/5 border-[#800020]"
              : "border-[#E9DCCB] hover:border-[#800020]/40"
              }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-[#75665D] uppercase tracking-wider">{m.label}</span>
              <m.icon size={13} className="text-[#800020]" />
            </div>
            <p className="text-xl font-bold font-serif text-[#30231F]">{m.count}</p>
          </div>
        ))}
      </div>

      {/* ─── 2. CONTROLS BAR: SEARCH, FILTERS & EXPORT ────────────────────── */}
      <div className="bg-white border border-[#E9DCCB] p-4 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-3 text-[#75665D]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search Order ID, Customer, Phone, AWB..."
            className="w-full pl-9 pr-3.5 py-2 bg-[#FCF9F4] border border-[#E9DCCB] text-xs text-[#30231F] rounded-xl focus:bg-white focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 outline-none transition-all placeholder:text-[#75665D]/60 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchOrders}
            className="p-2 border border-[#E9DCCB] hover:border-[#800020] rounded-xl text-[#75665D] hover:text-[#800020] transition-colors cursor-pointer"
            title="Refresh orders"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-[#E9DCCB] hover:border-[#800020] hover:bg-[#800020] hover:text-white text-xs font-semibold uppercase tracking-wider text-[#30231F] rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── 3. ORDERS LISTING TABLE ───────────────────────────────────────── */}
      <div className="bg-white border border-[#E9DCCB] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FCF9F4] text-[#75665D] uppercase tracking-wider font-semibold border-b border-[#E9DCCB]">
              <tr>
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Fulfilment</th>
                <th className="py-3.5 px-4">Shipment</th>
                <th className="py-3.5 px-4">Courier & AWB</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9DCCB]/60">
              {pagedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FCF9F4]/60 transition-colors">
                  {/* Order ID & Date */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-[#30231F] block hover:text-[#800020] cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      #{order.id.slice(0, 10).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#75665D] font-mono block mt-0.5">
                      {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString("en-IN") : "Recent"}
                    </span>
                  </td>

                  {/* Customer */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-zinc-900 block uppercase">
                      {order.shipping?.name || order.customerName || "Customer"}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono block">
                      {order.shipping?.phone || order.customerPhone || "No phone"}
                    </span>
                  </td>

                  {/* Items */}
                  <td className="py-3 px-4">
                    <span className="font-semibold text-zinc-800">
                      {order.items?.length || 1} item(s)
                    </span>
                    {order.items && order.items[0] && (
                      <span className="text-[10px] text-zinc-500 block truncate max-w-[120px]">
                        {order.items[0].name}
                      </span>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-zinc-900 block">
                      ₹{(order.total || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-zinc-400 uppercase font-mono block">
                      {order.paymentMethod || "Prepaid"}
                      {order.paymentId && order.paymentId !== "COD" ? ` • ${order.paymentId.slice(0, 12)}` : ""}
                    </span>
                  </td>

                  {/* Payment Status */}
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-xs ${getStatusBadge('payment', order.paymentStatus || 'Paid')}`}>
                      {order.paymentStatus || "Paid"}
                    </span>
                  </td>

                  {/* Fulfilment Status */}
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-xs ${getStatusBadge('fulfilment', order.fulfilmentStatus || 'Unfulfilled')}`}>
                      {order.fulfilmentStatus || "Unfulfilled"}
                    </span>
                  </td>

                  {/* Shipment Status */}
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border rounded-xs ${getStatusBadge('shipment', order.shipmentStatus || order.status || 'Not Created')}`}>
                      {order.shipmentStatus || order.status || "Not Created"}
                    </span>
                  </td>

                  {/* Courier & AWB */}
                  <td className="py-3 px-4">
                    {order.awbCode ? (
                      <div>
                        <span className="font-semibold text-zinc-900 block">{order.courierName || "Delhivery"}</span>
                        <span
                          onClick={() => handleTrackAWB(order.awbCode)}
                          className="font-mono text-[10px] text-indigo-700 hover:underline cursor-pointer block"
                        >
                          {order.awbCode}
                        </span>
                      </div>
                    ) : (
                      <span className="text-zinc-400 italic text-[11px]">Unassigned</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3 py-1.5 bg-[#800020] hover:bg-[#650018] text-white text-[11px] font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        Manage
                      </button>
                      {order.awbCode && (
                        <button
                          onClick={() => handleTrackAWB(order.awbCode)}
                          className="p-1.5 border border-[#E9DCCB] hover:border-[#800020] hover:text-[#800020] rounded-xl text-[#75665D] transition-colors cursor-pointer"
                          title="Track live"
                        >
                          <Truck size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {pagedOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#75665D] uppercase tracking-widest font-light">
                    No orders match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredOrders.length > itemsPerPage && (
          <div className="px-4 py-3 bg-[#FCF9F4] border-t border-[#E9DCCB] flex items-center justify-between text-xs">
            <span className="text-[#75665D]">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-[#E9DCCB] hover:border-[#800020] hover:text-[#800020] disabled:opacity-40 rounded-xl font-semibold uppercase tracking-wider cursor-pointer"
              >
                Prev
              </button>
              <button
                disabled={currentPage * itemsPerPage >= filteredOrders.length}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-[#E9DCCB] hover:border-[#800020] hover:text-[#800020] disabled:opacity-40 rounded-xl font-semibold uppercase tracking-wider cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. COMPLETE ORDER DETAILS & SHIPPING MANAGEMENT MODAL ────────── */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E9DCCB] max-w-4xl w-full max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl text-[#30231F] flex flex-col">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E9DCCB] flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <span className="text-[10px] text-[#800020] font-bold uppercase tracking-widest">
                  Order Management & Shipping Console
                </span>
                <h3 className="text-sm font-mono font-bold uppercase text-[#30231F] mt-0.5">
                  Order #{selectedOrder.id.toUpperCase()}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {actionFeedback && (
                  <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-xl ${actionFeedback.isErr ? "bg-red-50 text-red-700" : "bg-[#800020]/10 text-[#800020]"
                    }`}>
                    {actionFeedback.msg}
                  </span>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 hover:bg-[#FCF9F4] rounded-xl text-[#75665D] hover:text-[#800020] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-[#E9DCCB] bg-[#FCF9F4] flex gap-4 text-xs font-semibold uppercase tracking-wider">
              {[
                { id: "summary", label: "1. Order & Payment" },
                { id: "address", label: "2. Customer & Address" },
                { id: "fulfilment", label: "3. Packing & Fulfilment" },
                { id: "shipment", label: "4. Delhivery Logistics" },
                { id: "returns", label: "5. Returns & Refunds" },
                { id: "audit", label: "6. Activity Log" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveModalTab(tab.id)}
                  className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${activeModalTab === tab.id
                    ? "border-[#800020] text-[#800020] font-bold"
                    : "border-transparent text-[#75665D] hover:text-[#800020]"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs flex-1">

              {/* TAB 1: SUMMARY */}
              {activeModalTab === "summary" && (
                <div className="space-y-6">
                  {/* Status Strip & Dual Control Management */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl shadow-xs">
                    {/* 1. Internal Order Status */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-[#75665D] font-bold block">Internal Order Status</label>
                      <select
                        value={selectedOrder.orderStatus || selectedOrder.status || "Order Placed"}
                        onChange={(e) => handleUpdateOrderStatus("orderStatus", e.target.value)}
                        disabled={actionLoading}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E9DCCB] rounded-lg text-xs font-bold text-[#800020] uppercase outline-none focus:border-[#800020] cursor-pointer shadow-2xs"
                      >
                        <option value="Order Placed">Order Placed</option>
                        <option value="Payment Confirmed">Payment Confirmed</option>
                        <option value="Order Received">Order Received</option>
                        <option value="Processing">Processing</option>
                        <option value="Packing">Packing</option>
                        <option value="Ready to Dispatch">Ready to Dispatch</option>
                        <option value="Dispatched">Dispatched</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Return Requested">Return Requested</option>
                        <option value="Returned">Returned</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>

                    {/* 2. Logistics / Shipment Status */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-[#75665D] font-bold block">Logistics / Delhivery Status</label>
                      <select
                        value={selectedOrder.shipmentStatus || "Not Created"}
                        onChange={(e) => handleUpdateOrderStatus("shipmentStatus", e.target.value)}
                        disabled={actionLoading}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E9DCCB] rounded-lg text-xs font-bold text-[#30231F] uppercase outline-none focus:border-[#800020] cursor-pointer shadow-2xs"
                      >
                        <option value="Not Created">Not Created</option>
                        <option value="Shipment Created">Shipment Created</option>
                        <option value="Pickup Scheduled">Pickup Scheduled</option>
                        <option value="Picked Up">Picked Up</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Out for Delivery">Out for Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Delivery Attempted">Delivery Attempted</option>
                        <option value="Undelivered">Undelivered</option>
                        <option value="RTO Initiated">RTO Initiated</option>
                        <option value="RTO Delivered">RTO Delivered</option>
                        <option value="Shipment Cancelled">Shipment Cancelled</option>
                      </select>
                    </div>

                    {/* 3. Fulfilment Status */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-[#75665D] font-bold block">Fulfilment Workflow</label>
                      <select
                        value={selectedOrder.fulfilmentStatus || "Unfulfilled"}
                        onChange={(e) => handleUpdateOrderStatus("fulfilmentStatus", e.target.value)}
                        disabled={actionLoading}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E9DCCB] rounded-lg text-xs font-semibold text-[#30231F] uppercase outline-none focus:border-[#800020] cursor-pointer shadow-2xs"
                      >
                        <option value="Unfulfilled">Unfulfilled</option>
                        <option value="Processing">Processing</option>
                        <option value="Packed">Packed</option>
                        <option value="Ready to Ship">Ready to Ship</option>
                        <option value="Fulfilled">Fulfilled</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* 4. Payment Status */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-[#75665D] font-bold block">Payment Status</label>
                      <select
                        value={selectedOrder.paymentStatus || "Paid"}
                        onChange={(e) => handleUpdateOrderStatus("paymentStatus", e.target.value)}
                        disabled={actionLoading}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#E9DCCB] rounded-lg text-xs font-bold text-emerald-800 uppercase outline-none focus:border-[#800020] cursor-pointer shadow-2xs"
                      >
                        <option value="Paid">Paid (Verified)</option>
                        <option value="Pending">Pending</option>
                        <option value="Failed">Failed</option>
                        <option value="Refund Initiated">Refund Initiated</option>
                        <option value="Refunded">Refunded</option>
                      </select>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">Formulations Ordered</span>
                    <div className="border border-zinc-200 divide-y divide-zinc-200">
                      {(selectedOrder.items || []).map((it, idx) => (
                        <div key={idx} className="p-3 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-zinc-900 block">{it.name}</span>
                            <span className="text-[11px] text-zinc-500 font-mono">
                              SKU: {it.sku || "MHR-PARFUM"} · Qty: {it.quantity || it.units || 1}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-zinc-900">
                            ₹{((it.price || 0) * (it.quantity || it.units || 1)).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-1 text-right">
                      <div className="flex justify-between text-zinc-500">
                        <span>Subtotal:</span>
                        <span className="font-mono">₹{(selectedOrder.subtotal || selectedOrder.total || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>Air Shipping:</span>
                        <span className="text-emerald-700 font-bold">COMPLIMENTARY</span>
                      </div>
                      {selectedOrder.discount ? (
                        <div className="flex justify-between text-zinc-500">
                          <span>Discount:</span>
                          <span className="text-[#b8860b] font-mono">-₹{selectedOrder.discount.toLocaleString()}</span>
                        </div>
                      ) : null}
                      <div className="flex justify-between text-sm font-bold text-zinc-950 pt-2 border-t border-zinc-200">
                        <span>Total Paid:</span>
                        <span className="font-mono">₹{(selectedOrder.total || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CUSTOMER & ADDRESS */}
              {activeModalTab === "address" && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">Customer Information</span>
                      <p className="font-semibold text-zinc-900 uppercase">{selectedOrder.shipping?.name || selectedOrder.customerName || "Customer"}</p>
                      <p className="text-zinc-600 font-mono flex items-center gap-1.5"><Mail size={12} /> {selectedOrder.userEmail || selectedOrder.customerEmail || "No email"}</p>
                      <p className="text-zinc-600 font-mono flex items-center gap-1.5"><Phone size={12} /> {selectedOrder.shipping?.phone || selectedOrder.customerPhone || "No phone"}</p>
                    </div>

                    <div className="space-y-3 p-4 bg-zinc-50 border border-zinc-200 rounded-xs">
                      <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">Shipping Destination</span>
                      <p className="text-zinc-800 leading-relaxed font-medium">
                        {selectedOrder.shipping?.address || selectedOrder.shippingAddress?.address || "Delivery Address"}
                      </p>
                      <p className="text-zinc-600">
                        {selectedOrder.shipping?.city || "Indore"}, {selectedOrder.shipping?.state || "Madhya Pradesh"} - <span className="font-mono font-bold">{selectedOrder.shipping?.pincode || "452001"}</span>
                      </p>
                      <span className="inline-block px-2 py-0.5 bg-zinc-200 text-zinc-800 text-[10px] font-bold uppercase rounded-xs">
                        {selectedOrder.shipping?.type || "Home"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PACKING & FULFILMENT */}
              {activeModalTab === "fulfilment" && (
                <div className="space-y-6">
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xs space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">Warehouse Packing Checklist</span>
                    <div className="space-y-2">
                      {[
                        { key: "inspected", label: "Artisanal perfume bottle seal & batch number verified" },
                        { key: "sealed", label: "Bubble-wrap cushioning & luxury box intact" },
                        { key: "invoiced", label: "Official GST tax invoice & brand letter enclosed" }
                      ].map((chk) => (
                        <label key={chk.key} className="flex items-center gap-2 cursor-pointer text-zinc-700">
                          <input
                            type="checkbox"
                            checked={checklist[chk.key]}
                            onChange={(e) => setChecklist(p => ({ ...p, [chk.key]: e.target.checked }))}
                            className="rounded text-[#b8860b] focus:ring-0 w-4 h-4 cursor-pointer"
                          />
                          <span>{chk.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Parcel Dimensions */}
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xs space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">Package Weight & Dimensions</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Weight (KG)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={packageDimensions.weight}
                          onChange={(e) => setPackageDimensions(p => ({ ...p, weight: Number(e.target.value) }))}
                          className="w-full px-3 py-1.5 bg-white border border-zinc-200 font-mono text-xs text-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Length (CM)</label>
                        <input
                          type="number"
                          value={packageDimensions.length}
                          onChange={(e) => setPackageDimensions(p => ({ ...p, length: Number(e.target.value) }))}
                          className="w-full px-3 py-1.5 bg-white border border-zinc-200 font-mono text-xs text-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Breadth (CM)</label>
                        <input
                          type="number"
                          value={packageDimensions.breadth}
                          onChange={(e) => setPackageDimensions(p => ({ ...p, breadth: Number(e.target.value) }))}
                          className="w-full px-3 py-1.5 bg-white border border-zinc-200 font-mono text-xs text-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Height (CM)</label>
                        <input
                          type="number"
                          value={packageDimensions.height}
                          onChange={(e) => setPackageDimensions(p => ({ ...p, height: Number(e.target.value) }))}
                          className="w-full px-3 py-1.5 bg-white border border-zinc-200 font-mono text-xs text-zinc-900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => handleUpdateOrderStatus("fulfilmentStatus", "Packed")}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-black hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      Mark as Packed
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus("fulfilmentStatus", "Ready to Ship")}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-black hover:bg-black hover:text-white text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
                    >
                      Mark as Ready to Ship
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: DELHIVERY LOGISTICS */}
              {activeModalTab === "shipment" && (
                <div className="space-y-6">
                  {/* Current Shipping State */}
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl grid md:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Delhivery Waybill / AWB</span>
                      <span className="font-mono font-bold text-[#800020] text-sm mt-0.5 block">
                        {selectedOrder.awbCode || selectedOrder.trackingNumber || "Pending Generation"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Courier Partner</span>
                      <span className="font-semibold text-zinc-900 text-xs mt-0.5 block">
                        {selectedOrder.courierName || "Delhivery Express"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Shipment Status</span>
                      <span className="font-bold text-indigo-700 text-xs mt-0.5 block uppercase">
                        {selectedOrder.shipmentStatus || "Not Created"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Pickup Facility</span>
                      <span className="font-semibold text-zinc-800 text-xs mt-0.5 block">
                        Indore Central Hub (452001)
                      </span>
                    </div>
                  </div>

                  {/* Operational Step Buttons */}
                  <div className="p-5 border border-zinc-200 bg-[#FCF9F4] rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#800020] block">
                        Official Delhivery Express B2C Actions
                      </span>
                      {selectedOrder.awbCode && (
                        <a
                          href={`https://www.delhivery.com/track/package/${selectedOrder.awbCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[#800020] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <ExternalLink size={12} />
                          <span>Track on Delhivery.com</span>
                        </a>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Step 1: Create Delhivery Shipment */}
                      <button
                        type="button"
                        onClick={handleCreateDelhiveryShipment}
                        disabled={actionLoading || Boolean(selectedOrder.awbCode)}
                        className={`p-3.5 bg-white border rounded-xl text-left transition-all ${
                          selectedOrder.awbCode
                            ? "border-emerald-200 bg-emerald-50/50 opacity-80 cursor-default"
                            : "border-[#E9DCCB] hover:border-[#800020] shadow-xs cursor-pointer hover:bg-white"
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase text-[#800020] block">Step 1</span>
                        <span className="font-bold text-zinc-900 block mt-0.5">
                          {selectedOrder.awbCode ? "✓ Manifested" : "Create Delhivery Shipment"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">Generate official AWB</span>
                      </button>

                      {/* Step 2: Download / Print Shipping Label */}
                      <button
                        type="button"
                        onClick={handlePrintDelhiveryLabel}
                        disabled={actionLoading || !selectedOrder.awbCode}
                        className="p-3.5 bg-white border border-[#E9DCCB] hover:border-[#800020] rounded-xl text-left transition-all disabled:opacity-40 shadow-xs cursor-pointer hover:bg-white"
                      >
                        <span className="text-[10px] font-bold uppercase text-[#800020] block">Step 2</span>
                        <span className="font-bold text-zinc-900 block mt-0.5 flex items-center gap-1">
                          <Printer size={13} /> Packing Slip / Label
                        </span>
                        <span className="text-[10px] text-zinc-500 block">Print barcoded sticker</span>
                      </button>

                      {/* Step 3: Request Pickup */}
                      <button
                        type="button"
                        onClick={handleRequestDelhiveryPickup}
                        disabled={actionLoading || !selectedOrder.awbCode || selectedOrder.shipmentStatus === "Pickup Scheduled"}
                        className="p-3.5 bg-white border border-[#E9DCCB] hover:border-[#800020] rounded-xl text-left transition-all disabled:opacity-40 shadow-xs cursor-pointer hover:bg-white"
                      >
                        <span className="text-[10px] font-bold uppercase text-[#800020] block">Step 3</span>
                        <span className="font-bold text-zinc-900 block mt-0.5">
                          {selectedOrder.shipmentStatus === "Pickup Scheduled" ? "✓ Pickup Requested" : "Request Pickup"}
                        </span>
                        <span className="text-[10px] text-zinc-500 block">Notify Indore warehouse</span>
                      </button>

                      {/* Step 4: Live Sync Tracking */}
                      <button
                        type="button"
                        onClick={() => handleTrackDelhiveryAWB(selectedOrder.awbCode || selectedOrder.id)}
                        disabled={actionLoading || !selectedOrder.awbCode}
                        className="p-3.5 bg-white border border-[#E9DCCB] hover:border-[#800020] rounded-xl text-left transition-all disabled:opacity-40 shadow-xs cursor-pointer hover:bg-white"
                      >
                        <span className="text-[10px] font-bold uppercase text-[#800020] block">Step 4</span>
                        <span className="font-bold text-zinc-900 block mt-0.5 flex items-center gap-1">
                          <RefreshCw size={13} /> Live Tracking
                        </span>
                        <span className="text-[10px] text-zinc-500 block">Query Delhivery scans</span>
                      </button>
                    </div>

                    {/* Cancel Shipment Option */}
                    {selectedOrder.awbCode && selectedOrder.shipmentStatus !== "Shipment Cancelled" && (
                      <div className="pt-3 border-t border-[#E9DCCB]/60 flex items-center justify-between">
                        <span className="text-[11px] text-[#75665D]">Need to cancel this courier consignment?</span>
                        <button
                          type="button"
                          onClick={handleCancelDelhiveryShipment}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg font-semibold transition-colors cursor-pointer"
                        >
                          Cancel Delhivery AWB
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 5: RETURNS & REFUNDS */}
              {activeModalTab === "returns" && (
                <div className="space-y-6">
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xs space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">Return & Refund Management</span>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Return Status</span>
                        <select
                          value={selectedOrder.returnStatus || "Not Requested"}
                          onChange={(e) => handleUpdateOrderStatus("returnStatus", e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 font-semibold text-xs text-zinc-900 outline-none"
                        >
                          <option value="Not Requested">Not Requested</option>
                          <option value="Requested">Requested by Customer</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Pickup Scheduled">Reverse Pickup Scheduled</option>
                          <option value="Received">Received at Hub</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1">Payment Refund Status</span>
                        <select
                          value={selectedOrder.paymentStatus || "Paid"}
                          onChange={(e) => {
                            const reason = prompt("Enter verified refund transaction reference:");
                            if (reason !== null) {
                              handleUpdateOrderStatus("paymentStatus", e.target.value, `Refund ref: ${reason}`);
                            }
                          }}
                          className="w-full px-3 py-2 bg-white border border-zinc-200 font-semibold text-xs text-zinc-900 outline-none"
                        >
                          <option value="Paid">Paid</option>
                          <option value="Refund Initiated">Refund Initiated</option>
                          <option value="Refunded">Refunded (Verified)</option>
                          <option value="Refund Failed">Refund Failed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: ACTIVITY LOG */}
              {activeModalTab === "audit" && (
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">
                    Operational Audit Trail & State History
                  </span>
                  {selectedOrder.activityLog && selectedOrder.activityLog.length > 0 ? (
                    <div className="border border-zinc-200 divide-y divide-zinc-200">
                      {selectedOrder.activityLog.map((log, idx) => (
                        <div key={idx} className="p-3 bg-zinc-50/50 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-zinc-900">{log.actor || "Admin"}</span>
                            <span className="text-[10px] font-mono text-zinc-400">{log.timestamp}</span>
                          </div>
                          <p className="text-zinc-600 font-mono text-[11px]">{log.reason || log.action || log.details}</p>
                          {log.changes && (
                            <ul className="list-disc list-inside text-[10px] text-zinc-500 pl-2">
                              {log.changes.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No operational modifications recorded yet.</p>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ─── 5. LIVE TRACKING DRAWER ───────────────────────────────────────── */}
      <AnimatePresence>
        {activeTrackingAwb && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTrackingAwb(null)}
              className="absolute inset-0 bg-black"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col"
            >
              <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#800020] font-bold uppercase tracking-widest">Delhivery Express Live Tracking</span>
                  <h3 className="text-xs font-bold text-zinc-900 font-mono mt-0.5">AWB: {activeTrackingAwb}</h3>
                </div>
                <button
                  onClick={() => setActiveTrackingAwb(null)}
                  className="p-1 text-zinc-400 hover:text-black rounded"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {loadingTracking ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <RefreshCw size={24} className="animate-spin text-[#800020]" />
                    <p className="text-xs text-[#75665D] uppercase tracking-widest font-light">Querying Delhivery Express scans...</p>
                  </div>
                ) : trackingError ? (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-xs p-4 text-xs space-y-1">
                    <p className="font-semibold">{trackingError}</p>
                  </div>
                ) : trackingData ? (
                  <div className="space-y-6 text-xs">
                    <div className="bg-[#FAF9F6] border border-zinc-200 p-4 rounded-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 uppercase font-bold">Status</span>
                        <span className="text-emerald-800 bg-emerald-50 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                          {trackingData.currentStatus}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-zinc-200 grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase block font-semibold">Courier</span>
                          <span className="font-bold text-zinc-900">{trackingData.provider || "Delhivery"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 uppercase block font-semibold">Estimated Delivery</span>
                          <span className="font-bold text-zinc-900">{trackingData.estimatedDelivery}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[11px] uppercase tracking-wider font-bold text-zinc-700 pb-1 border-b border-zinc-200">
                        Scan Activity Checkpoints
                      </h4>
                      <div className="relative border-l border-zinc-200 ml-2 pl-4 space-y-4 py-2">
                        {(trackingData.scans || []).map((scan, idx) => (
                          <div key={idx} className="relative">
                            <span className={`absolute -left-[21px] top-1 w-2 h-2 rounded-full border-2 ${idx === 0 ? "bg-black border-black ring-4 ring-zinc-100" : "bg-white border-zinc-300"
                              }`} />
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-mono text-zinc-400 block">{scan.date}</span>
                              <p className="font-semibold text-zinc-900">{scan.activity}</p>
                              {scan.location && <p className="text-[11px] text-zinc-500 font-mono">Location: {scan.location}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default OrdersTable;
