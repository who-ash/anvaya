import { z } from 'zod';

/**
 * Server-side environment variables schema
 * Add all required server env vars here.
 */
const serverSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'production']),
    DATABASE_URL: z.string().url(),
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
    LIVEKIT_API_KEY: z.string().min(1),
    LIVEKIT_API_SECRET: z.string().min(1),
    LIVEKIT_URL: z.string().min(1),
    DEEPGRAM_API_KEY: z.string().min(1),
});

/**
 * Client-side environment variables schema
 * Add all required public env vars here (must start with NEXT_PUBLIC_)
 */
const clientSchema = z.object({
    NEXT_PUBLIC_LIVEKIT_URL: z.string().min(1),
});

const isServer = typeof window === 'undefined';

const mergedSchema = serverSchema.merge(clientSchema);

function validateEnv() {
    if (isServer) {
        const parsed = serverSchema.safeParse(process.env);
        if (!parsed.success) {
            console.error(
                '❌ Invalid server environment variables:',
                parsed.error.flatten().fieldErrors,
            );
            throw new Error('Invalid server environment variables');
        }
        // On server, we can also validate client vars if they are in process.env
        const clientParsed = clientSchema.safeParse(process.env);
        return {
            ...parsed.data,
            ...(clientParsed.success ? clientParsed.data : {}),
        };
    } else {
        // On client, only validate client vars
        // We must be explicit about which vars to include for the bundler
        const clientData = {
            NEXT_PUBLIC_LIVEKIT_URL: process.env.NEXT_PUBLIC_LIVEKIT_URL,
        };
        const parsed = clientSchema.safeParse(clientData);
        if (!parsed.success) {
            console.error(
                '❌ Invalid client environment variables:',
                parsed.error.flatten().fieldErrors,
            );
            throw new Error('Invalid client environment variables');
        }
        return parsed.data;
    }
}

export const env = validateEnv() as z.infer<typeof serverSchema> &
    z.infer<typeof clientSchema>;

// Usage:
// import { env } from '@/lib/env';
// env.DATABASE_URL, env.NEXT_PUBLIC_API_URL, etc.
