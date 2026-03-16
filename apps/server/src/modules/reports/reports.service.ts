import { prisma } from '@/shared/database/prisma.client';
import type { ReportsDateRangeInput } from './reports.types';

function getDateRange(input: ReportsDateRangeInput) {
  if (input.startDate && input.endDate) {
    return {
      start: new Date(`${input.startDate}T00:00:00.000Z`),
      end: new Date(`${input.endDate}T23:59:59.999Z`),
      label: `${input.startDate} -> ${input.endDate}`,
    };
  }

  const today = new Date();
  const yyyy = today.getUTCFullYear();
  const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(today.getUTCDate()).padStart(2, '0');
  const label = `${yyyy}-${mm}-${dd}`;

  return {
    start: new Date(`${label}T00:00:00.000Z`),
    end: new Date(`${label}T23:59:59.999Z`),
    label,
  };
}

export const reportsService = {
  async getDashboard(input: ReportsDateRangeInput) {
    const range = getDateRange(input);
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lte: range.end,
        },
      },
      include: {
        items: {
          include: {
            menuItem: {
              include: {
                category: true,
              },
            },
            combo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const validOrders = orders.filter((order) => order.status !== 'CANCELLED');
    const grossSales = validOrders.reduce((sum, order) => sum + order.finalPrice, 0);
    const ordersCount = validOrders.length;
    const averageTicket = ordersCount ? grossSales / ordersCount : 0;

    const statusBreakdown = orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] ?? 0) + 1;
      return acc;
    }, {});

    const itemMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    const categoryMap = new Map<string, { name: string; quantity: number; revenue: number }>();

    for (const order of validOrders) {
      for (const item of order.items) {
        const label = item.menuItem?.name ?? item.combo?.name ?? 'Item removido';
        const revenue = item.itemPrice * item.quantity;
        const itemEntry = itemMap.get(label) ?? { name: label, quantity: 0, revenue: 0 };
        itemEntry.quantity += item.quantity;
        itemEntry.revenue += revenue;
        itemMap.set(label, itemEntry);

        const categoryName =
          item.menuItem?.category?.name ?? (item.combo ? 'Combos' : 'Sem categoria');
        const categoryEntry = categoryMap.get(categoryName) ?? {
          name: categoryName,
          quantity: 0,
          revenue: 0,
        };
        categoryEntry.quantity += item.quantity;
        categoryEntry.revenue += revenue;
        categoryMap.set(categoryName, categoryEntry);
      }
    }

    return {
      period: {
        startDate: range.start.toISOString(),
        endDate: range.end.toISOString(),
        label: range.label,
      },
      totals: {
        grossSales,
        ordersCount,
        averageTicket,
      },
      statusBreakdown,
      topItems: [...itemMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5),
      salesByCategory: [...categoryMap.values()].sort((a, b) => b.revenue - a.revenue),
      recentOrders: orders.slice(0, 6).map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customerName,
        finalPrice: order.finalPrice,
        createdAt: order.createdAt,
      })),
    };
  },

  async getSalesReport(input: ReportsDateRangeInput) {
    const dashboard = await reportsService.getDashboard(input);
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: new Date(dashboard.period.startDate),
          lte: new Date(dashboard.period.endDate),
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyTotals = orders.reduce<Array<{ date: string; total: number; orders: number }>>(
      (acc, order) => {
        const date = order.createdAt.toISOString().slice(0, 10);
        const existing = acc.find((item) => item.date === date);
        if (existing) {
          existing.total += order.status === 'CANCELLED' ? 0 : order.finalPrice;
          existing.orders += 1;
          return acc;
        }

        acc.push({
          date,
          total: order.status === 'CANCELLED' ? 0 : order.finalPrice,
          orders: 1,
        });
        return acc;
      },
      [],
    );

    return {
      ...dashboard,
      dailyTotals,
      exportGeneratedAt: new Date().toISOString(),
    };
  },
};
