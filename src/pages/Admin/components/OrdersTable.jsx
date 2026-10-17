import React, { useEffect, useState } from 'react';
import { db } from '../../../components/Firebase';
import { collection, query, orderBy, limit, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Download, Truck, RefreshCw, Clock, CheckCircle2, XCircle, Search, HelpCircle, X, MapPin } from 'lucide-react';
import { exportToCSV } from '../../../utils/exportUtils';
import { motion, AnimatePresence } from 'framer-motion';

const statusBadgeClasses = (status) => {
  const s = (status || "").toLowerCase();
  switch (s) {
    case "delivered":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "failed":
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-100";
    case "dispatched":
    case "shipped":
      return "bg-blue-50 text-blue-700 border-blue-100";
    case "packing":
    case "packed":
    case "connecting with delivery partner":
      return "bg-purple-50 text-purple-700 border-purple-100";
    case "confirmed":
      return "bg-amber-50 text-amber-700 border-amber-100";
    default:
      return "bg-zinc-50 text-zinc-700 border-zinc-100";
  }
};

const ORDER_STATUSES = [
  "confirmed",
  "packing",
  "packed",
  "connecting with delivery partner",
  "dispatched",
  "delivered",
  "cancelled",
  "failed"
];

const OrdersTable = ({ onRefresh }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Live tracking drawer state
  const [activeTrackingAwb, setActiveTrackingAwb] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingError, setTrackingError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [syncingOrderId, setSyncingOrderId] = useState(null);

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

  const handleExportOrders = () => {
    const keys = ['id', 'userEmail', 'total', 'paymentMethod', 'status', 'awbCode', 'courierName', 'shipping.name', 'shipping.phone', 'shipping.address', 'shipping.city', 'shipping.state', 'shipping.pincode'];
    const headers = ['Order ID', 'Customer Email', 'Total Amount (INR)', 'Payment Method', 'Status', 'AWB Code', 'Courier Partner', 'Shipping Name', 'Shipping Phone', 'Shipping Address', 'Shipping City', 'Shipping State', 'Shipping Pincode'];
    exportToCSV(orders, keys, headers, 'mahirash_orders');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredOrders.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredOrders.map(o => o.id));
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected orders?`)) return;
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "orders", id));
      }
      alert("Selected orders deleted!");
      setSelectedIds([]);
      fetchOrders();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Bulk delete failed: " + err.message);
      setLoading(false);
    }
  };

  const handleBulkStatusChange = async (status) => {
    if (!window.confirm(`Are you sure you want to change status to ${status} for ${selectedIds.length} selected orders?`)) return;
    try {
      setLoading(true);
      for (const id of selectedIds) {
        await updateDoc(doc(db, "orders", id), {
          status: status
        });
      }
      alert(`Updated status to ${status} for ${selectedIds.length} orders!`);
      setSelectedIds([]);
      fetchOrders();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Bulk status change failed: " + err.message);
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      fetchOrders();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Status change failed: " + err.message);
      setLoading(false);
    }
  };

  // Sync with Shiprocket manually

  const handleSyncShiprocket = async (order) => {
    const confirm = window.confirm(`Generate Shiprocket Shipment for Order #${order.id.slice(0, 6).toUpperCase()}?`);
    if (!confirm) return;

    setSyncingOrderId(order.id);
    try {
      const res = await fetch("/api/shiprocket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          orderId: order.id,
          orderDate: order.createdAt?.toDate
            ? order.createdAt.toDate().toISOString().replace('T', ' ').substring(0, 16)
            : new Date().toISOString().replace('T', ' ').substring(0, 16),
          customerName: order.shipping?.name || "Customer",
          email: order.userEmail || "customer@mahirash.com",
          phone: order.shipping?.phone || "9876543210",
          address: order.shipping?.address || "Atelier Delivery Address",
          city: order.shipping?.city || "Indore",
          state: order.shipping?.state || "Madhya Pradesh",
          pincode: order.shipping?.pincode || "452001",
          paymentMethod: order.paymentMethod === "COD" ? "COD" : "Prepaid",
          totalAmount: order.total || 0,
          items: (order.items || []).map(item => ({
            name: item.name,
            units: item.quantity || 1,
            price: item.price
          }))
        })
      });

      if (!res.ok) {
        throw new Error("API Route did not return success response");
      }

      const syncResult = await res.json();

      // Update firebase document
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        awbCode: syncResult.awb_code,
        shipmentId: syncResult.shipment_id,
        courierName: syncResult.courier_name || "Delhivery",
        trackingUrl: syncResult.tracking_url || `https://shiprocket.co/tracking/${syncResult.awb_code}`
      });

      alert(`Successfully synced with Shiprocket! Assigned AWB: ${syncResult.awb_code}`);
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert("Failed to sync shipment with Shiprocket: " + err.message);
    } finally {
      setSyncingOrderId(null);
    }
  };

  // Track AWB Live
  const handleTrackAWB = async (awbCode) => {
    setActiveTrackingAwb(awbCode);
    setLoadingTracking(true);
    setTrackingError("");
    setTrackingData(null);

    try {
      const res = await fetch(`/api/track?awb=${encodeURIComponent(awbCode)}`);
      if (!res.ok) {
        throw new Error("HTTP status " + res.status);
      }
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setTrackingData(data);
    } catch (err) {
      console.error(err);
      setTrackingError("Could not retrieve carrier updates for: " + awbCode);
    } finally {
      setLoadingTracking(false);
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(order => {
    const searchMatch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.awbCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const statusMatch = statusFilter === "all" || (order.status || "").toLowerCase() === statusFilter.toLowerCase();

    return searchMatch && statusMatch;
  });

  return (
    <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden font-sans">

      {/* Table Headers & Controls */}
      <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-200 gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold font-serif text-zinc-900">Manage Transactions & Shipments</h2>
          <p className="text-[12px] sm:text-[13px] text-zinc-500 mt-0.5">Push orders to Shiprocket and view dynamic tracking stats</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 border border-zinc-300 rounded-xl hover:bg-zinc-50 text-zinc-600 transition shadow-xs"
            title="Refresh orders list"
          >
            <RefreshCw size={14} />
          </button>

          <button
            type="button"
            onClick={handleExportOrders}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-zinc-300 rounded-xl bg-white hover:bg-zinc-50 text-[12px] sm:text-[13px] font-semibold text-zinc-700 cursor-pointer transition-all shadow-xs"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-4 sm:px-6 py-3.5 bg-zinc-50/50 border-b border-zinc-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {["all", "confirmed", "pending", "failed"].map(status => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[12px] sm:text-[13px] font-semibold capitalize transition cursor-pointer ${statusFilter === status ? "bg-black text-white shadow-xs" : "bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-100"}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by ID, email, buyer, AWB..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 text-[13px] bg-white border border-zinc-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Bulk actions alerts */}
      {selectedIds.length > 0 && (
        <div className="mx-3.5 sm:mx-6 my-3 sm:my-4 flex flex-col sm:flex-row justify-between items-center bg-zinc-50 border border-zinc-200 p-4 rounded-xl gap-3 animate-fadeIn">
          <div className="text-[13px] font-semibold text-zinc-700">
            {selectedIds.length} order(s) selected
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleBulkStatusChange("confirmed")}
              className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded text-[13px] font-semibold cursor-pointer transition-colors"
            >
              Mark Confirmed
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusChange("pending")}
              className="px-3 py-1.5 bg-[#D9A036]/10 text-[#D9A036] border border-[#D9A036]/20 hover:bg-amber-100 rounded text-[13px] font-semibold cursor-pointer transition-colors"
            >
              Mark Pending
            </button>
            <button
              type="button"
              onClick={() => handleBulkStatusChange("failed")}
              className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded text-[13px] font-semibold cursor-pointer transition-colors"
            >
              Mark Failed
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1.5 bg-red-650 text-white hover:bg-red-700 rounded text-[13px] font-semibold cursor-pointer transition-colors"
            >
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded text-[13px] font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Orders Table markup */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[840px] text-left text-sm text-[13px]">
          <thead className="bg-[#FAF9F6] border-b border-zinc-200">
            <tr className="text-[11px] text-zinc-700 uppercase tracking-widest">
              <th className="px-6 py-4 w-10">
                <input
                  type="checkbox"
                  checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-black cursor-pointer rounded border-zinc-300"
                />
              </th>
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Total</th>
              <th className="px-6 py-4">Courier / AWB</th>
              <th className="px-6 py-4">Payment</th>
              <th className="px-6 py-4">Fulfillment Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {loading ? (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={16} className="animate-spin text-zinc-400" />
                    <span>Loading Orders Log...</span>
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((order) => (
                <tr key={order.id} className={`hover:bg-zinc-50/80 transition-colors font-sans ${selectedIds.includes(order.id) ? 'bg-zinc-50' : ''}`}>
                  <td className="px-6 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(order.id)}
                      onChange={() => toggleSelectRow(order.id)}
                      className="w-4 h-4 accent-black cursor-pointer rounded border-zinc-300"
                    />
                  </td>
                  <td className="px-6 py-4 text-zinc-900 font-mono text-[14px]">
                    #{order.id.slice(0, 10).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-zinc-900 font-bold">{order.shipping?.name || "Atelier Guest"}</p>
                    <p className="text-[11px] text-zinc-550 text-zinc-500">{order.userEmail}</p>
                    {order.shipping?.phone && <p className="text-[12px] text-zinc-400 font-semibold">{order.shipping.phone}</p>}
                  </td>
                  <td className="px-6 py-4 text-zinc-900 font-semibold">₹{(order.total || 0).toLocaleString("en-IN")}</td>
                  <td className="px-6 py-4">
                    {order.awbCode ? (
                      <div className="space-y-1 text-left">
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-mono font-bold">
                          <Truck size={10} /> {order.awbCode}
                        </span>
                        <p className="text-[10.5px] text-zinc-500 italic block">{order.courierName || "Delhivery Partner"}</p>
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md font-medium">
                        Not Dispatched
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-zinc-600 uppercase text-[11px] tracking-wider font-mono">{order.paymentMethod || "Online"}</td>
                  <td className="px-6 py-4">
                    <select
                      value={order.status?.toLowerCase() || "confirmed"}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className={`inline-flex items-center px-2 py-1 rounded-md border text-[11px] uppercase tracking-wider font-semibold outline-none cursor-pointer ${statusBadgeClasses(order.status)}`}
                    >
                      {ORDER_STATUSES.map(st => (
                        <option key={st} value={st} className="bg-white text-black">{st}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {order.awbCode ? (
                        <button
                          type="button"
                          onClick={() => handleTrackAWB(order.awbCode)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1.5 transition"
                          title="Track details live"
                        >
                          <Truck size={12} /> Track Live
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={syncingOrderId === order.id}
                          onClick={() => handleSyncShiprocket(order)}
                          className="px-3 py-1.5 bg-zinc-900 hover:bg-black disabled:bg-zinc-400 text-white rounded text-[11px] font-semibold flex items-center gap-1.5 transition"
                        >
                          {syncingOrderId === order.id ? (
                            <>
                              <RefreshCw size={12} className="animate-spin" /> Syncing...
                            </>
                          ) : (
                            <>
                              <RefreshCw size={12} /> Sync Shiprocket
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-6 py-12 text-center text-zinc-500">No orders found matching criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
        {filteredOrders.length > itemsPerPage && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-zinc-200 bg-[#FAF9F6]">
            <span className="text-[13px] text-zinc-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-zinc-300 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredOrders.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                className="px-3 py-1.5 border border-zinc-300 rounded text-[13px] font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TRACKING DETAILS SIDEBAR / DRAWER */}
      <AnimatePresence>
        {activeTrackingAwb && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTrackingAwb(null)}
              className="absolute inset-0 bg-black"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="relative w-full max-w-md bg-white h-full shadow-2xl z-10 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-zinc-200 flex items-center justify-between">
                <div>
                  <span className="text-[12px] text-zinc-400 font-extrabold uppercase tracking-widest">Courier Partner Live Info</span>
                  <h3 className="text-sm font-bold text-zinc-900 font-serif uppercase tracking-widest mt-0.5">AWB Tracking Code: {activeTrackingAwb}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTrackingAwb(null)}
                  className="p-1 text-zinc-400 hover:text-black rounded-lg transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrolling Content */}
              <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                {loadingTracking ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <RefreshCw size={32} className="animate-spin text-zinc-800" />
                    <p className="text-[14px] text-zinc-500 font-light uppercase tracking-widest">Querying Shiprocket logs...</p>
                  </div>
                ) : trackingError ? (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-6 text-center space-y-2">
                    <XCircle size={24} className="mx-auto text-red-650" />
                    <p className="text-[14px] font-semibold">{trackingError}</p>
                  </div>
                ) : trackingData ? (
                  <div className="space-y-6">
                    {/* Status widget */}
                    <div className="bg-[#FAF9F6] border border-zinc-200 rounded-xl p-5 space-y-3 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-zinc-400 uppercase tracking-widest block font-bold">Delivery Status</span>
                        <span className="text-emerald-700 bg-emerald-50 text-[12px] font-black tracking-widest uppercase px-3 py-1 rounded-full border border-emerald-150">
                          {trackingData.currentStatus}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-150 text-[14px]">
                        <div>
                          <span className="text-[12px] text-zinc-400 uppercase block font-semibold">Logistics Courier</span>
                          <span className="text-zinc-950 font-bold block mt-0.5">{trackingData.provider || "Delhivery"}</span>
                        </div>
                        <div>
                          <span className="text-[12px] text-zinc-400 uppercase block font-semibold">Estimated Delivery</span>
                          <span className="text-zinc-950 font-bold block mt-0.5">{trackingData.estimatedDelivery}</span>
                        </div>
                      </div>
                    </div>

                    {/* Checkpoints logs timeline */}
                    <div className="space-y-4 text-left font-sans">
                      <h4 className="text-[11px] text-zinc-450 text-zinc-550 uppercase tracking-widest font-extrabold pb-2 border-b border-zinc-100">Scan Activity Logs</h4>
                      <div className="relative border-l border-zinc-200 ml-2 pl-5 space-y-6 py-2">
                        {trackingData.scans && trackingData.scans.length > 0 ? (
                          trackingData.scans.map((scan, idx) => (
                            <div key={idx} className="relative group text-left">
                              <span className={`absolute -left-[27px] top-1 w-2.5 h-2.5 rounded-full border-2 ${idx === 0 ? "bg-black border-black ring-4 ring-zinc-100" : "bg-white border-zinc-300"}`} />
                              <div className="space-y-0.5">
                                <span className="text-[9.5px] font-mono text-zinc-400 block">{scan.date}</span>
                                <h5 className="text-[11.5px] font-bold text-zinc-900 leading-tight">{scan.activity}</h5>
                                {scan.location && (
                                  <p className="text-[10.5px] text-zinc-500 font-light flex items-center gap-1 mt-0.5">
                                    <MapPin size={10} className="text-zinc-400" />
                                    {scan.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="relative">
                            <span className="absolute -left-[26px] top-1 w-2.5 h-2.5 rounded-full bg-black border border-black" />
                            <div className="space-y-0.5">
                              <span className="text-[9.5px] text-zinc-400 font-mono">Just Now</span>
                              <h5 className="text-[11.5px] text-zinc-900 font-bold">Courier manifest generated.</h5>
                              <p className="text-[10.5px] text-zinc-500 font-light">Coordinating handoff and carrier sorting center scheduling.</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center py-20 text-[14px] text-zinc-400">Logistics feed is empty</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
};

export default OrdersTable;
