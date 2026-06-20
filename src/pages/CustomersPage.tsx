import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { Plus, Edit2, Trash2, Users, CreditCard, Star, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { Customer } from '@/types';
import { exportToCSV } from '@/utils/pdfGenerator';

const emptyCustomer = { name: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', loyaltyPoints: 0, creditLimit: 5000, outstandingAmount: 0, isActive: true };

export function CustomersPage() {
  const { customers, sales, addCustomer, updateCustomer, deleteCustomer, settings } = useStore();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyCustomer);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [ledgerId, setLedgerId] = useState<string | null>(null);

  const openAdd = () => { setEditingId(null); setForm({ ...emptyCustomer }); setShowModal(true); };
  const openEdit = (c: Customer) => { setEditingId(c.id); setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, city: c.city, state: c.state, pincode: c.pincode, loyaltyPoints: c.loyaltyPoints, creditLimit: c.creditLimit, outstandingAmount: c.outstandingAmount, isActive: c.isActive }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name || !form.phone) { showToast('error', 'Name and phone are required'); return; }
    if (editingId) { updateCustomer(editingId, form); showToast('success', 'Customer updated'); }
    else { addCustomer(form as Omit<Customer, 'id' | 'createdAt'>); showToast('success', 'Customer added'); }
    setShowModal(false);
  };

  const handleDelete = () => { if (deleteId) { deleteCustomer(deleteId); showToast('success', 'Customer deleted'); setDeleteId(null); } };

  const ledgerCustomer = ledgerId ? customers.find(c => c.id === ledgerId) : null;
  const ledgerSales = ledgerId ? sales.filter(s => s.customerId === ledgerId).reverse() : [];

  const columns = [
    {
      key: 'name', label: 'Customer', sortable: true,
      render: (c: Record<string, unknown>) => {
        const cust = c as unknown as Customer;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center text-sm font-bold text-primary-600">{cust.name.charAt(0)}</div>
            <div><p className="text-sm font-medium text-gray-900 dark:text-white">{cust.name}</p><p className="text-xs text-gray-500">{cust.phone}</p></div>
          </div>
        );
      }
    },
    { key: 'email', label: 'Email', render: (c: Record<string, unknown>) => <span className="text-sm">{String(c.email || '-')}</span> },
    { key: 'city', label: 'City', render: (c: Record<string, unknown>) => <span className="text-sm">{String(c.city || '-')}</span> },
    {
      key: 'loyaltyPoints', label: 'Points', sortable: true,
      render: (c: Record<string, unknown>) => (
        <span className="text-sm font-medium flex items-center gap-1"><Star size={12} className="text-amber-500" />{String(c.loyaltyPoints)}</span>
      )
    },
    {
      key: 'outstandingAmount', label: 'Outstanding', sortable: true,
      render: (c: Record<string, unknown>) => {
        const amt = Number(c.outstandingAmount);
        return <span className={`text-sm font-medium ${amt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{settings.currencySymbol}{amt.toLocaleString('en-IN')}</span>;
      }
    },
    {
      key: 'actions', label: 'Actions',
      render: (c: Record<string, unknown>) => {
        const cust = c as unknown as Customer;
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => setLedgerId(cust.id)} className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-500" title="View Ledger"><FileText size={14} /></button>
            <button onClick={() => openEdit(cust)} className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600"><Edit2 size={14} /></button>
            <button onClick={() => setDeleteId(cust.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500"><Trash2 size={14} /></button>
          </div>
        );
      }
    },
  ];

  const totalOutstanding = customers.reduce((sum, c) => sum + c.outstandingAmount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customers</h2>
          <p className="text-sm text-gray-500">{customers.length} customers · Outstanding: {settings.currencySymbol}{totalOutstanding.toLocaleString('en-IN')}</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <DataTable
          columns={columns}
          data={customers as unknown as Record<string, unknown>[]}
          searchPlaceholder="Search customers..."
          searchKeys={['name', 'phone', 'email']}
          pageSize={10}
          onExportCSV={() => {
            exportToCSV('Customers', ['Name', 'Phone', 'Email', 'City', 'Loyalty Points', 'Outstanding'], customers.map(c => [c.name, c.phone, c.email, c.city, c.loyaltyPoints.toString(), c.outstandingAmount.toString()]));
            showToast('success', 'Exported');
          }}
        />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Customer' : 'Add Customer'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label><input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label><input type="text" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pincode</label><input type="text" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label><input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Credit Limit</label><input type="number" value={form.creditLimit || ''} onChange={e => setForm({ ...form, creditLimit: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save</button>
        </div>
      </Modal>

      <Modal isOpen={!!ledgerId} onClose={() => setLedgerId(null)} title={`Customer Ledger - ${ledgerCustomer?.name || ''}`} size="xl">
        {ledgerCustomer && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center"><p className="text-xs text-gray-500">Total Purchases</p><p className="text-lg font-bold text-blue-600">{ledgerSales.filter(s => s.status === 'completed').length}</p></div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center"><p className="text-xs text-gray-500">Loyalty Points</p><p className="text-lg font-bold text-amber-600">{ledgerCustomer.loyaltyPoints}</p></div>
              <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-center"><p className="text-xs text-gray-500">Outstanding</p><p className="text-lg font-bold text-rose-600">{settings.currencySymbol}{ledgerCustomer.outstandingAmount}</p></div>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {ledgerSales.map(sale => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                  <div><p className="font-medium text-gray-900 dark:text-white">{sale.invoiceNumber}</p><p className="text-xs text-gray-500">{format(new Date(sale.createdAt), 'dd MMM yyyy HH:mm')}</p></div>
                  <div className="text-right">
                    <p className="font-semibold">{settings.currencySymbol}{sale.grandTotal.toFixed(2)}</p>
                    <span className={`text-xs capitalize ${sale.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-600'}`}>{sale.paymentStatus}</span>
                  </div>
                </div>
              ))}
              {ledgerSales.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No purchase history</p>}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Customer" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Are you sure?</p>
        <div className="flex justify-end gap-3"><button onClick={() => setDeleteId(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button><button onClick={handleDelete} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm">Delete</button></div>
      </Modal>
    </div>
  );
}
