import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth.schema.js';
import { events } from './events.schema.js';

export const registrations = pgTable(
  'registrations',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    registrationCode: text('registration_code').notNull().unique(),
    qrHash: text('qr_hash').notNull(),
    status: text('status').notNull().default('CONFIRMED'), // 'CONFIRMED' | 'CANCELLED'
    registeredAt: timestamp('registered_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('unique_event_user_registration_idx').on(table.eventId, table.userId),
    index('registration_event_id_idx').on(table.eventId),
    index('registration_user_id_idx').on(table.userId),
    index('registration_code_idx').on(table.registrationCode),
    index('registration_status_idx').on(table.status),
  ],
);
