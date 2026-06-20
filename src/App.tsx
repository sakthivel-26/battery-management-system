import React, { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { ToastProvider } from '@/components/ui/Toast';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { POSPage } from '@/pages/POSPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { SuppliersPage } from '@/pages/SuppliersPage';
import { PurchasesPage } from '@/pages/PurchasesPage';
import { ExpensesPage } from '@/pages/ExpensesPage';
import { SalesPage } from '@/pages/SalesPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { AuditPage } from '@/pages/AuditPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { QuickActions } from '@/components/QuickActions';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  pos: 'POS / Billing',
  products: 'Product Management',
  categories: 'Categories & Brands',
  inventory: 'Inventory Management',
  customers: 'Customer Management',
  suppliers: 'Supplier Management',
  purchases: 'Purchase Orders',
  expenses: 'Expense Tracking',
  sales: 'Sales History',
  reports: 'Reports & Analytics',
  notifications: 'Notifications',
  audit: 'Audit Logs',
  settings: 'Settings',
};

function AppContent() {
  const { isAuthenticated, darkMode, sidebarOpen, initializeData } = useStore();
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <DashboardPage />;
      case 'pos': return <POSPage />;
      case 'products': return <ProductsPage />;
      case 'categories': return <CategoriesPage />;
      case 'inventory': return <InventoryPage />;
      case 'customers': return <CustomersPage />;
      case 'suppliers': return <SuppliersPage />;
      case 'purchases': return <PurchasesPage />;
      case 'expenses': return <ExpensesPage />;
      case 'sales': return <SalesPage />;
      case 'reports': return <ReportsPage />;
      case 'notifications': return <NotificationsPage />;
      case 'audit': return <AuditPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors`}>
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <Header title={pageTitles[currentPage] || 'Dashboard'} onNavigate={setCurrentPage} />
        <main className="p-4 sm:p-6">
          {renderPage()}
        </main>
      </div>
      <QuickActions onNavigate={setCurrentPage} />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
