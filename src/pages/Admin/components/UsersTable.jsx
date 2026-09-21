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
    <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden text-[14px]">
      <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-200">
        <div>
          <h2 className="text-lg font-poppins text-zinc-900">Registered Users</h2>
          <p className="text-[14px] text-zinc-500 mt-0.5">All customers and their details</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportUsers}
            className="flex items-center gap-1.5 px-4 py-2 border border-zinc-300 rounded-lg bg-white hover:bg-zinc-50 text-[13px] font-semibold text-zinc-700 cursor-pointer transition-all shadow-sm"
          >
            <Download size={14} /> Export Users
          </button>
          <span className="px-3.5 py-1.5 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-800 text-[14px]">
            {users.length} Users
          </span>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mx-6 my-4 flex flex-col sm:flex-row justify-between items-center bg-zinc-50 border border-zinc-200 p-4 rounded-xl gap-3 animate-fadeIn">
          <div className="text-[13px] font-semibold text-zinc-700">
            {selectedIds.length} user(s) selected
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-[13px] font-semibold cursor-pointer transition-colors shadow-sm disabled:opacity-50"
            >
              <Trash2 size={13} />
              <span>{deleting ? "Deleting..." : "Delete Selected"}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-700 rounded text-[13px] font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-100 animate-fadeIn">
            <tr className="text-[11px] text-zinc-700 uppercase tracking-widest">
              <th className="px-6 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={users.length > 0 && selectedIds.length === users.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-black cursor-pointer rounded border-zinc-300"
                />
              </th>
              <th className="px-6 py-3.5">Name</th>
              <th className="px-6 py-3.5">Email</th>
              <th className="px-6 py-3.5">Phone</th>
              <th className="px-6 py-3.5">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {users.map((user) => (
              <tr key={user.id} className={`hover:bg-zinc-50/80 transition-colors ${selectedIds.includes(user.id) ? 'bg-zinc-50' : ''}`}>
                <td className="px-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.id)}
                    onChange={() => toggleSelectRow(user.id)}
                    className="w-4 h-4 accent-black cursor-pointer rounded border-zinc-300"
                  />
                </td>
                <td className="px-6 py-4 text-zinc-900 font-semibold">
                  {user.displayName || user.name || "User"}
                </td>
                <td className="px-6 py-4 text-zinc-600">
                  {user.email || "-"}
                </td>
                <td className="px-6 py-4 text-zinc-600">
                  {user.phone || "-"}
                </td>
                <td className="px-6 py-4 text-zinc-500 text-[14px]">
                  {user.createdAt ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString() : "-"}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-zinc-500"
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
