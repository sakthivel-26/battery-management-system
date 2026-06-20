import React from 'react';
import { useStore } from '@/store/useStore';
import {
  LayoutDashboard, ShoppingCart, Package, Warehouse, Users, Truck,
  Receipt, BarChart3, Settings, Bell, Shield, LogOut, ChevronLeft,
  Tag, CreditCard, FileText
} from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: string[];
  badge?: number;
}

export function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { sidebarOpen, toggleSidebar, currentUser, logout, notifications } = useStore();
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier'] },
    { id: 'pos', label: 'POS / Billing', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
    { id: 'products', label: 'Products', icon: Package, roles: ['admin', 'manager'] },
    { id: 'categories', label: 'Categories', icon: Tag, roles: ['admin', 'manager'] },
    { id: 'inventory', label: 'Inventory', icon: Warehouse, roles: ['admin', 'manager'] },
    { id: 'customers', label: 'Customers', icon: Users, roles: ['admin', 'manager', 'cashier'] },
    { id: 'suppliers', label: 'Suppliers', icon: Truck, roles: ['admin', 'manager'] },
    { id: 'purchases', label: 'Purchases', icon: Receipt, roles: ['admin', 'manager'] },
    { id: 'expenses', label: 'Expenses', icon: CreditCard, roles: ['admin', 'manager'] },
    { id: 'sales', label: 'Sales History', icon: FileText, roles: ['admin', 'manager', 'cashier'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { id: 'notifications', label: 'Notifications', icon: Bell, roles: ['admin', 'manager', 'cashier'], badge: unreadCount },
    { id: 'audit', label: 'Audit Logs', icon: Shield, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredItems = navItems.filter(item =>
    currentUser ? item.roles.includes(currentUser.role) : false
  );

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={toggleSidebar} />
      )}
      <aside className={`fixed top-0 left-0 z-50 h-screen bg-gray-900 text-white transition-all duration-300 flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-0 lg:w-20'
      } overflow-hidden`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-800 min-h-[65px]">
          {sidebarOpen && (
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0">SK</div>
              <span className="font-bold text-sm truncate" title="SRI KARUPPUSAMY EARTH MOVERS">SRI KARUPPUSAMY EARTH MOVERS</span>
            </div>
          )}
          <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-gray-800 transition-colors lg:block hidden">
            <ChevronLeft size={18} className={`transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {filteredItems.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); if (window.innerWidth < 1024) toggleSidebar(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-sm ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left whitespace-nowrap">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-rose-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium min-w-[20px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-3">
          {sidebarOpen && currentUser && (
            <div className="flex items-center gap-3 px-2 mb-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-xs font-bold">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-400 capitalize">{currentUser.role}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors text-sm"
            title="Logout"
          >
            <LogOut size={20} className="flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
