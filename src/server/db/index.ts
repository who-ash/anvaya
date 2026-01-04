import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as auth_schema from './schema/auth-schema';
import * as user_schema from './schema/user-schema';
import * as organization_schema from './schema/organization-schema';
import * as project_schema from './schema/project-schema';
import * as chat_schema from './schema/chat-schema';
import * as time_tracking_schema from './schema/time-tracking-schema';
import * as request_schema from './schema/request-schema';
import * as meet_schema from './schema/meet-schema';

const schema = {
    ...auth_schema,
    ...user_schema,
    ...organization_schema,
    ...project_schema,
    ...chat_schema,
    ...time_tracking_schema,
    ...request_schema,
    ...meet_schema,
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
