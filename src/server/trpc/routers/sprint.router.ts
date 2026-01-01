import { z } from 'zod';
import { router, authenticatedProcedure } from '../router';
import { sprintService } from '../services/sprint.service';
import { requirePermission } from '../middleware/rbac.middleware';

export const sprintRouter = router({
    create: authenticatedProcedure
        .input(
            z.object({
                projectId: z.number(),
                organizationId: z.number(),
                name: z.string(),
                description: z.string().optional(),
                status: z.enum(['active', 'inactive', 'completed']),
                startDate: z.date().optional(),
                endDate: z.date().optional(),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:projects:sprints`,
                'create',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            const { organizationId, ...data } = input;
            return await sprintService.createSprint(data, ctx.session.user.id);
        }),

    getById: authenticatedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            return await sprintService.getSprintById(input.id);
        }),

    search: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number().optional(),
                projectIds: z.array(z.number()).optional(),
                query: z.string().optional(),
                statuses: z.array(z.string()).optional(),
                page: z.number().min(1).optional().default(1),
                limit: z.number().min(1).max(100).optional().default(10),
            }),
        )
        .query(async ({ input, ctx }) => {
            return await sprintService.searchSprints({
                ...input,
                userId: ctx.session?.user.id,
            });
        }),

    update: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
                organizationId: z.number(),
                name: z.string().optional(),
                description: z.string().optional(),
                status: z.enum(['active', 'inactive', 'completed']).optional(),
                startDate: z.date().nullable().optional(),
                endDate: z.date().nullable().optional(),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:projects:sprints`,
                'update',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            const { id, organizationId, ...data } = input;
            return await sprintService.updateSprint(
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
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:projects:sprints`,
                'delete',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await sprintService.deleteSprint(
                input.id,
                ctx.session.user.id,
            );
        }),
});
