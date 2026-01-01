'use client';

import { Building2, Users, BookOpen, FileText } from 'lucide-react';
import { StatsCard } from '@/components/ui/stats-card';
import { trpc } from '@/providers/trpc-provider';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
    const { data: stats, isLoading } = trpc.admin.getDashboardStats.useQuery(
        undefined,
        {
            refetchOnWindowFocus: false,
        },
    );

    const getMonthName = (month: number) => {
        const months = [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ];
        return months[month];
    };

    if (isLoading) {
        return (
            <main className="flex flex-1 flex-col gap-4 p-2 sm:p-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">
                        Admin Dashboard
                    </h2>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        System overview and statistics
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
            </main>
        );
    }

    return (
        <main className="flex flex-1 flex-col gap-4 p-2 sm:p-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">
                    Admin Dashboard
                </h2>
                <p className="text-muted-foreground text-sm sm:text-base">
                    System overview and statistics
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title={stats?.users.label || 'Total Users'}
                    value={stats?.users.total || 0}
                    icon={Users}
                    period="Lifetime"
                />
                <StatsCard
                    title={stats?.organizations.label || 'Total Organizations'}
                    value={stats?.organizations.total || 0}
                    icon={Building2}
                    period="Lifetime"
                />
            </div>
        </main>
    );
}
