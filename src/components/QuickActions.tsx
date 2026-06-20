import React, { useState } from 'react';
import { Plus, ShoppingCart, Package, Users, X, FileText, BarChart3 } from 'lucide-react';

interface QuickActionsProps {
  onNavigate: (page: string) => void;
}

export function QuickActions({ onNavigate }: QuickActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { id: 'pos', label: 'New Sale', icon: ShoppingCart, color: 'bg-emerald-500' },
    { id: 'products', label: 'Add Product', icon: Package, color: 'bg-blue-500' },
    { id: 'customers', label: 'Add Customer', icon: Users, color: 'bg-purple-500' },
    { id: 'sales', label: 'Sales History', icon: FileText, color: 'bg-amber-500' },
    { id: 'reports', label: 'View Reports', icon: BarChart3, color: 'bg-cyan-500' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 lg:hidden">
      <div className={`flex flex-col-reverse gap-2 mb-2 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => { onNavigate(action.id); setIsOpen(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 ${action.color} text-white rounded-full shadow-lg text-sm font-medium animate-scale-in`}
          >
            <action.icon size={16} />
            {action.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full bg-primary-600 text-white shadow-xl flex items-center justify-center transition-transform ${isOpen ? 'rotate-45' : ''}`}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>
    </div>
  );
}
