import { z } from 'zod';

export const reportsDateRangeSchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate deve ser YYYY-MM-DD')
      .optional(),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate deve ser YYYY-MM-DD')
      .optional(),
  })
  .refine(
    (value) => {
      if (!value.startDate && !value.endDate) return true;
      return Boolean(value.startDate && value.endDate);
    },
    {
      message: 'Informe startDate e endDate juntos',
      path: ['startDate'],
    },
  );

export type ReportsDateRangeInput = z.infer<typeof reportsDateRangeSchema>;
