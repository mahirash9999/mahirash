import React, { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { exportToCSV } from '../../../utils/exportUtils';
import { db } from '../../../components/Firebase';
import { doc, deleteDoc } from 'firebase/firestore';

const UsersTable = ({ users, onRefresh }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const handleExportUsers = () => {
    const processedUsers = users.map(u => ({
      ...u,
      name: u.displayName || u.name || 'User',
      joinedDate: u.createdAt ? new Date(u.createdAt.toDate?.() || u.createdAt).toLocaleDateString() : '-'
    }));
    const keys = ['id', 'name', 'email', 'phone', 'joinedDate'];
    const headers = ['User ID', 'Name', 'Email Address', 'Phone Number', 'Joined Date'];
    exportToCSV(processedUsers, keys, headers, 'mahirash_users');
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map(u => u.id));
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
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} selected users?`)) return;
    setDeleting(true);
    try {
      for (const id of selectedIds) {
        await deleteDoc(doc(db, "users", id));
      }
      alert("Selected users deleted successfully!");
      setSelectedIds([]);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert("Failed to delete users: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border border-[#E9DCCB] shadow-xs overflow-hidden text-[14px]">
      <div className="px-4 sm:px-6 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#E9DCCB] bg-[#FCF9F4] gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-serif font-bold text-[#30231F]">Registered Customers</h2>
          <p className="text-[12px] sm:text-[14px] text-[#75665D] mt-0.5">All customer accounts, contact details, and signup dates</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleExportUsers}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-[#E9DCCB] rounded-xl bg-white hover:bg-[#FCF9F4] text-[12px] sm:text-[13px] font-semibold text-[#30231F] cursor-pointer transition-all shadow-xs"
          >
            <Download size={14} className="text-[#800020]" /> Export Users
          </button>
          <span className="px-3 py-1 rounded-full bg-[#800020]/10 border border-[#800020]/20 text-[#800020] text-[12px] font-semibold">
            {users.length} Users
          </span>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mx-3.5 sm:mx-6 my-3 sm:my-4 flex flex-col sm:flex-row justify-between items-center bg-[#FCF9F4] border border-[#E9DCCB] p-3.5 sm:p-4 rounded-xl gap-3 animate-fadeIn">
          <div className="text-[13px] font-semibold text-[#30231F]">
            {selectedIds.length} user(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#800020] hover:bg-[#650018] text-white rounded-lg text-[12px] sm:text-[13px] font-semibold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>{deleting ? "Deleting..." : "Delete Selected"}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3.5 py-2 bg-[#E9DCCB]/50 hover:bg-[#E9DCCB] text-[#30231F] rounded-lg text-[12px] sm:text-[13px] font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead className="bg-[#FCF9F4] border-b border-[#E9DCCB]">
            <tr className="text-[12px] font-semibold text-[#75665D] uppercase tracking-wider">
              <th className="px-6 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={users.length > 0 && selectedIds.length === users.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-[#800020] cursor-pointer rounded border-[#E9DCCB]"
                />
              </th>
              <th className="px-6 py-3.5">Name</th>
              <th className="px-6 py-3.5">Email</th>
              <th className="px-6 py-3.5">Phone</th>
              <th className="px-6 py-3.5">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9DCCB]/50">
            {users.map((user) => (
              <tr key={user.id} className={`hover:bg-[#FCF9F4]/70 transition-colors ${selectedIds.includes(user.id) ? 'bg-[#FCF9F4]' : ''}`}>
                <td className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.id)}
                    onChange={() => toggleSelectRow(user.id)}
                    className="w-4 h-4 accent-[#800020] cursor-pointer rounded border-[#E9DCCB]"
                  />
                </td>
                <td className="px-6 py-4 text-[#30231F] font-semibold">
                  {user.displayName || user.name || "User"}
                </td>
                <td className="px-6 py-4 text-[#75665D]">
                  {user.email || "-"}
                </td>
                <td className="px-6 py-4 text-[#75665D]">
                  {user.phone || "-"}
                </td>
                <td className="px-6 py-4 text-[#75665D] text-[14px]">
                  {user.createdAt ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-[#75665D]"
                >
                  No users found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default UsersTable;
