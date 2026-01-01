import { z } from 'zod';
import { router, authenticatedProcedure } from '../router';
import { projectService } from '../services/project.service';
import {
    requirePermission,
    requireOrganizationMember,
} from '../middleware/rbac.middleware';

export const projectRouter = router({
    create: authenticatedProcedure
        .input(
            z.object({
                name: z.string(),
                description: z.string().optional(),
                profilePicture: z.string().optional(),
                organizationId: z.number(),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:projects`,
                'create',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await projectService.createProject(
                input,
                ctx.session.user.id,
            );
        }),

    search: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number(),
                query: z.string().optional(),
                page: z.number().min(1).optional().default(1),
                limit: z.number().min(1).max(100).optional().default(10),
            }),
        )
        .use(
            requireOrganizationMember(
                (input: { organizationId: number }) => input.organizationId,
            ),
        )
        .query(async ({ input }) => {
            return await projectService.searchProjects(
                input.organizationId,
                input.query || '',
                input.page,
                input.limit,
            );
        }),

    getById: authenticatedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
            return await projectService.getProjectById(input.id);
        }),

    getMembers: authenticatedProcedure
        .input(z.object({ projectId: z.number() }))
        .query(async ({ input }) => {
            return await projectService.getProjectMembers(input.projectId);
        }),

    getAddMembers: authenticatedProcedure
        .input(
            z.object({
                projectId: z.number(),
                organizationId: z.number(),
                query: z.string().optional(),
                page: z.number().min(1).optional().default(1),
                limit: z.number().min(1).max(100).optional().default(10),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:projects`,
                'update',
            ),
        )
        .query(async ({ input }) => {
            return await projectService.getAvailableMembersForProject(
                input.projectId,
                input.organizationId,
                input.query || '',
                input.page,
                input.limit,
            );
        }),

    addMembers: authenticatedProcedure
        .input(
            z.object({
                projectId: z.number(),
                organizationId: z.number(),
                members: z.array(
                    z.object({
                        userId: z.string(),
                        role: z.enum(['member', 'admin']),
                    }),
                ),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:projects`,
                'update',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            const { organizationId, ...data } = input;
            return await projectService.addMembers(data, ctx.session.user.id);
        }),

    removeMember: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
                organizationId: z.number(),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:projects`,
                'update',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await projectService.removeMember(
                input.id,
                ctx.session.user.id,
            );
        }),

    update: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
                organizationId: z.number(), // Added for RBAC
                name: z.string().optional(),
                description: z.string().optional(),
                profilePicture: z.string().optional(),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:projects`,
                'update',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            const { id, organizationId, ...data } = input;
            return await projectService.updateProject(
                id,
                data,
                ctx.session.user.id,
            );
        }),

    delete: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
                organizationId: z.number(), // Added for RBAC
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:projects`,
                'delete',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx.session?.user.id) throw new Error('Unauthorized');
            return await projectService.deleteProject(
                input.id,
                ctx.session.user.id,
            );
        }),
});
