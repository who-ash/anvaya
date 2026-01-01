'use client';

import { trpc } from '@/providers/trpc-provider';
import { Skeleton } from '@/components/ui/skeleton';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from 'recharts';

const COLORS = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#a855f7', // purple
    '#f97316', // orange
    '#ef4444', // red
    '#06b6d4', // cyan
    '#f59e0b', // amber
    '#ec4899', // pink
];

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
        return `${minutes}m`;
    }
    return `${hours}h ${minutes}m`;
}

export function ProjectTimeChart() {
    const { data: projectBreakdown, isLoading } =
        trpc.timeTracking.getProjectTimeBreakdown.useQuery();

    if (isLoading) {
        return (
            <div className="flex h-[300px] items-center justify-center">
                <Skeleton className="h-48 w-48 rounded-full" />
            </div>
        );
    }

    if (!projectBreakdown || projectBreakdown.length === 0) {
        return (
            <div className="flex h-[300px] flex-col items-center justify-center">
                <p className="text-muted-foreground text-sm">
                    No project data yet
                </p>
            </div>
        );
    }

    const chartData = projectBreakdown
        .filter((p) => p.totalSeconds > 0)
        .map((project, index) => ({
            name: project.projectName || 'No Project',
            value: project.totalSeconds,
            hours: formatDuration(project.totalSeconds),
            color: COLORS[index % COLORS.length],
        }));

    const totalSeconds = chartData.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                            `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) =>
                            formatDuration(Number(value) || 0)
                        }
                        labelFormatter={(name) => `Project: ${name}`}
                    />
                    <Legend
                        formatter={(value, entry: any) => (
                            <span className="text-sm">
                                {value} ({formatDuration(entry.payload.value)})
                            </span>
                        )}
                    />
                </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
                <p className="text-muted-foreground text-sm">
                    Total:{' '}
                    <span className="font-semibold">
                        {formatDuration(totalSeconds)}
                    </span>
                </p>
            </div>
        </div>
    );
}
