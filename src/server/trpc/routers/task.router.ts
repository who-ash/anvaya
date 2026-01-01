import { z } from 'zod';
import { router, authenticatedProcedure } from '../router';
import { taskService } from '../services/task.service';
import { requirePermission } from '../middleware/rbac.middleware';

export const taskRouter = router({
    create: authenticatedProcedure
        .input(
            z.object({
                projectId: z.number(),
                organizationId: z.number(),
                sprintId: z.number().optional(),
                name: z.string(),
                description: z.string().optional(),
                status: z.enum([
                    'todo',
                    'in-progress',
                    'done',
                    'on-hold',
                    'in-review',
                    'rejected',
                ]),
                assignees: z.array(z.string()).optional(),
                startDate: z.date().optional(),
                endDate: z.date().optional(),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:projects:tasks`,
                'create',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            const { organizationId, ...data } = input;
            return await taskService.createTask(data, ctx.session.user.id);
        }),

    search: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number().optional(),
                projectIds: z.array(z.number()).optional(),
                sprintIds: z.array(z.number()).optional(),
                statuses: z.array(z.string()).optional(),
                query: z.string().optional(),
                page: z.number().min(1).optional().default(1),
                limit: z.number().min(1).max(100).optional().default(10),
            }),
        )
        .query(async ({ input, ctx }) => {
            return await taskService.searchTasks({
                ...input,
                userId: ctx.session?.user.id,
            });
        }),

    getBySprintWithMembers: authenticatedProcedure
        .input(z.object({ sprintId: z.number() }))
        .query(async ({ input }) => {
            return await taskService.getTasksWithMembers(input.sprintId);
        }),

    getById: authenticatedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            return await taskService.getTaskById(input.id);
        }),

    getAssignees: authenticatedProcedure
        .input(z.object({ taskId: z.number() }))
        .query(async ({ input }) => {
            return await taskService.getTaskAssignees(input.taskId);
        }),

    update: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
                organizationId: z.number(),
                name: z.string().optional(),
                description: z.string().optional(),
                status: z
                    .enum([
                        'todo',
                        'in-progress',
                        'done',
                        'on-hold',
                        'in-review',
                        'rejected',
                    ])
                    .optional(),
                sprintId: z.number().nullable().optional(),
                projectId: z.number().optional(),
                startDate: z.date().nullable().optional(),
                endDate: z.date().nullable().optional(),
                assignees: z.array(z.string()).optional(),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:projects:tasks`,
                'update',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            const { id, organizationId, ...data } = input;
            return await taskService.updateTask(id, data, ctx.session.user.id);
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
                    `org:${input.organizationId}:projects:tasks`,
                'delete',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await taskService.deleteTask(input.id, ctx.session.user.id);
        }),
});
