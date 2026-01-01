import { relations } from 'drizzle-orm';
import {
    timestamp,
    pgTable,
    serial,
    text,
    pgEnum,
    integer,
} from 'drizzle-orm/pg-core';
import { users } from './auth-schema';
import { organizations } from './organization-schema';

export const chatTypeEnum = pgEnum('chat_type', ['direct', 'group']);

export const chats = pgTable('chats', {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name'),
    type: chatTypeEnum('type').notNull().default('direct'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const chatParticipants = pgTable('chat_participants', {
    id: serial('id').primaryKey(),
    chatId: integer('chat_id')
        .notNull()
        .references(() => chats.id, { onDelete: 'cascade' }),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
    id: serial('id').primaryKey(),
    chatId: integer('chat_id')
        .notNull()
        .references(() => chats.id, { onDelete: 'cascade' }),
    senderId: text('sender_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
});

export const attachments = pgTable('attachments', {
    id: serial('id').primaryKey(),
    messageId: integer('message_id')
        .notNull()
        .references(() => messages.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    fileUrl: text('file_url').notNull(),
    fileType: text('file_type'),
    fileSize: integer('file_size'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const chatsRelations = relations(chats, ({ many }) => ({
    participants: many(chatParticipants),
    messages: many(messages),
}));

export const chatParticipantsRelations = relations(
    chatParticipants,
    ({ one }) => ({
        chat: one(chats, {
            fields: [chatParticipants.chatId],
            references: [chats.id],
        }),
        user: one(users, {
            fields: [chatParticipants.userId],
            references: [users.id],
        }),
    }),
);

export const messagesRelations = relations(messages, ({ one, many }) => ({
    chat: one(chats, {
        fields: [messages.chatId],
        references: [chats.id],
    }),
    sender: one(users, {
        fields: [messages.senderId],
        references: [users.id],
    }),
    attachments: many(attachments),
}));

export const attachmentsRelations = relations(attachments, ({ one }) => ({
    message: one(messages, {
        fields: [attachments.messageId],
        references: [messages.id],
    }),
}));
