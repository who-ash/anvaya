'use client';

import { trpc } from '@/providers/trpc-provider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useOrganization } from '@/providers/organization-provider';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card';
import { StatsCard } from '@/components/ui/stats-card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Briefcase,
    Layers,
    CheckSquare,
    Clock,
    Calendar,
    ArrowUpRight,
    MoreHorizontal,
    MessageSquare,
    AlertCircle,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    Legend,
} from 'recharts';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TiptapViewer from '@/components/app/tiptap/tiptap-viewer';
import { TaskStatusChart } from '@/components/app/dashboard/tasks/task-status-chart';

const TASK_STATUS_COLORS: Record<string, string> = {
    todo: '#94a3b8',
    'in-progress': '#3b82f6',
    done: '#22c55e',
    'on-hold': '#64748b',
    'in-review': '#a855f7',
    rejected: '#f43f5e',
};

const PROJECT_STATUS_COLORS: Record<string, string> = {
    active: '#3b82f6',
    completed: '#22c55e',
    inactive: '#94a3b8',
};

function formatDuration(seconds: number | undefined | null): string {
    if (seconds === undefined || seconds === null || isNaN(seconds))
        return '0m';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

const formatDate = (date: Date | string | undefined | null) => {
    if (!date) return 'N/A';
    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'N/A';
        const day = d.getDate();
        const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${month} ${year} ${hours}:${minutes}`;
    } catch (e) {
        return 'N/A';
    }
};

export default function DashboardPage() {
    const router = useRouter();
    const { activeOrgId } = useOrganization();
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>(
        '30d',
    );

    const { data: analytics, isLoading } =
        trpc.dashboard.getDashboardAnalytics.useQuery(
            {
                timeRange,
                organizationId: activeOrgId ?? undefined,
            },
            {
                enabled: activeOrgId !== null,
            },
        );

    if (isLoading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-32 w-full" />
                    ))}
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                    <Skeleton className="h-[400px] md:col-span-4" />
                    <Skeleton className="h-[400px] md:col-span-3" />
                </div>
            </div>
        );
    }

    const taskDistributionData = analytics?.taskStats
        ? [
              { status: 'todo', value: analytics.taskStats.todo },
              { status: 'in-progress', value: analytics.taskStats.inProgress },
              { status: 'in-review', value: analytics.taskStats.inReview },
              { status: 'done', value: analytics.taskStats.done },
              { status: 'on-hold', value: analytics.taskStats.onHold },
              { status: 'rejected', value: analytics.taskStats.rejected },
          ]
        : [];

    const projectBarData = analytics?.projectStats
        ? [
              {
                  name: 'Active',
                  value: analytics.projectStats.active,
                  color: PROJECT_STATUS_COLORS['active'],
              },
              {
                  name: 'Completed',
                  value: analytics.projectStats.completed,
                  color: PROJECT_STATUS_COLORS['completed'],
              },
              {
                  name: 'Inactive',
                  value: analytics.projectStats.inactive,
                  color: PROJECT_STATUS_COLORS['inactive'],
              },
          ]
        : [];

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                    Dashboard Overview
                </h2>
                <div className="flex items-center space-x-2">
                    <Select
                        value={timeRange}
                        onValueChange={(v: any) => setTimeRange(v)}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="all">All time</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Active Projects"
                    value={analytics?.projectStats?.active ?? 0}
                    icon={Briefcase}
                    period="Currently in progress"
                    iconColor="text-blue-500"
                    onClick={() => router.push('/dashboard/projects')}
                />
                <StatsCard
                    title="Active Sprints"
                    value={analytics?.sprintStats?.active ?? 0}
                    icon={Layers}
                    period="Active across projects"
                    iconColor="text-purple-500"
                    onClick={() => router.push('/dashboard/sprints')}
                />
                <StatsCard
                    title="Pending Tasks"
                    value={
                        (analytics?.taskStats?.todo ?? 0) +
                        (analytics?.taskStats?.inProgress ?? 0)
                    }
                    icon={CheckSquare}
                    period="Need attention"
                    iconColor="text-amber-500"
                    onClick={() => router.push('/dashboard/tasks')}
                />
                <StatsCard
                    title="Total Requests"
                    value={analytics?.recentRequests?.length ?? 0}
                    icon={AlertCircle}
                    period="Involved in"
                    iconColor="text-rose-500"
                    onClick={() => router.push('/dashboard/requests')}
                />
            </div>

            <div className="grid h-fit gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="h-full md:col-span-4">
                    <CardHeader>
                        <CardTitle>Time Tracking Analytics</CardTitle>
                        <CardDescription>
                            Total hours tracked per day in the selected period.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[350px]">
                            {analytics?.timeAnalytics &&
                            analytics.timeAnalytics.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={analytics?.timeAnalytics}
                                        onClick={() =>
                                            router.push(
                                                '/dashboard/time-tracking',
                                            )
                                        }
                                        className="cursor-pointer"
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="date"
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(date) =>
                                                new Date(
                                                    date,
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        month: 'short',
                                                        day: 'numeric',
                                                    },
                                                )
                                            }
                                        />
                                        <YAxis
                                            stroke="#888888"
                                            fontSize={12}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) =>
                                                `${Math.round(value / 3600)}h`
                                            }
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--card)',
                                                borderColor: 'var(--border)',
                                            }}
                                            labelStyle={{
                                                color: 'var(--foreground)',
                                            }}
                                            formatter={(value: any) => [
                                                formatDuration(value),
                                                'Time Tracked',
                                            ]}
                                            labelFormatter={(label) =>
                                                formatDate(label)
                                            }
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="duration"
                                            stroke="hsl(var(--primary))"
                                            strokeWidth={2}
                                            dot={{
                                                r: 4,
                                                fill: 'hsl(var(--primary))',
                                            }}
                                            activeDot={{ r: 6 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-muted-foreground flex h-full flex-col items-center justify-center space-y-2 text-sm">
                                    <Clock className="h-8 w-8 opacity-20" />
                                    <p>No time entries yet for this period</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-full md:col-span-3">
                    <CardHeader>
                        <CardTitle>Task Distribution</CardTitle>
                        <CardDescription>
                            Overview of tasks by their current status.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <TaskStatusChart data={taskDistributionData} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid h-fit gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="h-full md:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Projects</CardTitle>
                        <CardDescription>
                            Your most recently updated projects.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="scrollbar-thin max-h-[400px] space-y-4 overflow-y-auto pr-2">
                            {analytics?.recentProjects &&
                            analytics.recentProjects.length > 0 ? (
                                analytics.recentProjects.map((project: any) => (
                                    <div
                                        key={project.id}
                                        className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-2 transition-colors"
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/projects/${project.id}`,
                                            )
                                        }
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                                                <Briefcase className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-0.5">
                                                <p className="truncate text-sm font-medium">
                                                    {project.name}
                                                </p>
                                                <div className="text-muted-foreground line-clamp-1 overflow-hidden text-[10px]">
                                                    <TiptapViewer
                                                        content={
                                                            project.description ||
                                                            'No description'
                                                        }
                                                        className="preview-only prose-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="text-muted-foreground hover:text-primary h-4 w-4" />
                                    </div>
                                ))
                            ) : (
                                <div className="text-muted-foreground flex h-[200px] flex-col items-center justify-center text-sm">
                                    <p>No projects yet</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="h-full md:col-span-4">
                    <CardHeader>
                        <CardTitle>Mentioned Requests</CardTitle>
                        <CardDescription>
                            Requests where you are mentioned or assigned.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="scrollbar-thin max-h-[400px] space-y-8 overflow-y-auto pr-2">
                            {analytics?.recentRequests &&
                            analytics.recentRequests.length > 0 ? (
                                analytics.recentRequests.map((request) => (
                                    <div
                                        key={request.id}
                                        className="hover:bg-muted/50 flex cursor-pointer items-center rounded-lg border p-2 transition-colors"
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/requests/${request.id}`,
                                            )
                                        }
                                    >
                                        <div className="ml-4 flex-1 space-y-1">
                                            <p className="text-sm leading-none font-medium">
                                                {request.title}
                                            </p>
                                            <p className="text-muted-foreground text-sm">
                                                {formatDate(request.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                variant={
                                                    request.priority ===
                                                    'critical'
                                                        ? 'destructive'
                                                        : request.priority ===
                                                            'high'
                                                          ? 'destructive'
                                                          : 'outline'
                                                }
                                            >
                                                {request.priority}
                                            </Badge>
                                            <Badge variant="secondary">
                                                {request.status}
                                            </Badge>
                                            <ArrowUpRight className="text-muted-foreground hover:text-primary h-4 w-4" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-muted-foreground flex h-[200px] flex-col items-center justify-center">
                                    <MessageSquare className="mb-2 h-8 w-8 opacity-20" />
                                    <p>No mentions yet</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="md:col-span-7">
                    <CardHeader>
                        <CardTitle>
                            Resource Allocation / Time-Intensive Tasks
                        </CardTitle>
                        <CardDescription>
                            Tasks where you've spent the most time in the
                            selected period.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="scrollbar-thin max-h-[500px] space-y-4 overflow-y-auto pr-2">
                            {analytics?.taskTimeBreakdown &&
                            analytics.taskTimeBreakdown.length > 0 ? (
                                analytics.taskTimeBreakdown.map((item: any) => (
                                    <div
                                        key={item.taskId}
                                        className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                                        onClick={() =>
                                            router.push(
                                                `/dashboard/tasks/${item.taskId}`,
                                            )
                                        }
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                                                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm leading-none font-medium">
                                                    {item.taskName}
                                                </p>
                                                <p className="text-muted-foreground text-xs">
                                                    Project Task
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-sm font-bold">
                                                    {formatDuration(
                                                        item.totalDuration,
                                                    )}
                                                </p>
                                                <div className="bg-muted mt-1 h-2 w-32 overflow-hidden rounded-full">
                                                    <div
                                                        className="bg-primary h-full"
                                                        style={{
                                                            width:
                                                                analytics
                                                                    .taskTimeBreakdown[0]
                                                                    ?.totalDuration >
                                                                0
                                                                    ? `${Math.min(100, (item.totalDuration / analytics.taskTimeBreakdown[0].totalDuration) * 100)}%`
                                                                    : '0%',
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <ArrowUpRight className="text-muted-foreground hover:text-primary h-4 w-4" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-muted-foreground flex h-[200px] flex-col items-center justify-center space-y-2 text-sm">
                                    <Layers className="h-8 w-8 opacity-20" />
                                    <p>
                                        No task time data available for this
                                        period
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
