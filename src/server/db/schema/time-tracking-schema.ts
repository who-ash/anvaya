import {
    pgTable,
    serial,
    text,
    timestamp,
    integer,
    boolean,
    pgEnum,
} from 'drizzle-orm/pg-core';
import {
    type InferSelectModel,
    type InferInsertModel,
    relations,
} from 'drizzle-orm';
import { users } from './auth-schema';
import { tasks, projects } from './project-schema';

// Enum for reminder intervals
export const reminderIntervalEnum = pgEnum('reminder_interval', [
    '30_min',
    '1_hour',
    '2_hours',
    '1_day',
    '2_days',
    '1_week',
]);

// Task time entries - automatically recorded when task status changes
export const taskTimeEntries = pgTable('task_time_entries', {
    id: serial('id').primaryKey(),
    taskId: integer('task_id')
        .notNull()
        .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    status: text('status').notNull(), // The status during this time period
    startedAt: timestamp('started_at').notNull(),
    endedAt: timestamp('ended_at'), // Null if currently in this status
    durationSeconds: integer('duration_seconds'), // Computed when ended
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// User calendar sync settings
export const calendarSyncSettings = pgTable('calendar_sync_settings', {
    id: serial('id').primaryKey(),
    userId: text('user_id').notNull().unique(),
    googleAccessToken: text('google_access_token'),
    googleRefreshToken: text('google_refresh_token'),
    googleTokenExpiry: timestamp('google_token_expiry'),
    defaultCalendarId: text('default_calendar_id'),
    reminderIntervals: text('reminder_intervals').array(), // Store as array of interval strings
    syncEnabled: boolean('sync_enabled').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate((): Date => new Date())
        .notNull(),
});

// Track synced calendar events
export const calendarEvents = pgTable('calendar_events', {
    id: serial('id').primaryKey(),
    taskId: integer('task_id')
        .notNull()
        .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    googleEventId: text('google_event_id').notNull(),
    syncedAt: timestamp('synced_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate((): Date => new Date())
        .notNull(),
});

// Project-level calendar reminder settings (set by project/org admins)
export const projectCalendarSettings = pgTable('project_calendar_settings', {
    id: serial('id').primaryKey(),
    projectId: integer('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' })
        .unique(),
    reminderIntervals: text('reminder_intervals').array(), // Default reminders for project tasks
    syncEnabled: boolean('sync_enabled').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate((): Date => new Date())
        .notNull(),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
});

// Relations
export const taskTimeEntriesRelations = relations(
    taskTimeEntries,
    ({ one }) => ({
        task: one(tasks, {
            fields: [taskTimeEntries.taskId],
            references: [tasks.id],
        }),
        user: one(users, {
            fields: [taskTimeEntries.userId],
            references: [users.id],
        }),
    }),
);

export const calendarSyncSettingsRelations = relations(
    calendarSyncSettings,
    ({ one }) => ({
        user: one(users, {
            fields: [calendarSyncSettings.userId],
            references: [users.id],
        }),
    }),
);

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
    task: one(tasks, {
        fields: [calendarEvents.taskId],
        references: [tasks.id],
    }),
    user: one(users, {
        fields: [calendarEvents.userId],
        references: [users.id],
    }),
}));

export const projectCalendarSettingsRelations = relations(
    projectCalendarSettings,
    ({ one }) => ({
        project: one(projects, {
            fields: [projectCalendarSettings.projectId],
            references: [projects.id],
        }),
    }),
);

// Types
export type TaskTimeEntry = InferSelectModel<typeof taskTimeEntries>;
export type NewTaskTimeEntry = InferInsertModel<typeof taskTimeEntries>;

export type CalendarSyncSettings = InferSelectModel<
    typeof calendarSyncSettings
>;
export type NewCalendarSyncSettings = InferInsertModel<
    typeof calendarSyncSettings
>;

export type CalendarEvent = InferSelectModel<typeof calendarEvents>;
export type NewCalendarEvent = InferInsertModel<typeof calendarEvents>;

export type ProjectCalendarSettings = InferSelectModel<
    typeof projectCalendarSettings
>;
export type NewProjectCalendarSettings = InferInsertModel<
    typeof projectCalendarSettings
>;
