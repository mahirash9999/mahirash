// SuperAdmin.jsx
import React, { useState, useEffect } from "react";
import { ProductForm } from "../Admin/Admin";
import { db } from "../../components/Firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";

const sidebarItems = [
  "Dashboard",
  "Products",
  "Orders",
  "Categories",
  "Inventory",
  "Users",
  "Settings",
];

const metricCards = [
  { label: "Total Products", value: "1,240", trend: "+32 this month" },
  { label: "Total Orders", value: "8,532", trend: "+124 today" },
  { label: "Revenue", value: "₹1,28,430", trend: "Last 30 days" },
];

const orderRows = [
  { id: "#98234", customer: "Ariana Dell", total: "₹124.00", status: "Paid" },
  { id: "#98215", customer: "Michael Lee", total: "₹89.00", status: "Pending" },
  { id: "#98198", customer: "Sofia Park", total: "₹212.00", status: "Shipped" },
];

const statusBadgeClasses = (status) => {
  switch (status) {
    case "In Stock":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Low Stock":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "Paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Pending":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "Shipped":
      return "bg-sky-50 text-sky-700 border-sky-100";
    default:
      return "bg-slate-50 text-slate-700 border-slate-100";
  }
};

const SuperAdmin = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  const [currentProductsPage, setCurrentProductsPage] = useState(1);
  const [currentOrdersPage, setCurrentOrdersPage] = useState(1);
  const [currentUsersPage, setCurrentUsersPage] = useState(1);
  const itemsPerPage = 10;

  const loadProducts = async () => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    setProducts(list);
  };

  const loadUsers = async () => {
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    } catch (error) {
      console.log("Note: Users collection may not exist yet or error fetching users");
    }
  };

  useEffect(() => {
    loadProducts();
    loadUsers();
  }, []);

  const handleDeleteProduct = async (id) => {
    await deleteDoc(doc(db, "products", id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const renderContentHeader = () => (
    <header className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Super Admin Panel
        </h1>
        <p className="mt-1 text-sm font-medium tracking-wide text-[#811331] uppercase">
          {activeItem}
        </p>
      </div>
      <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-full bg-white shadow-sm border border-slate-100">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-sm font-medium text-slate-600">
          System status: <span className="font-semibold text-slate-900">Online</span>
        </span>
      </div>
    </header>
  );

  const renderMetricCards = () => (
    <section className="grid gap-5 md:grid-cols-3 mb-10">
      {metricCards.map((card) => (
        <article
          key={card.label}
          className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-150"
        >
          <div className="p-5">
            <p className="text-sm font-medium tracking-wide text-slate-500 uppercase">
              {card.label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">
              {card.value}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {card.trend}
            </p>
          </div>
          <div className="h-1.5 w-full rounded-b-xl bg-gradient-to-r from-[#811331] via-rose-400 to-amber-300" />
        </article>
      ))}
    </section>
  );

  const renderProductsTable = () => (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Products</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of all catalog items
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsProductModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-[#811331] text-white text-sm font-medium shadow-sm hover:bg-[#650f27]"
          >
            Add Product
          </button>
          <span className="px-3 py-1 rounded-full bg-[#811331]/5 text-sm font-medium text-[#811331]">
            {products.length} items
          </span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/60">
            <tr className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Suitable For</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.slice((currentProductsPage - 1) * itemsPerPage, currentProductsPage * itemsPerPage).map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3 text-slate-900 font-medium">
                  {row.name}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {row.category || "-"}
                </td>
                <td className="px-5 py-3 text-slate-900">
                  ₹{Number(row.price || 0).toFixed(2)}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {row.suitable_for || "-"}
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full border text-sm font-medium ${statusBadgeClasses(
                      row.stock_status || "In Stock"
                    )}`}
                  >
                    {row.stock_status || "In Stock"}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(row.id)}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-6 text-center text-sm text-slate-500"
                >
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {products.length > itemsPerPage && (
          <div className="flex justify-between items-center px-5 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              Showing {(currentProductsPage - 1) * itemsPerPage + 1} to {Math.min(currentProductsPage * itemsPerPage, products.length)} of {products.length} products
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentProductsPage(p => Math.max(1, p - 1))}
                disabled={currentProductsPage === 1}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentProductsPage(p => Math.min(Math.ceil(products.length / itemsPerPage), p + 1))}
                disabled={currentProductsPage === Math.ceil(products.length / itemsPerPage)}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const renderOrdersTable = () => (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Latest customer activity across channels
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-slate-50 text-sm font-medium text-slate-600">
          Updated just now
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/60">
            <tr className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              <th className="px-5 py-3">Order</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Total</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orderRows.slice((currentOrdersPage - 1) * itemsPerPage, currentOrdersPage * itemsPerPage).map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3 font-medium text-slate-900">
                  {row.id}
                </td>
                <td className="px-5 py-3 text-slate-600">{row.customer}</td>
                <td className="px-5 py-3 text-slate-900">{row.total}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full border text-sm font-medium ${statusBadgeClasses(
                      row.status
                    )}`}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orderRows.length > itemsPerPage && (
          <div className="flex justify-between items-center px-5 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              Showing {(currentOrdersPage - 1) * itemsPerPage + 1} to {Math.min(currentOrdersPage * itemsPerPage, orderRows.length)} of {orderRows.length} orders
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentOrdersPage(p => Math.max(1, p - 1))}
                disabled={currentOrdersPage === 1}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentOrdersPage(p => Math.min(Math.ceil(orderRows.length / itemsPerPage), p + 1))}
                disabled={currentOrdersPage === Math.ceil(orderRows.length / itemsPerPage)}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const renderUsersTable = () => (
    <section className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Users</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            All registered users in the system
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-[#811331]/5 text-sm font-medium text-[#811331]">
          {users.length} users
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50/60">
            <tr className="text-sm font-medium text-slate-500 uppercase tracking-wide">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Phone</th>
              <th className="px-5 py-3">Address</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.slice((currentUsersPage - 1) * itemsPerPage, currentUsersPage * itemsPerPage).map((user) => (
              <tr key={user.id} className="hover:bg-slate-50/60">
                <td className="px-5 py-3 text-slate-900 font-medium">
                  {user.displayName || user.name || "-"}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {user.email || "-"}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {user.phone || "-"}
                </td>
                <td className="px-5 py-3 text-slate-600">
                  {user.address || "-"}
                </td>
                <td className="px-5 py-3 text-slate-600 text-sm">
                  {user.createdAt
                    ? new Date(user.createdAt.toDate?.() || user.createdAt).toLocaleDateString()
                    : "-"
                  }
                </td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full border text-sm font-medium bg-emerald-50 text-emerald-700 border-emerald-100">
                    Active
                  </span>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-6 text-center text-sm text-slate-500"
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {users.length > itemsPerPage && (
          <div className="flex justify-between items-center px-5 py-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">
              Showing {(currentUsersPage - 1) * itemsPerPage + 1} to {Math.min(currentUsersPage * itemsPerPage, users.length)} of {users.length} users
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentUsersPage(p => Math.max(1, p - 1))}
                disabled={currentUsersPage === 1}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentUsersPage(p => Math.min(Math.ceil(users.length / itemsPerPage), p + 1))}
                disabled={currentUsersPage === Math.ceil(users.length / itemsPerPage)}
                className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );

  const renderMainContent = () => {
    switch (activeItem) {
      case "Products":
        return (
          <>
            {renderMetricCards()}
            {renderProductsTable()}
          </>
        );
      case "Orders":
        return (
          <>
            {renderMetricCards()}
            {renderOrdersTable()}
          </>
        );
      case "Users":
        return (
          <>
            {renderMetricCards()}
            {renderUsersTable()}
          </>
        );
      default:
        return (
          <>
            {renderMetricCards()}
            <div className="grid gap-6 lg:grid-cols-2">
              {renderProductsTable()}
              {renderOrdersTable()}
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-100 bg-white/80 backdrop-blur-sm flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-[#811331] text-white flex items-center justify-center text-sm font-semibold shadow-sm">
              SA
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">
                Super Admin
              </p>
              <p className="text-sm text-slate-500">Control Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {sidebarItems.map((item) => {
            const isActive = item === activeItem;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setActiveItem(item)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                    ? "bg-[#811331]/10 text-[#811331]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
              >
                <span>{item}</span>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#811331]" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-slate-100 text-sm text-slate-500">
          <p className="font-medium text-slate-700">Session</p>
          <p>Last synced a few moments ago</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6 md:px-10 md:py-8">
        {renderContentHeader()}
        {renderMainContent()}
      </main>

      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Add New Product
                </h2>
                <p className="text-sm text-slate-500">
                  Super admins can upload products directly to the catalog.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-sm font-medium text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            <div className="px-6 py-5">
              <ProductForm
                onSuccess={async () => {
                  setIsProductModalOpen(false);
                  await loadProducts();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdmin;



