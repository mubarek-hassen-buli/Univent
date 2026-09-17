import { z } from 'zod';

export const createUserSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['student', 'organizer', 'admin'], {
      error: 'Role must be student, organizer, or admin',
    }),
    phoneNumber: z.string().optional(),
    isApproved: z.boolean().optional(),
    studentId: z.string().optional(),
    department: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.role === 'organizer') {
        return !!data.phoneNumber && data.phoneNumber.trim().length >= 8;
      }
      return true;
    },
    {
      message: 'Phone number is required for organizer registration (minimum 8 characters)',
      path: ['phoneNumber'],
    },
  );

export type CreateUserDto = z.infer<typeof createUserSchema>;

export const queryUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role: z.enum(['student', 'organizer', 'admin']).optional(),
  isApproved: z
    .preprocess((val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    }, z.boolean().optional())
    .optional(),
});

export type QueryUsersDto = z.infer<typeof queryUsersSchema>;
