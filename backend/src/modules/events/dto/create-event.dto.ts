import { z } from 'zod';

export const createEventSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    location: z.string().min(2, 'Location is required'),
    isOnline: z.boolean().default(false),
    meetingLink: z.string().url('Invalid meeting URL').optional().or(z.literal('')),
    startDate: z.coerce.date({
      error: 'Valid start date and time required',
    }),
    endDate: z.coerce.date({
      error: 'Valid end date and time required',
    }),
    capacity: z.coerce.number().int().positive('Capacity must be at least 1 seat'),
    bannerUrl: z.string().url('Invalid banner URL').optional().or(z.literal('')),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'Event end date must be after start date',
    path: ['endDate'],
  });

export type CreateEventDto = z.infer<typeof createEventSchema>;
