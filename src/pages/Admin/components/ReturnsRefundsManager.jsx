import React, { useState, useEffect } from 'react';
import { db } from '../../../components/Firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Undo2, Plus, CheckCircle, Clock, XCircle, AlertCircle, Trash2, Search, X } from 'lucide-react';

const ReturnsRefundsManager = () => {
  const [returnsList, setReturnsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    orderId: "",
    customerName: "",
    customerEmail: "",
    productName: "",
    reason: "Size Issue",
    amount: 0,
    status: "Requested"
  });

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'returns'));
      if (snap.empty) {
        setReturnsList([]);
      } else {
        setReturnsList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    } catch (err) {
      console.error("Error fetching returns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const item = returnsList.find(r => r.id === id);
      if (!item) return;
      const updated = { ...item, status: newStatus };
      await setDoc(doc(db, 'returns', id), updated);
      setReturnsList(prev => prev.map(r => r.id === id ? updated : r));
      alert(`Return ${id} status updated to ${newStatus}!`);
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDeleteReturn = async (id) => {
    if (!confirm("Are you sure you want to delete this return record?")) return;
    try {
      await deleteDoc(doc(db, 'returns', id));
      setReturnsList(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const newId = `RET-${Math.floor(1000 + Math.random() * 9000)}`;
      const docData = {
        id: newId,
        ...formData,
        amount: Number(formData.amount) || 0,
        requestDate: new Date().toISOString().slice(0, 10)
      };
      await setDoc(doc(db, 'returns', newId), docData);
      alert("Return request created!");
      setIsModalOpen(false);
      fetchReturns();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filteredReturns = returnsList.filter(r => {
    const matchesSearch = r.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.id?.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;
    return r.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-6 text-[#30231F] font-['Inter',sans-serif]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FCF9F4] p-6 rounded-2xl border border-[#E9DCCB] shadow-xs">
        <div>
          <h2 className="text-xl font-serif text-[#30231F] font-bold tracking-wide flex items-center gap-2">
            <Undo2 className="text-[#800020]" size={22} /> Customer Returns & Refund Operations
          </h2>
          <p className="text-[14px] text-[#75665D] mt-1">Manage return tickets, review customer dispute claims, and authorize refunds.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#800020] hover:bg-[#650018] text-white font-semibold text-[14px] rounded-xl shadow-md shadow-[#800020]/25 transition-all cursor-pointer"
        >
          <Plus size={15} /> Create Return Ticket
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-[#FCF9F4] p-4 rounded-2xl border border-[#E9DCCB] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#75665D]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search return by ticket ID, order ID, or customer name..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E9DCCB] rounded-xl text-[14px] text-[#30231F] outline-none focus:border-[#800020] transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#E9DCCB]/40 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-1.5 text-[14px] font-semibold rounded-lg transition-all ${statusFilter === "all" ? "bg-[#800020] text-white shadow-sm" : "text-[#75665D] hover:text-[#800020]"}`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("requested")}
            className={`px-3.5 py-1.5 text-[14px] font-semibold rounded-lg transition-all ${statusFilter === "requested" ? "bg-[#800020] text-white shadow-sm" : "text-[#75665D] hover:text-[#800020]"}`}
          >
            Requested
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`px-3.5 py-1.5 text-[14px] font-semibold rounded-lg transition-all ${statusFilter === "approved" ? "bg-[#800020] text-white shadow-sm" : "text-[#75665D] hover:text-[#800020]"}`}
          >
            Approved
          </button>
          <button
            onClick={() => setStatusFilter("refunded")}
            className={`px-3.5 py-1.5 text-[14px] font-semibold rounded-lg transition-all ${statusFilter === "refunded" ? "bg-[#800020] text-white shadow-sm" : "text-[#75665D] hover:text-[#800020]"}`}
          >
            Refunded
          </button>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-[14px] text-[#75665D]">Loading returns tickets...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead>
                <tr className="text-[12px] font-semibold uppercase tracking-wider text-[#75665D] bg-[#FCF9F4] border-b border-[#E9DCCB]">
                  <th className="py-3 px-3">Ticket ID</th>
                  <th className="py-3 px-3">Order ID</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Item Name</th>
                  <th className="py-3 px-3">Reason</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9DCCB]/50">
                {filteredReturns.map((r) => (
                  <tr key={r.id} className="hover:bg-[#FCF9F4]/70 transition-colors">
                    <td className="py-3.5 px-3 font-mono text-[#30231F] font-semibold">{r.id}</td>
                    <td className="py-3.5 px-3 font-mono text-[#75665D]">{r.orderId}</td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-[#30231F]">{r.customerName}</p>
                      <p className="text-[12px] text-[#75665D]">{r.customerEmail}</p>
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-[#30231F]">{r.productName}</td>
                    <td className="py-3.5 px-3 text-[#75665D] max-w-[180px] truncate" title={r.reason}>{r.reason}</td>
                    <td className="py-3.5 px-3 font-semibold text-[#30231F]">₹{(r.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-0.5 rounded text-[12px] font-semibold ${r.status === "Refunded" ? "bg-[#800020]/10 text-[#800020] border border-[#800020]/25" :
                        r.status === "Approved" ? "bg-[#800020]/10 text-[#800020] border border-[#800020]/25" :
                          r.status === "Rejected" ? "bg-stone-100 text-[#75665D] border border-[#E9DCCB]" :
                            "bg-[#B88D46]/15 text-[#B88D46] border border-[#B88D46]/30"
                        }`}>
                        {r.status?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        {r.status === "Requested" && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, "Approved")}
                            className="px-2.5 py-1 bg-[#800020]/10 text-[#800020] border border-[#800020]/25 hover:bg-[#800020]/15 rounded text-[12px] font-semibold transition-all"
                          >
                            Approve
                          </button>
                        )}
                        {(r.status === "Requested" || r.status === "Approved") && (
                          <button
                            onClick={() => handleUpdateStatus(r.id, "Refunded")}
                            className="px-2.5 py-1 bg-[#800020] hover:bg-[#650018] text-white rounded text-[12px] font-semibold transition-all shadow-xs"
                          >
                            Refund
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteReturn(r.id)}
                          className="p-1.5 text-[#75665D] hover:text-[#800020] rounded hover:bg-[#800020]/10 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredReturns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-[#75665D] text-[14px]">No return records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleCreateSubmit} className="bg-[#FCF9F4] border border-[#E9DCCB] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#E9DCCB] pb-3">
              <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#30231F]">Create Return Ticket</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-[#75665D] hover:text-[#800020] p-1 rounded-full">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-[14px]">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#75665D] uppercase tracking-wider block">Order ID</label>
                <input type="text" value={formData.orderId} onChange={e => setFormData(prev => ({ ...prev, orderId: e.target.value }))} required className="w-full px-3 py-2 bg-white border border-[#E9DCCB] text-[#30231F] rounded-lg outline-none focus:border-[#800020]" placeholder="ORD-9842" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#75665D] uppercase tracking-wider block">Customer Name</label>
                <input type="text" value={formData.customerName} onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))} required className="w-full px-3 py-2 bg-white border border-[#E9DCCB] text-[#30231F] rounded-lg outline-none focus:border-[#800020]" placeholder="Aarav Sharma" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#75665D] uppercase tracking-wider block">Customer Email</label>
                <input type="email" value={formData.customerEmail} onChange={e => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))} required className="w-full px-3 py-2 bg-white border border-[#E9DCCB] text-[#30231F] rounded-lg outline-none focus:border-[#800020]" placeholder="aarav@gmail.com" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#75665D] uppercase tracking-wider block">Product Name</label>
                <input type="text" value={formData.productName} onChange={e => setFormData(prev => ({ ...prev, productName: e.target.value }))} required className="w-full px-3 py-2 bg-white border border-[#E9DCCB] text-[#30231F] rounded-lg outline-none focus:border-[#800020]" placeholder="Royal Oud Extrait" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#75665D] uppercase tracking-wider block">Refund Amount (₹)</label>
                <input type="number" value={formData.amount} onChange={e => setFormData(prev => ({ ...prev, amount: e.target.value }))} required className="w-full px-3 py-2 bg-white border border-[#E9DCCB] text-[#30231F] rounded-lg outline-none focus:border-[#800020]" placeholder="3999" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#75665D] uppercase tracking-wider block">Return Reason</label>
                <input type="text" value={formData.reason} onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))} required className="w-full px-3 py-2 bg-white border border-[#E9DCCB] text-[#30231F] rounded-lg outline-none focus:border-[#800020]" placeholder="Fragrance Note Issue / Damage" />
              </div>
            </div>

            <div className="pt-3 border-t border-[#E9DCCB] flex justify-end gap-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-[#E9DCCB] rounded-lg text-[14px] font-semibold text-[#30231F] hover:bg-[#E9DCCB]/40">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-[#800020] hover:bg-[#650018] text-white rounded-lg text-[14px] font-semibold shadow-md shadow-[#800020]/25">Create Ticket</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReturnsRefundsManager;
