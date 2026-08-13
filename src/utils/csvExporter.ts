import { StagedOrder } from '../types';

/**
 * Downloads a CSV file containing the summary of staged orders.
 * Includes UTF-8 BOM (\uFEFF) so Hebrew characters render perfectly in Excel.
 */
export const exportOrdersToCSV = (orders: StagedOrder[], filenamePrefix: string = 'SabanOS_Orders_Report') => {
  if (!orders || orders.length === 0) {
    alert('אין הזמנות להורדה בקו היצוא');
    return;
  }

  // Define headers in Hebrew
  const headers = [
    'מספר הזמנה',
    'תאריך קליטה',
    'שם לקוח',
    'טלפון לקוח',
    'מחסן',
    'כתובת אספקה',
    'נהג משויך',
    'סטטוס הובלה',
    'תוצאת בדיקה',
    'סכום משוער (₪)',
    'תאריך אספקה',
    'שעת אספקה',
    'מסלול / מרחק',
    'פקדון בלות',
    'פקדון משטחים',
    'פירוט פריטים'
  ];

  // Helper to escape CSV cell content
  const escapeCell = (val: string | number | undefined | null): string => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""').replace(/\n/g, ' ');
    return `"${str}"`;
  };

  // Convert rows
  const rows = orders.map((ord) => {
    const itemsSummary = ord.items && ord.items.length > 0
      ? ord.items.map((i) => `${i.name} (${i.quantity} ${i.unit || ''})`).join('; ')
      : (ord.rawItemsText || ord.rawMessage || '');

    return [
      escapeCell(ord.orderNumber),
      escapeCell(ord.ingestionDate || ord.createdAt),
      escapeCell(ord.customerName),
      escapeCell(ord.customerPhone),
      escapeCell(ord.warehouse),
      escapeCell(ord.address),
      escapeCell(ord.driverName || 'טרם שובץ'),
      escapeCell(ord.status),
      escapeCell(ord.result || 'תקין'),
      escapeCell(ord.totalPrice || 0),
      escapeCell(ord.verificationDate || ''),
      escapeCell(ord.deliveryTime || ''),
      escapeCell(ord.routeVerification || ''),
      escapeCell(ord.baleDeposit || ''),
      escapeCell(ord.palletDeposit || ''),
      escapeCell(itemsSummary)
    ].join(',');
  });

  // Combine headers and rows with UTF-8 BOM
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');

  // Create downloadable Blob
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  const nowStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filenamePrefix}_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
