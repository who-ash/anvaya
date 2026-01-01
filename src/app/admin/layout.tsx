'use client';

import { AdminSidebar } from '@/components/admin-sidebar';
import {
    SidebarProvider,
    SidebarInset,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import { useSession } from '@/server/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Separator } from '@/components/ui/separator';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!isPending && !session) {
            router.push('/auth/login');
            return;
        }

        // Redirect to home if not admin
        if (!isPending && session && session.user.role !== 'admin') {
            router.push('/');
        }
    }, [session, isPending, router]);

    // Show loading state while checking authentication
    if (isPending) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // Show nothing while redirecting
    if (!session || session.user.role !== 'admin') {
        return null;
    }

    return (
        <SidebarProvider>
            <AdminSidebar />
            <SidebarInset>{children}</SidebarInset>
        </SidebarProvider>
    );
}
