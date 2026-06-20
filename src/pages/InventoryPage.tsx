import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { Warehouse, ArrowDownToLine, ArrowUpFromLine, AlertTriangle, RotateCcw, Package } from 'lucide-react';
import { format } from 'date-fns';
import { exportToCSV } from '@/utils/pdfGenerator';

export function InventoryPage() {
  const { products, inventoryLogs, adjustStock, settings } = useStore();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'overview' | 'history' | 'alerts'>('overview');
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ productId: '', quantity: 0, type: 'in' as 'in' | 'out' | 'adjustment' | 'damage' | 'expired', notes: '' });

  const lowStock = products.filter(p => p.stockQuantity <= p.reorderLevel && p.stockQuantity > 0 && p.isActive);
  const outOfStock = products.filter(p => p.stockQuantity === 0 && p.isActive);
  const expiringSoon = products.filter(p => {
    if (!p.expiryDate) return false;
    const days = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days <= 30 && days > 0;
  });

  const handleAdjust = () => {
    if (!adjustForm.productId || adjustForm.quantity <= 0) {
      showToast('error', 'Select product and enter valid quantity');
      return;
    }
    adjustStock(adjustForm.productId, adjustForm.quantity, adjustForm.type, adjustForm.notes);
    showToast('success', 'Stock adjusted successfully');
    setShowAdjust(false);
    setAdjustForm({ productId: '', quantity: 0, type: 'in', notes: '' });
  };

  const inventoryColumns = [
    {
      key: 'name', label: 'Product', sortable: true,
      render: (p: Record<string, unknown>) => {
        const prod = p as unknown as typeof products[0];
        return (
          <div className="flex items-center gap-2">
            <Package size={16} className="text-primary-500" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{prod.name}</p>
              <p className="text-xs text-gray-500">{prod.sku}</p>
            </div>
          </div>
        );
      }
    },
    { key: 'unit', label: 'Unit', render: (p: Record<string, unknown>) => <span className="text-sm">{String(p.unit)}</span> },
    {
      key: 'stockQuantity', label: 'Current Stock', sortable: true,
      render: (p: Record<string, unknown>) => {
        const prod = p as unknown as typeof products[0];
        const isLow = prod.stockQuantity <= prod.reorderLevel;
        return (
          <span className={`text-sm font-semibold ${prod.stockQuantity === 0 ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}>
            {prod.stockQuantity}
          </span>
        );
      }
    },
    { key: 'reorderLevel', label: 'Reorder Level', render: (p: Record<string, unknown>) => <span className="text-sm">{String(p.reorderLevel)}</span> },
    {
      key: 'sellingPrice', label: 'Stock Value', sortable: true,
      render: (p: Record<string, unknown>) => {
        const prod = p as unknown as typeof products[0];
        return <span className="text-sm font-medium">{settings.currencySymbol}{(prod.purchasePrice * prod.stockQuantity).toLocaleString('en-IN')}</span>;
      }
    },
    {
      key: 'expiryDate', label: 'Expiry',
      render: (p: Record<string, unknown>) => {
        const prod = p as unknown as typeof products[0];
        if (!prod.expiryDate) return <span className="text-xs text-gray-400">N/A</span>;
        const days = Math.ceil((new Date(prod.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return (
          <span className={`text-xs font-medium ${days <= 0 ? 'text-rose-600' : days <= 30 ? 'text-amber-600' : 'text-gray-500'}`}>
            {format(new Date(prod.expiryDate), 'dd MMM yyyy')}
          </span>
        );
      }
    },
  ];

  const logColumns = [
    {
      key: 'productName', label: 'Product',
      render: (l: Record<string, unknown>) => <span className="text-sm font-medium">{String(l.productName)}</span>
    },
    {
      key: 'type', label: 'Type',
      render: (l: Record<string, unknown>) => {
        const colors: Record<string, string> = {
          in: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
          out: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          adjustment: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
          damage: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
          expired: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          transfer: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
        };
        return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors[String(l.type)] || ''}`}>{String(l.type)}</span>;
      }
    },
    { key: 'quantity', label: 'Qty', render: (l: Record<string, unknown>) => <span className="text-sm font-medium">{String(l.quantity)}</span> },
    {
      key: 'previousStock', label: 'Stock Change',
      render: (l: Record<string, unknown>) => <span className="text-xs text-gray-500">{String(l.previousStock)} → {String(l.newStock)}</span>
    },
    { key: 'reference', label: 'Reference', render: (l: Record<string, unknown>) => <span className="text-xs text-gray-500">{String(l.reference)}</span> },
    {
      key: 'createdAt', label: 'Date',
      render: (l: Record<string, unknown>) => <span className="text-xs text-gray-500">{format(new Date(String(l.createdAt)), 'dd MMM yyyy HH:mm')}</span>
    },
  ];

  const totalStockValue = products.reduce((sum, p) => sum + p.purchasePrice * p.stockQuantity, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Inventory Management</h2>
          <p className="text-sm text-gray-500">Total stock value: {settings.currencySymbol}{totalStockValue.toLocaleString('en-IN')}</p>
        </div>
        <button onClick={() => setShowAdjust(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
          <RotateCcw size={16} /> Stock Adjustment
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1">
            <Warehouse size={16} className="text-blue-500" />
            <span className="text-sm text-gray-500">Total Products</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.filter(p => p.isActive).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-amber-500" />
            <span className="text-sm text-gray-500">Low Stock</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{lowStock.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-rose-200 dark:border-rose-800">
          <div className="flex items-center gap-2 mb-1">
            <ArrowDownToLine size={16} className="text-rose-500" />
            <span className="text-sm text-gray-500">Out of Stock</span>
          </div>
          <p className="text-2xl font-bold text-rose-600">{outOfStock.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-1">
            <ArrowUpFromLine size={16} className="text-orange-500" />
            <span className="text-sm text-gray-500">Expiring Soon</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{expiringSoon.length}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['overview', 'history', 'alerts'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <DataTable
            columns={inventoryColumns}
            data={products.filter(p => p.isActive) as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search inventory..."
            searchKeys={['name', 'sku']}
            pageSize={12}
            onExportCSV={() => {
              const headers = ['Product', 'SKU', 'Stock', 'Reorder Level', 'Unit', 'Stock Value'];
              const data = products.map(p => [p.name, p.sku, p.stockQuantity.toString(), p.reorderLevel.toString(), p.unit, (p.purchasePrice * p.stockQuantity).toString()]);
              exportToCSV('Inventory', headers, data);
              showToast('success', 'Inventory exported');
            }}
          />
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
          <DataTable
            columns={logColumns}
            data={[...inventoryLogs].reverse() as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search logs..."
            searchKeys={['productName', 'type', 'reference']}
            pageSize={15}
          />
        </div>
      )}

      {tab === 'alerts' && (
        <div className="space-y-4">
          {lowStock.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-amber-200 dark:border-amber-800">
              <h3 className="font-semibold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2"><AlertTriangle size={16} /> Low Stock Items</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {lowStock.map(p => (
                  <div key={p.id} className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg flex items-center justify-between">
                    <div><p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p><p className="text-xs text-gray-500">Reorder: {p.reorderLevel}</p></div>
                    <span className="text-lg font-bold text-amber-600">{p.stockQuantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {outOfStock.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-rose-200 dark:border-rose-800">
              <h3 className="font-semibold text-rose-700 dark:text-rose-400 mb-3">Out of Stock Items</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {outOfStock.map(p => (
                  <div key={p.id} className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-rose-600 font-medium mt-1">OUT OF STOCK</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {expiringSoon.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-orange-200 dark:border-orange-800">
              <h3 className="font-semibold text-orange-700 dark:text-orange-400 mb-3">Expiring Soon</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {expiringSoon.map(p => {
                  const days = Math.ceil((new Date(p.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={p.id} className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-orange-600 font-medium mt-1">Expires in {days} days</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {lowStock.length === 0 && outOfStock.length === 0 && expiringSoon.length === 0 && (
            <div className="text-center py-12 text-gray-400">No alerts at this time</div>
          )}
        </div>
      )}

      <Modal isOpen={showAdjust} onClose={() => setShowAdjust(false)} title="Stock Adjustment" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
            <select value={adjustForm.productId} onChange={e => setAdjustForm({ ...adjustForm, productId: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select Product</option>
              {products.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stockQuantity})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adjustment Type</label>
            <select value={adjustForm.type} onChange={e => setAdjustForm({ ...adjustForm, type: e.target.value as typeof adjustForm.type })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustment (Set to)</option>
              <option value="damage">Damaged</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
            <input type="number" value={adjustForm.quantity || ''} onChange={e => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea value={adjustForm.notes} onChange={e => setAdjustForm({ ...adjustForm, notes: e.target.value })} rows={2} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowAdjust(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
            <button onClick={handleAdjust} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save Adjustment</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
