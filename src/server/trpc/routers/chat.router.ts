import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, authenticatedProcedure } from '../router';
import { chatService } from '../services/chat.service';
import { requireOrganizationMember } from '../middleware/rbac.middleware';

export const chatRouter = router({
    getChats: authenticatedProcedure
        .input(z.object({ organizationId: z.number() }))
        .use(
            requireOrganizationMember(
                (input: { organizationId: number }) => input.organizationId,
            ),
        )
        .query(async ({ input, ctx }) => {
            return await chatService.getChats(
                ctx.session!.user.id,
                input.organizationId,
            );
        }),

    getMessages: authenticatedProcedure
        .input(z.object({ chatId: z.number() }))
        .query(async ({ input, ctx }) => {
            const isParticipant = await chatService.isParticipant(
                input.chatId,
                ctx.session!.user.id,
            );
            if (!isParticipant) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You are not a participant in this chat',
                });
            }
            return await chatService.getMessages(input.chatId);
        }),

    sendMessage: authenticatedProcedure
        .input(
            z.object({
                chatId: z.number(),
                content: z.string(),
                attachments: z
                    .array(
                        z.object({
                            fileName: z.string(),
                            fileUrl: z.string(),
                            fileType: z.string().optional(),
                            fileSize: z.number().optional(),
                        }),
                    )
                    .optional(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const isParticipant = await chatService.isParticipant(
                input.chatId,
                ctx.session!.user.id,
            );
            if (!isParticipant) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You are not a participant in this chat',
                });
            }
            return await chatService.sendMessage(
                input.chatId,
                ctx.session!.user.id,
                input.content,
                input.attachments,
            );
        }),

    getOrCreateDirectChat: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number(),
                userId: z.string(),
            }),
        )
        .use(
            requireOrganizationMember(
                (input: { organizationId: number }) => input.organizationId,
            ),
        )
        .mutation(async ({ input, ctx }) => {
            return await chatService.getOrCreateDirectChat(
                input.organizationId,
                ctx.session!.user.id,
                input.userId,
            );
        }),

    getOrganizationMembers: authenticatedProcedure
        .input(z.object({ organizationId: z.number() }))
        .use(
            requireOrganizationMember(
                (input: { organizationId: number }) => input.organizationId,
            ),
        )
        .query(async ({ input, ctx }) => {
            return await chatService.getOrganizationMembers(
                input.organizationId,
                ctx.session!.user.id,
            );
        }),

    markAsRead: authenticatedProcedure
        .input(z.object({ chatId: z.number() }))
        .mutation(async ({ input, ctx }) => {
            const isParticipant = await chatService.isParticipant(
                input.chatId,
                ctx.session!.user.id,
            );
            if (!isParticipant) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You are not a participant in this chat',
                });
            }
            return await chatService.markMessagesAsRead(
                input.chatId,
                ctx.session!.user.id,
            );
        }),

    editMessage: authenticatedProcedure
        .input(
            z.object({
                messageId: z.number(),
                content: z.string(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const result = await chatService.editMessage(
                input.messageId,
                ctx.session!.user.id,
                input.content,
            );
            if (result.length === 0) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You can only edit your own messages',
                });
            }
            return result[0];
        }),

    deleteMessage: authenticatedProcedure
        .input(
            z.object({
                messageId: z.number(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            const result = await chatService.deleteMessage(
                input.messageId,
                ctx.session!.user.id,
            );
            if (result.length === 0) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: 'You can only delete your own messages',
                });
            }
            return result[0];
        }),
});
