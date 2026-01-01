'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Users,
    Settings,
    BarChart3,
    Shield,
    Database,
    BookOpen,
    Command,
    LifeBuoy,
    Send,
    Building2,
    Focus,
    Home,
    Infinity,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
} from '@/components/ui/sidebar';

export function AdminSidebar({
    ...props
}: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();

    const navItems = [
        {
            title: 'Users',
            url: '/admin/users',
            icon: Users,
            isActive: pathname?.startsWith('/admin/users'),
        },
        {
            title: 'Organizations',
            url: '/admin/organizations',
            icon: Building2,
            isActive: pathname?.startsWith('/admin/organizations'),
        },
    ];

    return (
        <Sidebar variant="inset" collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    {/* Expanded state - Logo with text and trigger */}
                    <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
                        <div className="flex items-center gap-2">
                            <SidebarMenuButton
                                size="lg"
                                asChild
                                className="flex-1"
                            >
                                <Link href="/admin">
                                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                        <Infinity className="size-5 rotate-135" />
                                    </div>
                                    <div className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">
                                            Anvaya
                                        </span>
                                        <span className="text-muted-foreground truncate text-xs">
                                            Admin Panel
                                        </span>
                                    </div>
                                </Link>
                            </SidebarMenuButton>
                            <SidebarTrigger />
                        </div>
                    </SidebarMenuItem>
                    {/* Collapsed state - Trigger */}
                    <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
                        <SidebarTrigger className="mx-auto" />
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navItems} />
                {/* <NavSecondary items={adminData.navSecondary} className="mt-auto" /> */}
            </SidebarContent>
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
