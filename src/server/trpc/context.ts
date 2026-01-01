import { headers } from 'next/headers';
import { getUserSession } from '@/server/auth/server';
import { db } from '@/server/db';

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/v11/context
 */
export async function createContext() {
    const headersList = headers();
    const session = await getUserSession(await headersList);

    return {
        db,
        session,
        headers: headersList,
    };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
