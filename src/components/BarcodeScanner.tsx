import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Keyboard, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useStore } from '@/store/useStore';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

function cleanBarcode(raw: string): string {
  return raw.trim().replace(/[\r\n\t]/g, '').replace(/\s+/g, '');
}

export function BarcodeScanner({ onScan, isOpen, onClose }: BarcodeScannerProps) {
  const { products } = useStore();
  const [manualCode, setManualCode] = useState('');
  const [mode, setMode] = useState<'manual' | 'camera'>('manual');
  const [lastResult, setLastResult] = useState<{ found: boolean; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen && mode === 'manual') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, mode]);

  useEffect(() => {
    if (isOpen && mode === 'camera') {
      startCamera();
    }
    return () => { stopCamera(); };
  }, [isOpen, mode]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setMode('manual');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const findProduct = useCallback((code: string) => {
    const cleaned = cleanBarcode(code);
    if (!cleaned) return null;
    const lower = cleaned.toLowerCase();

    // 1. Exact barcode match
    let p = products.find(x => x.barcode === cleaned && x.isActive);
    if (p) return p;

    // 2. Exact SKU match (case insensitive)
    p = products.find(x => x.sku.toLowerCase() === lower && x.isActive);
    if (p) return p;

    // 3. Barcode contains (scanner might add/remove leading zeros)
    p = products.find(x => x.isActive && (
      x.barcode.endsWith(cleaned) ||
      cleaned.endsWith(x.barcode) ||
      x.barcode.replace(/^0+/, '') === cleaned.replace(/^0+/, '')
    ));
    if (p) return p;

    // 4. Partial barcode match (at least 8 chars matching)
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

  const handleSubmit = (code: string) => {
    const cleaned = cleanBarcode(code);
    if (!cleaned) return;

    const product = findProduct(cleaned);
    if (product) {
      setLastResult({ found: true, name: product.name });
      onScan(cleaned);
      setManualCode('');
      // Auto focus back for next scan
      setTimeout(() => inputRef.current?.focus(), 100);
      // Auto close after short delay
      setTimeout(() => {
        setLastResult(null);
        onClose();
      }, 800);
    } else {
      setLastResult({ found: false, name: cleaned });
      // Keep modal open so user can try again
      setTimeout(() => inputRef.current?.select(), 100);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(manualCode);
  };

  const handleClose = () => {
    stopCamera();
    setManualCode('');
    setLastResult(null);
    onClose();
  };

  // Preview: show which product matches as user types
  const previewProduct = manualCode.length >= 3 ? findProduct(manualCode) : null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Scan / Enter Barcode" size="md">
      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'manual' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Keyboard size={16} /> Manual / Scanner
          </button>
          <button
            onClick={() => setMode('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'camera' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Camera size={16} /> Camera
          </button>
        </div>

        {/* Result Feedback */}
        {lastResult && (
          <div className={`flex items-center gap-3 p-3 rounded-lg animate-fade-in ${
            lastResult.found
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800'
          }`}>
            {lastResult.found ? (
              <>
                <CheckCircle size={20} className="text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Product Found!</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-300">{lastResult.name} — Added to cart</p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle size={20} className="text-rose-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-rose-700 dark:text-rose-400">Product Not Found</p>
                  <p className="text-xs text-rose-600 dark:text-rose-300">No product with barcode "{lastResult.name}"</p>
                </div>
              </>
            )}
          </div>
        )}

        {mode === 'manual' ? (
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Barcode Number / SKU Code
              </label>
              <input
                ref={inputRef}
                type="text"
                value={manualCode}
                onChange={e => { setManualCode(e.target.value); setLastResult(null); }}
                placeholder="Scan barcode or type number here..."
                className="w-full px-4 py-3.5 border-2 border-primary-300 dark:border-primary-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xl font-mono outline-none focus:ring-4 focus:ring-primary-500/30 focus:border-primary-500 text-center tracking-wider"
                autoComplete="off"
                autoFocus
              />
            </div>

            {/* Live Preview */}
            {previewProduct && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg animate-fade-in">
                <Package size={18} className="text-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">{previewProduct.name}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    SKU: {previewProduct.sku} · Barcode: {previewProduct.barcode} · Stock: {previewProduct.stockQuantity}
                  </p>
                </div>
                <span className="text-sm font-bold text-blue-700 dark:text-blue-300">₹{previewProduct.sellingPrice}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
            >
              Find & Add to Cart
            </button>

            <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">💡 Tips:</p>
              <ul className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                <li>• Point your USB barcode scanner here — it types automatically and presses Enter</li>
                <li>• You can also type the barcode number printed below the barcode lines</li>
                <li>• Or type the SKU code (e.g., AMU-MLK-001)</li>
                <li>• The product will show a preview as you type</li>
              </ul>
            </div>

            {/* Quick barcode reference for testing */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Test — Click to add:</p>
              <div className="flex flex-wrap gap-1.5">
                {useStore.getState().products.slice(0, 6).map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setManualCode(p.barcode); handleSubmit(p.barcode); }}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-600 rounded text-[10px] font-mono text-gray-600 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-700 dark:hover:text-primary-400 transition-colors"
                    title={p.name}
                  >
                    {p.barcode}
                  </button>
                ))}
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-20 border-2 border-green-400/60 rounded-lg relative">
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500/80 animate-pulse" />
                </div>
              </div>
            </div>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              Point camera at barcode. For best results, use a USB/Bluetooth barcode scanner.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSubmit(manualCode); }}
                placeholder="Or type barcode here..."
                className="flex-1 px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none font-mono"
              />
              <button
                onClick={() => handleSubmit(manualCode)}
                className="px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/**
 * Hook: Listen for USB barcode scanner input when no input is focused.
 * USB scanners type characters rapidly then press Enter.
 */
export function useBarcodeListener(onScan: (barcode: string) => void, enabled: boolean = true) {
  const bufferRef = useRef('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return;
      }

      if (e.key === 'Enter') {
        if (bufferRef.current.length >= 3) {
          const cleaned = cleanBarcode(bufferRef.current);
          if (cleaned) {
            e.preventDefault();
            onScan(cleaned);
          }
        }
        bufferRef.current = '';
        return;
      }

      // Only collect printable single characters
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
        bufferRef.current += e.key;

        // Reset buffer after pause (scanner types fast, human types slow)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 300); // 300ms — scanners finish within 100ms, humans type slower
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan, enabled]);
}
