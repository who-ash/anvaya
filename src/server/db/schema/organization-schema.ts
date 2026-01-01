import { relations } from 'drizzle-orm';
import { timestamp, pgTable, serial, text, pgEnum } from 'drizzle-orm/pg-core';

export const organizationMemberRoleEnum = pgEnum('organization_member_role', [
    'member',
    'admin',
]);
export const groupMemberRoleEnum = pgEnum('group_member_role', [
    'member',
    'admin',
    'evaluator',
]);

export const organizations = pgTable('organizations', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    profilePicture: text('profile_picture'),
    type: text('type').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    deletedBy: text('deleted_by'),
});

export const organizationMembers = pgTable('organization_members', {
    id: serial('id').primaryKey(),
    organizationId: serial('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: organizationMemberRoleEnum('role').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    deletedBy: text('deleted_by'),
});

export const organizationGroups = pgTable('organization_groups', {
    id: serial('id').primaryKey(),
    organizationId: serial('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    profilePicture: text('profile_picture'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    deletedBy: text('deleted_by'),
});

export const organizationGroupMembers = pgTable('organization_group_members', {
    id: serial('id').primaryKey(),
    groupId: serial('group_id')
        .notNull()
        .references(() => organizationGroups.id, { onDelete: 'cascade' }),
    organizationId: serial('organization_id')
        .notNull()
        .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull(),
    role: groupMemberRoleEnum('role').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date())
        .notNull(),
    deletedAt: timestamp('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    deletedBy: text('deleted_by'),
});

export const organizationGroupMembersRelations = relations(
    organizationGroupMembers,
    ({ one }) => ({
        group: one(organizationGroups, {
            fields: [organizationGroupMembers.groupId],
            references: [organizationGroups.id],
        }),
    }),
);
