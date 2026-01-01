import {
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    integer,
} from 'drizzle-orm/pg-core';
import {
    type InferSelectModel,
    type InferInsertModel,
    relations,
} from 'drizzle-orm';
import { organizations } from './organization-schema';
import { users } from './auth-schema';

export const projectMemberRoleEnum = pgEnum('project_member_role', [
    'member',
    'admin',
]);

export const projectStatusEnum = pgEnum('project_status', [
    'active',
    'inactive',
    'completed',
]);

export const taskStatusEnum = pgEnum('task_status', [
    'todo',
    'in-progress',
    'done',
    'on-hold',
    'in-review',
    'rejected',
]);

export const projects = pgTable('projects', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    profilePicture: text('profile_picture'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate((): Date => new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    deletedBy: text('deleted_by'),
    organizationId: serial('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
});

export const projectMembers = pgTable('project_members', {
    id: serial('id').primaryKey(),
    projectId: serial('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: projectMemberRoleEnum('role').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate((): Date => new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    deletedBy: text('deleted_by'),
});

export const sprints = pgTable('sprints', {
    id: serial('id').primaryKey(),
    projectId: serial('project_id')
        .notNull()
        .references(() => projects.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate((): Date => new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    deletedBy: text('deleted_by'),
    status: projectStatusEnum('status').notNull(),
});

export const tasks = pgTable('tasks', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    projectId: integer('project_id').references(() => projects.id, {
        onDelete: 'cascade',
    }),
    sprintId: integer('sprint_id').references(() => sprints.id, {
        onDelete: 'set null',
    }),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate((): Date => new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    deletedBy: text('deleted_by'),
    status: taskStatusEnum('status').notNull(),
    statusChangedAt: timestamp('status_changed_at').defaultNow(),
});

export const taskMembers = pgTable('task_members', {
    id: serial('id').primaryKey(),
    taskId: serial('task_id')
        .notNull()
        .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: projectMemberRoleEnum('role').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate((): Date => new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    deletedBy: text('deleted_by'),
});

export const taskComments = pgTable('task_comments', {
    id: serial('id').primaryKey(),
    taskId: integer('task_id')
        .notNull()
        .references(() => tasks.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    parentId: integer('parent_id').references((): any => taskComments.id, {
        onDelete: 'cascade',
    }),
    comment: text('comment').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate((): Date => new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    deletedBy: text('deleted_by'),
});

export const projectsRelations = relations(projects, ({ many }) => ({
    members: many(projectMembers),
    sprints: many(sprints),
    tasks: many(tasks),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
    project: one(projects, {
        fields: [projectMembers.projectId],
        references: [projects.id],
    }),
    user: one(users, {
        fields: [projectMembers.userId],
        references: [users.id],
    }),
}));

export const sprintsRelations = relations(sprints, ({ one, many }) => ({
    project: one(projects, {
        fields: [sprints.projectId],
        references: [projects.id],
    }),
    tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
    project: one(projects, {
        fields: [tasks.projectId],
        references: [projects.id],
    }),
    sprint: one(sprints, {
        fields: [tasks.sprintId],
        references: [sprints.id],
    }),
    members: many(taskMembers),
    comments: many(taskComments),
}));

export const taskMembersRelations = relations(taskMembers, ({ one }) => ({
    task: one(tasks, {
        fields: [taskMembers.taskId],
        references: [tasks.id],
    }),
    user: one(users, {
        fields: [taskMembers.userId],
        references: [users.id],
    }),
}));

export const taskCommentsRelations = relations(
    taskComments,
    ({ one, many }) => ({
        task: one(tasks, {
            fields: [taskComments.taskId],
            references: [tasks.id],
        }),
        parent: one(taskComments, {
            fields: [taskComments.parentId],
            references: [taskComments.id],
            relationName: 'replies',
        }),
        replies: many(taskComments, {
            relationName: 'replies',
        }),
    }),
);

export type Project = InferSelectModel<typeof projects>;
export type NewProject = InferInsertModel<typeof projects>;

export type ProjectMember = InferSelectModel<typeof projectMembers>;
export type NewProjectMember = InferInsertModel<typeof projectMembers>;

export type Sprint = InferSelectModel<typeof sprints>;
export type NewSprint = InferInsertModel<typeof sprints>;

export type Task = InferSelectModel<typeof tasks>;
export type NewTask = InferInsertModel<typeof tasks>;

export type TaskMember = InferSelectModel<typeof taskMembers>;
export type NewTaskMember = InferInsertModel<typeof taskMembers>;

export type TaskComment = InferSelectModel<typeof taskComments>;
export type NewTaskComment = InferInsertModel<typeof taskComments>;
