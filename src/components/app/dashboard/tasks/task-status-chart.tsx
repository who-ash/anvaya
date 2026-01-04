'use client';

import {
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { PieChart as PieChartIcon } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    done: '#22c55e',
    'in-progress': '#3b82f6',
    'on-hold': '#f59e0b',
    'in-review': '#a855f7',
    todo: '#94a3b8',
    rejected: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
    done: 'Done',
    'in-progress': 'In Progress',
    'on-hold': 'On Hold',
    'in-review': 'In Review',
    todo: 'To Do',
    rejected: 'Rejected',
};

interface TaskStatusChartProps {
    data: {
        status: string;
        value: number;
    }[];
}

export function TaskStatusChart({ data }: TaskStatusChartProps) {
    const router = useRouter();

    const chartData = data.map((item) => ({
        ...item,
        name: STATUS_LABELS[item.status] || item.status,
        color: STATUS_COLORS[item.status] || '#94a3b8',
    }));

    const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

    if (chartData.length === 0 || totalValue === 0) {
        return (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center space-y-2 text-sm">
                <div className="bg-muted/30 rounded-full p-4">
                    <PieChartIcon className="h-8 w-8 opacity-20" />
                </div>
                <p>No tasks yet for this period</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        className="cursor-pointer"
                        onClick={(data: any) =>
                            router.push(
                                `/dashboard/tasks?status=${data.status}`,
                            )
                        }
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                className="transition-opacity hover:opacity-80"
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'var(--card)',
                            borderColor: 'var(--border)',
                        }}
                        itemStyle={{ color: 'var(--foreground)' }}
                        formatter={(value: any) =>
                            [value, 'Tasks'] as [any, any]
                        }
                    />
                    <Legend
                        formatter={(value) => (
                            <span className="text-xs font-medium">{value}</span>
                        )}
                    />
                </RechartsPieChart>
            </ResponsiveContainer>
        </div>
    );
}
