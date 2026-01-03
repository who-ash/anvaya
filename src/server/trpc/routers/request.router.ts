import { z } from 'zod';
import { router, authenticatedProcedure } from '../router';
import { requestService } from '../services/request.service';
import { requestCommentService } from '../services/request-comment.service';
import {
    requirePermission,
    requireOrganizationMember,
} from '../middleware/rbac.middleware';

export const requestRouter = router({
    create: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number(),
                projectId: z.number(),
                sprintId: z.number().optional(),
                taskId: z.number().optional(),
                templateId: z.number().optional(),
                type: z.enum(['bug', 'feature_request', 'feedback', 'query']),
                title: z.string().min(1),
                content: z.record(z.any()).optional(),
                description: z.string().optional(),
                priority: z
                    .enum(['low', 'medium', 'high', 'critical'])
                    .optional(),
                assigneeId: z.string().optional(),
            }),
        )
        .use(
            requireOrganizationMember<{ organizationId: number }>(
                (input) => input.organizationId,
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await requestService.createRequest(
                input,
                ctx.session.user.id,
            );
        }),

    getAll: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number(),
                projectId: z.number().optional(),
                types: z.array(z.string()).optional(),
                statuses: z.array(z.string()).optional(),
                priorities: z.array(z.string()).optional(),
            }),
        )
        .query(async ({ input }) => {
            return await requestService.getRequests(
                input.organizationId,
                input.types,
                input.statuses,
                input.priorities,
                input.projectId,
            );
        }),

    search: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number(),
                projectId: z.number().optional(),
                types: z.array(z.string()).optional(),
                statuses: z.array(z.string()).optional(),
                priorities: z.array(z.string()).optional(),
                query: z.string().optional(),
                page: z.number().optional(),
                limit: z.number().optional(),
            }),
        )
        .query(async ({ input }) => {
            return await requestService.searchRequests(input);
        }),

    getById: authenticatedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            return await requestService.getRequestById(input.id);
        }),

    update: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
                organizationId: z.number(),
                projectId: z.number().optional(),
                sprintId: z.number().nullable().optional(),
                taskId: z.number().nullable().optional(),
                title: z.string().optional(),
                description: z.string().optional(),
                content: z.record(z.any()).optional(),
                status: z
                    .enum([
                        'open',
                        'in-progress',
                        'resolved',
                        'closed',
                        'rejected',
                    ])
                    .optional(),
                priority: z
                    .enum(['low', 'medium', 'high', 'critical'])
                    .optional(),
                assigneeId: z.string().nullable().optional(),
            }),
        )
        .use(
            requireOrganizationMember<{ organizationId: number }>(
                (input) => input.organizationId,
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            const { id, organizationId, ...data } = input;
            return await requestService.updateRequest(
                id,
                data,
                ctx.session.user.id,
            );
        }),

    delete: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
                organizationId: z.number(),
            }),
        )
        .use(
            requireOrganizationMember<{ organizationId: number }>(
                (input) => input.organizationId,
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await requestService.deleteRequest(
                input.id,
                ctx.session.user.id,
            );
        }),

    // Template operations
    getTemplates: authenticatedProcedure
        .input(z.object({ organizationId: z.number() }))
        .query(async ({ input }) => {
            return await requestService.getTemplates(input.organizationId);
        }),

    createTemplate: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number(),
                type: z.enum(['bug', 'feature_request', 'feedback', 'query']),
                name: z.string(),
                description: z.string().optional(),
                schema: z.record(z.any()),
                isDefault: z.boolean().optional(),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:requests`,
                'create',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await requestService.createTemplate(
                input,
                ctx.session.user.id,
            );
        }),

    // Comment operations
    createComment: authenticatedProcedure
        .input(
            z.object({
                requestId: z.number(),
                parentId: z.number().optional(),
                content: z.string(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await requestCommentService.create(
                input,
                ctx.session.user.id,
            );
        }),

    getComments: authenticatedProcedure
        .input(z.object({ requestId: z.number() }))
        .query(async ({ input }) => {
            return await requestCommentService.getByRequestId(input.requestId);
        }),

    updateComment: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
                content: z.string(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await requestCommentService.update(
                input.id,
                input.content,
                ctx.session.user.id,
            );
        }),

    deleteComment: authenticatedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await requestCommentService.delete(
                input.id,
                ctx.session.user.id,
            );
        }),

    // Attachment operations
    addAttachment: authenticatedProcedure
        .input(
            z.object({
                requestId: z.number(),
                commentId: z.number().optional(),
                fileName: z.string(),
                fileUrl: z.string(),
                fileType: z.string().optional(),
                fileSize: z.number().optional(),
            }),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await requestCommentService.addAttachment(
                input,
                ctx.session.user.id,
            );
        }),

    deleteAttachment: authenticatedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await requestCommentService.deleteAttachment(
                input.id,
                ctx.session.user.id,
            );
        }),
});
