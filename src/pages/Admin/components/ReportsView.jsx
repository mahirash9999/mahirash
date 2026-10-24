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
    <div className="space-y-6 text-[#30231F] font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FCF9F4] p-6 rounded-2xl border border-[#E9DCCB] shadow-xs">
        <div>
          <h2 className="text-xl font-serif text-[#30231F] font-bold tracking-wide flex items-center gap-2">
            <ClipboardList className="text-[#800020]" size={22} /> Executive Store Audit & Reports
          </h2>
          <p className="text-[14px] text-[#75665D] mt-1">Export formatted real-time sales and inventory logs directly from Firestore.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#800020] hover:bg-[#650018] text-white font-semibold text-[14px] rounded-xl shadow-md shadow-[#800020]/25 transition-all cursor-pointer"
          >
            <Download size={15} /> Export Live CSV Report
          </button>
        </div>
      </div>

      {/* Control Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FCF9F4] p-4 rounded-2xl border border-[#E9DCCB] shadow-xs">
        <div className="flex items-center gap-2 bg-[#E9DCCB]/40 p-1 rounded-xl">
          <button
            onClick={() => setReportType("sales")}
            className={`px-4 py-2 text-[14px] font-semibold rounded-lg transition-all ${reportType === "sales" ? "bg-[#800020] text-white shadow-sm" : "text-[#75665D] hover:text-[#800020]"
              }`}
          >
            Sales & Orders Log ({orders.length})
          </button>
          <button
            onClick={() => setReportType("inventory")}
            className={`px-4 py-2 text-[14px] font-semibold rounded-lg transition-all ${reportType === "inventory" ? "bg-[#800020] text-white shadow-sm" : "text-[#75665D] hover:text-[#800020]"
              }`}
          >
            Inventory Stock Audit ({products.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#75665D]" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3.5 py-2 bg-white border border-[#E9DCCB] rounded-xl text-[14px] font-semibold text-[#30231F] outline-none focus:border-[#800020] transition-all cursor-pointer"
          >
            <option value="month">Current Month</option>
            <option value="quarter">This Quarter</option>
            <option value="ytd">Full Year 2026</option>
          </select>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-3">
          <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#30231F] flex items-center gap-2">
            <FileText size={16} className="text-[#800020]" />
            {reportType === "sales" ? "Live Customer Orders Audit Log" : "Live Product Inventory Stock Summary"}
          </h3>
          <span className="text-[12px] font-bold uppercase tracking-widest text-[#800020] bg-[#800020]/10 px-2.5 py-1 rounded-md border border-[#800020]/20 flex items-center gap-1">
            <CheckCircle2 size={12} /> Live Sync Active
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[14px] text-[#75665D]">Loading live report items...</div>
        ) : (
          <div className="overflow-x-auto">
            {reportType === "sales" ? (
              <table className="w-full text-left text-[14px] border-collapse">
                <thead>
                  <tr className="text-[12px] font-semibold uppercase tracking-wider text-[#75665D] bg-[#FCF9F4] border-b border-[#E9DCCB]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Items Count</th>
                    <th className="py-3 px-3">Total Amount</th>
                    <th className="py-3 px-3">Payment Method</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DCCB]/50">
                  {orders.map((o) => {
                    const dateStr = o.createdAt ? new Date(o.createdAt.seconds ? o.createdAt.seconds * 1000 : o.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                    const customer = o.customerName || o.shippingAddress?.fullName || 'Guest User';
                    const itemsCount = (o.items || o.cartItems || []).length || 1;
                    const total = o.total || o.grandTotal || 0;
                    return (
                      <tr key={o.id} className="hover:bg-[#FCF9F4]/70 transition-colors">
                        <td className="py-3.5 px-3 font-medium text-[#75665D]">{dateStr}</td>
                        <td className="py-3.5 px-3 font-mono text-[#30231F] font-semibold">#{o.id?.slice(0, 8)}</td>
                        <td className="py-3.5 px-3 font-semibold text-[#30231F]">{customer}</td>
                        <td className="py-3.5 px-3 text-[#75665D]">{itemsCount} items</td>
                        <td className="py-3.5 px-3 font-semibold text-[#30231F]">₹{Number(total).toLocaleString('en-IN')}</td>
                        <td className="py-3.5 px-3 text-[#75665D]">{o.paymentMethod || 'UPI / Card'}</td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="px-2.5 py-0.5 rounded text-[12px] font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/25">
                            {o.status || 'PAID'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#75665D]">No customer orders recorded yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-[14px] border-collapse">
                <thead>
                  <tr className="text-[12px] font-semibold uppercase tracking-wider text-[#75665D] bg-[#FCF9F4] border-b border-[#E9DCCB]">
                    <th className="py-3 px-3">Product ID</th>
                    <th className="py-3 px-3">Product Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Stock Qty</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9DCCB]/50">
                  {products.map((p) => {
                    const stockNum = parseInt(p.stock) || 0;
                    return (
                      <tr key={p.id} className="hover:bg-[#FCF9F4]/70 transition-colors">
                        <td className="py-3.5 px-3 font-mono font-medium text-[#75665D]">#{p.id?.slice(0, 8)}</td>
                        <td className="py-3.5 px-3 font-semibold text-[#30231F]">{p.name}</td>
                        <td className="py-3.5 px-3 text-[#75665D]">{p.category || 'General'}</td>
                        <td className="py-3.5 px-3 font-semibold text-[#30231F]">{stockNum} units</td>
                        <td className="py-3.5 px-3 text-right">
                          <span className={`px-2.5 py-0.5 rounded text-[12px] font-semibold ${stockNum === 0 ? "bg-[#800020]/10 text-[#800020] border border-[#800020]/25" :
                            stockNum <= 5 ? "bg-[#B88D46]/15 text-[#B88D46] border border-[#B88D46]/30" :
                              "bg-[#800020]/10 text-[#800020] border border-[#800020]/25"
                            }`}>
                            {stockNum === 0 ? "OUT OF STOCK" : stockNum <= 5 ? "LOW STOCK" : "IN STOCK"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-[#75665D]">No products found.</td>
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
