'use client';

import { ProjectList } from '@/components/app/dashboard/projects/project-list';
import { trpc } from '@/providers/trpc-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useOrganization } from '@/providers/organization-provider';

export default function ProjectsPage() {
    const { activeOrgId, isLoading } = useOrganization();
    const { data: orgs } = trpc.organization.getUserOrganizations.useQuery();

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div>
                    <Skeleton className="mb-2 h-10 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }

    if (!activeOrgId) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">No Organization Found</h2>
                <p className="text-muted-foreground">
                    You need to be a member of an organization to manage
                    projects.
                </p>
            </div>
        );
    }

    const currentOrg = orgs?.find((o) => o.id === activeOrgId);

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                <p className="text-muted-foreground">
                    Manage and track your active initiatives in{' '}
                    {currentOrg?.name || 'your organization'}.
                </p>
            </div>
            <ProjectList organizationId={activeOrgId} />
        </div>
    );
}
