import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  integer,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth.schema.js';
import { categories } from './categories.schema.js';

export const events = pgTable(
  'events',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'set null',
    }),
    organizerId: text('organizer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    location: text('location').notNull(),
    isOnline: boolean('is_online').notNull().default(false),
    meetingLink: text('meeting_link'),
    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),
    capacity: integer('capacity').notNull(),
    registeredCount: integer('registered_count').notNull().default(0),
    version: integer('version').notNull().default(0), // OCC version check
    bannerUrl: text('banner_url'),
    isHidden: boolean('is_hidden').notNull().default(false),
    status: text('status').notNull().default('DRAFT'), // 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('event_slug_idx').on(table.slug),
    index('event_organizer_id_idx').on(table.organizerId),
    index('event_category_id_idx').on(table.categoryId),
    index('event_status_idx').on(table.status),
    index('event_start_date_idx').on(table.startDate),
    index('event_status_start_date_idx').on(table.status, table.startDate),
  ],
);
