'use client';

import { createContext, ReactNode, useMemo } from 'react';
import { createContextualCan, useAbility as useCaslAbility } from '@casl/react';
import { createMongoAbility } from '@casl/ability';
import { trpc } from './trpc-provider';
import { buildAbility, AppAbility } from '@/lib/ability';

// Create context with empty ability as default
const defaultAbility = createMongoAbility();
export const AbilityContext = createContext<AppAbility>(
    defaultAbility as AppAbility,
);

/**
 * Contextual Can component for permission-based rendering
 *
 * Usage:
 * ```tsx
 * <Can I="create" a={`org:${orgId}:members`}>
 *   <Button>Add Members</Button>
 * </Can>
 *
 * // With passThrough to disable instead of hide
 * <Can I="delete" a={`org:${orgId}:members`} passThrough>
 *   {(allowed) => <Button disabled={!allowed}>Delete</Button>}
 * </Can>
 * ```
 */
export const Can = createContextualCan(AbilityContext.Consumer);

/**
 * Hook for imperative permission checks
 *
 * Usage:
 * ```tsx
 * const ability = useAbility();
 * if (ability.can('create', `org:${orgId}:members`)) {
 *   // do something
 * }
 * ```
 */
export function useAbility() {
    return useCaslAbility(AbilityContext);
}

/**
 * Provider component that fetches user permissions and provides ability context
 */
export function AbilityProvider({ children }: { children: ReactNode }) {
    const { data: permissions } = trpc.rbac.getUserPermissions.useQuery(
        undefined,
        {
            staleTime: 5 * 60 * 1000, // Cache for 5 minutes
            refetchOnWindowFocus: false,
        },
    );

    const ability = useMemo(() => {
        if (!permissions) {
            return defaultAbility as AppAbility;
        }
        return buildAbility(permissions);
    }, [permissions]);

    return (
        <AbilityContext.Provider value={ability}>
            {children}
        </AbilityContext.Provider>
    );
}
