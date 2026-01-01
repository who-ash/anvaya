import { TRPCError } from '@trpc/server';
import { rbacService } from '../services/rbac.service';
import { middleware } from '../router';

/**
 * Middleware to check if user has permission to access a resource
 *
 * @param resource - The resource being accessed (e.g., 'user:*', 'org:123', 'group:456')
 * @param action - The action being performed (e.g., 'read', 'write', 'delete')
 */
export const requirePermission = <TInput = unknown>(
    resource: string | ((input: TInput) => string),
    action: string,
) => {
    return middleware(async ({ ctx, next, input }) => {
        if (!ctx?.session?.user?.id) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'You must be logged in to perform this action',
            });
        }

        const userId = ctx.session.user.id;

        // Determine the actual resource string
        const actualResource =
            typeof resource === 'function'
                ? resource(input as TInput)
                : resource;

        // Check permission (this will query database for user's roles)
        const hasPermission = await rbacService.checkPermission(
            userId,
            actualResource,
            action,
        );

        if (!hasPermission) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You do not have permission to perform this action',
            });
        }

        return next({
            ctx: {
                ...ctx,
                user: ctx.session.user,
            },
        });
    });
};

/**
 * Middleware to check if user is app admin
 */
export const requireAppAdmin = middleware(async ({ ctx, next }) => {
    if (!ctx?.session?.user?.id) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'You must be logged in to perform this action',
        });
    }

    const userId = ctx.session.user.id;
    const appRole = await rbacService.getUserAppRole(userId);

    if (appRole !== 'admin') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You must be an admin to perform this action',
        });
    }

    return next({
        ctx: {
            ...ctx,
            user: ctx.session.user,
        },
    });
});

/**
 * Middleware to check if user is member of an organization
 */
export const requireOrganizationMember = <TInput = unknown>(
    organizationIdExtractor: (input: TInput) => number,
) => {
    return middleware(async ({ ctx, next, input }) => {
        if (!ctx?.session?.user?.id) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'You must be logged in to perform this action',
            });
        }

        const userId = ctx.session.user.id;
        const organizationId = organizationIdExtractor(input as TInput);

        // Check if user is app admin (bypass check)
        const appRole = await rbacService.getUserAppRole(userId);
        if (appRole === 'admin') {
            return next({ ctx: { ...ctx, user: ctx.session.user } });
        }

        // Check organization membership
        const isMember = await rbacService.isOrganizationMember(
            userId,
            organizationId,
        );

        if (!isMember) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You are not a member of this organization',
            });
        }

        return next({
            ctx: {
                ...ctx,
                user: ctx.session.user,
            },
        });
    });
};

/**
 * Middleware to check if user is member of a group
 */
export const requireGroupMember = <TInput = unknown>(
    groupIdExtractor: (input: TInput) => number,
) => {
    return middleware(async ({ ctx, next, input }) => {
        if (!ctx?.session?.user?.id) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'You must be logged in to perform this action',
            });
        }

        const userId = ctx.session.user.id;
        const groupId = groupIdExtractor(input as TInput);

        // Check if user is app admin (bypass check)
        const appRole = await rbacService.getUserAppRole(userId);
        if (appRole === 'admin') {
            return next({ ctx: { ...ctx, user: ctx.session.user } });
        }

        // Check group membership
        const isMember = await rbacService.isGroupMember(userId, groupId);

        if (!isMember) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'You are not a member of this group',
            });
        }

        return next({
            ctx: {
                ...ctx,
                user: ctx.session.user,
            },
        });
    });
};
