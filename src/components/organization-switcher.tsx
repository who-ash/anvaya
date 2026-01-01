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

export function OrganizationSwitcher({
    organizations,
}: {
    organizations: {
        name: string;
        logo: React.ElementType;
        plan: string;
    }[];
}) {
    const { isMobile } = useSidebar();
    const [activeOrg, setActiveOrg] = React.useState(organizations[0]);

    React.useEffect(() => {
        if (organizations.length > 0 && !activeOrg) {
            setActiveOrg(organizations[0]);
        }
    }, [organizations, activeOrg]);

    if (!activeOrg) {
        return null;
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
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
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? 'bottom' : 'right'}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                            Organizations
                        </DropdownMenuLabel>
                        {organizations.map((org, index) => (
                            <DropdownMenuItem
                                key={org.name}
                                onClick={() => setActiveOrg(org)}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border">
                                    <org.logo className="size-3.5 shrink-0" />
                                </div>
                                {org.name}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
