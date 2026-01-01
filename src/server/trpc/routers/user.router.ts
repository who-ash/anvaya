import { z } from 'zod';
import { adminProcedure, router, authenticatedProcedure } from '../router';
import { userService } from '../services/user.service';
import { requirePermission } from '../middleware/rbac.middleware';

const createAdminUserInput = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['admin', 'user']),
    emailVerified: z.boolean().optional().default(true),
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserInput>;

export const userRouter = router({
    getSession: authenticatedProcedure.query(({ ctx }) => {
        return ctx.session;
    }),

    create: authenticatedProcedure
        .input(createAdminUserInput)
        .use(requirePermission('user:*', 'create'))
        .mutation(async ({ input }) => {
            return await userService.createAdminUser(input);
        }),

    search: authenticatedProcedure
        .input(
            z.object({
                query: z.string().optional(),
                page: z.number().min(1).optional().default(1),
                limit: z.number().min(1).max(100).optional().default(10),
            }),
        )
        .use(requirePermission('user:*', 'read'))
        .query(async ({ input }) => {
            return await userService.searchUsers(
                input.query || '',
                input.page,
                input.limit,
            );
        }),

    list: authenticatedProcedure
        .use(requirePermission('user:*', 'read'))
        .query(async () => {
            return await userService.getAllUsers();
        }),

    update: authenticatedProcedure
        .input(
            z.object({
                id: z.string(),
                name: z.string().optional(),
                email: z.string().email().optional(),
            }),
        )
        .use(requirePermission('user:*', 'update'))
        .mutation(async ({ input }) => {
            const { id, ...data } = input;
            return await userService.updateUser(id, data);
        }),

    updateRole: authenticatedProcedure
        .input(
            z.object({
                id: z.string(),
                role: z.enum(['admin', 'user']),
            }),
        )
        .use(requirePermission('user:*', 'update'))
        .mutation(async ({ input }) => {
            return await userService.updateUser(input.id, { role: input.role });
        }),

    delete: authenticatedProcedure
        .input(
            z.object({
                id: z.string(),
            }),
        )
        .use(requirePermission('user:*', 'delete'))
        .mutation(async ({ input, ctx }) => {
            if (!ctx?.session?.user.id) {
                throw new Error('User not authenticated');
            }
            return await userService.deleteUser(input.id, ctx.session.user.id);
        }),
});
