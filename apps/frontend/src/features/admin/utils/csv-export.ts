import type { SalesReportData } from '@/features/admin/types/admin.types';

function escapeCsvValue(value: unknown): string {
  const text = String(value ?? '');
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function buildSalesReportCsv(report: SalesReportData): string {
  const rows: string[] = [];

  rows.push('section,key,value');
  rows.push(`totals,grossSales,${escapeCsvValue(report.totals.grossSales.toFixed(2))}`);
  rows.push(`totals,ordersCount,${escapeCsvValue(report.totals.ordersCount)}`);
  rows.push(`totals,averageTicket,${escapeCsvValue(report.totals.averageTicket.toFixed(2))}`);

  rows.push('');
  rows.push('dailyTotals,date,total,orders');
  for (const row of report.dailyTotals) {
    rows.push(
      `dailyTotals,${escapeCsvValue(row.date)},${escapeCsvValue(row.total.toFixed(2))},${escapeCsvValue(row.orders)}`,
    );
  }

  rows.push('');
  rows.push('salesByCategory,name,quantity,revenue');
  for (const row of report.salesByCategory) {
    rows.push(
      `salesByCategory,${escapeCsvValue(row.name)},${escapeCsvValue(row.quantity)},${escapeCsvValue(row.revenue.toFixed(2))}`,
    );
  }

  rows.push('');
  rows.push('topItems,name,quantity,revenue');
  for (const row of report.topItems) {
    rows.push(
      `topItems,${escapeCsvValue(row.name)},${escapeCsvValue(row.quantity)},${escapeCsvValue(row.revenue.toFixed(2))}`,
    );
  }

  rows.push('');
  rows.push('statusBreakdown,status,count');
  for (const [status, count] of Object.entries(report.statusBreakdown)) {
    rows.push(`statusBreakdown,${escapeCsvValue(status)},${escapeCsvValue(count)}`);
  }

  return rows.join('\n');
}
