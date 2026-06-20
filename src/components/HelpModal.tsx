import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Keyboard, ShoppingCart, Package, Users, BarChart3, Settings, Bell, FileText, HelpCircle } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const shortcuts = [
    { key: 'F2', action: 'Focus search in POS' },
    { key: 'F3', action: 'Open barcode scanner' },
    { key: 'F4', action: 'Proceed to payment' },
    { key: 'F8', action: 'Clear cart' },
    { key: 'Esc', action: 'Close modals' },
  ];

  const features = [
    { icon: ShoppingCart, title: 'POS & Billing', desc: 'Complete point-of-sale with barcode scanning, discounts, multiple payment methods, and invoice generation' },
    { icon: Package, title: 'Inventory', desc: 'Track stock levels, set reorder points, manage batches, and monitor expiry dates' },
    { icon: Users, title: 'CRM', desc: 'Customer management with loyalty points, credit tracking, and purchase history' },
    { icon: BarChart3, title: 'Reports', desc: 'Sales, profit, inventory, tax, and expense reports with PDF/CSV export' },
    { icon: Bell, title: 'Alerts', desc: 'Automatic notifications for low stock, out of stock, and expiring products' },
    { icon: FileText, title: 'Invoices', desc: 'Professional thermal-style invoices with print and PDF download options' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Information" size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Keyboard size={16} /> Keyboard Shortcuts (POS)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {shortcuts.map(s => (
              <div key={s.key} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-mono font-bold">{s.key}</kbd>
                <span className="text-sm text-gray-600 dark:text-gray-300">{s.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <HelpCircle size={16} /> Features Overview
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f.title} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <f.icon size={16} className="text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{f.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">Quick Tips</h3>
          <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
            <li>• Use a USB barcode scanner for instant product lookup in POS</li>
            <li>• Data is stored in your browser - export backups regularly from Settings</li>
            <li>• Toggle dark mode using the moon/sun icon in the header</li>
            <li>• Click on customer name in POS to view their ledger</li>
            <li>• Apply coupons before checkout for automatic discounts</li>
          </ul>
        </div>

        <div className="text-center text-xs text-gray-400">
          <p>Vehicle Battery Management System v1.0</p>
          <p className="mt-1">Built with React, TypeScript, Tailwind CSS</p>
        </div>
      </div>
    </Modal>
  );
}
