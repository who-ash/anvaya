'use client';

import { useState, useEffect } from 'react';
import { SprintList } from '@/components/app/dashboard/sprints/sprint-list';
import { trpc } from '@/providers/trpc-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganization } from '@/providers/organization-provider';
import { CreateSprintDialog } from '@/components/app/dashboard/sprints/create-sprint-dialog';
import { Can } from '@/providers/ability-provider';
import { Zap } from 'lucide-react';
import { SprintFilters } from '@/components/app/dashboard/sprints/sprint-filters';

export default function SprintsPage() {
    const { activeOrgId, isLoading: isLoadingOrg } = useOrganization();
    const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const { data: projects, isLoading: isLoadingProjects } =
        trpc.project.search.useQuery(
            { organizationId: activeOrgId!, limit: 100 },
            { enabled: !!activeOrgId },
        );

    const [initialized, setInitialized] = useState(false);

    // Start with empty project selection to show all sprints as requested
    useEffect(() => {
        if (!initialized && projects?.data) {
            setInitialized(true);
        }
    }, [projects, initialized]);

    if (isLoadingOrg || isLoadingProjects) {
        return (
            <div className="flex flex-col gap-6">
                <div>
                    <Skeleton className="mb-2 h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-64" />
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!activeOrgId) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">No Organization Found</h2>
                <p className="text-muted-foreground">
                    You need to be a member of an organization to manage
                    sprints.
                </p>
            </div>
        );
    }

    const projectList = projects?.data || [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Sprints
                    </h1>
                    <p className="text-muted-foreground">
                        Manage development cycles and sprint goals.
                    </p>
                </div>
            </div>

            <SprintList
                projectIds={selectedProjectIds}
                setProjectIds={setSelectedProjectIds}
                statuses={selectedStatuses}
                setStatuses={setSelectedStatuses}
                projects={projectList}
                organizationId={activeOrgId}
            />
        </div>
    );
}
