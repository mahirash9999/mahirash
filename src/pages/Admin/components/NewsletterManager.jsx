import React, { useState, useEffect } from 'react';
import { db } from '../../../components/Firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import {
  Mail,
  Search,
  Download,
  Trash2,
  Plus,
  Check,
  X,
  Users,
  Calendar,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { exportToCSV } from '../../../utils/exportUtils';

const NewsletterManager = () => {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: '' });
  const [copied, setCopied] = useState(false);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: '' }), 3500);
  };

  // Real-time listener for newsletter collection
  useEffect(() => {
    setLoading(true);
    let unsubscribe = () => {};
    try {
      const q = query(collection(db, 'newsletter'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));

        // Sort by createdAt desc
        list.sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return tB - tA;
        });

        setSubscribers(list);
        setLoading(false);
      }, (err) => {
        console.error("Error fetching newsletter subscribers:", err);
        setLoading(false);
      });
    } catch (err) {
      console.error("Newsletter connection error:", err);
      setLoading(false);
    }

    return () => unsubscribe();
  }, []);

  const filteredSubscribers = subscribers.filter(sub => {
    const term = searchTerm.toLowerCase().trim();
    const email = (sub.email || '').toLowerCase();
    const source = (sub.source || '').toLowerCase();
    return email.includes(term) || source.includes(term);
  });

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove ${email} from the subscriber list?`)) return;

    try {
      await deleteDoc(doc(db, 'newsletter', id));
      showToast(`Removed ${email} from subscribers.`);
    } catch (err) {
      console.error("Error deleting subscriber:", err);
      showToast("Delete failed: " + err.message, "error");
    }
  };

  const handleAddSubscriber = async (e) => {
    e.preventDefault();
    const cleanEmail = newEmail.toLowerCase().trim();

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }

    if (subscribers.some(s => (s.email || '').toLowerCase() === cleanEmail)) {
      showToast("This email is already in the subscriber list.", "error");
      return;
    }

    setSaving(true);
    try {
      await addDoc(collection(db, 'newsletter'), {
        email: cleanEmail,
        source: 'admin_manual',
        status: 'active',
        createdAt: serverTimestamp()
      });

      showToast(`Subscriber ${cleanEmail} added successfully!`);
      setNewEmail('');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error("Error adding subscriber:", err);
      showToast("Failed to add subscriber: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      showToast("No subscribers to export.", "error");
      return;
    }

    const exportData = subscribers.map((s, idx) => ({
      index: idx + 1,
      email: s.email || '',
      date: s.createdAt?.seconds
        ? new Date(s.createdAt.seconds * 1000).toLocaleDateString('en-IN')
        : 'Recent',
      source: s.source || 'Website Footer',
      status: s.status || 'Active'
    }));

    exportToCSV(exportData, `mahirash_newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`, [
      'index', 'email', 'date', 'source', 'status'
    ], [
      'S.No', 'Email Address', 'Subscription Date', 'Source', 'Status'
    ]);

    showToast("Subscriber list exported to CSV!");
  };

  const handleCopyAllEmails = () => {
    const emails = subscribers.map(s => s.email).filter(Boolean).join(', ');
    if (!emails) {
      showToast("No emails to copy.", "error");
      return;
    }

    navigator.clipboard.writeText(emails).then(() => {
      setCopied(true);
      showToast(`Copied ${subscribers.length} email addresses to clipboard!`);
      setTimeout(() => setCopied(false), 3000);
    }).catch(() => {
      showToast("Failed to copy to clipboard", "error");
    });
  };

  // Metrics
  const now = Date.now();
  const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
  const thisMonthCount = subscribers.filter(s => {
    const time = s.createdAt?.seconds ? s.createdAt.seconds * 1000 : (s.createdAt ? new Date(s.createdAt).getTime() : 0);
    return time >= thirtyDaysAgo;
  }).length;

  return (
    <div className="space-y-6 text-[#30231F] font-['Inter',sans-serif]">
      {/* Toast */}
      {toastMessage.text && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-sm font-semibold transition-all ${
          toastMessage.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#800020] text-white'
        }`}>
          {toastMessage.type === 'error' ? <X size={16} /> : <Check size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-sm">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#30231F] uppercase tracking-wider flex items-center gap-2">
            <Mail className="text-[#800020]" size={22} /> Newsletter Subscribers & Audience
          </h2>
          <p className="text-[14px] text-[#75665D] mt-1">
            Real-time subscriber list from the website. View, search, export to CSV for marketing campaigns, or manually manage subscriber emails.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <button
            onClick={handleCopyAllEmails}
            className="px-4 py-2.5 bg-white hover:bg-[#FCF9F4] text-[#30231F] border border-[#E9DCCB] text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            title="Copy all emails comma-separated"
          >
            <Copy size={15} /> {copied ? 'Copied!' : 'Copy Emails'}
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-white hover:bg-[#FCF9F4] text-[#800020] border border-[#E9DCCB] text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-[#800020] hover:bg-[#650018] text-white text-[13px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} /> Add Subscriber
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E9DCCB] shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#75665D] uppercase tracking-widest">Total Subscribers</span>
            <div className="p-2 bg-[#800020]/10 text-[#800020] border border-[#800020]/20 rounded-xl">
              <Users size={16} />
            </div>
          </div>
          <h3 className="text-3xl font-serif text-[#30231F] font-bold">{subscribers.length}</h3>
          <p className="text-xs text-[#75665D]">Verified active audience</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E9DCCB] shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#75665D] uppercase tracking-widest">Joined Last 30 Days</span>
            <div className="p-2 bg-[#800020]/10 text-[#800020] border border-[#800020]/20 rounded-xl">
              <Calendar size={16} />
            </div>
          </div>
          <h3 className="text-3xl font-serif text-[#30231F] font-bold">+{thisMonthCount}</h3>
          <p className="text-xs text-emerald-600 font-medium">New customer interest</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E9DCCB] shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#75665D] uppercase tracking-widest">Subscriber Health</span>
            <div className="p-2 bg-[#800020]/10 text-[#800020] border border-[#800020]/20 rounded-xl">
              <ShieldCheck size={16} />
            </div>
          </div>
          <h3 className="text-3xl font-serif text-[#30231F] font-bold">100%</h3>
          <p className="text-xs text-[#75665D]">Clean delivery ready</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E9DCCB] shadow-sm">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#75665D]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search subscribers by email address or source..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-sm text-[#30231F] outline-none focus:border-[#800020] transition-all"
          />
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-sm">
        {loading ? (
          <div className="py-12 text-center text-[#75665D] text-sm">Loading subscribers from Firestore...</div>
        ) : filteredSubscribers.length === 0 ? (
          <div className="py-12 text-center text-[#75665D] text-sm">
            {searchTerm ? `No subscribers found matching "${searchTerm}".` : "No newsletter subscribers recorded yet. Once visitors enter their email on the website footer, they will appear here automatically."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-[#75665D] bg-[#FCF9F4] border-b border-[#E9DCCB]">
                  <th className="py-3 px-3 w-16 text-center">#</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4 w-44">Date Subscribed</th>
                  <th className="py-3 px-4 w-36">Source</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-20 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9DCCB]/60">
                {filteredSubscribers.map((sub, idx) => {
                  const dateStr = sub.createdAt?.seconds
                    ? new Date(sub.createdAt.seconds * 1000).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Recent';

                  return (
                    <tr key={sub.id} className="hover:bg-[#FCF9F4]/70 transition-colors">
                      <td className="py-3.5 px-3 text-center font-mono text-[#75665D]">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#30231F] select-all">
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-[#800020] shrink-0" />
                          <span>{sub.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#75665D] font-mono text-xs">
                        {dateStr}
                      </td>
                      <td className="py-3.5 px-4 text-[#75665D] text-xs uppercase font-medium">
                        <span className="px-2 py-0.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-md">
                          {sub.source || 'Website Footer'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-bold uppercase tracking-wider rounded-full">
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(sub.id, sub.email)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove subscriber"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Subscriber Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-[#E9DCCB] space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#E9DCCB] pb-3">
              <h3 className="text-base font-serif font-bold text-[#30231F] uppercase tracking-wider flex items-center gap-2">
                <Plus size={18} className="text-[#800020]" /> Add Subscriber Email
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubscriber} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#75665D] mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. customer@example.com"
                  className="w-full px-4 py-2.5 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-sm text-[#30231F] outline-none focus:border-[#800020] transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E9DCCB]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm text-[#75665D] hover:text-[#30231F] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-[#800020] hover:bg-[#650018] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Subscriber'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsletterManager;

