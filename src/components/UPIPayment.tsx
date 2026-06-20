import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Smartphone, Copy, CheckCircle, ExternalLink } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface UPIPaymentProps {
  amount: number;
  invoiceNumber: string;
  onPaymentConfirmed: () => void;
}

export function UPIPayment({ amount, invoiceNumber, onPaymentConfirmed }: UPIPaymentProps) {
  const { settings } = useStore();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'verifying' | 'confirmed'>('pending');

  // Get UPI ID from settings (you'll add this field to settings)
  const upiId = (settings as any).upiId || 'yourstore@upi';
  const merchantName = settings.storeName || 'SRI KARUPPUSAMY EARTH MOVERS';

  // Generate UPI payment string
  // Format: upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
  const upiPaymentString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Payment for ${invoiceNumber}`)}`;

  useEffect(() => {
    // Generate QR code
    QRCode.toDataURL(upiPaymentString, {
      width: 256,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then(url => setQrCodeUrl(url))
      .catch(err => console.error('QR Generation failed:', err));
  }, [upiPaymentString]);

  const copyUpiId = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openUpiApp = () => {
    // This will open UPI apps on mobile devices
    window.location.href = upiPaymentString;
  };

  const handleConfirmPayment = () => {
    setPaymentStatus('verifying');
    // In a real app, you would verify the payment via webhook or API
    // For now, we'll simulate verification
    setTimeout(() => {
      setPaymentStatus('confirmed');
      setTimeout(() => {
        onPaymentConfirmed();
      }, 1000);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Amount Display */}
      <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
        <p className="text-sm text-gray-500 dark:text-gray-400">Amount to Pay</p>
        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
          ₹{amount.toFixed(2)}
        </p>
      </div>

      {/* QR Code */}
      <div className="flex flex-col items-center">
        <div className="bg-white p-4 rounded-xl shadow-md">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="UPI QR Code" className="w-48 h-48" />
          ) : (
            <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-sm">Generating QR...</span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
          Scan with any UPI app (GPay, PhonePe, Paytm, etc.)
        </p>
      </div>

      {/* UPI ID Display */}
      <div className="flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
        <span className="text-sm text-gray-600 dark:text-gray-300">UPI ID:</span>
        <span className="font-mono font-medium text-gray-900 dark:text-white">{upiId}</span>
        <button
          onClick={copyUpiId}
          className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
          title="Copy UPI ID"
        >
          {copied ? (
            <CheckCircle size={16} className="text-emerald-500" />
          ) : (
            <Copy size={16} className="text-gray-400" />
          )}
        </button>
      </div>

      {/* Open UPI App Button (for mobile) */}
      <button
        onClick={openUpiApp}
        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
      >
        <Smartphone size={18} />
        Pay with UPI App
        <ExternalLink size={14} />
      </button>

      {/* Payment Confirmation */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
          After completing payment in your UPI app, click below to confirm:
        </p>
        <button
          onClick={handleConfirmPayment}
          disabled={paymentStatus !== 'pending'}
          className={`w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            paymentStatus === 'confirmed'
              ? 'bg-emerald-500 text-white'
              : paymentStatus === 'verifying'
              ? 'bg-amber-500 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {paymentStatus === 'confirmed' ? (
            <>
              <CheckCircle size={18} />
              Payment Confirmed!
            </>
          ) : paymentStatus === 'verifying' ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying Payment...
            </>
          ) : (
            'I have completed the payment'
          )}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">How to pay:</p>
        <ol className="text-xs text-blue-600 dark:text-blue-300 space-y-0.5 list-decimal list-inside">
          <li>Open any UPI app (GPay, PhonePe, Paytm)</li>
          <li>Scan the QR code OR enter UPI ID manually</li>
          <li>Enter amount ₹{amount.toFixed(2)} and pay</li>
          <li>Click "I have completed the payment" above</li>
        </ol>
      </div>
    </div>
  );
}

// Card Payment Component (requires payment gateway like Razorpay)
export function CardPayment({ amount, onPaymentConfirmed }: { amount: number; onPaymentConfirmed: () => void }) {
  const { settings } = useStore();
  const [loading, setLoading] = useState(false);

  const handleRazorpayPayment = () => {
    setLoading(true);

    // Check if Razorpay is loaded
    if (!(window as any).Razorpay) {
      alert('Payment gateway not loaded. Please add Razorpay script to index.html');
      setLoading(false);
      return;
    }

    const options = {
      key: (settings as any).razorpayKeyId || 'rzp_test_xxxxxxxxxxxx', // Add your Razorpay Key ID in settings
      amount: Math.round(amount * 100), // Amount in paise
      currency: 'INR',
      name: settings.storeName,
      description: 'Payment for purchase',
      handler: function (response: any) {
        console.log('Payment successful:', response);
        // In production, verify payment on server
        onPaymentConfirmed();
      },
      prefill: {
        name: '',
        email: '',
        contact: '',
      },
      theme: {
        color: '#2563eb',
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      alert('Payment failed: ' + response.error.description);
      setLoading(false);
    });
    rzp.open();
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="text-center p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl">
        <p className="text-sm text-gray-500 dark:text-gray-400">Amount to Pay</p>
        <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
          ₹{amount.toFixed(2)}
        </p>
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>Note:</strong> Card payments require Razorpay integration. Add your Razorpay Key ID in Settings → Payment Configuration.
        </p>
      </div>

      <button
        onClick={handleRazorpayPayment}
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          'Pay with Card / Net Banking'
        )}
      </button>

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Secured by Razorpay. Supports Credit/Debit Cards, Net Banking, Wallets.
      </p>
    </div>
  );
}
