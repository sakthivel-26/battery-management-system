import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { Eye, RotateCcw, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Sale } from '@/types';
import { exportToCSV, generateInvoicePDF } from '@/utils/pdfGenerator';

export function SalesPage() {
  const { sales, settings, processReturn, customers } = useStore();
  const { showToast } = useToast();
  const [viewSale, setViewSale] = useState<Sale | null>(null);
  const [returnSale, setReturnSale] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<{ itemId: string; quantity: number }[]>([]);
  const [returnNotes, setReturnNotes] = useState('');

  const handleReturn = () => {
    if (!returnSale) return;
    const validItems = returnItems.filter(i => i.quantity > 0);
    if (validItems.length === 0) { showToast('error', 'Select items to return'); return; }
    const result = processReturn(returnSale.id, validItems, returnNotes);
    if (result) { showToast('success', `Return processed: ${result.invoiceNumber}`); setReturnSale(null); setReturnItems([]); setReturnNotes(''); }
  };

  const openReturn = (sale: Sale) => {
    setReturnSale(sale);
    setReturnItems(sale.items.map(i => ({ itemId: i.id, quantity: 0 })));
  };

  const columns = [
    {
      key: 'invoiceNumber', label: 'Invoice', sortable: true,
      render: (s: Record<string, unknown>) => <span className="text-sm font-medium text-primary-600">{String(s.invoiceNumber)}</span>
    },
    { key: 'customerName', label: 'Customer', render: (s: Record<string, unknown>) => <span className="text-sm">{String(s.customerName)}</span> },
    {
      key: 'grandTotal', label: 'Amount', sortable: true,
      render: (s: Record<string, unknown>) => <span className="text-sm font-semibold">{settings.currencySymbol}{Number(s.grandTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
    },
    {
      key: 'paymentMethod', label: 'Payment',
      render: (s: Record<string, unknown>) => <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 font-medium uppercase">{String(s.paymentMethod)}</span>
    },
    {
      key: 'status', label: 'Status',
      render: (s: Record<string, unknown>) => {
        const colors: Record<string, string> = {
          completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
          returned: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
          pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
        };
        return <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colors[String(s.status)] || ''}`}>{String(s.status)}</span>;
      }
    },
    {
      key: 'createdAt', label: 'Date', sortable: true,
      render: (s: Record<string, unknown>) => <span className="text-xs text-gray-500">{format(new Date(String(s.createdAt)), 'dd MMM yyyy HH:mm')}</span>
    },
    {
      key: 'actions', label: 'Actions',
      render: (s: Record<string, unknown>) => {
        const sale = s as unknown as Sale;
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => setViewSale(sale)} className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600" title="View"><Eye size={14} /></button>
            <button onClick={() => {
              const cust = sale.customerId ? customers.find(c => c.id === sale.customerId) : null;
              generateInvoicePDF(sale, settings, cust);
            }} className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600" title="Download PDF"><Download size={14} /></button>
            {sale.status === 'completed' && (
              <button onClick={() => openReturn(sale)} className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600" title="Process Return"><RotateCcw size={14} /></button>
            )}
          </div>
        );
      }
    },
  ];

  const totalRevenue = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.grandTotal, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Sales History</h2><p className="text-sm text-gray-500">{sales.length} transactions · Revenue: {settings.currencySymbol}{totalRevenue.toLocaleString('en-IN')}</p></div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <DataTable columns={columns} data={[...sales].reverse() as unknown as Record<string, unknown>[]} searchPlaceholder="Search sales..." searchKeys={['invoiceNumber', 'customerName']} pageSize={12}
          onExportCSV={() => { exportToCSV('Sales', ['Invoice', 'Customer', 'Amount', 'Payment', 'Status', 'Date'], sales.map(s => [s.invoiceNumber, s.customerName, s.grandTotal.toString(), s.paymentMethod, s.status, format(new Date(s.createdAt), 'dd/MM/yyyy')])); showToast('success', 'Exported'); }}
        />
      </div>

      <Modal isOpen={!!viewSale} onClose={() => setViewSale(null)} title={`Invoice: ${viewSale?.invoiceNumber || ''}`} size="lg">
        {viewSale && (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><span className="text-gray-500">Customer:</span> <span className="font-medium">{viewSale.customerName}</span></div>
              <div><span className="text-gray-500">Date:</span> <span className="font-medium">{format(new Date(viewSale.createdAt), 'dd MMM yyyy HH:mm')}</span></div>
              <div><span className="text-gray-500">Payment:</span> <span className="font-medium uppercase">{viewSale.paymentMethod}</span></div>
              <div><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{viewSale.status}</span></div>
            </div>
            <table className="w-full text-sm mb-4">
              <thead className="bg-gray-50 dark:bg-gray-700/50"><tr><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-center">Qty</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Disc</th><th className="px-3 py-2 text-right">GST</th><th className="px-3 py-2 text-right">Total</th></tr></thead>
              <tbody>
                {viewSale.items.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="px-3 py-2">{item.productName}</td>
                    <td className="px-3 py-2 text-center">{item.quantity}</td>
                    <td className="px-3 py-2 text-right">{settings.currencySymbol}{item.unitPrice}</td>
                    <td className="px-3 py-2 text-right">{settings.currencySymbol}{item.discount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{settings.currencySymbol}{item.gstAmount.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-medium">{settings.currencySymbol}{item.totalAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right space-y-1 text-sm">
              <p>Subtotal: {settings.currencySymbol}{viewSale.subtotal.toFixed(2)}</p>
              {viewSale.totalDiscount > 0 && <p className="text-emerald-600">Discount: -{settings.currencySymbol}{viewSale.totalDiscount.toFixed(2)}</p>}
              <p>GST: {settings.currencySymbol}{viewSale.totalGst.toFixed(2)}</p>
              <p className="text-lg font-bold border-t pt-2">Grand Total: {settings.currencySymbol}{viewSale.grandTotal.toFixed(2)}</p>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!returnSale} onClose={() => setReturnSale(null)} title="Process Return" size="lg">
        {returnSale && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Original Invoice: <span className="font-medium text-gray-900 dark:text-white">{returnSale.invoiceNumber}</span></p>
            <div className="space-y-2">
              {returnSale.items.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex-1"><p className="text-sm font-medium">{item.productName}</p><p className="text-xs text-gray-500">Max: {item.quantity} · {settings.currencySymbol}{item.unitPrice} each</p></div>
                  <input type="number" min="0" max={item.quantity} value={returnItems[idx]?.quantity || 0} onChange={e => { const newItems = [...returnItems]; newItems[idx] = { itemId: item.id, quantity: Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0)) }; setReturnItems(newItems); }} className="w-20 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none" />
                </div>
              ))}
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Return Notes</label><input type="text" value={returnNotes} onChange={e => setReturnNotes(e.target.value)} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none text-gray-900 dark:text-white" /></div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setReturnSale(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button onClick={handleReturn} className="px-6 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700">Process Return</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
