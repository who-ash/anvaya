'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { trpc } from '@/providers/trpc-provider';

interface OrganizationContextType {
    activeOrgId: number | null;
    setActiveOrgId: (id: number | null) => void;
    isLoading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType>({
    activeOrgId: null,
    setActiveOrgId: () => {},
    isLoading: true,
});

export function OrganizationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: orgs, isLoading } =
        trpc.organization.getUserOrganizations.useQuery();
    const [activeOrgId, setActiveOrgId] = useState<number | null>(null);

    useEffect(() => {
        if (!isLoading && orgs && orgs.length > 0 && activeOrgId === null) {
            // Check local storage for previously selected org
            const storedId = localStorage.getItem('lastActiveOrgId');
            if (storedId) {
                const id = parseInt(storedId);
                if (orgs.some((org) => org.id === id)) {
                    setActiveOrgId(id);
                    return;
                }
            }
            setActiveOrgId(orgs[0].id);
        }
    }, [orgs, isLoading, activeOrgId]);

    const handleSetStateOrgId = (id: number | null) => {
        setActiveOrgId(id);
        if (id) {
            localStorage.setItem('lastActiveOrgId', id.toString());
        } else {
            localStorage.removeItem('lastActiveOrgId');
        }
    };

    return (
        <OrganizationContext.Provider
            value={{
                activeOrgId,
                setActiveOrgId: handleSetStateOrgId,
                isLoading,
            }}
        >
            {children}
        </OrganizationContext.Provider>
    );
}

export const useOrganization = () => useContext(OrganizationContext);
