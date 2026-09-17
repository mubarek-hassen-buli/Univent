import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth.schema.js';

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    message: text('message').notNull(),
    type: text('type').notNull().default('INFO'), // 'INFO' | 'REGISTRATION' | 'ATTENDANCE' | 'CERTIFICATE' | 'ANNOUNCEMENT'
    read: boolean('read').notNull().default(false),
    link: text('link'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('notifications_user_id_idx').on(table.userId),
    index('notifications_read_idx').on(table.read),
    index('notifications_created_at_idx').on(table.createdAt),
  ],
);
