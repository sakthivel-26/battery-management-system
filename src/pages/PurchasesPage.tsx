import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { Plus, CheckCircle, Package, Trash2 } from 'lucide-react';
import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';
import type { Purchase, PurchaseItem } from '@/types';

export function PurchasesPage() {
  const { purchases, suppliers, products, addPurchase, receivePurchase, settings } = useStore();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState('');

  const addItem = () => {
    setItems([...items, { id: uuid(), productId: '', productName: '', quantity: 1, unitPrice: 0, gstPercentage: 0, gstAmount: 0, totalAmount: 0 }]);
  };

  const updateItem = (idx: number, field: string, value: string | number) => {
    const newItems = [...items];
    const item = { ...newItems[idx] };
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        item.productId = product.id;
        item.productName = product.name;
        item.unitPrice = product.purchasePrice;
        item.gstPercentage = product.gstPercentage;
      }
    } else {
      (item as any)[field] = value;
    }
    const subtotal = item.unitPrice * item.quantity;
    item.gstAmount = Math.round(subtotal * item.gstPercentage / 100 * 100) / 100;
    item.totalAmount = Math.round((subtotal + item.gstAmount) * 100) / 100;
    newItems[idx] = item;
    setItems(newItems);
  };

  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const totals = items.reduce((acc, item) => ({
    subtotal: acc.subtotal + item.unitPrice * item.quantity,
    gst: acc.gst + item.gstAmount,
    total: acc.total + item.totalAmount,
  }), { subtotal: 0, gst: 0, total: 0 });

  const handleCreate = () => {
    if (!supplierId || items.length === 0) { showToast('error', 'Select supplier and add items'); return; }
    if (items.some(i => !i.productId || i.quantity <= 0)) { showToast('error', 'Fill all item details'); return; }
    const supplier = suppliers.find(s => s.id === supplierId);
    addPurchase({
      supplierId, supplierName: supplier?.name || '', items,
      subtotal: Math.round(totals.subtotal * 100) / 100,
      totalGst: Math.round(totals.gst * 100) / 100,
      grandTotal: Math.round(totals.total * 100) / 100,
      paymentStatus: 'pending', paidAmount: 0, status: 'ordered', notes,
      createdBy: useStore.getState().currentUser?.name || 'System',
    });
    showToast('success', 'Purchase order created');
    setShowModal(false);
    setSupplierId('');
    setItems([]);
    setNotes('');
  };

  const handleReceive = (id: string) => {
    receivePurchase(id);
    showToast('success', 'Purchase received - stock updated');
  };

  const columns = [
    {
      key: 'purchaseOrderNumber', label: 'PO Number', sortable: true,
      render: (p: Record<string, unknown>) => <span className="text-sm font-medium text-primary-600">{String(p.purchaseOrderNumber)}</span>
    },
    { key: 'supplierName', label: 'Supplier', render: (p: Record<string, unknown>) => <span className="text-sm">{String(p.supplierName)}</span> },
    {
      key: 'grandTotal', label: 'Total', sortable: true,
      render: (p: Record<string, unknown>) => <span className="text-sm font-semibold">{settings.currencySymbol}{Number(p.grandTotal).toLocaleString('en-IN')}</span>
    },
    {
      key: 'status', label: 'Status',
      render: (p: Record<string, unknown>) => {
        const colors: Record<string, string> = { ordered: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', received: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', cancelled: 'bg-rose-100 text-rose-700' };
        return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors[String(p.status)] || ''}`}>{String(p.status)}</span>;
      }
    },
    {
      key: 'createdAt', label: 'Date',
      render: (p: Record<string, unknown>) => <span className="text-xs text-gray-500">{format(new Date(String(p.createdAt)), 'dd MMM yyyy')}</span>
    },
    {
      key: 'actions', label: 'Actions',
      render: (p: Record<string, unknown>) => {
        const purchase = p as unknown as Purchase;
        return purchase.status === 'ordered' ? (
          <button onClick={() => handleReceive(purchase.id)} className="flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-xs font-medium">
            <CheckCircle size={12} /> Receive
          </button>
        ) : <span className="text-xs text-gray-400">-</span>;
      }
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Purchase Orders</h2><p className="text-sm text-gray-500">{purchases.length} orders</p></div>
        <button onClick={() => { setShowModal(true); addItem(); }} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"><Plus size={16} /> New Purchase</button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <DataTable columns={columns} data={[...purchases].reverse() as unknown as Record<string, unknown>[]} searchPlaceholder="Search orders..." searchKeys={['purchaseOrderNumber', 'supplierName']} pageSize={10} />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Purchase Order" size="full">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Supplier *</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                <option value="">Select Supplier</option>
                {suppliers.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <input type="text" value={notes} onChange={e => setNotes(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Unit Price</th><th className="px-3 py-2">GST%</th><th className="px-3 py-2">Total</th><th className="px-3 py-2 w-10"></th></tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2">
                      <select value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none text-gray-900 dark:text-white">
                        <option value="">Select</option>
                        {products.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-3 py-2"><input type="number" value={item.quantity || ''} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} min="1" className="w-20 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-center outline-none text-gray-900 dark:text-white" /></td>
                    <td className="px-3 py-2"><input type="number" value={item.unitPrice || ''} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} className="w-24 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-right outline-none text-gray-900 dark:text-white" /></td>
                    <td className="px-3 py-2 text-center">{item.gstPercentage}%</td>
                    <td className="px-3 py-2 text-right font-medium">{settings.currencySymbol}{item.totalAmount.toFixed(2)}</td>
                    <td className="px-3 py-2"><button onClick={() => removeItem(idx)} className="p-1 text-rose-500"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={addItem} className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"><Plus size={14} /> Add Item</button>

          <div className="flex justify-between items-end">
            <div className="text-sm space-y-1">
              <p className="text-gray-500">Subtotal: {settings.currencySymbol}{totals.subtotal.toFixed(2)}</p>
              <p className="text-gray-500">GST: {settings.currencySymbol}{totals.gst.toFixed(2)}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">Total: {settings.currencySymbol}{totals.total.toFixed(2)}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
              <button onClick={handleCreate} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Create Order</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
