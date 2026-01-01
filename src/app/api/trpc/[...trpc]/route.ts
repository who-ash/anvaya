import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { NextRequest } from 'next/server';
import { createContext } from '@/server/trpc/context';
import { appRouter } from '@/server/trpc/routers';

const handler = (req: NextRequest) =>
    fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext,
        onError:
            process.env.NODE_ENV === 'development'
                ? ({ path, error }) => {
                      // eslint-disable-next-line no-console
                      console.error(
                          `tRPC failed on ${path ?? '<no-path>'}: ${error.message}`,
                      );
                  }
                : undefined,
    });

export { handler as GET, handler as POST };
