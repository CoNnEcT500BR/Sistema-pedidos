import { z } from 'zod';

export const ORDER_STATUS = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUS)[number];

export const allowedOrderStatusTransitions: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

export function isAllowedOrderStatusTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): boolean {
  return allowedOrderStatusTransitions[currentStatus].includes(nextStatus);
}

export const orderAddonInputSchema = z.object({
  addonId: z.string().min(1, 'addonId obrigatorio'),
  quantity: z.number().int().min(1, 'quantity deve ser >= 1'),
});

export const orderItemInputSchema = z
  .object({
    menuItemId: z.string().optional(),
    comboId: z.string().optional(),
    quantity: z.number().int().min(1, 'quantity deve ser >= 1'),
    notes: z.string().optional(),
    addons: z.array(orderAddonInputSchema).max(20, 'maximo de 20 addons por item').default([]),
    removedAddonIds: z.array(z.string().min(1)).max(20).default([]),
  })
  .refine((data) => Boolean(data.menuItemId) !== Boolean(data.comboId), {
    message: 'Informe menuItemId ou comboId (apenas um)',
  })
  .superRefine((data, ctx) => {
    const ids = data.addons.map((addon) => addon.addonId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nao envie addons duplicados no mesmo item',
        path: ['addons'],
      });
    }

    if (new Set(data.removedAddonIds).size !== data.removedAddonIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Nao envie removiveis duplicados no mesmo item',
        path: ['removedAddonIds'],
      });
    }
  });

export const createOrderSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemInputSchema).min(1, 'items obrigatorio'),
});

export const listOrdersQuerySchema = z.object({
  status: z.enum(ORDER_STATUS).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date deve ser YYYY-MM-DD')
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUS),
  reason: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

export interface CalculatedOrderAddon {
  addonId: string;
  quantity: number;
  addonPrice: number;
  subtotal: number;
}

export interface CalculatedOrderItem {
  menuItemId?: string;
  comboId?: string;
  quantity: number;
  notes?: string;
  removedIngredients: string[];
  unitPrice: number;
  subtotal: number;
  addons: CalculatedOrderAddon[];
}

export interface CalculatedOrderResult {
  items: CalculatedOrderItem[];
  totalAmount: number;
  stockRequirements: Array<{
    ingredientId: string;
    quantity: number;
  }>;
}
