import {
  pgTable,
  text,
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth.schema.js';
import { events } from './events.schema.js';
import { registrations } from './registrations.schema.js';

export const attendance = pgTable(
  'attendance',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    registrationId: uuid('registration_id')
      .notNull()
      .unique()
      .references(() => registrations.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    scannedBy: text('scanned_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    scannedAt: timestamp('scanned_at').notNull().defaultNow(),
  },
  (table) => [
    index('attendance_registration_id_idx').on(table.registrationId),
    index('attendance_event_id_idx').on(table.eventId),
    index('attendance_scanned_by_idx').on(table.scannedBy),
    index('attendance_scanned_at_idx').on(table.scannedAt),
  ],
);
