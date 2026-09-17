import { z } from 'zod';

export const queryEventsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  status: z
    .enum(['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'CANCELLED', 'COMPLETED'])
    .optional(),
  organizerId: z.string().optional(),
  isOnline: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export type QueryEventsDto = z.infer<typeof queryEventsSchema>;
