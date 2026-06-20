import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { Plus, Edit2, Trash2, Truck } from 'lucide-react';
import type { Supplier } from '@/types';
import { exportToCSV } from '@/utils/pdfGenerator';

const emptySupplier = { name: '', contactPerson: '', phone: '', email: '', address: '', city: '', state: '', pincode: '', gstNumber: '', outstandingDues: 0, isActive: true };

export function SuppliersPage() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, settings } = useStore();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptySupplier);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => { setEditingId(null); setForm({ ...emptySupplier }); setShowModal(true); };
  const openEdit = (s: Supplier) => { setEditingId(s.id); setForm({ name: s.name, contactPerson: s.contactPerson, phone: s.phone, email: s.email, address: s.address, city: s.city, state: s.state, pincode: s.pincode, gstNumber: s.gstNumber, outstandingDues: s.outstandingDues, isActive: s.isActive }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name || !form.phone) { showToast('error', 'Name and phone are required'); return; }
    if (editingId) { updateSupplier(editingId, form); showToast('success', 'Supplier updated'); }
    else { addSupplier(form as Omit<Supplier, 'id' | 'createdAt'>); showToast('success', 'Supplier added'); }
    setShowModal(false);
  };

  const handleDelete = () => { if (deleteId) { deleteSupplier(deleteId); showToast('success', 'Supplier deleted'); setDeleteId(null); } };

  const totalDues = suppliers.reduce((sum, s) => sum + s.outstandingDues, 0);

  const columns = [
    {
      key: 'name', label: 'Supplier', sortable: true,
      render: (s: Record<string, unknown>) => {
        const sup = s as unknown as Supplier;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg flex items-center justify-center"><Truck size={16} className="text-cyan-600" /></div>
            <div><p className="text-sm font-medium text-gray-900 dark:text-white">{sup.name}</p><p className="text-xs text-gray-500">{sup.contactPerson}</p></div>
          </div>
        );
      }
    },
    { key: 'phone', label: 'Phone', render: (s: Record<string, unknown>) => <span className="text-sm">{String(s.phone)}</span> },
    { key: 'email', label: 'Email', render: (s: Record<string, unknown>) => <span className="text-sm">{String(s.email || '-')}</span> },
    { key: 'gstNumber', label: 'GST No.', render: (s: Record<string, unknown>) => <span className="text-xs font-mono text-gray-500">{String(s.gstNumber || '-')}</span> },
    {
      key: 'outstandingDues', label: 'Outstanding', sortable: true,
      render: (s: Record<string, unknown>) => {
        const amt = Number(s.outstandingDues);
        return <span className={`text-sm font-medium ${amt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{settings.currencySymbol}{amt.toLocaleString('en-IN')}</span>;
      }
    },
    {
      key: 'actions', label: 'Actions',
      render: (s: Record<string, unknown>) => {
        const sup = s as unknown as Supplier;
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => openEdit(sup)} className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600"><Edit2 size={14} /></button>
            <button onClick={() => setDeleteId(sup.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500"><Trash2 size={14} /></button>
          </div>
        );
      }
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div><h2 className="text-xl font-bold text-gray-900 dark:text-white">Suppliers</h2><p className="text-sm text-gray-500">{suppliers.length} suppliers · Dues: {settings.currencySymbol}{totalDues.toLocaleString('en-IN')}</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"><Plus size={16} /> Add Supplier</button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <DataTable columns={columns} data={suppliers as unknown as Record<string, unknown>[]} searchPlaceholder="Search suppliers..." searchKeys={['name', 'phone', 'email', 'contactPerson']} pageSize={10}
          onExportCSV={() => { exportToCSV('Suppliers', ['Name', 'Contact', 'Phone', 'Email', 'GST', 'Outstanding'], suppliers.map(s => [s.name, s.contactPerson, s.phone, s.email, s.gstNumber, s.outstandingDues.toString()])); showToast('success', 'Exported'); }}
        />
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Supplier' : 'Add Supplier'} size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name *</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Person</label><input type="text" value={form.contactPerson} onChange={e => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label><input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Number</label><input type="text" value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label><input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
          <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label><input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Supplier" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Are you sure?</p>
        <div className="flex justify-end gap-3"><button onClick={() => setDeleteId(null)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button><button onClick={handleDelete} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm">Delete</button></div>
      </Modal>
    </div>
  );
}
