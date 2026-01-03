import {
    relations,
    type InferSelectModel,
    type InferInsertModel,
} from 'drizzle-orm';
import {
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    integer,
    jsonb,
    boolean,
} from 'drizzle-orm/pg-core';
import { organizations } from './organization-schema';
import { users } from './auth-schema';
import { projects, sprints, tasks as orgTasks } from './project-schema';

// Enums
export const requestTypeEnum = pgEnum('request_type', [
    'bug',
    'feature_request',
    'feedback',
    'query',
]);

export const requestStatusEnum = pgEnum('request_status', [
    'open',
    'in-progress',
    'resolved',
    'closed',
    'rejected',
]);

export const requestPriorityEnum = pgEnum('request_priority', [
    'low',
    'medium',
    'high',
    'critical',
]);

// Request Templates - Defines the structure of each request type
export const requestTemplates = pgTable('request_templates', {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    type: requestTypeEnum('type').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    schema: jsonb('schema').notNull(), // JSON schema for the form
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
});

// Requests - Main table for bug reports, feature requests, feedback, queries
export const requests = pgTable('requests', {
    id: serial('id').primaryKey(),
    organizationId: integer('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    templateId: integer('template_id').references(() => requestTemplates.id, {
        onDelete: 'set null',
    }),
    type: requestTypeEnum('type').notNull(),
    title: text('title').notNull(),
    content: jsonb('content'), // Structured content based on template
    description: text('description'), // Rich text description
    status: requestStatusEnum('status').notNull().default('open'),
    priority: requestPriorityEnum('priority').notNull().default('medium'),
    projectId: integer('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    sprintId: integer('sprint_id').references(() => sprints.id, {
        onDelete: 'set null',
    }),
    taskId: integer('task_id').references(() => orgTasks.id, {
        onDelete: 'set null',
    }),
    assigneeId: text('assignee_id').references(() => users.id, {
        onDelete: 'set null',
    }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
});

// Request Comments - Discussion on requests with threading
export const requestComments = pgTable('request_comments', {
    id: serial('id').primaryKey(),
    requestId: integer('request_id')
        .notNull()
        .references(() => requests.id, { onDelete: 'cascade' }),
    userId: text('user_id')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
    parentId: integer('parent_id').references((): any => requestComments.id, {
        onDelete: 'cascade',
    }),
    content: text('content').notNull(), // Supports emoji/rich text
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
});

// Request Attachments - Files attached to requests or comments
export const requestAttachments = pgTable('request_attachments', {
    id: serial('id').primaryKey(),
    requestId: integer('request_id')
        .notNull()
        .references(() => requests.id, { onDelete: 'cascade' }),
    commentId: integer('comment_id').references(() => requestComments.id, {
        onDelete: 'cascade',
    }),
    fileName: text('file_name').notNull(),
    fileUrl: text('file_url').notNull(),
    fileType: text('file_type'),
    fileSize: integer('file_size'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    uploadedBy: text('uploaded_by')
        .notNull()
        .references(() => users.id, { onDelete: 'cascade' }),
});

// Relations
export const requestTemplatesRelations = relations(
    requestTemplates,
    ({ one, many }) => ({
        organization: one(organizations, {
            fields: [requestTemplates.organizationId],
            references: [organizations.id],
        }),
        requests: many(requests),
    }),
);

export const requestsRelations = relations(requests, ({ one, many }) => ({
    organization: one(organizations, {
        fields: [requests.organizationId],
        references: [organizations.id],
    }),
    template: one(requestTemplates, {
        fields: [requests.templateId],
        references: [requestTemplates.id],
    }),
    assignee: one(users, {
        fields: [requests.assigneeId],
        references: [users.id],
    }),
    project: one(projects, {
        fields: [requests.projectId],
        references: [projects.id],
    }),
    sprint: one(sprints, {
        fields: [requests.sprintId],
        references: [sprints.id],
    }),
    task: one(orgTasks, {
        fields: [requests.taskId],
        references: [orgTasks.id],
    }),
    creator: one(users, {
        fields: [requests.createdBy],
        references: [users.id],
    }),
    comments: many(requestComments),
    attachments: many(requestAttachments),
}));

export const requestCommentsRelations = relations(
    requestComments,
    ({ one, many }) => ({
        request: one(requests, {
            fields: [requestComments.requestId],
            references: [requests.id],
        }),
        user: one(users, {
            fields: [requestComments.userId],
            references: [users.id],
        }),
        parent: one(requestComments, {
            fields: [requestComments.parentId],
            references: [requestComments.id],
            relationName: 'replies',
        }),
        replies: many(requestComments, {
            relationName: 'replies',
        }),
        attachments: many(requestAttachments),
    }),
);

export const requestAttachmentsRelations = relations(
    requestAttachments,
    ({ one }) => ({
        request: one(requests, {
            fields: [requestAttachments.requestId],
            references: [requests.id],
        }),
        comment: one(requestComments, {
            fields: [requestAttachments.commentId],
            references: [requestComments.id],
        }),
        uploader: one(users, {
            fields: [requestAttachments.uploadedBy],
            references: [users.id],
        }),
    }),
);

// Types
export type RequestTemplate = InferSelectModel<typeof requestTemplates>;
export type NewRequestTemplate = InferInsertModel<typeof requestTemplates>;

export type Request = InferSelectModel<typeof requests>;
export type NewRequest = InferInsertModel<typeof requests>;

export type RequestComment = InferSelectModel<typeof requestComments>;
export type NewRequestComment = InferInsertModel<typeof requestComments>;

export type RequestAttachment = InferSelectModel<typeof requestAttachments>;
export type NewRequestAttachment = InferInsertModel<typeof requestAttachments>;
