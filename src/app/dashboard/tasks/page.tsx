'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { TaskList } from '@/components/app/dashboard/tasks/task-list';
import { trpc } from '@/providers/trpc-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganization } from '@/providers/organization-provider';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';

function TasksContent() {
    const searchParams = useSearchParams();
    const { activeOrgId, isLoading: isLoadingOrg } = useOrganization();

    // Initialize state from search parameters
    const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>(
        () => {
            const projectId = searchParams.get('projectId');
            return projectId ? [parseInt(projectId)] : [];
        },
    );
    const [selectedSprintIds, setSelectedSprintIds] = useState<number[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(() => {
        const status = searchParams.get('status');
        return status ? [status] : [];
    });

    // Update state if search params change
    useEffect(() => {
        const status = searchParams.get('status');
        if (status) {
            setSelectedStatuses([status]);
        }
        const projectId = searchParams.get('projectId');
        if (projectId) {
            setSelectedProjectIds([parseInt(projectId)]);
        }
    }, [searchParams]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const { data: projects, isLoading: isLoadingProjects } =
        trpc.project.search.useQuery(
            { organizationId: activeOrgId!, limit: 100 },
            { enabled: !!activeOrgId },
        );

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
                    You need to be a member of an organization to manage tasks.
                </p>
            </div>
        );
    }

    const projectList = projects?.data || [];

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground">
                        Manage and track project tasks.
                    </p>
                </div>
            </div>

            <TaskList
                projectIds={selectedProjectIds}
                setProjectIds={setSelectedProjectIds}
                sprintIds={selectedSprintIds}
                setSprintIds={setSelectedSprintIds}
                statuses={selectedStatuses}
                setStatuses={setSelectedStatuses}
                projects={projectList}
                organizationId={activeOrgId}
            />
        </div>
    );
}

export default function TasksPage() {
    return (
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <TasksContent />
        </Suspense>
    );
}
