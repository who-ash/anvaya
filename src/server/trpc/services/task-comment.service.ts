import { db } from '@/server/db';
import { taskComments } from '@/server/db/schema/project-schema';
import { users } from '@/server/db/schema/auth-schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export const taskCommentService = {
    createComment: async (
        input: {
            taskId: number;
            comment: string;
            parentId?: number;
        },
        userId: string,
    ) => {
        try {
            const [comment] = await db
                .insert(taskComments)
                .values({
                    taskId: input.taskId,
                    userId,
                    parentId: input.parentId,
                    comment: input.comment,
                    createdBy: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                })
                .returning();

            return comment;
        } catch (error) {
            throw error;
        }
    },

    getCommentsByTaskId: async (taskId: number) => {
        try {
            const results = await db
                .select({
                    comment: taskComments,
                    user: {
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        image: users.image,
                    },
                })
                .from(taskComments)
                .leftJoin(users, eq(taskComments.userId, users.id))
                .where(
                    and(
                        eq(taskComments.taskId, taskId),
                        isNull(taskComments.deletedAt),
                    ),
                )
                .orderBy(desc(taskComments.createdAt));

            return results.map((row) => ({
                ...row.comment,
                user: row.user,
            }));
        } catch (error) {
            throw error;
        }
    },

    updateComment: async (
        id: number,
        data: { comment?: string },
        userId: string,
    ) => {
        try {
            const [comment] = await db
                .update(taskComments)
                .set({
                    ...data,
                    updatedBy: userId,
                    updatedAt: new Date(),
                })
                .where(eq(taskComments.id, id))
                .returning();

            return comment;
        } catch (error) {
            throw error;
        }
    },

    deleteComment: async (id: number, userId: string) => {
        try {
            const [comment] = await db
                .update(taskComments)
                .set({
                    deletedAt: new Date(),
                    deletedBy: userId,
                })
                .where(eq(taskComments.id, id))
                .returning();

            return comment;
        } catch (error) {
            throw error;
        }
    },
};
