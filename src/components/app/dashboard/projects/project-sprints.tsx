'use client';

import { useState } from 'react';
import { SprintList } from '@/components/app/dashboard/sprints/sprint-list';
import { trpc } from '@/providers/trpc-provider';

interface ProjectSprintsProps {
    projectId: number;
    organizationId: number;
}

export function ProjectSprints({
    projectId,
    organizationId,
}: ProjectSprintsProps) {
    const [statuses, setStatuses] = useState<string[]>([]);

    // We still need the projects list for filters if we want to allow filtering by project
    // but here it's fixed to one project.
    const { data: projectsData } = trpc.project.search.useQuery({
        organizationId,
        limit: 100,
    });
    const projects = projectsData?.data || [];

    return (
        <SprintList
            projectIds={[projectId]}
            setProjectIds={() => {}} // Disabled for project-specific view
            statuses={statuses}
            setStatuses={setStatuses}
            projects={projects}
            organizationId={organizationId}
            hideProjectFilter={true}
        />
    );
}
