import { router, adminProcedure } from '../router';
import { db } from '@/server/db';
import { users } from '@/server/db/schema/auth-schema';
import { organizations } from '@/server/db/schema/organization-schema';
import { count, isNull } from 'drizzle-orm';

export const adminRouter = router({
    getDashboardStats: adminProcedure.query(async () => {
        const [usersResult] = await db
            .select({ count: count() })
            .from(users)
            .where(isNull(users.deletedAt));

        const [orgsResult] = await db
            .select({ count: count() })
            .from(organizations)
            .where(isNull(organizations.deletedAt));

        return {
            users: {
                label: 'Total Users',
                total: usersResult?.count ?? 0,
            },
            organizations: {
                label: 'Total Organizations',
                total: orgsResult?.count ?? 0,
            },
        };
    }),
});
