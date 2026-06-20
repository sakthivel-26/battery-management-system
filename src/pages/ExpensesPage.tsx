import React, { useState, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { Plus, Edit2, Trash2, DollarSign, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';
import type { Expense } from '@/types';
import { exportToCSV } from '@/utils/pdfGenerator';

const expenseCategories = ['Rent', 'Electricity', 'Water', 'Salary', 'Transport', 'Maintenance', 'Marketing', 'Insurance', 'Supplies', 'Miscellaneous'];
const emptyExpense = { category: 'Miscellaneous', description: '', amount: 0, paymentMethod: 'cash', reference: '', date: new Date().toISOString().split('T')[0] };

export function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense, settings, currentUser } = useStore();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyExpense);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => { setEditingId(null); setForm({ ...emptyExpense, date: new Date().toISOString().split('T')[0] }); setShowModal(true); };
  const openEdit = (e: Expense) => { setEditingId(e.id); setForm({ category: e.category, description: e.description, amount: e.amount, paymentMethod: e.paymentMethod, reference: e.reference, date: e.date }); setShowModal(true); };

  const handleSave = () => {
    if (!form.description || form.amount <= 0) { showToast('error', 'Description and amount are required'); return; }
    if (editingId) { updateExpense(editingId, form); showToast('success', 'Expense updated'); }
    else { addExpense({ ...form, createdBy: currentUser?.name || 'System' }); showToast('success', 'Expense added'); }
    setShowModal(false);
  };

  const handleDelete = () => { if (deleteId) { deleteExpense(deleteId); showToast('success', 'Expense deleted'); setDeleteId(null); } };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const todayExpenses = expenses.filter(e => e.date === new Date().toISOString().split('T')[0]).reduce((sum, e) => sum + e.amount, 0);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach(e => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const columns = [
    {
      key: 'date', label: 'Date', sortable: true,
      render: (e: Record<string, unknown>) => <span className="text-sm">{format(new Date(String(e.date)), 'dd MMM yyyy')}</span>
    },
    {
      key: 'category', label: 'Category',
      render: (e: Record<string, unknown>) => <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 font-medium">{String(e.category)}</span>
    },
    { key: 'description', label: 'Description', render: (e: Record<string, unknown>) => <span className="text-sm">{String(e.description)}</span> },
    {
      key: 'amount', label: 'Amount', sortable: true,
      render: (e: Record<string, unknown>) => <span className="text-sm font-semibold text-rose-600">{settings.currencySymbol}{Number(e.amount).toLocaleString('en-IN')}</span>
    },
    {
      key: 'paymentMethod', label: 'Payment',
      render: (e: Record<string, unknown>) => <span className="text-xs capitalize">{String(e.paymentMethod)}</span>
    },
    {
      key: 'actions', label: 'Actions',
      render: (e: Record<string, unknown>) => {
        const exp = e as unknown as Expense;
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600"><Edit2 size={14} /></button>
            <button onClick={() => setDeleteId(exp.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500"><Trash2 size={14} /></button>
          </div>
        );
      }
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Expenses</h2></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"><Plus size={16} /> Add Expense</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1"><DollarSign size={16} className="text-rose-500" /><span className="text-sm text-gray-500">Total Expenses</span></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{settings.currencySymbol}{totalExpenses.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-1"><TrendingDown size={16} className="text-amber-500" /><span className="text-sm text-gray-500">Today's Expenses</span></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{settings.currencySymbol}{todayExpenses.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
          <p className="text-sm text-gray-500 mb-2">Top Categories</p>
          <div className="space-y-1">
            {byCategory.slice(0, 3).map(([cat, amt]) => (
              <div key={cat} className="flex justify-between text-xs"><span className="text-gray-600 dark:text-gray-400">{cat}</span><span className="font-medium">{settings.currencySymbol}{amt.toLocaleString('en-IN')}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <DataTable columns={columns} data={[...expenses].reverse() as unknown as Record<string, unknown>[]} searchPlaceholder="Search expenses..." searchKeys={['category', 'description', 'reference']} pageSize={10}
          onExportCSV={() => { exportToCSV('Expenses', ['Date', 'Category', 'Description', 'Amount', 'Payment'], expenses.map(e => [e.date, e.category, e.description, e.amount.toString(), e.paymentMethod])); showToast('success', 'Exported'); }}
        />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Expense' : 'Add Expense'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                {expenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label><input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label><input type="number" value={form.amount || ''} onChange={e => setForm({ ...form, amount: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
              <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                <option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference</label><input type="text" value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white" /></div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Expense" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Are you sure?</p>
        <div className="flex justify-end gap-3"><button onClick={() => setDeleteId(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button><button onClick={handleDelete} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm">Delete</button></div>
      </Modal>
    </div>
  );
}
