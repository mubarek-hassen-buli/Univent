// Better Auth Core Tables
export * from './auth.schema.js';

// Univent Domain Tables
export * from './categories.schema.js';
export * from './events.schema.js';
export * from './registrations.schema.js';
export * from './attendance.schema.js';
export * from './certificates.schema.js';
export * from './notifications.schema.js';

// Relational Definitions
export * from './relations.js';

// Inferred TypeScript Types from Drizzle Schemas
import type { user, session, account, verification } from './auth.schema.js';
import type { categories } from './categories.schema.js';
import type { events } from './events.schema.js';
import type { registrations } from './registrations.schema.js';
import type { attendance } from './attendance.schema.js';
import type { certificates } from './certificates.schema.js';
import type { notifications } from './notifications.schema.js';

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;

export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;

export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
