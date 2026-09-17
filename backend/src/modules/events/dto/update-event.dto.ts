import { z } from 'zod';

export const updateEventSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  categoryId: z.string().uuid().optional().nullable(),
  location: z.string().min(2).optional(),
  isOnline: z.boolean().optional(),
  meetingLink: z.string().url().optional().nullable().or(z.literal('')),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  bannerUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export type UpdateEventDto = z.infer<typeof updateEventSchema>;

export const updateEventStatusSchema = z.object({
  status: z.enum(
    ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'CANCELLED', 'COMPLETED'],
    {
      error: 'Status must be DRAFT, PENDING_APPROVAL, PUBLISHED, CANCELLED, or COMPLETED',
    },
  ),
});

export type UpdateEventStatusDto = z.infer<typeof updateEventStatusSchema>;
