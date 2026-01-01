'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock, CalendarDays, TrendingUp, Target } from 'lucide-react';
import { trpc } from '@/providers/trpc-provider';
import { Skeleton } from '@/components/ui/skeleton';

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
        return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
}

export function TimeSummaryCards() {
    const { data: todayTime, isLoading: isLoadingToday } =
        trpc.timeTracking.getTodayTime.useQuery();
    const { data: weekTime, isLoading: isLoadingWeek } =
        trpc.timeTracking.getWeekTime.useQuery();
    const { data: monthTime, isLoading: isLoadingMonth } =
        trpc.timeTracking.getMonthTime.useQuery();

    const isLoading = isLoadingToday || isLoadingWeek || isLoadingMonth;

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <Skeleton className="mb-2 h-4 w-24" />
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: 'Today',
            icon: Clock,
            value: formatDuration(todayTime?.totalSeconds || 0),
            subtitle:
                todayTime?.activeSeconds && todayTime.activeSeconds > 0
                    ? 'Timer running'
                    : 'Tracked time',
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/10',
        },
        {
            title: 'This Week',
            icon: CalendarDays,
            value: formatDuration(weekTime || 0),
            subtitle: 'Total hours',
            color: 'text-green-500',
            bgColor: 'bg-green-500/10',
        },
        {
            title: 'This Month',
            icon: TrendingUp,
            value: formatDuration(monthTime || 0),
            subtitle: 'Monthly total',
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/10',
        },
        {
            title: 'Productivity Score',
            icon: Target,
            value: '—',
            subtitle: 'Coming soon',
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/10',
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
                <Card key={card.title}>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">
                                    {card.title}
                                </p>
                                <p className="text-2xl font-bold">
                                    {card.value}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {card.subtitle}
                                </p>
                            </div>
                            <div className={`rounded-full p-3 ${card.bgColor}`}>
                                <card.icon
                                    className={`h-5 w-5 ${card.color}`}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
