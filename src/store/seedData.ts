import { v4 as uuid } from 'uuid';
import type { User, Category, Brand, Product, Customer, Supplier, Coupon, StoreSettings } from '@/types';

export const defaultSettings: StoreSettings = {
  storeName: 'SRI KARUPPUSAMY EARTH MOVERS',
  storeAddress: '#252,Chennai road ,Near Govt bus tepo',
  storeCity: 'Krishnagiri',
  storeState: 'Tamilnadu',
  storePincode: '635002',
  storePhone: '+91 9865949481',
  storeEmail: 'velmurugesan82@gmail.com',
  gstNumber: '33AQXPV8034E1ZB',
  currency: 'INR',
  currencySymbol: '₹',
  taxEnabled: true,
  defaultTaxRate: 18,
  invoicePrefix: 'INV',
  invoiceFooter: 'Thank you for choosing SRI KARUPPUSAMY EARTH MOVERS! Visit again.',
  loyaltyPointsPerRupee: 1,
  loyaltyRedemptionRate: 0.5,
  upiId: 'yourstore@upi',
  upiMerchantName: 'SRI KARUPPUSAMY EARTH MOVERS',
  razorpayKeyId: '',
  razorpayEnabled: false,
};

export const seedUsers: User[] = [
  { id: uuid(), name: 'Velu murugesan', email: 'admin@srikaruppusamy.com', role: 'admin', phone: '9865949481', isActive: true, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString(), password: 'admin123' },
  { id: uuid(), name: 'Velu murugesan', email: 'velmurugesan82@gmail.com', role: 'admin', phone: '9865949481', isActive: true, createdAt: new Date().toISOString(), lastLogin: new Date().toISOString(), password: 'admin123' },
  { id: uuid(), name: 'Velu murugesan', email: 'manager@srikaruppusamy.com', role: 'manager', phone: '9865949481', isActive: true, createdAt: new Date().toISOString(), password: 'demo123' },
  { id: uuid(), name: 'Velu murugesan', email: 'cashier@srikaruppusamy.com', role: 'cashier', phone: '9865949481', isActive: true, createdAt: new Date().toISOString(), password: 'demo123' },
];

export const seedCategories: Category[] = [
  { id: 'cat-1', name: 'Car Battery', description: 'Car batteries for hatchback, sedan, SUV', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat-2', name: 'Bike Battery', description: 'Two-wheeler batteries', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat-3', name: 'Heavy Vehicle Battery', description: 'Batteries for trucks, tractors, and JCVs', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat-4', name: 'Inverter Battery', description: 'Tubular and flat plate inverter batteries', isActive: true, createdAt: new Date().toISOString() },
  { id: 'cat-5', name: 'UPS & Solar Battery', description: 'VRLA/SMF and solar deep cycle batteries', isActive: true, createdAt: new Date().toISOString() },
];

export const seedBrands: Brand[] = [
  { id: 'brand-1', name: 'Exide', description: 'Exide Batteries', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-2', name: 'Amaron', description: 'Amaron Batteries', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-3', name: 'SF Sonic', description: 'SF Sonic Batteries', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-4', name: 'Tata Green', description: 'Tata Green Batteries', isActive: true, createdAt: new Date().toISOString() },
  { id: 'brand-5', name: 'Livguard', description: 'Livguard Batteries & Inverters', isActive: true, createdAt: new Date().toISOString() },
];

export const seedProducts: Product[] = [];
export const seedCustomers: Customer[] = [];
export const seedSuppliers: Supplier[] = [];
export const seedCoupons: Coupon[] = [];
