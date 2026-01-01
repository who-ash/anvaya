'use client';

import * as React from 'react';
import {
    AudioWaveform,
    BookOpen,
    Bot,
    Command,
    Frame,
    GalleryVerticalEnd,
    Map,
    PieChart,
    Settings2,
    SquareTerminal,
    Building2,
    Folder,
    MessageSquare,
    LayoutDashboard,
    Zap,
    Clock,
    CircleAlert,
    FileText,
    Video,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { OrganizationSwitcher } from '@/components/organization-switcher';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/providers/trpc-provider';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { data: orgs, isLoading: isLoadingOrgs } =
        trpc.organization.getUserOrganizations.useQuery();

    const teams =
        orgs?.map((org) => ({
            name: org.name,
            logo: Building2,
            plan: org.type,
        })) || [];

    const navMain = [
        {
            title: 'Projects',
            url: '/dashboard/projects',
            icon: Folder,
        },
        {
            title: 'Sprints',
            url: '/dashboard/sprints',
            icon: Zap,
        },
        {
            title: 'Chats',
            url: '/dashboard/chats',
            icon: MessageSquare,
        },
        {
            title: 'Time tracking',
            url: '/dashboard/time-tracking',
            icon: Clock,
        },
        {
            title: 'Issues',
            url: '/dashboard/issues',
            icon: CircleAlert,
        },
        {
            title: 'Report',
            url: '/dashboard/reports',
            icon: FileText,
        },
        {
            title: 'Board Room',
            url: '/dashboard/meet',
            icon: Video,
        },

        {
            title: 'GPT',
            url: '/dashboard/gpt',
            icon: Bot,
        },
    ];

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                {isLoadingOrgs ? (
                    <div className="flex items-center gap-2 p-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                        </div>
                    </div>
                ) : (
                    <OrganizationSwitcher organizations={teams} />
                )}
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
