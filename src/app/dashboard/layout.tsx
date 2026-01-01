'use client';

import * as React from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';
import { trpc } from '@/providers/trpc-provider';

const BreadcrumbLabel = ({
    label,
    part,
    parentPart,
}: {
    label: string;
    part: string;
    parentPart: string | null;
}) => {
    const isId = !isNaN(Number(part));

    // Fetch project by ID
    const { data: project } = trpc.project.getById.useQuery(
        { id: Number(part) },
        { enabled: isId && parentPart === 'projects' },
    );

    // Fetch sprint by ID
    const { data: sprint } = trpc.sprint.getById.useQuery(
        { id: Number(part) },
        { enabled: isId && parentPart === 'sprints' },
    );

    // Fetch task by ID
    const { data: task } = trpc.task.getById.useQuery(
        { id: Number(part) },
        { enabled: isId && parentPart === 'tasks' },
    );

    if (isId) {
        if (parentPart === 'projects' && project)
            return <span>{project.name}</span>;
        if (parentPart === 'sprints' && sprint)
            return <span>{sprint.name}</span>;
        if (parentPart === 'tasks' && task) return <span>{task.name}</span>;
        return <span>Loading...</span>;
    }

    return <span>{label}</span>;
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const pathParts = pathname.split('/').filter(Boolean);

    const getBreadcrumbs = () => {
        const breadcrumbs = [];
        let currentPath = '';

        // Add Dashboard root
        breadcrumbs.push({
            label: 'Dashboard',
            href: '/dashboard',
            active: pathParts.length === 1,
            part: 'dashboard',
            parentPart: null,
        });

        for (let i = 1; i < pathParts.length; i++) {
            const part = pathParts[i];
            const parentPart = pathParts[i - 1] || null;
            currentPath += `/${part}`;

            let label =
                part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');

            breadcrumbs.push({
                label,
                href: `/dashboard${currentPath}`,
                active: i === pathParts.length - 1,
                part,
                parentPart,
            });
        }
        return breadcrumbs;
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                {breadcrumbs.map((bc, index) => (
                                    <React.Fragment key={bc.href}>
                                        <BreadcrumbItem>
                                            {bc.active ? (
                                                <BreadcrumbPage>
                                                    <BreadcrumbLabel
                                                        label={bc.label}
                                                        part={bc.part}
                                                        parentPart={
                                                            bc.parentPart
                                                        }
                                                    />
                                                </BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink href={bc.href}>
                                                    <BreadcrumbLabel
                                                        label={bc.label}
                                                        part={bc.part}
                                                        parentPart={
                                                            bc.parentPart
                                                        }
                                                    />
                                                </BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                        {index < breadcrumbs.length - 1 && (
                                            <BreadcrumbSeparator />
                                        )}
                                    </React.Fragment>
                                ))}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}
