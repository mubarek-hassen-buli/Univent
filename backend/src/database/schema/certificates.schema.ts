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

export const certificates = pgTable(
  'certificates',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    eventId: uuid('event_id')
      .notNull()
      .references(() => events.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    certificateCode: text('certificate_code').notNull().unique(),
    pdfUrl: text('pdf_url').notNull(),
    issuedAt: timestamp('issued_at').notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('unique_event_user_certificate_idx').on(table.eventId, table.userId),
    index('certificate_code_idx').on(table.certificateCode),
    index('certificate_event_id_idx').on(table.eventId),
    index('certificate_user_id_idx').on(table.userId),
  ],
);
