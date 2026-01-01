'use client';

import { useState } from 'react';
import {
    BadgeCheck,
    Bell,
    ChevronsUpDown,
    CreditCard,
    LogOut,
    Loader2,
    Sparkles,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { authClient, useSession } from '@/server/auth/client';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function NavUser({
    user,
}: {
    user?: {
        name: string;
        email: string;
        image?: string | null;
    };
}) {
    const { isMobile } = useSidebar();
    const { data: session } = useSession();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Use session data if available, otherwise fall back to prop
    const displayUser = session?.user ||
        user || {
            name: 'Guest',
            email: 'guest@example.com',
            image: undefined,
        };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await authClient.signOut();
            toast.success('Logged out successfully!');
            router.push('/auth/login');
        } catch (error) {
            toast.error('Failed to logout. Please try again.');
            console.error('Logout error:', error);
            setIsLoggingOut(false);
        }
    };

    // Get initials for avatar fallback
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                <AvatarImage
                                    src={displayUser.image || undefined}
                                    alt={displayUser.name}
                                />
                                <AvatarFallback className="rounded-lg">
                                    {getInitials(displayUser.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {displayUser.name}
                                </span>
                                <span className="truncate text-xs">
                                    {displayUser.email}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? 'bottom' : 'right'}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    <AvatarImage
                                        src={displayUser.image || undefined}
                                        alt={displayUser.name}
                                    />
                                    <AvatarFallback className="rounded-lg">
                                        {getInitials(displayUser.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {displayUser.name}
                                    </span>
                                    <span className="truncate text-xs">
                                        {displayUser.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className="hover:bg-red-500/10 hover:text-red-600 focus:bg-red-500/10 focus:text-red-600"
                        >
                            {isLoggingOut ? (
                                <Loader2 className="animate-spin" />
                            ) : (
                                <LogOut />
                            )}
                            {isLoggingOut ? 'Logging out...' : 'Log out'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
