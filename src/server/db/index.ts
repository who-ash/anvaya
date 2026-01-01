import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as auth_schema from './schema/auth-schema';
import * as user_schema from './schema/user-schema';
import * as organization_schema from './schema/organization-schema';

const schema = {
    ...auth_schema,
    ...user_schema,
    ...organization_schema,
};
const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
});

export const getUser = async (userId: string) => {
    const user = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.id, userId),
    });
    return user;
};

export const db = drizzle({ client: pool, schema });
