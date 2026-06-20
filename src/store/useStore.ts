import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type {
  User, Product, Category, Brand, Customer, Supplier,
  Sale, SaleItem, Purchase, InventoryLog, Expense,
  Notification, AuditLog, StoreSettings, Coupon, CartItem,
  PaymentMethod, PaymentStatus, SaleStatus
} from '@/types';
import {
  defaultSettings, seedUsers, seedCategories, seedBrands,
  seedProducts, seedCustomers, seedSuppliers, seedCoupons
} from './seedData';

interface AppState {
  isInitialized: boolean;
  darkMode: boolean;
  sidebarOpen: boolean;
  currentUser: User | null;
  isAuthenticated: boolean;

  users: User[];
  products: Product[];
  categories: Category[];
  brands: Brand[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  inventoryLogs: InventoryLog[];
  expenses: Expense[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  settings: StoreSettings;
  coupons: Coupon[];

  cart: CartItem[];
  selectedCustomerId: string | null;
  appliedCoupon: Coupon | null;

  invoiceCounter: number;
  purchaseCounter: number;

  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  login: (email: string, password: string, role?: string) => boolean;
  logout: () => void;

  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  addBrand: (brand: Omit<Brand, 'id' | 'createdAt'>) => void;
  updateBrand: (id: string, data: Partial<Brand>) => void;
  deleteBrand: (id: string) => void;

  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, data: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateCartDiscount: (productId: string, discount: number, type: 'percentage' | 'fixed') => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setSelectedCustomer: (customerId: string | null) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;

  completeSale: (paymentMethod: PaymentMethod, cashReceived: number, notes: string) => Sale | null;
  processReturn: (saleId: string, items: { itemId: string; quantity: number }[], notes: string) => Sale | null;

  addPurchase: (purchase: Omit<Purchase, 'id' | 'createdAt' | 'purchaseOrderNumber'>) => void;
  updatePurchaseStatus: (id: string, status: Purchase['status']) => void;
  receivePurchase: (id: string) => void;

  addInventoryLog: (log: Omit<InventoryLog, 'id' | 'createdAt'>) => void;
  adjustStock: (productId: string, quantity: number, type: 'in' | 'out' | 'adjustment' | 'damage' | 'expired', notes: string) => void;

  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  addAuditLog: (log: Omit<AuditLog, 'id' | 'createdAt'>) => void;

  updateSettings: (settings: Partial<StoreSettings>) => void;

  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;

  addCoupon: (coupon: Omit<Coupon, 'id' | 'createdAt' | 'usedCount'>) => void;
  updateCoupon: (id: string, data: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;

  checkLowStock: () => void;
  checkExpiry: () => void;

  getProductById: (id: string) => Product | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getBrandById: (id: string) => Brand | undefined;
  getCustomerById: (id: string) => Customer | undefined;
  getSupplierById: (id: string) => Supplier | undefined;

  getSalesForDateRange: (start: string, end: string) => Sale[];
  getDailySales: (date: string) => Sale[];
  getTopSellingProducts: (limit: number) => { productId: string; productName: string; totalQty: number; totalRevenue: number }[];
  getRevenueByDate: (days: number) => { date: string; revenue: number; profit: number }[];

  initializeData: () => void;
}

function generateInvoiceNumber(counter: number, prefix: string): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${prefix}-${y}${m}${d}-${counter.toString().padStart(4, '0')}`;
}

function generatePONumber(counter: number): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(2);
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  return `PO-${y}${m}-${counter.toString().padStart(4, '0')}`;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      isInitialized: false,
      darkMode: false,
      sidebarOpen: true,
      currentUser: null,
      isAuthenticated: false,

      users: [],
      products: [],
      categories: [],
      brands: [],
      customers: [],
      suppliers: [],
      sales: [],
      purchases: [],
      inventoryLogs: [],
      expenses: [],
      notifications: [],
      auditLogs: [],
      settings: defaultSettings,
      coupons: [],

      cart: [],
      selectedCustomerId: null,
      appliedCoupon: null,

      invoiceCounter: 1,
      purchaseCounter: 1,

      toggleDarkMode: () => set(state => ({ darkMode: !state.darkMode })),
      toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      login: (email: string, password: string, role?: string) => {
        const user = get().users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.isActive);
        if (user && (!user.password || user.password === password)) {
          if (role && user.role !== role) {
            return false;
          }
          const updatedUser = { ...user, lastLogin: new Date().toISOString() };
          set(state => ({
            currentUser: updatedUser,
            isAuthenticated: true,
            users: state.users.map(u => u.id === user.id ? updatedUser : u),
          }));
          get().addAuditLog({ userId: user.id, userName: user.name, action: 'Login', module: 'Auth', details: `User ${user.name} logged in`, ipAddress: '127.0.0.1' });
          return true;
        }
        return false;
      },

      logout: () => {
        const user = get().currentUser;
        if (user) {
          get().addAuditLog({ userId: user.id, userName: user.name, action: 'Logout', module: 'Auth', details: `User ${user.name} logged out`, ipAddress: '127.0.0.1' });
        }
        set({ currentUser: null, isAuthenticated: false, cart: [], selectedCustomerId: null, appliedCoupon: null });
      },

      addProduct: (product) => {
        const newProduct: Product = { ...product, id: uuid(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        set(state => ({ products: [...state.products, newProduct] }));
        get().addAuditLog({ userId: get().currentUser?.id || '', userName: get().currentUser?.name || '', action: 'Create', module: 'Products', details: `Added product: ${product.name}`, ipAddress: '127.0.0.1' });
        return newProduct;
      },
      updateProduct: (id, data) => {
        set(state => ({
          products: state.products.map(p => p.id === id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p)
        }));
      },
      deleteProduct: (id) => {
        const product = get().products.find(p => p.id === id);
        set(state => ({ products: state.products.filter(p => p.id !== id) }));
        if (product) {
          get().addAuditLog({ userId: get().currentUser?.id || '', userName: get().currentUser?.name || '', action: 'Delete', module: 'Products', details: `Deleted product: ${product.name}`, ipAddress: '127.0.0.1' });
        }
      },

      addCategory: (category) => {
        const newCat: Category = { ...category, id: uuid(), createdAt: new Date().toISOString() };
        set(state => ({ categories: [...state.categories, newCat] }));
      },
      updateCategory: (id, data) => {
        set(state => ({ categories: state.categories.map(c => c.id === id ? { ...c, ...data } : c) }));
      },
      deleteCategory: (id) => {
        set(state => ({ categories: state.categories.filter(c => c.id !== id) }));
      },

      addBrand: (brand) => {
        const newBrand: Brand = { ...brand, id: uuid(), createdAt: new Date().toISOString() };
        set(state => ({ brands: [...state.brands, newBrand] }));
      },
      updateBrand: (id, data) => {
        set(state => ({ brands: state.brands.map(b => b.id === id ? { ...b, ...data } : b) }));
      },
      deleteBrand: (id) => {
        set(state => ({ brands: state.brands.filter(b => b.id !== id) }));
      },

      addCustomer: (customer) => {
        const newCustomer: Customer = { ...customer, id: uuid(), createdAt: new Date().toISOString() };
        set(state => ({ customers: [...state.customers, newCustomer] }));
      },
      updateCustomer: (id, data) => {
        set(state => ({ customers: state.customers.map(c => c.id === id ? { ...c, ...data } : c) }));
      },
      deleteCustomer: (id) => {
        set(state => ({ customers: state.customers.filter(c => c.id !== id) }));
      },

      addSupplier: (supplier) => {
        const newSupplier: Supplier = { ...supplier, id: uuid(), createdAt: new Date().toISOString() };
        set(state => ({ suppliers: [...state.suppliers, newSupplier] }));
      },
      updateSupplier: (id, data) => {
        set(state => ({ suppliers: state.suppliers.map(s => s.id === id ? { ...s, ...data } : s) }));
      },
      deleteSupplier: (id) => {
        set(state => ({ suppliers: state.suppliers.filter(s => s.id !== id) }));
      },

      addToCart: (product, quantity = 1) => {
        set(state => {
          const existing = state.cart.find(item => item.product.id === product.id);
          if (existing) {
            return {
              cart: state.cart.map(item =>
                item.product.id === product.id
                  ? { ...item, quantity: Math.min(item.quantity + quantity, product.stockQuantity) }
                  : item
              )
            };
          }
          return { cart: [...state.cart, { product, quantity: Math.min(quantity, product.stockQuantity), discount: 0, discountType: 'percentage' }] };
        });
      },
      updateCartQuantity: (productId, quantity) => {
        set(state => ({
          cart: state.cart.map(item =>
            item.product.id === productId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stockQuantity)) } : item
          )
        }));
      },
      updateCartDiscount: (productId, discount, type) => {
        set(state => ({
          cart: state.cart.map(item =>
            item.product.id === productId ? { ...item, discount, discountType: type } : item
          )
        }));
      },
      removeFromCart: (productId) => {
        set(state => ({ cart: state.cart.filter(item => item.product.id !== productId) }));
      },
      clearCart: () => set({ cart: [], selectedCustomerId: null, appliedCoupon: null }),
      setSelectedCustomer: (customerId) => set({ selectedCustomerId: customerId }),
      applyCoupon: (code) => {
        const coupon = get().coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.isActive);
        if (!coupon) return { success: false, message: 'Invalid coupon code' };
        if (coupon.usedCount >= coupon.usageLimit) return { success: false, message: 'Coupon usage limit exceeded' };
        if (new Date(coupon.expiryDate) < new Date()) return { success: false, message: 'Coupon has expired' };

        const cartTotal = get().cart.reduce((sum, item) => {
          const itemTotal = item.product.sellingPrice * item.quantity;
          const disc = item.discountType === 'percentage' ? itemTotal * item.discount / 100 : item.discount;
          return sum + itemTotal - disc;
        }, 0);

        if (cartTotal < coupon.minOrderAmount) return { success: false, message: `Minimum order amount is ₹${coupon.minOrderAmount}` };

        set({ appliedCoupon: coupon });
        return { success: true, message: `Coupon applied! ${coupon.description}` };
      },
      removeCoupon: () => set({ appliedCoupon: null }),

      completeSale: (paymentMethod, cashReceived, notes) => {
        const state = get();
        const { cart, selectedCustomerId, appliedCoupon, settings, invoiceCounter } = state;
        if (cart.length === 0) return null;

        const items: SaleItem[] = cart.map(cartItem => {
          const itemTotal = cartItem.product.sellingPrice * cartItem.quantity;
          const discountAmount = cartItem.discountType === 'percentage'
            ? itemTotal * cartItem.discount / 100
            : cartItem.discount;
          const afterDiscount = itemTotal - discountAmount;
          const gstAmount = settings.taxEnabled ? afterDiscount * cartItem.product.gstPercentage / (100 + cartItem.product.gstPercentage) : 0;

          return {
            id: uuid(),
            productId: cartItem.product.id,
            productName: cartItem.product.name,
            sku: cartItem.product.sku,
            quantity: cartItem.quantity,
            unitPrice: cartItem.product.sellingPrice,
            discount: discountAmount,
            gstPercentage: cartItem.product.gstPercentage,
            gstAmount: Math.round(gstAmount * 100) / 100,
            totalAmount: Math.round(afterDiscount * 100) / 100,
            hsnCode: cartItem.product.hsnCode,
            mrp: cartItem.product.mrp,
            batchNumber: cartItem.product.batchNumber,
            expiryDate: cartItem.product.expiryDate,
          };
        });

        const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);
        const totalGst = items.reduce((sum, item) => sum + item.gstAmount, 0);
        let grandTotal = items.reduce((sum, item) => sum + item.totalAmount, 0);

        let couponDiscount = 0;
        if (appliedCoupon) {
          if (appliedCoupon.discountType === 'percentage') {
            couponDiscount = Math.min(grandTotal * appliedCoupon.discountValue / 100, appliedCoupon.maxDiscount);
          } else {
            couponDiscount = Math.min(appliedCoupon.discountValue, grandTotal);
          }
          grandTotal -= couponDiscount;
        }

        grandTotal = Math.round(grandTotal * 100) / 100;

        const customer = selectedCustomerId ? state.customers.find(c => c.id === selectedCustomerId) : null;
        const invoiceNumber = generateInvoiceNumber(invoiceCounter, settings.invoicePrefix);

        const paymentStatus: PaymentStatus = paymentMethod === 'credit' ? 'pending' : 'paid';

        const sale: Sale = {
          id: uuid(),
          invoiceNumber,
          customerId: selectedCustomerId || undefined,
          customerName: customer?.name || 'Walk-in Customer',
          items,
          subtotal: Math.round(subtotal * 100) / 100,
          totalDiscount: Math.round((totalDiscount + couponDiscount) * 100) / 100,
          totalGst: Math.round(totalGst * 100) / 100,
          grandTotal,
          paymentMethod,
          paymentStatus,
          status: 'completed',
          cashReceived: paymentMethod === 'cash' ? cashReceived : grandTotal,
          changeGiven: paymentMethod === 'cash' ? Math.max(0, cashReceived - grandTotal) : 0,
          couponCode: appliedCoupon?.code,
          couponDiscount: Math.round(couponDiscount * 100) / 100,
          notes,
          createdBy: state.currentUser?.name || 'System',
          createdAt: new Date().toISOString(),
        };

        const updatedProducts = state.products.map(p => {
          const saleItem = items.find(i => i.productId === p.id);
          if (saleItem) {
            return { ...p, stockQuantity: Math.max(0, p.stockQuantity - saleItem.quantity), updatedAt: new Date().toISOString() };
          }
          return p;
        });

        const inventoryLogs: InventoryLog[] = items.map(item => ({
          id: uuid(),
          productId: item.productId,
          productName: item.productName,
          type: 'out' as const,
          quantity: item.quantity,
          previousStock: state.products.find(p => p.id === item.productId)?.stockQuantity || 0,
          newStock: Math.max(0, (state.products.find(p => p.id === item.productId)?.stockQuantity || 0) - item.quantity),
          reference: invoiceNumber,
          notes: `Sale: ${invoiceNumber}`,
          createdBy: state.currentUser?.name || 'System',
          createdAt: new Date().toISOString(),
        }));

        let updatedCustomers = state.customers;
        if (customer) {
          const loyaltyPoints = Math.floor(grandTotal * settings.loyaltyPointsPerRupee);
          updatedCustomers = state.customers.map(c =>
            c.id === customer.id
              ? {
                  ...c,
                  loyaltyPoints: c.loyaltyPoints + loyaltyPoints,
                  outstandingAmount: paymentMethod === 'credit' ? c.outstandingAmount + grandTotal : c.outstandingAmount,
                }
              : c
          );
        }

        let updatedCoupons = state.coupons;
        if (appliedCoupon) {
          updatedCoupons = state.coupons.map(c =>
            c.id === appliedCoupon.id ? { ...c, usedCount: c.usedCount + 1 } : c
          );
        }

        set({
          sales: [...state.sales, sale],
          products: updatedProducts,
          inventoryLogs: [...state.inventoryLogs, ...inventoryLogs],
          customers: updatedCustomers,
          coupons: updatedCoupons,
          cart: [],
          selectedCustomerId: null,
          appliedCoupon: null,
          invoiceCounter: invoiceCounter + 1,
        });

        get().checkLowStock();

        return sale;
      },

      processReturn: (saleId, returnItems, notes) => {
        const state = get();
        const originalSale = state.sales.find(s => s.id === saleId);
        if (!originalSale) return null;

        const items: SaleItem[] = returnItems.map(ri => {
          const originalItem = originalSale.items.find(i => i.id === ri.itemId)!;
          const ratio = ri.quantity / originalItem.quantity;
          return {
            ...originalItem,
            id: uuid(),
            quantity: ri.quantity,
            discount: originalItem.discount * ratio,
            gstAmount: originalItem.gstAmount * ratio,
            totalAmount: originalItem.totalAmount * ratio,
          };
        });

        const refundTotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
        const invoiceNumber = generateInvoiceNumber(state.invoiceCounter, 'RET');

        const returnSale: Sale = {
          id: uuid(),
          invoiceNumber,
          customerId: originalSale.customerId,
          customerName: originalSale.customerName,
          items,
          subtotal: -items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
          totalDiscount: -items.reduce((sum, i) => sum + i.discount, 0),
          totalGst: -items.reduce((sum, i) => sum + i.gstAmount, 0),
          grandTotal: -Math.round(refundTotal * 100) / 100,
          paymentMethod: originalSale.paymentMethod,
          paymentStatus: 'refunded',
          status: 'returned',
          cashReceived: 0,
          changeGiven: 0,
          couponDiscount: 0,
          notes: `Return for ${originalSale.invoiceNumber}. ${notes}`,
          createdBy: state.currentUser?.name || 'System',
          createdAt: new Date().toISOString(),
        };

        const updatedProducts = state.products.map(p => {
          const returnItem = items.find(i => i.productId === p.id);
          if (returnItem) {
            return { ...p, stockQuantity: p.stockQuantity + returnItem.quantity, updatedAt: new Date().toISOString() };
          }
          return p;
        });

        set({
          sales: [...state.sales.map(s => s.id === saleId ? { ...s, status: 'returned' as SaleStatus } : s), returnSale],
          products: updatedProducts,
          invoiceCounter: state.invoiceCounter + 1,
        });

        return returnSale;
      },

      addPurchase: (purchase) => {
        const state = get();
        const po: Purchase = {
          ...purchase,
          id: uuid(),
          purchaseOrderNumber: generatePONumber(state.purchaseCounter),
          createdAt: new Date().toISOString(),
        };
        set(s => ({ purchases: [...s.purchases, po], purchaseCounter: s.purchaseCounter + 1 }));
      },
      updatePurchaseStatus: (id, status) => {
        set(state => ({
          purchases: state.purchases.map(p => p.id === id ? { ...p, status } : p)
        }));
      },
      receivePurchase: (id) => {
        const state = get();
        const purchase = state.purchases.find(p => p.id === id);
        if (!purchase) return;

        const updatedProducts = state.products.map(p => {
          const purchaseItem = purchase.items.find(i => i.productId === p.id);
          if (purchaseItem) {
            return { ...p, stockQuantity: p.stockQuantity + purchaseItem.quantity, updatedAt: new Date().toISOString() };
          }
          return p;
        });

        const inventoryLogs: InventoryLog[] = purchase.items.map(item => ({
          id: uuid(),
          productId: item.productId,
          productName: item.productName,
          type: 'in' as const,
          quantity: item.quantity,
          previousStock: state.products.find(p => p.id === item.productId)?.stockQuantity || 0,
          newStock: (state.products.find(p => p.id === item.productId)?.stockQuantity || 0) + item.quantity,
          reference: purchase.purchaseOrderNumber,
          notes: `Purchase received: ${purchase.purchaseOrderNumber}`,
          createdBy: state.currentUser?.name || 'System',
          createdAt: new Date().toISOString(),
        }));

        set({
          purchases: state.purchases.map(p => p.id === id ? { ...p, status: 'received', receivedAt: new Date().toISOString() } : p),
          products: updatedProducts,
          inventoryLogs: [...state.inventoryLogs, ...inventoryLogs],
        });
      },

      addInventoryLog: (log) => {
        const newLog: InventoryLog = { ...log, id: uuid(), createdAt: new Date().toISOString() };
        set(state => ({ inventoryLogs: [...state.inventoryLogs, newLog] }));
      },
      adjustStock: (productId, quantity, type, notes) => {
        const product = get().products.find(p => p.id === productId);
        if (!product) return;

        const previousStock = product.stockQuantity;
        let newStock = previousStock;
        if (type === 'in') newStock = previousStock + quantity;
        else if (type === 'out' || type === 'damage' || type === 'expired') newStock = Math.max(0, previousStock - quantity);
        else newStock = quantity;

        set(state => ({
          products: state.products.map(p => p.id === productId ? { ...p, stockQuantity: newStock, updatedAt: new Date().toISOString() } : p),
        }));

        get().addInventoryLog({
          productId,
          productName: product.name,
          type,
          quantity,
          previousStock,
          newStock,
          reference: `Manual ${type}`,
          notes,
          createdBy: get().currentUser?.name || 'System',
        });

        get().checkLowStock();
      },

      addExpense: (expense) => {
        const newExpense: Expense = { ...expense, id: uuid(), createdAt: new Date().toISOString() };
        set(state => ({ expenses: [...state.expenses, newExpense] }));
      },
      updateExpense: (id, data) => {
        set(state => ({ expenses: state.expenses.map(e => e.id === id ? { ...e, ...data } : e) }));
      },
      deleteExpense: (id) => {
        set(state => ({ expenses: state.expenses.filter(e => e.id !== id) }));
      },

      addNotification: (notification) => {
        const newNotif: Notification = { ...notification, id: uuid(), isRead: false, createdAt: new Date().toISOString() };
        set(state => ({ notifications: [newNotif, ...state.notifications].slice(0, 200) }));
      },
      markNotificationRead: (id) => {
        set(state => ({ notifications: state.notifications.map(n => n.id === id ? { ...n, isRead: true } : n) }));
      },
      markAllNotificationsRead: () => {
        set(state => ({ notifications: state.notifications.map(n => ({ ...n, isRead: true })) }));
      },

      addAuditLog: (log) => {
        const newLog: AuditLog = { ...log, id: uuid(), createdAt: new Date().toISOString() };
        set(state => ({ auditLogs: [newLog, ...state.auditLogs].slice(0, 500) }));
      },

      updateSettings: (newSettings) => {
        set(state => ({ settings: { ...state.settings, ...newSettings } }));
      },

      addUser: (user) => {
        const newUser: User = { ...user, id: uuid(), createdAt: new Date().toISOString() };
        set(state => ({ users: [...state.users, newUser] }));
      },
      updateUser: (id, data) => {
        set(state => ({ users: state.users.map(u => u.id === id ? { ...u, ...data } : u) }));
      },
      deleteUser: (id) => {
        set(state => ({ users: state.users.filter(u => u.id !== id) }));
      },

      addCoupon: (coupon) => {
        const newCoupon: Coupon = { ...coupon, id: uuid(), createdAt: new Date().toISOString(), usedCount: 0 };
        set(state => ({ coupons: [...state.coupons, newCoupon] }));
      },
      updateCoupon: (id, data) => {
        set(state => ({ coupons: state.coupons.map(c => c.id === id ? { ...c, ...data } : c) }));
      },
      deleteCoupon: (id) => {
        set(state => ({ coupons: state.coupons.filter(c => c.id !== id) }));
      },

      checkLowStock: () => {
        const products = get().products;
        products.forEach(p => {
          if (p.stockQuantity === 0) {
            const existing = get().notifications.find(n => n.type === 'out_of_stock' && n.message.includes(p.name) && !n.isRead);
            if (!existing) {
              get().addNotification({ type: 'out_of_stock', title: 'Out of Stock', message: `${p.name} is out of stock!` });
            }
          } else if (p.stockQuantity <= p.reorderLevel) {
            const existing = get().notifications.find(n => n.type === 'low_stock' && n.message.includes(p.name) && !n.isRead);
            if (!existing) {
              get().addNotification({ type: 'low_stock', title: 'Low Stock Alert', message: `${p.name} stock is low (${p.stockQuantity} remaining)` });
            }
          }
        });
      },
      checkExpiry: () => {
        const products = get().products;
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        products.forEach(p => {
          if (p.expiryDate && new Date(p.expiryDate) <= thirtyDaysFromNow) {
            const existing = get().notifications.find(n => n.type === 'expiry' && n.message.includes(p.name) && !n.isRead);
            if (!existing) {
              const daysLeft = Math.ceil((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              get().addNotification({
                type: 'expiry',
                title: 'Expiry Alert',
                message: `${p.name} (Batch: ${p.batchNumber}) expires in ${daysLeft} days`
              });
            }
          }
        });
      },

      getProductById: (id) => get().products.find(p => p.id === id),
      getCategoryById: (id) => get().categories.find(c => c.id === id),
      getBrandById: (id) => get().brands.find(b => b.id === id),
      getCustomerById: (id) => get().customers.find(c => c.id === id),
      getSupplierById: (id) => get().suppliers.find(s => s.id === id),

      getSalesForDateRange: (start, end) => {
        return get().sales.filter(s => {
          const d = new Date(s.createdAt);
          return d >= new Date(start) && d <= new Date(end);
        });
      },
      getDailySales: (date) => {
        return get().sales.filter(s => s.createdAt.startsWith(date));
      },
      getTopSellingProducts: (limit) => {
        const salesMap = new Map<string, { productName: string; totalQty: number; totalRevenue: number }>();
        get().sales.filter(s => s.status === 'completed').forEach(sale => {
          sale.items.forEach(item => {
            const existing = salesMap.get(item.productId);
            if (existing) {
              existing.totalQty += item.quantity;
              existing.totalRevenue += item.totalAmount;
            } else {
              salesMap.set(item.productId, { productName: item.productName, totalQty: item.quantity, totalRevenue: item.totalAmount });
            }
          });
        });
        return Array.from(salesMap.entries())
          .map(([productId, data]) => ({ productId, ...data }))
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, limit);
      },
      getRevenueByDate: (days) => {
        const result: { date: string; revenue: number; profit: number }[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          const daySales = get().sales.filter(s => s.createdAt.startsWith(dateStr) && s.status === 'completed');
          const revenue = daySales.reduce((sum, s) => sum + s.grandTotal, 0);
          const cost = daySales.reduce((sum, s) => {
            return sum + s.items.reduce((iSum, item) => {
              const product = get().products.find(p => p.id === item.productId);
              return iSum + (product?.purchasePrice || 0) * item.quantity;
            }, 0);
          }, 0);
          result.push({ date: dateStr, revenue: Math.round(revenue * 100) / 100, profit: Math.round((revenue - cost) * 100) / 100 });
        }
        return result;
      },

      initializeData: () => {
        const state = get();
        if (!state.isInitialized) {
          set({
            isInitialized: true,
            users: seedUsers,
            categories: seedCategories,
            brands: seedBrands,
            products: seedProducts,
            customers: seedCustomers,
            suppliers: seedSuppliers,
            coupons: seedCoupons,
            sales: [],
            expenses: [],
            notifications: [],
            auditLogs: [],
          });
        }
      },
    }),
    {
      name: 'battery-management-store',
      partialize: (state) => ({
        isInitialized: state.isInitialized,
        darkMode: state.darkMode,
        users: state.users,
        products: state.products,
        categories: state.categories,
        brands: state.brands,
        customers: state.customers,
        suppliers: state.suppliers,
        sales: state.sales,
        purchases: state.purchases,
        inventoryLogs: state.inventoryLogs,
        expenses: state.expenses,
        notifications: state.notifications,
        auditLogs: state.auditLogs,
        settings: state.settings,
        coupons: state.coupons,
        invoiceCounter: state.invoiceCounter,
        purchaseCounter: state.purchaseCounter,
      }),
    }
  )
);
