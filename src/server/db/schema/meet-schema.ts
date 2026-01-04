import {
    pgTable,
    text,
    timestamp,
    varchar,
    integer,
    pgEnum,
} from 'drizzle-orm/pg-core';
import { users } from './auth-schema';
import { organizations } from './organization-schema';
import { projects } from './project-schema';
import { relations } from 'drizzle-orm';

export const meetingStatusEnum = pgEnum('meeting_status', ['active', 'ended']);

export const meetings = pgTable('meetings', {
    id: text('id').primaryKey(), // meeting room unique id
    name: text('name').notNull(),
    hostId: text('host_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    organizationId: integer('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    projectId: integer('project_id').references(() => projects.id, {
        onDelete: 'set null',
    }),
    status: meetingStatusEnum('status').default('active').notNull(),
    inviteCode: varchar('invite_code', { length: 10 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    endedAt: timestamp('ended_at'),
});

export const meetingParticipants = pgTable('meeting_participants', {
    id: text('id').primaryKey(),
    meetingId: text('meeting_id')
        .notNull()
        .references(() => meetings.id, { onDelete: 'cascade' }),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
    leftAt: timestamp('left_at'),
});

export const meetingRecordings = pgTable('meeting_recordings', {
    id: text('id').primaryKey(),
    meetingId: text('meeting_id')
        .notNull()
        .references(() => meetings.id, { onDelete: 'cascade' }),
    wavUrl: text('wav_url'),
    transcriptUrl: text('transcript_url'),
    messagesUrl: text('messages_url'), // Exported chat messages JSON
    transcriptJson: text('transcript_json'), // Optional: store small transcripts directly
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Meeting chat messages
export const meetingMessages = pgTable('meeting_messages', {
    id: text('id').primaryKey(),
    meetingId: text('meeting_id')
        .notNull()
        .references(() => meetings.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const meetingRelations = relations(meetings, ({ one, many }) => ({
    host: one(users, {
        fields: [meetings.hostId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [meetings.organizationId],
        references: [organizations.id],
    }),
    project: one(projects, {
        fields: [meetings.projectId],
        references: [projects.id],
    }),
    participants: many(meetingParticipants),
    recordings: many(meetingRecordings),
    messages: many(meetingMessages),
}));

export const meetingParticipantRelations = relations(
    meetingParticipants,
    ({ one }) => ({
        meeting: one(meetings, {
            fields: [meetingParticipants.meetingId],
            references: [meetings.id],
        }),
        user: one(users, {
            fields: [meetingParticipants.userId],
            references: [users.id],
        }),
    }),
);

export const meetingRecordingRelations = relations(
    meetingRecordings,
    ({ one }) => ({
        meeting: one(meetings, {
            fields: [meetingRecordings.meetingId],
            references: [meetings.id],
        }),
    }),
);

export const meetingMessageRelations = relations(
    meetingMessages,
    ({ one }) => ({
        meeting: one(meetings, {
            fields: [meetingMessages.meetingId],
            references: [meetings.id],
        }),
        sender: one(users, {
            fields: [meetingMessages.senderId],
            references: [users.id],
        }),
    }),
);
