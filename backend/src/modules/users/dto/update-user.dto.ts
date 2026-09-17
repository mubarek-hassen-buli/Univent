import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  department: z.string().max(100).optional(),
  studentId: z.string().max(50).optional(),
  image: z.string().url().optional(),
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;

export const updateRoleSchema = z.object({
  role: z.enum(['student', 'organizer', 'admin'], {
    error: 'Role must be student, organizer, or admin',
  }),
});

export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
