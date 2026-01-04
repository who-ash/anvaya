'use client';

import * as React from 'react';
import { ChevronsUpDown, Plus } from 'lucide-react';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useOrganization } from '@/providers/organization-provider';
import { useRouter } from 'next/navigation';

export function OrganizationSwitcher({
    organizations,
}: {
    organizations: {
        id: number;
        name: string;
        logo: React.ElementType;
        plan: string;
    }[];
}) {
    const router = useRouter();
    const { isMobile, state } = useSidebar();
    const { activeOrgId, setActiveOrgId } = useOrganization();

    const activeOrg =
        organizations.find((o) => o.id === activeOrgId) || organizations[0];

    if (!activeOrg && organizations.length > 0) {
        return null;
    }

    if (organizations.length === 0) return null;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    {state === 'expanded' ? (
                        <div className="flex items-center gap-2">
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex-1"
                                onClick={() =>
                                    router.push(
                                        `/dashboard/organizations/${activeOrg.id}`,
                                    )
                                }
                            >
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <activeOrg.logo className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {activeOrg.name}
                                    </span>
                                    <span className="truncate text-xs">
                                        {activeOrg.plan}
                                    </span>
                                </div>
                            </SidebarMenuButton>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton className="w-fit px-2">
                                    <ChevronsUpDown className="size-4" />
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>
                        </div>
                    ) : (
                        <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                size="lg"
                                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                            >
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <activeOrg.logo className="size-4" />
                                </div>
                                <ChevronsUpDown className="ml-auto" />
                            </SidebarMenuButton>
                        </DropdownMenuTrigger>
                    )}
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? 'bottom' : 'right'}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel
                            className="text-muted-foreground hover:text-sidebar-accent-foreground text-xs hover:cursor-pointer"
                            onClick={() =>
                                router.push('/dashboard/organizations')
                            }
                        >
                            My Organizations
                        </DropdownMenuLabel>
                        {organizations.map((org, index) => (
                            <DropdownMenuItem
                                key={org.name}
                                onClick={() => {
                                    setActiveOrgId(org.id);
                                }}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border">
                                    <org.logo className="size-3.5 shrink-0" />
                                </div>
                                {org.name}
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() =>
                                router.push('/dashboard/organizations')
                            }
                            className="gap-2 p-2"
                        >
                            <div className="bg-background text-muted-foreground flex size-6 items-center justify-center rounded-md border">
                                <Plus className="size-4" />
                            </div>
                            <div className="font-medium">My Organizations</div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
