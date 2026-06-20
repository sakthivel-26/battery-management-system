export type UserRole = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  password?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  brandId: string;
  description: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number;
  mrp: number;
  gstPercentage: number;
  hsnCode: string;
  stockQuantity: number;
  reorderLevel: number;
  batchNumber: string;
  expiryDate?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  loyaltyPoints: number;
  creditLimit: number;
  outstandingAmount: number;
  isActive: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  outstandingDues: number;
  isActive: boolean;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'card' | 'credit' | 'split';
export type PaymentStatus = 'paid' | 'partial' | 'pending' | 'refunded';
export type SaleStatus = 'completed' | 'pending' | 'returned' | 'cancelled';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
  hsnCode?: string;
  mrp?: number;
  batchNumber?: string;
  expiryDate?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: SaleStatus;
  cashReceived: number;
  changeGiven: number;
  couponCode?: string;
  couponDiscount: number;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface PurchaseItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
  gstAmount: number;
  totalAmount: number;
}

export interface Purchase {
  id: string;
  purchaseOrderNumber: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  status: 'ordered' | 'received' | 'partial' | 'cancelled';
  notes: string;
  createdBy: string;
  createdAt: string;
  receivedAt?: string;
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'damage' | 'expired' | 'transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  reference: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  reference: string;
  date: string;
  createdBy: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'low_stock' | 'out_of_stock' | 'expiry' | 'payment_due' | 'daily_summary' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  storeAddress: string;
  storeCity: string;
  storeState: string;
  storePincode: string;
  storePhone: string;
  storeEmail: string;
  gstNumber: string;
  currency: string;
  currencySymbol: string;
  taxEnabled: boolean;
  defaultTaxRate: number;
  invoicePrefix: string;
  invoiceFooter: string;
  loyaltyPointsPerRupee: number;
  loyaltyRedemptionRate: number;
  // Payment Settings
  upiId: string;
  upiMerchantName: string;
  razorpayKeyId: string;
  razorpayEnabled: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
}

export interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  todayProfit: number;
  totalProducts: number;
  lowStockProducts: number;
  pendingPayments: number;
  totalCustomers: number;
  totalSuppliers: number;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiryDate: string;
  createdAt: string;
}
