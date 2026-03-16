import type { FastifyInstance } from 'fastify';

import { authenticate, checkRole } from '@/modules/auth/auth.middleware';
import {
  bearerAuthSecurity,
  dataResponse,
  unauthorizedErrorSchema,
  validationErrorSchema,
} from '@/shared/http/openapi';
import { reportsService } from './reports.service';
import { reportsDateRangeSchema } from './reports.types';

const reportsDashboardSchema = {
  type: 'object',
  required: ['period', 'totals', 'statusBreakdown', 'topItems', 'salesByCategory', 'recentOrders'],
  properties: {
    period: {
      type: 'object',
      required: ['startDate', 'endDate', 'label'],
      properties: {
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        label: { type: 'string' },
      },
    },
    totals: {
      type: 'object',
      required: ['grossSales', 'ordersCount', 'averageTicket'],
      properties: {
        grossSales: { type: 'number' },
        ordersCount: { type: 'integer' },
        averageTicket: { type: 'number' },
      },
    },
    statusBreakdown: {
      type: 'object',
      additionalProperties: { type: 'integer' },
    },
    topItems: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'quantity', 'revenue'],
        properties: {
          name: { type: 'string' },
          quantity: { type: 'integer' },
          revenue: { type: 'number' },
        },
      },
    },
    salesByCategory: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'quantity', 'revenue'],
        properties: {
          name: { type: 'string' },
          quantity: { type: 'integer' },
          revenue: { type: 'number' },
        },
      },
    },
    recentOrders: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'orderNumber', 'status', 'customerName', 'finalPrice', 'createdAt'],
        properties: {
          id: { type: 'string' },
          orderNumber: { type: 'integer' },
          status: { type: 'string' },
          customerName: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          finalPrice: { type: 'number' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
} as const;

const reportsSalesSchema = {
  type: 'object',
  allOf: [
    reportsDashboardSchema,
    {
      type: 'object',
      required: ['dailyTotals', 'exportGeneratedAt'],
      properties: {
        dailyTotals: {
          type: 'array',
          items: {
            type: 'object',
            required: ['date', 'total', 'orders'],
            properties: {
              date: { type: 'string' },
              total: { type: 'number' },
              orders: { type: 'integer' },
            },
          },
        },
        exportGeneratedAt: { type: 'string', format: 'date-time' },
      },
    },
  ],
} as const;

const reportsQuerySchema = {
  type: 'object',
  properties: {
    startDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    endDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
  },
} as const;

export async function registerReportsRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/reports/dashboard',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['reports', 'admin'],
        summary: 'Resumo do dashboard administrativo',
        security: bearerAuthSecurity,
        querystring: reportsQuerySchema,
        response: {
          200: dataResponse(reportsDashboardSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = reportsDateRangeSchema.safeParse(request.query ?? {});
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Query invalida' });
      }

      const data = await reportsService.getDashboard(parsed.data);
      return { data };
    },
  );

  app.get(
    '/reports/sales',
    {
      preHandler: [authenticate, checkRole(['ADMIN'])],
      schema: {
        tags: ['reports', 'admin'],
        summary: 'Relatorio de vendas por periodo',
        security: bearerAuthSecurity,
        querystring: reportsQuerySchema,
        response: {
          200: dataResponse(reportsSalesSchema),
          400: validationErrorSchema,
          401: unauthorizedErrorSchema,
        },
      },
    },
    async (request, reply) => {
      const parsed = reportsDateRangeSchema.safeParse(request.query ?? {});
      if (!parsed.success) {
        return reply
          .code(400)
          .send({ message: parsed.error.issues[0]?.message ?? 'Query invalida' });
      }

      const data = await reportsService.getSalesReport(parsed.data);
      return { data };
    },
  );
}
