import { z } from 'zod';
import { adminProcedure, router, authenticatedProcedure } from '../router';
import { organizationService } from '../services/organization.service';
import {
    requirePermission,
    requireOrganizationMember,
    requireGroupMember,
} from '../middleware/rbac.middleware';

const createOrganizationInput = z.object({
    name: z.string(),
    description: z.string().optional(),
    type: z.string(),
    profilePicture: z.string().optional(),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationInput>;

export const organizationRouter = router({
    create: adminProcedure
        .input(createOrganizationInput)
        .mutation(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }
            return await organizationService.createOrganization(
                input,
                ctx.session.user.id,
            );
        }),

    search: authenticatedProcedure
        .input(
            z.object({
                query: z.string().optional(),
                page: z.number().min(1).optional().default(1),
                limit: z.number().min(1).max(100).optional().default(10),
            }),
        )
        .query(async ({ input }) => {
            return await organizationService.searchOrganizations(
                input.query || '',
                input.page,
                input.limit,
            );
        }),

    list: authenticatedProcedure.query(async () => {
        return await organizationService.getAllOrganizations();
    }),

    getUserOrganizations: authenticatedProcedure.query(async ({ ctx }) => {
        if (!ctx?.session?.user.id) {
            throw new Error('User not authenticated');
        }
        return await organizationService.getUserOrganizations(
            ctx.session.user.id,
        );
    }),

    getById: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
            }),
        )
        .use(requireOrganizationMember((input: { id: number }) => input.id))
        .query(async ({ input }) => {
            return await organizationService.getOrganizationById(input.id);
        }),

    update: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
                name: z.string().optional(),
                description: z.string().optional(),
                profilePicture: z.string().optional(),
            }),
        )
        .use(
            requirePermission(
                (input: { id: number }) => `org:${input.id}`,
                'update',
            ),
        )
        .mutation(async ({ input }) => {
            const { id, ...data } = input;
            return await organizationService.updateOrganization(id, data);
        }),

    delete: authenticatedProcedure
        .input(
            z.object({
                id: z.number(),
            }),
        )
        .use(
            requirePermission(
                (input: { id: number }) => `org:${input.id}`,
                'delete',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }
            return await organizationService.deleteOrganization(
                input.id,
                ctx.session.user.id,
            );
        }),

    getMembers: authenticatedProcedure
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
            return await organizationService.getMembers(
                input.organizationId,
                input.query || '',
                input.page,
                input.limit,
            );
        }),

    getOrgMembers: authenticatedProcedure
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
            return await organizationService.getOrgMembersForGroups(
                input.organizationId,
                input.query || '',
                input.page,
                input.limit,
            );
        }),

    getAddMembers: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number(),
                query: z.string().optional(),
                page: z.number().min(1).optional().default(1),
                limit: z.number().min(1).max(100).optional().default(10),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:members`,
                'create',
            ),
        )
        .query(async ({ input }) => {
            return await organizationService.getAvailableUsersForOrg(
                input.organizationId,
                input.query || '',
                input.page,
                input.limit,
            );
        }),

    addMembers: authenticatedProcedure
        .input(
            z.object({
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
                    `org:${input.organizationId}:members`,
                'create',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }
            return await organizationService.addMembers(
                input.organizationId,
                input.members,
                ctx.session.user.id,
            );
        }),

    removeMember: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number(),
                userId: z.string(),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:members`,
                'delete',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }
            return await organizationService.removeMember(
                input.organizationId,
                input.userId,
                ctx.session.user.id,
            );
        }),

    updateMemberRole: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number(),
                userId: z.string(),
                role: z.enum(['member', 'admin']),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:members`,
                'update',
            ),
        )
        .mutation(async ({ input }) => {
            return await organizationService.updateMemberRole(
                input.organizationId,
                input.userId,
                input.role,
            );
        }),

    getGroups: authenticatedProcedure
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
            return await organizationService.getGroups(
                input.organizationId,
                input.query || '',
                input.page,
                input.limit,
            );
        }),

    createGroup: authenticatedProcedure
        .input(
            z.object({
                organizationId: z.number(),
                name: z.string(),
                description: z.string().optional(),
                profilePicture: z.string().optional(),
                members: z.array(z.string()).optional(),
            }),
        )
        .use(
            requirePermission(
                (input: { organizationId: number }) =>
                    `org:${input.organizationId}:groups`,
                'create',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }
            return await organizationService.createGroup(
                input,
                ctx.session.user.id,
            );
        }),

    updateGroup: authenticatedProcedure
        .input(
            z.object({
                groupId: z.number(),
                name: z.string().optional(),
                description: z.string().optional(),
                profilePicture: z.string().optional(),
            }),
        )
        .use(
            requirePermission(
                (input: { groupId: number }) => `group:${input.groupId}`,
                'update',
            ),
        )
        .mutation(async ({ input }) => {
            const { groupId, ...data } = input;
            return await organizationService.updateGroup(groupId, data);
        }),

    deleteGroup: authenticatedProcedure
        .input(
            z.object({
                groupId: z.number(),
            }),
        )
        .use(
            requirePermission(
                (input: { groupId: number }) => `group:${input.groupId}`,
                'delete',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }
            return await organizationService.deleteGroup(
                input.groupId,
                ctx.session.user.id,
            );
        }),

    getGroupMembers: authenticatedProcedure
        .input(
            z.object({
                groupId: z.number(),
                query: z.string().optional(),
                page: z.number().min(1).optional().default(1),
                limit: z.number().min(1).max(100).optional().default(10),
            }),
        )
        .use(requireGroupMember((input: { groupId: number }) => input.groupId))
        .query(async ({ input }) => {
            return await organizationService.getGroupMembers(
                input.groupId,
                input.query || '',
                input.page,
                input.limit,
            );
        }),

    getAddGroupMembers: authenticatedProcedure
        .input(
            z.object({
                groupId: z.number(),
                organizationId: z.number(),
                query: z.string().optional(),
                page: z.number().min(1).optional().default(1),
                limit: z.number().min(1).max(100).optional().default(10),
            }),
        )
        .use(
            requirePermission(
                (input: { groupId: number }) =>
                    `group:${input.groupId}:members`,
                'create',
            ),
        )
        .query(async ({ input }) => {
            return await organizationService.getAvailableMembersForGroup(
                input.groupId,
                input.organizationId,
                input.query || '',
                input.page,
                input.limit,
            );
        }),

    addGroupMembers: authenticatedProcedure
        .input(
            z.object({
                groupId: z.number(),
                members: z.array(
                    z.object({
                        userId: z.string(),
                        role: z.enum(['member', 'admin', 'evaluator']),
                    }),
                ),
            }),
        )
        .use(
            requirePermission(
                (input: { groupId: number }) =>
                    `group:${input.groupId}:members`,
                'create',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }
            return await organizationService.addGroupMembers(
                input.groupId,
                input.members,
                ctx.session.user.id,
            );
        }),

    updateGroupMemberRole: authenticatedProcedure
        .input(
            z.object({
                groupId: z.number(),
                userId: z.string(),
                role: z.enum(['member', 'admin', 'evaluator']),
            }),
        )
        .use(
            requirePermission(
                (input: { groupId: number }) =>
                    `group:${input.groupId}:members`,
                'update',
            ),
        )
        .mutation(async ({ input }) => {
            return await organizationService.updateGroupMemberRole(
                input.groupId,
                input.userId,
                input.role,
            );
        }),

    removeGroupMember: authenticatedProcedure
        .input(
            z.object({
                groupId: z.number(),
                userId: z.string(),
            }),
        )
        .use(
            requirePermission(
                (input: { groupId: number }) =>
                    `group:${input.groupId}:members`,
                'delete',
            ),
        )
        .mutation(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }
            return await organizationService.removeGroupMember(
                input.groupId,
                input.userId,
                ctx.session.user.id,
            );
        }),
});
