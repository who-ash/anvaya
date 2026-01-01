import { date, pgTable, text } from 'drizzle-orm/pg-core';
import { users } from './auth-schema';

export const userProfiles = pgTable('user_profiles', {
    userId: text('user_id')
        .primaryKey()
        .references(() => users.id, { onDelete: 'cascade' }),
    metadata: text('metadata').notNull().default(JSON.stringify({})),
    createdAt: date('created_at').defaultNow().notNull(),
    updatedAt: date('updated_at')
        .defaultNow()
        .$onUpdate(() => /* @__PURE__ */ new Date().toISOString())
        .notNull(),
    deletedAt: date('deleted_at'),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    deletedBy: text('deleted_by'),
});
