import { z } from 'zod';

export const createEventSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    categoryId: z
      .string()
      .uuid('Invalid category ID')
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((val) => (val && val.length > 0 ? val : undefined)),
    location: z.string().min(2, 'Location is required'),
    isOnline: z.boolean().default(false),
    meetingLink: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((val) => {
        if (!val || val.trim() === '') return undefined;
        const trimmed = val.trim();
        return trimmed.startsWith('http://') || trimmed.startsWith('https://')
          ? trimmed
          : `https://${trimmed}`;
      })
      .pipe(z.string().url('Invalid meeting URL').optional()),
    startDate: z.coerce
      .date({
        error: 'Valid start date and time required',
      })
      .refine(
        (date) => date.getTime() >= Date.now() - 5 * 60 * 1000,
        {
          message: 'Start date cannot be in the past',
        },
      ),
    endDate: z.coerce.date({
      error: 'Valid end date and time required',
    }),
    capacity: z.coerce.number().int().positive('Capacity must be at least 1 seat'),
    bannerUrl: z
      .string()
      .optional()
      .nullable()
      .or(z.literal(''))
      .transform((val) => (val && val.trim().length > 0 ? val.trim() : undefined))
      .pipe(z.string().url('Invalid banner URL').optional()),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'Event end date must be after start date',
    path: ['endDate'],
  });

export type CreateEventDto = z.infer<typeof createEventSchema>;
