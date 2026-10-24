import React, { useEffect, useState } from 'react';
import { Package, ShoppingCart, IndianRupee, Users } from 'lucide-react';
import { db } from '../../../components/Firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const MetricCards = () => {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [productsSnap, ordersSnap, usersSnap] = await Promise.all([
          getDocs(collection(db, "products")),
          getDocs(collection(db, "orders")),
          getDocs(collection(db, "users"))
        ]);

        const totalRevenue = ordersSnap.docs.reduce((acc, doc) => {
          const data = doc.data();
          return data.status === 'confirmed' ? acc + (Number(data.total) || 0) : acc;
        }, 0);

        setStats({
          products: productsSnap.size,
          orders: ordersSnap.docs.filter(d => d.data().status === 'confirmed').length,
          revenue: totalRevenue,
          users: usersSnap.size
        });
      } catch (error) {
        console.error("Error fetching metrics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const metricCards = [
    {
      label: "Total Products",
      value: loading ? "..." : stats.products,
      hint: "Across all categories",
      icon: Package,
      color: "text-[#800020]",
      bg: "bg-[#800020]/10 border border-[#800020]/20"
    },
    {
      label: "Open Orders",
      value: loading ? "..." : stats.orders,
      hint: "Confirmed & Pending",
      icon: ShoppingCart,
      color: "text-[#650018]",
      bg: "bg-[#650018]/10 border border-[#650018]/20"
    },
    {
      label: "Total Revenue",
      value: loading ? "..." : `₹${stats.revenue.toLocaleString('en-IN')}`,
      hint: "Lifetime earnings",
      icon: IndianRupee,
      color: "text-[#800020]",
      bg: "bg-[#800020]/10 border border-[#B88D46]/30"
    },
    {
      label: "Active Users",
      value: loading ? "..." : stats.users,
      hint: "Registered customers",
      icon: Users,
      color: "text-[#800020]",
      bg: "bg-[#FCF9F4] border border-[#E9DCCB]"
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5 mb-6 sm:mb-10">
      {metricCards.map((card) => {
        const Icon = card.icon;
        return (
          <article
            key={card.label}
            className="bg-white rounded-2xl border border-[#E9DCCB] shadow-xs hover:shadow-md transition-all duration-300 group"
          >
            <div className="p-4 sm:p-6">
              <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${card.bg} ${card.color} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform`}>
                <Icon size={22} strokeWidth={2} />
              </div>
              <p className="text-[11px] font-bold tracking-wider text-[#75665D] uppercase mb-1">
                {card.label}
              </p>
              <p className="text-2xl sm:text-3xl font-serif font-bold text-[#30231F] mb-1">
                {card.value}
              </p>
              <p className="text-[12px] font-medium text-[#75665D]">
                {card.hint}
              </p>
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default MetricCards;
