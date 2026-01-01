import { router } from '../router';
import { userRouter } from './user.router';
import { organizationRouter } from './organization.router';
import { adminRouter } from './admin.router';
import { rbacRouter } from './rbac.router';

export const appRouter = router({
    user: userRouter,
    organization: organizationRouter,
    admin: adminRouter,
    rbac: rbacRouter,
});

export type AppRouter = typeof appRouter;
