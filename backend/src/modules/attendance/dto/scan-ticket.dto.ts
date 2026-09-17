import { z } from 'zod';

export const scanTicketSchema = z
  .object({
    eventId: z.string().uuid('Invalid event ID format'),
    qrHash: z.string().min(1).optional(),
    registrationCode: z.string().min(1).optional(),
  })
  .refine((data) => !!data.qrHash || !!data.registrationCode, {
    message: 'Either qrHash or registrationCode must be provided',
    path: ['qrHash'],
  });

export type ScanTicketDto = z.infer<typeof scanTicketSchema>;
