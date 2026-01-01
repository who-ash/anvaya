'use client';

import { trpc } from '@/providers/trpc-provider';
import { Skeleton } from '@/components/ui/skeleton';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { format, startOfWeek, addDays } from 'date-fns';

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
        return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
}

export function WeeklyHoursChart() {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 });

    const { data: weeklyHours, isLoading } =
        trpc.timeTracking.getWeeklyHours.useQuery({ weekStart });

    if (isLoading) {
        return (
            <div className="flex h-[300px] items-center justify-center">
                <Skeleton className="h-full w-full" />
            </div>
        );
    }

    // Create data for all 7 days of the week
    const days = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const entry = weeklyHours?.find((h) => h.date === dateStr);

        return {
            day: format(date, 'EEE'),
            date: format(date, 'MMM d'),
            hours: entry ? entry.totalSeconds / 3600 : 0,
            seconds: entry?.totalSeconds || 0,
        };
    });

    const totalSeconds = days.reduce((acc, curr) => acc + curr.seconds, 0);

    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days}>
                    <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-muted"
                    />
                    <XAxis
                        dataKey="day"
                        className="text-muted-foreground text-xs"
                        tick={{ fill: 'currentColor' }}
                    />
                    <YAxis
                        className="text-muted-foreground text-xs"
                        tick={{ fill: 'currentColor' }}
                        tickFormatter={(value) => `${value}h`}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-popover text-popover-foreground rounded-lg border p-2 shadow-md">
                                        <p className="font-medium">
                                            {data.date}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            {formatDuration(data.seconds)}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar
                        dataKey="hours"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
                <p className="text-muted-foreground text-sm">
                    Weekly Total:{' '}
                    <span className="font-semibold">
                        {formatDuration(totalSeconds)}
                    </span>
                </p>
            </div>
        </div>
    );
}
