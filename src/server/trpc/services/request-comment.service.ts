import { db } from '@/server/db';
import { users } from '@/server/db/schema/auth-schema';
import {
    requestComments,
    requestAttachments,
} from '@/server/db/schema/request-schema';
import { eq, and, isNull, desc } from 'drizzle-orm';

export const requestCommentService = {
    create: async (
        input: {
            requestId: number;
            parentId?: number;
            content: string;
        },
        userId: string,
    ) => {
        try {
            const [comment] = await db
                .insert(requestComments)
                .values({
                    requestId: input.requestId,
                    parentId: input.parentId,
                    content: input.content,
                    userId,
                })
                .returning();

            return comment;
        } catch (error) {
            throw error;
        }
    },

    getByRequestId: async (requestId: number) => {
        try {
            const results = await db
                .select({
                    comment: requestComments,
                    user: {
                        id: users.id,
                        name: users.name,
                        email: users.email,
                        image: users.image,
                    },
                })
                .from(requestComments)
                .leftJoin(users, eq(requestComments.userId, users.id))
                .where(
                    and(
                        eq(requestComments.requestId, requestId),
                        isNull(requestComments.deletedAt),
                    ),
                )
                .orderBy(desc(requestComments.createdAt));

            // Get attachments for all comments
            const commentIds = results.map((r) => r.comment.id);
            let attachmentsByComment: Record<number, any[]> = {};

            if (commentIds.length > 0) {
                const attachments = await db
                    .select()
                    .from(requestAttachments)
                    .where(
                        and(
                            eq(requestAttachments.requestId, requestId),
                            // Note: commentId might be null for request-level attachments
                        ),
                    );

                for (const att of attachments) {
                    if (att.commentId) {
                        if (!attachmentsByComment[att.commentId]) {
                            attachmentsByComment[att.commentId] = [];
                        }
                        attachmentsByComment[att.commentId].push(att);
                    }
                }
            }

            return results.map((row) => ({
                ...row.comment,
                user: row.user,
                attachments: attachmentsByComment[row.comment.id] || [],
            }));
        } catch (error) {
            throw error;
        }
    },

    update: async (id: number, content: string, userId: string) => {
        try {
            // Verify ownership
            const existing = await db.query.requestComments.findFirst({
                where: eq(requestComments.id, id),
            });

            if (!existing) {
                throw new Error('Comment not found');
            }

            if (existing.userId !== userId) {
                throw new Error('Not authorized to edit this comment');
            }

            const [updated] = await db
                .update(requestComments)
                .set({
                    content,
                    updatedAt: new Date(),
                })
                .where(eq(requestComments.id, id))
                .returning();

            return updated;
        } catch (error) {
            throw error;
        }
    },

    delete: async (id: number, userId: string) => {
        try {
            // Verify ownership
            const existing = await db.query.requestComments.findFirst({
                where: eq(requestComments.id, id),
            });

            if (!existing) {
                throw new Error('Comment not found');
            }

            if (existing.userId !== userId) {
                throw new Error('Not authorized to delete this comment');
            }

            const [deleted] = await db
                .update(requestComments)
                .set({
                    deletedAt: new Date(),
                })
                .where(eq(requestComments.id, id))
                .returning();

            return deleted;
        } catch (error) {
            throw error;
        }
    },

    // Attachment operations
    addAttachment: async (
        input: {
            requestId: number;
            commentId?: number;
            fileName: string;
            fileUrl: string;
            fileType?: string;
            fileSize?: number;
        },
        userId: string,
    ) => {
        try {
            const [attachment] = await db
                .insert(requestAttachments)
                .values({
                    ...input,
                    uploadedBy: userId,
                })
                .returning();

            return attachment;
        } catch (error) {
            throw error;
        }
    },

    deleteAttachment: async (id: number, userId: string) => {
        try {
            const existing = await db.query.requestAttachments.findFirst({
                where: eq(requestAttachments.id, id),
            });

            if (!existing) {
                throw new Error('Attachment not found');
            }

            if (existing.uploadedBy !== userId) {
                throw new Error('Not authorized to delete this attachment');
            }

            const [deleted] = await db
                .delete(requestAttachments)
                .where(eq(requestAttachments.id, id))
                .returning();

            return deleted;
        } catch (error) {
            throw error;
        }
    },
};
