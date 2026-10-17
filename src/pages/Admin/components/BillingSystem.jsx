import React, { useState, useEffect } from 'react';
import { db } from '../../../components/Firebase';
import { collection, getDocs } from 'firebase/firestore';
import { FileText, Printer, Search, X, CheckCircle2, DollarSign, Calendar, User, Phone, MapPin, Mail } from 'lucide-react';

const BillingSystem = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'orders'));
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(list);
      } catch (err) {
        console.error("Error loading billing orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(o => {
    const term = searchTerm.toLowerCase();
    const customer = (o.customerName || o.shippingAddress?.fullName || '').toLowerCase();
    const email = (o.customerEmail || o.email || o.shippingAddress?.email || '').toLowerCase();
    const phone = (o.phone || o.shippingAddress?.phone || '').toLowerCase();
    const id = (o.id || '').toLowerCase();
    return customer.includes(term) || email.includes(term) || phone.includes(term) || id.includes(term);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 text-zinc-900 font-['Inter',sans-serif]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm print:hidden">
        <div>
          <h2 className="text-xl   font-poppins text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="text-[#b8860b]" size={22} /> Customer Billing & Tax Invoice System
          </h2>
          <p className="text-[14px] text-zinc-500 mt-1">View, search, and print official Tax Invoices for all completed customer store orders.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm print:hidden">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search bills by customer name, email, phone number, or order ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-300 rounded-xl text-[14px] outline-none focus:border-black focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Customer Orders / Bills Table */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-sm print:hidden">
        {loading ? (
          <div className="py-12 text-center text-[14px] text-zinc-500">Loading customer billing records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead>
                <tr className="text-[12px]   uppercase tracking-widest text-zinc-400 border-b border-zinc-200">
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Customer Name</th>
                  <th className="py-3 px-3">Contact Email & Phone</th>
                  <th className="py-3 px-3">Order Date</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredOrders.map((o) => {
                  const customer = o.customerName || o.shipping?.name || o.shippingAddress?.fullName || 'Guest Customer';
                  const email = o.userEmail || o.customerEmail || o.email || o.shipping?.email || o.shippingAddress?.email || 'N/A';
                  const phone = o.phone || o.shipping?.phone || o.shippingAddress?.phone || o.customerPhone || 'N/A';
                  const total = o.total || o.grandTotal || o.totalPrice || 0;
                  const dateStr = o.createdAt ? new Date(o.createdAt.seconds ? o.createdAt.seconds * 1000 : o.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN');

                  return (
                    <tr key={o.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-3 font-mono   text-zinc-900">
                        INV-{o.id?.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="py-3.5 px-3">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="  text-black hover:text-[#b8860b] underline text-left transition-colors cursor-pointer"
                        >
                          {customer}
                        </button>
                      </td>
                      <td className="py-3.5 px-3">
                        <p className="text-zinc-800 font-semibold">{email}</p>
                        <p className="text-[12px] text-zinc-400 font-mono">{phone}</p>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-600 font-medium">{dateStr}</td>
                      <td className="py-3.5 px-3 font-bold text-zinc-900">₹{Number(total).toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-3 text-zinc-600 font-medium">{o.paymentMethod || 'UPI / Razorpay'}</td>
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="px-3.5 py-1.5 bg-black hover:bg-zinc-800 text-white   text-[14px] rounded-lg shadow-sm transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <Printer size={13} />
                          <span>View & Print Bill</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-zinc-500 text-[14px]">No billing records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Tax Invoice Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:static print:bg-white print:backdrop-none">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-2xl w-full p-8 shadow-2xl space-y-6 relative print:border-none print:shadow-none print:max-w-none print:w-full print:p-0">

            {/* Modal Close & Print Buttons Header (Hidden during printing) */}
            <div className="flex justify-between items-center border-b border-zinc-200 pb-4 print:hidden">
              <span className="text-[14px] font-bold uppercase tracking-widest text-[#b8860b]">
                Tax Invoice Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-black hover:bg-zinc-800 text-white   text-[14px] rounded-xl shadow transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer size={15} /> Print Invoice
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 text-zinc-400 hover:text-black hover:bg-zinc-100 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* TAX INVOICE CONTENT DOCUMENT */}
            <div className="space-y-6 text-zinc-900" id="printable-invoice">

              {/* Store & Invoice Header */}
              <div className="flex justify-between items-start border-b border-zinc-200 pb-6">
                <div>
                  <h1 className="text-xl font-serif font-light tracking-widest text-black uppercase">
                    MAHIRASH PERFUMES
                  </h1>
                  <p className="text-[12px] text-zinc-500 uppercase tracking-widest mt-0.5">
                    Official Tax Invoice & Sales Receipt
                  </p>
                  <p className="text-[14px] text-zinc-600 mt-2 font-medium">
                    Haute Parfumerie | mahirash.com
                  </p>
                  <p className="text-[14px] text-zinc-500">Contact: +91 8959041514 | mahirash.help@gmail.com</p>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-black text-white text-[12px] font-bold uppercase tracking-widest rounded-md inline-block mb-2">
                    TAX INVOICE
                  </span>
                  <p className="text-[14px]   text-zinc-900">Invoice #: INV-{selectedOrder.id?.slice(0, 8).toUpperCase()}</p>
                  <p className="text-[14px] text-zinc-500">
                    Date: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt.seconds ? selectedOrder.createdAt.seconds * 1000 : selectedOrder.createdAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Billed To Details */}
              <div className="grid grid-cols-2 gap-6 bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-[14px]">
                <div className="space-y-1">
                  <p className="text-[12px]   text-zinc-400 uppercase tracking-widest">Billed To (Customer):</p>
                  <p className="  text-zinc-900 text-sm">{selectedOrder.customerName || selectedOrder.shipping?.name || selectedOrder.shippingAddress?.fullName || selectedOrder.name || 'N/A'}</p>
                  <p className="text-zinc-600">{selectedOrder.userEmail || selectedOrder.customerEmail || selectedOrder.email || selectedOrder.shipping?.email || ''}</p>
                  <p className="text-zinc-600">{selectedOrder.phone || selectedOrder.shipping?.phone || selectedOrder.shippingAddress?.phone || selectedOrder.customerPhone || ''}</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-[12px]   text-zinc-400 uppercase tracking-widest">Shipping Address:</p>
                  <p className="text-zinc-800 font-medium">
                    {selectedOrder.shipping?.address || selectedOrder.shippingAddress?.street || selectedOrder.shippingAddress?.address || selectedOrder.address || ''}
                  </p>
                  <p className="text-zinc-600">
                    {[selectedOrder.shipping?.city || selectedOrder.shippingAddress?.city, selectedOrder.shipping?.state || selectedOrder.shippingAddress?.state].filter(Boolean).join(', ')}
                    {(selectedOrder.shipping?.pincode || selectedOrder.shippingAddress?.pincode) ? `, ${(selectedOrder.shipping?.pincode || selectedOrder.shippingAddress?.pincode)}` : ''}
                  </p>
                  <p className="font-semibold text-zinc-900 mt-1">Payment Method: {selectedOrder.paymentMethod || selectedOrder.payment_method || 'N/A'}</p>
                </div>
              </div>

              {/* Invoice Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px] border-collapse">
                  <thead>
                    <tr className="text-[12px]   uppercase tracking-widest text-zinc-500 border-b border-zinc-300">
                      <th className="py-2.5 px-2">Item Description</th>
                      <th className="py-2.5 px-2">Volume</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-2 text-right">Price</th>
                      <th className="py-2.5 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {(selectedOrder.items || selectedOrder.cartItems || [
                      { name: selectedOrder.productName || "Royal Oud Extrait de Parfum", size: "100ml", qty: 1, price: selectedOrder.total || selectedOrder.grandTotal || 3999 }
                    ]).map((item, idx) => {
                      const qty = parseInt(item.quantity || item.qty || 1);
                      const price = parseFloat(item.price || 3999);
                      return (
                        <tr key={idx}>
                          <td className="py-3 px-2   text-zinc-900">{item.name || item.title || "Luxury Fragrance"}</td>
                          <td className="py-3 px-2 text-zinc-600">{item.size || "100ml"}</td>
                          <td className="py-3 px-2 text-center font-semibold text-zinc-800">{qty}</td>
                          <td className="py-3 px-2 text-right font-medium text-zinc-700">₹{price.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-2 text-right   text-zinc-900">₹{(price * qty).toLocaleString('en-IN')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total Summary */}
              <div className="border-t border-zinc-300 pt-4 flex justify-end">
                <div className="w-64 space-y-2 text-[14px]">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-zinc-900">₹{Number(selectedOrder.total || selectedOrder.grandTotal || 3999).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>GST Tax (Included 18%):</span>
                    <span className="font-semibold text-zinc-900">₹{Math.round((selectedOrder.total || 3999) * 0.18).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Shipping Fee:</span>
                    <span className="  text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-black border-t border-zinc-300 pt-2">
                    <span>Grand Total:</span>
                    <span>₹{Number(selectedOrder.total || selectedOrder.grandTotal || 3999).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="border-t border-zinc-200 pt-6 flex justify-between items-center text-[12px] text-zinc-400 uppercase tracking-widest font-semibold">
                <span>Computer Generated Tax Invoice • Mahirash Perfumes</span>
                <span>Authorized Signatory</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingSystem;
