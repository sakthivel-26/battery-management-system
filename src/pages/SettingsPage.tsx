import React, { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Settings, Store, Receipt, Tag, Users, Shield, Download, Upload, Plus, Edit2, Trash2, CreditCard } from 'lucide-react';
import type { User, Coupon } from '@/types';

type SettingsTab = 'store' | 'tax' | 'invoice' | 'payment' | 'users' | 'coupons' | 'backup';

export function SettingsPage() {
  const {
    settings, updateSettings, users, addUser, updateUser, deleteUser,
    coupons, addCoupon, updateCoupon, deleteCoupon, sales, products, customers, expenses
  } = useStore();
  const { showToast } = useToast();
  const [tab, setTab] = useState<SettingsTab>('store');
  const [storeForm, setStoreForm] = useState({ ...settings });
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', phone: '', role: 'cashier' as User['role'], isActive: true });
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState({ code: '', description: '', discountType: 'percentage' as 'percentage' | 'fixed', discountValue: 10, minOrderAmount: 0, maxDiscount: 100, usageLimit: 100, isActive: true, expiryDate: '' });

  const handleSaveStore = () => {
    updateSettings(storeForm);
    showToast('success', 'Store settings saved');
  };

  const handleSaveUser = () => {
    if (!userForm.name || !userForm.email) { showToast('error', 'Name and email are required'); return; }
    if (editingUser) { updateUser(editingUser.id, userForm); showToast('success', 'User updated'); }
    else { addUser(userForm); showToast('success', 'User added'); }
    setShowUserModal(false);
  };

  const handleSaveCoupon = () => {
    if (!couponForm.code) { showToast('error', 'Coupon code is required'); return; }
    if (editingCoupon) { updateCoupon(editingCoupon.id, couponForm); showToast('success', 'Coupon updated'); }
    else { addCoupon(couponForm); showToast('success', 'Coupon added'); }
    setShowCouponModal(false);
  };

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      settings, users, products: useStore.getState().products,
      customers, sales, expenses,
      categories: useStore.getState().categories,
      brands: useStore.getState().brands,
      suppliers: useStore.getState().suppliers,
      coupons
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `SriKaruppusamy_Backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('success', 'Data exported successfully');
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.settings) updateSettings(data.settings);
          showToast('success', 'Data imported. Some data may require page refresh.');
        } catch {
          showToast('error', 'Invalid backup file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const tabs = [
    { id: 'store' as const, label: 'Store Info', icon: Store },
    { id: 'tax' as const, label: 'Tax/GST', icon: Receipt },
    { id: 'invoice' as const, label: 'Invoice', icon: Tag },
    { id: 'payment' as const, label: 'Payment', icon: CreditCard },
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'coupons' as const, label: 'Coupons', icon: Tag },
    { id: 'backup' as const, label: 'Backup', icon: Shield },
  ];

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500";

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Settings size={20} /> Settings</h2>

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.id ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'store' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 max-w-3xl">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Store Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name</label><input type="text" value={storeForm.storeName} onChange={e => setStoreForm({ ...storeForm, storeName: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><input type="text" value={storeForm.storePhone} onChange={e => setStoreForm({ ...storeForm, storePhone: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label><input type="email" value={storeForm.storeEmail} onChange={e => setStoreForm({ ...storeForm, storeEmail: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Number</label><input type="text" value={storeForm.gstNumber} onChange={e => setStoreForm({ ...storeForm, gstNumber: e.target.value })} className={inputCls} /></div>
            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label><input type="text" value={storeForm.storeAddress} onChange={e => setStoreForm({ ...storeForm, storeAddress: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label><input type="text" value={storeForm.storeCity} onChange={e => setStoreForm({ ...storeForm, storeCity: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label><input type="text" value={storeForm.storeState} onChange={e => setStoreForm({ ...storeForm, storeState: e.target.value })} className={inputCls} /></div>
          </div>
          <button onClick={handleSaveStore} className="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save Changes</button>
        </div>
      )}

      {tab === 'tax' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 max-w-xl">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Tax Configuration</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={storeForm.taxEnabled} onChange={e => setStoreForm({ ...storeForm, taxEnabled: e.target.checked })} className="w-4 h-4 rounded border-gray-300" id="taxEn" />
              <label htmlFor="taxEn" className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable Tax/GST Calculation</label>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Tax Rate (%)</label><input type="number" value={storeForm.defaultTaxRate} onChange={e => setStoreForm({ ...storeForm, defaultTaxRate: Number(e.target.value) })} className={inputCls} /></div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-1">GST Slabs Available:</p>
              <p>0% (Essential goods), 5%, 12%, 18%, 28%</p>
              <p className="text-xs mt-1">Set GST percentage per product in product management.</p>
            </div>
          </div>
          <button onClick={handleSaveStore} className="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save Changes</button>
        </div>
      )}

      {tab === 'invoice' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 max-w-xl">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Invoice Settings</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Prefix</label><input type="text" value={storeForm.invoicePrefix} onChange={e => setStoreForm({ ...storeForm, invoicePrefix: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency Symbol</label><input type="text" value={storeForm.currencySymbol} onChange={e => setStoreForm({ ...storeForm, currencySymbol: e.target.value })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Footer Message</label><textarea value={storeForm.invoiceFooter} onChange={e => setStoreForm({ ...storeForm, invoiceFooter: e.target.value })} rows={2} className={inputCls + ' resize-none'} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loyalty Points/₹</label><input type="number" value={storeForm.loyaltyPointsPerRupee} onChange={e => setStoreForm({ ...storeForm, loyaltyPointsPerRupee: Number(e.target.value) })} className={inputCls} /></div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Redemption Rate</label><input type="number" step="0.1" value={storeForm.loyaltyRedemptionRate} onChange={e => setStoreForm({ ...storeForm, loyaltyRedemptionRate: Number(e.target.value) })} className={inputCls} /></div>
            </div>
          </div>
          <button onClick={handleSaveStore} className="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save Changes</button>
        </div>
      )}

      {tab === 'payment' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 max-w-2xl">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Payment Configuration</h3>
          
          {/* UPI Settings */}
          <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
            <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-3 flex items-center gap-2">
              <CreditCard size={16} /> UPI Payment Settings
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your UPI ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={storeForm.upiId}
                  onChange={e => setStoreForm({ ...storeForm, upiId: e.target.value })}
                  placeholder="yourname@upi, 9876543210@paytm, yourname@oksbi"
                  className={inputCls}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Enter your UPI ID where you want to receive payments (e.g., yourphone@paytm, yourname@okicici)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Merchant Display Name
                </label>
                <input
                  type="text"
                  value={storeForm.upiMerchantName}
                  onChange={e => setStoreForm({ ...storeForm, upiMerchantName: e.target.value })}
                  placeholder="Your Store Name"
                  className={inputCls}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This name will appear in customer's UPI app when they scan QR
                </p>
              </div>
            </div>
          </div>

          {/* Razorpay Settings */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <CreditCard size={16} /> Card/Net Banking (Razorpay)
            </h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={storeForm.razorpayEnabled}
                  onChange={e => setStoreForm({ ...storeForm, razorpayEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                  id="rzpEnabled"
                />
                <label htmlFor="rzpEnabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Razorpay Payments
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Razorpay Key ID
                </label>
                <input
                  type="text"
                  value={storeForm.razorpayKeyId}
                  onChange={e => setStoreForm({ ...storeForm, razorpayKeyId: e.target.value })}
                  placeholder="rzp_live_xxxxxxxxxx"
                  className={inputCls}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Get your Key ID from <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Razorpay Dashboard</a>
                </p>
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <h4 className="font-medium text-emerald-800 dark:text-emerald-300 mb-2">💡 How Payments Work</h4>
            <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
              <li><strong>UPI:</strong> QR code with your UPI ID is shown. Customer scans & pays directly to your account.</li>
              <li><strong>Cash:</strong> Customer pays cash, you enter received amount.</li>
              <li><strong>Card:</strong> Requires Razorpay integration. Money goes to your Razorpay account → Bank.</li>
              <li><strong>Credit:</strong> For trusted customers. Record sale now, collect payment later.</li>
            </ul>
          </div>

          <button onClick={handleSaveStore} className="mt-6 px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">
            Save Payment Settings
          </button>
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">User Management</h3>
            <button onClick={() => { setEditingUser(null); setUserForm({ name: '', email: '', phone: '', role: 'cashier', isActive: true }); setShowUserModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"><Plus size={14} /> Add User</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center font-bold text-primary-600">{user.name.charAt(0)}</div>
                    <div><p className="font-medium text-gray-900 dark:text-white">{user.name}</p><p className="text-xs text-gray-500">{user.email}</p></div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingUser(user); setUserForm({ name: user.name, email: user.email, phone: user.phone, role: user.role, isActive: user.isActive }); setShowUserModal(true); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit2 size={13} className="text-gray-400" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : user.role === 'manager' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600'}`}>{user.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{user.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'coupons' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Coupon Management</h3>
            <button onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', description: '', discountType: 'percentage', discountValue: 10, minOrderAmount: 0, maxDiscount: 100, usageLimit: 100, isActive: true, expiryDate: '' }); setShowCouponModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"><Plus size={14} /> Add Coupon</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.map(coupon => (
              <div key={coupon.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 relative">
                <div className="absolute top-3 right-3 flex gap-1">
                  <button onClick={() => { setEditingCoupon(coupon); setCouponForm({ code: coupon.code, description: coupon.description, discountType: coupon.discountType, discountValue: coupon.discountValue, minOrderAmount: coupon.minOrderAmount, maxDiscount: coupon.maxDiscount, usageLimit: coupon.usageLimit, isActive: coupon.isActive, expiryDate: coupon.expiryDate }); setShowCouponModal(true); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><Edit2 size={13} className="text-gray-400" /></button>
                  <button onClick={() => deleteCoupon(coupon.id)} className="p-1 hover:bg-rose-50 rounded"><Trash2 size={13} className="text-rose-400" /></button>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={14} className="text-primary-500" />
                  <span className="font-bold text-lg text-primary-600 font-mono">{coupon.code}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{coupon.description}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}</span>
                  <span>·</span>
                  <span>Min: ₹{coupon.minOrderAmount}</span>
                  <span>·</span>
                  <span>Used: {coupon.usedCount}/{coupon.usageLimit}</span>
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${coupon.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{coupon.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'backup' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 max-w-xl">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Backup & Restore</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Export Data</h4>
              <p className="text-xs text-gray-500 mb-3">Download a complete backup of all your store data including products, customers, sales, and settings.</p>
              <button onClick={handleExportData} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"><Download size={14} /> Export Backup</button>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Import Data</h4>
              <p className="text-xs text-gray-500 mb-3">Restore data from a previously exported backup file.</p>
              <button onClick={handleImportData} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"><Upload size={14} /> Import Backup</button>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-400">
              ⚠️ Data is stored in your browser's local storage. Clearing browser data will delete all store data. Always keep backups!
            </div>
          </div>
        </div>
      )}

      {/* User Modal */}
      <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title={editingUser ? 'Edit User' : 'Add User'} size="md">
        <div className="space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label><input type="text" value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label><input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label><input type="tel" value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} className={inputCls} /></div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value as User['role'] })} className={inputCls}>
              <option value="admin">Admin</option><option value="manager">Manager</option><option value="cashier">Cashier</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={userForm.isActive} onChange={e => setUserForm({ ...userForm, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300" id="userActive" />
            <label htmlFor="userActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowUserModal(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
            <button onClick={handleSaveUser} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save</button>
          </div>
        </div>
      </Modal>

      {/* Coupon Modal */}
      <Modal isOpen={showCouponModal} onClose={() => setShowCouponModal(false)} title={editingCoupon ? 'Edit Coupon' : 'Add Coupon'} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label><input type="text" value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
              <select value={couponForm.discountType} onChange={e => setCouponForm({ ...couponForm, discountType: e.target.value as 'percentage' | 'fixed' })} className={inputCls}>
                <option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option>
              </select>
            </div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label><input type="text" value={couponForm.description} onChange={e => setCouponForm({ ...couponForm, description: e.target.value })} className={inputCls} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount Value</label><input type="number" value={couponForm.discountValue || ''} onChange={e => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Discount (₹)</label><input type="number" value={couponForm.maxDiscount || ''} onChange={e => setCouponForm({ ...couponForm, maxDiscount: Number(e.target.value) })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Order (₹)</label><input type="number" value={couponForm.minOrderAmount || ''} onChange={e => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })} className={inputCls} /></div>
            <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Usage Limit</label><input type="number" value={couponForm.usageLimit || ''} onChange={e => setCouponForm({ ...couponForm, usageLimit: Number(e.target.value) })} className={inputCls} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiry Date</label><input type="date" value={couponForm.expiryDate} onChange={e => setCouponForm({ ...couponForm, expiryDate: e.target.value })} className={inputCls} /></div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={couponForm.isActive} onChange={e => setCouponForm({ ...couponForm, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300" id="couponActive" />
            <label htmlFor="couponActive" className="text-sm text-gray-700 dark:text-gray-300">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setShowCouponModal(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
            <button onClick={handleSaveCoupon} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
