import React, { useState, useEffect } from 'react';
import { db } from '../../../components/Firebase';
import { collection, getDocs } from 'firebase/firestore';
import { BarChart3, TrendingUp, DollarSign, ShoppingBag, Users, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';

const AnalyticsView = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [usersCount, setUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRealAnalyticsData = async () => {
      setLoading(true);
      try {
        const orderSnap = await getDocs(collection(db, 'orders'));
        const orderList = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(orderList);

        const prodSnap = await getDocs(collection(db, 'products'));
        const prodList = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setProducts(prodList);

        const userSnap = await getDocs(collection(db, 'users'));
        setUsersCount(userSnap.size || 0);
      } catch (err) {
        console.error("Error fetching live analytics data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRealAnalyticsData();
  }, []);

  // Time range calculation
  const now = new Date();
  const getPeriodFilter = (range) => {
    if (range === '7d') return new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    if (range === '90d') return new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    if (range === 'ytd') return new Date(now.getFullYear(), 0, 1);
    return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // default 30d
  };

  const currentPeriodStart = getPeriodFilter(timeRange);
  const periodDuration = now.getTime() - currentPeriodStart.getTime();
  const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodDuration);

  // Filter orders by time range
  const parseOrderDate = (o) => {
    if (o.createdAt?.toDate) return o.createdAt.toDate();
    if (o.createdAt?.seconds) return new Date(o.createdAt.seconds * 1000);
    if (o.createdAt) return new Date(o.createdAt);
    if (o.date) return new Date(o.date);
    return new Date();
  };

  const getOrderAmount = (o) => {
    const val = parseFloat(o.total || o.grandTotal || o.totalAmount || o.totalPrice || 0);
    return isNaN(val) ? 0 : val;
  };

  const currentOrders = orders.filter(o => parseOrderDate(o) >= currentPeriodStart);
  const previousOrders = orders.filter(o => {
    const d = parseOrderDate(o);
    return d >= previousPeriodStart && d < currentPeriodStart;
  });

  const totalGrossRevenue = currentOrders.reduce((sum, o) => sum + getOrderAmount(o), 0);
  const prevGrossRevenue = previousOrders.reduce((sum, o) => sum + getOrderAmount(o), 0);

  const completedOrdersCount = currentOrders.length;
  const prevOrdersCount = previousOrders.length;

  const aov = completedOrdersCount > 0 ? Math.round(totalGrossRevenue / completedOrdersCount) : 0;
  const prevAov = prevOrdersCount > 0 ? Math.round(prevGrossRevenue / prevOrdersCount) : 0;

  const conversionRate = completedOrdersCount > 0 && usersCount > 0
    ? ((completedOrdersCount / usersCount) * 100).toFixed(1)
    : "0";

  let revChange = 0;
  if (prevGrossRevenue > 0) {
    revChange = (((totalGrossRevenue - prevGrossRevenue) / prevGrossRevenue) * 100).toFixed(1);
  } else if (totalGrossRevenue > 0) {
    revChange = "100";
  }

  let ordersChange = 0;
  if (prevOrdersCount > 0) {
    ordersChange = (((completedOrdersCount - prevOrdersCount) / prevOrdersCount) * 100).toFixed(1);
  } else if (completedOrdersCount > 0) {
    ordersChange = "100";
  }

  let aovChange = 0;
  if (prevAov > 0) {
    aovChange = (((aov - prevAov) / prevAov) * 100).toFixed(1);
  }

  // --- Dynamic Category Revenue Share from Actual Sales ---
  const categorySalesMap = {};
  // Collect all known categories from catalog to show a comprehensive list
  products.forEach(p => {
    const cat = (p.category || 'Luxury Perfumes').trim();
    if (!categorySalesMap[cat]) {
      categorySalesMap[cat] = 0;
    }
  });

  // Calculate actual revenue from orders in current time range
  let totalOrderItemsRevenue = 0;
  currentOrders.forEach(o => {
    const items = o.items || o.cartItems || [];
    items.forEach(item => {
      let cat = item.category;
      if (!cat) {
        const matchedProd = products.find(p =>
          (item.id && p.id === item.id) ||
          (item.productId && p.id === item.productId) ||
          (item.name && p.name && item.name.toLowerCase().trim() === p.name.toLowerCase().trim())
        );
        cat = matchedProd?.category || 'Eau de Parfum';
      }
      cat = cat.trim();

      const itemQty = parseInt(item.quantity || item.qty || 1, 10) || 1;
      const itemPrice = parseFloat(item.price || item.size_price || item.selectedSize?.price || 0) || 0;
      const itemTotal = itemPrice * itemQty;

      categorySalesMap[cat] = (categorySalesMap[cat] || 0) + itemTotal;
      totalOrderItemsRevenue += itemTotal;
    });
  });

  // Sort categories by revenue desc
  const categoryPerformance = Object.keys(categorySalesMap)
    .map(catName => {
      const rev = categorySalesMap[catName];
      const divisor = totalOrderItemsRevenue > 0 ? totalOrderItemsRevenue : (totalGrossRevenue > 0 ? totalGrossRevenue : 0);
      const share = divisor > 0 ? ((rev / divisor) * 100).toFixed(1) : "0.0";
      return {
        name: catName,
        revNum: rev,
        revenue: `₹${Math.round(rev).toLocaleString('en-IN')}`,
        share: `${share}%`
      };
    })
    .sort((a, b) => b.revNum - a.revNum);

  // --- Payment Channel Breakdown with Smart Fuzzy Matching ---
  let upiTotal = 0;
  let cardsTotal = 0;
  let codTotal = 0;

  currentOrders.forEach(o => {
    const amount = getOrderAmount(o);
    const method = String(o.paymentMethod || o.payment_method || '').toLowerCase().trim();
    const mode = String(o.paymentMode || o.payment_mode || '').toLowerCase().trim();
    const provider = String(o.paymentProvider || '').toLowerCase().trim();

    if (method === 'cod' || mode === 'cod' || method.includes('cash') || provider.includes('cash')) {
      codTotal += amount;
    } else if (
      mode === 'card' ||
      mode === 'credit' ||
      mode === 'debit' ||
      method.includes('card') ||
      mode.includes('card') ||
      mode === 'netbanking'
    ) {
      cardsTotal += amount;
    } else {
      // Online payment via UPI or generic online
      upiTotal += amount;
    }
  });

  const totalChannelRev = upiTotal + cardsTotal + codTotal;

  const upiPercent = totalChannelRev > 0 ? Math.round((upiTotal / totalChannelRev) * 100) : 0;
  const cardsPercent = totalChannelRev > 0 ? Math.round((cardsTotal / totalChannelRev) * 100) : 0;
  const codPercent = totalChannelRev > 0 ? Math.round((codTotal / totalChannelRev) * 100) : 0;

  const channelBreakdown = [
    {
      channel: "UPI / Online Payment",
      percentage: upiPercent,
      revenue: `₹${Math.round(upiTotal).toLocaleString('en-IN')}`,
      color: "bg-[#800020]"
    },
    {
      channel: "Cards & NetBanking (Razorpay)",
      percentage: cardsPercent,
      revenue: `₹${Math.round(cardsTotal).toLocaleString('en-IN')}`,
      color: "bg-[#B88D46]"
    },
    ...(codTotal > 0 ? [{
      channel: "Historical COD Orders",
      percentage: codPercent,
      revenue: `₹${Math.round(codTotal).toLocaleString('en-IN')}`,
      color: "bg-[#75665D]"
    }] : [])
  ];

  return (
    <div className="space-y-6 text-[#30231F] font-['Inter',sans-serif]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-xs">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#30231F] uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="text-[#800020]" size={22} /> Live Store Analytics & Performance
          </h2>
          <p className="text-[14px] text-[#75665D] mt-1">Real-time revenue, conversion ratios, and transaction channel diagnostics from Firestore.</p>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[#75665D]" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3.5 py-2 bg-[#FCF9F4] border border-[#E9DCCB] rounded-xl text-[14px] font-semibold text-[#30231F] outline-none focus:border-[#800020] focus:ring-1 focus:ring-[#800020]/20 transition-all cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 3 Months</option>
            <option value="ytd">Year to Date (YTD)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[14px] text-[#75665D] font-medium">Loading live store metrics...</div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-[#E9DCCB] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#75665D] uppercase tracking-widest">Total Gross Revenue</span>
                <div className="p-2 bg-[#800020]/10 text-[#800020] border border-[#800020]/20 rounded-xl"><DollarSign size={16} /></div>
              </div>
              <h3 className="text-2xl font-serif text-[#30231F]">₹{Math.round(totalGrossRevenue).toLocaleString('en-IN')}</h3>
              <div className={`flex items-center gap-1.5 text-[13px] ${parseFloat(revChange) >= 0 ? "text-[#800020] font-medium" : "text-red-500"}`}>
                {parseFloat(revChange) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} <span>{parseFloat(revChange) >= 0 ? "+" : ""}{revChange}% vs last period</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E9DCCB] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#75665D] uppercase tracking-widest">Completed Orders</span>
                <div className="p-2 bg-[#800020]/10 text-[#800020] border border-[#800020]/20 rounded-xl"><ShoppingBag size={16} /></div>
              </div>
              <h3 className="text-2xl font-serif text-[#30231F]">{completedOrdersCount}</h3>
              <div className={`flex items-center gap-1.5 text-[13px] ${parseFloat(ordersChange) >= 0 ? "text-[#800020] font-medium" : "text-red-500"}`}>
                {parseFloat(ordersChange) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} <span>{parseFloat(ordersChange) >= 0 ? "+" : ""}{ordersChange}% vs last period</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E9DCCB] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#75665D] uppercase tracking-widest">Average Order Value</span>
                <div className="p-2 bg-[#800020]/10 text-[#800020] border border-[#800020]/20 rounded-xl"><TrendingUp size={16} /></div>
              </div>
              <h3 className="text-2xl font-serif text-[#30231F]">₹{aov.toLocaleString('en-IN')}</h3>
              <div className={`flex items-center gap-1.5 text-[13px] ${parseFloat(aovChange) >= 0 ? "text-[#800020] font-medium" : "text-red-500"}`}>
                {parseFloat(aovChange) >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} <span>{parseFloat(aovChange) >= 0 ? "+" : ""}{aovChange}% vs last period</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E9DCCB] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#75665D] uppercase tracking-widest">Store Conversion Rate</span>
                <div className="p-2 bg-[#800020]/10 text-[#800020] border border-[#800020]/20 rounded-xl"><Users size={16} /></div>
              </div>
              <h3 className="text-2xl font-serif text-[#30231F]">{conversionRate}%</h3>
              <div className="flex items-center gap-1.5 text-[13px] text-[#75665D] font-medium">
                <span>{usersCount} registered users</span>
              </div>
            </div>
          </div>

          {/* Grid: Traffic Channels & Category Revenue */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Channel Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-xs space-y-5">
              <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#30231F] border-b border-[#E9DCCB] pb-3">
                Payment Channel Breakdown
              </h3>
              <div className="space-y-4">
                {channelBreakdown.map((item) => (
                  <div key={item.channel} className="space-y-1.5">
                    <div className="flex justify-between text-[14px] font-semibold text-[#30231F]">
                      <span>{item.channel}</span>
                      <span className="font-mono text-[#800020]">{item.revenue} ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-[#FCF9F4] border border-[#E9DCCB]/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {totalChannelRev === 0 && (
                <p className="text-xs text-[#75665D] italic pt-1">No transactions recorded in this period.</p>
              )}
            </div>

            {/* Category Share */}
            <div className="bg-white p-6 rounded-2xl border border-[#E9DCCB] shadow-xs space-y-5">
              <h3 className="text-sm font-serif font-bold uppercase tracking-wider text-[#30231F] border-b border-[#E9DCCB] pb-3">
                Revenue Share by Category
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px] border-collapse">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-widest text-[#75665D] border-b border-[#E9DCCB]">
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Revenue Total</th>
                      <th className="pb-3 text-right">Revenue Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9DCCB]/60">
                    {categoryPerformance.map((cat) => (
                      <tr key={cat.name} className="hover:bg-[#FCF9F4] transition-colors">
                        <td className="py-3 font-semibold text-[#30231F]">{cat.name}</td>
                        <td className="py-3 font-mono text-[#30231F]">{cat.revenue}</td>
                        <td className="py-3 text-right font-mono font-semibold text-[#800020]">{cat.share}</td>
                      </tr>
                    ))}
                    {categoryPerformance.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-[#75665D]">No categories recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsView;
