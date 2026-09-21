import React, { useState, useEffect } from 'react';
import { db } from '../../../components/Firebase';
import { collection, getDocs } from 'firebase/firestore';
import { ClipboardList, Download, Calendar, FileText, CheckCircle2 } from 'lucide-react';

const ReportsView = () => {
  const [reportType, setReportType] = useState("sales");
  const [dateRange, setDateRange] = useState("month");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealData = async () => {
      setLoading(true);
      try {
        const orderSnap = await getDocs(collection(db, 'orders'));
        setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const prodSnap = await getDocs(collection(db, 'products'));
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error loading report data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRealData();
  }, []);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (reportType === "sales") {
      csvContent += "Date,Order ID,Customer Name,Items Count,Total Amount,Payment Method,Status\n";
      orders.forEach(o => {
        const dateStr = o.createdAt ? new Date(o.createdAt.seconds ? o.createdAt.seconds * 1000 : o.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
        const customer = o.customerName || o.shippingAddress?.fullName || 'Guest User';
        const itemsCount = (o.items || o.cartItems || []).length || 1;
        const total = o.total || o.grandTotal || 0;
        const payment = o.paymentMethod || 'UPI / Razorpay';
        const status = o.status || 'Completed';
        csvContent += `${dateStr},${o.id},"${customer}",${itemsCount},"₹${total}","${payment}",${status}\n`;
      });
    } else {
      csvContent += "SKU/ID,Product Name,Category,Current Stock,Stock Status\n";
      products.forEach(p => {
        const stockNum = parseInt(p.stock) || 0;
        const status = stockNum === 0 ? "Out of Stock" : stockNum <= 5 ? "Low Stock" : "In Stock";
        csvContent += `${p.id},"${p.name}",${p.category || 'General'},${stockNum},${status}\n`;
      });
    }
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Mahirash_${reportType}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-zinc-900 font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm">
        <div>
          <h2 className="text-xl   font-poppins text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <ClipboardList className="text-[#b8860b]" size={22} /> Executive Store Audit & Reports
          </h2>
          <p className="text-[14px] text-zinc-500 mt-1">Export formatted real-time sales and inventory logs directly from Firestore.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-zinc-800 text-white   text-[14px] rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Download size={15} /> Export Live CSV Report
          </button>
        </div>
      </div>

      {/* Control Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-xl">
          <button
            onClick={() => setReportType("sales")}
            className={`px-4 py-2 text-[14px]   rounded-lg transition-all ${reportType === "sales" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-black"
              }`}
          >
            Sales & Orders Log ({orders.length})
          </button>
          <button
            onClick={() => setReportType("inventory")}
            className={`px-4 py-2 text-[14px]   rounded-lg transition-all ${reportType === "inventory" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-black"
              }`}
          >
            Inventory Stock Audit ({products.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-zinc-400" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3.5 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-[14px] font-semibold text-zinc-900 outline-none focus:border-black transition-all cursor-pointer"
          >
            <option value="month">Current Month</option>
            <option value="quarter">This Quarter</option>
            <option value="ytd">Full Year 2026</option>
          </select>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h3 className="text-sm   uppercase tracking-wider text-zinc-900 flex items-center gap-2">
            <FileText size={16} className="text-[#b8860b]" />
            {reportType === "sales" ? "Live Customer Orders Audit Log" : "Live Product Inventory Stock Summary"}
          </h3>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 size={12} /> Live Sync Active
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[14px] text-zinc-500">Loading live report items...</div>
        ) : (
          <div className="overflow-x-auto">
            {reportType === "sales" ? (
              <table className="w-full text-left text-[14px] border-collapse">
                <thead>
                  <tr className="text-[10px]   uppercase tracking-widest text-zinc-400 border-b border-zinc-200">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Items Count</th>
                    <th className="py-3 px-3">Total Amount</th>
                    <th className="py-3 px-3">Payment Method</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {orders.map((o) => {
                    const dateStr = o.createdAt ? new Date(o.createdAt.seconds ? o.createdAt.seconds * 1000 : o.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                    const customer = o.customerName || o.shippingAddress?.fullName || 'Guest User';
                    const itemsCount = (o.items || o.cartItems || []).length || 1;
                    const total = o.total || o.grandTotal || 0;
                    return (
                      <tr key={o.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-medium text-zinc-500">{dateStr}</td>
                        <td className="py-3.5 px-3 font-mono   text-zinc-900">#{o.id?.slice(0, 8)}</td>
                        <td className="py-3.5 px-3 font-semibold text-zinc-800">{customer}</td>
                        <td className="py-3.5 px-3 text-zinc-600">{itemsCount} items</td>
                        <td className="py-3.5 px-3   text-zinc-900">₹{Number(total).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-3 text-zinc-600">{o.paymentMethod || 'UPI / Card'}</td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="px-2.5 py-0.5 rounded text-[9px]   bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {o.status || 'PAID'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">No customer orders recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-[14px] border-collapse">
                <thead>
                  <tr className="text-[10px]   uppercase tracking-widest text-zinc-400 border-b border-zinc-200">
                    <th className="py-3 px-3">Product ID</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Stock Qty</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {products.map((p) => {
                    const stockNum = parseInt(p.stock) || 0;
                    return (
                      <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-medium text-zinc-500">#{p.id?.slice(0, 8)}</td>
                        <td className="py-3.5 px-3   text-zinc-900">{p.name}</td>
                        <td className="py-3.5 px-3 text-zinc-600">{p.category || 'General'}</td>
                        <td className="py-3.5 px-3   text-zinc-900">{stockNum} units</td>
                        <td className="py-3.5 px-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded text-[9px]   ${stockNum === 0 ? "bg-red-100 text-red-800 border border-red-200" :
                            stockNum <= 5 ? "bg-amber-100 text-amber-800 border border-amber-200" :
                              "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            }`}>
                            {stockNum === 0 ? "OUT OF STOCK" : stockNum <= 5 ? "LOW STOCK" : "IN STOCK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-500">No products found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;
