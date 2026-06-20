import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/Toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { Download, FileText, TrendingUp, DollarSign, Package, Users } from 'lucide-react';
import { generateReportPDF, exportToCSV } from '@/utils/pdfGenerator';

type ReportType = 'sales' | 'profit' | 'products' | 'inventory' | 'customers' | 'tax' | 'expenses';
type Period = 'today' | 'week' | 'month' | 'year' | 'custom';

export function ReportsPage() {
  const { sales, products, customers, expenses, categories, settings, getTopSellingProducts, getRevenueByDate, darkMode } = useStore();
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [period, setPeriod] = useState<Period>('month');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const getDateRange = (): [Date, Date] => {
    const now = new Date();
    switch (period) {
      case 'today': return [new Date(now.setHours(0, 0, 0, 0)), new Date()];
      case 'week': return [startOfWeek(now), endOfWeek(now)];
      case 'month': return [startOfMonth(now), endOfMonth(now)];
      case 'year': return [new Date(now.getFullYear(), 0, 1), new Date()];
      case 'custom': return [new Date(startDate), new Date(endDate + 'T23:59:59')];
    }
  };

  const [rangeStart, rangeEnd] = getDateRange();
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const d = new Date(s.createdAt);
      return d >= rangeStart && d <= rangeEnd && s.status === 'completed';
    });
  }, [sales, rangeStart, rangeEnd]);

  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalDiscount = filteredSales.reduce((sum, s) => sum + s.totalDiscount, 0);
  const totalGst = filteredSales.reduce((sum, s) => sum + s.totalGst, 0);
  const totalProfit = filteredSales.reduce((sum, s) => {
    const cost = s.items.reduce((c, item) => {
      const prod = products.find(p => p.id === item.productId);
      return c + (prod?.purchasePrice || 0) * item.quantity;
    }, 0);
    return sum + (s.grandTotal - cost);
  }, 0);

  const revenueData = useMemo(() => getRevenueByDate(period === 'today' ? 1 : period === 'week' ? 7 : period === 'month' ? 30 : 90), [sales, period]);
  const topProducts = useMemo(() => getTopSellingProducts(10), [sales]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= rangeStart && d <= rangeEnd;
    });
  }, [expenses, rangeStart, rangeEnd]);

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    filteredExpenses.forEach(e => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [filteredExpenses]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#84cc16'];

  const gridColor = darkMode ? '#374151' : '#e5e7eb';
  const tickColor = darkMode ? '#9ca3af' : '#6b7280';
  const tooltipStyle = {
    backgroundColor: darkMode ? '#1f2937' : '#ffffff',
    border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
    borderRadius: '8px',
    padding: '8px 12px',
    color: darkMode ? '#f3f4f6' : '#111827',
    fontSize: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };

  const handleExportPDF = () => {
    const periodLabel = period === 'custom' ? `${startDate} to ${endDate}` : period;
    if (reportType === 'sales') {
      generateReportPDF(
        `Sales Report - ${periodLabel}`, ['Invoice', 'Customer', 'Amount', 'GST', 'Discount', 'Payment', 'Date'],
        filteredSales.map(s => [s.invoiceNumber, s.customerName, `₹${s.grandTotal.toFixed(2)}`, `₹${s.totalGst.toFixed(2)}`, `₹${s.totalDiscount.toFixed(2)}`, s.paymentMethod, format(new Date(s.createdAt), 'dd/MM/yyyy')]),
        settings,
        [{ label: 'Total Revenue', value: `₹${totalRevenue.toFixed(2)}` }, { label: 'Total GST', value: `₹${totalGst.toFixed(2)}` }, { label: 'Total Discount', value: `₹${totalDiscount.toFixed(2)}` }, { label: 'Total Transactions', value: filteredSales.length.toString() }]
      );
    } else if (reportType === 'products') {
      generateReportPDF(
        `Product Performance Report`, ['Product', 'Total Qty Sold', 'Revenue'],
        topProducts.map(p => [p.productName, p.totalQty.toString(), `₹${p.totalRevenue.toFixed(2)}`]),
        settings
      );
    } else if (reportType === 'inventory') {
      generateReportPDF(
        'Inventory Report', ['Product', 'SKU', 'Stock', 'Reorder Level', 'Unit', 'Stock Value'],
        products.filter(p => p.isActive).map(p => [p.name, p.sku, p.stockQuantity.toString(), p.reorderLevel.toString(), p.unit, `₹${(p.purchasePrice * p.stockQuantity).toFixed(2)}`]),
        settings,
        [{ label: 'Total Stock Value', value: `₹${products.reduce((s, p) => s + p.purchasePrice * p.stockQuantity, 0).toFixed(2)}` }]
      );
    } else if (reportType === 'tax') {
      generateReportPDF(
        `GST/Tax Report - ${periodLabel}`, ['Invoice', 'Customer', 'Taxable Amount', 'GST Amount', 'GST %', 'Date'],
        filteredSales.flatMap(s => s.items.map(item => [s.invoiceNumber, s.customerName, `₹${(item.totalAmount - item.gstAmount).toFixed(2)}`, `₹${item.gstAmount.toFixed(2)}`, `${item.gstPercentage}%`, format(new Date(s.createdAt), 'dd/MM/yyyy')])),
        settings,
        [{ label: 'Total GST Collected', value: `₹${totalGst.toFixed(2)}` }]
      );
    } else if (reportType === 'expenses') {
      generateReportPDF(
        `Expense Report - ${periodLabel}`, ['Date', 'Category', 'Description', 'Amount', 'Payment'],
        filteredExpenses.map(e => [e.date, e.category, e.description, `₹${e.amount.toFixed(2)}`, e.paymentMethod]),
        settings,
        [{ label: 'Total Expenses', value: `₹${totalExpenses.toFixed(2)}` }]
      );
    }
    showToast('success', 'Report downloaded');
  };

  const handleExportCSV = () => {
    if (reportType === 'sales') {
      exportToCSV('Sales_Report', ['Invoice', 'Customer', 'Amount', 'GST', 'Discount', 'Payment', 'Date'], filteredSales.map(s => [s.invoiceNumber, s.customerName, s.grandTotal.toString(), s.totalGst.toString(), s.totalDiscount.toString(), s.paymentMethod, format(new Date(s.createdAt), 'dd/MM/yyyy')]));
    } else if (reportType === 'products') {
      exportToCSV('Products_Report', ['Product', 'Qty Sold', 'Revenue'], topProducts.map(p => [p.productName, p.totalQty.toString(), p.totalRevenue.toString()]));
    } else if (reportType === 'inventory') {
      exportToCSV('Inventory_Report', ['Product', 'SKU', 'Stock', 'Unit', 'Value'], products.map(p => [p.name, p.sku, p.stockQuantity.toString(), p.unit, (p.purchasePrice * p.stockQuantity).toString()]));
    }
    showToast('success', 'CSV exported');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h2>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"><Download size={14} /> CSV</button>
          <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700"><FileText size={14} /> PDF</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {([['sales', 'Sales'], ['profit', 'P&L'], ['products', 'Products'], ['inventory', 'Inventory'], ['tax', 'Tax/GST'], ['expenses', 'Expenses'], ['customers', 'Customers']] as const).map(([id, label]) => (
          <button key={id} onClick={() => setReportType(id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${reportType === id ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{label}</button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {(['today', 'week', 'month', 'year', 'custom'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${period === p ? 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}>{p}</button>
        ))}
        {period === 'custom' && (
          <div className="flex gap-2 items-center">
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none" />
            <span className="text-xs text-gray-400">to</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none" />
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1"><DollarSign size={14} className="text-emerald-500" /><span className="text-xs text-gray-500">Revenue</span></div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{settings.currencySymbol}{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1"><TrendingUp size={14} className="text-blue-500" /><span className="text-xs text-gray-500">Profit</span></div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{settings.currencySymbol}{totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1"><Package size={14} className="text-purple-500" /><span className="text-xs text-gray-500">Transactions</span></div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{filteredSales.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1"><Users size={14} className="text-amber-500" /><span className="text-xs text-gray-500">Expenses</span></div>
          <p className="text-xl font-bold text-rose-600">{settings.currencySymbol}{totalExpenses.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Charts */}
      {(reportType === 'sales' || reportType === 'profit') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue & Profit Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} tickFormatter={v => format(new Date(v), 'dd MMM')} stroke={gridColor} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={v => format(new Date(v as string), 'dd MMM yyyy')} formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
              <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {reportType === 'products' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Selling Products</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="productName" tick={{ fontSize: 9, fill: tickColor }} angle={-20} textAnchor="end" height={60} stroke={gridColor} />
                <YAxis tick={{ fontSize: 10, fill: tickColor }} stroke={gridColor} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                <Bar dataKey="totalRevenue" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-12 text-gray-400">No data available</div>}
        </div>
      )}

      {reportType === 'inventory' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Inventory Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-center"><p className="text-xs text-gray-500">In Stock</p><p className="text-2xl font-bold text-emerald-600">{products.filter(p => p.stockQuantity > p.reorderLevel).length}</p></div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center"><p className="text-xs text-gray-500">Low Stock</p><p className="text-2xl font-bold text-amber-600">{products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.reorderLevel).length}</p></div>
            <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-center"><p className="text-xs text-gray-500">Out of Stock</p><p className="text-2xl font-bold text-rose-600">{products.filter(p => p.stockQuantity === 0).length}</p></div>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {products.filter(p => p.isActive).sort((a, b) => a.stockQuantity - b.stockQuantity).map(p => (
              <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                <span className="font-medium text-gray-900 dark:text-white">{p.name}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2"><div className={`h-2 rounded-full ${p.stockQuantity === 0 ? 'bg-rose-500' : p.stockQuantity <= p.reorderLevel ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, (p.stockQuantity / Math.max(p.reorderLevel * 3, 1)) * 100)}%` }} /></div>
                  <span className="text-xs font-medium w-12 text-right text-gray-700 dark:text-gray-300">{p.stockQuantity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reportType === 'tax' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">GST Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center"><p className="text-xs text-gray-500 dark:text-gray-400">0% GST</p><p className="text-lg font-bold text-gray-900 dark:text-white">{settings.currencySymbol}{filteredSales.reduce((s, sale) => s + sale.items.filter(i => i.gstPercentage === 0).reduce((a, i) => a + i.totalAmount, 0), 0).toFixed(2)}</p></div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center"><p className="text-xs text-gray-500 dark:text-gray-400">5% GST</p><p className="text-lg font-bold text-gray-900 dark:text-white">{settings.currencySymbol}{filteredSales.reduce((s, sale) => s + sale.items.filter(i => i.gstPercentage === 5).reduce((a, i) => a + i.gstAmount, 0), 0).toFixed(2)}</p></div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center"><p className="text-xs text-gray-500 dark:text-gray-400">12% GST</p><p className="text-lg font-bold text-gray-900 dark:text-white">{settings.currencySymbol}{filteredSales.reduce((s, sale) => s + sale.items.filter(i => i.gstPercentage === 12).reduce((a, i) => a + i.gstAmount, 0), 0).toFixed(2)}</p></div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center"><p className="text-xs text-gray-500 dark:text-gray-400">18% GST</p><p className="text-lg font-bold text-gray-900 dark:text-white">{settings.currencySymbol}{filteredSales.reduce((s, sale) => s + sale.items.filter(i => i.gstPercentage === 18).reduce((a, i) => a + i.gstAmount, 0), 0).toFixed(2)}</p></div>
          </div>
          <p className="text-right text-lg font-bold text-gray-900 dark:text-white">Total GST Collected: {settings.currencySymbol}{totalGst.toFixed(2)}</p>
        </div>
      )}

      {reportType === 'expenses' && expenseByCategory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Expenses by Category</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={expenseByCategory} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name}) => name || ''}>
                  {expenseByCategory.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, '']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Expense Breakdown</h3>
            <div className="space-y-2">
              {expenseByCategory.sort((a, b) => b.value - a.value).map((cat, idx) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{cat.name}</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{settings.currencySymbol}{cat.value.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {reportType === 'customers' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Customer Report</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {customers.map(c => {
              const custSales = sales.filter(s => s.customerId === c.id && s.status === 'completed');
              const totalSpent = custSales.reduce((s, sale) => s + sale.grandTotal, 0);
              return (
                <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">{c.name.charAt(0)}</div>
                    <div><p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</p></div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{settings.currencySymbol}{totalSpent.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{custSales.length} orders · {c.loyaltyPoints} pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reportType === 'profit' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Profit & Loss Statement</h3>
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"><span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total Revenue</span><span className="font-bold text-emerald-700">{settings.currencySymbol}{totalRevenue.toFixed(2)}</span></div>
            <div className="flex justify-between p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg"><span className="text-sm font-medium text-rose-700 dark:text-rose-400">Total Expenses</span><span className="font-bold text-rose-700">{settings.currencySymbol}{totalExpenses.toFixed(2)}</span></div>
            <div className="flex justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><span className="text-sm font-medium text-blue-700 dark:text-blue-400">Gross Profit</span><span className="font-bold text-blue-700">{settings.currencySymbol}{totalProfit.toFixed(2)}</span></div>
            <div className={`flex justify-between p-3 rounded-lg ${totalProfit - totalExpenses >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-rose-100 dark:bg-rose-900/30'}`}>
              <span className="text-sm font-bold text-gray-900 dark:text-white">Net Profit/Loss</span>
              <span className={`font-bold text-lg ${totalProfit - totalExpenses >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{settings.currencySymbol}{(totalProfit - totalExpenses).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
