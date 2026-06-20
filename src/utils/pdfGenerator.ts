import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Sale, StoreSettings, Customer } from '@/types';
import { format } from 'date-fns';
import { numberToWords } from './numberToWords';

export function generateInvoicePDF(sale: Sale, settings: StoreSettings, customer?: Customer | null) {
  // Let the receipt grow longer to avoid cutting off detailed rows
  const doc = new jsPDF({ unit: 'mm', format: [80, 250] });

  let y = 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.storeName, 40, y, { align: 'center' });
  y += 5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.storeAddress}, ${settings.storeCity}`, 40, y, { align: 'center' });
  y += 3.5;
  doc.text(`${settings.storeState} - ${settings.storePincode}`, 40, y, { align: 'center' });
  y += 3.5;
  doc.text(`GSTIN: ${settings.gstNumber} | Ph: ${settings.storePhone}`, 40, y, { align: 'center' });
  y += 5;

  doc.setDrawColor(150);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, 75, y);
  y += 4;

  doc.setFontSize(6.5);
  doc.text(`Invoice: ${sale.invoiceNumber}`, 5, y);
  doc.text(format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm'), 75, y, { align: 'right' });
  y += 3.5;
  doc.text(`Cashier: ${sale.createdBy}`, 5, y);
  doc.text(`Payment: ${sale.paymentMethod.toUpperCase()}`, 75, y, { align: 'right' });
  y += 4;

  doc.line(5, y, 75, y);
  y += 4;

  // Customer Details
  doc.setFont('helvetica', 'bold');
  doc.text(`Customer: ${sale.customerName}`, 5, y);
  doc.setFont('helvetica', 'normal');
  y += 3.5;
  if (customer) {
    if (customer.phone) {
      doc.text(`Phone: ${customer.phone}`, 5, y);
      y += 3.5;
    }
    if (customer.address) {
      doc.text(`Address: ${customer.address}, ${customer.city}`, 5, y, { maxWidth: 70 });
      y += 3.5;
      doc.text(`${customer.state} - ${customer.pincode}`, 5, y);
      y += 3.5;
    }
    if (customer.loyaltyPoints > 0) {
      doc.text(`Loyalty Points Balance: ${customer.loyaltyPoints}`, 5, y);
      y += 3.5;
    }
  }
  y += 1;

  doc.line(5, y, 75, y);
  y += 2;

  const tableData = sale.items.map(item => {
    let nameStr = item.productName;
    const details = [];
    if (item.hsnCode) details.push(`HSN: ${item.hsnCode}`);
    if (item.batchNumber) details.push(`B: ${item.batchNumber}`);
    if (item.expiryDate) details.push(`E: ${item.expiryDate}`);
    if (item.mrp && item.mrp > item.unitPrice) {
      details.push(`MRP: ${settings.currencySymbol}${item.mrp}`);
    }
    if (details.length > 0) {
      nameStr += `\n(${details.join(' | ')})`;
    }
    return [
      nameStr,
      item.quantity.toString(),
      `${settings.currencySymbol}${item.unitPrice.toFixed(2)}`,
      `${settings.currencySymbol}${item.totalAmount.toFixed(2)}`
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['Item', 'Qty', 'Price', 'Amount']],
    body: tableData,
    theme: 'plain',
    styles: { fontSize: 6, cellPadding: 1.2, textColor: [0, 0, 0] },
    headStyles: { fontStyle: 'bold', fontSize: 6.5 },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 7, halign: 'center' },
      2: { cellWidth: 15, halign: 'right' },
      3: { cellWidth: 16, halign: 'right' },
    },
    margin: { left: 5, right: 5 },
  });

  y = (doc as any).lastAutoTable.finalY + 3;

  doc.line(5, y, 75, y);
  y += 4;

  doc.setFontSize(6.5);
  const rightX = 75;
  doc.text('Subtotal:', 5, y);
  doc.text(`${settings.currencySymbol}${sale.subtotal.toFixed(2)}`, rightX, y, { align: 'right' });
  y += 3.5;

  if (sale.totalDiscount > 0) {
    doc.text('Discount:', 5, y);
    doc.text(`-${settings.currencySymbol}${sale.totalDiscount.toFixed(2)}`, rightX, y, { align: 'right' });
    y += 3.5;
  }

  doc.text('GST (incl.):', 5, y);
  doc.text(`${settings.currencySymbol}${sale.totalGst.toFixed(2)}`, rightX, y, { align: 'right' });
  y += 4;

  doc.line(5, y, 75, y);
  y += 4;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', 5, y);
  doc.text(`${settings.currencySymbol}${sale.grandTotal.toFixed(2)}`, rightX, y, { align: 'right' });
  y += 5;

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment: ${sale.paymentMethod.toUpperCase()}`, 5, y);
  y += 3.5;

  if (sale.paymentMethod === 'cash') {
    doc.text(`Received: ${settings.currencySymbol}${sale.cashReceived.toFixed(2)}`, 5, y);
    y += 3.5;
    doc.text(`Change: ${settings.currencySymbol}${sale.changeGiven.toFixed(2)}`, 5, y);
    y += 5;
  }

  doc.setFont('helvetica', 'oblique');
  doc.text(`In Words: ${numberToWords(sale.grandTotal)}`, 5, y, { maxWidth: 70 });
  y += 7;

  // MRP savings calculation
  const savings = sale.items.reduce((sum, item) => {
    const mrpVal = item.mrp || item.unitPrice;
    const savingsOnMrp = Math.max(0, mrpVal - item.unitPrice) * item.quantity;
    return sum + savingsOnMrp;
  }, 0) + sale.totalDiscount;

  if (savings > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text(`*** YOU SAVED ${settings.currencySymbol}${savings.toFixed(2)}! ***`, 40, y, { align: 'center' });
    y += 6;
  }

  doc.setFont('helvetica', 'normal');
  doc.setLineDashPattern([1, 1], 0);
  doc.line(5, y, 75, y);
  y += 4;

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

  if (settings.taxEnabled && gstSummaryMap.size > 0) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    doc.text('GST TAX BREAKDOWN SUMMARY', 40, y, { align: 'center' });
    y += 2;

    const gstTableData = Array.from(gstSummaryMap.entries()).map(([hsn, data]) => {
      const rateHalf = data.gstPercentage / 2;
      const amtHalf = data.gstAmount / 2;
      return [
        hsn,
        `${settings.currencySymbol}${data.taxableValue.toFixed(2)}`,
        `${rateHalf}% (${settings.currencySymbol}${amtHalf.toFixed(2)})`,
        `${rateHalf}% (${settings.currencySymbol}${amtHalf.toFixed(2)})`,
        `${settings.currencySymbol}${data.gstAmount.toFixed(2)}`
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['HSN', 'Taxable', 'CGST', 'SGST', 'GST']],
      body: gstTableData,
      theme: 'plain',
      styles: { fontSize: 5, cellPadding: 1, textColor: [0, 0, 0] },
      headStyles: { fontStyle: 'bold', fontSize: 5.5 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 14, halign: 'right' },
        2: { cellWidth: 17, halign: 'right' },
        3: { cellWidth: 17, halign: 'right' },
        4: { cellWidth: 12, halign: 'right' },
      },
      margin: { left: 5, right: 5 }
    });
    y = (doc as any).lastAutoTable.finalY + 4;
    doc.line(5, y, 75, y);
    y += 4;
  }

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.invoiceFooter, 40, y, { align: 'center', maxWidth: 65 });

  doc.save(`Invoice-${sale.invoiceNumber}.pdf`);
}

export function generateReportPDF(
  title: string,
  headers: string[],
  data: string[][],
  settings: StoreSettings,
  summary?: { label: string; value: string }[]
) {
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.storeName, 105, 15, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${settings.storeAddress}, ${settings.storeCity}`, 105, 21, { align: 'center' });

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 105, 32, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 105, 38, { align: 'center' });

  autoTable(doc, {
    startY: 44,
    head: [headers],
    body: data,
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235], fontStyle: 'bold' },
  });

  if (summary && summary.length > 0) {
    let y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    summary.forEach(s => {
      doc.text(`${s.label}: ${s.value}`, 14, y);
      y += 5;
    });
  }

  doc.save(`${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
}

export function exportToCSV(filename: string, headers: string[], data: string[][]) {
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${format(new Date(), 'yyyyMMdd')}.csv`;
  link.click();
}
