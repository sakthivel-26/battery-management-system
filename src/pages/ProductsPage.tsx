import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { Plus, Edit2, Trash2, Package, Barcode } from 'lucide-react';
import type { Product } from '@/types';
import { exportToCSV } from '@/utils/pdfGenerator';

const emptyProduct = {
  name: '', sku: '', barcode: '', categoryId: '', brandId: '', description: '',
  unit: 'Piece', purchasePrice: 0, sellingPrice: 0, mrp: 0, gstPercentage: 0,
  hsnCode: '', stockQuantity: 0, reorderLevel: 10, batchNumber: '', expiryDate: '',
  isActive: true,
};

export function ProductsPage() {
  const { products, categories, brands, addProduct, updateProduct, deleteProduct, settings } = useStore();
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [showDelete, setShowDelete] = useState<string | null>(null);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyProduct, barcode: Date.now().toString().slice(-10) });
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name, sku: product.sku, barcode: product.barcode,
      categoryId: product.categoryId, brandId: product.brandId, description: product.description,
      unit: product.unit, purchasePrice: product.purchasePrice, sellingPrice: product.sellingPrice,
      mrp: product.mrp, gstPercentage: product.gstPercentage, hsnCode: product.hsnCode,
      stockQuantity: product.stockQuantity, reorderLevel: product.reorderLevel,
      batchNumber: product.batchNumber, expiryDate: product.expiryDate || '', isActive: product.isActive,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name || !form.sku) {
      showToast('error', 'Name and SKU are required');
      return;
    }
    if (editingId) {
      updateProduct(editingId, form as Partial<Product>);
      showToast('success', 'Product updated successfully');
    } else {
      addProduct(form as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
      showToast('success', 'Product added successfully');
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (showDelete) {
      deleteProduct(showDelete);
      showToast('success', 'Product deleted');
      setShowDelete(null);
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'SKU', 'Barcode', 'Category', 'Brand', 'Unit', 'Purchase Price', 'Selling Price', 'MRP', 'GST%', 'Stock', 'Reorder Level'];
    const data = products.map(p => [
      p.name, p.sku, p.barcode,
      categories.find(c => c.id === p.categoryId)?.name || '',
      brands.find(b => b.id === p.brandId)?.name || '',
      p.unit, p.purchasePrice.toString(), p.sellingPrice.toString(),
      p.mrp.toString(), p.gstPercentage.toString(), p.stockQuantity.toString(), p.reorderLevel.toString()
    ]);
    exportToCSV('Products', headers, data);
    showToast('success', 'Products exported to CSV');
  };

  const columns = [
    {
      key: 'name', label: 'Product', sortable: true,
      render: (p: Record<string, unknown>) => {
        const product = p as unknown as Product;
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <Package size={16} className="text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</p>
              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
            </div>
          </div>
        );
      }
    },
    {
      key: 'categoryId', label: 'Category',
      render: (p: Record<string, unknown>) => {
        const product = p as unknown as Product;
        return <span className="text-sm">{categories.find(c => c.id === product.categoryId)?.name || '-'}</span>;
      }
    },
    {
      key: 'sellingPrice', label: 'Price', sortable: true,
      render: (p: Record<string, unknown>) => {
        const product = p as unknown as Product;
        return (
          <div>
            <p className="font-medium text-sm">{settings.currencySymbol}{product.sellingPrice}</p>
            <p className="text-xs text-gray-500">Cost: {settings.currencySymbol}{product.purchasePrice}</p>
          </div>
        );
      }
    },
    {
      key: 'gstPercentage', label: 'GST', sortable: true,
      render: (p: Record<string, unknown>) => {
        const product = p as unknown as Product;
        return <span className="text-sm">{product.gstPercentage}%</span>;
      }
    },
    {
      key: 'stockQuantity', label: 'Stock', sortable: true,
      render: (p: Record<string, unknown>) => {
        const product = p as unknown as Product;
        const isLow = product.stockQuantity <= product.reorderLevel;
        const isOut = product.stockQuantity === 0;
        return (
          <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
            isOut ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
            isLow ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
            'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          }`}>
            {product.stockQuantity} {product.unit}
          </span>
        );
      }
    },
    {
      key: 'actions', label: 'Actions',
      render: (p: Record<string, unknown>) => {
        const product = p as unknown as Product;
        return (
          <div className="flex items-center gap-1">
            <button onClick={() => openEdit(product)} className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600">
              <Edit2 size={14} />
            </button>
            <button onClick={() => setShowDelete(product.id)} className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-500">
              <Trash2 size={14} />
            </button>
          </div>
        );
      }
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Products</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{products.length} total products</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
        <DataTable
          columns={columns}
          data={products as unknown as Record<string, unknown>[]}
          searchPlaceholder="Search products..."
          searchKeys={['name', 'sku', 'barcode']}
          pageSize={10}
          onExportCSV={handleExport}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Edit Product' : 'Add Product'} size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU *</label>
            <input type="text" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Barcode</label>
            <div className="flex gap-2">
              <input type="text" value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
              <button onClick={() => setForm({ ...form, barcode: Date.now().toString().slice(-13) })} className="p-2.5 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600" title="Generate barcode">
                <Barcode size={16} className="text-gray-500" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select Category</option>
              {categories.filter(c => c.isActive).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Brand</label>
            <select value={form.brandId} onChange={e => setForm({ ...form, brandId: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
              <option value="">Select Brand</option>
              {brands.filter(b => b.isActive).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unit</label>
            <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
              {['Piece', 'Set', 'Box', 'Pack', 'Litre'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Price</label>
            <input type="number" value={form.purchasePrice || ''} onChange={e => setForm({ ...form, purchasePrice: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selling Price</label>
            <input type="number" value={form.sellingPrice || ''} onChange={e => setForm({ ...form, sellingPrice: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">MRP</label>
            <input type="number" value={form.mrp || ''} onChange={e => setForm({ ...form, mrp: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST %</label>
            <select value={form.gstPercentage} onChange={e => setForm({ ...form, gstPercentage: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500">
              {[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HSN Code</label>
            <input type="text" value={form.hsnCode} onChange={e => setForm({ ...form, hsnCode: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stock Quantity</label>
            <input type="number" value={form.stockQuantity || ''} onChange={e => setForm({ ...form, stockQuantity: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reorder Level</label>
            <input type="number" value={form.reorderLevel || ''} onChange={e => setForm({ ...form, reorderLevel: Number(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Batch Number</label>
            <input type="text" value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label>
            <input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={() => setShowModal(false)} className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">{editingId ? 'Update' : 'Add'} Product</button>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={!!showDelete} onClose={() => setShowDelete(null)} title="Delete Product" size="sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Are you sure you want to delete this product? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setShowDelete(null)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
          <button onClick={handleDelete} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm hover:bg-rose-700">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
