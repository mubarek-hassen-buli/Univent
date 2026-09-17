import { relations } from 'drizzle-orm';
import { user, session, account } from './auth.schema.js';
import { categories } from './categories.schema.js';
import { events } from './events.schema.js';
import { registrations } from './registrations.schema.js';
import { attendance } from './attendance.schema.js';
import { certificates } from './certificates.schema.js';
import { notifications } from './notifications.schema.js';

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  organizedEvents: many(events, { relationName: 'organizerEvents' }),
  registrations: many(registrations),
  scannedAttendances: many(attendance, { relationName: 'scannerAttendance' }),
  certificates: many(certificates),
  notifications: many(notifications),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  events: many(events),
}));

export const eventRelations = relations(events, ({ one, many }) => ({
  category: one(categories, {
    fields: [events.categoryId],
    references: [categories.id],
  }),
  organizer: one(user, {
    fields: [events.organizerId],
    references: [user.id],
    relationName: 'organizerEvents',
  }),
  registrations: many(registrations),
  attendanceRecords: many(attendance),
  certificates: many(certificates),
}));

export const registrationRelations = relations(registrations, ({ one }) => ({
  event: one(events, {
    fields: [registrations.eventId],
    references: [events.id],
  }),
  user: one(user, {
    fields: [registrations.userId],
    references: [user.id],
  }),
  attendance: one(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  registration: one(registrations, {
    fields: [attendance.registrationId],
    references: [registrations.id],
  }),
  event: one(events, {
    fields: [attendance.eventId],
    references: [events.id],
  }),
  scanner: one(user, {
    fields: [attendance.scannedBy],
    references: [user.id],
    relationName: 'scannerAttendance',
  }),
}));

export const certificateRelations = relations(certificates, ({ one }) => ({
  event: one(events, {
    fields: [certificates.eventId],
    references: [events.id],
  }),
  user: one(user, {
    fields: [certificates.userId],
    references: [user.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(user, {
    fields: [notifications.userId],
    references: [user.id],
  }),
}));
