import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Clock, CheckCircle2, XCircle, ChevronRight, X, ArrowLeft, ShoppingBag, Eye, MapPin, CreditCard, Download, Search, Filter, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../components/Firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../components/useAuth';
import { useCustomerAuth } from '../components/CustomerAuthProvider';
import PageHeader from '../components/Home/PageHeader';
import SEOHead from '../components/SEOHead';
import OptimizedCloudinaryImage from '../components/OptimizedCloudinaryImage';
import MiniLoader from '../components/MiniLoader';

const Orders = () => {
  const { user } = useAuth();
  const customerAuth = useCustomerAuth();
  const customer = customerAuth?.customer;
  const activeEmail = (customer?.email || user?.email || "").toLowerCase().trim();
  const activeUid = user?.uid || customer?.uid || customer?.id || "";

  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusProps = (status) => {
    const s = (status || "confirmed").toLowerCase();
    switch (s) {
      case "delivered":
        return { colorClass: "bg-emerald-50 text-emerald-700 border-emerald-300", Icon: CheckCircle2 };
      case "failed":
      case "cancelled":
        return { colorClass: "bg-red-50 text-red-700 border-red-300", Icon: XCircle };
      case "dispatched":
      case "shipped":
        return { colorClass: "bg-blue-50 text-blue-700 border-blue-300", Icon: Clock };
      case "packing":
      case "packed":
      case "connecting with delivery partner":
        return { colorClass: "bg-purple-50 text-purple-700 border-purple-300", Icon: Clock };
      case "confirmed":
        return { colorClass: "bg-amber-50 text-amber-700 border-amber-300", Icon: Clock };
      default:
        return { colorClass: "bg-zinc-50 text-zinc-700 border-zinc-300", Icon: Clock };
    }
  };

  useEffect(() => {
    if (!user && !customer) {
      navigate("/login?redirect=orders");
      return;
    }
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // Guaranteed retrieval via server API with superadmin privileges
        const apiRes = await fetch(`/api/get-orders?email=${encodeURIComponent(activeEmail)}&userId=${encodeURIComponent(activeUid)}`);
        if (apiRes.ok) {
          const data = await apiRes.json();
          if (Array.isArray(data.orders)) {
            setOrders(data.orders);
            setLoading(false);
            return;
          }
        }
      } catch (apiErr) {
        console.warn("Server orders API notice:", apiErr);
      }

      // Fallback: direct Firestore query
      try {
        const ordersRef = collection(db, "orders");
        const ordersMap = new Map();

        if (activeUid) {
          const qUid = query(ordersRef, where("userId", "==", activeUid));
          const snapUid = await getDocs(qUid);
          snapUid.docs.forEach(docSnap => {
            ordersMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
          });
        }

        if (activeEmail) {
          try {
            const qEmail = query(ordersRef, where("customerEmail", "==", activeEmail));
            const snapEmail = await getDocs(qEmail);
            snapEmail.docs.forEach(docSnap => {
              ordersMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
            });
          } catch (_) {}

          try {
            const qUserEmail = query(ordersRef, where("userEmail", "==", activeEmail));
            const snapUserEmail = await getDocs(qUserEmail);
            snapUserEmail.docs.forEach(docSnap => {
              ordersMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
            });
          } catch (_) {}
        }

        const ordersList = Array.from(ordersMap.values());
        ordersList.sort((a, b) => {
          const timeA = a.createdAt?.toMillis
            ? a.createdAt.toMillis()
            : a.createdAt?.toDate
              ? a.createdAt.toDate().getTime()
              : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const timeB = b.createdAt?.toMillis
            ? b.createdAt.toMillis()
            : b.createdAt?.toDate
              ? b.createdAt.toDate().getTime()
              : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return timeB - timeA;
        });
        setOrders(ordersList);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, customer, activeEmail, activeUid, navigate]);

  // Tax Invoice Generation & Print
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
        <td style="padding: 12px 14px; border-bottom: 1px solid #eeeeee; font-size: 12px; text-align: right; color: #333;">₹${(item.price || 0).toLocaleString('en-IN')}</td>
        <td style="padding: 12px 14px; border-bottom: 1px solid #eeeeee; font-size: 12px; text-align: right; font-weight: 700; color: #000;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const shippingAddr = order.shipping || {};
    const recipientName = shippingAddr.name || user?.displayName || 'Valued Client';
    const recipientPhone = shippingAddr.phone || 'N/A';

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Invoice #${order.id.slice(0, 10).toUpperCase()} - MAHIRASH</title>
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
                <div class="tagline">Haute Parfumerie & Luxury Fragrances</div>
              </div>
              <div class="inv-meta">
                <h2>TAX INVOICE</h2>
                <p>Invoice #: <strong>INV-${order.id.slice(0, 10).toUpperCase()}</strong></p>
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
                Email: ${user?.email || 'N/A'}
              </div>
              <div class="address-box" style="text-align: right;">
                <h3>Order Information</h3>
                Order Reference: #${order.id.slice(0, 14).toUpperCase()}<br />
                Payment Method: ${(order.paymentMethod || 'Online').toUpperCase()}<br />
                Payment ID: ${order.paymentId || 'COD'}<br />
                Fulfillment: <strong>${(order.status || 'Confirmed').toUpperCase()}</strong>

              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Item Description</th>
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
                  <td style="text-align: right;">₹${(order.total || 0).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td>Priority Express Shipping</td>
                  <td style="text-align: right; color: #10B981; font-weight: 600;">FREE</td>
                </tr>
                <tr>
                  <td>Estimated GST (Included)</td>
                  <td style="text-align: right;">₹0</td>
                </tr>
                <tr class="total-row">
                  <td style="padding-top: 12px; padding-bottom: 12px;">Grand Total</td>
                  <td style="text-align: right; padding-top: 12px; padding-bottom: 12px;">₹${(order.total || 0).toLocaleString('en-IN')}</td>
                </tr>
              </table>
            </div>

            <div class="footer">
              <p>Thank you for choosing MAHIRASH LUXURY PERFUMES. For support or returns, contact mahirash.help@gmail.com</p>
            </div>
          </div>
        </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceHtml);
    invoiceWindow.document.close();
  };

  // Filter orders by status and search query
  const filteredOrders = orders.filter(order => {
    const matchesStatus =
      statusFilter === "all"
        ? true
        : (order.status || "confirmed").toLowerCase() === statusFilter.toLowerCase();

    const queryLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !queryLower ||
      order.id.toLowerCase().includes(queryLower) ||
      order.items?.some(i => i.name?.toLowerCase().includes(queryLower));

    return matchesStatus && matchesSearch;
  });

  if (loading) {
    return <MiniLoader message="Loading Orders" />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-zinc-900">
      <SEOHead
        title="My Orders & Tracking | Mahirash Luxury Perfumes"
        description="Track your order history, shipment status, and download invoices on Mahirash."
        robots="noindex, follow"
        url="https://mahirash.com/orders"
      />
      <PageHeader
        title="My Orders"
        subtitle="View your order history, track shipments, and download tax invoices"
        breadcrumbItems={[
          { label: "Home", path: "/" },
          { label: "Account", path: "/account" },
          { label: "Orders" }
        ]}
      />

      <div className="max-w-6xl mx-auto px-5 md:px-10 py-10 md:py-14">
        {/* Navigation & Header controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <Link
            to="/account"
            className="inline-flex items-center gap-2 text-[14px] uppercase tracking-[0.2em] font-semibold text-zinc-500 hover:text-black transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>

          <span className="text-[14px] uppercase tracking-widest text-[#b8860b] font-mono  ">
            Total Orders: {orders.length}
          </span>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white border border-zinc-200 p-4 shadow-sm">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "All Orders" },
              { id: "confirmed", label: "Confirmed" },
              { id: "pending", label: "Pending" },
              { id: "failed", label: "Failed" }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest transition-all rounded-sm ${statusFilter === tab.id
                  ? "bg-black text-white font-black"
                  : "bg-zinc-100 text-zinc-600 border border-zinc-200 hover:text-black hover:bg-zinc-200"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Order Search */}
          <div className="relative w-full md:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by Order ID or item..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-300 pl-9 pr-8 py-2 text-[14px] text-zinc-900 outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white border border-zinc-200 p-8 max-w-md mx-auto shadow-sm">
            <div className="w-16 h-16 border border-zinc-300 flex items-center justify-center text-zinc-400 mx-auto mb-5">
              <ShoppingBag size={24} strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-light text-zinc-900 tracking-widest uppercase mb-2">
              No Orders Found
            </h3>
            <p className="text-[14px] text-zinc-500 leading-relaxed mb-6">
              {searchQuery || statusFilter !== "all"
                ? "No orders match your filter criteria."
                : "You haven't placed any orders yet."}
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 px-7 py-3 bg-black text-white font-extrabold text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all"
            >
              Explore Shop <ChevronRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map(order => {
              const formattedDate = order.createdAt?.toDate
                ? order.createdAt.toDate().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })
                : order.createdAt?.toMillis
                  ? new Date(order.createdAt.toMillis()).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })
                  : "Recently";

              const items = order.items || [];

              return (
                <div
                  key={order.id}
                  className="bg-white border border-zinc-200 hover:border-black/30 transition-all overflow-hidden p-6 md:p-8 space-y-6 shadow-sm"
                >
                  {/* Order Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 border border-zinc-300 flex items-center justify-center text-zinc-500 shrink-0">
                        <Package size={18} strokeWidth={1.5} />
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#b8860b]">
                          Order Reference
                        </span>
                        <h3 className="text-sm   text-zinc-900 uppercase tracking-wider font-mono">
                          #{order.id.slice(0, 14).toUpperCase()}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-left sm:text-right mr-2">
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 block">
                          Placed On
                        </span>
                        <span className="text-[14px] text-zinc-700">{formattedDate}</span>
                      </div>

                      <span
                        className={`px-3 py-1 text-[9px] font-extrabold uppercase tracking-widest border flex items-center gap-1.5 ${getStatusProps(order.status).colorClass}`}
                      >
                        {(() => { const { Icon } = getStatusProps(order.status); return <Icon size={11} />; })()}
                        {order.status || "Confirmed"}
                      </span>

                      {/* Download Invoice Button */}
                      <button
                        type="button"
                        onClick={() => handleDownloadInvoice(order)}
                        className="px-3.5 py-2 bg-white border border-zinc-300 hover:bg-[#b8860b] hover:text-white text-[#b8860b] text-[9px] font-extrabold uppercase tracking-widest transition-all flex items-center gap-2"
                        title="Download official tax invoice PDF"
                      >
                        <Download size={12} />
                        Invoice
                      </button>

                      {/* View Details Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="px-3.5 py-2 bg-black text-white font-extrabold text-[9px] uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center gap-1.5"
                      >
                        <Eye size={12} />
                        Details
                      </button>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="divide-y divide-zinc-200">
                    {items.map((item, idx) => {
                      const itemImg =
                        item.image ||
                        item.images?.[0] ||
                        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?q=80&w=800";
                      return (
                        <div
                          key={idx}
                          className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-16 bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                              <OptimizedCloudinaryImage
                                src={itemImg}
                                alt={item.name}
                                preset="avatar"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="text-[14px]   text-zinc-900 uppercase tracking-wider line-clamp-1">
                                {item.name}
                              </h4>
                              <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-1">
                                {item.size && <span>Size: <strong className="text-zinc-800">{item.size}</strong></span>}
                                <span>Qty: <strong className="text-zinc-800">{item.quantity || 1}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[14px] font-semibold text-zinc-900">
                              ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Order Summary Bottom Bar */}
                  <div className="pt-4 border-t border-zinc-200 flex items-center justify-between text-[14px]">
                    <div className="text-zinc-500 text-[11px]">
                      <span>Payment: <strong className="text-zinc-900 uppercase">{order.paymentMethod || "Online"}</strong></span>
                    </div>

                    <div className="flex items-center gap-4">
                      {order.awbCode && (
                        <Link
                          to={`/track?awb=${order.awbCode}`}
                          className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100/80 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1.5 transition"
                        >
                          <Truck size={12} className="animate-pulse" /> Track Shipment Live
                        </Link>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500 uppercase text-[10px] tracking-wider">
                          Grand Total:
                        </span>
                        <span className="text-sm text-zinc-900 font-mono font-bold">
                          ₹{(order.total || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FULL ORDER DETAILS MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white border border-zinc-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl z-10 space-y-6 text-zinc-900 rounded-sm"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#b8860b]">
                    Order Specification
                  </span>
                  <h3 className="text-base   text-zinc-900 uppercase tracking-wider font-mono">
                    #{selectedOrder.id.slice(0, 14).toUpperCase()}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 text-zinc-400 hover:text-black"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Live Shipping & Tracking details */}
              {selectedOrder.awbCode && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 text-[13px] flex items-center justify-between text-left">
                  <div className="space-y-0.5">
                    <span className="text-[9px] text-emerald-800 uppercase tracking-wider block font-bold">Courier Shipping AWB</span>
                    <span className="text-emerald-950 font-bold font-mono text-sm">{selectedOrder.awbCode} ({selectedOrder.courierName || 'Delhivery'})</span>
                  </div>
                  <Link
                    to={`/track?awb=${selectedOrder.awbCode}`}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold uppercase tracking-widest transition-colors flex items-center gap-1.5"
                  >
                    <Truck size={12} /> Track Live
                  </Link>
                </div>
              )}

              {/* Shipping & Payment Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 p-4 border border-zinc-200 text-[14px]">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[#b8860b]   uppercase tracking-wider text-[10px] mb-1">
                    <MapPin size={12} /> Shipping Address
                  </div>
                  <p className="  text-zinc-900 uppercase">{selectedOrder.shipping?.name || user?.displayName}</p>
                  <p className="text-zinc-600">{selectedOrder.shipping?.address}</p>
                  <p className="text-zinc-600">
                    {selectedOrder.shipping?.city}, {selectedOrder.shipping?.state} - {selectedOrder.shipping?.pincode}
                  </p>
                  <p className="text-[#b8860b] font-mono text-[11px] pt-1">Phone: {selectedOrder.shipping?.phone || 'N/A'}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-[#b8860b]   uppercase tracking-wider text-[10px] mb-1">
                    <CreditCard size={12} /> Payment Info
                  </div>
                  <p className="text-zinc-700">Method: <strong className="text-zinc-900 uppercase">{selectedOrder.paymentMethod || 'Online'}</strong></p>
                  <p className="text-zinc-500 font-mono text-[11px]">Transaction ID: {selectedOrder.paymentId || 'COD'}</p>
                  <p className="text-zinc-700">Status: <strong className="text-emerald-700 uppercase">PAID / CONFIRMED</strong></p>
                </div>
              </div>

              {/* Purchased Items List */}
              <div className="space-y-3">
                <h4 className="text-[14px]   uppercase tracking-widest text-zinc-500">
                  Itemized Summary
                </h4>
                <div className="divide-y divide-zinc-200 bg-zinc-50 p-4 border border-zinc-200">
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <OptimizedCloudinaryImage
                          src={item.image || item.images?.[0]}
                          alt={item.name}
                          preset="avatar"
                          className="w-12 h-14 object-cover bg-zinc-100 border border-zinc-200 shrink-0"
                        />
                        <div>
                          <p className="text-[14px]   text-zinc-900 uppercase">{item.name}</p>
                          <p className="text-[11px] text-zinc-500">
                            {item.size ? `Size: ${item.size} • ` : ""}Qty: {item.quantity || 1}
                          </p>
                        </div>
                      </div>
                      <span className="text-[14px]   text-zinc-900 font-mono">
                        ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="bg-zinc-50 p-4 border border-zinc-200 space-y-2 text-[14px]">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span>₹{(selectedOrder.total || 0).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Express Shipping</span>
                  <span className="text-emerald-700  ">FREE</span>
                </div>
                <div className="flex justify-between text-zinc-900 text-sm   pt-2 border-t border-zinc-200 font-mono">
                  <span>Grand Total</span>
                  <span>₹{(selectedOrder.total || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadInvoice(selectedOrder)}
                  className="flex-1 py-3 bg-black text-white font-extrabold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={14} /> Download PDF Invoice
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-6 py-3 border border-zinc-300 text-zinc-700   text-[10px] uppercase tracking-widest hover:text-black hover:border-black"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Orders;
