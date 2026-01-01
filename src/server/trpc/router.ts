import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import type { Context } from './context';
import { rbacService } from './services/rbac.service';

const t = initTRPC.context<Context>().create({
    transformer: superjson,
});

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

export const authenticatedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Not authenticated: login required',
        });
    }
    return next({
        ctx: {
            session: ctx.session,
        },
    });
});

export const adminProcedure = authenticatedProcedure.use(
    async ({ ctx, next }) => {
        if (!ctx?.session?.user?.id) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Not authenticated: login required',
            });
        }

        // Check if user is app admin (queries database directly)
        const appRole = await rbacService.getUserAppRole(ctx.session.user.id);

        if (appRole !== 'admin') {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Not authorized: admin required',
            });
        }

        return next();
    },
);
