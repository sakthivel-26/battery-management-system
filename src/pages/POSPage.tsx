import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { BarcodeScanner, useBarcodeListener } from '@/components/BarcodeScanner';
import { UPIPayment, CardPayment } from '@/components/UPIPayment';
import {
  Search, Plus, Minus, Trash2, User, Tag, CreditCard,
  Banknote, Smartphone, Receipt, Printer, Download,
  ShoppingCart, X, Percent, BadgeDollarSign, ScanLine, Keyboard
} from 'lucide-react';
import { format } from 'date-fns';
import type { PaymentMethod, Sale } from '@/types';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import { numberToWords } from '@/utils/numberToWords';

export function POSPage() {
  const {
    products, customers, cart, settings, selectedCustomerId, appliedCoupon,
    addToCart, updateCartQuantity, updateCartDiscount, removeFromCart, clearCart,
    setSelectedCustomer, applyCoupon, removeCoupon, completeSale
  } = useStore();

  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [notes, setNotes] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Smart product finder — matches barcode, SKU, partial barcode, stripped zeros
  const findProductByCode = useCallback((code: string) => {
    const cleaned = code.trim().replace(/[\r\n\t]/g, '').replace(/\s+/g, '');
    if (!cleaned) return null;
    const lower = cleaned.toLowerCase();

    // 1. Exact barcode match
    let p = products.find(x => x.isActive && x.barcode === cleaned);
    if (p) return p;

    // 2. Exact SKU match (case insensitive)
    p = products.find(x => x.isActive && x.sku.toLowerCase() === lower);
    if (p) return p;

    // 3. Barcode with leading zeros stripped (scanners sometimes add/remove)
    p = products.find(x => x.isActive && (
      x.barcode.replace(/^0+/, '') === cleaned.replace(/^0+/, '') ||
      x.barcode.endsWith(cleaned) ||
      cleaned.endsWith(x.barcode)
    ));
    if (p) return p;

    // 4. Partial barcode match (at least 8 digits matching)
    if (cleaned.length >= 8) {
      p = products.find(x => x.isActive && (
        x.barcode.includes(cleaned) || cleaned.includes(x.barcode)
      ));
      if (p) return p;
    }

    // 5. SKU partial match
    p = products.find(x => x.isActive && x.sku.toLowerCase().includes(lower));
    if (p) return p;

    return null;
  }, [products]);

  const handleBarcodeScan = useCallback((barcode: string) => {
    const product = findProductByCode(barcode);
    if (product) {
      if (product.stockQuantity <= 0) {
        showToast('error', `${product.name} is out of stock`);
        return;
      }
      addToCart(product);
      showToast('success', `✓ Added: ${product.name} (₹${product.sellingPrice})`);
    } else {
      showToast('error', `No product found for: "${barcode}"`);
    }
  }, [findProductByCode, addToCart, showToast]);

  // USB barcode scanner listener (fires when no input is focused)
  useBarcodeListener(handleBarcodeScan, !showPayment && !showInvoice && !showCustomerModal && !showScanner);

  // Handle Enter key in search box — try barcode lookup first
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      const product = findProductByCode(searchQuery);
      if (product) {
        if (product.stockQuantity <= 0) {
          showToast('error', `${product.name} is out of stock`);
        } else {
          addToCart(product);
          showToast('success', `✓ Added: ${product.name} (₹${product.sellingPrice})`);
          setSearchQuery('');
        }
      } else {
        // Not a barcode — just let search filter work, show message
        showToast('info', `Showing search results for "${searchQuery}"`);
      }
    }
  }, [searchQuery, findProductByCode, addToCart, showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'F2') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        setShowScanner(true);
      } else if (e.key === 'F4' && cart.length > 0) {
        e.preventDefault();
        setShowPayment(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        clearCart();
        showToast('info', 'Cart cleared');
      } else if (e.key === 'Escape') {
        setShowPayment(false);
        setShowCustomerModal(false);
        setShowScanner(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, clearCart, showToast]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products.filter(p => p.isActive).slice(0, 20);
    const q = searchQuery.toLowerCase();
    return products.filter(p =>
      p.isActive && (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      )
    );
  }, [searchQuery, products]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.filter(c => c.isActive);
    const q = customerSearch.toLowerCase();
    return customers.filter(c => c.isActive && (c.name.toLowerCase().includes(q) || c.phone.includes(q)));
  }, [customerSearch, customers]);

  const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;

  const cartCalculations = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    let totalItems = 0;

    cart.forEach(item => {
      const itemTotal = item.product.sellingPrice * item.quantity;
      const disc = item.discountType === 'percentage' ? itemTotal * item.discount / 100 : item.discount;
      const afterDisc = itemTotal - disc;
      const gst = settings.taxEnabled ? afterDisc * item.product.gstPercentage / (100 + item.product.gstPercentage) : 0;

      subtotal += itemTotal;
      totalDiscount += disc;
      totalGst += gst;
      totalItems += item.quantity;
    });

    let couponDisc = 0;
    if (appliedCoupon) {
      const afterItemDisc = subtotal - totalDiscount;
      if (appliedCoupon.discountType === 'percentage') {
        couponDisc = Math.min(afterItemDisc * appliedCoupon.discountValue / 100, appliedCoupon.maxDiscount);
      } else {
        couponDisc = Math.min(appliedCoupon.discountValue, afterItemDisc);
      }
    }

    const grandTotal = subtotal - totalDiscount - couponDisc;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      totalDiscount: Math.round((totalDiscount + couponDisc) * 100) / 100,
      totalGst: Math.round(totalGst * 100) / 100,
      couponDiscount: Math.round(couponDisc * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      totalItems,
    };
  }, [cart, appliedCoupon, settings]);

  const handleApplyCoupon = () => {
    if (!couponCode) return;
    const result = applyCoupon(couponCode);
    if (result.success) {
      showToast('success', result.message);
      setCouponCode('');
    } else {
      showToast('error', result.message);
    }
  };

  const handleCompleteSale = () => {
    if (paymentMethod === 'cash' && Number(cashReceived) < cartCalculations.grandTotal) {
      showToast('error', 'Insufficient cash received');
      return;
    }
    const sale = completeSale(paymentMethod, Number(cashReceived) || cartCalculations.grandTotal, notes);
    if (sale) {
      setLastSale(sale);
      setShowPayment(false);
      setShowInvoice(true);
      setCashReceived('');
      setNotes('');
      setPaymentMethod('cash');
      showToast('success', `Sale completed! Invoice: ${sale.invoiceNumber}`);
    }
  };

  const handlePrintInvoice = useCallback(() => {
    if (!lastSale) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const invoiceCustomer = lastSale.customerId ? customers.find(c => c.id === lastSale.customerId) : null;
    const html = generateInvoiceHTML(lastSale, settings, invoiceCustomer);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }, [lastSale, settings, customers]);

  const handleDownloadPDF = useCallback(() => {
    if (!lastSale) return;
    const invoiceCustomer = lastSale.customerId ? customers.find(c => c.id === lastSale.customerId) : null;
    generateInvoicePDF(lastSale, settings, invoiceCustomer);
  }, [lastSale, settings, customers]);

  const changeAmount = paymentMethod === 'cash' && cashReceived
    ? Math.max(0, Number(cashReceived) - cartCalculations.grandTotal) : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-8rem)] animate-fade-in">
      {/* Product Search Panel */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Type name, SKU, or scan barcode + Enter..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
              autoFocus
            />
          </div>
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            title="Scan Barcode (F3)"
          >
            <ScanLine size={16} />
            <span className="hidden sm:inline">Scan</span>
          </button>
        </div>
        
        <div className="flex items-center gap-3 mb-2 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
          <span className="flex items-center gap-1"><Keyboard size={12} /></span>
          <span><span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-medium">Enter</span> Add by barcode</span>
          <span><span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-medium">F2</span> Focus search</span>
          <span><span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-medium">F3</span> Scanner</span>
          <span><span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-medium">F4</span> Pay</span>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 content-start">
          {filteredProducts.map(product => {
            const inCart = cart.find(c => c.product.id === product.id);
            return (
              <button
                key={product.id}
                onClick={() => {
                  if (product.stockQuantity <= 0) {
                    showToast('error', 'Product is out of stock');
                    return;
                  }
                  addToCart(product);
                }}
                className={`p-3 rounded-xl border text-left transition-all hover:shadow-md ${
                  inCart
                    ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800'
                } ${product.stockQuantity === 0 ? 'opacity-50' : ''}`}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">SKU: {product.sku}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                    {settings.currencySymbol}{product.sellingPrice}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                    product.stockQuantity > product.reorderLevel
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : product.stockQuantity > 0
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                  }`}>
                    {product.stockQuantity} {product.unit}
                  </span>
                </div>
                {inCart && (
                  <div className="mt-1.5 text-xs font-medium text-primary-600 dark:text-primary-400">
                    In cart: {inCart.quantity}
                  </div>
                )}
              </button>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <ShoppingCart size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-full lg:w-[420px] flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 min-h-0">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart size={18} />
              Cart ({cartCalculations.totalItems} items)
            </h3>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-rose-500 hover:text-rose-600 font-medium">
                Clear All
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="flex items-center gap-2">
            {selectedCustomer ? (
              <div className="flex-1 flex items-center gap-2 p-2 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <User size={14} className="text-primary-600" />
                <span className="text-sm text-primary-700 dark:text-primary-300 font-medium flex-1 truncate">{selectedCustomer.name}</span>
                <button onClick={() => setSelectedCustomer(null)} className="p-0.5 hover:bg-primary-100 rounded">
                  <X size={12} className="text-primary-600" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomerModal(true)}
                className="flex-1 flex items-center gap-2 p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors text-sm"
              >
                <User size={14} /> Select Customer
              </button>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Search and add products</p>
            </div>
          ) : (
            cart.map(item => {
              const itemTotal = item.product.sellingPrice * item.quantity;
              const disc = item.discountType === 'percentage' ? itemTotal * item.discount / 100 : item.discount;
              return (
                <div key={item.product.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {settings.currencySymbol}{item.product.sellingPrice} × {item.quantity}
                        {item.product.gstPercentage > 0 && ` (GST: ${item.product.gstPercentage}%)`}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      {settings.currencySymbol}{(itemTotal - disc).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <button onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-l-lg">
                        <Minus size={12} />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={e => updateCartQuantity(item.product.id, Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-10 text-center text-sm bg-transparent border-0 outline-none text-gray-900 dark:text-white"
                        min="1"
                        max={item.product.stockQuantity}
                      />
                      <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="number"
                        placeholder="Disc"
                        value={item.discount || ''}
                        onChange={e => updateCartDiscount(item.product.id, Math.max(0, parseFloat(e.target.value) || 0), item.discountType)}
                        className="w-16 px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                      />
                      <button
                        onClick={() => updateCartDiscount(item.product.id, item.discount, item.discountType === 'percentage' ? 'fixed' : 'percentage')}
                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-600 text-xs"
                        title="Toggle discount type"
                      >
                        {item.discountType === 'percentage' ? <Percent size={12} /> : <BadgeDollarSign size={12} />}
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  {disc > 0 && (
                    <p className="text-xs text-emerald-600 mt-1">Discount: -{settings.currencySymbol}{disc.toFixed(2)}</p>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Coupon & Totals */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 p-4">
            {!appliedCoupon ? (
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                  />
                </div>
                <button onClick={handleApplyCoupon} className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">
                  Apply
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mb-3">
                <Tag size={14} className="text-emerald-600" />
                <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium flex-1">{appliedCoupon.code} applied</span>
                <span className="text-sm font-semibold text-emerald-600">-{settings.currencySymbol}{cartCalculations.couponDiscount}</span>
                <button onClick={removeCoupon} className="p-0.5 hover:bg-emerald-100 rounded">
                  <X size={12} className="text-emerald-600" />
                </button>
              </div>
            )}

            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{settings.currencySymbol}{cartCalculations.subtotal.toFixed(2)}</span>
              </div>
              {cartCalculations.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>-{settings.currencySymbol}{cartCalculations.totalDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>GST (incl.)</span>
                <span>{settings.currencySymbol}{cartCalculations.totalGst.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-600">
                <span>Total</span>
                <span>{settings.currencySymbol}{cartCalculations.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowPayment(true)}
              className="w-full mt-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <CreditCard size={18} />
              Proceed to Payment
            </button>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <Modal isOpen={showPayment} onClose={() => setShowPayment(false)} title="Complete Payment" size="md">
        <div className="space-y-5">
          <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
            <p className="text-sm text-gray-500 dark:text-gray-400">Amount to Pay</p>
            <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
              {settings.currencySymbol}{cartCalculations.grandTotal.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {([
                { id: 'cash', label: 'Cash', icon: Banknote },
                { id: 'upi', label: 'UPI', icon: Smartphone },
                { id: 'card', label: 'Card', icon: CreditCard },
                { id: 'credit', label: 'Credit', icon: Receipt },
              ] as const).map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    paymentMethod === m.id
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                  }`}
                >
                  <m.icon size={20} className={`mx-auto mb-1 ${paymentMethod === m.id ? 'text-primary-600' : 'text-gray-400'}`} />
                  <p className={`text-xs font-medium ${paymentMethod === m.id ? 'text-primary-600' : 'text-gray-500'}`}>{m.label}</p>
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'cash' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Cash Received</label>
              <input
                type="number"
                value={cashReceived}
                onChange={e => setCashReceived(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-semibold outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={cartCalculations.grandTotal.toFixed(2)}
              />
              {cashReceived && Number(cashReceived) >= cartCalculations.grandTotal && (
                <p className="text-sm text-emerald-600 mt-1.5 font-medium">
                  Change: {settings.currencySymbol}{changeAmount.toFixed(2)}
                </p>
              )}
              <div className="flex gap-2 mt-2">
                {[cartCalculations.grandTotal, 500, 1000, 2000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setCashReceived(amount.toString())}
                    className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-gray-700 dark:text-gray-300"
                  >
                    {settings.currencySymbol}{amount}
                  </button>
                ))}
              </div>
              <button
                onClick={handleCompleteSale}
                disabled={Number(cashReceived) < cartCalculations.grandTotal}
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
              >
                Complete Sale
              </button>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <UPIPayment
              amount={cartCalculations.grandTotal}
              invoiceNumber={`INV-${Date.now()}`}
              onPaymentConfirmed={handleCompleteSale}
            />
          )}

          {paymentMethod === 'card' && (
            <CardPayment
              amount={cartCalculations.grandTotal}
              onPaymentConfirmed={handleCompleteSale}
            />
          )}

          {paymentMethod === 'credit' && (
            <>
              {!selectedCustomer ? (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm text-amber-700 dark:text-amber-400">
                  Please select a customer for credit billing
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      Credit sale for <strong>{selectedCustomer.name}</strong>
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                      Current outstanding: ₹{selectedCustomer.outstandingAmount} | Credit limit: ₹{selectedCustomer.creditLimit}
                    </p>
                  </div>
                  <button
                    onClick={handleCompleteSale}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
                  >
                    Record Credit Sale
                  </button>
                </div>
              )}
            </>
          )}

          {(paymentMethod === 'cash' || paymentMethod === 'credit') && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Additional notes..."
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Invoice Modal */}
      <Modal isOpen={showInvoice} onClose={() => { setShowInvoice(false); setLastSale(null); }} title="Invoice" size="lg">
        {lastSale && (() => {
          const invoiceCustomer = lastSale.customerId ? customers.find(c => c.id === lastSale.customerId) : null;
          
          // GST Tax Breakdown calculations
          const gstSummaryMap = new Map<string, { taxableValue: number; gstPercentage: number; gstAmount: number }>();
          lastSale.items.forEach(item => {
            const hsn = item.hsnCode || 'N/A';
            const taxable = item.totalAmount - item.gstAmount;
            const existing = gstSummaryMap.get(hsn);
            if (existing) {
              existing.taxableValue += taxable;
              existing.gstAmount += item.gstAmount;
            } else {
              gstSummaryMap.set(hsn, {
                taxableValue: taxable,
                gstPercentage: item.gstPercentage,
                gstAmount: item.gstAmount
              });
            }
          });

          // MRP savings calculation
          const savings = lastSale.items.reduce((sum, item) => {
            const mrpVal = item.mrp || item.unitPrice;
            const savingsOnMrp = Math.max(0, mrpVal - item.unitPrice) * item.quantity;
            return sum + savingsOnMrp;
          }, 0) + lastSale.totalDiscount;

          const words = numberToWords(lastSale.grandTotal);

          return (
            <div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-4 max-h-[70vh] overflow-y-auto font-mono text-xs text-gray-800 dark:text-gray-200" id="invoice-content">
                <div className="text-center mb-4 font-sans">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{settings.storeName}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{settings.storeAddress}, {settings.storeCity}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{settings.storeState} - {settings.storePincode}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">GSTIN: {settings.gstNumber} | Ph: {settings.storePhone}</p>
                </div>
                
                <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-3 mb-3 text-[11px]">
                  <div className="flex justify-between">
                    <span><strong>Invoice:</strong> {lastSale.invoiceNumber}</span>
                    <span><strong>Date:</strong> {format(new Date(lastSale.createdAt), 'dd/MM/yyyy hh:mm a')}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span><strong>Cashier:</strong> {lastSale.createdBy}</span>
                    <span><strong>Payment:</strong> <span className="uppercase font-semibold">{lastSale.paymentMethod}</span></span>
                  </div>
                </div>

                <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-3 mb-3 text-[11px]">
                  <p><strong>Customer:</strong> {lastSale.customerName}</p>
                  {invoiceCustomer?.phone && <p><strong>Phone:</strong> {invoiceCustomer.phone}</p>}
                  {invoiceCustomer?.address && (
                    <p className="mt-0.5">
                      <strong>Address:</strong> {invoiceCustomer.address}, {invoiceCustomer.city}, {invoiceCustomer.state} - {invoiceCustomer.pincode}
                    </p>
                  )}
                  {invoiceCustomer && invoiceCustomer.loyaltyPoints > 0 && (
                    <p className="mt-0.5"><strong>Loyalty Points Balance:</strong> {invoiceCustomer.loyaltyPoints}</p>
                  )}
                </div>

                <table className="w-full text-[11px] mb-3">
                  <thead>
                    <tr className="border-b border-gray-300 dark:border-gray-600 text-left font-bold text-gray-900 dark:text-white">
                      <th className="py-1.5 w-[50%]">Item Description</th>
                      <th className="py-1.5 w-[10%] text-center">Qty</th>
                      <th className="py-1.5 w-[20%] text-right">Price</th>
                      <th className="py-1.5 w-[20%] text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastSale.items.map(item => (
                      <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700/50">
                        <td className="py-2 text-gray-950 dark:text-gray-100">
                          <div>{item.productName}</div>
                          <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 space-x-1 flex flex-wrap">
                            {item.hsnCode && <span>HSN: {item.hsnCode}</span>}
                            {item.batchNumber && <span>· Batch: {item.batchNumber}</span>}
                            {item.expiryDate && <span>· Exp: {item.expiryDate}</span>}
                            {item.mrp && item.mrp > item.unitPrice && (
                              <span className="line-through text-rose-500 ml-1">MRP: {settings.currencySymbol}{item.mrp}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 text-center text-gray-700 dark:text-gray-300">{item.quantity}</td>
                        <td className="py-2 text-right text-gray-700 dark:text-gray-300">{settings.currencySymbol}{item.unitPrice.toFixed(2)}</td>
                        <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{settings.currencySymbol}{item.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="space-y-1.5 text-[11px] border-t border-dashed border-gray-300 dark:border-gray-600 pt-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{settings.currencySymbol}{lastSale.subtotal.toFixed(2)}</span>
                  </div>
                  {lastSale.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount</span>
                      <span>-{settings.currencySymbol}{lastSale.totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (incl.)</span>
                    <span>{settings.currencySymbol}{lastSale.totalGst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white pt-1.5 border-t border-gray-300 dark:border-gray-600">
                    <span>Grand Total</span>
                    <span>{settings.currencySymbol}{lastSale.grandTotal.toFixed(2)}</span>
                  </div>
                  {lastSale.paymentMethod === 'cash' && (
                    <>
                      <div className="flex justify-between text-gray-500">
                        <span>Cash Received</span>
                        <span>{settings.currencySymbol}{lastSale.cashReceived.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Change Given</span>
                        <span>{settings.currencySymbol}{lastSale.changeGiven.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-3.5 pt-2 border-t border-gray-100 dark:border-gray-700 text-[10px] text-gray-600 dark:text-gray-400">
                  <strong>In Words:</strong> {words}
                </div>

                {savings > 0 && (
                  <div className="my-3 p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-center text-emerald-700 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                    *** You Saved {settings.currencySymbol}{savings.toFixed(2)} on this bill! ***
                  </div>
                )}

                {settings.taxEnabled && gstSummaryMap.size > 0 && (
                  <div className="mt-4 pt-3 border-t border-dashed border-gray-300 dark:border-gray-600">
                    <p className="text-[10px] font-bold text-gray-900 dark:text-white text-center uppercase tracking-wider mb-2">GST Tax Breakdown Summary</p>
                    <table className="w-full text-[9px] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 text-left font-semibold">
                          <th className="p-1 border-r border-gray-200 dark:border-gray-700">HSN</th>
                          <th className="p-1 border-r border-gray-200 dark:border-gray-700 text-right">Taxable Val</th>
                          <th className="p-1 border-r border-gray-200 dark:border-gray-700 text-right">CGST</th>
                          <th className="p-1 border-r border-gray-200 dark:border-gray-700 text-right">SGST</th>
                          <th className="p-1 text-right">Total GST</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(gstSummaryMap.entries()).map(([hsn, data]) => {
                          const rateHalf = data.gstPercentage / 2;
                          const amtHalf = data.gstAmount / 2;
                          return (
                            <tr key={hsn} className="border-b border-gray-100 dark:border-gray-700/50">
                              <td className="p-1 border-r border-gray-100 dark:border-gray-700/50">{hsn}</td>
                              <td className="p-1 border-r border-gray-100 dark:border-gray-700/50 text-right">{settings.currencySymbol}{data.taxableValue.toFixed(2)}</td>
                              <td className="p-1 border-r border-gray-100 dark:border-gray-700/50 text-right">{rateHalf}% ({settings.currencySymbol}{amtHalf.toFixed(2)})</td>
                              <td className="p-1 border-r border-gray-100 dark:border-gray-700/50 text-right">{rateHalf}% ({settings.currencySymbol}{amtHalf.toFixed(2)})</td>
                              <td className="p-1 text-right font-medium text-gray-900 dark:text-white">{settings.currencySymbol}{data.gstAmount.toFixed(2)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <p className="text-center text-[10px] text-gray-500 dark:text-gray-400 mt-5 pt-3 border-t border-dashed border-gray-300 dark:border-gray-600 font-sans font-medium">
                  {settings.invoiceFooter}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={handlePrintInvoice} className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 text-sm">
                  <Printer size={16} /> Print
                </button>
                <button onClick={handleDownloadPDF} className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 text-sm">
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Customer Selection Modal */}
      <Modal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} title="Select Customer" size="md">
        <div className="space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {filteredCustomers.map(customer => (
              <button
                key={customer.id}
                onClick={() => {
                  setSelectedCustomer(customer.id);
                  setShowCustomerModal(false);
                  setCustomerSearch('');
                }}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
              >
                <div className="w-9 h-9 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                  <User size={16} className="text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{customer.phone} · Points: {customer.loyaltyPoints}</p>
                </div>
                {customer.outstandingAmount > 0 && (
                  <span className="text-xs text-rose-500 font-medium">Due: ₹{customer.outstandingAmount}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Barcode Scanner Modal */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
}

function generateInvoiceHTML(sale: Sale, settings: any, customer?: any): string {
  const itemsHtml = sale.items.map(item => {
    let detailsStr = '';
    const details = [];
    if (item.hsnCode) details.push(`HSN: ${item.hsnCode}`);
    if (item.batchNumber) details.push(`Batch: ${item.batchNumber}`);
    if (item.expiryDate) details.push(`Exp: ${item.expiryDate}`);
    if (item.mrp && item.mrp > item.unitPrice) {
      details.push(`<span style="text-decoration:line-through;color:#f43f5e">MRP: ${settings.currencySymbol}${item.mrp}</span>`);
    }
    if (details.length > 0) {
      detailsStr = `<div style="font-size:9px;color:#666;margin-top:2px">${details.join(' | ')}</div>`;
    }

    return `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:6px 0;vertical-align:top">
          <div style="font-weight:bold;color:#111">${item.productName}</div>
          ${detailsStr}
        </td>
        <td style="padding:6px 0;text-align:center;vertical-align:top;color:#333">${item.quantity}</td>
        <td style="padding:6px 0;text-align:right;vertical-align:top;color:#333">${settings.currencySymbol}${item.unitPrice.toFixed(2)}</td>
        <td style="padding:6px 0;text-align:right;vertical-align:top;font-weight:bold;color:#111">${settings.currencySymbol}${item.totalAmount.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // GST Summary Calculation
  const gstSummaryMap = new Map<string, { taxableValue: number; gstPercentage: number; gstAmount: number }>();
  sale.items.forEach(item => {
    const hsn = item.hsnCode || 'N/A';
    const taxable = item.totalAmount - item.gstAmount;
    const existing = gstSummaryMap.get(hsn);
    if (existing) {
      existing.taxableValue += taxable;
      existing.gstAmount += item.gstAmount;
    } else {
      gstSummaryMap.set(hsn, {
        taxableValue: taxable,
        gstPercentage: item.gstPercentage,
        gstAmount: item.gstAmount
      });
    }
  });

  const gstRowsHtml = Array.from(gstSummaryMap.entries()).map(([hsn, data]) => {
    const rateHalf = data.gstPercentage / 2;
    const amtHalf = data.gstAmount / 2;
    return `
      <tr style="border-bottom:0.5px solid #ddd">
        <td style="padding:3px;border-right:0.5px solid #ddd">${hsn}</td>
        <td style="padding:3px;text-align:right;border-right:0.5px solid #ddd">${settings.currencySymbol}${data.taxableValue.toFixed(2)}</td>
        <td style="padding:3px;text-align:right;border-right:0.5px solid #ddd">${rateHalf}% (${settings.currencySymbol}${amtHalf.toFixed(2)})</td>
        <td style="padding:3px;text-align:right;border-right:0.5px solid #ddd">${rateHalf}% (${settings.currencySymbol}${amtHalf.toFixed(2)})</td>
        <td style="padding:3px;text-align:right;font-weight:bold">${settings.currencySymbol}${data.gstAmount.toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  // Calculate MRP Savings
  const savings = sale.items.reduce((sum, item) => {
    const mrpVal = item.mrp || item.unitPrice;
    const savingsOnMrp = Math.max(0, mrpVal - item.unitPrice) * item.quantity;
    return sum + savingsOnMrp;
  }, 0) + sale.totalDiscount;

  const words = numberToWords(sale.grandTotal);

  let customerInfoHtml = '';
  if (customer) {
    customerInfoHtml = `
      <div style="margin:6px 0;color:#333;font-size:11px">
        <strong>Customer:</strong> ${customer.name} <br/>
        ${customer.phone ? `<strong>Phone:</strong> ${customer.phone}<br/>` : ''}
        ${customer.address ? `<strong>Address:</strong> ${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}<br/>` : ''}
        ${customer.loyaltyPoints > 0 ? `<strong>Loyalty Points Balance:</strong> ${customer.loyaltyPoints}` : ''}
      </div>
    `;
  } else {
    customerInfoHtml = `
      <div style="margin:6px 0;color:#333;font-size:11px">
        <strong>Customer:</strong> ${sale.customerName}
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html>
<head>
  <title>Invoice ${sale.invoiceNumber}</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      max-width: 420px;
      margin: 0 auto;
      padding: 15px;
      font-size: 11px;
      color: #000;
      line-height: 1.4;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      padding: 6px 0;
      border-bottom: 2px solid #000;
      font-weight: bold;
    }
    hr {
      border: none;
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
  </style>
</head>
<body>
  <div class="text-center">
    <h2 style="margin: 0; font-size: 16px; font-weight: bold;">${settings.storeName}</h2>
    <p style="margin: 2px 0;">${settings.storeAddress}, ${settings.storeCity}</p>
    <p style="margin: 2px 0;">${settings.storeState} - ${settings.storePincode}</p>
    <p style="margin: 2px 0;">GSTIN: ${settings.gstNumber} | Ph: ${settings.storePhone}</p>
    ${settings.storeEmail ? `<p style="margin: 2px 0;">Email: ${settings.storeEmail}</p>` : ''}
  </div>
  <hr>
  <div style="display:flex; justify-content:space-between; margin:4px 0; font-size:11px">
    <span><strong>Invoice No:</strong> ${sale.invoiceNumber}</span>
    <span><strong>Date:</strong> ${format(new Date(sale.createdAt), 'dd/MM/yyyy hh:mm a')}</span>
  </div>
  <div style="display:flex; justify-content:space-between; margin:4px 0; font-size:11px">
    <span><strong>Cashier:</strong> ${sale.createdBy}</span>
    <span><strong>Payment:</strong> <span style="text-transform:uppercase; font-weight:bold">${sale.paymentMethod}</span></span>
  </div>
  <hr>
  ${customerInfoHtml}
  <hr>
  <table style="margin-top: 8px;">
    <thead>
      <tr>
        <th style="width: 50%;">Item Description</th>
        <th style="width: 10%; text-align:center">Qty</th>
        <th style="width: 20%; text-align:right">Price</th>
        <th style="width: 20%; text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>
  <hr>
  
  <div style="margin-top: 5px;">
    <table style="font-size:11px">
      <tr>
        <td>Subtotal</td>
        <td class="text-right">${settings.currencySymbol}${sale.subtotal.toFixed(2)}</td>
      </tr>
      ${sale.totalDiscount > 0 ? `
      <tr style="color: green;">
        <td>Discount</td>
        <td class="text-right">-${settings.currencySymbol}${sale.totalDiscount.toFixed(2)}</td>
      </tr>` : ''}
      <tr>
        <td>GST (incl.)</td>
        <td class="text-right">${settings.currencySymbol}${sale.totalGst.toFixed(2)}</td>
      </tr>
      <tr style="font-size: 13px; font-weight: bold;">
        <td style="padding-top: 5px; border-top: 1px solid #000;">Grand Total</td>
        <td class="text-right" style="padding-top: 5px; border-top: 1px solid #000;">${settings.currencySymbol}${sale.grandTotal.toFixed(2)}</td>
      </tr>
      ${sale.paymentMethod === 'cash' ? `
      <tr>
        <td style="padding-top: 3px;">Cash Received</td>
        <td class="text-right" style="padding-top: 3px;">${settings.currencySymbol}${sale.cashReceived.toFixed(2)}</td>
      </tr>
      <tr>
        <td>Change Given</td>
        <td class="text-right">${settings.currencySymbol}${sale.changeGiven.toFixed(2)}</td>
      </tr>` : ''}
    </table>
  </div>
  
  <div style="margin-top: 10px; font-size: 10px; font-style: italic; color: #333; line-height:1.2">
    <strong>In Words:</strong> ${words}
  </div>

  ${savings > 0 ? `
  <div style="margin: 10px 0; padding: 6px; border: 1px solid green; border-radius: 4px; text-align: center; color: green; font-weight: bold; font-size: 11px;">
    *** YOU SAVED ${settings.currencySymbol}${savings.toFixed(2)} ON THIS PURCHASE! ***
  </div>` : ''}

  ${settings.taxEnabled && gstRowsHtml ? `
  <hr>
  <div style="margin-top: 10px;">
    <div style="font-weight: bold; font-size: 9px; margin-bottom: 4px; text-align: center; text-transform: uppercase;">GST Tax Breakdown Summary</div>
    <table style="font-size: 9px; width: 100%; border: 0.5px solid #ddd;">
      <thead>
        <tr style="background-color: #f9f9f9; border-bottom: 1px solid #ddd;">
          <th style="font-size:9px; padding:3px 2px; border: 0.5px solid #ddd;">HSN</th>
          <th style="font-size:9px; padding:3px 2px; text-align:right; border: 0.5px solid #ddd;">Taxable Val</th>
          <th style="font-size:9px; padding:3px 2px; text-align:right; border: 0.5px solid #ddd;">CGST</th>
          <th style="font-size:9px; padding:3px 2px; text-align:right; border: 0.5px solid #ddd;">SGST</th>
          <th style="font-size:9px; padding:3px 2px; text-align:right; border: 0.5px solid #ddd;">Total GST</th>
        </tr>
      </thead>
      <tbody>
        ${gstRowsHtml}
      </tbody>
    </table>
  </div>` : ''}

  <p class="text-center" style="margin-top: 20px; font-size: 10px; font-weight: bold; border-top: 1px dashed #ccc; padding-top: 10px;">
    ${settings.invoiceFooter}
  </p>
</body>
</html>`;
}
