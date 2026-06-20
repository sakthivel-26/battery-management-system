import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import type { Category } from '@/types';

export function CategoriesPage() {
  const { categories, brands, addCategory, updateCategory, deleteCategory, addBrand, updateBrand, deleteBrand, products } = useStore();
  const { showToast } = useToast();
  const [tab, setTab] = useState<'categories' | 'brands'>('categories');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', isActive: true });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => { setEditingId(null); setForm({ name: '', description: '', isActive: true }); setShowModal(true); };
  const openEditCat = (item: Category) => { setEditingId(item.id); setForm({ name: item.name, description: item.description, isActive: item.isActive }); setShowModal(true); };

  const handleSave = () => {
    if (!form.name) { showToast('error', 'Name is required'); return; }
    if (tab === 'categories') {
      if (editingId) { updateCategory(editingId, form); showToast('success', 'Category updated'); }
      else { addCategory(form); showToast('success', 'Category added'); }
    } else {
      if (editingId) { updateBrand(editingId, form); showToast('success', 'Brand updated'); }
      else { addBrand(form); showToast('success', 'Brand added'); }
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      if (tab === 'categories') { deleteCategory(deleteId); showToast('success', 'Category deleted'); }
      else { deleteBrand(deleteId); showToast('success', 'Brand deleted'); }
      setDeleteId(null);
    }
  };

  const items = tab === 'categories' ? categories : brands;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex gap-2">
          <button onClick={() => setTab('categories')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'categories' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>Categories</button>
          <button onClick={() => setTab('brands')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'brands' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>Brands</button>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
          <Plus size={16} /> Add {tab === 'categories' ? 'Category' : 'Brand'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => {
          const productCount = tab === 'categories'
            ? products.filter(p => p.categoryId === item.id).length
            : products.filter(p => p.brandId === item.id).length;
          return (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                    <Tag size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{productCount} products</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditCat(item)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><Edit2 size={14} className="text-gray-500" /></button>
                  <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20"><Trash2 size={14} className="text-rose-500" /></button>
                </div>
              </div>
              {item.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{item.description}</p>}
              <div className="mt-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-500'}`}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`${editingId ? 'Edit' : 'Add'} ${tab === 'categories' ? 'Category' : 'Brand'}`} size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300" id="isActive" />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
            <button onClick={handleSave} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Confirm Delete" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Are you sure you want to delete this item?</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
