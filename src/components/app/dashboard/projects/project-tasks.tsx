'use client';

import { useState } from 'react';
import { trpc } from '@/providers/trpc-provider';
import { TaskList } from '@/components/app/dashboard/tasks/task-list';

interface ProjectTasksProps {
    projectId: number;
    organizationId: number;
}

export function ProjectTasks({ projectId, organizationId }: ProjectTasksProps) {
    const [projectIds, setProjectIds] = useState<number[]>([projectId]);
    const [sprintIds, setSprintIds] = useState<number[]>([]);
    const [statuses, setStatuses] = useState<string[]>([]);

    const { data: projectsData } = trpc.project.search.useQuery({
        organizationId,
        limit: 100,
    });
    const projects = projectsData?.data || [];

    return (
        <TaskList
            projectIds={projectIds}
            setProjectIds={setProjectIds}
            sprintIds={sprintIds}
            setSprintIds={setSprintIds}
            statuses={statuses}
            setStatuses={setStatuses}
            projects={projects}
            organizationId={organizationId}
            hideProjectFilter={true}
        />
    );
}
