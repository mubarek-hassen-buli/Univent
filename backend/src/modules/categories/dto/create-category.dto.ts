import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
