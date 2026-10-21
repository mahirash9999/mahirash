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

  // Shiprocket Actions
  const handleCreateShipment = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/shipping/create-shipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          orderDate: selectedOrder.createdAt?.toDate
            ? selectedOrder.createdAt.toDate().toISOString().replace('T', ' ').substring(0, 16)
            : new Date().toISOString().replace('T', ' ').substring(0, 16),
          customerName: selectedOrder.shipping?.name || selectedOrder.customerName || "Customer",
          email: selectedOrder.userEmail || selectedOrder.customerEmail || "care@mahirash.com",
          phone: selectedOrder.shipping?.phone || selectedOrder.customerPhone || "9876543210",
          address: selectedOrder.shipping?.address || "Delivery Address",
          city: selectedOrder.shipping?.city || "Indore",
          state: selectedOrder.shipping?.state || "Madhya Pradesh",
          pincode: selectedOrder.shipping?.pincode || "452001",
          paymentMethod: selectedOrder.paymentMethod === "COD" ? "COD" : "Prepaid",
          totalAmount: selectedOrder.total || 0,
          items: selectedOrder.items || [],
          packageInfo: packageDimensions
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Shipment creation failed");
      }

      const updated = {
        ...selectedOrder,
        shipmentId: data.shipmentId,
        awbCode: data.awbCode || selectedOrder.awbCode,
        courierName: data.courierName || "Delhivery",
        shipmentStatus: data.awbCode ? "AWB Generated" : "Shipment Created",
        fulfilmentStatus: "Ready to Ship"
      };
      setSelectedOrder(updated);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updated } : o));
      showFeedback(`Shiprocket order created! Shipment ID: ${data.shipmentId}`);
    } catch (err) {
      showFeedback("Error creating Shiprocket shipment: " + err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignCourierAWB = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/shipping/assign-courier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          shipmentId: selectedOrder.shipmentId
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Courier assignment failed");

      const updated = {
        ...selectedOrder,
        awbCode: data.awbCode,
        courierName: data.courierName || selectedOrder.courierName || "Delhivery",
        shipmentStatus: "AWB Generated",
        fulfilmentStatus: "Ready to Ship"
      };
      setSelectedOrder(updated);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updated } : o));
      showFeedback(`Assigned Courier! AWB: ${data.awbCode}`);
    } catch (err) {
      showFeedback("Failed to assign courier: " + err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestPickup = async () => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/shipping/request-pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          shipmentId: selectedOrder.shipmentId
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Pickup request failed");

      const updated = {
        ...selectedOrder,
        shipmentStatus: "Pickup Scheduled",
        fulfilmentStatus: "Ready to Ship"
      };
      setSelectedOrder(updated);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, ...updated } : o));
      showFeedback("Courier pickup scheduled successfully!");
    } catch (err) {
      showFeedback("Failed to schedule pickup: " + err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrackAWB = async (awbCode) => {
    setActiveTrackingAwb(awbCode);
    setLoadingTracking(true);
    setTrackingError("");
    setTrackingData(null);

    try {
      const res = await fetch(`/api/shipping/track?awb=${encodeURIComponent(awbCode)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTrackingData(data);
    } catch (err) {
      setTrackingError("Could not retrieve tracking details: " + err.message);
    } finally {
      setLoadingTracking(false);
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
          { id: "all", label: "All Orders", count: metrics.total, icon: Package, color: "text-zinc-900", border: "border-zinc-200" },
          { id: "topack", label: "To Be Packed", count: metrics.toPack, icon: Clock, color: "text-amber-700", border: "border-amber-200 bg-amber-50/40" },
          { id: "ready", label: "Ready to Ship", count: metrics.readyToShip, icon: CheckSquare, color: "text-blue-700", border: "border-blue-200 bg-blue-50/40" },
          { id: "intransit", label: "In Transit", count: metrics.inTransit, icon: Truck, color: "text-indigo-700", border: "border-indigo-200 bg-indigo-50/40" },
          { id: "delivered", label: "Delivered", count: metrics.delivered, icon: CheckCircle2, color: "text-emerald-700", border: "border-emerald-200 bg-emerald-50/40" },
          { id: "exceptions", label: "Exceptions / RTO", count: metrics.exceptions, icon: AlertCircle, color: "text-red-700", border: "border-red-200 bg-red-50/40" }
        ].map((m) => (
          <div
            key={m.id}
            onClick={() => { setActiveFilter(m.id); setCurrentPage(1); }}
            className={`p-3.5 bg-white border ${m.border} rounded-xs cursor-pointer hover:border-black transition-all shadow-xs ${
              activeFilter === m.id ? "ring-2 ring-black" : ""
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{m.label}</span>
              <m.icon size={13} className={m.color} />
            </div>
            <p className={`text-xl font-bold font-mono ${m.color}`}>{m.count}</p>
          </div>
        ))}
      </div>

      {/* ─── 2. CONTROLS BAR: SEARCH, FILTERS & EXPORT ────────────────────── */}
      <div className="bg-white border border-zinc-200 p-4 rounded-xs shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search size={14} className="absolute left-3.5 top-3 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Search Order ID, Customer, Phone, AWB..."
            className="w-full pl-9 pr-3.5 py-2 bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 focus:bg-white focus:border-black outline-none transition-all placeholder:text-zinc-400 font-sans"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchOrders}
            className="p-2 border border-zinc-200 hover:border-black rounded-xs text-zinc-600 hover:text-black transition-colors"
            title="Refresh orders"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-zinc-200 hover:border-black text-xs font-semibold uppercase tracking-wider text-zinc-800 transition-all flex items-center gap-1.5"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ─── 3. ORDERS LISTING TABLE ───────────────────────────────────────── */}
      <div className="bg-white border border-zinc-200 rounded-xs shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf8f5] text-zinc-600 uppercase tracking-wider font-semibold border-b border-zinc-200">
              <tr>
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Fulfilment</th>
                <th className="py-3 px-4">Shipment</th>
                <th className="py-3 px-4">Courier & AWB</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {pagedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/80 transition-colors">
                  {/* Order ID & Date */}
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-zinc-900 block hover:text-[#b8860b] cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      #{order.id.slice(0, 10).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
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
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-2.5 py-1.5 bg-black hover:bg-zinc-800 text-white text-[11px] font-semibold uppercase tracking-wider rounded-xs transition-colors"
                      >
                        Manage
                      </button>
                      {order.awbCode && (
                        <button
                          onClick={() => handleTrackAWB(order.awbCode)}
                          className="p-1.5 border border-zinc-300 hover:border-black rounded-xs text-zinc-600 hover:text-black transition-colors"
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
                  <td colSpan={9} className="py-12 text-center text-zinc-400 uppercase tracking-widest font-light">
                    No orders match your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredOrders.length > itemsPerPage && (
          <div className="px-4 py-3 bg-[#faf8f5] border-t border-zinc-200 flex items-center justify-between text-xs">
            <span className="text-zinc-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-zinc-200 hover:border-black disabled:opacity-40 rounded-xs font-semibold uppercase tracking-wider"
              >
                Prev
              </button>
              <button
                disabled={currentPage * itemsPerPage >= filteredOrders.length}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-zinc-200 hover:border-black disabled:opacity-40 rounded-xs font-semibold uppercase tracking-wider"
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
          <div className="bg-white border border-zinc-200 max-w-4xl w-full max-h-[92vh] overflow-y-auto rounded-xs shadow-2xl text-zinc-900 flex flex-col">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between sticky top-0 bg-white z-20">
              <div>
                <span className="text-[10px] text-[#b8860b] font-bold uppercase tracking-widest">
                  Order Management & Shipping Console
                </span>
                <h3 className="text-sm font-mono font-bold uppercase text-zinc-950 mt-0.5">
                  Order #{selectedOrder.id.toUpperCase()}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {actionFeedback && (
                  <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-xs ${
                    actionFeedback.isErr ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"
                  }`}>
                    {actionFeedback.msg}
                  </span>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 hover:bg-zinc-100 rounded text-zinc-500 hover:text-black"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-zinc-200 bg-[#faf8f5] flex gap-4 text-xs font-semibold uppercase tracking-wider">
              {[
                { id: "summary", label: "1. Order & Payment" },
                { id: "address", label: "2. Customer & Address" },
                { id: "fulfilment", label: "3. Packing & Fulfilment" },
                { id: "shipment", label: "4. Shiprocket Shipping" },
                { id: "returns", label: "5. Returns & Refunds" },
                { id: "audit", label: "6. Activity Log" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveModalTab(tab.id)}
                  className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
                    activeModalTab === tab.id
                      ? "border-black text-black font-bold"
                      : "border-transparent text-zinc-500 hover:text-black"
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
                  {/* Status strip */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-zinc-50 border border-zinc-200 rounded-xs">
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">Order Status</span>
                      <span className="font-bold text-zinc-900 uppercase">{selectedOrder.orderStatus || selectedOrder.status || "Placed"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">Fulfilment</span>
                      <span className="font-bold text-zinc-900 uppercase">{selectedOrder.fulfilmentStatus || "Unfulfilled"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">Shipment Status</span>
                      <span className="font-bold text-zinc-900 uppercase">{selectedOrder.shipmentStatus || "Not Created"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">Payment</span>
                      <span className="font-bold text-emerald-800 uppercase">{selectedOrder.paymentStatus || "Paid"}</span>
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

              {/* TAB 4: SHIPROCKET SHIPPING */}
              {activeModalTab === "shipment" && (
                <div className="space-y-6">
                  {/* Current Shipping State */}
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xs grid md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Shiprocket Shipment ID</span>
                      <span className="font-mono font-bold text-zinc-900 text-xs mt-0.5 block">
                        {selectedOrder.shipmentId || "Not Created"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">Courier Partner</span>
                      <span className="font-semibold text-zinc-900 text-xs mt-0.5 block">
                        {selectedOrder.courierName || "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 block">AWB Tracking Code</span>
                      <span className="font-mono font-bold text-indigo-700 text-xs mt-0.5 block">
                        {selectedOrder.awbCode || "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Operational Step Buttons */}
                  <div className="p-5 border border-zinc-200 bg-[#faf8f5] rounded-xs space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-800 block">
                      Automated Shiprocket Logistics Workflow
                    </span>

                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Step 1: Create Shipment */}
                      <button
                        onClick={handleCreateShipment}
                        disabled={actionLoading || Boolean(selectedOrder.shipmentId)}
                        className="p-3 bg-white border border-zinc-200 hover:border-black rounded-xs text-left transition-all disabled:opacity-40"
                      >
                        <span className="text-[10px] font-bold uppercase text-[#b8860b] block">Step 1</span>
                        <span className="font-bold text-zinc-900 block mt-0.5">Push Order</span>
                        <span className="text-[10px] text-zinc-500 block">Create adhoc shipment</span>
                      </button>

                      {/* Step 2: Assign Courier / AWB */}
                      <button
                        onClick={handleAssignCourierAWB}
                        disabled={actionLoading || !selectedOrder.shipmentId || Boolean(selectedOrder.awbCode)}
                        className="p-3 bg-white border border-zinc-200 hover:border-black rounded-xs text-left transition-all disabled:opacity-40"
                      >
                        <span className="text-[10px] font-bold uppercase text-[#b8860b] block">Step 2</span>
                        <span className="font-bold text-zinc-900 block mt-0.5">Generate AWB</span>
                        <span className="text-[10px] text-zinc-500 block">Assign courier partner</span>
                      </button>

                      {/* Step 3: Schedule Pickup */}
                      <button
                        onClick={handleRequestPickup}
                        disabled={actionLoading || !selectedOrder.awbCode || selectedOrder.shipmentStatus === "Pickup Scheduled"}
                        className="p-3 bg-white border border-zinc-200 hover:border-black rounded-xs text-left transition-all disabled:opacity-40"
                      >
                        <span className="text-[10px] font-bold uppercase text-[#b8860b] block">Step 3</span>
                        <span className="font-bold text-zinc-900 block mt-0.5">Request Pickup</span>
                        <span className="text-[10px] text-zinc-500 block">Courier pickup handover</span>
                      </button>

                      {/* Step 4: Sync Tracking */}
                      <button
                        onClick={() => handleTrackAWB(selectedOrder.awbCode || selectedOrder.id)}
                        disabled={actionLoading}
                        className="p-3 bg-white border border-zinc-200 hover:border-black rounded-xs text-left transition-all disabled:opacity-40"
                      >
                        <span className="text-[10px] font-bold uppercase text-[#b8860b] block">Step 4</span>
                        <span className="font-bold text-zinc-900 block mt-0.5">Live Tracking</span>
                        <span className="text-[10px] text-zinc-500 block">Query Shiprocket scans</span>
                      </button>
                    </div>
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
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Shiprocket Live Info</span>
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
                    <RefreshCw size={24} className="animate-spin text-zinc-800" />
                    <p className="text-xs text-zinc-500 uppercase tracking-widest font-light">Querying Shiprocket logs...</p>
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
                            <span className={`absolute -left-[21px] top-1 w-2 h-2 rounded-full border-2 ${
                              idx === 0 ? "bg-black border-black ring-4 ring-zinc-100" : "bg-white border-zinc-300"
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
