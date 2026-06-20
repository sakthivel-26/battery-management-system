import React, { useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { StatCard } from '@/components/ui/StatCard';
import {
  DollarSign, TrendingUp, Package, AlertTriangle,
  Clock, Users, ShoppingBag, ArrowUpRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { format } from 'date-fns';

export function DashboardPage() {
  const { sales, products, customers, expenses, settings, getRevenueByDate, getTopSellingProducts, darkMode } = useStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr) && s.status === 'completed');
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
  const todayProfit = todaySales.reduce((sum, s) => {
    const cost = s.items.reduce((c, item) => {
      const prod = products.find(p => p.id === item.productId);
      return c + (prod?.purchasePrice || 0) * item.quantity;
    }, 0);
    return sum + (s.grandTotal - cost);
  }, 0);

  const lowStockProducts = products.filter(p => p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0);
  const outOfStockProducts = products.filter(p => p.stockQuantity === 0);
  const pendingPayments = sales.filter(s => s.paymentStatus === 'pending').reduce((sum, s) => sum + s.grandTotal, 0);

  const revenueData = useMemo(() => getRevenueByDate(14), [sales]);
  const topProducts = useMemo(() => getTopSellingProducts(8), [sales]);
  const recentSales = sales.filter(s => s.status === 'completed').slice(-10).reverse();

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryDistribution = useMemo(() => {
    const catMap = new Map<string, number>();
    const { categories } = useStore.getState();
    sales.filter(s => s.status === 'completed').forEach(sale => {
      sale.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          const cat = categories.find(c => c.id === product.categoryId);
          const name = cat?.name || 'Other';
          catMap.set(name, (catMap.get(name) || 0) + item.totalAmount);
        }
      });
    });
    return Array.from(catMap.entries()).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [sales, products]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  const gridColor = darkMode ? '#374151' : '#e5e7eb';
  const tickColor = darkMode ? '#9ca3af' : '#6b7280';
  const tooltipBg = darkMode ? '#1f2937' : '#ffffff';
  const tooltipBorder = darkMode ? '#374151' : '#e5e7eb';
  const tooltipText = darkMode ? '#f3f4f6' : '#111827';

  const customTooltipStyle = {
    backgroundColor: tooltipBg,
    border: `1px solid ${tooltipBorder}`,
    borderRadius: '8px',
    padding: '8px 12px',
    color: tooltipText,
    fontSize: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={todaySales.length.toString()}
          icon={ShoppingBag}
          color="blue"
          change={`${todaySales.length} transactions`}
          changeType="neutral"
        />
        <StatCard
          title="Today's Revenue"
          value={`${settings.currencySymbol}${todayRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
          icon={DollarSign}
          color="green"
          change="Total income today"
          changeType="positive"
        />
        <StatCard
          title="Today's Profit"
          value={`${settings.currencySymbol}${todayProfit.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`}
          icon={TrendingUp}
          color="purple"
          change="Net profit"
          changeType="positive"
        />
        <StatCard
          title="Total Products"
          value={products.filter(p => p.isActive).length.toString()}
          icon={Package}
          color="cyan"
          change={`${outOfStockProducts.length} out of stock`}
          changeType={outOfStockProducts.length > 0 ? 'negative' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Low Stock Items"
          value={lowStockProducts.length.toString()}
          icon={AlertTriangle}
          color="amber"
          change="Need reorder"
          changeType={lowStockProducts.length > 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          title="Pending Payments"
          value={`${settings.currencySymbol}${pendingPayments.toLocaleString('en-IN')}`}
          icon={Clock}
          color="rose"
          change="Credit sales"
          changeType={pendingPayments > 0 ? 'negative' : 'neutral'}
        />
        <StatCard
          title="Total Customers"
          value={customers.length.toString()}
          icon={Users}
          color="blue"
          change="Registered customers"
          changeType="neutral"
        />
        <StatCard
          title="Total Expenses"
          value={`${settings.currencySymbol}${totalExpenses.toLocaleString('en-IN')}`}
          icon={ArrowUpRight}
          color="rose"
          change="All time"
          changeType="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue & Profit (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: tickColor }} tickFormatter={v => format(new Date(v), 'dd MMM')} stroke={gridColor} />
              <YAxis tick={{ fontSize: 11, fill: tickColor }} stroke={gridColor} />
              <Tooltip
                contentStyle={customTooltipStyle}
                labelFormatter={v => format(new Date(v as string), 'dd MMM yyyy')}
                formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" name="Revenue" />
              <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" name="Profit" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Sales by Category</h3>
          {categoryDistribution.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${(name || '').toString().slice(0, 8)}${(name || '').toString().length > 8 ? '..' : ''} ${((percent || 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {categoryDistribution.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={customTooltipStyle}
                    formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryDistribution.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-gray-600 dark:text-gray-400 flex-1 truncate">{cat.name}</span>
                    <span className="font-medium text-gray-900 dark:text-white">₹{cat.value.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-400 dark:text-gray-500 text-sm">No sales data yet</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Selling Products</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis type="number" tick={{ fontSize: 11, fill: tickColor }} stroke={gridColor} />
                <YAxis dataKey="productName" type="category" width={120} tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} />
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 dark:text-gray-500 text-sm">No sales data yet. Make some sales first!</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {recentSales.length > 0 ? recentSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{sale.invoiceNumber}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{sale.customerName} · {format(new Date(sale.createdAt), 'dd MMM, hh:mm a')}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">₹{sale.grandTotal.toLocaleString('en-IN')}</p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    sale.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {sale.paymentMethod.toUpperCase()}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-sm">No transactions yet</div>
            )}
          </div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
          <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} /> Low Stock Alerts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {lowStockProducts.map(p => (
              <div key={p.id} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Stock: {p.stockQuantity}</span>
                  <span className="text-xs text-amber-600 dark:text-amber-400">Reorder: {p.reorderLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
