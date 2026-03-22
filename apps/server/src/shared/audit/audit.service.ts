import { prisma } from '@/shared/database/prisma.client';

export interface AuditLogEntry {
  timestamp: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  method: string;
  path: string;
  statusCode: number;
  ip?: string;
  entity?: string;
  action?: string;
  payload?: unknown;
}

export interface AuditListFilters {
  page?: number;
  pageSize?: number;
  sort?: 'newest' | 'oldest';
  entity?: string;
  action?: string;
  actorEmail?: string;
  startAt?: string;
  endAt?: string;
}

export interface AuditListResult {
  items: AuditLogEntry[];
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
}

function toEntity(pathname: string): string {
  if (pathname.includes('/users')) return 'USER';
  if (pathname.includes('/menu')) return 'MENU_ITEM';
  if (pathname.includes('/categories')) return 'CATEGORY';
  if (pathname.includes('/combos')) return 'COMBO';
  if (pathname.includes('/addons')) return 'ADDON';
  if (pathname.includes('/delivery')) return 'DELIVERY';
  if (pathname.includes('/feature-flags')) return 'FEATURE_FLAG';
  return 'SYSTEM';
}

function toAction(method: string): string {
  if (method === 'POST') return 'CREATED';
  if (method === 'PUT') return 'UPDATED';
  if (method === 'PATCH') return 'STATUS_CHANGED';
  if (method === 'DELETE') return 'DELETED';
  return 'READ';
}

export const auditService = {
  async append(entry: Omit<AuditLogEntry, 'timestamp' | 'entity' | 'action'>): Promise<void> {
    const payload =
      entry.payload === undefined ? null : JSON.stringify(entry.payload, (_key, value) => value);

    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        actorEmail: entry.actorEmail,
        actorRole: entry.actorRole,
        method: entry.method,
        path: entry.path,
        statusCode: entry.statusCode,
        ip: entry.ip,
        entity: toEntity(entry.path),
        action: toAction(entry.method),
        payload,
      },
    });
  },

  async list(filters: AuditListFilters = {}): Promise<AuditListResult> {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.max(1, Math.min(filters.pageSize ?? 100, 500));
    const sort = filters.sort ?? 'newest';
    const skip = (page - 1) * pageSize;
    const startDate = filters.startAt ? new Date(filters.startAt) : undefined;
    const endDate = filters.endAt ? new Date(filters.endAt) : undefined;

    const where = {
      entity: filters.entity,
      action: filters.action,
      actorEmail: filters.actorEmail
        ? {
            contains: filters.actorEmail,
          }
        : undefined,
      timestamp:
        startDate || endDate
          ? {
              gte: startDate,
              lte: endDate,
            }
          : undefined,
    };

    const [rows, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          timestamp: sort === 'oldest' ? 'asc' : 'desc',
        },
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ]);

    const items = rows.map((row) => {
      let parsedPayload: unknown = undefined;
      if (row.payload) {
        try {
          parsedPayload = JSON.parse(row.payload);
        } catch {
          parsedPayload = row.payload;
        }
      }

      return {
        timestamp: row.timestamp.toISOString(),
        actorId: row.actorId ?? undefined,
        actorEmail: row.actorEmail ?? undefined,
        actorRole: row.actorRole ?? undefined,
        method: row.method,
        path: row.path,
        statusCode: row.statusCode,
        ip: row.ip ?? undefined,
        entity: row.entity,
        action: row.action,
        payload: parsedPayload,
      };
    });

    return {
      items,
      page,
      pageSize,
      total,
      hasNextPage: skip + items.length < total,
    };
  },
};
